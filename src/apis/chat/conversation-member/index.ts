import service from "../../service";
import type { GetConversationWithMembersResponse } from "@/types/dto/conversation-member";

/**
 * 获取会话及其成员详情
 * 对应后端接口：GET /conversationMember/getConversationWithMembers
 * @param convId 会话 ID
 */
export function getConversationWithMembersApi(
  convId: number
): Promise<GetConversationWithMembersResponse> {
  return service({
    url: "/conversationMember/getConversationWithMembers",
    method: "get",
    params: { convId },
  });
}

export const conversationMemberApi = {
  getConversationWithMembers: getConversationWithMembersApi,
};

export default conversationMemberApi;

