// File: src/types/websocket/action-enums.ts
/**
 * WebSocket 线协议：action 常量、线级 JSON 帧类型（与后端 WsClientActionType / WsServerActionType 的 getWireValue() 一致，大小写敏感）。
 *
 * 文件名刻意不用 message-types，以免与业务「聊天消息」（entity / DTO）混淆；本模块描述的是 socket 上的帧，不是领域消息模型。
 * 心跳：纯文本 "ping" / "pong"，非 JSON。
 */

/** 上行：客户端 → 服务端 */
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

/** 下行：服务端 → 客户端（与后端枚举线值一致） */
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
  speechToTextCompleted: "speechToTextCompleted",
  /** 预留 / 历史帧 */
  subscriptionUpdate: "subscriptionUpdate",
} as const;

export type WsServerAction =
  (typeof WS_SERVER_ACTION)[keyof typeof WS_SERVER_ACTION];

/** 任意 JSON 帧上的 action（上行 + 下行；ping/pong 一般为纯文本，偶发 JSON 时兼容） */
export type WebSocketWireAction =
  | WsClientAction
  | WsServerAction
  | "ping"
  | "pong";

/** @deprecated 请优先使用 WebSocketWireAction / WsClientAction / WsServerAction */
export type WebSocketAction = WebSocketWireAction;

/**
 * 消息类型定义（与数据库message表一致）
 */
export type MessageType =
  | "text"
  | "image"
  | "file"
  | "audio"
  | "video"
  | "location"
  | "emoji"
  | "system";

/**
 * 消息状态定义（与数据库message表完全一致）
 * 0: 发送中, 1: 已发送, 2: 已送达, 3: 已读, 4: 发送失败
 */
export type MessageStatus = 0 | 1 | 2 | 3 | 4;

export interface WebSocketBaseMessage {
  action: WebSocketWireAction;
  timestamp?: number;
}

/** 上行：发送文本等 */
export interface SendMessageRequest extends WebSocketBaseMessage {
  action: "sendMessage";
  convId: number;
  messageType: MessageType;
  messageContent: string;
  replyToMessageId?: number | null;
  localMessageId?: string;
  atUserIds?: number[] | null;
}

/** 上行：标记已读（与后端 handleReadMessage 一致） */
export interface ReadMessageRequest {
  action: "readMessage";
  messageId: number;
  convId: number;
}

/** 上行：撤回消息 */
export interface RecallMessageRequest {
  action: "recallMessage";
  messageId: number;
}

/** 上行：订阅会话 */
export interface SubscribeRequest {
  action: "subscribe";
  convId: number;
}

/** 上行：取消订阅 */
export interface UnsubscribeRequest {
  action: "unsubscribe";
  convId: number;
}

/** 上行：输入状态 */
export interface TypingClientRequest {
  action: "typing";
  convId: number;
}

/** 联合：所有上行 JSON（不含纯文本 ping） */
export type WebSocketClientOutboundMessage =
  | SendMessageRequest
  | ReadMessageRequest
  | RecallMessageRequest
  | SubscribeRequest
  | UnsubscribeRequest
  | TypingClientRequest;

/**
 * 后端连接成功响应格式
 */
export interface ConnectedResponse extends WebSocketBaseMessage {
  action: "connected";
  userId: number;
  subscriptions: number[];
  message?: string;
}

/**
 * 后端新消息广播格式
 */
export interface NewMessageNotification extends WebSocketBaseMessage {
  action: "newMessage";
  messageId: number;
  convId: number;
  senderId: number;
  messageType: MessageType;
  messageContent: string;
  sendTime: number;
  messageStatus: MessageStatus;
  replyToMessageId?: number | null;
  atUserIds?: number[] | null;
  isRecalled?: number;
  recallTime?: number | null;
}

/**
 * 发送成功确认（下行）
 */
export interface MessageSentNotification extends WebSocketBaseMessage {
  action: "messageSent";
  convId?: number;
  messageId?: number;
  success?: boolean;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * 已读状态下行（原 readReceipt 线值已废弃，与后端一致为 messageRead）
 */
export interface MessageReadNotification extends WebSocketBaseMessage {
  action: "messageRead";
  convId: number;
  userId?: number;
  messageId: number;
  readTime?: number;
  [key: string]: unknown;
}

/**
 * 消息被撤回（下行广播）
 */
export interface MessageRecalledNotification extends WebSocketBaseMessage {
  action: "messageRecalled";
  messageId: number;
  convId: number;
  senderId?: number;
  recallTime?: number;
  [key: string]: unknown;
}

/**
 * 撤回操作成功确认（下行）
 */
export interface MessageRecallSuccessNotification extends WebSocketBaseMessage {
  action: "messageRecallSuccess";
  messageId: number;
  convId: number;
  [key: string]: unknown;
}

/**
 * 错误响应（code 与 HTTP ApiResponse.code 同套数值）
 */
export interface ErrorResponse extends WebSocketBaseMessage {
  action: "error";
  code: number | string;
  message: string;
  details?: unknown;
}

/** 兼容：历史命名 messageAck → 实际线值为 messageSent */
export type MessageAckNotification = MessageSentNotification;

/**
 * 其他用户正在输入（下行）
 */
export interface UserTypingNotification extends WebSocketBaseMessage {
  action: "userTyping";
  convId: number;
  userId: number;
  isTyping?: boolean;
  [key: string]: unknown;
}

/**
 * 订阅结果（下行）
 */
export interface SubscribedNotification extends WebSocketBaseMessage {
  action: "subscribed";
  convId?: number;
  subscriptions?: number[];
  [key: string]: unknown;
}

export interface UnsubscribedNotification extends WebSocketBaseMessage {
  action: "unsubscribed";
  convId?: number;
  [key: string]: unknown;
}

/**
 * 会话在线人数等
 */
export interface ConversationPresenceNotification extends WebSocketBaseMessage {
  action: "conversationPresence";
  convId: number;
  onlineCount: number;
  [key: string]: unknown;
}

/**
 * 系统通知实时推送（与 RealTimePusher.pushNewSystemNotification 字段对齐，允许扩展字段）
 */
export interface NewSystemNotificationMessage extends WebSocketBaseMessage {
  action: "newSystemNotification";
  notificationId: number;
  notificationType: string;
  notificationTitle?: string | null;
  notificationContent?: string | null;
  receiverId?: number;
  relatedUserId?: number | null;
  relatedConvId?: number | null;
  isRead?: boolean | null;
  createTime?: string;
  [key: string]: unknown;
}

export interface SpeechToTextCompletedMessage extends WebSocketBaseMessage {
  action: "speechToTextCompleted";
  [key: string]: unknown;
}

/**
 * 输入状态（下行 userTyping 优先；保留 typing 以防后端历史帧）
 */
export interface TypingNotification extends WebSocketBaseMessage {
  action: "typing";
  convId: number;
  userId: number;
  isTyping: boolean;
}

/** @deprecated 使用 MessageReadNotification（action: messageRead） */
export type ReadReceiptNotification = MessageReadNotification;

/** @deprecated 使用 MessageRecalledNotification（action: messageRecalled） */
export type MessageRecallNotification = MessageRecalledNotification;

/** @deprecated 使用 SubscribedNotification / UnsubscribedNotification */
export interface SubscriptionUpdate extends WebSocketBaseMessage {
  action: "subscriptionUpdate";
  added?: number[];
  removed?: number[];
}

/** JSON 心跳若存在（仍以纯文本 ping 为准） */
export interface PingMessage extends WebSocketBaseMessage {
  action: "ping";
}

export interface PongMessage extends WebSocketBaseMessage {
  action: "pong";
}

/**
 * 解析后的一条 WebSocket JSON 线帧联合（业务层请用 entity/DTO「消息」命名，勿与此处混淆）。
 */
export type WebSocketMessage =
  | SendMessageRequest
  | ReadMessageRequest
  | RecallMessageRequest
  | SubscribeRequest
  | UnsubscribeRequest
  | TypingClientRequest
  | ConnectedResponse
  | NewMessageNotification
  | MessageSentNotification
  | MessageReadNotification
  | MessageRecalledNotification
  | MessageRecallSuccessNotification
  | ErrorResponse
  | PingMessage
  | PongMessage
  | TypingNotification
  | UserTypingNotification
  | SubscribedNotification
  | UnsubscribedNotification
  | ConversationPresenceNotification
  | NewSystemNotificationMessage
  | SpeechToTextCompletedMessage
  | SubscriptionUpdate;

/**
 * 发送消息的返回结果
 */
export interface SendMessageResult {
  success: boolean;
  data?: NewMessageNotification;
  error?: string;
}

/**
 * WebSocket连接状态
 */
export enum WebSocketConnectionState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

/**
 * WebSocket事件类型
 */
export type WebSocketEvent = "open" | "message" | "error" | "close";

/**
 * 线帧处理器（参数为一条解析后的 JSON 线帧）
 */
export type MessageHandler = (message: WebSocketMessage) => void;

/**
 * 会话类型定义（与数据库conversation表一致）
 * 1: 单聊, 2: 群聊
 */
export type ConversationType = 1 | 2;

/**
 * 会话状态定义（与数据库conversation表一致）
 * 0: 已解散, 1: 正常
 */
export type ConversationStatus = 0 | 1;

/**
 * 成员角色定义（与数据库conversation_member表一致）
 * 0: 普通成员, 1: 管理员, 2: 群主
 */
export type MemberRole = 0 | 1 | 2;

/**
 * 成员状态定义（与数据库conversation_member表一致）
 * 0: 已退出, 1: 正常, 2: 禁言
 */
export type MemberStatus = 0 | 1 | 2;
