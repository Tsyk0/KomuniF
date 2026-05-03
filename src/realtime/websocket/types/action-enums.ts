// File: src/realtime/websocket/types/action-enums.ts
/**
 * WebSocket 线协议：action 常量、线级 JSON 帧类型（与后端 WsClientActionType / WsServerActionType 的 getWireValue() 一致，大小写敏感）。
 * 心跳：纯文本 "ping" / "pong"，非 JSON。
 */

/** 上行：客户端 -> 服务端 */
export const WS_CLIENT_ACTION = {
  sendMessage: "sendMessage",
  readMessage: "readMessage",
  recallMessage: "recallMessage",
  typing: "typing",
  subscribe: "subscribe",
  unsubscribe: "unsubscribe",
} as const;

export type WsClientAction =
  (typeof WS_CLIENT_ACTION)[keyof typeof WS_CLIENT_ACTION];

/** 下行：服务端 -> 客户端 */
export const WS_SERVER_ACTION = {
  connected: "connected",
  error: "error",
  newMessage: "newMessage",
  messageSent: "messageSent",
  messageRead: "messageRead",
  messageRecalled: "messageRecalled",
  messageRecallSuccess: "messageRecallSuccess",
  userTyping: "userTyping",
  subscribed: "subscribed",
  unsubscribed: "unsubscribed",
  conversationPresence: "conversationPresence",
  newSystemNotification: "newSystemNotification",
  newRequestHandle: "newRequestHandle",
  speechToTextCompleted: "speechToTextCompleted",
  subscriptionUpdate: "subscriptionUpdate",
  /** 群成员管理（踢人、禁言、解除禁言） */
  groupConvMemberManage: "groupConvMemberManage",
} as const;

export type WsServerAction =
  (typeof WS_SERVER_ACTION)[keyof typeof WS_SERVER_ACTION];

export type WebSocketWireAction =
  | WsClientAction
  | WsServerAction
  | "ping"
  | "pong";

export type WebSocketAction = WebSocketWireAction;

export type MessageType =
  | "text"
  | "image"
  | "file"
  | "audio"
  | "video"
  | "location"
  | "emoji"
  | "system";

export type MessageStatus = 0 | 1 | 2 | 3 | 4;

export interface WebSocketBaseMessage {
  action: WebSocketWireAction;
  timestamp?: number;
}

export interface SendMessageRequest extends WebSocketBaseMessage {
  action: "sendMessage";
  convId: number;
  messageType: MessageType;
  messageContent: string;
  replyToMessageId?: number | null;
  localMessageId?: string;
  /** @ 提及用户 ID；线协议驼峰，库表 at_user_ids 由服务端持久化时映射。 */
  atUserIds?: number[] | null;
}

export interface ReadMessageRequest {
  action: "readMessage";
  messageId: number;
  convId: number;
}

export interface RecallMessageRequest {
  action: "recallMessage";
  messageId: number;
}

export interface SubscribeRequest {
  action: "subscribe";
  convId: number;
}

export interface UnsubscribeRequest {
  action: "unsubscribe";
  convId: number;
}

export interface TypingClientRequest {
  action: "typing";
  convId: number;
}

export type WebSocketClientOutboundMessage =
  | SendMessageRequest
  | ReadMessageRequest
  | RecallMessageRequest
  | SubscribeRequest
  | UnsubscribeRequest
  | TypingClientRequest;
