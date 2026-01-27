// src/stores/chat/websocket-store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

// WebSocket消息接口
export interface WebSocketMessage {
  action: string;
  [key: string]: any;
}

export const useWebSocketStore = defineStore('websocket', () => {
  // Store
  const authStore = useAuthStore();
  
  // 状态
  const wsConnection = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = 5;
  
  // 防止重复连接的标志
  let isConnecting = false;

  /**
   * 获取连接状态文本 - 修复类型问题（接受可选参数）
   */
  const getReadyStateText = (readyState?: number): string => {
    if (readyState === undefined || readyState === null) {
      return 'NOT_CONNECTED (undefined)';
    }
    
    switch (readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING (0)';
      case WebSocket.OPEN: return 'OPEN (1)';
      case WebSocket.CLOSING: return 'CLOSING (2)';
      case WebSocket.CLOSED: return 'CLOSED (3)';
      default: return `UNKNOWN (${readyState})`;
    }
  };

  /**
   * 建立WebSocket连接 - 修复版
   */
  const connect = (userId: number, convId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 防止重复连接
      if (isConnecting) {
        console.log('⚠️ [websocket-store] 已经在连接中，跳过');
        resolve();
        return;
      }
      
      if (isConnected.value && wsConnection.value?.readyState === WebSocket.OPEN) {
        console.log('✅ [websocket-store] 已经连接，跳过');
        resolve();
        return;
      }

      isConnecting = true;
      
      try {
        // 关闭现有连接
        disconnect();
        
        const token = authStore.token;
        
        if (!token) {
          console.error('❌ [websocket-store] 未找到认证token，请先登录');
          connectionError.value = '请先登录';
          isConnecting = false;
          reject(new Error('未找到认证token'));
          return;
        }
        
        const backendUrl = 'localhost:8081';
        const wsUrl = `ws://${backendUrl}/ws?token=${encodeURIComponent(token)}`;
        
        console.log('🔄 [websocket-store] 正在建立WebSocket连接:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ [websocket-store] WebSocket连接已建立');
          wsConnection.value = ws;
          isConnected.value = true;
          connectionError.value = null;
          reconnectAttempts.value = 0;
          isConnecting = false;
          
          startHeartbeat();
          resolve();
        };
        
        ws.onclose = (event) => {
          console.log('ℹ️ [websocket-store] WebSocket连接已关闭:', event.code, event.reason);
          wsConnection.value = null;
          isConnected.value = false;
          isConnecting = false;
          stopHeartbeat();
          
          if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
            scheduleReconnect(userId, convId);
          }
          
          if (event.code !== 1000) {
            connectionError.value = `连接已断开: ${event.reason || '未知原因'}`;
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ [websocket-store] WebSocket连接错误:', error);
          connectionError.value = '连接错误';
          isConnecting = false;
          reject(new Error('WebSocket连接失败'));
        };
        
        ws.onmessage = (event) => {
          handleWebSocketMessage(event.data);
        };
        
      } catch (error) {
        console.error('❌ [websocket-store] 建立WebSocket连接失败:', error);
        connectionError.value = '连接失败';
        isConnecting = false;
        reject(error);
      }
    });
  };
  
  /**
   * 关闭WebSocket连接 - 修复版
   */
  const disconnect = () => {
    if (wsConnection.value) {
      const readyState = wsConnection.value.readyState;
      console.log('🔄 [websocket-store] 正在关闭WebSocket连接');
      console.log('  当前状态:', {
        readyState: readyState,
        readyStateText: getReadyStateText(readyState)
      });
      
      stopHeartbeat();
      
      if (readyState === WebSocket.OPEN) {
        console.log('🔄 [websocket-store] 发送正常关闭信号');
        wsConnection.value.close(1000, '正常关闭');
      } else {
        console.log('🔄 [websocket-store] 连接已处于非打开状态，直接清理');
      }
      
      wsConnection.value = null;
      isConnected.value = false;
    }
  };
  
  /**
   * 发送WebSocket消息 - 修复版（状态一致性检查）
   */
  const sendMessage = (message: WebSocketMessage): boolean => {
    console.log('🔄 [websocket-store] 尝试发送WebSocket消息');
    console.log('  连接对象:', wsConnection.value);
    
    // 获取 readyState 值
    const readyState = wsConnection.value?.readyState;
    console.log('  连接状态:', readyState);
    console.log('  是否已连接:', isConnected.value);
    console.log('  消息内容:', message);
    
    if (!wsConnection.value || readyState !== WebSocket.OPEN) {
      console.error('❌ [websocket-store] WebSocket连接不存在或未打开');
      console.error('  详细状态:', {
        hasConnection: !!wsConnection.value,
        readyState: readyState,
        readyStateText: getReadyStateText(readyState), // 🔴 修复：传递 readyState
        storeIsConnected: isConnected.value
      });
      
      // 自动修复状态不一致
      if (isConnected.value && (!wsConnection.value || readyState !== WebSocket.OPEN)) {
        console.warn('⚠️ [websocket-store] 状态不一致，自动修正');
        isConnected.value = false;
      }
      
      return false;
    }
    
    try {
      const messageStr = JSON.stringify(message);
      console.log('📤 [websocket-store] 发送WebSocket消息:', messageStr);
      wsConnection.value.send(messageStr);
      console.log('✅ [websocket-store] WebSocket消息发送成功');
      return true;
    } catch (error) {
      console.error('❌ [websocket-store] 发送WebSocket消息失败:', error);
      return false;
    }
  };
  
  // 心跳相关
  let heartbeatInterval: number | null = null;
  
  /**
   * 开始心跳 - 修复：发送纯文本ping
   */
  const startHeartbeat = () => {
    stopHeartbeat(); // 先停止已有的
    heartbeatInterval = window.setInterval(() => {
      if (wsConnection.value?.readyState === WebSocket.OPEN) {
        console.log('💓 [websocket-store] 发送心跳ping');
        
        try {
          // 🔴 修复：发送纯文本ping（后端期望纯文本）
          wsConnection.value.send('ping');
        } catch (error) {
          console.error('💔 [websocket-store] 发送心跳失败:', error);
        }
      }
    }, 30000); // 30秒一次
  };
  
  /**
   * 停止心跳
   */
  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };
  
  /**
   * 安排重连 - 修复版
   */
  const scheduleReconnect = (userId: number, convId: number) => {
    reconnectAttempts.value++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000);
    
    console.log(`🔄 [websocket-store] 将在 ${delay}ms 后尝试重连 (第${reconnectAttempts.value}次)`);
    
    setTimeout(() => {
      if (!isConnected.value) {
        console.log(`🔄 [websocket-store] 执行第${reconnectAttempts.value}次重连`);
        connect(userId, convId).catch(error => {
          console.error('❌ [websocket-store] 重连失败:', error);
        });
      }
    }, delay);
  };
  
  /**
   * 处理WebSocket消息 - 修复：支持纯文本和JSON
   */
  const handleWebSocketMessage = (data: string) => {
    console.log('📥 [websocket-store] 收到WebSocket消息:', data);
    
    try {
      // 处理心跳响应（纯文本）
      if (data === 'pong') {
        console.log('💓 [websocket-store] 收到心跳响应pong');
        return;
      }
      
      // 尝试解析JSON
      let message;
      try {
        message = JSON.parse(data);
      } catch (e) {
        // 如果不是JSON，可能是纯文本消息
        console.log('📥 [websocket-store] 收到非JSON消息:', data);
        return;
      }
      
      // 处理连接成功响应
      if (message.action === 'connected') {
        console.log('✅ [websocket-store] 服务器连接成功确认:', message);
        isConnected.value = true;
        connectionError.value = null;
        
        const event = new CustomEvent('websocket:connected', {
          detail: message
        });
        window.dispatchEvent(event);
        return;
      }
      
      // 根据action分发处理
      switch (message.action) {
        case 'newMessage':
          handleNewMessage(message);
          break;
        case 'messageSent':
          handleMessageSent(message);
          break;
        case 'error':
          handleErrorMessage(message);
          break;
        default:
          console.warn('⚠️ [websocket-store] 未知的WebSocket消息类型:', message.action, message);
      }
    } catch (error) {
      console.error('❌ [websocket-store] 解析WebSocket消息失败:', error, data);
    }
  };
  
  /**
   * 处理新消息
   */
  const handleNewMessage = (message: any) => {
    console.log('🔔 [websocket-store] 收到newMessage广播:', message);
    
    // 确保消息格式正确
    if (!message.convId || !message.messageContent) {
      console.warn('⚠️ [websocket-store] 收到的消息格式不正确:', message);
      return;
    }
    
    // 触发新消息事件
    const event = new CustomEvent('websocket:newMessage', {
      detail: message
    });
    
    console.log('🔄 [websocket-store] 派发websocket:newMessage事件');
    window.dispatchEvent(event);
  };
  
  /**
   * 处理消息发送成功
   */
  const handleMessageSent = (message: any) => {
    console.log('✅ [websocket-store] 消息发送成功确认:', message);
    
    const event = new CustomEvent('websocket:messageSent', {
      detail: message
    });
    window.dispatchEvent(event);
  };
  
  /**
   * 处理错误消息 - 修复：过滤ping相关错误
   */
  const handleErrorMessage = (message: any) => {
    const errorMsg = message.message || message;
    
    // 🔴 修复：过滤ping相关的历史错误
    if (errorMsg && typeof errorMsg === 'string' && errorMsg.includes('ping')) {
      console.log('⚠️ [websocket-store] 忽略ping相关的历史错误:', errorMsg);
      return;
    }
    
    console.error('❌ [websocket-store] WebSocket错误:', errorMsg);
    connectionError.value = errorMsg || 'WebSocket错误';
    
    const event = new CustomEvent('websocket:error', {
      detail: errorMsg
    });
    window.dispatchEvent(event);
  };
  
  /**
   * 发送文本消息 - 增强版
   */
  const sendTextMessage = (
    convId: number,
    messageContent: string,
    replyToMessageId?: number
  ): boolean => {
    const currentUser = authStore.user;
    if (!currentUser?.userId) {
      console.error('❌ [websocket-store] 无法发送消息：用户未登录');
      return false;
    }
    
    const message: WebSocketMessage = {
      action: 'sendMessage',
      convId,
      senderId: currentUser.userId,
      messageType: 'text',
      messageContent,
      replyToMessageId,
      timestamp: Date.now(),
      localMessageId: `local_${Date.now()}` // 用于消息确认
    };
    
    console.log('📤 [websocket-store] 发送文本消息:', message);
    return sendMessage(message);
  };
  
  /**
   * 发送已读回执
   */
  const sendReadReceipt = (messageId: number, convId: number): boolean => {
    const message: WebSocketMessage = {
      action: 'readMessage',
      messageId,
      convId
    };
    
    return sendMessage(message);
  };
  
  /**
   * 发送撤回消息
   */
  const sendRecallMessage = (messageId: number, convId: number): boolean => {
    const message: WebSocketMessage = {
      action: 'recallMessage',
      messageId,
      convId
    };
    
    return sendMessage(message);
  };
  
  /**
   * 手动重连
   */
  const reconnect = async (): Promise<boolean> => {
    console.log('🔄 [websocket-store] 手动重连');
    try {
      console.warn('⚠️ [websocket-store] 手动重连需要userId和convId参数');
      return false;
    } catch (error) {
      console.error('❌ [websocket-store] 手动重连失败:', error);
      return false;
    }
  };
  
  return {
    // 状态
    wsConnection,
    isConnected,
    connectionError,
    reconnectAttempts,
    
    // 方法
    connect,
    disconnect,
    sendMessage,
    sendTextMessage,
    sendReadReceipt,
    sendRecallMessage,
    reconnect,
    getReadyStateText // 导出以便调试
  };
});