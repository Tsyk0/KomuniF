// src/types/flow/auth.response.ts
import type { User } from '@/entity/user'

/**
 * 严格按照 services/auth.ts 中的定义迁移
 */

// 原文件中的 LoginResponse 定义
export interface LoginResponse {
  code: number
  message: string
  data: {
    userId: number
    user: User
    tokenInfo?: {
      expiration: string
      issuedAt: string
      expiresInSeconds: number
    }
    token?: string
  }
  timestamp: number
}

// 原文件中的 RegisterResponse 定义
export interface RegisterResponse {
  code: number
  message: string
  data?: number  // 返回的 userId
  timestamp?: number
}

// 注意：原文件中没有单独的 ApiResponse 接口定义
// 所以这里也不应该添加

export interface CheckTokenResponse {
  code: number
  message: string
  data: {
    valid: boolean
    userId: string
    user?: User  // 可选，有效时包含用户信息
    tokenInfo?: {
      expiration: string
      issuedAt: string
      expiresInSeconds: number
    }
    remainingSeconds?: number
    originalExpiration?: string
    expiredSecondsAgo?: number
  }
  timestamp: number
}