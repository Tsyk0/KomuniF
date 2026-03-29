import service from "../../service";
import type {
  MessagesAroundResponse,
  MessagesBoundaryPageResponse,
} from "@/types/dto/message";

/**
 * 锚点消息上下文：GET /messages/{messageId}/around
 * 鉴权与其它 /messages/* 一致（Token）
 */
export function getMessagesAroundApi(
  messageId: number,
  params?: { windowSize?: number }
): Promise<MessagesAroundResponse> {
  return service({
    url: `/messages/${messageId}/around`,
    method: "get",
    params: params?.windowSize != null ? { windowSize: params.windowSize } : undefined,
  });
}

/**
 * 更旧：GET /messages/{boundaryMessageId}/before
 */
export function getMessagesBeforeBoundaryApi(
  boundaryMessageId: number,
  params?: { pageSize?: number }
): Promise<MessagesBoundaryPageResponse> {
  return service({
    url: `/messages/${boundaryMessageId}/before`,
    method: "get",
    params: params?.pageSize != null ? { pageSize: params.pageSize } : undefined,
  });
}

/**
 * 更新：GET /messages/{boundaryMessageId}/after
 */
export function getMessagesAfterBoundaryApi(
  boundaryMessageId: number,
  params?: { pageSize?: number }
): Promise<MessagesBoundaryPageResponse> {
  return service({
    url: `/messages/${boundaryMessageId}/after`,
    method: "get",
    params: params?.pageSize != null ? { pageSize: params.pageSize } : undefined,
  });
}

export const messageAnchorApi = {
  getAround: getMessagesAroundApi,
  getBefore: getMessagesBeforeBoundaryApi,
  getAfter: getMessagesAfterBoundaryApi,
};

export default messageAnchorApi;
