// src/entity/message.ts
export interface Message {
    messageId: number;              // 消息ID
    convId: number;                 // 会话ID
    senderId: number;               // 发送者ID
    receiverId?: number | null;     // 接收者ID（单聊时使用）
    messageType: string;            // 消息类型：text/image/file/audio/video/location/emoji/system等
    messageContent: string;         // 消息内容
    messageStatus: number;          // 消息状态：0-发送中，1-已发送，2-已送达，3-已读，4-发送失败
    isRecalled?: number;            // 是否撤回：0-未撤回，1-已撤回
    replyToMessageId?: number | null; // 回复的消息ID
    atUserIds?: number[] | null;    // @的用户ID列表
    sendTime: string;               // 发送时间
    recallTime?: string | null;     // 撤回时间
}

// 消息类型常量
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

// 消息状态常量
export const MessageStatus = {
    SENDING: 0,    // 发送中
    SENT: 1,       // 已发送
    DELIVERED: 2,  // 已送达
    READ: 3,       // 已读
    FAILED: 4      // 发送失败
} as const;