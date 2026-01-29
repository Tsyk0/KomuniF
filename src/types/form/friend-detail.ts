import type { BaseResponse } from "@/types/flow/base.response";

export type FriendOnlineStatus = "online" | "offline" | "away";

// 后端 DTO：好友关系详情
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

// 获取好友列表请求参数
export interface GetFriendListRequest {
  userId: number;
}

// 获取好友列表响应
export type GetFriendListResponse = BaseResponse<FriendRelationDetailDTO[]>;

// 列表展示模型（前端使用）
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
