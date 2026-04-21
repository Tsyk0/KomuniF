// src/store/friend/showFriend.ts
import { defineStore } from "pinia";
import { loadFriendsNormalized } from "@/normalize/friend";
import type { FriendListItem } from "@/types/dto/friend";

export const useFriendStore = defineStore("friend", {
  state: () => ({
    /** 好友列表（已标准化为可展示项）。 */
    friends: [] as FriendListItem[],
    /** 列表加载态。 */
    loadingFriends: false,
    /** 好友列表搜索关键词（本地 UI 状态）。 */
    searchKeyword: "",
  }),

  actions: {
    /** 外部写入好友列表（引导期兼容）。 */
    setFriends(friends: FriendListItem[]) {
      this.friends = Array.isArray(friends) ? friends : [];
    },

    /** 从 normalize 层加载好友列表。 */
    async loadFriends() {
      this.loadingFriends = true;
      try {
        this.setFriends(await loadFriendsNormalized());
      } catch (error) {
        this.friends = [];
        throw error;
      } finally {
        this.loadingFriends = false;
      }
    },

    /** 更新搜索关键词。 */
    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword;
    },

    /** 退出登录/重置场景：清空好友状态。 */
    resetFriends() {
      this.friends = [];
      this.searchKeyword = "";
    },
  },

  getters: {
    /**
     * 列表过滤：
     * 仅负责前端交互态（搜索词）过滤，不做后端字段映射。
     */
    filteredFriends: (state) => {
      const keyword = state.searchKeyword.toLowerCase().trim();
      if (!keyword) return state.friends;
      return state.friends.filter((friend) => {
        const searchIn = [
          friend.displayName,
          friend.nickname,
          friend.remarkName,
          friend.signature,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchIn.includes(keyword);
      });
    },

    /** 暴露统一 loading 语义给组件。 */
    isLoading: (state) => state.loadingFriends,
  },
});
