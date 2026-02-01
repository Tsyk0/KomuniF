import { defineStore } from "pinia";
import { friendApi } from "@/apis/friend/index";
import type {
  FriendListItem,
  FriendOnlineStatus,
  FriendRelationDetailDTO
} from "@/types/form/friend-detail";

const normalizeOnlineStatus = (
  status?: number | null
): FriendOnlineStatus => {
  if (status === 1) return "online";
  if (status === 2) return "away";
  return "offline";
};

const buildAvatarUrl = (avatar?: string | null): string => {
  if (!avatar) return "";
  const trimmed = avatar.trim();
  if (trimmed.startsWith("http") || trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  const prefix = import.meta.env.VITE_API_BASE_URL || "";
  if (!prefix) return trimmed;
  if (trimmed.startsWith("/")) {
    return `${prefix}${trimmed}`;
  }
  return `${prefix}/${trimmed}`;
};

const mapToFriendListItem = (
  dto: FriendRelationDetailDTO
): FriendListItem => {
  const nickname = dto.friendNickname || "";
  const remarkName = dto.remarkName || "";
  const displayName = (remarkName || nickname || "未知用户").trim();

  return {
    relationId: dto.id,
    id: dto.friendId,
    userId: dto.userId,
    friendId: dto.friendId,
    displayName,
    nickname,
    remarkName,
    avatar: buildAvatarUrl(dto.friendAvatar),
    signature: dto.friendSignature || "",
    onlineStatus: normalizeOnlineStatus(dto.friendOnlineStatus),
    group: dto.friendGroup || "",
    addTime: dto.addTime || "",
    updateTime: dto.updateTime || ""
  };
};

export const useFriendStore = defineStore("friend", {
  state: () => ({
    friends: [] as FriendListItem[],
    loadingFriends: false,
    searchKeyword: ""
  }),

  actions: {
    async loadFriends() {
      try {
        this.loadingFriends = true;
        const userStr = sessionStorage.getItem("user");
        const parsedUser = userStr ? JSON.parse(userStr) : null;
        const currentUserId = Number(parsedUser?.userId);
        if (!currentUserId) {
          throw new Error("用户未登录");
        }

        const response = await friendApi.getFriendListByUserId();

        if (response.code !== 200) {
          throw new Error(response.message || "获取好友列表失败");
        }

        const mapped = (response.data || []).map(mapToFriendListItem);
        this.friends = mapped.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, "zh-Hans-CN", {
            sensitivity: "base"
          })
        );
      } catch (error) {
        console.error("加载好友列表失败:", error);
        this.friends = [];
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
