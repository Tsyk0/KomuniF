import service from "../../service";
import type { GetConversationMembersResponse } from "@/types/dto/conversation";

/**
 * 根据会话 ID 获取会话成员列表。
 * 对应后端接口：GET /conversations/{convId}/members
 */
export function getConversationMembersApi(
  convId: number
): Promise<GetConversationMembersResponse> {
  return service({
    url: `/conversations/${convId}/members`,
    method: "get",
  }).then((resp: any) => {
    const members = resp?.data?.members || [];
    return {
      ...resp,
      data: members,
    } as GetConversationMembersResponse;
  });
}

export const conversationMembersApi = {
  getConversationMembers: getConversationMembersApi,
};

export default conversationMembersApi;
