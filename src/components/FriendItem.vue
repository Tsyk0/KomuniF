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
        v-if="avatarSrc"
        :src="avatarSrc"
        :alt="displayRemarkName"
        class="friend-item-avatar-img"
      />
      <div v-else class="friend-item-avatar-default">
        {{ displayRemarkName.charAt(0) }}
      </div>
      <span class="friend-item-online-dot" :class="friend.onlineStatus"></span>
    </div>

    <!-- 好友信息 -->
    <div class="friend-item-info">
      <div class="friend-item-name-row">
        <span class="friend-item-remarkname">{{ displayRemarkName }}</span>
        <span v-if="friend.unreadCount" class="friend-item-unread">
          {{ friend.unreadCount }}
        </span>
      </div>
      <div class="friend-item-details">
        <span class="friend-item-nickname" v-if="friend.nickname">
          {{ friend.nickname }}
        </span>
        <span v-else-if="friend.lastSeen" class="friend-item-last-seen">
          {{ friend.lastSeen }}
        </span>
        <span v-else class="friend-item-nickname">
          {{ friend.displayName }}
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
        &#128172;
      </button>
      <button
        class="friend-item-action-btn more"
        title="更多操作"
        @click.stop="handleMoreActions"
      >
        &#8943;
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FriendListItem } from "@/types/dto/friend";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";

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

const displayRemarkName = computed(() => {
  return props.friend.displayName || props.friend.nickname || "未知用户";
});

const avatarSrc = computed(() => normalizeAvatarUrl(props.friend.avatar));

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
/* 这里不需要引入 CSS，因为 FriendList 组件已经引入。 */
@import "@/assets/styles/friend-item.css";
@import "@/assets/styles/night/friend-item-night.css";
</style>