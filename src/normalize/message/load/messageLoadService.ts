// src/normalize/message/load/messageLoadService.ts
import { messageAnchorApi } from "@/apis/chat/message-anchor";
import { messageSummaryApi } from "@/apis/chat/message-summary";
import type {
  MessageSummaryDTO,
  MessagesAroundResponseData,
  MessagesBoundaryPageResponseData,
} from "@/types/dto/message";
import {
  mapAroundMessages,
  mapBoundaryMessages,
  mapHistoryMessages,
} from "./messageLoadMapper";

/**
 * 加载会话历史消息（初始化/分页复用）。
 */
export async function loadConversationHistoryNormalized(params: {
  convId: number;
  beforeMessageId?: number;
  pageSize?: number;
}): Promise<MessageSummaryDTO[]> {
  const response = await messageSummaryApi.loadMoreMessages(params);
  if (response.code !== 200) {
    throw new Error(response.message || "加载历史消息失败");
  }
  return mapHistoryMessages(response.data?.messages);
}

/**
 * 加载锚点消息前后窗口（包含锚点）。
 */
export async function loadMessagesAroundNormalized(
  anchorMessageId: number,
  windowSize = 25
): Promise<MessagesAroundResponseData> {
  const response = await messageAnchorApi.getAround(anchorMessageId, { windowSize });
  if (response.code !== 200) {
    throw new Error(response.message || "加载锚点上下文失败");
  }
  return mapAroundMessages(response.data);
}

/**
 * 加载边界之前的更旧消息。
 */
export async function loadMessagesBeforeBoundaryNormalized(
  boundaryMessageId: number,
  pageSize: number
): Promise<MessagesBoundaryPageResponseData> {
  const response = await messageAnchorApi.getBefore(boundaryMessageId, { pageSize });
  if (response.code !== 200) {
    throw new Error(response.message || "加载更旧消息失败");
  }
  return mapBoundaryMessages(response.data, "before", pageSize);
}

/**
 * 加载边界之后的更新消息。
 */
export async function loadMessagesAfterBoundaryNormalized(
  boundaryMessageId: number,
  pageSize: number
): Promise<MessagesBoundaryPageResponseData> {
  const response = await messageAnchorApi.getAfter(boundaryMessageId, { pageSize });
  if (response.code !== 200) {
    throw new Error(response.message || "加载更新消息失败");
  }
  return mapBoundaryMessages(response.data, "after", pageSize);
}
