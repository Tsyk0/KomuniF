<!-- File: src/components/ConversationList.vue -->
<!-- src/components/conversation-list.vue -->
<template>
  <div class="conversation-list">
    <!-- loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>Loading...</span>
    </div>

    <!-- error state -->
    <div v-else-if="errorMessage" class="error-state">
      <div class="error-icon">!</div>
      <span>{{ errorMessage }}</span>
      <button @click="retryLoad" class="retry-btn">Retry</button>
    </div>

    <!-- empty state -->
    <div v-else-if="mainSidebarConversations.length === 0" class="empty-conversation">
      <div class="empty-icon">-</div>
      <p class="empty-text">No conversations</p>
      <p class="empty-hint">Start a chat from your friend list.</p>
    </div>

    <!-- conversation list -->
    <div v-else class="conversations-container sidebar-list-items">
      <ConversationItem
        v-for="conversation in filteredConversations"
        :key="conversation.convId"
        :conversation="conversation"
        :is-active="isActiveConversation(conversation.convId)"
        @click="handleConversationClick(conversation.convId)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { useConvStore } from "@/store/conv/conv";
import { useShowMessageStore } from "@/store/message/showMessage";
import {
  openConversationByClick,
  searchConversationMatchedIdsByMessages,
} from "@/interactions/conversationList/ConversationListInteraction";
import { prepareMainConversationSidebarList } from "@/commons/utils/conversation-main-list";
import { resolveLastMessageSenderLabel } from "@/commons/utils/conversation-last-message-sender";
import { useFriendStore } from "@/store/friend/showFriend";
import { useUserStore } from "@/store/user/user";
import ConversationItem from "./ConversationItem.vue";

// Store
const convStore = useConvStore();
const showMessageStore = useShowMessageStore();
const friendStore = useFriendStore();
const userStore = useUserStore();

// Props
const props = defineProps<{
  searchQuery?: string;
}>();

// error state
const errorMessage = ref<string | null>(null);
const loading = ref(false);
const messageMatchedConversationIds = ref<Set<number>>(new Set());
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// computed states
const conversations = computed(() => {
  return convStore.conversations || [];
});

/** 主侧栏展示用：隐藏 displayStatus===2，置顶优先；与 store 全量列表分离。 */
const mainSidebarConversations = computed(() =>
  prepareMainConversationSidebarList(conversations.value)
);

const isLoading = computed(() => {
  return loading.value;
});

const filteredConversations = computed(() => {
  const keyword = props.searchQuery?.trim().toLowerCase();
  if (!keyword) {
    return mainSidebarConversations.value;
  }

  const matchedConvIdSet = messageMatchedConversationIds.value;
  return mainSidebarConversations.value.filter((conversation) => {
    if (conversation.convName?.toLowerCase().includes(keyword)) {
      return true;
    }

    // match by last message content
    const lastMsg = conversation.lastMessage;
    if (lastMsg?.messageContent?.toLowerCase().includes(keyword)) {
      return true;
    }

    // match by sender display name（与 ConversationItem 一致：好友优先备注，否则群昵称等）
    const senderName = lastMsg
      ? resolveLastMessageSenderLabel(
          lastMsg,
          friendStore.friends,
          userStore.user?.userId
        )
      : "";
    if (senderName.toLowerCase().includes(keyword)) {
      return true;
    }

    // match by conversation id
    if (conversation.convId.toString().includes(keyword)) {
      return true;
    }

    // match by message hits from IndexedDB
    return matchedConvIdSet.has(conversation.convId);
  });
});

const currentConversationId = computed(() => {
  return convStore.currentConversation?.convId || null;
});

// whether this conversation is active
const isActiveConversation = (convId: number) => {
  return currentConversationId.value === convId;
};

// retry
const retryLoad = async () => {
  errorMessage.value = null;
  await loadConversations();
};

const searchConversationByMessages = async (keyword: string) => {
  if (!keyword) {
    messageMatchedConversationIds.value = new Set();
    return;
  }
  messageMatchedConversationIds.value = await searchConversationMatchedIdsByMessages(
    keyword,
    mainSidebarConversations.value
  );
};

// load conversations
const loadConversations = async () => {
  if (conversations.value.length === 0) {
    loading.value = true;
    try {
      await convStore.loadConversations();
    } catch (error) {
      console.error("Failed to load conversations:", error);
      errorMessage.value = "Failed to load conversations. Please retry.";
    } finally {
      loading.value = false;
    }
  }
};

// click conversation
const handleConversationClick = async (convId: number) => {
  try {
    await openConversationByClick({
      convId,
      currentConversationId: currentConversationId.value,
      selectConversation: (id) => convStore.selectConversation(id),
      clearMessages: () => showMessageStore.clearMessages(),
      loadMessages: (id) => showMessageStore.loadMessages(id),
      markConversationRead: (id) => convStore.markConversationRead(id),
      emitConversationClick: (id) => emit("conversation-click", id),
    });
  } catch (error) {
    console.error("Failed to open conversation:", error);
    errorMessage.value = "Failed to open conversation. Please retry.";
  }
};

// lifecycle
onMounted(async () => {
  await loadConversations();
});

onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
});

watch(
  () => props.searchQuery,
  (newQuery) => {
    const keyword = newQuery?.trim() || "";
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }

    if (!keyword) {
      messageMatchedConversationIds.value = new Set();
      return;
    }

    searchTimer = setTimeout(() => {
      searchConversationByMessages(keyword);
    }, 250);
  },
  { immediate: true }
);

// emits
const emit = defineEmits<{
  (event: "conversation-click", convId: number): void;
}>();
</script>

<style scoped>
/* conversation list styles */
@import "@/assets/styles/conversation-list.css";
</style>
