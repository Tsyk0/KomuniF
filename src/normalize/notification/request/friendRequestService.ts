import {
  sendFriendRequestApi,
  type FriendRequestSendResponse,
} from "@/apis/friends/friend-request";

/** 发送好友申请（本质是创建一条好友申请通知）。 */
export async function sendFriendRequestNormalized(
  targetUserId: number
): Promise<FriendRequestSendResponse> {
  return sendFriendRequestApi(targetUserId);
}
