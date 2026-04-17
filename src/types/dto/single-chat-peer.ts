// File: src/types/dto/single-chat-peer.ts
import type { BaseResponse } from "@/types/dto/base";

/**
 * 单聊按 convId 查询对方用户（头像等）。
 * 对应 GET /conversations/{convId}/members/single-peer-profile 的 data。
 */
export interface SingleChatPeerUserDTO {
  userId: number;
  userAvatar: string | null;
  userNickname?: string | null;
}

export type GetSingleChatPeerUserResponse = BaseResponse<SingleChatPeerUserDTO>;

/** GET /conversations/single-chats/peer-profiles 中 peerUser 结构 */
export interface SingleChatPeerProfileUserDTO {
  userId: number;
  userNickname: string | null;
  userAvatar: string | null;
  userGender?: number | null;
  userBirthday?: string | null;
  userLocation?: string | null;
  userSignature?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
  userStatus?: number | null;
  onlineStatus?: number | null;
  lastLoginTime?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
}

/** GET /conversations/single-chats/peer-profiles 的 data 数组元素 */
export interface SingleChatPeerProfileItemDTO {
  convId: number;
  peerUser: SingleChatPeerProfileUserDTO | null;
}

export type GetSingleChatsPeerProfilesResponse =
  BaseResponse<SingleChatPeerProfileItemDTO[]>;
