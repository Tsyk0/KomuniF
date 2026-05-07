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
  private readonly wsPath = "/ws";

  readonly sessionManager = new WebSocketSessionManager();
  readonly actionHandler = new WebSocketActionHandler((payload) => this.send(payload));
// (payload) => this.send(payload)是构造函数参数，是一个匿名方法，匿名方法内部有this.send(payload)方法
// 即，handler构造时需要传递这个匿名方法，而不是构造的时候立即调用this.send(payload)

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
      const wsBase = String(import.meta.env.VITE_WS_BASE_URL || "").trim().replace(/\/$/, "");
      if (!wsBase) {
        throw new Error("缺少 VITE_WS_BASE_URL 配置，请在 .env.* 文件中设置");
      }
      const wsUrl = `${wsBase}${this.wsPath}?token=${encodeURIComponent(token)}`;
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

      ws.onmessage = (event) => {
        /**
         * 功能：打印每一条 WebSocket 下行原始消息。
         * 场景：联调排查“后端是否已推送、前端是否收到原始帧”。
         */
        const rawFrame = String(event.data);
        console.info("[WebSocket][onmessage][raw]", rawFrame);
        this.handleIncoming(rawFrame);
      };
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
    /**
     * 功能：打印进入统一分发器的每条消息（含纯文本心跳与 JSON）。
     * 场景：需要确认“消息已进入 action 分发逻辑”，但尚未确定具体分支时。
     */
    console.info("[WebSocket][incoming]", data);
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
        // realtimeEventBus.emit和window.dispatchEvent都在传递消息，为什么要两个？
        // 这样做不是为了「两个总线各干一半同一件事」，而是 同一条 WS 下行用两种载体各广播一次，让 不同写法的消费者都能接到，属于项目里已经形成的 双通道兼容。
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
      case "groupConvMemberManage":
        realtimeEventBus.emit("groupConvMemberManage", message);
        window.dispatchEvent(
          new CustomEvent("websocket:groupConvMemberManage", { detail: message })
        );
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
        window.dispatchEvent(
          new CustomEvent("websocket:messageRecalled", { detail: message })
        );
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
      case "newSystemNotification":
        console.info("[WS-NOTIF-RT][INCOMING]", "newSystemNotification", message);
        realtimeEventBus.emit("newSystemNotification", message);
        window.dispatchEvent(
          new CustomEvent("websocket:newSystemNotification", { detail: message })
        );
        break;
      case "newRequestHandle":
        console.info("[WS-NOTIF-RT][INCOMING]", "newRequestHandle", message);
        realtimeEventBus.emit("newRequestHandle", message);
        window.dispatchEvent(
          new CustomEvent("websocket:newRequestHandle", { detail: message })
        );
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
