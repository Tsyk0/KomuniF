<!-- src/components/conversation-list.vue -->
<template>
  <div class="conversation-list">
    <!-- 搜索框 -->
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        v-model="searchKeyword"
        placeholder="搜索会话..."
        class="search-input"
        @input="handleSearch"
      />
      <button
        v-if="searchKeyword"
        class="clear-search"
        @click="clearSearch"
        title="清除搜索"
      >
        <span class="clear-icon">×</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMessage" class="error-state">
      <div class="error-icon">❌</div>
      <span>{{ errorMessage }}</span>
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>

    <!-- 搜索无结果 -->
    <div
      v-else-if="searchKeyword && filteredConversations.length === 0"
      class="no-results"
    >
      <div class="no-results-icon">🔍</div>
      <p class="no-results-text">未找到匹配的会话</p>
      <p class="no-results-hint">尝试其他搜索关键词</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="conversations.length === 0" class="empty-conversation">
      <div class="empty-icon">💬</div>
      <p class="empty-text">暂无会话</p>
      <p class="empty-hint">开始新的对话或等待好友消息</p>
    </div>

    <!-- 会话列表 -->
    <div v-else class="conversations-container">
      <conversationItem
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
import { ref, computed, onMounted, watch } from "vue";
import { useConversationStore } from "@/stores/chat/show-conversation";
import { useShowMessageStore } from "@/stores/chat/show-message";
import conversationItem from "./conversationItem.vue";
import type { ConversationDetailDTO } from "@/types/form/conversation-detail";

// Store
const conversationStore = useConversationStore();
const showMessageStore = useShowMessageStore();

// 响应式数据
const searchKeyword = ref("");
const errorMessage = ref<string | null>(null);
const searchTimeout = ref<number | null>(null);

// 计算属性
const conversations = computed(() => {
  return conversationStore.conversations || [];
});

const isLoading = computed(() => {
  return conversationStore.isLoading || false;
});

const filteredConversations = computed(() => {
  if (!searchKeyword.value.trim()) {
    return conversations.value;
  }

  const keyword = searchKeyword.value.toLowerCase();
  return conversations.value.filter((conversation) => {
    // 搜索会话名称
    if (conversation.convName?.toLowerCase().includes(keyword)) {
      return true;
    }

    // 搜索最后消息内容
    const lastMsg = conversation.lastMessage;
    if (lastMsg?.messageContent?.toLowerCase().includes(keyword)) {
      return true;
    }

    // 搜索发送者名称
    if (lastMsg?.senderDisplayName?.toLowerCase().includes(keyword)) {
      return true;
    }

    // 搜索会话ID
    if (conversation.convId.toString().includes(keyword)) {
      return true;
    }

    return false;
  });
});

const currentConversationId = computed(() => {
  return conversationStore.currentConversation?.convId || null;
});

// 检查是否为当前活跃会话
const isActiveConversation = (convId: number) => {
  return currentConversationId.value === convId;
};

// 方法
const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = window.setTimeout(() => {
    // 搜索逻辑已经在过滤中实现
    console.log("搜索关键词:", searchKeyword.value);
  }, 300);
};

const clearSearch = () => {
  searchKeyword.value = "";
};

const retryLoad = async () => {
  errorMessage.value = null;
  await loadConversations();
};

// 加载会话列表
const loadConversations = async () => {
  if (conversations.value.length === 0) {
    try {
      await conversationStore.loadConversations();
    } catch (error) {
      console.error("加载会话列表失败:", error);
      errorMessage.value = "无法加载会话列表，请检查网络连接";
    }
  }
};

// 处理会话点击 - 关键修改点
const handleConversationClick = async (convId: number) => {
  try {
    console.log("conversation-list: 处理会话点击，convId:", convId);
    console.log("当前会话ID:", currentConversationId.value);

    // 1. 检查是否是切换不同会话
    const isSwitchingConversation = currentConversationId.value !== convId;

    // 2. 设置当前会话
    conversationStore.setCurrentConversation(convId);

    // 3. 只有在切换不同会话时才清空消息
    if (isSwitchingConversation) {
      console.log("切换不同会话，清空消息");
      showMessageStore.clearMessages();
    } else {
      console.log("点击相同会话，不清空消息");
    }

    // 4. 加载消息
    console.log("开始加载消息...");
    await showMessageStore.loadMessages(convId);
    console.log("消息加载完成");

    // 5. 标记为已读
    conversationStore.markAsRead(convId);

    // 6. 触发自定义事件
    emit("conversation-click", convId);
  } catch (error) {
    console.error("切换会话失败:", error);
    errorMessage.value = "无法加载会话消息";
  }
};

// 监听搜索关键词变化
watch(
  () => conversationStore.searchKeyword,
  (newKeyword) => {
    if (searchKeyword.value !== newKeyword) {
      searchKeyword.value = newKeyword;
    }
  }
);

// 生命周期
onMounted(async () => {
  await loadConversations();
});

// 清理定时器
onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});

// 定义事件
const emit = defineEmits<{
  (event: "conversation-click", convId: number): void;
}>();

import { onUnmounted } from "vue";
</script>

<style scoped>
/* 完全移除内联样式 */
@import "@/assets/styles/conversation-list.css";
</style>