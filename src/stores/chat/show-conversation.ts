// src/stores/chat/show-conversation.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import conversationApi from '@/apis/chat/show-conversation';
import type { GetUserConversationsRequest } from '@/types/flow/show-chat.request';
import type { GetUserConversationsResponse } from '@/types/flow/show-chat.response';
import type { ConversationMember } from '@/entity/conversation-member';

/**
 * 会话状态管理 Store
 * 使用 Composition API 风格，与您的其他 Store 保持一致
 */
export const useConversationStore = defineStore('conversation', () => {
  // ============ 状态定义 ============
  
  /** 会话成员列表（原始数据） */
  const conversationMembers = ref<ConversationMember[]>([]);
  
  /** 加载状态 */
  const isLoading = ref<boolean>(false);
  
  /** 错误信息 */
  const error = ref<string>('');
  
  /** 当前选中的会话ID */
  const currentConversationId = ref<number | null>(null);
  
  // ============ 计算属性 ============
  
  /** 会话数量 */
  const conversationCount = computed(() => conversationMembers.value.length);
  
  /** 未读消息总数 */
  const totalUnreadCount = computed(() => 
    conversationMembers.value.reduce((total, member) => total + (member.unreadCount || 0), 0)
  );
  
  /** 格式化后的会话列表（用于界面展示） */
  const conversationList = computed(() => 
    conversationMembers.value.map(member => ({
      convId: member.convId,
      displayName: member.privateDisplayName || 
                 member.memberNickname || 
                 `会话 ${member.convId}`,
      avatar: '', // 后续可以根据需要添加
      lastMessage: '', // 后续可以从消息模块获取
      lastMessageTime: member.updateTime || member.joinTime,
      unreadCount: member.unreadCount || 0,
      memberStatus: member.memberStatus,
      rawData: member // 保留原始数据
    }))
  );
  
  /** 当前选中的会话 */
  const currentConversation = computed(() => 
    conversationMembers.value.find(member => member.convId === currentConversationId.value) || null
  );
  
  // ============ Actions（操作方法） ============
  
  /**
   * 获取用户的所有会话
   * @param {number|string} userId - 用户ID
   * @returns {Promise<void>}
   */
  async function fetchUserConversations(userId: number | string): Promise<void> {
    isLoading.value = true;
    error.value = '';
    
    try {
      const request: GetUserConversationsRequest = {
        userId: userId.toString()
      };
      
      const response: GetUserConversationsResponse = await conversationApi.getUserConversations(request);
      
      if (response.code === 200) {
        conversationMembers.value = response.data;
        console.log(`成功获取 ${response.data.length} 个会话`);
      } else {
        throw new Error(response.message || '获取会话列表失败');
      }
    } catch (err: any) {
      error.value = err.message || '网络请求失败';
      console.error('获取会话列表失败:', err);
      throw err; // 抛出错误让调用方处理
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 设置当前会话
   * @param {number} convId - 会话ID
   */
  function setCurrentConversation(convId: number): void {
    currentConversationId.value = convId;
  }
  
  /**
   * 清除错误信息
   */
  function clearError(): void {
    error.value = '';
  }
  
  /**
   * 重置状态
   */
  function reset(): void {
    conversationMembers.value = [];
    isLoading.value = false;
    error.value = '';
    currentConversationId.value = null;
  }
  
  // ============ 导出 ============
  return {
    // 状态
    conversationMembers,
    isLoading,
    error,
    currentConversationId,
    
    // 计算属性
    conversationCount,
    totalUnreadCount,
    conversationList,
    currentConversation,
    
    // 方法
    fetchUserConversations,
    setCurrentConversation,
    clearError,
    reset
  };
});