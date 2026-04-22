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

/** 执行好友详情加载流程。 */
export async function loadFriendInfoFlow(input: {
  friendId: number | null | undefined;
  loadFriendInfo: (friendId: number) => Promise<unknown>;
}): Promise<void> {
  if (!input.friendId) return;
  await input.loadFriendInfo(input.friendId);
}
