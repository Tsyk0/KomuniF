// src/entity/conversation.ts
export interface Conversation {
    convId: number;                   // 会话ID
    convType: number;                 // 会话类型：1-单聊，2-群聊
    convName: string | null;          // 会话名称（群聊时使用）
    convAvatar: string | null;        // 会话头像（群聊时使用）
    convDescription: string | null;   // 会话描述（群聊时使用）
    convOwnerId: number | null;       // 群主ID（群聊时使用）
    maxMemberCount: number;           // 最大成员数
    currentMemberCount: number;       // 当前成员数
    convStatus: number;               // 会话状态：0-已解散，1-正常
    createTime: string;               // 创建时间
    updateTime: string;               // 更新时间
    enableReadReceipt: number;        // 是否启用消息已读回执：0-禁用，1-启用
}

// 会话类型枚举
export enum ConversationType {
    SINGLE = 1,      // 单聊
    GROUP = 2        // 群聊
}

// 会话状态枚举
export enum ConversationStatus {
    DISSOLVED = 0,   // 已解散
    ACTIVE = 1       // 正常
}