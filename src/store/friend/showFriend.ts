// src/store/friend/showFriend.ts
import { acceptHMRUpdate, defineStore } from "pinia";
import { loadFriendsNormalized, searchUsersNormalized } from "@/normalize/friend";
import { sendFriendRequestNormalized } from "@/normalize/notification";
import type { FriendListItem } from "@/types/dto/friend";
import { FriendRelationStatus } from "@/types/dto/friend";

type FriendCurrentItem = FriendListItem & {
  friendBirthday?: string | null;
  friendLocation?: string | null;
  friendPhone?: string | null;
  friendEmail?: string | null;
  friendLastLoginTime?: string | null;
  friendOnlineStatus?: number | null;
};

/**
 * 是否应在侧栏「好友列表 / 发起会话选人」中展示（仅关系态 0、1）。
 * 使用场景：`filteredFriends` 从全量 `friends` 中筛出可见行。
 */
function isFriendVisibleInSidebarList(friend: FriendListItem): boolean {
  const r = Number(friend.relationStatus);
  return r === FriendRelationStatus.FRIEND_PINNED || r === FriendRelationStatus.NORMAL;
}

/**
 * 侧栏好友顺序：relationStatus===0 置顶；同档内按 updateTime 新在前。
 * 使用场景：`filteredFriends` 无搜索关键词时的基准顺序。
 */
function sortFriendsForSidebarVisible(items: FriendListItem[]): FriendListItem[] {
  return [...items].sort((a, b) => {
    const aPinned = Number(a.relationStatus) === FriendRelationStatus.FRIEND_PINNED;
    const bPinned = Number(b.relationStatus) === FriendRelationStatus.FRIEND_PINNED;
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }
    const ta = new Date(a.updateTime || 0).getTime();
    const tb = new Date(b.updateTime || 0).getTime();
    if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) {
      return tb - ta;
    }
    return Number(b.friendId) - Number(a.friendId);
  });
}

export const useFriendStore = defineStore("friend", {
  state: () => ({
    /**
     * GET /friends 全量缓存（各 relationStatus 均可能存在）。
     * 使用场景：会话发送者显示名映射、非好友备注等；侧栏列表勿直接用本字段应用 v-for。
     */
    friends: [] as FriendListItem[],
    /** 当前打开详情的好友对象（来源于好友列表）。 */
    currentFriend: null as FriendCurrentItem | null,
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

    /**
     * 设置当前详情好友对象。
     * 使用场景：从好友列表点击某个好友进入详情页时，固定详情页的数据来源。
     */
    setCurrentFriend(friend: FriendCurrentItem | null) {
      this.currentFriend = friend;
    },

    /**
     * 按 friendId 从好友列表定位并设置当前详情好友对象。
     * 使用场景：组件仅持有 friendId 时，通过 store 列表建立详情上下文。
     */
    setCurrentFriendById(friendId: number) {
      const targetId = Number(friendId);
      if (!Number.isFinite(targetId) || targetId <= 0) {
        this.currentFriend = null;
        return;
      }
      const hit = this.friends.find(
        (item) =>
          Number(item.friendId) === targetId || Number(item.id) === targetId
      );
      this.currentFriend = (hit as FriendCurrentItem | undefined) || null;
    },

    /** 清空当前详情好友对象。 */
    clearCurrentFriend() {
      this.currentFriend = null;
    },

    /**
     * 本地移除指定好友并同步 currentFriend。
     * 使用场景：删除好友成功后，立即从好友列表与详情态中剔除该好友。
     */
    removeFriendLocal(friendId: number) {
      const targetId = Number(friendId);
      this.friends = this.friends.filter(
        (friend) => Number(friend.friendId) !== targetId
      );
      if (Number(this.currentFriend?.friendId || 0) === targetId) {
        this.currentFriend = null;
      }
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

    /**
     * 搜索用户列表（用于“添加好友”面板）。
     * 使用场景：UserSearch 输入关键词后，通过 store 统一触发用户搜索。
     */
    async searchUsers(params: { keyword: string; page: number; pageSize: number }) {
      return searchUsersNormalized(params);
    },

    /**
     * 发送好友申请。
     * 使用场景：UserSearch 点击“添加好友”后统一通过 store 提交请求。
     */
    async sendFriendRequest(targetUserId: number) {
      return sendFriendRequestNormalized(targetUserId);
    },

    /** 更新搜索关键词。 */
    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword;
    },

    /** 退出登录/重置场景：清空好友状态。 */
    resetFriends() {
      this.friends = [];
      this.currentFriend = null;
      this.searchKeyword = "";
    },
  },

  getters: {
    /**
     * 侧栏好友列表用：仅 relationStatus 为 0/1；0 置顶；再按搜索词过滤。
     * 使用场景：FriendList、FriendPickSidebar；全量关系数据见 state.friends。
     */
    filteredFriends: (state) => {
      const visibleSorted = sortFriendsForSidebarVisible(
        state.friends.filter(isFriendVisibleInSidebarList)
      );
      const keyword = state.searchKeyword.toLowerCase().trim();
      if (!keyword) return visibleSorted;
      return visibleSorted.filter((friend) => {
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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFriendStore, import.meta.hot));
}
