// src/stores/chat/websocket-store.ts
// WebSocket连接管理Store

import { defineStore } from 'pinia';
import { ref } from 'vue';

// WebSocket消息接口
export interface WebSocketMessage {
  action: string;
  [key: string]: any;
}

export const useWebSocketStore = defineStore('websocket', () => {
  // 状态
  const wsConnection = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = 5;
  
  /**
   * 建立WebSocket连接
   */
  const connect = (userId: number, convId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // 关闭现有连接
        disconnect();
        
        // 构建WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}&convId=${convId}`;
        console.log('🔄 [websocket-store] 正在建立WebSocket连接:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ [websocket-store] WebSocket连接已建立');
          wsConnection.value = ws;
          isConnected.value = true;
          connectionError.value = null;
          reconnectAttempts.value = 0;
          
          // 开始心跳
          startHeartbeat();
          resolve();
        };
        
        ws.onclose = (event) => {
          console.log('ℹ️ [websocket-store] WebSocket连接已关闭:', event.code, event.reason);
          wsConnection.value = null;
          isConnected.value = false;
          stopHeartbeat();
          
          // 如果不是正常关闭，尝试重连
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
          reject(new Error('WebSocket连接失败'));
        };
        
        // 设置消息处理器
        ws.onmessage = (event) => {
          handleWebSocketMessage(event.data);
        };
        
      } catch (error) {
        console.error('❌ [websocket-store] 建立WebSocket连接失败:', error);
        connectionError.value = '连接失败';
        reject(error);
      }
    });
  };
  
  /**
   * 关闭WebSocket连接
   */
  const disconnect = () => {
    if (wsConnection.value) {
      console.log('🔄 [websocket-store] 正在关闭WebSocket连接');
      stopHeartbeat();
      wsConnection.value.close(1000, '正常关闭');
      wsConnection.value = null;
      isConnected.value = false;
    }
  };
  
  /**
   * 发送WebSocket消息
   */
  const sendMessage = (message: WebSocketMessage): boolean => {
    console.log('🔄 [websocket-store] 尝试发送WebSocket消息');
    console.log('  连接对象:', wsConnection.value);
    console.log('  连接状态:', wsConnection.value?.readyState);
    console.log('  是否已连接:', isConnected.value);
    
    if (!wsConnection.value) {
      console.error('❌ [websocket-store] WebSocket连接不存在');
      return false;
    }
    
    if (wsConnection.value.readyState !== WebSocket.OPEN) {
      console.error(`❌ [websocket-store] WebSocket连接未就绪，状态: ${wsConnection.value.readyState}`);
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
   * 开始心跳
   */
  const startHeartbeat = () => {
    stopHeartbeat(); // 先停止已有的
    heartbeatInterval = window.setInterval(() => {
      if (wsConnection.value?.readyState === WebSocket.OPEN) {
        console.log('💓 [websocket-store] 发送心跳ping');
        wsConnection.value.send('ping');
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
   * 安排重连
   */
  const scheduleReconnect = (userId: number, convId: number) => {
    reconnectAttempts.value++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000);
    
    console.log(`🔄 [websocket-store] 将在 ${delay}ms 后尝试重连 (第${reconnectAttempts.value}次)`);
    
    setTimeout(() => {
      if (!isConnected.value) {
        connect(userId, convId).catch(error => {
          console.error('❌ [websocket-store] 重连失败:', error);
        });
      }
    }, delay);
  };
  
  /**
   * 处理WebSocket消息
   */
  const handleWebSocketMessage = (data: string) => {
    console.log('📥 [websocket-store] 收到WebSocket消息:', data);
    
    try {
      // 处理心跳响应
      if (data === 'pong') {
        console.log('💓 [websocket-store] 收到心跳响应pong');
        return;
      }
      
      const message = JSON.parse(data);
      
      // 根据action分发处理
      switch (message.action) {
        case 'newMessage':
          handleNewMessage(message);
          break;
        case 'newFileMessage':
          handleNewFileMessage(message);
          break;
        case 'messageSent':
          handleMessageSent(message);
          break;
        case 'messageRecalled':
          handleMessageRecalled(message);
          break;
        case 'messageRead':
          handleMessageRead(message);
          break;
        case 'error':
          handleErrorMessage(message);
          break;
        default:
          console.warn('⚠️ [websocket-store] 未知的WebSocket消息类型:', message.action);
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
    
    // 触发新消息事件
    const event = new CustomEvent('websocket:newMessage', {
      detail: message
    });
    
    console.log('🔄 [websocket-store] 派发websocket:newMessage事件');
    window.dispatchEvent(event);
  };
  
  /**
   * 处理新文件消息
   */
  const handleNewFileMessage = (message: any) => {
    console.log('📁 [websocket-store] 收到新文件消息:', message);
    
    const event = new CustomEvent('websocket:newFileMessage', {
      detail: message
    });
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
   * 处理消息撤回
   */
  const handleMessageRecalled = (message: any) => {
    console.log('↩️ [websocket-store] 消息被撤回:', message);
    
    const event = new CustomEvent('websocket:messageRecalled', {
      detail: message
    });
    window.dispatchEvent(event);
  };
  
  /**
   * 处理消息已读
   */
  const handleMessageRead = (message: any) => {
    console.log('👀 [websocket-store] 消息已读:', message);
    
    const event = new CustomEvent('websocket:messageRead', {
      detail: message
    });
    window.dispatchEvent(event);
  };
  
  /**
   * 处理错误消息
   */
  const handleErrorMessage = (message: any) => {
    console.error('❌ [websocket-store] WebSocket错误:', message.message);
    connectionError.value = message.message;
    
    const event = new CustomEvent('websocket:error', {
      detail: message.message
    });
    window.dispatchEvent(event);
  };
  
  /**
   * 发送文本消息
   */
  const sendTextMessage = (
    convId: number,
    messageContent: string,
    replyToMessageId?: number
  ): boolean => {
    const message: WebSocketMessage = {
      action: 'sendMessage',
      convId,
      messageType: 'text',
      messageContent,
      replyToMessageId
    };
    
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
  
  return {
    // 状态
    wsConnection,
    isConnected,
    connectionError,
    
    // 方法
    connect,
    disconnect,
    sendMessage,
    sendTextMessage,
    sendReadReceipt,
    sendRecallMessage
  };
});