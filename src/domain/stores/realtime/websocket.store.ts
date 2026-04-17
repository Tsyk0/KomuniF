// File: src/domain/stores/realtime/websocket.store.ts
import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 重构后的实时通信 Domain Store 骨架。
 * 具体实现将从 websocket 相关 store 合并迁移。
 * 文件编码：UTF-8。
 */
export const useRealtimeDomainStore = defineStore("domainRealtime", () => {
  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);
  const reconnectAttempts = ref(0);
  const currentConvId = ref<number | null>(null);
  const conversationOnlineCount = ref<number | null>(null);

  async function connect(_userId: number, _convId: number) {
    throw new Error("TODO: migrate from websocket stores -> connect");
  }

  function disconnect() {
    isConnected.value = false;
  }

  function sendTextMessage(_convId: number, _messageContent: string) {
    throw new Error("TODO: migrate from websocket stores -> sendTextMessage");
  }

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    currentConvId,
    conversationOnlineCount,
    connect,
    disconnect,
    sendTextMessage,
  };
});
