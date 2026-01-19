// src/types/flow/message.response.ts
import type { ChatMessage } from '@/entity/chat-message';

/**
 * 基础响应接口（所有API通用）
 */
export interface BaseResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

/**
 * 消息列表的数据结构（对应data字段）
 */
export interface MessageListData {
  total: number;
  messages: ChatMessage[];
  pageSize: number;
  page: number;
}

/**
 * 获取消息的完整响应
 */
export interface GetMessagesResponse extends BaseResponse<MessageListData> {}

/**
 * 简化后的消息列表（用于组件）
 */
export interface MessageList {
  messages: ChatMessage[];
  total: number;
}