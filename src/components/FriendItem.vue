<!-- src/components/FriendItem.vue -->
<template>
  <div class="friend-item" @click="handleClick">
    <!-- 头像 -->
    <div class="friend-avatar">
      <img
        v-if="friend.avatar"
        :src="friend.avatar"
        :alt="displayName"
        class="avatar-img"
      />
      <div v-else class="avatar-default">
        {{ displayName.charAt(0) }}
      </div>
      <span class="online-dot" :class="friend.onlineStatus"></span>
    </div>

    <!-- 好友信息 -->
    <div class="friend-info">
      <div class="friend-name-row">
        <span class="friend-name">{{ displayName }}</span>
        <span v-if="friend.unreadCount" class="unread-badge">
          {{ friend.unreadCount }}
        </span>
      </div>
      <div class="friend-details">
        <span class="friend-signature" v-if="friend.signature">
          {{ friend.signature }}
        </span>
        <span v-else-if="friend.lastSeen" class="last-seen">
          {{ friend.lastSeen }}
        </span>
        <span v-else class="friend-nickname">
          {{ friend.nickname }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Friend } from "./FriendList.vue";

interface Props {
  friend: Friend;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [friend: Friend];
}>();

// 计算显示名称：优先显示备注名
const displayName = computed(() => {
  return props.friend.remarkName || props.friend.nickname;
});

const handleClick = () => {
  emit("click", props.friend);
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-item.css";
</style>