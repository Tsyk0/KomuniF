<!-- File: src/components/ConversationItem.vue -->
<template>
  <div
    class="conversation-item"
    :class="{ active: isActive }"
    @click="handleClick"
    v-ripple
  >
    <div class="avatar-container">
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

    <div class="conversation-info">
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConversationDisplay } from "@/capabilities/show-display-avatar";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import type { ConversationDetailDTO } from "@/types/dto/conversation";
import { useAuthStore } from "@/stores/auth";
import { useFriendStore } from "@/stores/friend/show-friend";
import { displayNameResolver } from "@/capabilities/show-display-name";

interface Props {
  conversation: ConversationDetailDTO;
  isActive?: boolean;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const friendStore = useFriendStore();

const { displayName, avatar } = useConversationDisplay(() => props.conversation);

const processedAvatar = computed(() => normalizeAvatarUrl(avatar.value));

const avatarText = computed(() => {
  const name = displayName.value || "";
  return name.charAt(0).toUpperCase() || "?";
});

const lastMessageContent = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  if (!lastMsg || !lastMsg.messageContent) return "[No messages]";

  const content = lastMsg.messageContent;
  if (content.length > 30) {
    return `${content.substring(0, 30)}...`;
  }
  return content;
});

const lastMessageSender = computed(() => {
  const lastMsg = props.conversation.lastMessage;
  if (!lastMsg) return "";

  if (lastMsg.senderId === authStore.user?.userId) {
    return "Me";
  }

  const friend = friendStore.friends.find(
    (f) => Number(f.friendId) === Number(lastMsg.senderId)
  );

  return displayNameResolver.messageSender({
    senderId: lastMsg.senderId,
    currentUserId: authStore.user?.userId == null ? null : authStore.user.userId,
    currentUserNickname: authStore.user?.userNickname == null ? "" : authStore.user.userNickname,
    remarkName: friend?.remarkName == null ? "" : friend.remarkName,
    userNickname: friend?.nickname == null ? "" : friend.nickname,
    fallbackName: displayNameResolver.person({
      userNickname: lastMsg.senderDisplayName,
      fallbackName: `User ${lastMsg.senderId}`,
    }),
  });
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

const showSenderName = computed(() => {
  return props.conversation.convType === 2; // group chat
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