// src/stores/chat/show-message.ts
import { defineStore } from 'pinia';
import type { MessageDetailDTO } from '@/types/form/message-detail';
import { messageDetailApi } from '@/apis/chat/message-detail';
import { useAuthStore } from '@/stores/auth';

export const useMessageStore = defineStore('message', {
  state: () => ({
    // 当前会话的消息列表
    currentMessages: [] as MessageDetailDTO[],
    
    // 消息分页信息
    messagePagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: true
    },
    
    // 加载状态
    loadingMessages: false,
    
    // 头像缓存
    avatarCache: new Map<string, string>()
  }),

  actions: {
    /**
     * 加载消息详情列表（使用复合查询）
     */
    async loadMessages(convId: number, page: number = 1) {
      try {
        this.loadingMessages = true;
        
        const authStore = useAuthStore();
        const currentUserId = authStore.user?.userId;
        
        if (!currentUserId) {
          throw new Error('用户未登录');
        }
        
        // 使用新的复合查询API
        const response = await messageDetailApi.getMessageDetailsByConvId({
          convId,
          currentUserId,
          page,
          pageSize: this.messagePagination.pageSize
        });
        
        if (response.code === 200) {
          const { messages, total, page: currentPage } = response.data;
          
          // 处理消息数据（主要是头像URL）
          const processedMessages = this.processMessages(messages);
          
          if (page === 1) {
            // 第一页，重置消息列表
            this.currentMessages = processedMessages;
          } else {
            // 加载更多，追加到现有列表
            this.currentMessages = [...this.currentMessages, ...processedMessages];
          }
          
          // 更新分页信息
          this.messagePagination = {
            page: currentPage,
            pageSize: this.messagePagination.pageSize,
            total,
            hasMore: this.currentMessages.length < total
          };
          
          return processedMessages;
        } else {
          throw new Error(response.message || '加载消息失败');
        }
      } catch (error) {
        console.error('加载消息失败:', error);
        throw error;
      } finally {
        this.loadingMessages = false;
      }
    },
    
    /**
     * 处理消息数据
     */
    processMessages(messages: MessageDetailDTO[]): MessageDetailDTO[] {
      return messages.map(msg => {
        // 处理头像URL
        if (msg.senderAvatar) {
          msg.senderAvatar = this.processAvatarUrl(msg.senderAvatar);
        }
        return msg;
      });
    },
    
    /**
     * 处理头像URL并缓存
     */
    processAvatarUrl(avatarUrl: string): string {
      if (!avatarUrl || avatarUrl === "") {
        return "";
      }
      
      // 检查缓存
      if (this.avatarCache.has(avatarUrl)) {
        return this.avatarCache.get(avatarUrl)!;
      }
      
      // 处理URL
      let processedUrl = avatarUrl;
      if (!processedUrl.startsWith("http") && !processedUrl.startsWith("data:image/")) {
        processedUrl = processedUrl.trim();
        if (!processedUrl.startsWith("/")) {
          processedUrl = "/" + processedUrl;
        }
        processedUrl = "http://localhost:8081" + processedUrl;
      }
      
      // 缓存结果
      this.avatarCache.set(avatarUrl, processedUrl);
      return processedUrl;
    },
    
    /**
     * 加载更多消息
     */
    async loadMoreMessages(convId: number) {
      if (!this.messagePagination.hasMore || this.loadingMessages) {
        return;
      }
      
      const nextPage = this.messagePagination.page + 1;
      return await this.loadMessages(convId, nextPage);
    },
    
    /**
     * 添加单条消息（用于发送或接收实时消息）
     */
    addMessage(message: MessageDetailDTO) {
      // 处理头像
      if (message.senderAvatar) {
        message.senderAvatar = this.processAvatarUrl(message.senderAvatar);
      }
      
      this.currentMessages.push(message);
      
      // 更新分页总数
      this.messagePagination.total += 1;
    },
    
    /**
     * 发送消息（调用发送API，然后添加到列表）
     */
    async sendMessage(messageData: any) {
      // TODO: 调用发送消息API
      // const response = await sendMessageApi(messageData);
      
      // 临时模拟发送成功
      const newMessage: MessageDetailDTO = {
        messageId: Date.now(), // 临时ID
        convId: messageData.convId,
        senderId: messageData.senderId,
        messageType: messageData.messageType,
        messageContent: messageData.messageContent,
        messageStatus: 1, // 已发送
        isRecalled: false,
        sendTime: new Date().toISOString(),
        senderAvatar: null,
        displayName: '我', // 后端会计算
        memberNickname: null,
        privateDisplayName: null,
        convType: 1, // 默认单聊
        isSentByMe: true
      };
      
      this.addMessage(newMessage);
      return newMessage;
    },
    
    /**
     * 重置消息列表
     */
    resetMessages() {
      this.currentMessages = [];
      this.messagePagination = {
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: true
      };
    },
    
    /**
     * 清除头像缓存
     */
    clearAvatarCache() {
      this.avatarCache.clear();
    }
  },

  getters: {
    /**
     * 是否正在加载消息
     */
    isLoading: (state) => state.loadingMessages,
    
    /**
     * 是否有更多消息
     */
    hasMoreMessages: (state) => state.messagePagination.hasMore,
    
    /**
     * 最后一条消息
     */
    lastMessage: (state) => {
      if (state.currentMessages.length === 0) return null;
      return state.currentMessages[state.currentMessages.length - 1];
    },
    
    /**
     * 获取处理过的头像URL
     */
    getProcessedAvatar: (state) => {
      return (avatarUrl: string | null) => {
        if (!avatarUrl) return '';
        if (state.avatarCache.has(avatarUrl)) {
          return state.avatarCache.get(avatarUrl)!;
        }
        return avatarUrl;
      };
    }
  }
});