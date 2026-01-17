// src/types/form/auth.request.ts
/**
 * 严格按照 services/auth.ts 中的定义迁移
 */

// 原文件中的 LoginRequest 定义
export interface LoginRequest {
  userId: string    // 用户ID（字符串，后端会转换为Long）
  userPwd: string   // 密码
}

export interface CheckTokenRequest {
  userId: string
  token: string
}

// 原文件中的 RegisterRequest 定义
export interface RegisterRequest {
  userNickname: string    // 昵称（必填）
  userPassword: string    // 密码（必填）
  // 其他字段都是可选的，后端会设置默认值
  userAvatar?: string     // 头像
  userGender?: number     // 性别
  userBirthday?: string   // 生日
  userLocation?: string   // 所在地
  userSignature?: string  // 个性签名
  userPhone?: string      // 手机号
  userEmail?: string      // 邮箱
}

// 注意：原文件中没有其他请求类型定义