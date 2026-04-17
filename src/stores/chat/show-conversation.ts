// File: src/stores/chat/show-conversation.ts
import { defineStore } from 'pinia';
import type { ConversationDetailDTO, CompressedCM } from '@/types/dto/conversation';
import { loadConversationMembers, loadConversationSummaries } from '@/capabilities/conversation';
import { useAuthStore } from '@/stores/auth';
import { resolveConversationDisplayName } from '@/stores/chat/conversation-display-name';
import { useSingleChatPeerAvatarStore } from '@/stores/chat/single-chat-peer-avatar';

export const useConversationStore = defineStore('conversation', {
  state: () => ({
    // 会话列表 - 使用新的复合DTO
    conversations: [] as ConversationDetailDTO[],

    // 当前选中的会话
    currentConversation: null as ConversationDetailDTO | null,

    // 群成员缓存 Map<convId, CompressedCM[]>
    compressedCMMap: new Map<number, CompressedCM[]>(),

    // 加载状态
    loadingConversations: false,
    loadingCurrentConversation: false,
    loadingCompressedCM: false,

    // 搜索关键词
    searchKeyword: '',

    // 缓存用于快速查找
    conversationMap: new Map<number, ConversationDetailDTO>()
  }),

  actions: {
    setConversations(
      conversations: ConversationDetailDTO[],
      currentUserId: number | null = null
    ) {
      this.conversations = this.processConversations(conversations, currentUserId);
      this.updateConversationMap();
    },

    /**
     * 加载用户的会话列表（使用复合查询）
     */
    async loadConversations() {
      try {
        this.loadingConversations = true;

        const authStore = useAuthStore();
        const summaries = await loadConversationSummaries();
        this.setConversations(summaries, authStore.user?.userId || null);

        // 紧跟 summary：批量拉取单聊对方头像，列表与头部可立即显示
        const peerAvatarStore = useSingleChatPeerAvatarStore();
        await peerAvatarStore.loadAllSingleChatPeerProfiles();

        return this.conversations;
      } catch (error) {
        console.error('加载会话列表失败:', error);
        throw error;
      } finally {
        this.loadingConversations = false;
      }
    },

    /**
     * 处理会话数据，确保显示名称正确
     */
    processConversations(
      conversations: ConversationDetailDTO[],
      currentUserId: number | null = null
    ): ConversationDetailDTO[] {
      return conversations.map((conv) => {
        if (!conv.convName || conv.convName.trim() === '') {
          conv.convName = resolveConversationDisplayName(conv, currentUserId);
        }

        // 确保最后消息不为空
        if (!conv.lastMessage) {
          conv.lastMessage = {
            messageId: 0,
            senderId: 0,
            messageType: 'text',
            messageContent: '',
            senderDisplayName: '',
            senderAvatar: null,
            sendTime: conv.updateTime || new Date().toISOString()
          };
        }

        return conv;
      });
    },

    /**
     * 更新会话映射缓存
     */
    updateConversationMap() {
      this.conversationMap.clear();
      this.conversations.forEach(conv => {
        this.conversationMap.set(conv.convId, conv);
      });
    },

    /**
     * 加载指定会话的群成员列表
     */
    async loadCompressedCM(convId: number, force: boolean = false) {
      // 如果不是强制刷新且已有缓存，则跳过
      if (!force && this.compressedCMMap.has(convId)) {
        console.log(`[loadCompressedCM] 会话 ${convId} 已有缓存，跳过加载`);
        return;
      }

      this.loadingCompressedCM = true;
      try {
        console.log(`[loadCompressedCM] 开始加载会话 ${convId} 的群成员`);
        const members = await loadConversationMembers(convId);
        this.compressedCMMap.set(convId, members);
        console.log(`[loadCompressedCM] 会话 ${convId} 群成员加载成功，数量: ${members.length}`);
        console.log(`[loadCompressedCM] 群成员数据:`, members);
      } catch (error) {
        console.error('[loadCompressedCM] 加载群成员出错:', error);
      } finally {
        this.loadingCompressedCM = false;
      }
    },

    /**
     * 根据ID获取会话
     */
    getConversationById(convId: number): ConversationDetailDTO | undefined {
      return this.conversationMap.get(convId);
    },

    /**
     * 设置当前会话
     */
    setCurrentConversation(convId: number) {
      const conversation = this.getConversationById(convId);
      if (conversation) {
        this.currentConversation = conversation;
        // 如果是群聊，加载群成员
        if (conversation.convType === 2) {
          this.loadCompressedCM(convId);
        }
      } else {
        console.warn(`会话 ${convId} 不存在`);
        this.currentConversation = null;
      }
    },

    /**
     * 清空当前会话
     */
    clearCurrentConversation() {
      this.currentConversation = null;
    },

    /**
     * 搜索会话
     */
    searchConversations(keyword: string): ConversationDetailDTO[] {
      if (!keyword.trim()) {
        return this.conversations;
      }

      const lowerKeyword = keyword.toLowerCase();
      return this.conversations.filter(conv =>
        conv.convName.toLowerCase().includes(lowerKeyword) ||
        (conv.lastMessage?.messageContent?.toLowerCase() || '').includes(lowerKeyword)
      );
    },

    /**
     * 更新搜索关键词
     */
    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword;
    },

    /**
     * 标记会话为已读
     */
    markAsRead(convId: number) {
      const conversation = this.getConversationById(convId);
      if (conversation) {
        conversation.unreadCount = 0;
      }
    },

    /**
     * 更新会话的最后消息（用于实时消息）
     */
    updateLastMessage(convId: number, lastMessage: ConversationDetailDTO['lastMessage']) {
      const conversation = this.getConversationById(convId);
      if (conversation && lastMessage) {
        conversation.lastMessage = lastMessage;
        conversation.updateTime = lastMessage.sendTime;

        // 如果当前不在这个会话中，增加未读计数
        if (this.currentConversation?.convId !== convId) {
          conversation.unreadCount += 1;
        }

        // 将该会话移到列表顶部
        this.moveConversationToTop(convId);
      }
    },

    /**
     * 将会话移到列表顶部
     */
    moveConversationToTop(convId: number) {
      const index = this.conversations.findIndex(c => c.convId === convId);
      if (index > 0) {
        const [conversation] = this.conversations.splice(index, 1);
        this.conversations.unshift(conversation);
      }
    },

    /**
     * 按 convId 单独刷新一条会话详情（如修改备注后更新会话项展示）
     * 使用 getConversationDetailsViaToken(convId) 只拉取该会话，不全局刷新
     */
    /**
     * 从好友页发起单聊后：摘要常缺 targetUserId / convName，用好友列表（/friends）补全会话对象，供列表与 ChatContainer 使用。
     */
    hydrateSingleChatPeerFromFriendList(
      convId: number,
      peerFriendUserId: number
    ) {
      const conv = this.getConversationById(convId);
      if (!conv || conv.convType !== 1 || peerFriendUserId <= 0) return;
      const authStore = useAuthStore();
      if (conv.targetUserId == null || conv.targetUserId <= 0) {
        conv.targetUserId = peerFriendUserId;
      }
      if (!String(conv.convName || "").trim()) {
        conv.convName = resolveConversationDisplayName(
          conv,
          authStore.user?.userId || null
        );
      }
    },

    async refreshConversationById(convId: number) {
      try {
        const summaries = await loadConversationSummaries(convId);
        if (!summaries.length) return;
        const authStore = useAuthStore();
        const list = this.processConversations(
          summaries,
          authStore.user?.userId || null
        );
        const updated = list.find((c) => c.convId === convId);
        if (!updated) return;
        const index = this.conversations.findIndex((c) => c.convId === convId);
        if (index >= 0) {
          this.conversations.splice(index, 1, updated);
        } else {
          this.conversations.unshift(updated);
        }
        this.conversationMap.set(convId, updated);
        if (this.currentConversation?.convId === convId) {
          this.currentConversation = updated;
        }
        if (updated.convType === 1) {
          void useSingleChatPeerAvatarStore().loadAllSingleChatPeerProfiles();
        }
      } catch (error) {
        console.error('[refreshConversationById] 刷新会话失败:', convId, error);
      }
    },

    /**
     * 添加新会话（用于创建新会话）
     */
    addConversation(conversation: ConversationDetailDTO) {
      // 检查是否已存在
      if (!this.conversationMap.has(conversation.convId)) {
        this.conversations.unshift(conversation);
        this.conversationMap.set(conversation.convId, conversation);
      }
    },

    /**
     * 重置会话列表
     */
    resetConversations() {
      this.conversations = [];
      this.currentConversation = null;
      this.conversationMap.clear();
      this.searchKeyword = '';
    }
  },

  getters: {
    /**
     * 获取过滤后的会话列表（考虑搜索）
     */
    filteredConversations: (state) => {
      if (!state.searchKeyword.trim()) {
        return state.conversations;
      }
      const lowerKeyword = state.searchKeyword.toLowerCase();
      return state.conversations.filter(conv =>
        conv.convName.toLowerCase().includes(lowerKeyword) ||
        (conv.lastMessage?.messageContent?.toLowerCase() || '').includes(lowerKeyword)
      );
    },

    /**
     * 获取未读消息总数
     */
    totalUnreadCount: (state) => {
      return state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
    },

    /**
     * 是否正在加载
     */
    isLoading: (state) => state.loadingConversations,

    /**
     * 是否有会话
     */
    hasConversations: (state) => state.conversations.length > 0,

    /**
     * 获取当前会话ID
     */
    currentConversationId: (state) => state.currentConversation?.convId || null
  }
});