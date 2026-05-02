/**
 * FriendInfoInteraction
 * - 存放 FriendInfo 组件的展示与交互方法。
 * - 负责好友展示名、在线状态文案、性别文案与资料加载流程。
 *
 * 方法目录（方法：功能）
 * - resolveFriendDisplayName：生成好友展示名。
 * - resolveFriendDisplayInitial：生成头像占位首字母。
 * - resolveNormalizedOnlineStatus：规范化在线状态数值。
 * - resolveOnlineStatusText：生成在线状态文案。
 * - resolveOnlineStatusClass：生成在线状态样式类名。
 * - resolveFriendGenderText：生成性别文案。
 * - loadFriendInfoFlow：执行好友详情加载流程。
 */

import type { FriendProfileDTO } from "@/types/dto/friend";

/** 生成好友展示名。 */
export function resolveFriendDisplayName(
  info: FriendProfileDTO | null | undefined
): string {
  if (!info) return "未知用户";
  return info.remarkName || info.friendNickname || "未知用户";
}

/** 生成头像占位首字母。 */
export function resolveFriendDisplayInitial(displayName: string): string {
  return displayName.charAt(0).toUpperCase();
}

/** 规范化在线状态数值。 */
export function resolveNormalizedOnlineStatus(
  rawStatus: number | string | null | undefined
): number {
  const n = typeof rawStatus === "number" ? rawStatus : Number(rawStatus);
  return Number.isFinite(n) ? n : 0;
}

/** 生成在线状态文案。 */
export function resolveOnlineStatusText(status: number): string {
  if (status === 1) return "在线";
  if (status === 2) return "离开";
  return "离线";
}

/** 生成在线状态样式类名。 */
export function resolveOnlineStatusClass(status: number): "online" | "away" | "offline" {
  if (status === 1) return "online";
  if (status === 2) return "away";
  return "offline";
}

/** 生成性别文案。 */
export function resolveFriendGenderText(gender: number | null | undefined): string {
  if (gender === 1) return "男";
  if (gender === 2) return "女";
  return "未知";
}

/**
 * 将生日字符串（如 YYYY-MM-DD）格式化为「M月D日」中文展示；无法解析返回 null。
 * 使用场景：好友资料卡紧凑信息行（生日 + 星座）。
 */
export function formatBirthdayMonthDayCn(
  birthday: string | null | undefined
): string | null {
  if (!birthday || typeof birthday !== "string") return null;
  const parts = birthday.trim().split(/[-/.]/);
  if (parts.length < 3) return null;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${month}月${day}日`;
}

/**
 * 根据公历月日返回中文星座名。
 * 使用场景：与 `formatBirthdayMonthDayCn` 组合展示「10月1日 天秤座」。
 */
export function getZodiacSignCn(month: number, day: number): string {
  const md = month * 100 + day;
  if (md >= 120 && md <= 218) return "水瓶座";
  if (md >= 219 && md <= 320) return "双鱼座";
  if (md >= 321 && md <= 419) return "白羊座";
  if (md >= 420 && md <= 520) return "金牛座";
  if (md >= 521 && md <= 621) return "双子座";
  if (md >= 622 && md <= 722) return "巨蟹座";
  if (md >= 723 && md <= 822) return "狮子座";
  if (md >= 823 && md <= 922) return "处女座";
  if (md >= 923 && md <= 1023) return "天秤座";
  if (md >= 1024 && md <= 1121) return "天蝎座";
  if (md >= 1122 && md <= 1221) return "射手座";
  if (md >= 1222 || md <= 119) return "摩羯座";
  return "摩羯座";
}

/**
 * 从 YYYY-MM-DD 粗略计算周岁；无法解析或未来日期返回 null。
 * 使用场景：资料卡「性别 | 年龄 | …」摘要行。
 */
export function computeAgeYearsFromBirthday(
  birthday: string | null | undefined
): number | null {
  if (!birthday || typeof birthday !== "string") return null;
  const parts = birthday.trim().split(/[-/.]/);
  if (parts.length < 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  if (birth > today) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/** 执行好友详情加载流程。 */
export async function loadFriendInfoFlow(input: {
  friendId: number | null | undefined;
  loadFriendInfo: (friendId: number) => Promise<unknown>;
}): Promise<void> {
  if (!input.friendId) return;
  await input.loadFriendInfo(input.friendId);
}
