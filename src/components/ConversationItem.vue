<!-- File: src/components/ConversationItem.vue -->
<!-- 结构约定：*-item 最外层（卡片/ripple）→ *-item-container 行内布局与内边距 → *-item-*-wrapper 各内容块 -->
<template>
  <div
    class="conversation-item"
    :class="{ active: isActive }"
    @click="handleClick"
    v-ripple="{ rippleOpts }"
  >
    <div class="conversation-item-container">
      <div class="conversation-item-avatar-wrapper">
        <img
          v-if="processedAvatar"
          :src="processedAvatar"
          alt="avatar"
          class="avatar-img"
          @error="handleAvatarError"
        />
        <div v-else class="avatar-placeholder">
          {{ avatarText }}
        </div>

        <!-- <div v-if="showOnlineStatus" class="online-indicator" :class="{ online: isOnline }"></div> -->
      </div>

      <div class="conversation-item-info-wrapper">
        <div class="conversation-header">
          <span class="conversation-name">{{ displayName }}</span>
          <span class="conversation-time">{{ lastMessageTime }}</span>
        </div>

        <div class="conversation-preview">
          <div class="message-preview">
            <span v-if="showSenderName" class="sender-name">
              {{ lastMessageSender }}:
            </span>

            <span class="message-content">
              {{ lastMessageContent }}
            </span>
          </div>

          <!-- <div v-if="showMessageStatus" class="message-status">
          <el-icon v-if="lastMessageStatus === 'sent'"><Check /></el-icon>
          <el-icon v-if="lastMessageStatus === 'read'"><Check /></el-icon>
        </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/** 与侧栏统一列表项 CSS 变量 --sli-ripple-color 对齐的点击水波纹（日间略深天蓝、夜间由变量覆盖为紫）。 */
const rippleOpts = { color: "var(--sli-ripple-color)", duration: 520 };
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { getConversationDisplayName } from "@/commons/utils/conversation-display";
import { resolveLastMessageSenderLabel } from "@/commons/utils/conversation-last-message-sender";
import type {
  ConversationSummaryDTO,
  LastMessageInfo,
} from "@/types/dto/conversation";
import { useUserStore } from "@/store/user/user";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConvStore } from "@/store/conv/conv";

interface Props {
  conversation: ConversationSummaryDTO;
  isActive?: boolean;
}

const props = defineProps<Props>();
const authStore = useUserStore();
const friendStore = useFriendStore();
const convStore = useConvStore();

const displayName = computed(() => {
  return getConversationDisplayName(props.conversation);
});

const avatar = computed(() => {
  return props.conversation.convAvatar || "";
});

const processedAvatar = computed(() => normalizeAvatarUrl(avatar.value));

const avatarText = computed(() => {
  const name = displayName.value || "";
  return name.charAt(0).toUpperCase() || "?";
});

/**
 * 从文件类消息的 messageContent JSON 中取出 fileName（含后缀）；解析失败时返回 null。
 * 使用场景：会话列表最后一条为 file 类型时生成「[文件名]」预览。
 */
function parseFileNameFromMessageContent(messageContent: string): string | null {
  try {
    const payload = JSON.parse(messageContent) as { fileName?: string };
    const name = payload.fileName?.trim();
    return name && name.length > 0 ? name : null;
  } catch {
    return null;
  }
}

/**
 * 过长文件名中间截断，尽量保留扩展名以便辨认类型。
 * 使用场景：会话列表文件预览，避免单行撑爆布局。
 */
function truncateFileNameForPreview(fileName: string, maxLen = 36): string {
  if (fileName.length <= maxLen) return fileName;
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0) return `${fileName.slice(0, maxLen - 1)}…`;
  const ext = fileName.slice(lastDot);
  const base = fileName.slice(0, lastDot);
  const budget = maxLen - ext.length - 1;
  if (budget < 1) return `${fileName.slice(0, maxLen - 1)}…`;
  return `${base.slice(0, budget)}…${ext}`;
}

/**
 * 根据 messageType / messageContent 生成会话列表「消息预览」纯文案（不含发送者前缀）。
 * 使用场景：ConversationItem 中 lastMessage 摘要展示；与 showSenderName 组合成「发送者：[图片]」等形式。
 */
function buildLastMessagePreviewBody(lastMsg: LastMessageInfo): string {
  if (!lastMsg.messageContent) return "[No messages]";

  const type = (lastMsg.messageType || "text").toLowerCase();

  if (type === "image") return "[图片]";
  if (type === "video") return "[视频]";
  if (type === "file") {
    const fileName =
      parseFileNameFromMessageContent(lastMsg.messageContent) ?? "文件";
    const displayName = truncateFileNameForPreview(fileName);
    return `[${displayName}]`;
  }

  const content = lastMsg.messageContent;
  if (content.length > 30) {
    return `${content.substring(0, 30)}...`;
  }
  return content;
}

const lastMessageContent = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  if (!lastMsg) return "[No messages]";
  return buildLastMessagePreviewBody(lastMsg);
});

const lastMessageSender = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  if (!lastMsg) return "";
  return resolveLastMessageSenderLabel(
    lastMsg,
    friendStore.friends,
    authStore.user?.userId,
    {
      convType: props.conversation.convType,
      conversationMembers: convStore.compressedCMMap.get(props.conversation.convId),
    }
  );
});

const lastMessageTime = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  const timeStr = lastMsg?.sendTime || props.conversation.updateTime;

  if (!timeStr) return "";

  try {
    const timeMatch = timeStr.match(/\s(\d{2}:\d{2})$/);
    if (timeMatch) {
      return timeMatch[1];
    }

    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    return timeStr;
  } catch (e) {
    console.error("Failed to parse message time:", e);
    return "";
  }
});

/** 是否在预览中展示发送者前缀；群聊且最后一条不是自己发送时才展示。用于 ConversationItem 模板 */
const showSenderName = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  if (props.conversation.convType !== 2 || !lastMsg) return false;
  const myId = authStore.user?.userId;
  if (myId === undefined || myId === null) return true;
  return Number(lastMsg.senderId) !== Number(myId);
});

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};

const emit = defineEmits<{
  (event: "click", convId: number): void;
}>();

const handleClick = () => {
  emit("click", props.conversation.convId);
};
</script>

<style scoped>
@import "@/assets/styles/conversation-item.css";
</style>
