<!-- File: src/components/FriendPickSidebar.vue -->
<template>
  <div class="friend-pick-sidebar">
    <div class="friend-pick-scroll">
      <div v-if="selectableFriends.length === 0" class="friend-pick-empty">
        {{ friendPickEmptyText }}
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
          :class="{ selected: effectiveSelectedFriendIds.includes(f.friendId) }"
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
import { FriendRelationStatus } from "@/types/dto/friend";
import {
  filterSelectableFriends,
  resolveFriendAvatarUrl,
  resolveFriendDisplayName,
} from "@/interactions/friendPickSidebar/FriendPickSidebarInteraction";

/** 侧栏多选行与主列表共用 ripple 色（CSS 变量）。 */
const rippleOpts = { color: "var(--sli-ripple-color)", duration: 520 };

const props = defineProps<{
  searchQuery?: string;
  /**
   * 受控多选；未传时使用 convCreateStore（与 PlusPanel 同源）。
   */
  selectedFriendIds?: number[];
}>();

const emit = defineEmits<{
  "update:selectedFriendIds": [ids: number[]];
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

const isControlledFriendSelection = computed(
  () => props.selectedFriendIds !== undefined
);

const effectiveSelectedFriendIds = computed((): number[] =>
  isControlledFriendSelection.value
    ? props.selectedFriendIds!
    : convCreateStore.selectedFriendIds
);

const getFriendDisplayName = (friend: {
  displayName?: string;
  nickname?: string;
}) => resolveFriendDisplayName(friend);

const selectableFriends = computed(() =>
  filterSelectableFriends(friendStore.filteredFriends, myUserId.value)
);

/**
 * 列表为空时的提示。
 * 使用场景：PlusPanel 选人、群资料邀请选人共用侧栏组件。
 */
const friendPickEmptyText = computed(() => {
  if (friendStore.loadingFriends) {
    return "加载好友列表中...";
  }
  const me = myUserId.value;
  const before = selectableFriends.value;
  const hasVisibleRelationFriend = friendStore.friends.some((f) => {
    const r = Number(f.relationStatus);
    const ok =
      r === FriendRelationStatus.FRIEND_PINNED ||
      r === FriendRelationStatus.NORMAL;
    return ok && Number(f.friendId) !== me;
  });
  if (before.length === 0) {
    if (!hasVisibleRelationFriend) {
      return "暂无好友，请先添加好友";
    }
    return "无匹配好友，请清空侧栏搜索或更换关键词";
  }
  return "";
});

const getFriendAvatarUrl = (avatar?: string | null): string =>
  resolveFriendAvatarUrl(avatar);

/**
 * 切换好友行选中状态。
 * 使用场景：convCreateStore（PlusPanel / 群邀请）或受控 v-model。
 */
function toggle(friendId: number) {
  if (isControlledFriendSelection.value) {
    const cur = props.selectedFriendIds!;
    const idx = cur.indexOf(friendId);
    const next =
      idx >= 0 ? cur.filter((_, i) => i !== idx) : [...cur, friendId];
    emit("update:selectedFriendIds", next);
    return;
  }
  convCreateStore.toggleFriendId(friendId);
}
</script>

<style scoped>
@import "@/assets/styles/friend-pick-sidebar.css";
</style>
