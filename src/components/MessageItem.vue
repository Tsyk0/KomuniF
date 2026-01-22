<template>
  <div class="message-item" :class="{ 'message-sent': message.isSentByMe }">
    <!-- 接收方（别人）消息 - 显示在左侧 -->
    <div v-if="!message.isSentByMe" class="message-left">
      <!-- 头像区域（左侧） -->
      <div class="avatar-area avatar-left">
        <img
          v-if="senderAvatar"
          :src="senderAvatar"
          alt="头像"
          class="avatar-img"
          @error="handleAvatarError"
        />
        <div v-else class="avatar-placeholder">
          {{ displayName?.charAt(0) || "?" }}
        </div>
      </div>

      <!-- 消息内容区域（右侧） -->
      <div class="message-content">
        <div class="sender-name">{{ displayName }}</div>
        <div
          class="message-bubble received"
          :class="{ 'night-mode': themeStore.isDarkMode }"
        >
          <div class="bubble-content">
            <div class="message-text">{{ message.messageContent }}</div>
            <div class="message-time">{{ formattedTime }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发送方（自己）消息 - 显示在右侧 -->
    <div v-else class="message-right">
      <!-- 消息内容区域（左侧） -->
      <div class="message-content">
        <div class="sender-name self">{{ displayName }}</div>
        <div
          class="message-bubble sent"
          :class="{ 'night-mode': themeStore.isDarkMode }"
        >
          <div class="bubble-content">
            <div class="message-text">{{ message.messageContent }}</div>
            <div class="message-time">{{ formattedTime }}</div>
          </div>
        </div>
      </div>

      <!-- 头像区域（右侧） -->
      <div class="avatar-area avatar-right">
        <img
          v-if="userAvatar"
          :src="userAvatar"
          alt="头像"
          class="avatar-img"
          @error="handleAvatarError"
        />
        <div v-else class="avatar-placeholder">
          {{ displayName?.charAt(0) || "我" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import type { MessageDetailDTO } from "@/types/form/message-detail";

// 修复dayjs导入方式
import * as dayjs from "dayjs";

interface Props {
  message: MessageDetailDTO;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const themeStore = useThemeStore();

// 格式化时间显示
const formattedTime = computed(() => {
  if (!props.message.sendTime) return "";
  try {
    return dayjs(props.message.sendTime).format("HH:mm");
  } catch (e) {
    console.error("时间格式化错误:", e);
    return "";
  }
});

// 显示名称
const displayName = computed(() => {
  // 优先使用后端计算好的displayName
  if (props.message.displayName) {
    return props.message.displayName;
  }

  // 如果是自己发送的消息
  if (props.message.isSentByMe) {
    return authStore.user?.userNickname || "我";
  }

  // 否则使用默认显示
  return (
    props.message.memberNickname ||
    props.message.privateDisplayName ||
    `用户${props.message.senderId}`
  );
});

// 发送者头像
const senderAvatar = computed(() => {
  if (!props.message.senderAvatar) return "";
  return processAvatarUrl(props.message.senderAvatar);
});

// 自己头像
const userAvatar = computed(() => {
  if (!authStore.user?.userAvatar) return "";
  return processAvatarUrl(authStore.user.userAvatar);
});

// 处理头像URL
const processAvatarUrl = (avatarUrl: string): string => {
  if (!avatarUrl || avatarUrl === "") {
    return "";
  }

  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:image/")) {
    return avatarUrl;
  }

  avatarUrl = avatarUrl.trim();

  if (!avatarUrl.startsWith("/")) {
    avatarUrl = "/" + avatarUrl;
  }

  return "http://localhost:8081" + avatarUrl;
};

// 头像加载失败处理
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};
</script>

<style scoped>
.message-item {
  display: flex;
  margin-bottom: 16px;
  padding: 0 16px;
}

/* 左侧布局 - 别人发的消息 */
.message-left {
  display: flex;
  width: 100%;
}

/* 右侧布局 - 自己发的消息 */
.message-right {
  display: flex;
  flex-direction: row-reverse;
  width: 100%;
}

/* 头像区域 */
.avatar-area {
  flex-shrink: 0;
  margin-top: 4px;
}

.avatar-left {
  margin-right: 8px;
}

.avatar-right {
  margin-left: 8px;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 夜间模式头像边框 */
:global(.night-mode) .avatar-img {
  border-color: rgba(255, 255, 255, 0.1);
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 夜间模式头像占位符 */
:global(.night-mode) .avatar-placeholder {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  border-color: rgba(255, 255, 255, 0.1);
}

/* 消息内容区域 */
.message-content {
  max-width: calc(100% - 60px); /* 减去头像和边距的宽度 */
  display: flex;
  flex-direction: column;
}

/* 发送者名字 */
.sender-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  padding: 0 4px;
}

.sender-name.self {
  text-align: right;
}

/* 消息气泡 - 日间模式 */
.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
  word-wrap: break-word;
  max-width: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-bubble.received {
  background: #f0f0f0;
  color: #000;
  align-self: flex-start;
  border-top-left-radius: 4px;
}

.message-bubble.sent {
  background: #0084ff;
  color: #fff;
  align-self: flex-end;
  border-top-right-radius: 4px;
}

/* 消息气泡 - 夜间模式 */
.message-bubble.received.night-mode {
  background: #2d2d2d;
  color: #e0e0e0;
  border-top-left-radius: 4px;
}

.message-bubble.sent.night-mode {
  background: #005cbf;
  color: #fff;
  border-top-right-radius: 4px;
}

/* 气泡内容容器 */
.bubble-content {
  position: relative;
  min-height: 20px;
}

/* 消息文本 */
.message-text {
  font-size: 14px;
  line-height: 1.5;
  padding-bottom: 18px; /* 为时间显示留出空间 */
}

/* 消息时间 */
.message-time {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 11px;
  opacity: 0.7;
  padding-left: 8px;
  white-space: nowrap;
}

/* 发送方时间颜色 */
.message-bubble.sent .message-time {
  color: rgba(255, 255, 255, 0.8);
}

/* 接收方时间颜色 */
.message-bubble.received .message-time {
  color: #666;
}

/* 夜间模式时间颜色 */
:global(.night-mode) .message-bubble.received .message-time {
  color: #aaa;
}

/* 发送者名字 - 夜间模式 */
:global(.night-mode) .sender-name {
  color: #aaa;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .message-item {
    padding: 0 12px;
  }

  .avatar-img,
  .avatar-placeholder {
    width: 36px;
    height: 36px;
  }

  .avatar-left {
    margin-right: 6px;
  }

  .avatar-right {
    margin-left: 6px;
  }

  .message-content {
    max-width: calc(100% - 50px);
  }

  .message-bubble {
    padding: 8px 12px;
  }

  .message-text {
    font-size: 13px;
  }

  .message-time {
    font-size: 10px;
  }
}
</style>