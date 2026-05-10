/**
 * Komuni 数字 userId → TUICallKit / TIM / TRTC 使用的字符串 userID。
 * 规则：与数据库主键一致，直接转十进制字符串（无 `u` 等前缀），须与后端签发 UserSig、导入 IM 用户时完全一致。
 */
export function komuniUserIdToTrtcUserId(komuniUserId: number): string {
  return String(Math.trunc(Number(komuniUserId)));
}
