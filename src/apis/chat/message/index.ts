// src/apis/chat/message/index.ts
import service from '../../service';
import type { GetMessagesResponse } from '@/types/flow/message.response';

/**
 * 获取会话的消息列表
 * 对应后端接口：GET /message/getMessagesByConvId
 * 
 * 返回完整的 GetMessagesResponse
 */
export function getMessagesByConvIdApi(
    convId: number
): Promise<GetMessagesResponse> {
    return service({
        url: '/message/getMessagesByConvId',
        method: 'get',
        params: { convId }
    });
}

// 暂时只导出这个API
export const messageApi = {
    getMessagesByConvId: getMessagesByConvIdApi
};
// 这是什么：别的类中用法：
// 导入
// import { messageApi } from '@/apis/chat/message';
// 调用
// const response = await messageApi.getMessagesByConvId(123);
export default messageApi;