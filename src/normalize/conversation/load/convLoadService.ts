// src/normalize/conversation/load/convLoadService.ts
import { conversationSummaryApi } from "@/apis/chat/conversation-summary";
import { conversationMembersApi } from "@/apis/chat/conversation-members";
import { conversationMemberApi } from "@/apis/chat/conversation-member";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import type {
  ConversationEntity,
  ConversationMemberDTO,
} from "@/types/dto/conversation-member";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";
import { normalizeConversationSummary } from "./convLoadMapper";

export type ConversationInfoDetail = {
  conversation: ConversationEntity;
  members: ConversationMemberDTO[];
};

/** 会话列表全量/单条加载入口（基于 summary.peer 做标准化）。 */
export async function loadConversationsNormalized(
  convId?: number
): Promise<ConversationSummaryDTO[]> {
  const summaryResponse = await conversationSummaryApi.getConversationSummaries(convId);

  if (summaryResponse.code !== 200) {
    throw new Error(summaryResponse.message || "加载会话失败");
  }

  const summaries = Array.isArray(summaryResponse.data) ? summaryResponse.data : [];

  // 首屏直接使用 summary 返回的 peer 数据做单聊名称/头像映射。
  return summaries.map((conv) => normalizeConversationSummary(conv));
}

/** 加载会话详情与成员（load 语义，归属 conversation/load）。 */
export async function loadConversationInfoNormalized(
  convId: number
): Promise<ConversationInfoDetail> {
  const response = await conversationMemberApi.getConversationWithMembers(convId);
  if (response.code !== 200 || !response.data) {
    throw new Error(response.message || "Failed to load conversation info");
  }
  return {
    conversation: response.data.conversation,
    members: Array.isArray(response.data.members) ? response.data.members : [],
  };
}

/** 加载群成员简表（消息展示名解析使用）。 */
export async function loadConversationMembersNormalized(
  convId: number
): Promise<MessageDisplayMemberDTO[]> {
  const response = await conversationMembersApi.getConversationMembers(convId);
  if (response.code !== 200) {
    throw new Error(response.message || "加载群成员失败");
  }
  return Array.isArray(response.data) ? response.data : [];
}
