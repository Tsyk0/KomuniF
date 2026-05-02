// File: src/types/dto/friend.ts
import type { BaseResponse } from "./base";

export type FriendOnlineStatus = "online" | "offline" | "away";

/**
 * 好友关系 `relation_status`（`friend_relation`）。
 * GET /friends 仅应返回 `FRIEND_PINNED`、`NORMAL`；拉黑/非好友为备注映射等非列表态，不应出现在好友列表数据源。
 * 使用场景：摘要/资料 DTO、与「仅备注」缓存区分。
 */
export const FriendRelationStatus = {
  /** 好友且置顶排序优先（仍是好友） */
  FRIEND_PINNED: 0,
  /** 正常好友 */
  NORMAL: 1,
  /** 拉黑：不当好友展示；列表接口通常不返回 */
  BLOCKED: 2,
  /** 非好友：不当好友展示；备注等可走单独资料/映射，勿与好友列表混用 */
  NOT_FRIEND: 3,
} as const;

export type FriendRelationStatusValue =
  (typeof FriendRelationStatus)[keyof typeof FriendRelationStatus];

/**
 * 好友关系摘要 DTO
 */
export interface FriendSummaryDTO {
  id: number;
  userId: number;
  friendId: number;
  /** 见 `FriendRelationStatus`；列表接口预期仅 0/1 */
  relationStatus: number;
  remarkName?: string | null;
  friendGroup?: string | null;
  addSource?: string | null;
  addTime?: string | null;
  updateTime?: string | null;
  friendNickname: string;
  friendAvatar?: string | null;
  friendGender?: number | null;
  friendSignature?: string | null;
  friendOnlineStatus?: number | null;
}

/**
 * 获取好友列表响应
 */
export type GetFriendListResponse = BaseResponse<FriendSummaryDTO[]>;

/**
 * 好友列表展示项（前端使用）
 */
export interface FriendListItem {
  relationId: number;
  id: number;
  userId: number;
  friendId: number;
  displayName: string;
  nickname: string;
  remarkName?: string | null;
  avatar?: string | null;
  signature?: string | null;
  onlineStatus: FriendOnlineStatus;
  group?: string | null;
  addTime?: string | null;
  updateTime?: string | null;
}

/**
 * 好友资料 DTO (包含完整用户信息)
 */
export interface FriendProfileDTO {
  id: number;
  userId: number;
  friendId: number;
  /** 见 `FriendRelationStatus`；资料接口可能含 2/3，勿与 GET /friends 列表数据源混用 */
  relationStatus: number;
  remarkName?: string | null;
  friendGroup?: string | null;
  addSource?: string | null;
  addTime?: string | null;
  updateTime?: string | null;
  friendNickname: string;
  friendAvatar?: string | null;
  friendGender?: number | null;
  friendBirthday?: string | null;
  friendLocation?: string | null;
  friendSignature?: string | null;
  friendPhone?: string | null;
  friendEmail?: string | null;
  friendStatus?: number | null;
  friendOnlineStatus?: number | null;
  friendLastLoginTime?: string | null;
}

// 兼容旧命名
export type FriendInfoDTO = FriendProfileDTO;

export type GetFriendInfoResponse = BaseResponse<FriendProfileDTO>;
