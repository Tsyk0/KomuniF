// src/realtime/websocket/core/WebSocketHandler.ts
import { realtimeEventBus } from "../events/eventBus";
import { WebSocketSessionManager } from "./WebSocketSessionManager";
import { WebSocketActionHandler } from "../action/WebSocketActionHandler";
import type { WebSocketClientOutboundMessage } from "../types/action-enums";

export class WebSocketHandler {
  private ws: WebSocket | null = null;
  private heartbeatTimer: number | null = null;
  private isConnecting = false;
  private readonly maxReconnectAttempts = 5;
  private reconnectUserId: number | null = null;
  private reconnectConvIds: number[] = [];

  readonly sessionManager = new WebSocketSessionManager();
  readonly actionHandler = new WebSocketActionHandler((payload) => this.send(payload));

  /**
   * 建立连接并批量订阅会话。
   * convIds 建议在登录后传入当前用户全部会话 ID。
   */
  async connect(userId: number, convIds: number[] = []): Promise<void> {
    if (this.isConnecting) return;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.subscribeAll(convIds);
      return;
    }

    this.reconnectUserId = userId;
    this.reconnectConvIds = convIds;
    this.isConnecting = true;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("未提供认证 token，请先登录");

      this.disconnect();
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          this.sessionManager.setConnected(true);
          this.sessionManager.setConnectionError(null);
          this.sessionManager.setReconnectAttempts(0);
          this.startHeartbeat();
          this.subscribeAll(convIds);
          resolve();
        };
        ws.onerror = () => reject(new Error("WebSocket连接失败"));
      });

      ws.onmessage = (event) => this.handleIncoming(String(event.data));
      ws.onclose = (event) => {
        this.stopHeartbeat();
        this.sessionManager.setConnected(false);
        realtimeEventBus.emit("disconnected", { code: event.code, reason: event.reason });
        if (event.code !== 1000) this.tryReconnect();
      };

      realtimeEventBus.emit("connected", { userId, subscriptions: this.sessionManager.getSubscriptions() });
      window.dispatchEvent(new CustomEvent("websocket:connected", { detail: { userId } }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "WebSocket连接失败";
      this.sessionManager.setConnectionError(msg);
      realtimeEventBus.emit("connectionError", { message: msg });
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /** 主动断开连接并停止心跳。 */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, "正常关闭");
    }
    this.ws = null;
    this.sessionManager.setConnected(false);
  }

  /** 发送上行 JSON 消息。 */
  send(payload: WebSocketClientOutboundMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  /** 批量订阅会话（去重 + 非法值过滤）。 */
  subscribeAll(convIds: number[]): void {
    const normalized = [...new Set(convIds.filter((id) => Number.isFinite(id) && id > 0))];
    for (const convId of normalized) {
      this.actionHandler.subscribe(convId);
      this.sessionManager.addSubscription(convId);
    }
  }

  /** 更新当前活跃会话并确保该会话被订阅。 */
  setActiveConversation(convId: number | null): void {
    this.sessionManager.setActiveConversation(convId);
    if (convId != null && convId > 0) {
      this.actionHandler.subscribe(convId);
      this.sessionManager.addSubscription(convId);
    }
  }

  /** 启动心跳：每 30s 发送纯文本 ping。 */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send("ping");
    }, 30000);
  }

  /** 停止心跳定时器。 */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer != null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /** 指数退避重连。 */
  private tryReconnect(): void {
    const attempts = this.sessionManager.getReconnectAttempts() + 1;
    this.sessionManager.setReconnectAttempts(attempts);
    if (attempts > this.maxReconnectAttempts || this.reconnectUserId == null) return;
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    window.setTimeout(() => {
      void this.connect(this.reconnectUserId!, this.reconnectConvIds);
    }, delay);
  }

  /** 解析下行消息并分发到 typed eventBus + 兼容 window 事件。 */
  private handleIncoming(data: string): void {
    if (data === "pong") return;
    let message: any;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    const action = String(message.action || "");
    switch (action) {
      case "connected":
        this.sessionManager.setConnected(true);
        realtimeEventBus.emit("connected", {
          userId: message.userId,
          subscriptions: Array.isArray(message.subscriptions) ? message.subscriptions : [],
        });
        window.dispatchEvent(new CustomEvent("websocket:connected", { detail: message }));
        break;
      case "newMessage":
        realtimeEventBus.emit("newMessage", message);
        window.dispatchEvent(new CustomEvent("websocket:newMessage", { detail: message }));
        break;
      case "messageSent":
        realtimeEventBus.emit("messageSent", message);
        window.dispatchEvent(new CustomEvent("websocket:messageSent", { detail: message }));
        break;
      case "messageRead":
        realtimeEventBus.emit("messageRead", message);
        break;
      case "messageRecalled":
        realtimeEventBus.emit("messageRecalled", message);
        break;
      case "userTyping":
        realtimeEventBus.emit("userTyping", message);
        break;
      case "subscribed":
        if (typeof message.convId === "number") this.sessionManager.addSubscription(message.convId);
        if (Array.isArray(message.subscriptions)) this.sessionManager.setSubscriptions(message.subscriptions);
        realtimeEventBus.emit("subscribed", message);
        break;
      case "unsubscribed":
        if (typeof message.convId === "number") this.sessionManager.removeSubscription(message.convId);
        realtimeEventBus.emit("unsubscribed", message);
        break;
      case "conversationPresence":
        if (typeof message.convId === "number" && typeof message.onlineCount === "number") {
          this.sessionManager.setConversationOnlineCount(message.convId, message.onlineCount);
          realtimeEventBus.emit("conversationPresence", {
            convId: message.convId,
            onlineCount: message.onlineCount,
          });
        }
        break;
      case "error": {
        const err = String(message.message || "WebSocket错误");
        this.sessionManager.setConnectionError(err);
        realtimeEventBus.emit("serverError", { code: message.code, message: err });
        window.dispatchEvent(new CustomEvent("websocket:error", { detail: err }));
        break;
      }
      default:
        break;
    }
  }
}

let singleton: WebSocketHandler | null = null;
export function getWebSocketHandler(): WebSocketHandler {
  if (!singleton) singleton = new WebSocketHandler();
  return singleton;
}
