// src/store/realtime/websocket.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { getWebSocketHandler, realtimeEventBus } from "@/realtime/websocket";
import type { SendMessageRequest } from "@/types/dto/message";

const handler = getWebSocketHandler();

export const useWebSocketStore = defineStore("websocket", () => {
  const isConnected = ref(handler.sessionManager.isConnected());
  const connectionError = ref<string | null>(handler.sessionManager.getConnectionError());
  const reconnectAttempts = ref(handler.sessionManager.getReconnectAttempts());
  const currentConvId = ref<number | null>(handler.sessionManager.getActiveConversation());
  const conversationOnlineCount = ref<number | null>(null);

  realtimeEventBus.on("connected", () => {
    isConnected.value = true;
    connectionError.value = null;
    reconnectAttempts.value = handler.sessionManager.getReconnectAttempts();
  });
  realtimeEventBus.on("disconnected", () => {
    isConnected.value = false;
  });
  realtimeEventBus.on("connectionError", ({ message }) => {
    connectionError.value = message;
  });
  realtimeEventBus.on("conversationPresence", ({ convId, onlineCount }) => {
    if (currentConvId.value === convId) conversationOnlineCount.value = onlineCount;
  });

  /** 连接单会话模式（兼容原调用签名）。 */
  const connect = async (userId: number, convId: number) => {
    currentConvId.value = convId;
    handler.setActiveConversation(convId);
    await handler.connect(userId, [convId]);
  };

  /** 登录后连接并订阅全部会话。 */
  const connectAndSubscribeAll = async (userId: number, convIds: number[]) => {
    await handler.connect(userId, convIds);
  };

  /** 断开 WS 连接。 */
  const disconnect = () => {
    handler.disconnect();
    isConnected.value = false;
  };

  /** 按 messageType 分发发送逻辑（含 text / image / file / video）。 */
  const sendMessageByType = (request: SendMessageRequest) =>
    handler.actionHandler.sendMessageByType(request);

  /** 订阅指定会话并设置为当前活跃会话。 */
  const sendSubscribe = (convId: number) => {
    handler.setActiveConversation(convId);
    currentConvId.value = convId;
    conversationOnlineCount.value = null;
    return handler.actionHandler.subscribe(convId);
  };

  /** 发送已读回执动作。 */
  const sendReadReceipt = (messageId: number, convId: number) =>
    handler.actionHandler.sendReadMessage(messageId, convId);

  /** 发送撤回动作。 */
  const sendRecallMessage = (messageId: number, _convId: number) =>
    handler.actionHandler.sendRecallMessage(messageId);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    currentConvId,
    conversationOnlineCount,
    connect,
    connectAndSubscribeAll,
    disconnect,
    sendMessageByType,
    sendSubscribe,
    sendReadReceipt,
    sendRecallMessage,
  };
});
