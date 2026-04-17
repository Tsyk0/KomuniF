// File: src/domain/stores/message/message.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { DisplayMessage } from "@/entity/message";

/**
 * 重构后的消息 Domain Store 骨架。
 * 具体实现将从 src/stores/chat/show-message.ts 迁移。
 * 文件编码：UTF-8。
 */
export const useMessageDomainStore = defineStore("domainMessage", () => {
  const messages = ref<DisplayMessage[]>([]);
  const loading = ref(false);
  const hasMoreHistory = ref(true);
  const historyLoading = ref(false);

  const latestMessage = computed(() =>
    messages.value.length ? messages.value[messages.value.length - 1] : null
  );

  async function loadMessages(_convId: number) {
    throw new Error("TODO: migrate from src/stores/chat/show-message.ts -> loadMessages");
  }

  function addMessage(message: DisplayMessage) {
    const exists = messages.value.some((m) => m.messageId === message.messageId);
    if (!exists) messages.value.push(message);
  }

  function clearMessages() {
    messages.value = [];
  }

  return {
    messages,
    loading,
    hasMoreHistory,
    historyLoading,
    latestMessage,
    loadMessages,
    addMessage,
    clearMessages,
  };
});
