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
    <div v-else-if="conversations.length === 0" class="empty-conversation">
      <div class="empty-icon">-</div>
      <p class="empty-text">No conversations</p>
      <p class="empty-hint">Start a chat from your friend list.</p>
    </div>

    <!-- conversation list -->
    <div v-else class="conversations-container">
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
import { useConvStore } from "@/store/conv";
import { useShowMessageStore } from "@/stores/message/show-message";
import { findConversationIdsByKeywordFromDB } from "@/commons/utils/local-db";
import { displayNameResolver } from "@/capabilities/show-display-name";
import ConversationItem from "./ConversationItem.vue";

// Store
const convStore = useConvStore();
const showMessageStore = useShowMessageStore();

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

const isLoading = computed(() => {
  return loading.value;
});

const filteredConversations = computed(() => {
  const keyword = props.searchQuery?.trim().toLowerCase();
  if (!keyword) {
    return conversations.value;
  }

  const matchedConvIdSet = messageMatchedConversationIds.value;
  return conversations.value.filter((conversation) => {
    if (conversation.convName?.toLowerCase().includes(keyword)) {
      return true;
    }

    // match by last message content
    const lastMsg = conversation.lastMessage;
    if (lastMsg?.messageContent?.toLowerCase().includes(keyword)) {
      return true;
    }

    // match by sender display name
    const senderName = lastMsg
      ? displayNameResolver.person({
          userNickname: lastMsg.senderDisplayName,
          fallbackName: `User${lastMsg.senderId}`,
        })
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

  const normalizedKeyword = keyword.toLowerCase();
  const matchedIds = new Set<number>();

  // search message hits in IndexedDB first
  try {
    const localMatchedConvIds = await findConversationIdsByKeywordFromDB(
      normalizedKeyword,
      {
        convIds: conversations.value.map((c) => c.convId),
      }
    );
    localMatchedConvIds.forEach((id) => matchedIds.add(id));
  } catch (error) {
    console.warn("IndexedDB search failed:", error);
  }

  messageMatchedConversationIds.value = matchedIds;
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
    console.log("conversation-list: clicked convId:", convId);
    console.log("current conversation id:", currentConversationId.value);

    // 1. detect whether user switched conversation
    const isSwitchingConversation = currentConversationId.value !== convId;

    // 2. set current conversation
    convStore.selectConversation(convId);

    // 3. clear stale messages when switching
    if (isSwitchingConversation) {
      console.log("conversation switched, clearing stale messages");
      showMessageStore.clearMessages();
    } else {
      console.log("same conversation, keep current messages");
    }

    // 4. load messages
    console.log("loading messages...");
    await showMessageStore.loadMessages(convId);
    console.log("messages loaded");

    // 5. mark as read
    convStore.markConversationRead(convId);

    // 6. emit event to parent
    emit("conversation-click", convId);
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
