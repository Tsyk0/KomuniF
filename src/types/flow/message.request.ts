// src/types/flow/message.request.ts
// 获取消息请求参数
export interface GetMessagesRequest {
    convId: number;
    page?: number;
    size?: number;
    lastMessageId?: number;
}
// 发送消息请求
export interface SendMessageRequest {
    convId: number;
    senderId: number;
    messageType: string;
    messageContent: string;
    receiverId?: number;
    replyToMessageId?: number;
    atUserIds?: number[];
}