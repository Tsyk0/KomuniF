// File: src/stores/friend/show-friend.ts
import { defineStore } from "pinia";
import { loadFriendListItems } from "@/capabilities/friend";
import type {
  FriendListItem
} from "@/types/dto/friend";

export const useFriendStore = defineStore("friend", {
  state: () => ({
    friends: [] as FriendListItem[],
    loadingFriends: false,
    searchKeyword: ""
  }),

  actions: {
    setFriends(friends: FriendListItem[]) {
      this.friends = Array.isArray(friends) ? friends : [];
    },

    async loadFriends() {
      try {
        this.loadingFriends = true;
        const userStr = sessionStorage.getItem("user");
        const parsedUser = userStr ? JSON.parse(userStr) : null;
        const currentUserId = Number(parsedUser?.userId);
        if (!currentUserId) {
          throw new Error("用户未登录");
        }

        this.setFriends(await loadFriendListItems());
      } catch (error) {
        console.error("加载好友列表失败:", error);
        this.friends = [];
        
        // Redis 异常时可按需降级为空列表
        // if (error.message && error.message.includes('Redis is configured to save RDB snapshots')) {
        //   console.warn("Redis 服务异常，返回空列表继续运行");
        //   return [];
        // }
        
        throw error;
      } finally {
        this.loadingFriends = false;
      }
    },

    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword;
    },

    resetFriends() {
      this.friends = [];
      this.searchKeyword = "";
    }
  },

  getters: {
    filteredFriends: (state) => {
      const keyword = state.searchKeyword.toLowerCase().trim();
      if (!keyword) {
        return state.friends;
      }
      return state.friends.filter((friend) => {
        const searchIn = [
          friend.displayName,
          friend.nickname,
          friend.remarkName,
          friend.signature
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchIn.includes(keyword);
      });
    },

    isLoading: (state) => state.loadingFriends
  }
});
