// src/normalize/friend/load/friendLoadService.ts
import { friendApi } from "@/apis/friend";
import type { FriendListItem, FriendProfileDTO, FriendSummaryDTO } from "@/types/dto/friend";
import { FriendRelationStatus } from "@/types/dto/friend";
import { mapFriendSummaryList, normalizeFriendProfile } from "./friendLoadMapper";

/**
 * 开发态断言：GET /friends 仅应返回 relationStatus 为好友态（0/1）的行。
 * 使用场景：接口若误返拉黑/非好友时便于联调发现，生产环境不输出日志。
 */
function assertFriendListRelationStatusFromFriendsApi(rows: FriendSummaryDTO[]) {
  if (!import.meta.env.DEV) return;
  for (const row of rows) {
    const r = Number(row.relationStatus);
    if (r === FriendRelationStatus.BLOCKED || r === FriendRelationStatus.NOT_FRIEND) {
      console.warn(
        "[GET /friends] relationStatus 预期仅为好友态(0/1)，收到异常值:",
        r,
        "friendId=",
        row.friendId
      );
    }
  }
}

/**
 * 加载并标准化好友列表。
 * 返回值可直接进入 showFriend store。
 */
export async function loadFriendsNormalized(): Promise<FriendListItem[]> {
  const response = await friendApi.getFriendListByUserId();
  if (response.code !== 200 || !Array.isArray(response.data)) {
    throw new Error(response.message || "加载好友列表失败");
  }
  assertFriendListRelationStatusFromFriendsApi(response.data);
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
