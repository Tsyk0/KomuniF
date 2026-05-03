// File: src/apis/chat/message-send/index.ts
import service from '../../service';
import type { BaseResponse } from '@/types/dto/base';
import type { SendMessageRequest, SendMessageResponseData } from '@/types/dto/message';

/** 发送消息：POST /conversations/:convId/messages（body 为除 convId 外的字段）。 */
export function sendMessageApi(
    data: SendMessageRequest
): Promise<BaseResponse<SendMessageResponseData>> {
    const { convId, atUserIds, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };
    if (atUserIds != null && Array.isArray(atUserIds) && atUserIds.length > 0) {
        payload.atUserIds = [...atUserIds];
    }
    return service({
        url: `/conversations/${convId}/messages`,
        method: 'post',
        data: payload
    });
}

// 只导出主接口
export default sendMessageApi;