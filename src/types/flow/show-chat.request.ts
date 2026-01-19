// src/types/flow/show-chat.request.ts

/**
 * 获取用户所有会话的请求参数
 * 对应后端接口：GET /selectByUserId
 */
export interface GetUserConversationsRequest {
    userId: string;  // 用户ID（字符串，后端会转换为Long）
}

/**
 * 标记会话已读的请求参数
 * 对应后端接口：PUT /markAsRead
 */
export interface MarkConversationReadRequest {
    convId: number;
    userId: string;
}

/**
 * 更新会话显示名称的请求参数
 * 对应后端接口：PUT /updateDisplayName
 */
export interface UpdateConversationDisplayNameRequest {
    convId: number;
    userId: string;
    displayName: string;
}

/**
 * 退出/删除会话的请求参数
 * 对应后端接口：DELETE /leaveConversation
 */
export interface LeaveConversationRequest {
    convId: number;
    userId: string;
}

/**
 * 获取会话详情的请求参数
 * 对应后端接口：GET /conversation/{convId}
 */
export interface GetConversationDetailRequest {
    convId: number;
}