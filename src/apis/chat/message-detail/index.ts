// File: src/apis/chat/message-detail/index.ts
import service from '../../service';
import type { GetMessageDetailsRequest, GetMessageDetailsResponse } from '@/types/dto/message';

/**
 * 获取会话的消息详情列表（复合查询）- 新接口
 * 对应后端接口：GET /messageDetail/getMessageDetailsByConvId
 * 一次性获取消息、发送者信息和显示名称
 */
export function getMessageDetailsByConvIdApi(
  params: GetMessageDetailsRequest
): Promise<GetMessageDetailsResponse> {
  return service({
    url: '/messages/summary',
    method: 'get',
    params
  });
}

/**
 * 获取会话的消息列表（直接使用复合查询，不兼容旧接口）
 * 注意：所有调用方必须更新为新的参数格式
 */
export function getMessagesByConvIdApi(
  convId: number,
  page: number = 10,
  pageSize: number = 50
): Promise<GetMessageDetailsResponse> {
  return getMessageDetailsByConvIdApi({
    convId,
    page,
    pageSize
  });
}

/**
 * 占位符：根据 messageId 向前加载更旧消息
 * 约定后端接口：GET /messageDetail/getHistoryMessagesByConvId
 * 参数：convId, beforeMessageId, pageSize
 */
export function getHistoryMessagesByConvIdApi(params: {
  convId: number;
  beforeMessageId?: number;
  pageSize?: number;
}): Promise<GetMessageDetailsResponse> {
  return service({
    url: '/messages/loadMore',
    method: 'get',
    params
  });
}

// 导出所有API
export const messageDetailApi = {
  getMessageDetailsByConvId: getMessageDetailsByConvIdApi,
  getMessagesByConvId: getMessagesByConvIdApi,
  getHistoryMessagesByConvId: getHistoryMessagesByConvIdApi
};

export default messageDetailApi;