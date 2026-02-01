import type { BaseResponse } from "@/types/flow/base.response";

/**
 * 好友详情 DTO：对应后端 FriendInfoDTO
 * 包含好友关系信息 + 好友用户完整信息
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
