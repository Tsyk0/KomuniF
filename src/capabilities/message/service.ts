// File: src/capabilities/message/service.ts
import { messageAnchorApi } from "@/apis/chat/message-anchor";
import { messageDetailApi } from "@/apis/chat/message-detail";
import type {
  MessageDetailDTO,
  MessagesAroundResponseData,
  MessagesBoundaryPageResponseData,
} from "@/types/dto/message";

export async function loadConversationHistory(params: {
  convId: number;
  beforeMessageId?: number;
  pageSize?: number;
}): Promise<MessageDetailDTO[]> {
  const response = await messageDetailApi.getHistoryMessagesByConvId(params);
  if (response.code !== 200) {
    throw new Error(response.message || "加载历史消息失败");
  }
  return (response.data?.messages || []) as MessageDetailDTO[];
}

export async function loadMessagesAround(
  anchorMessageId: number,
  windowSize = 25
): Promise<MessagesAroundResponseData> {
  const response = await messageAnchorApi.getAround(anchorMessageId, { windowSize });
  if (response.code !== 200) {
    throw new Error(response.message || "加载锚点上下文失败");
  }
  return response.data;
}

export async function loadMessagesBeforeBoundary(
  boundaryMessageId: number,
  pageSize: number
): Promise<MessagesBoundaryPageResponseData> {
  const response = await messageAnchorApi.getBefore(boundaryMessageId, { pageSize });
  if (response.code !== 200) {
    throw new Error(response.message || "加载更旧消息失败");
  }
  return response.data;
}

export async function loadMessagesAfterBoundary(
  boundaryMessageId: number,
  pageSize: number
): Promise<MessagesBoundaryPageResponseData> {
  const response = await messageAnchorApi.getAfter(boundaryMessageId, { pageSize });
  if (response.code !== 200) {
    throw new Error(response.message || "加载更新消息失败");
  }
  return response.data;
}
