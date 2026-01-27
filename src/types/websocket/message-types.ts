// src/types/websocket/message-types.ts
/**
 * WebSocket消息动作类型定义
 * 对应后端WebSocketHandler中的消息动作
 */
export type WebSocketAction = 
  | 'connected'        // 连接成功
  | 'sendMessage'      // 发送消息（前端->后端）
  | 'newMessage'       // 新消息通知（后端->前端）
  | 'messageAck'       // 消息确认（后端->前端）
  | 'messageRecall'    // 消息撤回通知
  | 'error'            // 错误响应
  | 'ping'             // 心跳ping
  | 'pong'             // 心跳pong
  | 'subscriptionUpdate' // 订阅更新（预留）
  | 'typing'           // 输入状态（预留）
  | 'readReceipt';     // 已读回执（预留）

/**
 * 消息类型定义（与数据库message表一致）
 */
export type MessageType = 
  | 'text'      // 文本消息
  | 'image'     // 图片
  | 'file'      // 文件
  | 'audio'     // 语音（注意：数据库中是audio，不是voice）
  | 'video'     // 视频
  | 'location'  // 位置
  | 'emoji'     // 表情
  | 'system';   // 系统消息

/**
 * 消息状态定义（与数据库message表完全一致）
 * 0: 发送中, 1: 已发送, 2: 已送达, 3: 已读, 4: 发送失败
 */
export type MessageStatus = 0 | 1 | 2 | 3 | 4;

/**
 * WebSocket基础消息接口
 * 所有WebSocket消息必须包含action字段
 */
export interface WebSocketBaseMessage {
  action: WebSocketAction;
  timestamp?: number; // 可选的时间戳
}

/**
 * 前端发送消息的消息格式
 * 对应后端要求的：{ "action": "sendMessage", "convId": 123, ... }
 */
export interface SendMessageRequest extends WebSocketBaseMessage {
  action: 'sendMessage';
  convId: number;              // 会话ID
  messageType: MessageType;    // 消息类型（注意与数据库一致）
  messageContent: string;      // 消息内容
  replyToMessageId?: number | null;  // 回复的消息ID（可为null）
  localMessageId?: string;     // 本地临时消息ID（前端生成，用于确认）
  atUserIds?: number[] | null; // @的用户ID列表（群聊时使用）
}

/**
 * 后端连接成功响应格式
 * 对应：{ "action": "connected", "userId": 123, "subscriptions": [456, 789], ... }
 */
export interface ConnectedResponse extends WebSocketBaseMessage {
  action: 'connected';
  userId: number;              // 用户ID
  subscriptions: number[];     // 已订阅的会话ID列表
  message?: string;            // 可选的连接成功消息
}

/**
 * 后端新消息广播格式
 * 对应：{ "action": "newMessage", "messageId": 456, "convId": 123, ... }
 * 与数据库message表字段对应
 */
export interface NewMessageNotification extends WebSocketBaseMessage {
  action: 'newMessage';
  messageId: number;           // 消息ID（数据库生成）
  convId: number;              // 会话ID
  senderId: number;            // 发送者ID
  messageType: MessageType;    // 消息类型
  messageContent: string;      // 消息内容
  sendTime: number;            // 发送时间戳（毫秒）
  messageStatus: MessageStatus; // 消息状态
  replyToMessageId?: number | null; // 回复的消息ID
  atUserIds?: number[] | null; // @的用户ID列表
  isRecalled?: number;         // 是否撤回：0-未撤回，1-已撤回
  recallTime?: number | null;  // 撤回时间
}

/**
 * 消息确认格式（用于更新消息状态）
 */
export interface MessageAckNotification extends WebSocketBaseMessage {
  action: 'messageAck';
  messageId: number;           // 消息ID
  convId: number;              // 会话ID
  status: MessageStatus;       // 新的状态（1-已发送, 2-已送达, 3-已读）
  timestamp: number;           // 状态变更时间
}

/**
 * 消息撤回通知格式
 */
export interface MessageRecallNotification extends WebSocketBaseMessage {
  action: 'messageRecall';
  messageId: number;           // 消息ID
  convId: number;              // 会话ID
  senderId: number;            // 发送者ID
  recallTime: number;          // 撤回时间
}

/**
 * 错误响应格式
 */
export interface ErrorResponse extends WebSocketBaseMessage {
  action: 'error';
  code: string;                // 错误代码
  message: string;             // 错误信息
  details?: any;               // 错误详情（可选）
}

/**
 * 心跳消息格式
 */
export interface PingMessage extends WebSocketBaseMessage {
  action: 'ping';
}

export interface PongMessage extends WebSocketBaseMessage {
  action: 'pong';
}

/**
 * 输入状态消息格式（预留）
 */
export interface TypingNotification extends WebSocketBaseMessage {
  action: 'typing';
  convId: number;              // 会话ID
  userId: number;              // 用户ID
  isTyping: boolean;           // 是否正在输入
}

/**
 * 已读回执消息格式
 * 对应数据库message_read_status表
 */
export interface ReadReceiptNotification extends WebSocketBaseMessage {
  action: 'readReceipt';
  convId: number;              // 会话ID
  userId: number;              // 用户ID
  messageId: number;           // 已读消息ID
  readTime: number;            // 已读时间
}

/**
 * 订阅更新消息格式
 */
export interface SubscriptionUpdate extends WebSocketBaseMessage {
  action: 'subscriptionUpdate';
  added?: number[];            // 新增订阅的会话ID
  removed?: number[];          // 移除订阅的会话ID
}

/**
 * WebSocket消息联合类型
 * 用于类型安全的消息处理
 */
export type WebSocketMessage = 
  | SendMessageRequest
  | ConnectedResponse
  | NewMessageNotification
  | MessageAckNotification
  | MessageRecallNotification
  | ErrorResponse
  | PingMessage
  | PongMessage
  | TypingNotification
  | ReadReceiptNotification
  | SubscriptionUpdate;

/**
 * 发送消息的返回结果
 */
export interface SendMessageResult {
  success: boolean;
  data?: NewMessageNotification; // 发送成功时返回的消息数据
  error?: string;               // 错误信息
}

/**
 * WebSocket连接状态
 */
export enum WebSocketConnectionState {
  CONNECTING = 'connecting',    // 连接中
  CONNECTED = 'connected',      // 已连接
  DISCONNECTED = 'disconnected', // 已断开
  RECONNECTING = 'reconnecting', // 重连中
  ERROR = 'error'               // 错误状态
}

/**
 * WebSocket事件类型
 */
export type WebSocketEvent = 
  | 'open'                      // 连接打开
  | 'message'                   // 收到消息
  | 'error'                     // 发生错误
  | 'close';                    // 连接关闭

/**
 * 消息处理器类型
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