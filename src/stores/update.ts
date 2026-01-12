// src/stores/update.ts
import { defineStore } from 'pinia'
import { updateUserApi } from '@/apis/user'
import type { UpdateUserRequest } from '@/types/flow/update.request'

export const useUpdateStore = defineStore('update', {
  // 状态 - 保持简单，只记录必要信息
  state: () => ({
    isLoading: false,
    errorMessage: '' as string | null
  }),
  
  // 不需要复杂的 getters
  
  // 动作（方法）- 保持与 auth store 相同的风格
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
        
        // 直接调用 API
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
    }
  }
})