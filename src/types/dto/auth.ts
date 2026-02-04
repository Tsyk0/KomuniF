import type { User } from '@/entity/user'

/**
 * 登录请求
 */
export interface LoginRequest {
  userId: string    // 用户ID（字符串，后端会转换为Long）
  userPwd: string   // 密码
  rememberMe?: boolean // 记住我
}

/**
 * 验证Token请求
 */
export interface CheckTokenRequest {
  userId: string
  token: string
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  userNickname: string    // 昵称（必填）
  userPassword: string    // 密码（必填）
  userAvatar?: string     // 头像
  userGender?: number     // 性别
  userBirthday?: string   // 生日
  userLocation?: string   // 所在地
  userSignature?: string  // 个性签名
  userPhone?: string      // 手机号
  userEmail?: string      // 邮箱
}

/**
 * 登录响应
 */
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

/**
 * 注册响应
 */
export interface RegisterResponse {
  code: number
  message: string
  data?: number  // 返回的 userId
  timestamp?: number
}

/**
 * 验证Token响应
 */
export interface CheckTokenResponse {
  code: number
  message: string
  data: {
    valid: boolean
    userId: string
    user?: User
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

/**
 * 记住我数据结构存储于localstorage
 */
export interface RememberMeData {
  userId: string;
}
