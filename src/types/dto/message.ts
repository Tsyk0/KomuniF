// File: src/types/dto/message.ts
import type { BaseResponse } from "./base";

/**
 * 发送消息请求
 */
export interface SendMessageRequest {
    convId: number;
    messageType: string;
    messageContent: string;
    replyToMessageId?: number;
    atUserIds?: number[];
}

/**
 * 发送消息响应数据
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
 * 发送消息完整响应
 */
export type SendMessageResponse = BaseResponse<SendMessageResponseData>;

/**
 * 消息「摘要 / 列表行」传输对象：含 message 表部分字段 + 展示用扩展（与后端 MessageSummary 语义一致）。
 * 用于会话内分页、搜索、锚点等接口返回的单条记录，非 ORM 全量实体。
 */
export interface MessageSummaryDTO {
  // 消息基本信息
  messageId: number;
  convId: number;
  senderId: number;
  messageType: string;
  messageContent: string;
  messageStatus: number;
  isRecalled: boolean;
  sendTime: string;

  // 发送者头像
  senderAvatar: string | null;

  // 显示名称
  displayName: string;
  memberNickname: string | null;
  privateDisplayName: string | null;

  // 会话类型
  convType: number; // 1-单聊，2-群聊

  // 是否是自己发送的消息
  isSentByMe: boolean;

  // 引用和撤回相关
  replyToMessageId?: number | null;
  atUserIds?: number[] | null;
  recallTime?: string | null;
}

/**
 * 获取消息摘要请求参数
 */
export interface GetMessageSummariesRequest {
  convId: number;
  page?: number;
  pageSize?: number;
}

/**
 * 获取消息摘要响应
 */
export interface GetMessageSummariesResponse {
  code: number;
  message: string;
  data: {
    messages: MessageSummaryDTO[];
    total: number;
    page: number;
    pageSize: number;
  };
  timestamp?: number;
}

/**
 * 搜索消息请求参数
 * 对应后端：GET /message-search/search
 */
export interface SearchMessagesRequest {
  keyword?: string;
  convId?: number;
  senderId?: number;
  fromTime?: string; // yyyy-MM-dd
  toTime?: string; // yyyy-MM-dd
  page?: number;
  pageSize?: number;
}

/**
 * 搜索消息响应
 */
export interface SearchMessagesResponse {
  code: number;
  message: string;
  data: {
    messages: MessageSummaryDTO[];
    total: number;
    page: number;
    pageSize: number;
  };
  timestamp?: number;
}

/**
 * GET /messages/{messageId}/around
 * 锚点消息前后窗口（时间正序，含锚点）
 */
export interface MessagesAroundResponseData {
  anchorMessageId: number;
  windowSize: number;
  messages: MessageSummaryDTO[];
  total: number;
}

export interface MessagesAroundResponse {
  code: number;
  message: string;
  data: MessagesAroundResponseData;
  timestamp?: number;
}

/**
 * GET /messages/{boundaryMessageId}/before | /after
 * 边界外分页（时间正序，不含边界消息本身）
 */
export interface MessagesBoundaryPageResponseData {
  boundaryMessageId: number;
  direction: "before" | "after";
  messages: MessageSummaryDTO[];
  total: number;
  pageSize: number;
}

export interface MessagesBoundaryPageResponse {
  code: number;
  message: string;
  data: MessagesBoundaryPageResponseData;
  timestamp?: number;
}
