import { defineStore } from "pinia";
import type {
  ConversationSummaryDTO,
  MessageDisplayMemberDTO,
} from "@/types/dto/conversation";
import { loadConversationsNormalized } from "@/normalize/conversation";
import { loadConversationMembers } from "@/capabilities/conversation";

export const useConvStore = defineStore("conv", {
  state: () => ({
    conversations: [] as ConversationSummaryDTO[],
    currentConversation: null as ConversationSummaryDTO | null,
    compressedCMMap: new Map<number, MessageDisplayMemberDTO[]>(),
    conversationMap: new Map<number, ConversationSummaryDTO>(),
  }),

  getters: {
    totalUnreadCount: (state): number =>
      state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0),
  },

  actions: {
    setConversations(conversations: ConversationSummaryDTO[]) {
      this.conversations = conversations;
      this.rebuildConversationMap();
    },

    rebuildConversationMap() {
      this.conversationMap.clear();
      this.conversations.forEach((item) => {
        this.conversationMap.set(item.convId, item);
      });
    },

    async loadConversations() {
      this.setConversations(await loadConversationsNormalized());
    },

    async refreshConversationById(convId: number) {
      const list = await loadConversationsNormalized(convId);
      const updated = list.find((item) => item.convId === convId);
      if (!updated) return;

      const index = this.conversations.findIndex((item) => item.convId === convId);
      if (index >= 0) {
        this.conversations.splice(index, 1, updated);
      } else {
        this.conversations.unshift(updated);
      }
      this.conversationMap.set(convId, updated);

      if (this.currentConversation?.convId === convId) {
        this.currentConversation = updated;
      }
    },

    selectConversation(convId: number | null) {
      if (convId == null) {
        this.currentConversation = null;
        return;
      }
      this.currentConversation =
        this.conversations.find((item) => item.convId === convId) || null;
      if (this.currentConversation?.convType === 2) {
        void this.loadCompressedCM(convId);
      }
    },

    markConversationRead(convId: number) {
      const conv = this.conversations.find((item) => item.convId === convId);
      if (conv) conv.unreadCount = 0;
    },

    getConversationById(convId: number): ConversationSummaryDTO | undefined {
      return this.conversationMap.get(convId);
    },

    async loadCompressedCM(convId: number, force = false) {
      if (!force && this.compressedCMMap.has(convId)) return;
      const members = await loadConversationMembers(convId);
      this.compressedCMMap.set(convId, members);
    },

    clearCurrentConversation() {
      this.currentConversation = null;
    },

    resetConversations() {
      this.conversations = [];
      this.currentConversation = null;
      this.conversationMap.clear();
      this.compressedCMMap.clear();
    },

    hydrateSingleChatPeerFromFriendList(convId: number, peerFriendUserId: number) {
      const conv = this.getConversationById(convId);
      if (!conv || conv.convType !== 1 || peerFriendUserId <= 0) return;
      if (conv.targetUserId == null || conv.targetUserId <= 0) {
        conv.targetUserId = peerFriendUserId;
      }
    },

    // 过渡期兼容旧方法命名
    setCurrentConversation(convId: number) {
      this.selectConversation(convId);
    },
    markAsRead(convId: number) {
      this.markConversationRead(convId);
    },
  },
});
