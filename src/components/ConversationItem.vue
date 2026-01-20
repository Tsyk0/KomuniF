<!-- src/components/ConversationItem.vue -->
<template>
  <div
    class="conversation-item"
    :class="{ active: isActive }"
    @click="handleClick"
  >
    <!-- 头像 -->
    <div class="conversation-avatar">
      <img
        v-if="avatar && avatar !== ''"
        :src="avatar"
        alt="头像"
        class="avatar-img"
        @error="handleAvatarError"
      />
      <div v-else class="avatar-placeholder">
        {{ displayName.charAt(0) }}
      </div>
    </div>

    <!-- 会话信息 -->
    <div class="conversation-info">
      <div class="conversation-header">
        <div class="conversation-name">
          {{ displayName }}
        </div>
        <div class="conversation-time">
          {{ formatTime(lastMessageTime) }}
        </div>
      </div>

      <div class="conversation-preview">
        <span class="last-message">{{ lastMessage || "暂无消息" }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ConversationItem",

  props: {
    convId: {
      type: Number,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["click"],

  methods: {
    // 处理点击事件
    handleClick() {
      this.$emit("click", this.convId);
    },

    // 格式化时间
    formatTime(timeString) {
      if (!timeString) return "";

      const now = new Date();
      const messageTime = new Date(timeString);
      const diffInHours = Math.floor((now - messageTime) / (1000 * 60 * 60));

      if (diffInHours < 24) {
        // 当天：显示时间
        return messageTime.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } else if (diffInHours < 48) {
        // 昨天
        return "昨天";
      } else if (diffInHours < 168) {
        // 一周内：显示星期几
        const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        return days[messageTime.getDay()];
      } else {
        // 更早：显示月日
        return `${messageTime.getMonth() + 1}/${messageTime.getDate()}`;
      }
    },

    // 头像加载失败处理
    handleAvatarError(event) {
      const img = event.target;
      img.style.display = "none";
    },
  },
};
</script>

<style scoped>
@import "@/assets/styles/conversationitem.css";
</style>