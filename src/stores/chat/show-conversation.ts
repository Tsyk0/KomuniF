// src/stores/chat/show-conversation.ts
import { defineStore } from 'pinia';
import type { ConversationDetailDTO, CompressedCM } from '@/types/dto/conversation';
import { conversationDetailApi } from '@/apis/chat/conversation-detail';
import { CompressedCMApi } from '@/apis/chat/group-member';
import { useAuthStore } from '@/stores/auth';

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
    /**
     * 加载用户的会话列表（使用复合查询）
     */
    async loadConversations() {
      try {
        this.loadingConversations = true;
        
        // 使用新的复合查询API
        const response = await conversationDetailApi.getConversationDetailsByUserId();
        
        if (response.code === 200) {
          // 处理返回的数据
          this.conversations = this.processConversations(response.data);
          
          // 更新缓存映射
          this.updateConversationMap();
          
          return this.conversations;
        } else {
          throw new Error(response.message || '加载会话失败');
        }
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
    processConversations(conversations: ConversationDetailDTO[]): ConversationDetailDTO[] {
      return conversations.map(conv => {
        // 确保会话显示名称
        if (!conv.convName || conv.convName.trim() === '') {
          if (conv.convType === 1) {
            // 单聊：使用私有显示名称或默认
            conv.convName = conv.privateDisplayName || '私聊会话';
          } else {
            // 群聊：使用默认
            conv.convName = '群聊会话';
          }
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
        return;
      }

      this.loadingCompressedCM = true;
      try {
        const response = await CompressedCMApi.getCompressedCM(convId);
        if (response.code === 200) {
          this.compressedCMMap.set(convId, response.data);
        } else {
          console.warn(`加载群成员失败: ${response.message}`);
        }
      } catch (error) {
        console.error('加载群成员出错:', error);
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