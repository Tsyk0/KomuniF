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

    <!-- 发送消息区域 - 新增部分 -->
    <div class="message-input-container" v-if="convId">
      <div class="input-wrapper">
        <!-- 左侧功能按钮 -->
        <div class="input-left-actions">
          <button class="action-button attachment-button" title="附件">
            <span class="action-icon">📎</span>
          </button>
          <button class="action-button emoji-button" title="表情">
            <span class="action-icon">😊</span>
          </button>
        </div>

        <!-- 消息输入框 -->
        <div class="message-input-wrapper">
          <textarea
            ref="messageInputRef"
            v-model="messageText"
            class="message-input"
            placeholder="输入消息..."
            rows="1"
            @keydown.enter.prevent="handleEnterKey"
            @input="handleInputResize"
          ></textarea>
        </div>

        <!-- 右侧发送按钮 -->
        <div class="input-right-actions">
          <button
            class="action-button send-button"
            :class="{ disabled: !canSend }"
            :disabled="!canSend || isSending"
            @click="sendMessage"
            title="发送"
          >
            <span class="send-icon" v-if="!isSending">➤</span>
            <span class="loading-icon" v-if="isSending">⏳</span>
          </button>
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
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useShowMessageStore } from "@/stores/chat/show-message";
import { useSendMessageStore } from "@/stores/chat/send-message";
import { useAuthStore } from "@/stores/auth";
import MessageItem from "./MessageItem.vue";
import type { DisplayMessage } from "@/types/entity/message"; // 更新导入类型

// Store
const showMessageStore = useShowMessageStore();
const sendMessageStore = useSendMessageStore();
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

const emit = defineEmits(["back", "search", "menu", "message-sent"]);

// 响应式数据
const messagesContainer = ref<HTMLElement>();
const messageInputRef = ref<HTMLTextAreaElement>();
const messageText = ref("");
const isSending = computed(() => sendMessageStore.isSending);

// 计算属性
const firstChar = computed(() => {
  return props.conversationName ? props.conversationName.charAt(0) : "";
});

// 发送条件
const canSend = computed(() => {
  return (
    messageText.value.trim().length > 0 && props.convId && !isSending.value
  );
});

// 使用Store的数据
const messages = computed(() => showMessageStore.messages);
const isLoading = computed(() => showMessageStore.loading);

/**
 * 加载消息
 */
const loadMessages = async () => {
  if (!props.convId) return;

  console.log("ChatContainer: 触发加载消息，会话ID:", props.convId);
  await showMessageStore.loadMessages(props.convId);
};

/**
 * 发送消息
 */
const sendMessage = async () => {
  if (!canSend.value || !props.convId) return;

  const content = messageText.value.trim();
  const currentUser = authStore.user;

  if (!currentUser?.userId) {
    console.error("用户未登录");
    return;
  }

  try {
    console.log("发送消息:", { convId: props.convId, content });

    // 1. 创建临时消息
    const tempMessage: DisplayMessage = {
      // 数据库基础字段
      messageId: Date.now(), // 临时ID
      convId: props.convId,
      senderId: currentUser.userId,
      messageType: "text",
      messageContent: content,
      messageStatus: 0, // 发送中
      sendTime: new Date().toISOString(),

      // 显示字段
      senderName: currentUser.nickname || currentUser.username,
      senderAvatar: currentUser.avatar || null,
      isSentByMe: true,
    };

    // 2. 添加到Store（使用addMessage方法）
    showMessageStore.addMessage(tempMessage);

    // 3. 清空输入框
    messageText.value = "";
    if (messageInputRef.value) {
      messageInputRef.value.style.height = "auto";
    }

    // 4. 滚动到底部
    scrollToBottom();

    // 5. 发送到服务器
    const response = await sendMessageStore.sendTextMessage(
      props.convId,
      currentUser.userId,
      content
    );

    console.log("服务器响应:", response);

    // 6. 用服务器消息替换临时消息
    const serverMessage: DisplayMessage = {
      ...tempMessage,
      messageId: response.messageId,
      messageStatus: response.messageStatus,
      sendTime: response.sendTime,
    };

    showMessageStore.replaceTempMessage(tempMessage.messageId, serverMessage);

    // 7. 触发消息发送事件
    emit("message-sent", response);
  } catch (error) {
    console.error("发送消息失败:", error);

    // 标记临时消息为失败状态
    const tempMessageId = tempMessage?.messageId;
    if (tempMessageId) {
      showMessageStore.updateMessageStatus(tempMessageId, 4);
    }

    // TODO: 添加错误提示UI
  }
};

/**
 * 处理Enter键发送
 */
const handleEnterKey = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.shiftKey && canSend.value) {
    event.preventDefault();
    sendMessage();
  }
};

/**
 * 输入框自适应高度
 */
const handleInputResize = () => {
  nextTick(() => {
    if (messageInputRef.value) {
      messageInputRef.value.style.height = "auto";
      const newHeight = Math.min(messageInputRef.value.scrollHeight, 120);
      messageInputRef.value.style.height = `${newHeight}px`;
    }
  });
};

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

/**
 * 事件处理
 */
const handleBack = () => emit("back");
const handleSearch = () => emit("search");
const handleMenu = () => emit("menu");

// 监听会话ID变化 - 关键修改点
watch(
  () => props.convId,
  (newConvId, oldConvId) => {
    console.log("ChatContainer: 会话ID变化:", {
      旧ID: oldConvId,
      新ID: newConvId,
    });

    if (newConvId) {
      loadMessages();
      messageText.value = "";
    } else {
      // 当没有会话时，清空消息
      showMessageStore.clearMessages();
    }
  },
  { immediate: true }
);

// 监听消息列表变化，自动滚动到底部
watch(
  () => showMessageStore.messages,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  },
  { deep: true }
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

/* 加载状态和空消息提示样式 */
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