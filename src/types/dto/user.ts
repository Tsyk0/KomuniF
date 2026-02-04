import type { User } from '@/entity/user'

/**
 * 更新用户请求
 */
export type UpdateUserRequest = Partial<Omit<User, 'userId'>> & {
  userId: number  // 用户ID是必填的
}

/**
 * 更新密码请求
 */
export interface UpdatePasswordRequest {
  userId: number
  oldPassword: string
  newPassword: string
}

/**
 * 用户资料表单（前端使用）
 */
export interface ProfileForm {
  // 基础信息
  userId: number
  userNickname?: string
  userGender?: number      // 0-未知, 1-男, 2-女
  userBirthday?: string    // YYYY-MM-DD
  userLocation?: string
  userSignature?: string
  // 联系信息
  userPhone?: string
  userEmail?: string
}

/**
 * 更新用户响应
 */
export interface UpdateUserResponse {
  code: number
  message: string
  data: string
  timestamp: number
}

/**
 * 更新密码响应
 */
export interface UpdatePasswordResponse {
  code: number
  message: string
  data: string
  timestamp: number
}
