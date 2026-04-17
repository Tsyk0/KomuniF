// File: src/capabilities/conversation/service.ts
import { conversationDetailApi } from "@/apis/chat/conversation-detail";
import { CompressedCMApi } from "@/apis/chat/compressed-convMem";
import type { CompressedCM, ConversationDetailDTO } from "@/types/dto/conversation";

export async function loadConversationSummaries(convId?: number): Promise<ConversationDetailDTO[]> {
  const response = await conversationDetailApi.getConversationDetailsViaToken(convId);
  if (response.code !== 200) {
    throw new Error(response.message || "加载会话失败");
  }
  return Array.isArray(response.data) ? response.data : [];
}

export async function loadConversationMembers(convId: number): Promise<CompressedCM[]> {
  const response = await CompressedCMApi.getCompressedCM(convId);
  if (response.code !== 200) {
    throw new Error(response.message || "加载群成员失败");
  }
  return Array.isArray(response.data) ? response.data : [];
}
