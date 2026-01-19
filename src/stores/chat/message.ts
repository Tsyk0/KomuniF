// src/stores/chat/message.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { messageApi } from '@/apis/chat/message';
import type { ChatMessage } from '@/entity/chat-message';
import type { GetMessagesResponse } from '@/types/flow/message.response';
import { useAuthStore } from '@/stores/auth';

/**
 * 聊天消息状态管理 Store
 */
export const useMessageStore = defineStore('message', () => {
    const authStore = useAuthStore();
    
    // ============ 状态定义 ============
    
    /** 当前会话的消息列表 */
    const currentMessages = ref<ChatMessage[]>([]);
    
    /** 加载状态 */
    const isLoading = ref(false);
    
    /** 错误信息 */
    const error = ref('');
    
    /** 当前加载的会话ID */
    const currentConvId = ref<number | null>(null);
    
    /** 分页信息 */
    const pagination = ref({
        total: 0,
        pageSize: 20,
        page: 1,
        hasMore: false
    });
    
    // ============ 计算属性 ============
    
    /** 获取当前用户ID */
    const currentUserId = computed(() => {
        return authStore.user?.userId || null;
    });
    
    /** 消息数量 */
    const messageCount = computed(() => currentMessages.value.length);
    
    /** 格式化后的聊天消息（前端展示用） */
    const formattedMessages = computed(() => {
        const userId = currentUserId.value;
        if (!userId) return [];
        
        return currentMessages.value.map((message, index, arr) => {
            // 判断是否是自己发送的消息
            const isSentByMe = message.senderId === userId;
            
            // 判断是否是同一个人连续发送的消息
            const prevMessage = arr[index - 1];
            const nextMessage = arr[index + 1];
            
            const isFirstInGroup = !prevMessage || 
                prevMessage.senderId !== message.senderId || 
                message.messageType === 'system';
                
            const isLastInGroup = !nextMessage || 
                nextMessage.senderId !== message.senderId || 
                message.messageType === 'system';
            
            return {
                ...message,
                isSentByMe,
                isFirstInGroup,
                isLastInGroup,
            };
        });
    });
    
    /** 是否有更多消息可以加载 */
    const hasMoreMessages = computed(() => pagination.value.hasMore);
    
    // ============ Actions（操作方法） ============
    
    /**
     * 加载会话的消息
     * @param convId 会话ID
     * @param reset 是否重置（重新加载）
     */
    const loadMessages = async (convId: number, reset = false): Promise<void> => {
        if (!convId) {
            console.error('会话ID不能为空');
            return;
        }
        
        if (currentConvId.value === convId && !reset && isLoading.value) {
            return; // 已经在加载相同的会话
        }
        
        if (reset) {
            currentMessages.value = [];
            pagination.value.page = 1;
            pagination.value.hasMore = true;
        }
        
        currentConvId.value = convId;
        isLoading.value = true;
        error.value = '';
        
        try {
            console.log(`开始加载会话 ${convId} 的消息`);
            
            // ⭐ 调用API，获取完整响应
            const response: GetMessagesResponse = await messageApi.getMessagesByConvId(convId);
            
            console.log("📦 API响应:", {
                code: response.code,
                message: response.message,
                timestamp: response.timestamp,
                hasData: !!response.data
            });
            
            // 检查业务状态码
            if (response.code === 200) {
                // ⭐ response.data 是 MessageListData
                const messageListData = response.data;
                
                console.log("📦 消息列表数据:", {
                    total: messageListData.total,
                    page: messageListData.page,
                    pageSize: messageListData.pageSize,
                    messagesCount: messageListData.messages?.length || 0
                });
                
                if (messageListData && messageListData.messages && Array.isArray(messageListData.messages)) {
                    const messages = messageListData.messages;
                    
                    console.log(`✅ 成功获取会话 ${convId} 的 ${messages.length} 条消息`);
                    
                    if (messages.length > 0) {
                        console.log("第一条消息示例:", messages[0]);
                        console.log("最后一条消息示例:", messages[messages.length - 1]);
                    }
                    
                    // 更新消息列表
                    if (reset) {
                        currentMessages.value = messages;
                    } else {
                        // 加载更多时，添加到前面
                        currentMessages.value = [...messages, ...currentMessages.value];
                    }
                    
                    // 更新分页信息
                    pagination.value = {
                        total: messageListData.total,
                        pageSize: messageListData.pageSize,
                        page: messageListData.page,
                        hasMore: (messageListData.page * messageListData.pageSize) < messageListData.total
                    };
                    
                    console.log("📊 分页信息:", pagination.value);
                } else {
                    console.warn('⚠️ 消息数据格式不正确:', messageListData);
                    currentMessages.value = [];
                }
            } else {
                // 业务错误
                throw new Error(response.message || `获取消息失败 (${response.code})`);
            }
        } catch (err: any) {
            error.value = err.message || '加载消息失败';
            console.error('获取消息失败:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };
    
    /**
     * 加载更多消息（分页）
     */
    const loadMoreMessages = async (): Promise<void> => {
        if (!currentConvId.value || !pagination.value.hasMore || isLoading.value) {
            return;
        }
        
        pagination.value.page += 1;
        await loadMessages(currentConvId.value, false);
    };
    
    /**
     * 添加新消息（用于发送或接收）
     * @param message 新消息
     */
    const addMessage = (message: ChatMessage): void => {
        const userId = currentUserId.value;
        if (!userId) return;
        
        const newMessage = {
            ...message,
            isSentByMe: message.senderId === userId,
            isFirstInGroup: true,
            isLastInGroup: true
        };
        
        currentMessages.value.push(newMessage);
        pagination.value.total += 1;
    };
    
    /**
     * 清除当前会话的消息
     */
    const clearMessages = (): void => {
        currentMessages.value = [];
        currentConvId.value = null;
        pagination.value = {
            total: 0,
            pageSize: 20,
            page: 1,
            hasMore: false
        };
        error.value = '';
    };
    
    /**
     * 重置状态
     */
    const reset = (): void => {
        clearMessages();
        isLoading.value = false;
    };
    
    /**
     * 更新消息状态
     * @param messageId 消息ID
     * @param updates 更新内容
     */
    const updateMessageStatus = (messageId: number, updates: Partial<ChatMessage>): void => {
        const index = currentMessages.value.findIndex(msg => msg.messageId === messageId);
        if (index !== -1) {
            currentMessages.value[index] = {
                ...currentMessages.value[index],
                ...updates
            };
        }
    };
    
    // ============ 导出 ============
    return {
        // 状态
        currentMessages,
        isLoading,
        error,
        currentConvId,
        pagination,
        
        // 计算属性
        currentUserId,
        messageCount,
        formattedMessages,
        hasMoreMessages,
        
        // 方法
        loadMessages,
        loadMoreMessages,
        addMessage,
        clearMessages,
        reset,
        updateMessageStatus
    };
});