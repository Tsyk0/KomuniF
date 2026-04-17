// File: src/domain/stores/conversation/conversation.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { ConversationDetailDTO } from "@/types/dto/conversation";

/**
 * 重构后的会话 Domain Store 骨架。
 * 具体实现将从 src/stores/chat/show-conversation.ts 迁移。
 * 文件编码：UTF-8。
 */
export const useConversationDomainStore = defineStore("domainConversation", () => {
  const conversations = ref<ConversationDetailDTO[]>([]);
  const currentConversation = ref<ConversationDetailDTO | null>(null);
  const searchKeyword = ref("");
  const loading = ref(false);

  const filteredConversations = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (!keyword) return conversations.value;
    return conversations.value.filter((conv) => {
      const convName = (conv.convName || "").toLowerCase();
      const lastMessage = (conv.lastMessage?.messageContent || "").toLowerCase();
      return convName.includes(keyword) || lastMessage.includes(keyword);
    });
  });

  const totalUnreadCount = computed(() =>
    conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
  );

  async function loadConversations() {
    throw new Error("TODO: migrate from src/stores/chat/show-conversation.ts -> loadConversations");
  }

  function setCurrentConversation(convId: number) {
    currentConversation.value =
      conversations.value.find((item) => item.convId === convId) || null;
  }

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword;
  }

  function reset() {
    conversations.value = [];
    currentConversation.value = null;
    searchKeyword.value = "";
    loading.value = false;
  }

  return {
    conversations,
    currentConversation,
    searchKeyword,
    loading,
    filteredConversations,
    totalUnreadCount,
    loadConversations,
    setCurrentConversation,
    setSearchKeyword,
    reset,
  };
});
