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
import { useShowMessageStore } from "@/stores/chat/show-message";
import { useFriendStore } from "@/stores/friend/show-friend";
import type { DisplayMessage } from "@/entity/message";

interface Props {
  message: DisplayMessage;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const showMessageStore = useShowMessageStore();
const friendStore = useFriendStore();

const isSentByMe = computed(() => props.message.isSentByMe);

// 依赖好友列表，使修改备注后消息中的对方名称实时更新（优先级：群昵称 > 好友备注 > 用户昵称）
const displayName = computed(() => {
  void friendStore.friends;
  return showMessageStore.getSenderDisplayName(props.message);
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