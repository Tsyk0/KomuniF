// src/store/app/bootstrap.ts
import { defineStore } from "pinia";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConvStore } from "@/store/conv/conv";
import { useSystemNotificationsStore } from "@/store/notification/systemNotifications";
import { useWebSocketStore } from "@/store/realtime/websocket";

export type BootstrapTarget = "friends" | "conversations" | "notifications";

export type BootstrapResult = {
  target: BootstrapTarget;
  success: boolean;
  message?: string;
};

/**
 * 应用启动数据编排（新路径）：
 * 统一由 store 自己负责加载，避免 bootstrap 直接消费旧 capabilities 的原始数据。
 */
export const useAppBootstrapStore = defineStore("appBootstrap", {
  actions: {
    async loadOne(target: BootstrapTarget, userId: number): Promise<BootstrapResult> {
      try {
        if (target === "friends") {
          await useFriendStore().loadFriends();
          return { target, success: true };
        }

        if (target === "conversations") {
          const convStore = useConvStore();
          await convStore.loadConversations();
          const convIds = convStore.conversations.map((item) => Number(item.convId));
          await useWebSocketStore().connectAndSubscribeAll(userId, convIds);
          return { target, success: true };
        }

        await useSystemNotificationsStore().fetchRecent();
        return { target, success: true };
      } catch (error) {
        return {
          target,
          success: false,
          message:
            error instanceof Error
              ? error.message
              : `load ${target} failed`,
        };
      }
    },

    async loadInitialData(userId: number): Promise<BootstrapResult[]> {
      const [friends, conversations, notifications] = await Promise.all([
        this.loadOne("friends", userId),
        this.loadOne("conversations", userId),
        this.loadOne("notifications", userId),
      ]);
      return [friends, conversations, notifications];
    },
  },
});
