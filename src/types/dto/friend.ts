import type { BaseResponse } from "./base";

export type FriendOnlineStatus = "online" | "offline" | "away";

/**
 * 好友关系详情 DTO
 */
export interface FriendRelationDetailDTO {
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
export type GetFriendListResponse = BaseResponse<FriendRelationDetailDTO[]>;

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
 * 好友详情 DTO (包含完整用户信息)
 */
export interface FriendInfoDTO {
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

export type GetFriendInfoResponse = BaseResponse<FriendInfoDTO>;
