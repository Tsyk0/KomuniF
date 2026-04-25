// src/realtime/websocket/events/eventBus.ts
export type RealtimeEventMap = {
  connected: { userId?: number; subscriptions?: number[] };
  disconnected: { code?: number; reason?: string };
  connectionError: { message: string };
  newMessage: Record<string, unknown>;
  messageSent: Record<string, unknown>;
  messageRead: Record<string, unknown>;
  messageRecalled: Record<string, unknown>;
  userTyping: Record<string, unknown>;
  subscribed: { convId?: number; subscriptions?: number[] };
  unsubscribed: { convId?: number };
  conversationPresence: { convId: number; onlineCount: number };
  newSystemNotification: Record<string, unknown>;
  newRequestHandle: Record<string, unknown>;
  serverError: { code?: number | string; message: string };
};

type EventKey = keyof RealtimeEventMap;
type Listener<K extends EventKey> = (payload: RealtimeEventMap[K]) => void;

class TypedEventBus {
  private listeners = new Map<EventKey, Set<Listener<any>>>();

  /** 订阅事件，返回取消订阅函数。 */
  on<K extends EventKey>(event: K, listener: Listener<K>): () => void {
    const set = this.listeners.get(event) || new Set();
    set.add(listener as Listener<any>);
    this.listeners.set(event, set);
    return () => this.off(event, listener);
  }

  /** 取消单个事件监听。 */
  off<K extends EventKey>(event: K, listener: Listener<K>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(listener as Listener<any>);
    if (set.size === 0) this.listeners.delete(event);
  }

  /** 广播事件给当前所有订阅者。 */
  emit<K extends EventKey>(event: K, payload: RealtimeEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) listener(payload);
  }
}

export const realtimeEventBus = new TypedEventBus();
