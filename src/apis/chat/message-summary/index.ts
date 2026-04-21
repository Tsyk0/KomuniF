import service from "../../service";
import type {
  GetMessageSummariesRequest,
  GetMessageSummariesResponse,
} from "@/types/dto/message";

/**
 * 获取会话消息摘要列表。
 * 对应后端接口：GET /messages/summary
 */
export function getMessageSummariesApi(
  params: GetMessageSummariesRequest
): Promise<GetMessageSummariesResponse> {
  return service({
    url: "/messages/summary",
    method: "get",
    params,
  });
}

/**
 * 便捷方法：按 convId 获取消息摘要。
 */
export function getMessageSummariesByConversationApi(
  convId: number,
  page: number = 10,
  pageSize: number = 50
): Promise<GetMessageSummariesResponse> {
  return getMessageSummariesApi({
    convId,
    page,
    pageSize,
  });
}

/**
 * 根据消息边界加载更旧消息。
 * 对应后端接口：GET /messages/loadMore
 * 参数：convId, beforeMessageId, pageSize
 */
export function loadMoreMessagesApi(params: {
  convId: number;
  beforeMessageId?: number;
  pageSize?: number;
}): Promise<GetMessageSummariesResponse> {
  return service({
    url: "/messages/loadMore",
    method: "get",
    params,
  });
}

export const messageSummaryApi = {
  getMessageSummaries: getMessageSummariesApi,
  getMessageSummariesByConversation: getMessageSummariesByConversationApi,
  loadMoreMessages: loadMoreMessagesApi,
};

export default messageSummaryApi;
