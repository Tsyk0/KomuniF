import service from "@/apis/service";
import type {
  GetSingleChatPeerUserResponse,
  GetSingleChatsPeerProfilesResponse,
} from "@/types/dto/single-chat-peer";

/**
 * 单聊：根据 convId 获取对方用户摘要（头像等）。
 * 后端：GET /conversations/{convId}/members/single-peer-profile
 * 若请求失败，前端会静默并改用 targetUserId + 好友资料接口。
 * 期望成功响应 data 含：userId、userAvatar（可为 null）。
 */
export async function getSingleChatPeerByConvIdApi(
  convId: number
): Promise<GetSingleChatPeerUserResponse> {
  const id = Math.floor(Number(convId));
  return service({
    url: `/conversations/${id}/members/single-peer-profile`,
    method: "get",
  });
}

/**
 * 登录后批量：当前用户所有单聊会话的对方资料（含头像）。
 * 后端：GET /conversations/single-chats/peer-profiles（无 query，Authorization 同 summary）
 */
export async function getSingleChatsPeerProfilesApi(): Promise<GetSingleChatsPeerProfilesResponse> {
  return service({
    url: "/conversations/single-chats/peer-profiles",
    method: "get",
  });
}

export const conversationPeerApi = {
  getSingleChatPeerByConvId: getSingleChatPeerByConvIdApi,
  getSingleChatsPeerProfiles: getSingleChatsPeerProfilesApi,
};

export default conversationPeerApi;
