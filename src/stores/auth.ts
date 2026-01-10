import { defineStore } from 'pinia'
import { authApi } from '@/services/auth'

export const useAuthStore = defineStore('auth', {
  // 状态 - 改为从 sessionStorage 读取
  state: () => ({
    token: sessionStorage.getItem('token') || '',
    user: JSON.parse(sessionStorage.getItem('user') || 'null')
  }),
  
  // 计算属性
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user
  },
  
  // 动作（方法）
  actions: {
    // 登录方法
    async login(userId: string, userPwd: string) {
      try {
        console.log('🔄 调用后端登录接口...')
        
        // 调用后端 API
        const response = await authApi.login({
          userId: userId,
          userPwd: userPwd
        })
        
        console.log('✅ 后端响应:', response)
        
        if (response.code === 200) {
          // 保存到 sessionStorage（标签页关闭后自动清除）
          sessionStorage.setItem('token', response.data.token)
          sessionStorage.setItem('user', JSON.stringify(response.data.user))
          
          // 更新 store 状态
          this.token = response.data.token
          this.user = response.data.user
          
          return {
            success: true,
            data: response.data
          }
        } else {
          return {
            success: false,
            message: response.message || '登录失败'
          }
        }
        
      } catch (error: any) {
        console.error('❌ 登录失败:', error)
        
        let errorMessage = '登录失败'
        
        if (error.response) {
          errorMessage = error.response.data?.message || `服务器错误`
        } else if (error.request) {
          errorMessage = '无法连接到服务器'
        }
        
        return {
          success: false,
          message: errorMessage
        }
      }
    },
    
      
       // 新增：注册方法
    async register(userData: any) {
      try {
        console.log('📤 调用后端注册接口...')
        console.log('注册数据:', userData)
        
        // 调用后端注册API
        const response = await authApi.register({
          userNickname: userData.userNickname,
          userPassword: userData.userPassword,
          // 可选字段，如果提供了就传递
          userAvatar: userData.userAvatar || null,
          userGender: userData.userGender || 0,
          userBirthday: userData.userBirthday || null,
          userLocation: userData.userLocation || null,
          userSignature: userData.userSignature || null,
          userPhone: userData.userPhone || null,
          userEmail: userData.userEmail || null
        })
        
        console.log('✅ 注册响应:', response)
        
        if (response.code === 200) {
          return {
            success: true,
            message: response.message,
            userId: response.data  // 后端返回的用户ID
          }
        } else {
          return {
            success: false,
            message: response.message || '注册失败'
          }
        }
      } catch (error: any) {
        console.error('❌ 注册失败:', error)
        
        let errorMessage = '注册失败'
        if (error.response) {
          console.log('注册错误响应:', error.response.data)
          errorMessage = error.response.data?.message || `服务器错误 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到服务器，请检查后端是否运行'
        } else {
          errorMessage = '请求配置错误: ' + error.message
        }
        
        return {
          success: false,
          message: errorMessage
        }
      }
    },
    // 登出方法
    logout() {
      // 清除 sessionStorage
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      
      // 清除 store 状态
      this.token = ''
      this.user = null
    }
  }
})