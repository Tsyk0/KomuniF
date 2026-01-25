// src/types/form/message-response-data.ts

import type { BaseResponse } from "../flow/base.response";

/**
 * 发送消息的响应数据类型
 */
export interface SendMessageResponseData {
  messageId: number;
  convId: number;
  senderId: number;
  messageType: string;
  messageContent: string;
  messageStatus: number;
  sendTime: string;
}

/**
 * 发送消息的完整响应类型
 */
export type SendMessageResponse = BaseResponse<SendMessageResponseData>;