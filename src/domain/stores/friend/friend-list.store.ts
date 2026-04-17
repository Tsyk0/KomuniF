// File: src/domain/stores/friend/friend-list.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { FriendListItem } from "@/types/dto/friend";

/**
 * 重构后的好友列表 Domain Store 骨架。
 * 具体实现将从 src/stores/friend/show-friend.ts 迁移。
 * 文件编码：UTF-8。
 */
export const useFriendListDomainStore = defineStore("domainFriendList", () => {
  const friends = ref<FriendListItem[]>([]);
  const searchKeyword = ref("");
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);

  const filteredFriends = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (!keyword) return friends.value;
    return friends.value.filter((friend) =>
      [friend.displayName, friend.nickname, friend.remarkName, friend.signature]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  });

  async function loadFriends() {
    throw new Error("TODO: migrate from src/stores/friend/show-friend.ts -> loadFriends");
  }

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword;
  }

  function reset() {
    friends.value = [];
    searchKeyword.value = "";
    loading.value = false;
    errorMessage.value = null;
  }

  return {
    friends,
    searchKeyword,
    loading,
    errorMessage,
    filteredFriends,
    loadFriends,
    setSearchKeyword,
    reset,
  };
});
