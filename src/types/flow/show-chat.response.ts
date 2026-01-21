// src/types/flow/show-chat.response.ts
import type { ConversationMember } from '@/entity/conversation-member';
import type { Conversation } from '@/entity/conversation';

/**
 * 获取用户所有会话的响应类型
 * 对应后端接口：GET /selectByUserId
 */
export interface GetUserConversationsResponse {
    code: number;
    message: string;
    data: ConversationMember[];  // 用户参与的所有会话成员关联
    timestamp?: number;
}

/**
 * 获取会话详情的响应类型
 * 对应后端接口：GET /conversation/{convId}
 */
export interface GetConversationDetailResponse {
    code: number;
    message: string;
    data: Conversation;  // 会话详情
    timestamp?: number;
}

/**
 * 批量获取会话详情的响应类型
 * 对应后端接口：POST /conversation/selectConversationsBatch
 */
export interface GetConversationsBatchResponse {
    code: number;
    message: string;
    data: Conversation[];  // 会话详情数组
    timestamp?: number;
}

/**
 * 基础操作响应类型（标记已读、更新昵称、退出会话等）
 */
export interface ConversationOperationResponse {
    code: number;
    message: string;
    data: string;  // 操作结果消息
    timestamp?: number;
}

/**
 * 会话摘要信息（前端展示用）
 * 这个类型是前端自己组合的，用于会话列表展示
 */
export interface ConversationSummary {
    convId: number;                    // 会话ID
    convType: number;                  // 会话类型：1-单聊，2-群聊
    displayName: string;               // 显示名称（群聊用群名，单聊用对方昵称）
    avatar?: string;                   // 头像URL
    lastMessage?: string;              // 最后一条消息预览
    lastMessageTime?: string;          // 最后消息时间
    unreadCount: number;               // 未读消息数
    isMuted?: boolean;                 // 是否静音
    isPinned?: boolean;                // 是否置顶
    memberStatus: number;              // 成员状态：1-正常，0-已退出等
    lastReadMessageSeq?: number | null; // 最后阅读的消息序列号
    rawData: ConversationMember;       // 原始数据，用于需要详细信息时
}