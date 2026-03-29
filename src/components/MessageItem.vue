<template>
  <div class="message-item" :data-message-id="String(message.messageId)">
    <!-- 他人发送的消息 -->
    <div v-if="!isSentByMe" class="message-wrapper message-left">
      <div class="avatar-section left">
        <div class="avatar-placeholder"></div>
        <div class="display-name">{{ displayName }}</div>
      </div>

      <div
        class="message-bubble received"
        :class="{ 'message-bubble--flash': flashAnchor }"
      >
        <div
          v-if="flashAnchor"
          class="message-bubble-flash-layer"
          aria-hidden="true"
        />
        <div class="message-text">{{ message.messageContent }}</div>
        <div class="message-time">{{ formatTime(message.sendTime) }}</div>
      </div>
    </div>

    <!-- 自己发送的消息 -->
    <div v-else class="message-wrapper message-right">
      <div
        class="message-bubble sent"
        :class="{ 'message-bubble--flash': flashAnchor }"
      >
        <div
          v-if="flashAnchor"
          class="message-bubble-flash-layer"
          aria-hidden="true"
        />
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
import { useShowMessageStore } from "@/stores/chat/show-message";
import { useFriendStore } from "@/stores/friend/show-friend";
import type { DisplayMessage } from "@/entity/message";

interface Props {
  message: DisplayMessage;
  /** 搜索跳转锚点：灰色与默认背景交替闪烁约 3 秒 */
  flashAnchor?: boolean;
}

const props = defineProps<Props>();
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

/* 搜索锚点：叠在气泡上的蒙层，只改 opacity。
 * 使用「每周期 0→亮→0」+ 偶数次 repeat + forwards，避免 alternate+偶数次停在 from 上导致结束时仍较亮、移除时突兀 */
@keyframes message-bubble-anchor-flash {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.38;
  }
  100% {
    opacity: 0;
  }
}

.message-bubble.message-bubble--flash {
  position: relative;
}

.message-bubble-flash-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: rgb(0 0 0 / 1);
  opacity: 0;
  animation: message-bubble-anchor-flash 0.5s ease-in-out 6 forwards;
}

.message-bubble.message-bubble--flash .message-text {
  position: relative;
  z-index: 2;
}

/* 保持全局里的 position:absolute 布局，仅抬高层级盖住蒙层 */
.message-bubble.message-bubble--flash .message-time {
  z-index: 2;
}
</style>