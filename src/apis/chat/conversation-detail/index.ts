import service from '../../service';
import type { 
  GetConversationDetailsRequest,
  GetConversationDetailsResponse 
} from '@/types/form/conversation-detail';

/**
 * 获取用户会话详情列表（复合查询）- 新接口
 * 对应后端接口：GET /conversationDetail/getConversationDetailsByUserId
 * 一次性获取会话信息、最后消息、发送者信息等
 */
export function getConversationDetailsByUserIdApi(
    params: GetConversationDetailsRequest
): Promise<GetConversationDetailsResponse> {
    return service({
        url: '/conversationDetail/getConversationDetailsByUserId',
        method: 'get',
        params
    });
}

/**
 * 批量查询会话详情（保留，用于其他场景）
 * 对应后端接口：POST /conversation/selectConversationsBatch
 */
export function getConversationsBatchApi(
    convIds: number[]
): Promise<any> {
    return service({
        url: '/conversation/selectConversationsBatch',
        method: 'post',
        data: convIds,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

/**
 * 统一导出 API 对象
 */
export const conversationDetailApi = {
    getConversationDetailsByUserId: getConversationDetailsByUserIdApi,
    getConversationsBatch: getConversationsBatchApi
};

export default conversationDetailApi;