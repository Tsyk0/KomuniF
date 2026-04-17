// File: src/stores/chat/send-message.ts
// src/stores/chat/send-message.ts
// 专门处理消息发送功能的Store

import { defineStore } from 'pinia';
import type { BaseResponse } from '@/types/dto/base';
import type { SendMessageRequest, SendMessageResponseData } from '@/types/dto/message';
import sendMessageApi from '@/apis/chat/message-send';
import { ref } from 'vue';
import { useWebSocketStore } from '@/stores/websocket-store';
import type { DisplayMessage } from '@/entity/message'; // 新增导入

export const useSendMessageStore = defineStore('sendMessage', () => {
  const webSocketStore = useWebSocketStore();
  
  // 发送状态
  const isSending = ref(false);
  
  /**
   * 发送消息（双通道：WebSocket + HTTP）
   */
  const sendMessage = async (request: SendMessageRequest): Promise<SendMessageResponseData> => {
    isSending.value = true;
    
    try {
      console.log('[send-message] 发送消息请求:', request);
      
      // 1. 首先尝试WebSocket发送
      const wsSuccess = webSocketStore.sendTextMessage(request.convId, request.messageContent);
      
      if (wsSuccess) {
        console.log('[send-message] WebSocket消息已发送');
      } else {
        console.warn('[send-message] WebSocket发送失败，继续HTTP发送');
      }
      
      // 2. 发送HTTP消息（确保数据持久化）
      const response: BaseResponse<SendMessageResponseData> = await sendMessageApi(request);
      
      console.log('[send-message] HTTP响应:', response);
      
      if (response.code === 200) {
        console.log('[send-message] 消息发送成功:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('[send-message] 发送消息失败:', error);
      throw error;
    } finally {
      isSending.value = false;
    }
  };
  
  /**
   * 发送文本消息（便捷方法）
   */
  const sendTextMessage = async (
    convId: number,
    senderId: number, // 兼容保留参数，但不再使用
    content: string
  ): Promise<SendMessageResponseData> => {
    return sendMessage({
      convId,
      // senderId, // 不再传递senderId
      messageType: 'text',
      messageContent: content
    });
  };

  return {
    // 状态
    isSending,
    
    // 方法
    sendMessage,
    sendTextMessage
  };
});