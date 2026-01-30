import service from '../../service';
import type { GetMessageDetailsRequest, GetMessageDetailsResponse } from '@/types/form/message-detail';

/**
 * 获取会话的消息详情列表（复合查询）- 新接口
 * 对应后端接口：GET /messageDetail/getMessageDetailsByConvId
 * 一次性获取消息、发送者信息和显示名称
 */
export function getMessageDetailsByConvIdApi(
    params: GetMessageDetailsRequest
): Promise<GetMessageDetailsResponse> {
    return service({
        url: '/messageDetail/getMessageDetailsByConvId',
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
    pageSize: number = 100
): Promise<GetMessageDetailsResponse> {
    return getMessageDetailsByConvIdApi({
        convId,
        page,
        pageSize
    });
}

// 导出所有API
export const messageDetailApi = {
    getMessageDetailsByConvId: getMessageDetailsByConvIdApi,
    getMessagesByConvId: getMessagesByConvIdApi
};

export default messageDetailApi;