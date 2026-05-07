// File: src/apis/chat/conversation-member/index.ts
import service from "../../service";
import type { GetConversationWithMembersResponse } from "@/types/dto/conversation-member";

/**
 * 同一会话成员详情请求去重表。
 * 使用场景：群聊进入时详情面板与成员简表并发触发，复用同一 HTTP 请求。
 */
const conversationMembersDetailInFlightMap = new Map<
  number,
  Promise<GetConversationWithMembersResponse>
>();

/**
 * 获取会话及其成员详情
 * 对应后端接口：GET /conversationMember/getConversationWithMembers
 * @param convId 会话 ID
 */
export function getConversationWithMembersApi(
  convId: number
): Promise<GetConversationWithMembersResponse> {
  const normalizedConvId = Number(convId);
  const existing = conversationMembersDetailInFlightMap.get(normalizedConvId);
  if (existing) return existing;
  const task = service({
    url: `/conversations/${normalizedConvId}/members`,
    method: "get",
  }).finally(() => {
    conversationMembersDetailInFlightMap.delete(normalizedConvId);
  });
  conversationMembersDetailInFlightMap.set(normalizedConvId, task);
  return task;
}

export const conversationMemberApi = {
  getConversationWithMembers: getConversationWithMembersApi,
};

export default conversationMemberApi;

