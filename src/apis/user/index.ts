// src/apis/user/index.ts
import service from '../service'
import type { UpdateUserRequest } from '@/types/flow/update.request'
import type { UpdateUserResponse } from '@/types/flow/update.response'

/**
 * 更新用户信息（使用 updateUserAllAttriByUserId 接口）
 * @param {UpdateUserRequest} data 用户更新数据
 * @returns {Promise<UpdateUserResponse>}
 * 
 * @example
 * updateUserApi({
 *   userId: 1,
 *   userNickname: "新昵称",
 *   userPhone: "13800138000"
 * })
 */
export function updateUserApi(data: UpdateUserRequest): Promise<UpdateUserResponse> {
  return service({
    url: '/user/updateUserAllAttriByUserId',
    method: 'post',
    data
  })
}

// 统一导出
export const userApi = {
  updateUser: updateUserApi
}

export default userApi