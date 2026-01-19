// src/entity/chat-message.ts
export interface ChatMessage {
    messageId: number;              // 消息ID
    convId: number;                 // 会话ID
    senderId: number;               // 发送者ID
    senderName?: string;           // 发送者昵称（前端显示用）
    senderAvatar?: string;         // 发送者头像（前端显示用）
    messageType: string;           // 消息类型（使用字符串，不强制使用枚举）
    messageContent: string;        // 消息内容
    messageStatus: number;         // 消息状态
    sendTime: string;              // 发送时间
    isSentByMe: boolean;           // 是否是我发送的消息（前端计算）
    isFirstInGroup?: boolean;      // 是否是该发送者的第一条连续消息
    isLastInGroup?: boolean;       // 是否是该发送者的最后一条连续消息
}

// 消息类型常量（可选，用于类型安全）
export const MessageType = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    AUDIO: 'audio',
    VIDEO: 'video',
    SYSTEM: 'system'
} as const;

// 消息状态常量
export const MessageStatus = {
    SENDING: 0,    // 发送中
    SENT: 1,       // 已发送
    DELIVERED: 2,  // 已送达
    READ: 3,       // 已读
    FAILED: 4      // 发送失败
} as const;

// 会话成员信息（用于显示）
export interface ChatMember {
    userId: number;
    nickname: string;
    avatar?: string;
    role?: number; // 角色：0-普通成员，1-管理员，2-群主
}

// 会话信息
export interface ChatConversation {
    convId: number;
    convName: string;
    convType: number; // 1-单聊，2-群聊
    members: ChatMember[];
    unreadCount: number;
    lastMessage?: ChatMessage;
}