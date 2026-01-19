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
      <!-- 消息列表 -->
      <div class="messages-list">
        <!-- 日期分隔线 -->
        <div v-for="dateGroup in groupedMessages" :key="dateGroup.date">
          <div class="date-divider">
            <span class="date-text">{{
              formatDateDivider(dateGroup.date)
            }}</span>
          </div>

          <!-- 该日期的所有消息 -->
          <div
            v-for="message in dateGroup.messages"
            :key="message.messageId"
            class="message-wrapper"
            :class="{
              'first-in-group': message.isFirstInGroup,
              'last-in-group': message.isLastInGroup,
            }"
          >
            <!-- 系统消息 -->
            <div v-if="message.messageType === 'system'" class="system-message">
              <span class="system-content">{{ message.messageContent }}</span>
            </div>

            <!-- 普通消息 -->
            <div
              v-else
              class="message-item"
              :class="{
                sent: message.isSentByMe,
                received: !message.isSentByMe,
              }"
            >
              <!-- 对方消息显示头像 -->
              <div
                v-if="!message.isSentByMe && message.isFirstInGroup"
                class="message-avatar"
              >
                <div class="avatar-small">
                  <img
                    v-if="message.senderAvatar"
                    :src="message.senderAvatar"
                    alt="头像"
                  />
                  <span v-else>{{ getSenderInitial(message.senderId) }}</span>
                </div>
              </div>

              <!-- 消息内容区域 -->
              <div class="message-content-wrapper">
                <!-- 发送者名字（群聊且不是自己发送的消息） -->
                <div
                  v-if="
                    !message.isSentByMe && isGroup && message.isFirstInGroup
                  "
                  class="sender-name"
                >
                  {{ getSenderName(message.senderId) }}
                </div>

                <!-- 消息气泡 -->
                <div
                  class="message-bubble"
                  :class="{
                    sent: message.isSentByMe,
                    received: !message.isSentByMe,
                  }"
                >
                  <!-- 文本消息 -->
                  <div
                    v-if="message.messageType === 'text'"
                    class="text-message"
                  >
                    {{ message.messageContent }}
                  </div>

                  <!-- 图片消息 -->
                  <div
                    v-if="message.messageType === 'image'"
                    class="image-message"
                  >
                    <img
                      :src="message.messageContent"
                      alt="图片"
                      @click="() => previewImage(message)"
                    />
                  </div>

                  <!-- 文件消息 -->
                  <div
                    v-if="message.messageType === 'file'"
                    class="file-message"
                  >
                    <div class="file-icon">📎</div>
                    <div class="file-info">
                      <div class="file-name">
                        {{ getFileName(message.messageContent) }}
                      </div>
                      <div class="file-size">
                        {{ getFileSize(message.messageContent) }}
                      </div>
                    </div>
                  </div>

                  <!-- 消息状态和时间 -->
                  <div class="message-meta">
                    <span class="message-time">{{
                      formatTime(message.sendTime)
                    }}</span>
                    <span v-if="message.isSentByMe" class="message-status">
                      <span v-if="message.messageStatus === 0">🕐</span>
                      <span v-else-if="message.messageStatus === 1">✓</span>
                      <span v-else-if="message.messageStatus === 2">✓✓</span>
                      <span v-else-if="message.messageStatus === 3">✓✓</span>
                      <span v-else-if="message.messageStatus === 4">❌</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息输入区域 - 始终在最底部 -->
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

    <!-- 空状态 -->
    <div v-if="!isLoading && !messages.length && convId" class="chat-empty">
      <div class="empty-icon">💬</div>
      <p class="empty-text">开始对话</p>
      <p class="empty-hint">发送第一条消息吧</p>
    </div>

    <!-- 未选择会话状态 -->
    <div v-if="!convId" class="no-conversation">
      <div class="placeholder-icon">💭</div>
      <p class="placeholder-text">选择一个会话以开始聊天</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useMessageStore } from "@/stores/chat/message";
import { useAuthStore } from "@/stores/auth";

export default {
  name: "ChatContainer",

  props: {
    convId: {
      type: [Number, Object],
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
    isGroup: {
      type: Boolean,
      default: false,
    },
    showBackButton: {
      type: Boolean,
      default: false,
    },
  },

  emits: [
    "back",
    "search",
    "menu",
    "attach-file",
    "attach-image",
    "emoji-picker",
  ],

  setup(props, { emit }) {
    // 使用 Store
    const messageStore = useMessageStore();
    const authStore = useAuthStore();

    // 本地状态
    const inputMessage = ref("");
    const isOnline = ref(true);
    const messagesContainer = ref(null);
    const messageInput = ref(null);

    // 缓存发送者信息
    const senderCache = ref({});

    // 计算属性
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
      if (props.isGroup) {
        return "群聊";
      }
      return isOnline.value ? "在线" : "离线";
    });

    // 从 Store 获取消息和加载状态
    const messages = computed(() => messageStore.formattedMessages || []);
    const isLoading = computed(() => messageStore.isLoading || false);

    // 按日期分组消息
    const groupedMessages = computed(() => {
      const groups = [];
      let currentDate = "";

      messages.value.forEach((message) => {
        if (!message || !message.sendTime) return;

        const messageDate = message.sendTime.split("T")[0];

        if (messageDate !== currentDate) {
          currentDate = messageDate;
          groups.push({ date: messageDate, messages: [] });
        }

        groups[groups.length - 1].messages.push(message);
      });

      return groups;
    });

    // 获取发送者信息
    const getSenderName = (senderId) => {
      // 先从缓存中获取
      if (senderCache.value[senderId]) {
        return senderCache.value[senderId].name;
      }

      // 如果是当前用户
      if (senderId === currentUserId.value) {
        return "我";
      }

      const defaultName = `用户${senderId}`;

      // 添加到缓存
      senderCache.value[senderId] = {
        name: defaultName,
        initial: defaultName.charAt(0),
      };

      return defaultName;
    };

    const getSenderInitial = (senderId) => {
      if (senderId === currentUserId.value) return "我";

      if (senderCache.value[senderId]) {
        return senderCache.value[senderId].initial;
      }

      const name = getSenderName(senderId);
      return name.charAt(0);
    };

    // 文件相关辅助函数
    const getFileName = (fileContent) => {
      try {
        const fileInfo = JSON.parse(fileContent);
        return fileInfo.name || "未知文件";
      } catch {
        return "文件";
      }
    };

    const getFileSize = (fileContent) => {
      try {
        const fileInfo = JSON.parse(fileContent);
        if (fileInfo.size) {
          const sizeInMB = fileInfo.size / (1024 * 1024);
          return sizeInMB > 1
            ? `${sizeInMB.toFixed(2)} MB`
            : `${(fileInfo.size / 1024).toFixed(2)} KB`;
        }
      } catch {
        return "";
      }
      return "";
    };

    // 方法
    const loadMessages = async (reset = true) => {
      if (!props.convId) return;

      try {
        await messageStore.loadMessages(props.convId, reset);

        // 标记消息为已读
        // if (messages.value.length > 0) {
        //   await messageStore.markAsRead(props.convId);
        // }

        scrollToBottom();
      } catch (error) {
        console.error("加载消息失败:", error);
      }
    };

    const sendMessage = async () => {
      if (!canSend.value || !props.convId || !currentUserId.value) return;

      const messageContent = inputMessage.value.trim();
      if (!messageContent) return;

      const result = await messageStore.sendMessage(
        props.convId,
        messageContent,
        "text"
      );

      if (result) {
        inputMessage.value = "";
        scrollToBottom();

        // 重置输入框高度
        if (messageInput.value) {
          messageInput.value.style.height = "auto";
        }
      }
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop =
            messagesContainer.value.scrollHeight;
        }
      });
    };

    const formatTime = (timeString) => {
      try {
        const date = new Date(timeString);
        return date.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } catch (error) {
        return "未知时间";
      }
    };

    const formatDateDivider = (dateString) => {
      try {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
          return "今天";
        } else if (date.toDateString() === yesterday.toDateString()) {
          return "昨天";
        } else {
          return date.toLocaleDateString("zh-CN", {
            month: "long",
            day: "numeric",
          });
        }
      } catch (error) {
        return dateString;
      }
    };

    const previewImage = (message) => {
      console.log("预览图片:", message);
    };

    const handleBack = () => {
      emit("back");
    };

    const handleSearch = () => {
      emit("search");
    };

    const handleMenu = () => {
      emit("menu");
    };

    const attachFile = () => {
      emit("attach-file");
    };

    const attachImage = () => {
      emit("attach-image");
    };

    const showEmojiPicker = () => {
      emit("emoji-picker");
    };

    const newLine = () => {
      inputMessage.value += "\n";
    };

    // 监听会话ID变化
    watch(
      () => props.convId,
      (newConvId, oldConvId) => {
        console.log(`会话变化: ${oldConvId} -> ${newConvId}`);

        // 清空发送者缓存
        senderCache.value = {};

        if (newConvId) {
          // 切换到新的会话，重新加载消息
          loadMessages(true);
        } else {
          // 清空消息
          messageStore.clearMessages();
        }
      },
      { immediate: true }
    );

    // 自动调整输入框高度
    watch(inputMessage, () => {
      nextTick(() => {
        if (messageInput.value) {
          messageInput.value.style.height = "auto";
          const newHeight = Math.min(messageInput.value.scrollHeight, 120);
          messageInput.value.style.height = `${newHeight}px`;
        }
      });
    });

    // 组件挂载时添加滚动监听
    onMounted(() => {
      if (messagesContainer.value) {
        messagesContainer.value.addEventListener("scroll", () => {});
      }
    });

    // 组件卸载时移除监听
    onUnmounted(() => {
      if (messagesContainer.value) {
        messagesContainer.value.removeEventListener("scroll", () => {});
      }
      messageStore.clearMessages();
    });

    return {
      // 状态
      messages,
      inputMessage,
      isLoading,
      isOnline,
      messagesContainer,
      messageInput,
      currentUserId,

      // 计算属性
      firstChar,
      canSend,
      conversationStatus,
      groupedMessages,

      // 方法
      sendMessage,
      formatTime,
      formatDateDivider,
      previewImage,
      getSenderName,
      getSenderInitial,
      getFileName,
      getFileSize,
      handleBack,
      handleSearch,
      handleMenu,
      attachFile,
      attachImage,
      showEmojiPicker,
      newLine,
      scrollToBottom,
    };
  },
};
</script>

<style scoped>
/* 引入外部CSS */
@import "@/assets/styles/chat-container.css";
</style>