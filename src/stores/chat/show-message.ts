// src/stores/chat/show-message.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DisplayMessage } from '@/entity/message'; // 注意路径是否正确
import { messageDetailApi } from '@/apis/chat/message-detail';
import { useAuthStore } from '@/stores/auth';

export const useShowMessageStore = defineStore('message', () => {
  const authStore = useAuthStore();
  
  // 当前消息列表
  const messages = ref<DisplayMessage[]>([]);
  
  // 加载状态
  const loading = ref(false);

  /**
   * 加载消息 - 核心功能：获取后端数据显示在前端
   */
  const loadMessages = async (
    convId: number, 
    loadType: 'initial' | 'latest' | 'history' = 'initial',
    lastMessageId?: number
  ) => {
    if (!convId) return;
    
    try {
      loading.value = true;
      console.log(`开始加载消息，会话ID: ${convId}, 类型: ${loadType}`);
      
      // 获取当前用户ID
      const currentUserId = authStore.user?.userId;
      if (!currentUserId) {
        console.error('用户未登录');
        return;
      }
      
      // 根据加载类型调整参数
      let page = 1;
      let pageSize = 1000;
      
      if (loadType === 'latest') {
        pageSize = 1000;
      }
      
      if (loadType === 'history' && lastMessageId) {
        page = 1;
        pageSize = 1000;
      }
      
      // 调用API获取消息
      const response = await messageDetailApi.getMessageDetailsByConvId({
        convId,
        currentUserId,
        page,
        pageSize
      });
      
      console.log('API响应:', response);
      
      if (response.code === 200) {
        // 提取消息数据（这里API返回的是 any 类型，需要转换）
        let messagesData: any[] = response.data.messages || [];
        console.log(`获取到的消息数量: ${messagesData.length}`);
        
        // 处理消息：将原来的 MessageDetailDTO 转换为 DisplayMessage
        const processedMessages = messagesData.map((msg: any) => {
          // 构建 DisplayMessage 对象
          const displayMessage: DisplayMessage = {
            // 数据库基础字段
            messageId: msg.messageId,
            convId: msg.convId,
            senderId: msg.senderId,
            messageType: msg.messageType,
            messageContent: msg.messageContent,
            messageStatus: msg.messageStatus,
            sendTime: msg.sendTime,
            isRecalled: msg.isRecalled,
            replyToMessageId: msg.replyToMessageId,
            atUserIds: msg.atUserIds,
            recallTime: msg.recallTime,
            
            // 显示字段
            senderName: msg.displayName || msg.memberNickname || msg.privateDisplayName,
            senderAvatar: msg.senderAvatar,
            isSentByMe: msg.senderId === currentUserId,
          };
          
          return displayMessage;
        });
        
        // 根据加载类型更新消息列表
        if (loadType === 'initial') {
          messages.value = processedMessages;
        } else if (loadType === 'latest') {
          mergeMessages(processedMessages, 'append');
        } else if (loadType === 'history') {
          mergeMessages(processedMessages, 'prepend');
        }
        
        // 按时间排序
        sortMessagesByTime();
        
        console.log(`处理后消息列表数量: ${messages.value.length}`);
      } else {
        console.error('加载消息失败:', response.message);
        if (loadType === 'initial') {
          messages.value = [];
        }
      }
    } catch (error) {
      console.error('加载消息异常:', error);
      if (loadType === 'initial') {
        messages.value = [];
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 添加单个消息到列表
   */
  const addMessage = (message: DisplayMessage) => {
    // 确保 isSentByMe 字段正确
    const currentUserId = authStore.user?.userId;
    if (currentUserId) {
      message.isSentByMe = message.senderId === currentUserId;
    }
    
    // 检查是否已存在
    const exists = messages.value.some(
      msg => msg.messageId === message.messageId
    );
    
    if (!exists) {
      messages.value.push(message);
      console.log('✅ [show-message] 消息已添加到Store:', message);
      sortMessagesByTime();
      return true;
    }
    
    console.log('⚠️ [show-message] 消息已存在，跳过添加:', message.messageId);
    return false;
  };

  /**
   * 批量添加消息
   */
  const addMessages = (newMessages: DisplayMessage[]) => {
    const currentUserId = authStore.user?.userId;
    
    newMessages.forEach(msg => {
      if (currentUserId) {
        msg.isSentByMe = msg.senderId === currentUserId;
      }
      
      const exists = messages.value.some(
        existingMsg => existingMsg.messageId === msg.messageId
      );
      
      if (!exists) {
        messages.value.push(msg);
      }
    });
    
    sortMessagesByTime();
    console.log(`✅ [show-message] 批量添加了 ${newMessages.length} 条消息`);
  };

  /**
   * 用服务器消息替换临时消息
   */
  const replaceTempMessage = (tempMessageId: number, serverMessage: DisplayMessage) => {
    const index = messages.value.findIndex(msg => msg.messageId === tempMessageId);
    
    if (index !== -1) {
      // 更新 isSentByMe 字段
      const currentUserId = authStore.user?.userId;
      if (currentUserId) {
        serverMessage.isSentByMe = serverMessage.senderId === currentUserId;
      }
      
      messages.value[index] = serverMessage;
      console.log(`✅ [show-message] 临时消息 ${tempMessageId} 已替换为:`, serverMessage.messageId);
      sortMessagesByTime();
      return true;
    } else {
      console.log(`⚠️ [show-message] 找不到临时消息 ${tempMessageId}，直接添加服务器消息`);
      return addMessage(serverMessage);
    }
  };

  /**
   * 更新消息状态
   */
  const updateMessageStatus = (messageId: number, status: number) => {
    const index = messages.value.findIndex(msg => msg.messageId === messageId);
    if (index !== -1) {
      messages.value[index].messageStatus = status;
      console.log(`✅ [show-message] 消息 ${messageId} 状态更新为: ${status}`);
      return true;
    }
    return false;
  };

  /**
   * 合并消息到列表
   */
  const mergeMessages = (newMessages: DisplayMessage[], position: 'append' | 'prepend' = 'append') => {
    const currentUserId = authStore.user?.userId;
    
    // 处理消息字段
    const processedMessages = newMessages.map(msg => ({
      ...msg,
      isSentByMe: currentUserId ? msg.senderId === currentUserId : false
    }));
    
    // 去重
    const uniqueMessages = processedMessages.filter(newMsg => 
      !messages.value.some(existingMsg => 
        existingMsg.messageId === newMsg.messageId
      )
    );
    
    if (uniqueMessages.length === 0) {
      console.log('⚠️ [show-message] 没有新消息需要合并');
      return;
    }
    
    if (position === 'append') {
      messages.value = [...messages.value, ...uniqueMessages];
    } else {
      messages.value = [...uniqueMessages, ...messages.value];
    }
    
    console.log(`✅ [show-message] 合并了 ${uniqueMessages.length} 条新消息`);
  };

  /**
   * 按发送时间排序（升序：从旧到新）
   */
  const sortMessagesByTime = () => {
    messages.value.sort((a, b) => {
      const timeA = new Date(a.sendTime).getTime();
      const timeB = new Date(b.sendTime).getTime();
      return timeA - timeB;
    });
  };

  /**
   * 获取最新的一条消息
   */
  const getLatestMessage = () => {
    if (messages.value.length === 0) return null;
    return messages.value[messages.value.length - 1];
  };

  /**
   * 获取最旧的一条消息
   */
  const getOldestMessage = () => {
    if (messages.value.length === 0) return null;
    return messages.value[0];
  };

  /**
   * 清空消息
   */
  const clearMessages = () => {
    messages.value = [];
    console.log('✅ [show-message] 消息列表已清空');
  };

  /**
   * 重置消息
   */
  const resetMessages = () => {
    console.log('重置消息列表');
    clearMessages();
  };

  return {
    // 状态
    messages,
    loading,
    
    // 方法
    loadMessages,
    addMessage,
    addMessages,
    replaceTempMessage,
    updateMessageStatus,
    mergeMessages,
    getLatestMessage,
    getOldestMessage,
    clearMessages,
    resetMessages
  };
});