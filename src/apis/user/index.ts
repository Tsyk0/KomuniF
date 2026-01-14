// src/apis/user/index.ts
import service from '../service'
import type { UpdateUserRequest } from '@/types/flow/update.request'
import type { UpdateUserResponse } from '@/types/flow/update.response'

// 原有的更新用户信息接口
export function updateUserApi(data: UpdateUserRequest): Promise<UpdateUserResponse> {
  return service({
    url: '/user/updateUserAllAttriByUserId',
    method: 'post',
    data
  })
}

// 原有的获取用户信息接口
export function getUserByIdApi(userId: number): Promise<any> {
  return service({
    url: `/user/selectUserByUserId?userId=${userId}`,
    method: 'get'
  })
}

// 修改：验证用户密码接口 - 使用JSON格式请求体
export function checkUserPasswordApi(userId: number, userPwd: string): Promise<any> {
  return service({
    url: '/user/checkUserPwd',
    method: 'post',
    data: {  // 使用data字段传递JSON格式请求体
      userId: userId, // 根据后端要求，可能需要字符串格式
      userPwd: userPwd
    }
  })
}

// 修改：更新用户密码接口 - 确认正确格式
export function updateUserPasswordApi(userId: number, newPwd: string): Promise<any> {
  return service({
    url: '/user/updateUserPwdByUserId',
    method: 'post',
    params: {  // 使用params传递查询参数
      userId: userId,
      newPwd: newPwd
    }
  })
}

// 统一导出
export const userApi = {
  updateUser: updateUserApi,
  getUserById: getUserByIdApi,
  checkPassword: checkUserPasswordApi,
  updatePassword: updateUserPasswordApi
}

export default userApi