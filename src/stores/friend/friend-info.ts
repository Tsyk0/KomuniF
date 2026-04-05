import { defineStore } from "pinia";
import { friendApi } from "@/apis/friend/index";
import { normalizeAvatarUrl } from "@/utils/avatar-url";
import type { FriendInfoDTO } from "@/types/dto/friend";

export const useFriendInfoStore = defineStore("friendInfo", {
    state: () => ({
        friendInfo: null as FriendInfoDTO | null,
        loading: false,
        error: null as string | null
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
                const response = await friendApi.getFriendInfoByUserIdAndFriendId(
                    friendId
                );

                if (response.code !== 200) {
                    throw new Error(response.message || "获取好友详情失败");
                }

                this.friendInfo = response.data ?? null;
            } catch (err: any) {
                this.error = err?.message || "加载好友详情失败";
                this.friendInfo = null;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        clearFriendInfo() {
            this.friendInfo = null;
            this.error = null;
        }
    },

    getters: {
        avatarUrl: (state) =>
            normalizeAvatarUrl(state.friendInfo?.friendAvatar ?? "")
    }
});
