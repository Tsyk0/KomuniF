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
  // 统一使用 senderName 字段，确保昵称显示一致性
  return (
    props.message.senderName || // 优先使用解析后的 senderName
    (isSentByMe.value ? authStore.user?.userNickname || "我" : undefined) || // 发送者自己使用用户昵称
    `用户${props.message.senderId}`
  );
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
@import "@/assets/styles/message-item.css";
</style>