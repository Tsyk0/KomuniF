import service from '../../service';
import type { GetConversationDetailsResponse } from '@/types/dto/conversation';

/**
 * 获取用户会话详情列表（复合查询）- 新接口
 * 对应后端接口：GET /conversationDetail/getConversationDetailsByUserId
 * 一次性获取会话信息、最后消息、发送者信息等
 */
export function getConversationDetailsByUserIdApi(): Promise<GetConversationDetailsResponse> {
    return service({
        url: '/conversationDetail/getConversationDetailsByUserId',
        method: 'get'
    });
}



/**
 * 统一导出 API 对象
 */
export const conversationDetailApi = {
    getConversationDetailsByUserId: getConversationDetailsByUserIdApi,

};

export default conversationDetailApi;