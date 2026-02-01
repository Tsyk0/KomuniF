// src/stores/user.ts
import { defineStore } from 'pinia'
import { 
  updateUserApi, 
  getUserByIdApi, 
  checkUserPasswordApi,     // 新增导入
  updateUserPasswordApi     // 新增导入
} from '@/apis/user'
import type { UpdateUserRequest } from '@/types/flow/update.request'

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoading: false,
    errorMessage: '' as string | null
  }),
  
  actions: {
    /**
     * 更新用户信息 - 直接调用后端接口
     * @param {UpdateUserRequest} userData 要更新的用户数据
     * @returns 更新结果
     */
    async updateUser(userData: UpdateUserRequest) {
      try {
        console.log('🔄 更新用户信息...')
        
        this.isLoading = true
        this.errorMessage = null
        
        const response = await updateUserApi(userData)
        
        console.log('✅ 更新响应:', response)
        
        if (response.code === 200) {
          return {
            success: true,
            message: response.data || '更新成功'
          }
        } else {
          this.errorMessage = response.message
          return {
            success: false,
            message: response.message || '更新失败'
          }
        }
      } catch (error: any) {
        console.error('❌ 更新用户信息失败:', error)
        
        let errorMessage = '更新失败'
        if (error.response) {
          errorMessage = error.response.data?.message || `服务器错误`
        } else if (error.request) {
          errorMessage = '无法连接到服务器'
        }
        
        this.errorMessage = errorMessage
        return {
          success: false,
          message: errorMessage
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 根据用户ID获取用户信息
     * @param {number} userId 用户ID
     * @returns 用户信息或null
     */
    async fetchUserById(userId: number) {
      try {
        console.log('🔄 获取用户信息，用户ID:', userId)
        
        this.isLoading = true
        this.errorMessage = null
        
        const response = await getUserByIdApi()
        
        console.log('✅ 获取用户信息响应:', response)
        
        if (response.code === 200) {
          console.log('✅ 获取用户信息成功:', response.data)
          return {
            success: true,
            data: response.data
          }
        } else {
          this.errorMessage = response.message
          console.error('❌ 获取用户信息失败:', response.message)
          return {
            success: false,
            message: response.message || '获取用户信息失败'
          }
        }
      } catch (error: any) {
        console.error('❌ 获取用户信息异常:', error)
        
        let errorMessage = '获取用户信息失败'
        if (error.response) {
          errorMessage = error.response.data?.message || '服务器错误'
        } else if (error.request) {
          errorMessage = '无法连接到服务器'
        }
        
        this.errorMessage = errorMessage
        return {
          success: false,
          message: errorMessage
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 验证用户密码
     * @param {number} userId 用户ID
     * @param {string} userPwd 用户密码
     * @returns 验证结果
     */
    async checkUserPassword(userId: number, userPwd: string) {
      try {
        console.log('🔄 验证用户密码，用户ID:', userId)
        
        this.isLoading = true
        this.errorMessage = null
        
        const response = await checkUserPasswordApi(userId, userPwd)
        
        console.log('✅ 密码验证响应:', response)
        
        if (response.code === 200) {
          return {
            success: true,
            message: response.message || '密码正确'
          }
        } else {
          this.errorMessage = response.message
          return {
            success: false,
            message: response.message || '密码验证失败'
          }
        }
      } catch (error: any) {
        console.error('❌ 密码验证异常:', error)
        
        let errorMessage = '密码验证失败'
        if (error.response) {
          errorMessage = error.response.data?.message || '服务器错误'
        } else if (error.request) {
          errorMessage = '无法连接到服务器'
        }
        
        this.errorMessage = errorMessage
        return {
          success: false,
          message: errorMessage
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 更新用户密码
     * @param {number} userId 用户ID
     * @param {string} newPwd 新密码
     * @returns 更新结果
     */
    async updateUserPassword(userId: number, newPwd: string) {
      try {
        console.log('🔄 更新用户密码，用户ID:', userId)
        
        this.isLoading = true
        this.errorMessage = null
        
        const response = await updateUserPasswordApi(userId, newPwd)
        
        console.log('✅ 密码更新响应:', response)
        
        if (response.code === 200) {
          return {
            success: true,
            message: response.message || '密码更新成功'
          }
        } else {
          this.errorMessage = response.message
          return {
            success: false,
            message: response.message || '密码更新失败'
          }
        }
      } catch (error: any) {
        console.error('❌ 密码更新异常:', error)
        
        let errorMessage = '密码更新失败'
        if (error.response) {
          errorMessage = error.response.data?.message || '服务器错误'
        } else if (error.request) {
          errorMessage = '无法连接到服务器'
        }
        
        this.errorMessage = errorMessage
        return {
          success: false,
          message: errorMessage
        }
      } finally {
        this.isLoading = false
      }
    }
  }
})