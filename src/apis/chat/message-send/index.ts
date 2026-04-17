// File: src/apis/chat/message-send/index.ts
import service from '../../service';
import type { BaseResponse } from '@/types/dto/base';
import type { SendMessageRequest, SendMessageResponseData } from '@/types/dto/message';

/**
 * 发送消息 - 主接口
 * 对应后端接口：POST /message/sendMessage
 */
export function sendMessageApi(
    data: SendMessageRequest
): Promise<BaseResponse<SendMessageResponseData>> {
    const { convId, ...payload } = data;
    return service({
        url: `/conversations/${convId}/messages`,
        method: 'post',
        data: payload
    });
}

// 只导出主接口
export default sendMessageApi;