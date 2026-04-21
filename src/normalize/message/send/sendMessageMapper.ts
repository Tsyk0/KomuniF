// src/normalize/message/send/sendMessageMapper.ts
import type { BaseResponse } from "@/types/dto/base";
import type { SendMessageResponseData } from "@/types/dto/message";

export interface SendMessageNormalizedResult {
  success: boolean;
  data: SendMessageResponseData | null;
  message: string;
}

/**
 * 发送消息响应标准化：
 * 将 API 返回统一映射为 store 直接可消费的成功/失败结构。
 */
export function mapSendMessageResponse(
  response: BaseResponse<SendMessageResponseData>
): SendMessageNormalizedResult {
  const success = response.code === 200 && !!response.data;
  return {
    success,
    data: success ? response.data : null,
    message: response.message || (success ? "发送成功" : "发送失败"),
  };
}
