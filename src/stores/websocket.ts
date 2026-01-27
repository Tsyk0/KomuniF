// src/stores/websocket.ts
import { defineStore } from 'pinia';
import { WebSocketService } from '@/services/websocket/websocket.service';
import { useShowMessageStore } from './chat/show-message';
import { useConversationStore } from './chat/show-conversation';

export const useWebSocketStore = defineStore('websocket', {
  state: () => ({
    // 连接状态
    isConnected: false,
    isConnecting: false,
    
    // 用户信息
    userId: null as number | null,
    subscriptions: [] as number[],
    
    // 错误信息
    error: null as string | null,
    
    // 最后活动时间
    lastActivityTime: null as number | null,
    
    // 统计信息
    stats: {
      messagesSent: 0,
      messagesReceived: 0,
      connectionAttempts: 0
    },
    
    // WebSocket 服务实例
    _service: null as WebSocketService | null
  }),

  actions: {
    /**
     * 连接 WebSocket
     */
    async connect(): Promise<boolean> {
      // 防止重复连接
      if (this.isConnecting || this.isConnected) {
        console.log('WebSocket 已在连接或已连接');
        return true;
      }

      this.isConnecting = true;
      this.error = null;
      this.stats.connectionAttempts++;

      try {
        // 确保服务已初始化
        this._ensureService();
        
        // 连接
        const connected = await this._service!.connect();
        
        if (connected) {
          console.log('WebSocket 连接成功');
          return true;
        } else {
          throw new Error('连接失败');
        }
      } catch (error) {
        console.error('WebSocket 连接失败:', error);
        this.isConnecting = false;
        this.error = error instanceof Error ? error.message : '未知错误';
        return false;
      }
    },

    /**
     * 断开连接
     */
    disconnect(): void {
      console.log('断开 WebSocket 连接');
      
      if (this._service) {
        this._service.disconnect();
        this._service = null;
      }
      
      this.isConnected = false;
      this.isConnecting = false;
      this.userId = null;
      this.subscriptions = [];
      this.error = null;
      this.lastActivityTime = null;
    },

    /**
     * 发送文本消息
     */
    sendTextMessage(convId: number, content: string): boolean {
      if (!this.isConnected || !this._service) {
        console.error('发送失败：WebSocket 未连接');
        return false;
      }

      try {
        const success = this._service.sendTextMessage(convId, content);
        
        if (success) {
          this.stats.messagesSent++;
          this.lastActivityTime = Date.now();
        }
        
        return success;
      } catch (error) {
        console.error('发送消息失败:', error);
        this.error = '发送消息失败';
        return false;
      }
    },

    /**
     * 手动重连
     */
    async reconnect(): Promise<boolean> {
      console.log('手动重连');
      this.disconnect();
      return await this.connect();
    },

    /**
     * 内部方法：确保服务已初始化
     */
    _ensureService(): void {
      if (!this._service) {
        this._service = new WebSocketService();
        this._setupServiceListeners();
      }
    },

    /**
     * 内部方法：设置服务监听器
     */
    _setupServiceListeners(): void {
      if (!this._service) return;

      // 监听连接成功
      this._service.onMessage('connected', (data: any) => {
        console.log('WebSocket 连接成功，用户ID:', data.userId);
        
        this.isConnected = true;
        this.isConnecting = false;
        this.userId = data.userId;
        this.subscriptions = data.subscriptions || [];
        this.lastActivityTime = Date.now();
        this.error = null;
        
        // 通知连接成功
        this._onConnected(data);
      });

      // 监听新消息
      this._service.onMessage('newMessage', (data: any) => {
        console.log('收到新消息:', data);
        
        this.stats.messagesReceived++;
        this.lastActivityTime = Date.now();
        
        // 处理新消息
        this._handleNewMessage(data);
      });

      // 监听错误
      this._service.onMessage('error', (data: any) => {
        console.error('WebSocket 错误:', data);
        
        this.isConnected = false;
        this.isConnecting = false;
        this.error = data.message || '未知错误';
      });

      // 监听断开连接
      this._service.onMessage('disconnected', (data: any) => {
        console.log('WebSocket 断开连接:', data);
        
        this.isConnected = false;
        this.isConnecting = false;
        this.userId = null;
        this.subscriptions = [];
        
        // 非正常关闭时可以考虑自动重连
        if (data.code !== 1000) {
          console.log('连接异常断开');
        }
      });
    },

    /**
     * 内部方法：处理连接成功
     */
    _onConnected(data: any): void {
      console.log('用户连接成功，订阅了', data.subscriptions?.length || 0, '个会话');
      // 这里可以触发其他初始化操作
    },

    /**
     * 内部方法：处理新消息
     */
    _handleNewMessage(message: any): void {
  try {
    const messageStore = useShowMessageStore();
    const conversationStore = useConversationStore();
    
    // 获取当前用户ID来判断是否是自己发送的
    // 假设你能从某个地方获取当前用户ID
    const currentUserId = /* 从 authStore 或其他地方获取 */ 123;
    
    // 构建完整的 DisplayMessage 对象
    const displayMessage = {
      // 基础字段
      messageId: message.messageId,
      convId: message.convId,
      senderId: message.senderId,
      messageType: message.messageType,
      messageContent: message.messageContent,
      sendTime: message.sendTime,
      messageStatus: message.messageStatus,
      
      // 可选字段
      replyToMessageId: message.replyToMessageId || undefined,
      isRecalled: message.isRecalled || 0,
      atUserIds: message.atUserIds || null,
      recallTime: message.recallTime || null,
      
      // DisplayMessage 特有字段
      senderName: undefined, // 可以从用户信息获取
      senderAvatar: null,    // 可以从用户信息获取
      isSentByMe: message.senderId === currentUserId // ✅ 关键字段
    };
    
    // 添加到消息列表
    messageStore.addMessage(displayMessage);
    
  } catch (error) {
    console.error('处理新消息失败:', error);
  }
},
    /**
     * 获取统计信息
     */
    getStats() {
      return {
        ...this.stats,
        isConnected: this.isConnected,
        userId: this.userId,
        subscriptionCount: this.subscriptions.length,
        lastActivity: this.lastActivityTime 
          ? new Date(this.lastActivityTime).toLocaleTimeString()
          : '无活动'
      };
    }
  }
});