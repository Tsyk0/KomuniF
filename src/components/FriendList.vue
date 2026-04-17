<template>
  <div class="friend-list-container">
    <!-- 好友列表内容区域 -->
    <div class="friend-list-content">
      <div class="friend-groups">
        <div v-if="filteredFriends.length === 0" class="empty-group">
          <p>暂无好友</p>
        </div>
        <FriendItem
          v-for="friend in filteredFriends"
          :key="friend.id"
          :friend="friend"
          :isActive="friend.id === activeFriendId"
          @click="handleFriendClick(friend)"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";
import { useFriendStore } from "@/stores/friend/show-friend";
import type { FriendListItem } from "@/types/dto/friend";

const FriendItem = defineAsyncComponent(() => import("./FriendItem.vue"));

const props = defineProps<{
  searchQuery?: string;
}>();

const emit = defineEmits<{
  "friend-click": [friend: FriendListItem];
}>();

const friendStore = useFriendStore();
const activeFriendId = ref<number | null>(null);

// 监听外部搜索词，实时同步到 store
watch(
  () => props.searchQuery,
  (newVal) => {
    friendStore.setSearchKeyword(newVal || "");
  },
  { immediate: true }
);

const filteredFriends = computed(() => friendStore.filteredFriends);
const isLoading = computed(() => friendStore.isLoading);

const handleFriendClick = (friend: FriendListItem) => {
  activeFriendId.value = friend.id;
  emit("friend-click", friend);
};

onMounted(() => {
  void friendStore.loadFriends();
});
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-list.css";
@import "@/assets/styles/night/friend-list-night.css";
</style>