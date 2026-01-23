<template>
  <div class="chat-container">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="header-left">
        <button class="back-button" @click="handleBack" v-if="showBackButton">
          <span class="back-icon">←</span>
        </button>
        <div class="chat-info">
          <div class="avatar-wrapper">
            <div class="chat-avatar">
              <span>{{ firstChar }}</span>
            </div>
          </div>
          <div class="chat-details">
            <h3 class="chat-name">{{ conversationName }}</h3>
            <p class="chat-status">在线</p>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="header-action" @click="handleSearch" title="搜索">
          <span class="action-icon">🔍</span>
        </button>
        <button class="header-action" @click="handleMenu" title="更多">
          <span class="action-icon">⋮</span>
        </button>
      </div>
    </div>

    <!-- 消息列表区域 -->
    <div class="messages-container" ref="messagesContainer">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-indicator">加载消息中...</div>

      <!-- 消息列表 -->
      <div class="messages-list">
        <!-- 每条消息使用MessageItem组件 -->
        <MessageItem
          v-for="message in messages"
          :key="message.messageId"
          :message="message"
        />

        <!-- 没有消息的提示 -->
        <div v-if="!isLoading && messages.length === 0" class="no-messages">
          暂无消息
        </div>
      </div>
    </div>

    <!-- 未选择会话状态 -->
    <div v-if="!convId" class="no-conversation">
      <div class="placeholder-icon">💭</div>
      <p class="placeholder-text">选择一个会话以开始聊天</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useMessageStore } from "@/stores/chat/show-message";
import { useAuthStore } from "@/stores/auth";
import MessageItem from "./MessageItem.vue";

// Store
const messageStore = useMessageStore();
const authStore = useAuthStore();

// Props
const props = defineProps({
  convId: {
    type: Number,
    default: null,
  },
  conversationName: {
    type: String,
    default: "",
  },
  conversationAvatar: {
    type: String,
    default: "",
  },
  showBackButton: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["back", "search", "menu"]);

// 响应式数据
const messagesContainer = ref<HTMLElement>();

// 计算属性
const firstChar = computed(() => {
  return props.conversationName ? props.conversationName.charAt(0) : "";
});

// 直接使用Store的数据
const messages = computed(() => messageStore.messages);
const isLoading = computed(() => messageStore.loading);

/**
 * 加载消息
 */
const loadMessages = async () => {
  if (!props.convId) return;

  console.log("触发加载消息，会话ID:", props.convId);
  await messageStore.loadMessages(props.convId);
};

/**
 * 事件处理
 */
const handleBack = () => emit("back");
const handleSearch = () => emit("search");
const handleMenu = () => emit("menu");

// 监听会话ID变化
watch(
  () => props.convId,
  (newConvId) => {
    console.log("会话ID变化:", newConvId);
    if (newConvId) {
      loadMessages();
    } else {
      messageStore.clearMessages();
    }
  },
  { immediate: true }
);

onMounted(() => {
  console.log("ChatContainer mounted");
  if (props.convId) {
    loadMessages();
  }
});
</script>

<style scoped>
/* 使用现有样式 */
@import "@/assets/styles/chat-container.css";

/* 添加一些新样式 */
.loading-indicator {
  text-align: center;
  padding: 16px;
  color: #666;
  font-size: 14px;
}

.no-messages {
  text-align: center;
  padding: 40px 16px;
  color: #999;
  font-size: 14px;
}
</style>