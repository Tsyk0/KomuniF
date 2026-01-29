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

    <!-- 好友详情内容 -->
    <div class="friend-detail-content">
      <!-- 好友头像 -->
      <div class="friend-avatar-large">
        <div class="avatar-large-default">{{ friendInitial }}</div>
        <span class="online-status-badge" :class="friend.onlineStatus">
          {{ getStatusText(friend.onlineStatus) }}
        </span>
      </div>

      <!-- 好友基本信息 -->
      <div class="friend-basic-info">
        <h3 class="friend-name-large">{{ friend.displayName }}</h3>

        <div v-if="friend.remarkName" class="friend-remark">
          <span class="remark-label">备注：</span>
          <span class="remark-text">{{ friend.remarkName }}</span>
        </div>

        <div class="friend-group">
          <span class="group-label">分组：</span>
          <span class="group-text">{{ friend.group }}</span>
        </div>
      </div>

      <!-- 更多信息 -->
      <div class="friend-more-info">
        <div class="info-section">
          <h4 class="section-title">个人信息</h4>

          <div v-if="friend.signature" class="info-row">
            <span class="info-label">个性签名：</span>
            <span class="info-value">{{ friend.signature }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">昵称：</span>
            <span class="info-value">{{ friend.nickname }}</span>
          </div>

          <div v-if="friend.lastSeen" class="info-row">
            <span class="info-label">最后在线：</span>
            <span class="info-value">{{ friend.lastSeen }}</span>
          </div>

          <div v-if="friend.joinTime" class="info-row">
            <span class="info-label">添加时间：</span>
            <span class="info-value">{{ friend.joinTime }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="friend-actions">
          <button class="action-btn primary" @click="handleSendMessage">
            <span class="action-icon">💬</span>
            <span class="action-text">发送消息</span>
          </button>
          <button class="action-btn secondary" @click="handleMoreActions">
            <span class="action-icon">⋮</span>
            <span class="action-text">更多操作</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from "vue";

// 定义Props
const props = defineProps({
  friend: {
    type: Object,
    required: true,
    default: () => ({
      id: 0,
      nickname: "",
      remarkName: "",
      group: "",
      signature: "",
      onlineStatus: "offline",
      lastSeen: "",
      joinTime: "",
    }),
  },
});

// 定义Emits
const emit = defineEmits(["back", "send-message", "more-actions"]);

// 计算属性：显示名称（优先显示备注名）
const displayName = computed(() => {
  return props.friend.remarkName || props.friend.nickname || "未知用户";
});

// 计算属性：好友名称首字母（用于头像）
const friendInitial = computed(() => {
  return displayName.value.charAt(0).toUpperCase();
});

// 方法：获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    online: "在线",
    away: "离开",
    offline: "离线",
  };
  return statusMap[status] || "离线";
};

// 方法：返回
const handleBack = () => {
  emit("back");
};

// 方法：发送消息
const handleSendMessage = () => {
  emit("send-message", props.friend);
};

// 方法：更多操作
const handleMoreActions = () => {
  emit("more-actions", props.friend);
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-info.css";
</style>
