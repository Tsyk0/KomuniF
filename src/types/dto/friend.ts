// File: src/types/dto/friend.ts
import type { BaseResponse } from "./base";

export type FriendOnlineStatus = "online" | "offline" | "away";

/**
 * 好友关系摘要 DTO
 */
export interface FriendSummaryDTO {
  id: number;
  userId: number;
  friendId: number;
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
