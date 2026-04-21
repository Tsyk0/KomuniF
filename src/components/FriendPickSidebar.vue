<!-- File: src/components/FriendPickSidebar.vue -->
<template>
  <div class="friend-pick-sidebar">
    <div class="friend-pick-scroll">
      <div v-if="selectableFriends.length === 0" class="friend-pick-empty">
        暂无好友，请先添加好友
      </div>
      <ul v-else class="friend-pick-list">
        <li
          v-for="f in selectableFriends"
          :key="f.friendId"
          class="friend-pick-row"
          :class="{
            selected: convCreateStore.selectedFriendIds.includes(f.friendId),
          }"
          @click="toggle(f.friendId)"
        >
          <div class="friend-pick-row-main">
            <div class="friend-pick-avatar">
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
            <div class="friend-pick-text">
              <span class="friend-pick-name">{{ f.displayName }}</span>
              <span
                v-if="f.nickname && f.nickname !== f.displayName"
                class="friend-pick-sub"
              >
                {{ f.nickname }}
              </span>
            </div>
          </div>
          <input
            class="friend-pick-check"
            type="checkbox"
            :checked="convCreateStore.selectedFriendIds.includes(f.friendId)"
            @click.stop="toggle(f.friendId)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useFriendStore } from "@/store/friend/showFriend";
import { useUserStore } from "@/store/user/user";
import { useConvCreateStore } from "@/store/conv/convCreate";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";

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
}) => friend.displayName || friend.nickname || "Unknown user";

const selectableFriends = computed(() =>
  friendStore.filteredFriends.filter((f) => f.friendId !== myUserId.value)
);

const getFriendAvatarUrl = (avatar?: string | null): string =>
  normalizeAvatarUrl(avatar || "");

function toggle(friendId: number) {
  convCreateStore.toggleFriendId(friendId);
}
</script>

<style scoped>
@import "@/assets/styles/friend-pick-sidebar.css";
</style>
