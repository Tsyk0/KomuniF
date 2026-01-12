// src/types/flow/update.response.ts
/**
 * 更新用户信息响应类型
 */
export interface UpdateUserResponse {
  code: number
  message: string
  data: string  // 响应消息，如"更新成功"
  timestamp: number
}

/**
 * 更新密码响应类型
 */
export interface UpdatePasswordResponse {
  code: number
  message: string
  data: string  // 响应消息
  timestamp: number
}