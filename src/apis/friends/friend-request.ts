import service from "@/apis/service";
import type { BaseResponse } from "@/types/dto/base";

export interface FriendRequestSendResult {
  notificationId: number;
  receiverId: number;
}

export type FriendRequestSendResponse = BaseResponse<FriendRequestSendResult>;

/**
 * 向指定用户发送好友申请（申请方由 Token 解析）
 * POST /friends/{userId}/friend-request
 */
export function sendFriendRequestApi(
  targetUserId: number
): Promise<FriendRequestSendResponse> {
  return service({
    url: `/friends/${targetUserId}/friend-request`,
    method: "post",
  });
}

export const friendRequestApi = {
  send: sendFriendRequestApi,
};

export default friendRequestApi;
