// src/apis/chat/show-conversation/index.ts
import service from '../../service';
import type { 
  GetUserConversationsRequest
} from '@/types/flow/show-chat.request';

import type { 
  GetUserConversationsResponse,
  GetConversationsBatchResponse  // 导入新的类型
} from '@/types/flow/show-chat.response';

/**
 * 查询用户所在的所有会话
 * 对应后端接口：GET /selectByUserId
 */
export function getUserConversationsApi(
  params: GetUserConversationsRequest
): Promise<GetUserConversationsResponse> {
  return service({
    url: '/conversationMember/selectByUserId',
    method: 'get',
    params
  });
}

/**
 * 批量查询会话详情
 * 对应后端接口：POST /conversation/selectConversationsBatch
 * @param convIds 会话ID数组
 */
export function getConversationsBatchApi(
  convIds: number[]
): Promise<GetConversationsBatchResponse> {
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
export const conversationApi = {
  getUserConversations: getUserConversationsApi,
  getConversationsBatch: getConversationsBatchApi
};

export default conversationApi;