// src/stores/auth.ts
import { defineStore } from 'pinia'
// 改为从新位置导入 API 函数
import { loginApi, registerApi } from '@/apis/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem('token') || '',
    user: JSON.parse(sessionStorage.getItem('user') || 'null')
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user
  },
  
  actions: {
    async login(userId: string, userPwd: string) {
      try {
        console.log('🔄 调用后端登录接口...')
        
        // 使用新的 API 函数
        const response = await loginApi({
          userId: userId,
          userPwd: userPwd
        })
        
        console.log('✅ 后端响应:', response)
        
        if (response.code === 200) {
          sessionStorage.setItem('token', response.data.token)
          sessionStorage.setItem('user', JSON.stringify(response.data.user))
          
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
    
    async register(userData: any) {
      try {
        console.log('📤 调用后端注册接口...')
        
        // 使用新的 API 函数
        const response = await registerApi({
          userNickname: userData.userNickname,
          userPassword: userData.userPassword,
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
            userId: response.data
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
          errorMessage = error.response.data?.message || `服务器错误 (${error.response.status})`
        } else if (error.request) {
          errorMessage = '无法连接到服务器，请检查后端是否运行'
        }
        
        return {
          success: false,
          message: errorMessage
        }
      }
    },
    
    logout() {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      this.token = ''
      this.user = null
    }
  }
})