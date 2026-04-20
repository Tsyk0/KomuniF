// File: src/capabilities/conversation/service.ts
import { conversationSummaryApi } from "@/apis/chat/conversation-summary";
import { conversationMembersApi } from "@/apis/chat/conversation-members";
import type {
  ConversationSummaryDTO,
  MessageDisplayMemberDTO,
} from "@/types/dto/conversation";

export async function loadConversationSummaries(
  convId?: number
): Promise<ConversationSummaryDTO[]> {
  const response = await conversationSummaryApi.getConversationSummaries(convId);
  if (response.code !== 200) {
    throw new Error(response.message || "加载会话失败");
  }
  return Array.isArray(response.data) ? response.data : [];
}

export async function loadConversationMembers(
  convId: number
): Promise<MessageDisplayMemberDTO[]> {
  const response = await conversationMembersApi.getConversationMembers(convId);
  if (response.code !== 200) {
    throw new Error(response.message || "加载群成员失败");
  }
  return Array.isArray(response.data) ? response.data : [];
}
