// src/normalize/friend/load/friendLoadService.ts
import { friendApi } from "@/apis/friend";
import type { FriendListItem, FriendProfileDTO } from "@/types/dto/friend";
import { mapFriendSummaryList, normalizeFriendProfile } from "./friendLoadMapper";

/**
 * 加载并标准化好友列表。
 * 返回值可直接进入 showFriend store。
 */
export async function loadFriendsNormalized(): Promise<FriendListItem[]> {
  const response = await friendApi.getFriendListByUserId();
  if (response.code !== 200 || !Array.isArray(response.data)) {
    throw new Error(response.message || "加载好友列表失败");
  }
  return mapFriendSummaryList(response.data);
}

/**
 * 按 friendId 加载并标准化好友详情。
 * 用于 friendInfo store 或详情页即时刷新。
 */
export async function loadFriendInfoNormalized(friendId: number): Promise<FriendProfileDTO> {
  const id = Math.floor(Number(friendId));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("无效的好友 ID");
  }
  const response = await friendApi.getFriendInfo(id);
  if (response.code !== 200 || !response.data) {
    throw new Error(response.message || "获取好友详情失败");
  }
  return normalizeFriendProfile(response.data);
}
