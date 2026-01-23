import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MessageDetailDTO } from '@/types/form/message-detail';
import { messageDetailApi } from '@/apis/chat/message-detail';
import { useAuthStore } from '@/stores/auth';

export const useMessageStore = defineStore('message', () => {
  const authStore = useAuthStore();
  
  // 当前消息列表
  const messages = ref<MessageDetailDTO[]>([]);
  
  // 加载状态
  const loading = ref(false);

  /**
   * 加载消息 - 核心功能：获取后端数据显示在前端
   */
  const loadMessages = async (convId: number) => {
    if (!convId) return;
    
    try {
      loading.value = true;
      console.log('开始加载消息，会话ID:', convId);
      
      // 获取当前用户ID
      const currentUserId = authStore.user?.userId;
      if (!currentUserId) {
        console.error('用户未登录');
        return;
      }
      
      // 调用API获取消息
      const response = await messageDetailApi.getMessageDetailsByConvId({
        convId,
        currentUserId,
        page: 1,
        pageSize: 20
      });
      
      console.log('API响应:', response);
      
      // 检查响应状态
      if (response.code === 200) {
        // 提取消息数据
        const messagesData = response.data.messages || [];
        console.log('获取到的消息数据:', messagesData);
        
        // 处理消息：标记是否是自己发送的
        const processedMessages = messagesData.map((msg: MessageDetailDTO) => ({
          ...msg,
          isSentByMe: msg.senderId === currentUserId
        }));
        
        // 更新消息列表
        messages.value = processedMessages;
        console.log('处理后的消息列表:', messages.value);
      } else {
        console.error('加载消息失败:', response.message);
        messages.value = [];
      }
    } catch (error) {
      console.error('加载消息异常:', error);
      messages.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空消息
   */
  const clearMessages = () => {
    messages.value = [];
  };

  /**
   * 重置消息 - 与现有代码兼容的方法
   * 功能与clearMessages相同，只是名称不同
   */
  const resetMessages = () => {
    console.log('重置消息列表');
    messages.value = [];
  };

  return {
    // 状态
    messages,
    loading,
    
    // 方法
    loadMessages,
    clearMessages,
    resetMessages // 添加这个方法
  };
});