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

        const loginRequest: LoginRequest = {
          userId: userId,
          userPwd: userPwd,
          rememberMe: rememberMe
        }

        const response = await loginApi(loginRequest) as LoginResponse

        console.log('✅ 后端响应:', response)

        if (response.code === 200) {
          // 1. 保存用户信息到 sessionStorage
          sessionStorage.setItem('user', JSON.stringify(response.data.user))

          // 2. 更新 store 状态
          this.user = response.data.user
          this.rememberMe = rememberMe

          // 3. 根据 rememberMe 处理 localStorage
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

        // 2. 调用 checkToken API（返回完整用户信息）
        const response: CheckTokenResponse = await checkTokenApi(undefined)
        console.log('🔍 Token验证结果:', response)

        if (response.code === 200) {
          if (response.data.valid && response.data.user) {
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
          localStorage.removeItem('rememberMeData')
          return {
            success: false,
            message: response.message || '登录验证失败'
          }
        }
      } catch (error: any) {
        console.error('❌ 免密登录失败:', error)
        localStorage.removeItem('rememberMeData')

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
     * 清除所有认证信息
     */
    clearStorage(): void {
      sessionStorage.removeItem('user')
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
    }
  }
})