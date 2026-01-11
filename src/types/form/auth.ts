// types/auth.ts
// 登录表单数据类型
export interface LoginForm {
  username: string
  password: string
  rememberMe: boolean
}

// 注册表单数据类型
export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  nickname: string
}

// 忘记密码表单数据类型
export interface ForgotPasswordForm {
  email: string
}

// 用户信息类型
export interface User {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  createdAt: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}