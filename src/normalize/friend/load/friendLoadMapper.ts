// src/normalize/friend/load/friendLoadMapper.ts
import type {
  FriendListItem,
  FriendOnlineStatus,
  FriendProfileDTO,
  FriendSummaryDTO,
} from "@/types/dto/friend";

/** 统一文本清洗，避免 UI 层反复 trim 判空。 */
const normalizeText = (value?: string | null): string => (value || "").trim();

/** 在线状态映射：后端数字 -> 前端展示枚举。 */
function mapOnlineStatus(status?: number | null): FriendOnlineStatus {
  if (status === 1) return "online";
  if (status === 2) return "away";
  return "offline";
}

/**
 * 好友摘要 -> 列表展示项：
 * 目标是让 store 直接持有可展示字段，组件不再参与命名优先级判断。
 */
export function mapFriendSummaryToListItem(item: FriendSummaryDTO): FriendListItem {
  const remarkName = normalizeText(item.remarkName);
  const nickname = normalizeText(item.friendNickname);
  return {
    relationId: Number(item.id),
    id: Number(item.friendId),
    userId: Number(item.userId),
    friendId: Number(item.friendId),
    displayName: remarkName || nickname || `用户${item.friendId}`,
    nickname: nickname || `用户${item.friendId}`,
    remarkName: remarkName || null,
    avatar: item.friendAvatar || null,
    signature: normalizeText(item.friendSignature) || null,
    onlineStatus: mapOnlineStatus(item.friendOnlineStatus),
    group: normalizeText(item.friendGroup) || null,
    addTime: item.addTime || null,
    updateTime: item.updateTime || null,
  };
}

/** 批量映射好友列表。 */
export function mapFriendSummaryList(items: FriendSummaryDTO[]): FriendListItem[] {
  return items.map(mapFriendSummaryToListItem);
}

/** 好友详情标准化（预留后续详情字段兜底）。 */
export function normalizeFriendProfile(profile: FriendProfileDTO): FriendProfileDTO {
  return {
    ...profile,
    friendNickname: normalizeText(profile.friendNickname) || `用户${profile.friendId}`,
    remarkName: normalizeText(profile.remarkName) || null,
    friendGroup: normalizeText(profile.friendGroup) || null,
    friendSignature: normalizeText(profile.friendSignature) || null,
  };
}
