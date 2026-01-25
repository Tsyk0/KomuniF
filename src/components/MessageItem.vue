<template>
  <div class="message-item">
    <!-- 他人发送的消息 -->
    <div v-if="!isSentByMe" class="message-wrapper message-left">
      <div class="avatar-section left">
        <div class="avatar-placeholder"></div>
        <div class="display-name">{{ displayName }}</div>
      </div>

      <div class="message-bubble received">
        <div class="message-text">{{ message.messageContent }}</div>
        <div class="message-time">{{ formatTime(message.sendTime) }}</div>
      </div>
    </div>

    <!-- 自己发送的消息 -->
    <div v-else class="message-wrapper message-right">
      <div class="message-bubble sent">
        <div class="message-text">{{ message.messageContent }}</div>
        <div class="message-time">{{ formatTime(message.sendTime) }}</div>
      </div>

      <div class="avatar-section right">
        <div class="avatar-placeholder"></div>
        <div class="display-name">{{ displayName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import type { DisplayMessage } from "@/entity/message"; // 修改导入

interface Props {
  message: DisplayMessage; // 修改类型
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const isSentByMe = computed(() => props.message.isSentByMe);

const displayName = computed(() => {
  if (isSentByMe.value) {
    return authStore.user?.userNickname || "我";
  } else {
    // 注意：这里需要根据您的实际字段名调整
    // 原来的 memberNickname 可能需要映射到 senderName
    return (
      props.message.senderName || // 使用 senderName
      props.message.displayName ||
      `用户${props.message.senderId}`
    );
  }
});

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  try {
    const date = new Date(timeStr);
    return (
      date.getHours().toString().padStart(2, "0") +
      ":" +
      date.getMinutes().toString().padStart(2, "0")
    );
  } catch (e) {
    console.error("时间格式化错误:", e);
    return "";
  }
};
</script>

<style scoped>
/* 导入对应主题的样式 */
@import "@/assets/styles/messageitem.css";
</style>