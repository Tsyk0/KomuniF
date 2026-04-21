// src/realtime/websocket/core/WebSocketSessionManager.ts
export class WebSocketSessionManager {
  private connected = false;
  private activeConvId: number | null = null;
  private subscriptions = new Set<number>();
  private onlineCountByConvId = new Map<number, number>();
  private reconnectAttempts = 0;
  private connectionError: string | null = null;

  /** 更新当前连接状态。 */
  setConnected(next: boolean): void {
    this.connected = next;
    if (!next) this.activeConvId = null;
  }

  /** 读取连接状态。 */
  isConnected(): boolean {
    return this.connected;
  }

  /** 设置当前活跃会话（用于在线人数展示）。 */
  setActiveConversation(convId: number | null): void {
    this.activeConvId = convId;
  }

  /** 读取当前活跃会话。 */
  getActiveConversation(): number | null {
    return this.activeConvId;
  }

  /** 全量覆盖订阅集合（登录初始化场景）。 */
  setSubscriptions(convIds: number[]): void {
    this.subscriptions = new Set(convIds.filter((id) => Number.isFinite(id) && id > 0));
  }

  /** 追加单个订阅会话。 */
  addSubscription(convId: number): void {
    if (Number.isFinite(convId) && convId > 0) this.subscriptions.add(convId);
  }

  /** 删除单个订阅会话。 */
  removeSubscription(convId: number): void {
    this.subscriptions.delete(convId);
  }

  /** 获取当前已订阅会话列表。 */
  getSubscriptions(): number[] {
    return [...this.subscriptions];
  }

  /** 判断会话是否已订阅。 */
  hasSubscription(convId: number): boolean {
    return this.subscriptions.has(convId);
  }

  /** 缓存某会话在线人数。 */
  setConversationOnlineCount(convId: number, count: number): void {
    this.onlineCountByConvId.set(convId, count);
  }

  /** 读取某会话在线人数。 */
  getConversationOnlineCount(convId: number): number | null {
    return this.onlineCountByConvId.get(convId) ?? null;
  }

  /** 更新重连次数。 */
  setReconnectAttempts(count: number): void {
    this.reconnectAttempts = Math.max(0, Math.floor(count));
  }

  /** 读取重连次数。 */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /** 更新最近连接错误。 */
  setConnectionError(message: string | null): void {
    this.connectionError = message;
  }

  /** 读取最近连接错误。 */
  getConnectionError(): string | null {
    return this.connectionError;
  }
}
