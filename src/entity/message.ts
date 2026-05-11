// File: src/entity/message.ts
// src/types/entity/message.ts
export interface RealMessage {
    // 数据库基础字段
    messageId: number;
    convId: number;
    senderId: number;
    messageType: string;
    messageContent: string;
    messageStatus: number;
    isRecalled?: boolean;
    replyToMessageId?: number | null;
    atUserIds?: number[] | null;
    sendTime: string;
    recallTime?: string | null;
}

export interface DisplayMessage extends RealMessage {
    /** 前端本地临时消息唯一标识，用于等待 messageSent 回执后回填真实 messageId。 */
    clientMessageId?: string;
    /**
     * 服务端随消息下发的「被引用发送者」展示文案。
     * 使用场景：WS/HTTP 推送里带有引用快照时，接收端尚未加载到原消息仍能画出引用条。
     */
    replyQuoteAuthorHint?: string | null;
    /**
     * 服务端随消息下发的被引用正文摘要（一行）。
     * 使用场景：同上，配合 replyQuoteAuthorHint 展示「发送者：摘要」。
     */
    replyQuoteContentHint?: string | null;
    // 前端显示需要的字段
    senderName?: string;
    senderAvatar?: string | null; // 改为 string | null 以兼容原有数据
    isSentByMe: boolean;
    fileId?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    fileMimeType?: string | null;
    thumbnailUrl?: string | null;
    downloadUrl?: string | null;
    /** 内联预览/播放（/play）；image / video 有值，普通 file 通常无 */
    playUrl?: string | null;
}

// 消息类型和状态常量
export const MessageType = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    AUDIO: 'audio',
    VIDEO: 'video',
    /** 音视频通话结束摘要（与附件 video 不同） */
    RTC: 'rtc',
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
