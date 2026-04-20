// File: src/stores/app/bootstrap.ts
import { defineStore } from "pinia";
import { AppInitLoader } from "@/capabilities/init";
import type { InitResult, InitTarget } from "@/capabilities/init";
import { useFriendStore } from "@/stores/friend/show-friend";
import { useConversationStore } from "@/stores/conv/show-conversation";
import { useSystemNotificationsStore } from "@/stores/notification/system-notifications";
import { useSingleChatPeerAvatarStore } from "@/stores/conv/single-chat-peer-avatar";

const loader = new AppInitLoader();

export const useAppBootstrapStore = defineStore("appBootstrap", {
  actions: {
    async applyLoadResult(result: InitResult, userId: number): Promise<void> {
      if (!result.success) {
        return;
      }
      if (result.target === "friends") {
        useFriendStore().setFriends(result.data || []);
        return;
      }
      if (result.target === "conversations") {
        const conversationStore = useConversationStore();
        conversationStore.setConversations(result.data || [], userId);
        await useSingleChatPeerAvatarStore().loadAllSingleChatPeerProfiles();
        return;
      }
      if (result.target === "notifications") {
        useSystemNotificationsStore().setNotifications(result.data || []);
      }
    },

    async loadInitialData(userId: number): Promise<InitResult[]> {
      const results = await loader.loadAll({ userId });
      await Promise.all(results.map((result) => this.applyLoadResult(result, userId)));
      return results;
    },

    async loadOne(target: InitTarget, userId: number): Promise<InitResult> {
      const result = await loader.loadOne(target, { userId });
      await this.applyLoadResult(result, userId);
      return result;
    },
  },
});
