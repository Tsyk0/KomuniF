// File: src/capabilities/friend/service.ts
import { friendApi } from "@/apis/friend/index";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { displayNameResolver } from "@/capabilities/show-display-name";
import type {
  FriendListItem,
  FriendOnlineStatus,
  FriendRelationDetailDTO,
} from "@/types/dto/friend";

const normalizeOnlineStatus = (status?: number | null): FriendOnlineStatus => {
  if (status === 1) return "online";
  if (status === 2) return "away";
  return "offline";
};

export const mapToFriendListItem = (dto: FriendRelationDetailDTO): FriendListItem => {
  const nickname = dto.friendNickname || "";
  const remarkName = dto.remarkName || "";
  const displayName = displayNameResolver.person({
    remarkName,
    userNickname: nickname,
    fallbackName: "用户",
  });

  return {
    relationId: dto.id,
    id: dto.friendId,
    userId: dto.userId,
    friendId: dto.friendId,
    displayName,
    nickname,
    remarkName,
    avatar: normalizeAvatarUrl(dto.friendAvatar),
    signature: dto.friendSignature || "",
    onlineStatus: normalizeOnlineStatus(dto.friendOnlineStatus),
    group: dto.friendGroup || "",
    addTime: dto.addTime || "",
    updateTime: dto.updateTime || "",
  };
};

export async function loadFriendListItems(): Promise<FriendListItem[]> {
  const response = await friendApi.getFriendListByUserId();
  if (response.code !== 200) {
    throw new Error(response.message || "获取好友列表失败");
  }

  return (response.data || [])
    .map(mapToFriendListItem)
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "zh-Hans-CN", {
        sensitivity: "base",
      })
    );
}
