// src/apis/user/index.ts
import service from '../service'
import type { UpdateUserRequest, UpdateUserResponse } from '@/types/dto/user'

// 原有的更新用户信息接口
export function updateUserApi(data: UpdateUserRequest): Promise<UpdateUserResponse> {
  return service({
    url: '/user/updateUserAllAttriByUserId',
    method: 'post',
    data
  })
}

// 原有的获取用户信息接口
export function getUserByIdApi(): Promise<any> {
  return service({
    url: `/user/selectUserByUserId`,
    method: 'get'
  })
}

// // 修改：验证用户密码接口 - 使用JSON格式请求体
// export function checkUserPasswordApi(userPwd: string): Promise<any> {
//   return service({
//     url: '/user/checkUserPwd',
//     method: 'post',
//     data: {  // 使用data字段传递JSON格式请求体
//       userPwd: userPwd
//     }
//   })
// }

// 修改：更新用户密码接口 - 通过cookie自动识别用户
export function updateUserPasswordApi(oldPwd: string, newPwd: string): Promise<any> {
  return service({
    url: '/user/updateUserPwdByOldPwd',
    method: 'post',
    data: {
      oldPwd: oldPwd,
      newPwd: newPwd
    },
    withCredentials: true  // 确保携带cookie
  })
}

// 统一导出
export const userApi = {
  updateUser: updateUserApi,
  getUserById: getUserByIdApi,
  // checkPassword: checkUserPasswordApi,
  updatePassword: updateUserPasswordApi
}

export default userApi