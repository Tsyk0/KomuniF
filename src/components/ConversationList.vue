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
    <div v-else-if="!hasAnyConversation" class="empty-conversation">
      <div class="empty-icon">-</div>
      <p class="empty-text">No conversations</p>
      <p class="empty-hint">Start a chat from your friend list.</p>
    </div>

    <div
      v-else
      class="conversation-list-main"
      :class="{ 'is-archive-view': isArchiveView }"
    >
      <!-- conversation list -->
      <div class="conversations-container sidebar-list-items">
        <ConversationItem
          v-for="conversation in filteredConversations"
          :key="conversation.convId"
          :conversation="conversation"
          :is-active="isActiveConversation(conversation.convId)"
          @click="handleConversationClick(conversation.convId)"
        />
        <ArchivedConversationFolder
          v-if="
            !isArchiveView &&
            (keyword
              ? filteredArchivedConversations.length > 0
              : archivedConversations.length > 0)
          "
          @open="enterArchiveView"
        />
        <div
          v-if="isArchiveView && filteredConversations.length === 0"
          class="archive-empty-state"
        >
          当前没有结果
        </div>
      </div>
      <button
        v-if="isArchiveView"
        type="button"
        class="archive-back-btn archive-back-btn--fixed"
        @click="exitArchiveView"
      >
        返回普通会话
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useConvStore } from "@/store/conv/conv";
import { useShowMessageStore } from "@/store/message/showMessage";
import { openConversationByClick } from "@/interactions/conversationList/ConversationListInteraction";
import {
  prepareArchivedConversationSidebarList,
  prepareMainConversationSidebarList,
} from "@/commons/utils/conversation-main-list";
import ConversationItem from "./ConversationItem.vue";
import ArchivedConversationFolder from "./ArchivedConversationFolder.vue";

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
const isArchiveView = ref(false);

// computed states
const conversations = computed(() => {
  return convStore.conversations || [];
});

/** 主侧栏展示用：隐藏 displayStatus===2，置顶优先；与 store 全量列表分离。 */
const mainSidebarConversations = computed(() =>
  prepareMainConversationSidebarList(conversations.value)
);
const archivedConversations = computed(() =>
  prepareArchivedConversationSidebarList(conversations.value)
);
const hasAnyConversation = computed(() => conversations.value.length > 0);
const keyword = computed(() => props.searchQuery?.trim().toLowerCase() || "");

const applyKeywordFilter = (
  list: typeof mainSidebarConversations.value,
  normalizedKeyword: string
) =>
  list.filter((conversation) => {
    // 按会话 ID 过滤
    if (String(conversation.convId).includes(normalizedKeyword)) {
      return true;
    }
    // 按用户自定义显示名（privateDisplayName）过滤
    const privateDisplayName = String(
      conversation.privateDisplayName || ""
    ).toLowerCase();
    if (privateDisplayName.includes(normalizedKeyword)) {
      return true;
    }
    // 按会话公开名（群名 / 后端会话名）过滤
    const publicConversationName = String(
      conversation.convName || ""
    ).toLowerCase();
    if (publicConversationName.includes(normalizedKeyword)) {
      return true;
    }
    // 单聊补充：备注名 / 对方 userId / 对方昵称
    if (Number(conversation.convType) === 1) {
      const peerRemarkName = String(
        conversation.peer?.peerRemarkName || ""
      ).toLowerCase();
      if (peerRemarkName.includes(normalizedKeyword)) {
        return true;
      }
      const peerNickname = String(
        conversation.peer?.peerNickname || ""
      ).toLowerCase();
      if (peerNickname.includes(normalizedKeyword)) {
        return true;
      }
      const peerUserId = String(
        conversation.peer?.peerUserId ?? conversation.targetUserId ?? ""
      );
      if (peerUserId.includes(normalizedKeyword)) {
        return true;
      }
    }
    return false;
  });

const filteredMainConversations = computed(() => {
  if (!keyword.value) return mainSidebarConversations.value;
  return applyKeywordFilter(mainSidebarConversations.value, keyword.value);
});

const filteredArchivedConversations = computed(() => {
  if (!keyword.value) return archivedConversations.value;
  return applyKeywordFilter(archivedConversations.value, keyword.value);
});

const sourceConversations = computed(() =>
  isArchiveView.value
    ? filteredArchivedConversations.value
    : filteredMainConversations.value
);

const isLoading = computed(() => {
  return loading.value;
});

const filteredConversations = computed(() => sourceConversations.value);

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

const enterArchiveView = () => {
  isArchiveView.value = true;
};

const exitArchiveView = () => {
  isArchiveView.value = false;
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
      notifyConversationEntered: (id) =>
        convStore.notifyConversationEntered(id),
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

// emits
const emit = defineEmits<{
  (event: "conversation-click", convId: number): void;
}>();
</script>

<style scoped>
/* conversation list styles */
@import "@/assets/styles/conversation-list.css";
</style>
