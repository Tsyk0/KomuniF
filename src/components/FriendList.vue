<template>
  <div class="friend-list-container">
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索好友"
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          ×
        </button>
      </div>
    </div>

    <!-- 好友列表内容区域 -->
    <div class="friend-list-content">
      <div class="friend-groups">
        <div v-if="isLoading" class="empty-group">
          <p>加载中...</p>
        </div>
        <div v-else-if="filteredFriends.length === 0" class="empty-group">
          <p>暂无好友</p>
        </div>
        <FriendItem
          v-for="friend in filteredFriends"
          :key="friend.id"
          :friend="friend"
          @click="handleFriendClick(friend)"
        />
      </div>
    </div>

    <!-- 固定在底部的操作栏 -->
    <div class="fixed-bottom-actions">
      <div class="action-buttons">
        <button class="action-btn add-friend-btn" @click="handleAddFriend">
          <div class="action-btn-content">
            <span class="action-icon">➕</span>
            <span class="action-text">添加好友</span>
          </div>
          <div class="action-hover-bg"></div>
        </button>

        <button
          class="action-btn friend-request-btn"
          @click="handleFriendRequests"
        >
          <div class="action-btn-content">
            <span class="action-icon">👤</span>
            <span class="action-text">好友通知</span>
            <span v-if="friendRequestCount > 0" class="notification-badge">
              {{ friendRequestCount > 99 ? "99+" : friendRequestCount }}
            </span>
          </div>
          <div class="action-hover-bg"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import FriendItem from "./FriendItem.vue";
import { useFriendStore } from "@/stores/friend/show-friend";
import type { FriendListItem } from "@/types/form/friend-detail";

const emit = defineEmits<{
  "friend-click": [friend: FriendListItem];
}>();

const friendStore = useFriendStore();
const friendRequestCount = ref(2); // 测试数据，实际应该从API获取

const searchKeyword = computed({
  get: () => friendStore.searchKeyword,
  set: (value: string) => friendStore.setSearchKeyword(value),
});

const filteredFriends = computed(() => friendStore.filteredFriends);
const isLoading = computed(() => friendStore.isLoading);

const handleSearch = () => {
  console.log("搜索关键词:", searchKeyword.value);
};

const clearSearch = () => {
  searchKeyword.value = "";
};

const handleFriendClick = (friend: FriendListItem) => {
  emit("friend-click", friend);
};

onMounted(() => {
  friendStore.loadFriends();
});

const handleAddFriend = () => {
  console.log("添加好友");
  // TODO: 弹出添加好友对话框
};

const handleFriendRequests = () => {
  console.log("查看好友请求");
  // TODO: 跳转到好友请求页面
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-list.css";
@import "@/assets/styles/night/friend-list-night.css";
</style>