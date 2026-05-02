<!-- File: src/components/FriendPickSidebar.vue -->
<template>
  <div class="friend-pick-sidebar">
    <div class="friend-pick-scroll">
      <div v-if="selectableFriends.length === 0" class="friend-pick-empty">
        暂无好友，请先添加好友
      </div>
      <!-- 与会话列表一致：单滚动容器 + sidebar-list-items；每行为 *-item → *-item-container（头像 + 文案） -->
      <div
        v-else
        class="sidebar-list-items friend-pick-list"
        role="list"
      >
        <div
          v-for="f in selectableFriends"
          :key="f.friendId"
          class="friend-pick-item"
          role="listitem"
          :class="{
            selected: convCreateStore.selectedFriendIds.includes(f.friendId),
          }"
          v-ripple="{ rippleOpts }"
          @click="toggle(f.friendId)"
        >
          <div class="friend-pick-item-container">
            <div class="friend-pick-item-avatar-wrapper">
              <img
                v-if="getFriendAvatarUrl(f.avatar)"
                :src="getFriendAvatarUrl(f.avatar)"
                alt=""
                class="friend-pick-avatar-img"
              />
              <span v-else class="friend-pick-avatar-ph">{{
                getFriendDisplayName(f).charAt(0).toUpperCase()
              }}</span>
            </div>
            <div class="friend-pick-item-info-wrapper">
              <span class="friend-pick-name">{{ f.displayName }}</span>
              <span
                v-if="f.nickname && f.nickname !== f.displayName"
                class="friend-pick-sub"
              >
                {{ f.nickname }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useFriendStore } from "@/store/friend/showFriend";
import { useUserStore } from "@/store/user/user";
import { useConvCreateStore } from "@/store/conv/convCreate";
import {
  filterSelectableFriends,
  resolveFriendAvatarUrl,
  resolveFriendDisplayName,
} from "@/interactions/friendPickSidebar/FriendPickSidebarInteraction";

/** 侧栏多选行与主列表共用 ripple 色（CSS 变量）。 */
const rippleOpts = { color: "var(--sli-ripple-color)", duration: 520 };

const props = defineProps<{
  searchQuery?: string;
}>();

const friendStore = useFriendStore();
const authStore = useUserStore();
const convCreateStore = useConvCreateStore();

watch(
  () => props.searchQuery,
  (q) => {
    friendStore.setSearchKeyword(q || "");
  },
  { immediate: true }
);

const myUserId = computed(() => Number(authStore.user?.userId) || 0);

const getFriendDisplayName = (friend: {
  displayName?: string;
  nickname?: string;
}) => resolveFriendDisplayName(friend);

const selectableFriends = computed(() =>
  filterSelectableFriends(friendStore.filteredFriends, myUserId.value)
);

const getFriendAvatarUrl = (avatar?: string | null): string =>
  resolveFriendAvatarUrl(avatar);

function toggle(friendId: number) {
  convCreateStore.toggleFriendId(friendId);
}
</script>

<style scoped>
@import "@/assets/styles/friend-pick-sidebar.css";
</style>
