<template>
  <div
    class="friend-item-container"
    :class="{ active: isActive }"
    @click="handleClick"
    v-ripple
  >
    <!-- 头像 -->
    <div class="friend-item-avatar">
      <img
        v-if="friend.avatar"
        :src="friend.avatar"
        :alt="displayName"
        class="friend-item-avatar-img"
      />
      <div v-else class="friend-item-avatar-default">
        {{ displayName.charAt(0) }}
      </div>
      <span class="friend-item-online-dot" :class="friend.onlineStatus"></span>
    </div>

    <!-- 好友信息 -->
    <div class="friend-item-info">
      <div class="friend-item-name-row">
        <span class="friend-item-name">{{ displayName }}</span>
        <span v-if="friend.unreadCount" class="friend-item-unread">
          {{ friend.unreadCount }}
        </span>
      </div>
      <div class="friend-item-details">
        <span class="friend-item-signature" v-if="friend.signature">
          {{ friend.signature }}
        </span>
        <span v-else-if="friend.lastSeen" class="friend-item-last-seen">
          {{ friend.lastSeen }}
        </span>
        <span v-else class="friend-item-nickname">
          {{ friend.nickname }}
        </span>
      </div>
    </div>

    <!-- 操作按钮（悬停时显示） -->
    <div class="friend-item-actions">
      <button
        class="friend-item-action-btn"
        title="发送消息"
        @click.stop="handleSendMessage"
      >
        💬
      </button>
      <button
        class="friend-item-action-btn more"
        title="更多操作"
        @click.stop="handleMoreActions"
      >
        ⋯
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FriendListItem } from "@/types/dto/friend";

type FriendItemData = FriendListItem & {
  unreadCount?: number;
  lastSeen?: string;
  isSpecialCare?: boolean;
  isVip?: boolean;
};

const props = defineProps<{
  friend: FriendItemData;
  isActive?: boolean;
}>();

const emit = defineEmits<{
  click: [friend: any];
  "send-message": [friend: any];
  "more-actions": [friend: any];
}>();

const displayName = computed(() => {
  return props.friend.remarkName || props.friend.nickname;
});

const isActive = computed(() => {
  return Boolean(props.isActive);
});

const handleClick = () => {
  emit("click", props.friend);
};

const handleSendMessage = () => {
  emit("send-message", props.friend);
};

const handleMoreActions = () => {
  emit("more-actions", props.friend);
};
</script>

<style scoped>
/* 这里不需要引入CSS，因为FriendList组件已经引入了 */
@import "@/assets/styles/friend-item.css";
@import "@/assets/styles/night/friend-item-night.css";
</style>