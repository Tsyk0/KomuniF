import { defineStore } from "pinia";
import type {
  ConversationSummaryDTO,
  MessageDisplayMemberDTO,
} from "@/types/dto/conversation";
import {
  loadConversationsNormalized,
  loadConversationMembersNormalized,
} from "@/normalize/conversation";
import { normalizeConversationSummary } from "@/normalize/conversation/load/convLoadMapper";

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

    /**
     * 本地补丁更新会话摘要并保持 currentConversation 响应式同步。
     * 使用场景：会话属性编辑成功后立即反映在列表与当前会话头部，无需等待整页重载。
     */
    patchConversationLocal(convId: number, patch: Partial<ConversationSummaryDTO>) {
      const current = this.conversationMap.get(convId);
      if (!current) return;
      /**
       * 本地补丁后再次做会话归一化。
       * 作用场景：privateDisplayName 变更时，立即重算 convName（显示名）并驱动依赖视图实时更新。
       */
      const merged = normalizeConversationSummary({ ...current, ...patch });
      const index = this.conversations.findIndex((item) => item.convId === convId);
      if (index >= 0) {
        this.conversations.splice(index, 1, merged);
      }
      this.conversationMap.set(convId, merged);
      if (this.currentConversation?.convId === convId) {
        this.currentConversation = merged;
      }
    },

    /**
     * 本地补丁更新群成员展示缓存中的昵称字段。
     * 使用场景：用户在群聊资料中修改“我的本群昵称”后，消息列表等依赖成员缓存的区域立即响应。
     */
    patchConversationMemberNicknameLocal(
      convId: number,
      userId: number,
      memberNickname: string | null
    ) {
      const currentMembers = this.compressedCMMap.get(convId);
      if (!currentMembers || currentMembers.length === 0) return;
      /** 昵称补丁后的新成员数组；用于触发依赖 compressedCMMap 的视图更新。 */
      const patchedMembers = currentMembers.map((member) =>
        Number(member.userId) === Number(userId)
          ? { ...member, memberNickname }
          : member
      );
      this.compressedCMMap.set(convId, patchedMembers);
    },

    async loadCompressedCM(convId: number, force = false) {
      if (!force && this.compressedCMMap.has(convId)) return;
      const members = await loadConversationMembersNormalized(convId);
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

    // 过渡期兼容旧方法命名
    setCurrentConversation(convId: number) {
      this.selectConversation(convId);
    },
    markAsRead(convId: number) {
      this.markConversationRead(convId);
    },
  },
});
