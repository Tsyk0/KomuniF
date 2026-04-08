// src/stores/auth.ts
import { defineStore } from 'pinia'
import { loginApi, checkTokenApi, registerApi } from '@/apis/auth'
import type { User } from '@/entity/user'
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  CheckTokenResponse, 
  RememberMeData 
} from '@/types/dto/auth'


export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem('user') || 'null') as User | null,
    rememberMe: false as boolean
  }),

  getters: {
    isAuthenticated: (state): boolean => {
      return !!state.user
    },

    currentUser: (state): User | null => {
      return state.user
    },

    // 检查是否有记住我的账户
    hasRememberedAccount: (): boolean => {
      return !!localStorage.getItem('rememberMeData')
    }
  },

  actions: {
    /**
     * 正常登录方法
     */
    async login(
      userId: string,
      userPwd: string,
      rememberMe: boolean = false
    ): Promise<{
      success: boolean
      message?: string
      data?: any
    }> {
      try {
        console.log('🔄 调用登录接口...', { userId, rememberMe })

        // 登录前先清理之前的认证状态（解决多账号冲突）
        this.forceClearAuth()

        const loginRequest: LoginRequest = {
          userId: userId,
          userPwd: userPwd,
          rememberMe: rememberMe
        }

        const response = await loginApi(loginRequest) as LoginResponse

        console.log('✅ 后端响应:', response)

        if (response.code === 200) {
          // 0. 保存访问 token（access token）
          const accessToken = response.data.token
          if (accessToken) {
            localStorage.setItem('access_token', accessToken)
            console.log('🔐 已保存访问 token')
          } else {
            console.warn('⚠️ 登录成功但未返回访问 token')
          }

          // 1. 保存用户信息到 sessionStorage
          sessionStorage.setItem('user', JSON.stringify(response.data.user))

          // 2. 更新 store 状态
          this.user = response.data.user
          this.rememberMe = rememberMe

          // 3. 可选：发送一次 checkToken，用于让后端基于 refresh_token 做一次保活
          try {
            await checkTokenApi()
            console.log('✅ 已调用 /user/checkToken 进行会话保活')
          } catch (error) {
            console.warn('⚠️ 调用 /user/checkToken 失败，但不影响本次登录:', error)
          }

          // 4. 根据 rememberMe 处理 localStorage
          if (rememberMe) {
            const rememberMeData: RememberMeData = {
              userId: userId
            }
            localStorage.setItem('rememberMeData', JSON.stringify(rememberMeData))
            console.log('💾 已保存记住我数据')
          } else {
            localStorage.removeItem('rememberMeData')
            console.log('🗑️ 未保存记住我数据')
          }

          return {
            success: true,
            data: response.data
          }
        } else {
          return {
            success: false,
            message: response.message,
          }
        }
      } catch (error: any) {
        console.error('❌ 登录失败:', error)

        let errorMessage = '登录失败'
        if (error.response) {
          errorMessage = error.response.data?.message || '服务器错误'
        } else if (error.request) {
          errorMessage = '无法连接到服务器'
        } else {
          errorMessage = error.message || '登录失败'
        }

        return {
          success: false,
          message: errorMessage
        }
      }
    },

    /**
     * 用户注册
     */
    async register(data: RegisterRequest): Promise<{
      success: boolean
      userId?: number
      message?: string
    }> {
      try {
        const response = await registerApi(data)

        if (response.code === 200 && response.data != null) {
          return {
            success: true,
            userId: response.data
          }
        }

        return {
          success: false,
          message: response.message || '注册失败'
        }
      } catch (error: any) {
        console.error('❌ 注册失败:', error)

        let errorMessage = '注册失败'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.request) {
          errorMessage = '无法连接到服务器'
        } else if (error.message) {
          errorMessage = error.message
        }

        return {
          success: false,
          message: errorMessage
        }
      }
    },

    /**
     * 免密登录（使用记住我的 token）
     */
    async autoLogin(): Promise<{
      success: boolean
      message?: string
      data?: any
    }> {
      try {
        console.group('🔍 [AuthStore.autoLogin] 开始')
        console.log('hasRememberMeData:', !!localStorage.getItem('rememberMeData'))
        console.log('hasAccessTokenBeforeCheck:', !!localStorage.getItem('access_token'))
        console.groupEnd()
        console.log('🚀 尝试免密登录...')

        // 1. 获取记住我数据
        const savedDataStr = localStorage.getItem('rememberMeData')
        if (!savedDataStr) {
          return {
            success: false,
            message: '未找到记住的账户'
          }
        }

        const rememberMeData: RememberMeData = JSON.parse(savedDataStr)
        console.log('🔑 找到记住的账户:', rememberMeData.userId)

        // 2. 调用 checkToken API（需要现有 access token + refresh_token Cookie）
        const response: CheckTokenResponse = await checkTokenApi()
        console.group('🔍 [AuthStore.autoLogin] /auth/sessions/current 响应')
        console.log('code:', response.code)
        console.log('message:', response.message)
        console.log('valid:', response?.data?.valid)
        console.log('refreshed:', response?.data?.refreshed)
        console.log('hasUser:', !!response?.data?.user)
        console.log('hasToken:', !!response?.data?.token)
        console.groupEnd()

        if (response.code === 200) {
          if (response.data.valid && response.data.user) {
            // 如果后端返回了新的 access token，则更新本地
            const newToken = response.data.token
            if (newToken) {
              localStorage.setItem('access_token', newToken)
              console.log('🔐 免密登录：已刷新访问 token')
            }

            // 3. Token有效，直接登录
            this.user = response.data.user  // ✅ 使用checkToken返回的完整user信息
            this.rememberMe = true

            // 4. 保存用户信息到 sessionStorage
            sessionStorage.setItem('user', JSON.stringify(response.data.user))

            console.log('✅ 免密登录成功')

            return {
              success: true,
              data: {
                user: response.data.user,
                fromAutoLogin: true
              }
            }
          } else {
            // Token无效或过期
            localStorage.removeItem('rememberMeData')
            return {
              success: false,
              message: response.message || '登录凭证已过期，请重新登录'
            }
          }
        } else {
          // 非 200 时不立即清除记住我，避免网络抖动导致用户丢失快速登录入口
          return {
            success: false,
            message: response.message || '登录验证失败'
          }
        }
      } catch (error: any) {
        console.error('❌ 免密登录失败:', error)
        console.group('🔍 [AuthStore.autoLogin] 异常详情')
        console.log('status:', error?.response?.status)
        console.log('responseData:', error?.response?.data)
        console.log('hasRememberMeDataAfterError:', !!localStorage.getItem('rememberMeData'))
        console.log('hasAccessTokenAfterError:', !!localStorage.getItem('access_token'))
        console.groupEnd()
        // 仅在明确 401（refresh 也失效）时清理记住我标记
        if (error?.response?.status === 401) {
          localStorage.removeItem('rememberMeData')
        }

        let errorMessage = '免密登录失败'
        if (error.response) {
          errorMessage = error.response.data?.message || '服务器错误'
        } else if (error.request) {
          errorMessage = '无法连接到服务器'
        } else {
          errorMessage = error.message || '网络错误'
        }

        return {
          success: false,
          message: errorMessage
        }
      }
    },

    /**
     * 检查是否可以免密登录
     */
    checkAutoLoginAvailable(currentUserId?: string): boolean {
      const savedDataStr = localStorage.getItem('rememberMeData')
      if (!savedDataStr) return false

      try {
        const rememberMeData: RememberMeData = JSON.parse(savedDataStr)

        // 如果传入了当前用户ID，需要匹配
        if (currentUserId && currentUserId !== rememberMeData.userId) {
          return false
        }

        return true
      } catch {
        localStorage.removeItem('rememberMeData')
        return false
      }
    },

    /**
     * 清除记住我的账户
     */
    clearRememberedAccount(): void {
      localStorage.removeItem('rememberMeData')
      this.rememberMe = false
      console.log('🗑️ 已清除记住的账户')
    },

    /**
     * 强制清理认证状态（用于多账号切换）
     */
    forceClearAuth(): void {
      // 清理所有存储
      this.clearStorage()
      this.clearRememberedAccount()
      
      // 尝试清理cookie（通过发送一个登出请求）
      try {
        // 这里可以调用后端的登出接口来清理服务端session
        console.log('🔄 强制清理认证状态完成')
      } catch (error) {
        console.warn('⚠️ 清理认证状态时出现警告:', error)
      }
    },

    /**
     * 清除所有认证信息
     */
    clearStorage(): void {
      sessionStorage.removeItem('user')
      localStorage.removeItem('access_token')
      this.user = null
      this.rememberMe = false
      console.log('🗑️ 已清除会话存储')
    },

    /**
     * 用户登出
     */
    logout(): void {
      this.clearStorage()
      console.log('👋 用户已登出')
    },

    /**
     * 初始化认证状态
     */
    initAuth(): void {
      console.log('🔄 初始化认证状态...')

      const sessionUser = sessionStorage.getItem('user')

      if (sessionUser) {
        try {
          this.user = JSON.parse(sessionUser)
          this.rememberMe = false
          console.log('✅ 从 sessionStorage 恢复登录状态')
          return
        } catch (error) {
          console.error('解析 sessionStorage 用户数据失败:', error)
          this.clearStorage()
        }
      }

      const hasRememberedAccount = localStorage.getItem('rememberMeData')
      if (hasRememberedAccount) {
        console.log('📋 发现记住的账户，等待用户选择是否免密登录')
      } else {
        console.log('📭 没有存储的登录状态')
      }
    },

    /**
     * 确保当前 access token 可用，并在需要时通过 /user/checkToken 自动续签
     * 返回：
     *  - true：当前（可能已刷新后的）access token 有效
     *  - false：token 无效或刷新失败，需要重新登录
     */
    async ensureAccessTokenValid(): Promise<boolean> {
      const currentToken = localStorage.getItem('access_token')

      try {
        console.group('🔍 [AuthStore.ensureAccessTokenValid] 调用前状态')
        console.log('hasAccessToken:', !!currentToken)
        console.log('hasRememberMeData:', !!localStorage.getItem('rememberMeData'))
        console.groupEnd()

        const response: CheckTokenResponse = await checkTokenApi()
        console.log('🔍 检查 access token 结果:', response)

        if (response.code !== 200 || !response.data) {
          console.warn('ensureAccessTokenValid: 检查失败，code != 200')
          return false
        }

        const { valid, refreshed, token, user } = response.data

        if (valid) {
          // 如果通过 refresh_token 刷新出了新的 access token，则覆盖本地保存
          if (token && (refreshed || token !== currentToken)) {
            localStorage.setItem('access_token', token)
            console.log('🔐 access token 已更新')
          }

          // 如果后端返回了最新的用户信息，同步到本地
          if (user) {
            this.user = user
            sessionStorage.setItem('user', JSON.stringify(user))
          }

          return true
        }

        // valid === false：刷新令牌也过期或其它原因，清理本地状态
        console.warn('ensureAccessTokenValid: token 无效，将清理本地登录状态')
        this.clearStorage()
        this.clearRememberedAccount()
        return false
      } catch (error: any) {
        console.error('ensureAccessTokenValid: 检查 access token 失败:', error)
        console.group('🔍 [AuthStore.ensureAccessTokenValid] 异常详情')
        console.log('status:', error?.response?.status)
        console.log('responseData:', error?.response?.data)
        console.groupEnd()
        // 网络异常等情况下，不强制清除本地状态；仅明确 401 时清理记住我
        if (error?.response?.status === 401) {
          this.clearRememberedAccount()
        }
        return false
      }
    }
  }
})