<template>
  <div class="message-item" :class="{ 'message-sent': message.isSentByMe }">
    <!-- 发送方（别人）显示在左侧 -->
    <div v-if="!message.isSentByMe" class="message-left">
      <div class="avatar-area avatar-left">
        <img
          v-if="message.senderAvatar && message.senderAvatar !== ''"
          :src="message.senderAvatar"
          alt="头像"
          class="avatar-img"
          @error="handleAvatarError"
        />
        <div v-else class="avatar-placeholder">
          {{ message.senderName?.charAt(0) || "?" }}
        </div>
      </div>
      <div class="message-content">
        <div class="sender-name">{{ message.senderName }}</div>
        <div
          class="message-bubble received"
          :class="{ 'night-mode': themeStore.isDarkMode }"
        >
          <div class="bubble-content">{{ message.messageContent }}</div>
          <!-- 时间位置预留 -->
        </div>
      </div>
    </div>

    <!-- 接收方（自己）显示在右侧 -->
    <div v-else class="message-right">
      <div class="message-content">
        <div class="sender-name self">{{ message.senderName }}</div>
        <div
          class="message-bubble sent"
          :class="{ 'night-mode': themeStore.isDarkMode }"
        >
          <div class="bubble-content">{{ message.messageContent }}</div>
          <!-- 时间位置预留 -->
        </div>
      </div>
      <div class="avatar-area avatar-right">
        <img
          v-if="authStore.user?.userAvatar"
          :src="processAvatarUrl(authStore.user.userAvatar)"
          alt="头像"
          class="avatar-img"
          @error="handleAvatarError"
        />
        <div v-else class="avatar-placeholder">
          {{ authStore.user?.userNickname?.charAt(0) || "我" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import type { ChatMessage } from "@/entity/chat-message";

interface Props {
  message: ChatMessage;
}

// @ts-ignore - Vetur误报，defineProps在<script setup>中可用
const props = defineProps<{
  message: ChatMessage;
}>();

const authStore = useAuthStore();
const themeStore = useThemeStore();

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};

// 处理头像URL（与HomeView一致）
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
</script>

<style scoped>
.message-item {
  display: flex;
  margin-bottom: 12px;
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
}

/* 消息内容区域 */
.message-content {
  max-width: 70%;
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
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
  word-wrap: break-word;
  max-width: 100%;
}

.message-bubble.received {
  background: #f0f0f0;
  color: #000;
  align-self: flex-start;
}

.message-bubble.sent {
  background: #0084ff;
  color: #fff;
  align-self: flex-end;
}

/* 消息气泡 - 夜间模式 */
.message-bubble.received.night-mode {
  background: #2d2d2d;
  color: #e0e0e0;
}

.message-bubble.sent.night-mode {
  background: #005cbf;
  color: #fff;
}

/* 发送者名字 - 夜间模式 */
:global(.night-mode) .sender-name {
  color: #aaa;
}

/* 气泡内容 */
.bubble-content {
  font-size: 14px;
  line-height: 1.4;
}
</style>