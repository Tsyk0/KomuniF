// src/apis/chat/show-conversation/index.ts
import service from '../../service';
import type { 
  GetUserConversationsRequest, 
  MarkConversationReadRequest, 
  UpdateConversationDisplayNameRequest,
  LeaveConversationRequest,
  GetConversationDetailRequest 
} from '@/types/flow/show-chat.request';

import type { 
  GetUserConversationsResponse,
  GetConversationDetailResponse,
  ConversationOperationResponse 
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
 * 统一导出 API 对象
 */
export const conversationApi = {
  getUserConversations: getUserConversationsApi,
};

export default conversationApi;