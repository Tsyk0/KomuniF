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
              <img
                v-if="conversationAvatar"
                :src="conversationAvatar"
                alt="头像"
                @error="handleAvatarError"
              />
              <span v-else>{{ firstChar }}</span>
            </div>
          </div>
          <div class="chat-details">
            <h3 class="chat-name">{{ conversationName }}</h3>
            <p class="chat-status">{{ conversationStatus }}</p>
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
      <!-- 加载更多按钮 -->
      <div v-if="hasMoreMessages && !isLoading" class="load-more">
        <button @click="loadMoreMessages" :disabled="isLoading">
          {{ isLoading ? "加载中..." : "加载更早消息" }}
        </button>
      </div>

      <!-- 消息列表 -->
      <div class="messages-list">
        <div v-for="message in currentMessages" :key="message.messageId">
          <!-- 使用新的MessageItem组件 -->
          <MessageItem :message="message" />
        </div>
      </div>
    </div>

    <!-- 消息输入区域 -->
    <div class="message-input-area">
      <div class="input-container">
        <textarea
          v-model="inputMessage"
          @keydown.enter.exact.prevent="sendMessage"
          placeholder="输入消息..."
          class="message-input"
          rows="1"
          ref="messageInput"
        ></textarea>
        <button
          class="send-button"
          @click="sendMessage"
          :disabled="!canSend || isLoading"
        >
          <span class="send-icon">↑</span>
        </button>
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
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useMessageStore } from "@/stores/chat/show-message";
import { useConversationStore } from "@/stores/chat/show-conversation";
import { useAuthStore } from "@/stores/auth";
// 修改这一行：使用正确的路径
// import MessageItem from "@/components/MessageItem.vue";

// ============ Store 和 Props ============
const messageStore = useMessageStore();
const conversationStore = useConversationStore();
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

const emit = defineEmits([
  "back",
  "search",
  "menu",
  "attach-file",
  "attach-image",
  "emoji-picker",
]);

// ============ 响应式数据 ============
const messagesContainer = ref<HTMLElement>();
const messageInput = ref<HTMLTextAreaElement>();
const inputMessage = ref("");

// ============ 计算属性 ============
const currentUserId = computed(() => {
  return authStore.user?.userId || null;
});

const firstChar = computed(() => {
  return props.conversationName ? props.conversationName.charAt(0) : "";
});

const canSend = computed(() => {
  return inputMessage.value.trim().length > 0 && !messageStore.isLoading;
});

const conversationStatus = computed(() => {
  // 这里可以根据需要实现在线状态
  return "在线";
});

// 使用新的Store数据
const currentMessages = computed(() => {
  return messageStore.currentMessages || [];
});

const isLoading = computed(() => {
  return messageStore.isLoading || false;
});

const hasMoreMessages = computed(() => {
  return messageStore.hasMoreMessages;
});

// ============ 方法定义 ============

// 处理头像加载错误
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};

// 加载消息
const loadMessages = async () => {
  if (!props.convId) return;

  try {
    await messageStore.loadMessages(props.convId);
    scrollToBottom();
  } catch (error) {
    console.error("加载消息失败:", error);
  }
};

// 加载更多消息
const loadMoreMessages = async () => {
  if (!props.convId || !hasMoreMessages.value || isLoading.value) return;

  try {
    await messageStore.loadMoreMessages(props.convId);
  } catch (error) {
    console.error("加载更多消息失败:", error);
  }
};

// 发送消息
const sendMessage = async () => {
  if (!canSend.value || !props.convId || !currentUserId.value) return;

  const messageContent = inputMessage.value.trim();
  if (!messageContent) return;

  try {
    // 调用Store的发送消息方法
    const messageData = {
      convId: props.convId,
      senderId: currentUserId.value,
      messageType: "text",
      messageContent: messageContent,
    };

    const result = await messageStore.sendMessage(messageData);

    if (result) {
      inputMessage.value = "";
      resetInputHeight();
      scrollToBottom();

      // 更新会话列表的最后消息
      updateConversationLastMessage(result);
    }
  } catch (error) {
    console.error("发送消息失败:", error);
  }
};

// 更新会话的最后一条消息
const updateConversationLastMessage = (newMessage: any) => {
  const lastMessage = {
    messageId: newMessage.messageId,
    senderId: newMessage.senderId,
    messageType: newMessage.messageType,
    messageContent: newMessage.messageContent,
    senderDisplayName: newMessage.displayName || "我",
    senderAvatar: newMessage.senderAvatar,
    sendTime: newMessage.sendTime,
  };

  conversationStore.updateLastMessage(props.convId!, lastMessage);
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// 重置输入框高度
const resetInputHeight = () => {
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.style.height = "auto";
    }
  });
};

// 事件处理
const handleBack = () => {
  emit("back");
};

const handleSearch = () => {
  emit("search");
};

const handleMenu = () => {
  emit("menu");
};

// ============ 生命周期和监听器 ============
watch(
  () => props.convId,
  (newConvId, oldConvId) => {
    console.log(`会话变化: ${oldConvId} -> ${newConvId}`);

    if (newConvId) {
      // 重置消息列表
      messageStore.resetMessages();
      // 加载消息
      loadMessages();
    } else {
      // 清空消息列表
      messageStore.resetMessages();
    }
  },
  { immediate: true }
);

// 监听输入框变化，自动调整高度
watch(inputMessage, () => {
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.style.height = "auto";
      const newHeight = Math.min(messageInput.value.scrollHeight, 120);
      messageInput.value.style.height = `${newHeight}px`;
    }
  });
});

// 监听消息列表变化，自动滚动
watch(
  () => messageStore.currentMessages.length,
  (newLength, oldLength) => {
    // 如果是新增消息（不是初始加载），滚动到底部
    if (newLength > oldLength && oldLength > 0) {
      scrollToBottom();
    }
  }
);

onMounted(() => {
  // 初始化时如果有会话ID，加载消息
  if (props.convId) {
    loadMessages();
  }
});
</script>

<style scoped>
@import "@/assets/styles/chat-container.css";
</style>