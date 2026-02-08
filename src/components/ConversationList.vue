<!-- src/components/conversation-list.vue -->
<template>
  <div class="conversation-list">
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
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { useConversationStore } from "@/stores/chat/show-conversation";
import { useShowMessageStore } from "@/stores/chat/show-message";
import conversationItem from "./ConversationItem.vue";
import type { ConversationDetailDTO } from "@/types/dto/conversation";

// Store
const conversationStore = useConversationStore();
const showMessageStore = useShowMessageStore();

// Props
const props = defineProps<{
  searchQuery?: string;
}>();

// 响应式数据
const errorMessage = ref<string | null>(null);

// 计算属性
const conversations = computed(() => {
  return conversationStore.conversations || [];
});

const isLoading = computed(() => {
  return conversationStore.isLoading || false;
});

const filteredConversations = computed(() => {
  if (!props.searchQuery?.trim()) {
    return conversations.value;
  }

  const keyword = props.searchQuery.toLowerCase();
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



// 监听store中的会话列表变化，自动更新组件数据
watch(() => conversationStore.conversations, (newConversations) => {
  conversations.value = newConversations;
}, { immediate: true });

// 监听搜索关键词变化
watch(() => props.searchQuery, (newQuery) => {
  conversationStore.setSearchKeyword(newQuery);
});


// 定义事件
const emit = defineEmits<{
  (event: "conversation-click", convId: number): void;
}>();
</script>

<style scoped>
/* 完全移除内联样式 */
@import "@/assets/styles/conversation-list.css";
</style>