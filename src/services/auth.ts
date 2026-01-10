// 导入我们刚才创建的 api 实例
import api from './api'

// 定义登录请求的数据类型（完全匹配你的后端）
export interface LoginRequest {
  userId: string    // 用户ID（字符串，后端会转换为Long）
  userPwd: string   // 密码
}

// 定义用户数据类型（根据你的 Mapper 和数据库字段）
export interface User {
  userId?: number           // 用户ID
  userNickname?: string     // 用户昵称
  userAvatar?: string       // 头像
  userGender?: number       // 性别
  userBirthday?: string     // 生日
  userLocation?: string     // 所在地
  userSignature?: string    // 个性签名
  userPhone?: string        // 手机号
  userEmail?: string        // 邮箱
  userPassword?: string     // 密码
  userStatus?: number       // 用户状态
  onlineStatus?: number     // 在线状态
  createTime?: string       // 创建时间
  updateTime?: string       // 更新时间
  lastLoginTime?: string    // 最后登录时间
}

// 定义登录响应的数据类型
export interface LoginResponse {
  code: number
  message: string
  data: {
    userId: number
    user: User
    tokenInfo: {
      expiration: string
      issuedAt: string
      expiresInSeconds: number
    }
    token: string
  }
  timestamp: number
}

// 定义注册请求的数据类型（简化版：只需要昵称和密码）
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

// 定义注册响应的数据类型
export interface RegisterResponse {
  code: number
  message: string
  data?: number  // 返回的 userId
  timestamp?: number
}

// 创建认证相关的 API 函数
const authApi = {
  // 登录函数 - 匹配你的 /user/loginCheck
  login(data: LoginRequest): Promise<LoginResponse> {
    return api.post('/user/loginCheck', data)
  },
  
  // 注册函数 - 匹配你的 /user/insertUser
  register(data: RegisterRequest): Promise<RegisterResponse> {
    return api.post('/user/insertUser', data)
  }
}

// 导出
export { authApi }
export default authApi