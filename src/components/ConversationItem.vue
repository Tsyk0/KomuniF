<!-- src/components/conversation/ConversationItem.vue -->
<template>
  <div
    class="conversation-item"
    :class="{ active: isActive }"
    @click="handleClick"
  >
    <div class="item-left">
      <div class="avatar">
        <div v-if="avatar" class="avatar-img">
          <img :src="avatar" :alt="displayName" />
        </div>
        <div v-else class="avatar-placeholder">
          {{ displayName.charAt(0).toUpperCase() }}
        </div>
      </div>
    </div>

    <div class="item-middle">
      <div class="name-row">
        <span class="display-name">{{ displayName }}</span>
        <span class="time" v-if="lastMessageTime">{{
          formatTime(lastMessageTime)
        }}</span>
      </div>
      <div class="message-row">
        <span class="last-message">{{ lastMessage || "暂无消息" }}</span>
        <span class="unread-badge" v-if="unreadCount > 0">{{
          unreadCount
        }}</span>
      </div>
    </div>

    <div class="item-right">
      <!-- 可以放其他图标 -->
    </div>
  </div>
</template>

<script>
export default {
  name: "ConversationItem",

  props: {
    // 会话ID
    convId: {
      type: Number,
      required: true,
    },
    // 显示名称
    displayName: {
      type: String,
      default: "未知会话",
    },
    // 头像URL
    avatar: {
      type: String,
      default: "",
    },
    // 最后一条消息
    lastMessage: {
      type: String,
      default: "",
    },
    // 最后消息时间
    lastMessageTime: {
      type: String,
      default: "",
    },
    // 未读消息数
    unreadCount: {
      type: Number,
      default: 0,
    },
    // 是否选中
    isActive: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    /**
     * 点击事件
     */
    handleClick() {
      this.$emit("click", this.convId);
    },

    /**
     * 格式化时间
     * @param {string} timeString - 时间字符串
     * @returns {string} 格式化后的时间
     */
    formatTime(timeString) {
      if (!timeString) return "";

      const date = new Date(timeString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // 今天
        return date.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffDays === 1) {
        // 昨天
        return "昨天";
      } else if (diffDays < 7) {
        // 一周内
        const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
        return `周${weekdays[date.getDay()]}`;
      } else {
        // 更早
        return date.toLocaleDateString("zh-CN", {
          month: "numeric",
          day: "numeric",
        });
      }
    },
  },
};
</script>

<style scoped>
.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--border-color, #eee);
}

.conversation-item:hover {
  background-color: var(--hover-bg-color, #f5f5f5);
}

.conversation-item.active {
  background-color: var(--active-bg-color, #e3f2fd);
}

.item-left {
  margin-right: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--avatar-bg-color, #ddd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--avatar-text-color, #666);
}

.avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.item-middle {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.display-name {
  font-weight: 500;
  font-size: 16px;
  color: var(--text-primary, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  font-size: 12px;
  color: var(--text-secondary, #999);
}

.message-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  font-size: 14px;
  color: var(--text-secondary, #666);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unread-badge {
  background-color: var(--unread-badge-color, #f44336);
  color: white;
  font-size: 12px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  margin-left: 8px;
}

.item-right {
  margin-left: 8px;
}
</style>