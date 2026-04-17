// File: src/stores/friend/friend-info.ts
import { defineStore } from "pinia";
import { friendApi } from "@/apis/friend/index";
import { normalizeAvatarUrl } from "@/utils/avatar-url";
import type { FriendInfoDTO } from "@/types/dto/friend";

export const useFriendInfoStore = defineStore("friendInfo", {
    state: () => ({
        friendInfo: null as FriendInfoDTO | null,
        loading: false,
        error: null as string | null,
        currentFriendId: null as number | null
    }),

    actions: {
        async loadFriendInfo(friendId: number) {
            if (!friendId || friendId <= 0) {
                this.friendInfo = null;
                this.error = "无效的好友 ID";
                return;
            }

            try {
                this.loading = true;
                this.error = null;
                this.currentFriendId = friendId;
                const response = await friendApi.getFriendInfoByUserIdAndFriendId(
                    friendId
                );

                if (response.code !== 200) {
                    throw new Error(response.message || "获取好友详情失败");
                }

                // 避免快速切换好友时旧请求回写覆盖当前详情
                if (this.currentFriendId === friendId) {
                    this.friendInfo = response.data || null;
                }
            } catch (err: any) {
                if (this.currentFriendId === friendId) {
                    this.error = err?.message || "加载好友详情失败";
                    this.friendInfo = null;
                }
                throw err;
            } finally {
                if (this.currentFriendId === friendId) {
                    this.loading = false;
                }
            }
        },

        clearFriendInfo() {
            this.friendInfo = null;
            this.error = null;
            this.currentFriendId = null;
            this.loading = false;
        }
    },

    getters: {
        avatarUrl: (state) =>
            normalizeAvatarUrl(state.friendInfo?.friendAvatar || "")
    }
});
