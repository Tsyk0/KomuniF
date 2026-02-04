<!-- src/components/FriendInfo.vue -->
<template>
  <div class="friend-detail-container">
    <!-- 返回按钮和标题 -->
    <div class="friend-detail-header">
      <button class="back-button" @click="handleBack">
        <span class="back-icon">←</span>
      </button>
      <h2 class="friend-detail-title">好友信息</h2>
    </div>

    <!-- 加载状态 -->
    <div v-if="friendInfoStore.loading" class="friend-detail-content friend-loading">
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="friendInfoStore.error" class="friend-detail-content friend-error">
      <p>{{ friendInfoStore.error }}</p>
    </div>

    <!-- 好友详情内容 -->
    <div v-else-if="info" class="friend-detail-content">
      <!-- 好友头像 -->
      <div class="friend-avatar-large">
        <img
          v-if="friendInfoStore.avatarUrl"
          :src="friendInfoStore.avatarUrl"
          alt="头像"
          class="avatar-large-img"
        />
        <div v-else class="avatar-large-default">{{ displayInitial }}</div>
        <span class="online-status-badge" :class="onlineStatusClass">
          {{ onlineStatusText }}
        </span>
      </div>

      <!-- 好友基本信息 -->
      <div class="friend-basic-info">
        <h3 class="friend-name-large">{{ displayName }}</h3>

        <div v-if="info.remarkName" class="friend-remark">
          <span class="remark-label">备注：</span>
          <span class="remark-text">{{ info.remarkName }}</span>
        </div>

        <div class="friend-group">
          <span class="group-label">分组：</span>
          <span class="group-text">{{ info.friendGroup || "未分组" }}</span>
        </div>
      </div>

      <!-- 更多信息 -->
      <div class="friend-more-info">
        <div class="info-section">
          <h4 class="section-title">个人信息</h4>

          <div v-if="info.friendSignature" class="info-row">
            <span class="info-label">个性签名：</span>
            <span class="info-value">{{ info.friendSignature }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">昵称：</span>
            <span class="info-value">{{ info.friendNickname }}</span>
          </div>

          <div v-if="info.friendGender !== undefined && info.friendGender !== null" class="info-row">
            <span class="info-label">性别：</span>
            <span class="info-value">{{ genderText }}</span>
          </div>

          <div v-if="info.friendBirthday" class="info-row">
            <span class="info-label">生日：</span>
            <span class="info-value">{{ info.friendBirthday }}</span>
          </div>

          <div v-if="info.friendLocation" class="info-row">
            <span class="info-label">地区：</span>
            <span class="info-value">{{ info.friendLocation }}</span>
          </div>

          <div v-if="info.friendPhone" class="info-row">
            <span class="info-label">手机号：</span>
            <span class="info-value">{{ info.friendPhone }}</span>
          </div>

          <div v-if="info.friendEmail" class="info-row">
            <span class="info-label">邮箱：</span>
            <span class="info-value">{{ info.friendEmail }}</span>
          </div>

          <div v-if="info.addTime" class="info-row">
            <span class="info-label">添加时间：</span>
            <span class="info-value">{{ info.addTime }}</span>
          </div>

          <div v-if="info.friendLastLoginTime" class="info-row">
            <span class="info-label">最后登录：</span>
            <span class="info-value">{{ info.friendLastLoginTime }}</span>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="friend-actions friend-actions-bottom">
          <button class="action-btn primary" @click="handleStartChat">
            <span class="action-icon">💬</span>
            <span class="action-text">发起聊天</span>
          </button>
          <button class="action-btn secondary danger" @click="handleDeleteFriend">
            <span class="action-icon">🗑️</span>
            <span class="action-text">删除好友</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from "vue";
import { useFriendInfoStore } from "@/stores/friend/friend-info";
import type { FriendListItem } from "@/types/dto/friend";

const props = defineProps<{
  friend: FriendListItem;
}>();

const emit = defineEmits<{
  back: [];
  "send-message": [friend: FriendListItem];
  "delete-friend": [friend: FriendListItem];
}>();

const friendInfoStore = useFriendInfoStore();

const info = computed(() => friendInfoStore.friendInfo);

const displayName = computed(() => {
  if (!info.value) return "未知用户";
  return info.value.remarkName || info.value.friendNickname || "未知用户";
});

const displayInitial = computed(() =>
  displayName.value.charAt(0).toUpperCase()
);

const onlineStatusText = computed(() => {
  const s = info.value?.friendOnlineStatus;
  if (s === 1) return "在线";
  if (s === 2) return "离开";
  return "离线";
});

const onlineStatusClass = computed(() => {
  const s = info.value?.friendOnlineStatus;
  if (s === 1) return "online";
  if (s === 2) return "away";
  return "offline";
});

const genderText = computed(() => {
  const g = info.value?.friendGender;
  if (g === 1) return "男";
  if (g === 2) return "女";
  return "未知";
});

function loadInfo() {
  if (props.friend?.friendId) {
    friendInfoStore.loadFriendInfo(props.friend.friendId);
  }
}

watch(
  () => props.friend?.friendId,
  (id) => {
    if (id) loadInfo();
  }
);

onMounted(() => {
  loadInfo();
});

onUnmounted(() => {
  friendInfoStore.clearFriendInfo();
});

const handleBack = () => {
  emit("back");
};

const handleStartChat = () => {
  emit("send-message", props.friend);
};

const handleDeleteFriend = () => {
  emit("delete-friend", props.friend);
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-info.css";
@import "@/assets/styles/night/friend-info-night.css";
</style>
