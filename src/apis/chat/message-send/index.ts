import service from '../../service';
import type { SendMessageRequest } from '@/types/flow/message.request';
import type { BaseResponse } from '@/types/flow/base.response';
import type { SendMessageResponseData } from '@/types/form/message-response-data';

/**
 * 发送消息 - 主接口
 * 对应后端接口：POST /message/sendMessage
 */
export function sendMessageApi(
    data: SendMessageRequest
): Promise<BaseResponse<SendMessageResponseData>> {
    return service({
        url: '/message/sendMessage',
        method: 'post',
        data
    });
}

// 只导出主接口
export default sendMessageApi;