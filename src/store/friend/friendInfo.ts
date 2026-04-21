// src/store/friend/friendInfo.ts
import { defineStore } from "pinia";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { loadFriendInfoNormalized } from "@/normalize/friend";
import type { FriendProfileDTO } from "@/types/dto/friend";

export const useFriendInfoStore = defineStore("friendInfo", {
  state: () => ({
    /** 当前详情数据。 */
    friendInfo: null as FriendProfileDTO | null,
    /** 详情加载态。 */
    loading: false,
    /** 详情错误提示。 */
    error: null as string | null,
    /** 当前加载目标，防止旧请求回写。 */
    currentFriendId: null as number | null,
  }),

  actions: {
    /** 加载单个好友详情。 */
    async loadFriendInfo(friendId: number) {
      const id = Math.floor(Number(friendId));
      if (!Number.isFinite(id) || id <= 0) {
        this.friendInfo = null;
        this.error = "无效的好友 ID";
        return;
      }
      this.loading = true;
      this.error = null;
      this.currentFriendId = id;
      try {
        const profile = await loadFriendInfoNormalized(id);
        if (this.currentFriendId === id) this.friendInfo = profile;
      } catch (err: any) {
        if (this.currentFriendId === id) {
          this.error = err?.message || "加载好友详情失败";
          this.friendInfo = null;
        }
        throw err;
      } finally {
        if (this.currentFriendId === id) this.loading = false;
      }
    },

    /** 清空详情状态。 */
    clearFriendInfo() {
      this.friendInfo = null;
      this.error = null;
      this.currentFriendId = null;
      this.loading = false;
    },
  },

  getters: {
    /** 详情头像标准化。 */
    avatarUrl: (state) => normalizeAvatarUrl(state.friendInfo?.friendAvatar || ""),
  },
});
