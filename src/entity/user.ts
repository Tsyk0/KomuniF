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

