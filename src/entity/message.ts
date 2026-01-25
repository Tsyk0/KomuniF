// src/types/entity/message.ts
export interface RealMessage {
    // 数据库基础字段
    messageId: number;
    convId: number;
    senderId: number;
    messageType: string;
    messageContent: string;
    messageStatus: number;
    isRecalled?: number;
    replyToMessageId?: number | null;
    atUserIds?: number[] | null;
    sendTime: string;
    recallTime?: string | null;
}

export interface DisplayMessage extends RealMessage {
    // 前端显示需要的字段
    senderName?: string;
    senderAvatar?: string | null; // 改为 string | null 以兼容原有数据
    isSentByMe: boolean;
    // 删除 isSelf 字段
}

// 消息类型和状态常量
export const MessageType = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    AUDIO: 'audio',
    VIDEO: 'video',
    LOCATION: 'location',
    EMOJI: 'emoji',
    SYSTEM: 'system'
} as const;

export const MessageStatus = {
    SENDING: 0,
    SENT: 1,
    DELIVERED: 2,
    READ: 3,
    FAILED: 4
} as const;