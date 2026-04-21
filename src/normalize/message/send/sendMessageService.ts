// src/normalize/message/send/sendMessageService.ts
import { sendMessageApi } from "@/apis/chat/message-send";
import type { SendMessageRequest } from "@/types/dto/message";
import {
  mapSendMessageResponse,
  type SendMessageNormalizedResult,
} from "./sendMessageMapper";

/**
 * 发送消息 normalize service：
 * 仅负责调用 API 并交给 mapper 做统一结果映射。
 */
export async function sendMessageNormalized(
  request: SendMessageRequest
): Promise<SendMessageNormalizedResult> {
  const response = await sendMessageApi(request);
  return mapSendMessageResponse(response);
}
