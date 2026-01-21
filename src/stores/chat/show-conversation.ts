// src/stores/chat/show-conversation.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import conversationApi from '@/apis/chat/show-conversation';
import type { GetUserConversationsRequest } from '@/types/flow/show-chat.request';
import type { GetUserConversationsResponse } from '@/types/flow/show-chat.response';
import type { ConversationMember } from '@/entity/conversation-member';
import type { Conversation } from '@/entity/conversation';

/**
 * 会话状态管理 Store
 * 使用 Composition API 风格，与您的其他 Store 保持一致
 */
export const useConversationStore = defineStore('conversation', () => {
  // ============ 状态定义 ============
  
  /** 会话成员列表（原始数据） */
  const conversationMembers = ref<ConversationMember[]>([]);
  
  /** 会话信息缓存（convId -> Conversation） */
  const conversationsCache = ref<Map<number, Conversation>>(new Map());
  
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
  
  /**
   * 获取会话显示名称
   * 优先级：privateDisplayName > convName > 默认名称
   */
  const getDisplayName = (member: ConversationMember): string => {
    // 1. 优先使用用户设置的私有显示名称
    if (member.privateDisplayName) {
      return member.privateDisplayName;
    }
    
    // 2. 从缓存中获取会话公共名称
    const conversation = conversationsCache.value.get(member.convId);
    if (conversation?.convName) {
      return conversation.convName;
    }
    
    // 3. 默认名称
    const convType = conversation?.convType;
    if (convType === 1) {
      return `私聊 ${member.convId}`;
    } else if (convType === 2) {
      return `群聊 ${member.convId}`;
    }
    
    return `会话 ${member.convId}`;
  };
  
  /** 格式化后的会话列表（用于界面展示） */
  const conversationList = computed(() => 
    conversationMembers.value.map(member => {
      const conversation = conversationsCache.value.get(member.convId);
      
      // 计算显示名称
      const displayName = (() => {
        // 1. 优先使用用户设置的私有显示名称
        if (member.privateDisplayName) {
          return member.privateDisplayName;
        }
        
        // 2. 使用会话的公共名称
        if (conversation?.convName) {
          return conversation.convName;
        }
        
        // 3. 默认名称
        const convType = conversation?.convType;
        if (convType === 1) {
          return `私聊 ${member.convId}`;
        } else if (convType === 2) {
          return `群聊 ${member.convId}`;
        }
        
        return `会话 ${member.convId}`;
      })();
      
      return {
        convId: member.convId,
        // 显示名称：privateDisplayName > convName > 默认名称
        displayName: displayName,
        // 头像：优先使用会话头像
        avatar: conversation?.convAvatar || '',
        lastMessage: '', // 后续可以从消息模块获取
        lastMessageTime: member.updateTime || member.joinTime,
        unreadCount: member.unreadCount || 0,
        memberStatus: member.memberStatus,
        // 会话类型信息
        convType: conversation?.convType,
        convName: conversation?.convName,
        // 成员个性化信息
        privateDisplayName: member.privateDisplayName,
        memberNickname: member.memberNickname,
        // 原始数据
        rawData: member,
        rawConversationData: conversation
      };
    })
  );
  
  /** 当前选中的会话 */
  const currentConversation = computed(() => 
    conversationMembers.value.find(member => member.convId === currentConversationId.value) || null
  );
  
  /** 获取当前会话的完整信息 */
  const currentConversationWithDetail = computed(() => {
    if (!currentConversationId.value) return null;
    
    const member = currentConversation.value;
    if (!member) return null;
    
    const conversation = conversationsCache.value.get(member.convId);
    
    return {
      member,
      conversation,
      displayName: getDisplayName(member)
    };
  });
  
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
        console.log(`成功获取 ${response.data.length} 个会话成员`);
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
   * 批量获取会话信息
   * @param {number[]} convIds - 会话ID数组
   * @returns {Promise<void>}
   */
  async function fetchConversationsBatch(convIds: number[]): Promise<void> {
    if (!convIds || convIds.length === 0) {
      console.log('没有会话ID需要查询');
      return;
    }
    
    console.log(`开始批量获取会话信息，共 ${convIds.length} 个会话`, convIds);
    
    try {
      // 去重
      const uniqueIds = [...new Set(convIds.filter(id => id && id > 0))];
      
      if (uniqueIds.length === 0) {
        console.log('没有有效的会话ID');
        return;
      }
      
      // 调用批量查询API - 使用正确的类型
      const response = await conversationApi.getConversationsBatch(uniqueIds);
      
      if (response.code === 200 && response.data) {
        // response.data 现在是 Conversation[] 数组
        // 更新缓存
        response.data.forEach((conversation: Conversation) => {
          conversationsCache.value.set(conversation.convId, conversation);
        });
        
        console.log(`成功缓存 ${response.data.length} 个会话信息`);
        
        // 调试输出显示逻辑
        console.log('会话显示名称计算结果:');
        response.data.forEach((conversation: Conversation) => {
          const member = conversationMembers.value.find(m => m.convId === conversation.convId);
          if (member) {
            console.log(`会话 ${conversation.convId}:`, {
              convName: conversation.convName,
              privateDisplayName: member.privateDisplayName,
              finalDisplayName: getDisplayName(member),
              convType: conversation.convType === 1 ? '单聊' : '群聊'
            });
          }
        });
      } else {
        console.warn('批量获取会话信息失败:', response.message);
      }
    } catch (err: any) {
      console.error('批量获取会话信息失败:', err);
      // 不抛出错误，因为这只是增强功能
    }
  }
  
  /**
   * 完整获取用户会话（包含会话信息）
   * @param {number|string} userId - 用户ID
   * @returns {Promise<void>}
   */
  async function fetchUserConversationsWithDetails(userId: number | string): Promise<void> {
    console.log('开始完整获取用户会话信息...');
    
    // 先获取会话成员信息
    await fetchUserConversations(userId);
    
    // 然后批量获取会话信息
    if (conversationMembers.value.length > 0) {
      const convIds = conversationMembers.value.map(member => member.convId);
      await fetchConversationsBatch(convIds);
    }
    
    console.log('完整获取用户会话信息完成');
  }
  
  /**
   * 获取单个会话的详细信息
   * @param {number} convId - 会话ID
   * @returns {Promise<Conversation | null>}
   */
  async function fetchConversationDetail(convId: number): Promise<Conversation | null> {
    if (!convId || convId <= 0) {
      console.error('无效的会话ID:', convId);
      return null;
    }
    
    try {
      // 先检查缓存
      const cached = conversationsCache.value.get(convId);
      if (cached) {
        console.log(`从缓存获取会话 ${convId} 信息`);
        return cached;
      }
      
      // 如果没有缓存，批量查询（即使只有一个ID）
      await fetchConversationsBatch([convId]);
      
      return conversationsCache.value.get(convId) || null;
    } catch (err) {
      console.error(`获取会话 ${convId} 详情失败:`, err);
      return null;
    }
  }
  
  /**
   * 设置当前会话
   * @param {number} convId - 会话ID
   */
  function setCurrentConversation(convId: number): void {
    currentConversationId.value = convId;
    
    // 确保该会话的信息已加载
    if (convId && !conversationsCache.value.has(convId)) {
      fetchConversationDetail(convId).catch(err => {
        console.error(`加载会话 ${convId} 详情失败:`, err);
      });
    }
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
    conversationsCache.value.clear();
    isLoading.value = false;
    error.value = '';
    currentConversationId.value = null;
  }
  
  // ============ 导出 ============
  return {
    // 状态
    conversationMembers,
    conversationsCache,
    isLoading,
    error,
    currentConversationId,
    
    // 计算属性
    conversationCount,
    totalUnreadCount,
    conversationList,
    currentConversation,
    currentConversationWithDetail,
    
    // 方法
    fetchUserConversations,
    fetchConversationsBatch,
    fetchUserConversationsWithDetails,
    fetchConversationDetail,
    setCurrentConversation,
    clearError,
    reset
  };
});