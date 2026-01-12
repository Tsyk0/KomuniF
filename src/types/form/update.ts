export interface ProfileForm {
  // 基础信息
  userId: number
  userNickname?: string
//   userAvatar?: string
  userGender?: number      // 0-未知, 1-男, 2-女
  userBirthday?: string    // YYYY-MM-DD
  userLocation?: string
  userSignature?: string
  // 联系信息
  userPhone?: string
  userEmail?: string

}