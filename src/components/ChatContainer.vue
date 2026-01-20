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
              <!-- 头像区域（左右侧根据发送方向） -->
              <div
                v-if="message.isFirstInGroup"
                class="avatar-area"
                :class="{ 'avatar-right': message.isSentByMe }"
              >
                <!-- ⭐ member_nickname 显示在头像上方 -->
                <div class="member-nickname">
                  {{ getSenderName(message.senderId) }}
                </div>

                <!-- 头像 -->
                <div class="message-avatar">
                  <div class="avatar-small">
                    <img
                      v-if="getSenderAvatar(message.senderId)"
                      :src="getSenderAvatar(message.senderId)"
                      :alt="getSenderName(message.senderId)"
                    />
                    <span v-else>{{ getSenderInitial(message.senderId) }}</span>
                  </div>
                </div>
              </div>

              <!-- 消息内容区域 -->
              <div class="message-content-wrapper">
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
                </div>

                <!-- ⭐ 时间显示在消息气泡下方 -->
                <div class="message-time">
                  {{ formatFullTime(message.sendTime) }}
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

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useMessageStore } from "@/stores/chat/message";
import { useAuthStore } from "@/stores/auth";

// ============ Store 和 Props ============
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
  conversationMembers: {
    type: Array,
    default: () => [],
  },
  isGroup: {
    type: Boolean,
    default: false,
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
const messagesContainer = ref(null);
const messageInput = ref(null);
const inputMessage = ref("");
const isOnline = ref(true);
const senderCache = ref({});

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
  if (props.isGroup) {
    return "群聊";
  }
  return isOnline.value ? "在线" : "离线";
});

const messages = computed(() => messageStore.formattedMessages || []);
const isLoading = computed(() => messageStore.isLoading || false);

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

// ============ 方法定义 ============

// 获取发送者头像
const getSenderAvatar = (senderId) => {
  // 优先从会话成员中获取
  if (props.conversationMembers && props.conversationMembers.length > 0) {
    const member = props.conversationMembers.find((m) => m.userId === senderId);
    if (member && member.avatar) {
      return member.avatar;
    }
    if (member && member.userAvatar) {
      return member.userAvatar;
    }
  }

  // 从缓存中获取
  if (senderCache.value[senderId] && senderCache.value[senderId].avatar) {
    return senderCache.value[senderId].avatar;
  }

  return null;
};

// 获取发送者名字
const getSenderName = (senderId) => {
  // 优先使用 member_nickname
  if (props.conversationMembers && props.conversationMembers.length > 0) {
    const member = props.conversationMembers.find((m) => m.userId === senderId);
    if (member && member.memberNickname) {
      return member.memberNickname;
    }
    if (member && member.nickname) {
      return member.nickname;
    }
    if (member && member.userNickname) {
      return member.userNickname;
    }
  }

  // 如果是当前用户
  if (senderId === currentUserId.value) {
    return "我";
  }

  // 从缓存中获取
  if (senderCache.value[senderId]) {
    return senderCache.value[senderId].name;
  }

  const defaultName = `用户${senderId}`;
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

// 完整时间格式化
const formatFullTime = (timeString) => {
  try {
    const date = new Date(timeString);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day}/${hour}:${minute}`;
  } catch (error) {
    console.error("时间格式化错误:", error);
    return "未知时间";
  }
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

// 文件相关
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

// 消息操作
const loadMessages = async () => {
  if (!props.convId) return;

  try {
    const convId = Number(props.convId);
    if (isNaN(convId)) {
      console.error("无效的会话ID:", props.convId);
      return;
    }

    await messageStore.loadMessages(convId);
    scrollToBottom();
  } catch (error) {
    console.error("加载消息失败:", error);
  }
};

const sendMessage = async () => {
  if (!canSend.value || !props.convId || !currentUserId.value) return;

  const messageContent = inputMessage.value.trim();
  if (!messageContent) return;

  const convId = Number(props.convId);
  const result = await messageStore.sendMessage(convId, messageContent, "text");

  if (result) {
    inputMessage.value = "";
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const previewImage = (message) => {
  console.log("预览图片:", message);
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

// ============ 生命周期和监听器 ============
watch(
  () => props.convId,
  (newConvId, oldConvId) => {
    console.log(`会话变化: ${oldConvId} -> ${newConvId}`);
    senderCache.value = {};
    if (newConvId) {
      loadMessages();
    } else {
      messageStore.clearMessages();
    }
  },
  { immediate: true }
);

watch(inputMessage, () => {
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.style.height = "auto";
      const newHeight = Math.min(messageInput.value.scrollHeight, 120);
      messageInput.value.style.height = `${newHeight}px`;
    }
  });
});

onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener("scroll", () => {});
  }
});

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener("scroll", () => {});
  }
  messageStore.clearMessages();
});
</script>

<style scoped>
/* 引入外部CSS */
@import "@/assets/styles/chat-container.css";
</style>