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
                v-if="f.avatar"
                :src="f.avatar"
                alt=""
                class="friend-pick-avatar-img"
              />
              <span v-else class="friend-pick-avatar-ph">{{
                (f.displayName || f.nickname || "?").charAt(0).toUpperCase()
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
import { useFriendStore } from "@/stores/friend/show-friend";
import { useAuthStore } from "@/stores/auth";
import { useConvCreateStore } from "@/stores/chat/conv-create";

const props = defineProps<{
  searchQuery?: string;
}>();

const friendStore = useFriendStore();
const authStore = useAuthStore();
const convCreateStore = useConvCreateStore();

watch(
  () => props.searchQuery,
  (q) => {
    friendStore.setSearchKeyword(q || "");
  },
  { immediate: true }
);

const myUserId = computed(() => Number(authStore.user?.userId) || 0);

const selectableFriends = computed(() =>
  friendStore.filteredFriends.filter((f) => f.friendId !== myUserId.value)
);

function toggle(friendId: number) {
  convCreateStore.toggleFriendId(friendId);
}
</script>

<style scoped>
@import "@/assets/styles/friend-pick-sidebar.css";
</style>
