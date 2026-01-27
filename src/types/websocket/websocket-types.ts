// src/types/websocket/websocket-types.ts
import type { WebSocketConnectionState, WebSocketMessage, MessageHandler } from './message-types';

/**
 * WebSocket连接配置选项
 */
export interface WebSocketConfig {
  url: string;                           // WebSocket服务器URL
  autoReconnect?: boolean;               // 是否自动重连
  reconnectInterval?: number;            // 重连间隔（毫秒）
  maxReconnectAttempts?: number;         // 最大重连次数
  heartbeatInterval?: number;            // 心跳间隔（毫秒）
  heartbeatTimeout?: number;             // 心跳超时时间（毫秒）
}

/**
 * WebSocket服务接口定义
 */
export interface IWebSocketService {
  // 连接管理
  connect(): Promise<boolean>;
  disconnect(): void;
  reconnect(): Promise<boolean>;
  
  // 状态查询
  getConnectionState(): WebSocketConnectionState;
  getUserId(): number | null;
  getSubscriptions(): number[];
  isConnected(): boolean;
  
  // 消息收发
  sendMessage(message: WebSocketMessage): boolean;
  sendTextMessage(convId: number, content: string, replyToMessageId?: number | null, atUserIds?: number[] | null): Promise<any>;
  
  // 事件监听
  on(event: 'open', handler: () => void): void;
  on(event: 'message', handler: MessageHandler): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'close', handler: (event: CloseEvent) => void): void;
  on(event: 'stateChange', handler: (state: WebSocketConnectionState) => void): void;
  
  // 移除监听
  off(event: 'open', handler: () => void): void;
  off(event: 'message', handler: MessageHandler): void;
  off(event: 'error', handler: (error: Error) => void): void;
  off(event: 'close', handler: (event: CloseEvent) => void): void;
  off(event: 'stateChange', handler: (state: WebSocketConnectionState) => void): void;
  
  // 心跳管理
  startHeartbeat(): void;
  stopHeartbeat(): void;
}

/**
 * WebSocket连接统计信息
 */
export interface WebSocketStats {
  connectionStartTime: number | null;    // 连接开始时间
  lastMessageTime: number | null;        // 最后收到消息时间
  lastHeartbeatTime: number | null;      // 最后心跳时间
  messagesSent: number;                  // 已发送消息数
  messagesReceived: number;              // 已接收消息数
  connectionErrors: number;              // 连接错误次数
  reconnectAttempts: number;             // 重连尝试次数
}

/**
 * WebSocket连接选项（初始化参数）
 */
export interface WebSocketOptions {
  token?: string;                       // JWT token（可选，可从store获取）
  onConnected?: (userId: number, subscriptions: number[]) => void;
  onNewMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onDisconnected?: () => void;
  config?: Partial<WebSocketConfig>;    // 部分配置覆盖
}

/**
 * 本地临时消息（用于优化UI响应）
 */
export interface LocalMessage {
  localId: string;                      // 本地消息ID（前端生成）
  convId: number;                       // 会话ID
  senderId: number;                     // 发送者ID（当前用户）
  messageType: string;                  // 消息类型
  messageContent: string;               // 消息内容
  sendTime: number;                     // 发送时间
  messageStatus: number;                // 消息状态（临时状态：0-发送中，4-发送失败）
  replyToMessageId?: number | null;     // 回复的消息ID
  atUserIds?: number[] | null;          // @的用户ID列表
  pending?: boolean;                    // 是否等待服务器确认
}

/**
 * 待确认消息队列项
 */
export interface PendingMessage {
  localId: string;                      // 本地消息ID
  message: WebSocketMessage;            // 原始消息
  sentTime: number;                     // 发送时间
  retryCount: number;                   // 重试次数
  maxRetries?: number;                  // 最大重试次数
}

/**
 * WebSocket错误类型
 */
export class WebSocketError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}

/**
 * 连接参数（用于构建WebSocket URL）
 */
export interface ConnectionParams {
  token: string;
  protocolVersion?: string;             // 协议版本（预留）
  clientInfo?: {                        // 客户端信息（预留）
    platform: string;
    version: string;
    deviceId?: string;
  };
}

/**
 * 消息处理器映射
 */
export interface MessageHandlerMap {
  [key: string]: MessageHandler[];
}

/**
 * 事件处理器映射
 */
export interface EventHandlerMap {
  open: Array<() => void>;
  message: Array<MessageHandler>;
  error: Array<(error: Error) => void>;
  close: Array<(event: CloseEvent) => void>;
  stateChange: Array<(state: WebSocketConnectionState) => void>;
}

/**
 * 默认配置常量
 */
export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
  url: 'ws://localhost:8080/ws',
  autoReconnect: true,
  reconnectInterval: 3000,              // 3秒重连间隔
  maxReconnectAttempts: 5,              // 最大重连5次
  heartbeatInterval: 30000,             // 30秒心跳间隔
  heartbeatTimeout: 5000,               // 5秒心跳超时
};