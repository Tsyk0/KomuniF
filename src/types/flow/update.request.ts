// src/types/flow/update.request.ts
import type { User } from '@/entity/user'
export type UpdateUserRequest = Partial<Omit<User, 'userId'>> & {
  userId: number  // 用户ID是必填的
}

/**
 * 更新密码请求类型
 */
export interface UpdatePasswordRequest {
  userId: number
  oldPassword: string
  newPassword: string
}