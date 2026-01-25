// 修改后的 src/types/flow/message.request.ts
export interface SendMessageRequest {
    convId: number;
    senderId: number;
    messageType: string;
    messageContent: string;
    replyToMessageId?: number;
    atUserIds?: number[];
}
// 删除其他接口