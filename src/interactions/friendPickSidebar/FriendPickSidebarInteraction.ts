/**
 * FriendPickSidebarInteraction
 * - 存放 FriendPickSidebar 组件的界面交互方法。
 * - 负责好友展示名、头像地址、可选列表过滤等界面逻辑。
 *
 * 方法目录（方法：功能）
 * - resolveFriendDisplayName：生成好友显示名兜底文案。
 * - resolveFriendAvatarUrl：生成好友头像可用地址。
 * - filterSelectableFriends：过滤可选择好友（排除本人）。
 */

import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";

/** 生成好友显示名（displayName > nickname > 默认文案）。 */
export function resolveFriendDisplayName(friend: {
  displayName?: string;
  nickname?: string;
}): string {
  return friend.displayName || friend.nickname || "Unknown user";
}

/** 生成好友头像地址（统一走头像 URL 规范化）。 */
export function resolveFriendAvatarUrl(avatar?: string | null): string {
  return normalizeAvatarUrl(avatar || "");
}

/** 过滤可选好友（排除当前登录用户自己）。 */
export function filterSelectableFriends<T extends { friendId: number }>(
  friends: T[],
  selfUserId: number
): T[] {
  return friends.filter((f) => f.friendId !== selfUserId);
}
