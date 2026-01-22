<template>
  <div
    class="conversation-item"
    :class="{ active: isActive, 'has-unread': conversation.unreadCount > 0 }"
    @click="handleClick"
  >
    <!-- 头像 -->
    <div class="avatar-container">
      <img
        v-if="conversation.convAvatar"
        :src="processedAvatar"
        alt="头像"
        class="avatar-img"
        @error="handleAvatarError"
      />
      <div v-else class="avatar-placeholder">
        {{ avatarText }}
      </div>

      <!-- 在线状态指示器（单聊时显示）- 暂时移除 -->
      <!-- <div v-if="showOnlineStatus" class="online-indicator" :class="{ online: isOnline }"></div> -->

      <!-- 未读消息计数 -->
      <div v-if="conversation.unreadCount > 0" class="unread-badge">
        {{ unreadDisplay }}
      </div>
    </div>

    <!-- 会话信息 -->
    <div class="conversation-info">
      <div class="conversation-header">
        <span class="conversation-name">{{ conversation.convName }}</span>
        <span class="conversation-time">{{ lastMessageTime }}</span>
      </div>

      <div class="conversation-preview">
        <div class="message-preview">
          <!-- 发送者名称（群聊显示） -->
          <span v-if="showSenderName" class="sender-name">
            {{ lastMessageSender }}:
          </span>

          <!-- 消息预览 -->
          <span class="message-content">
            {{ lastMessageContent }}
          </span>
        </div>

        <!-- 消息状态指示器 - 暂时移除 -->
        <!-- <div v-if="showMessageStatus" class="message-status">
          <el-icon v-if="lastMessageStatus === 'sent'"><Check /></el-icon>
          <el-icon v-if="lastMessageStatus === 'read'"><Check /></el-icon>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
// 移除Check图标的导入，因为暂时不需要
// import { ElIcon } from 'element-plus';
// import { Check } from '@element-plus/icons-vue';

// 修复dayjs导入方式
import * as dayjs from "dayjs";
import type { ConversationDetailDTO } from "@/types/form/conversation-detail";

interface Props {
  conversation: ConversationDetailDTO;
  isActive?: boolean;
}

const props = defineProps<Props>();

// 处理头像URL
const processedAvatar = computed(() => {
  if (!props.conversation.convAvatar) return "";
  return processAvatarUrl(props.conversation.convAvatar);
});

// 头像占位符文本
const avatarText = computed(() => {
  const name = props.conversation.convName || "";
  return name.charAt(0).toUpperCase() || "?";
});

// 最后一条消息内容
const lastMessageContent = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  if (!lastMsg || !lastMsg.messageContent) return "[空消息]";

  // 简化消息内容（截断过长的文本）
  const content = lastMsg.messageContent;
  if (content.length > 30) {
    return content.substring(0, 30) + "...";
  }
  return content;
});

// 最后一条消息发送者名称
const lastMessageSender = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  if (!lastMsg) return "";

  // 如果是自己发送的消息
  const authStore = useAuthStore();
  if (lastMsg.senderId === authStore.user?.userId) {
    return "我";
  }

  return lastMsg.senderDisplayName || `用户${lastMsg.senderId}`;
});

// 最后一条消息时间
const lastMessageTime = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  const timeStr = lastMsg?.sendTime || props.conversation.updateTime;

  if (!timeStr) return "";

  try {
    const time = dayjs(timeStr);
    const now = dayjs();

    // 今天：显示时间
    if (time.isSame(now, "day")) {
      return time.format("HH:mm");
    }

    // 昨天：显示"昨天"
    if (time.isSame(now.subtract(1, "day"), "day")) {
      return "昨天";
    }

    // 一周内：显示星期几
    if (time.isAfter(now.subtract(7, "day"))) {
      return time.format("ddd");
    }

    // 更早：显示日期
    return time.format("MM-DD");
  } catch (e) {
    console.error("时间格式化错误:", e);
    return "";
  }
});

// 是否需要显示发送者名称（群聊显示）
const showSenderName = computed(() => {
  return props.conversation.convType === 2; // 群聊
});

// 未读消息显示
const unreadDisplay = computed(() => {
  const count = props.conversation.unreadCount || 0;
  if (count > 99) return "99+";
  return count.toString();
});

// 在线状态（单聊时显示）- 暂时移除
// const showOnlineStatus = computed(() => {
//   return props.conversation.convType === 1; // 单聊
// });

// const isOnline = computed(() => {
//   // 这里需要从用户状态获取，暂时返回false
//   return false;
// });

// 消息状态相关 - 暂时移除
// const showMessageStatus = computed(() => {
//   // 只有自己发送的消息才显示状态
//   const authStore = useAuthStore();
//   const lastMsg = props.conversation.lastMessage;
//   return lastMsg?.senderId === authStore.user?.userId;
// });

// const lastMessageStatus = computed(() => {
//   // 这里需要从消息状态获取，暂时返回'sent'
//   return 'sent';
// });

// 处理头像加载错误
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};

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

// 点击事件
const emit = defineEmits<{
  (event: "click", convId: number): void;
}>();

const handleClick = () => {
  emit("click", props.conversation.convId);
};

// 需要导入auth store
import { useAuthStore } from "@/stores/auth";
</script>

<style scoped>
@import "@/assets/styles/conversationitem.css";
</style>