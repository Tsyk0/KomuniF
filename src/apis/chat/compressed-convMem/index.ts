// File: src/apis/chat/compressed-convMem/index.ts
import service from '../../service';
import type { GetCompressedCMResponse } from '@/types/dto/conversation';

/**
 * 根据会话ID获取群成员列表
 * 对应后端接口：GET /compressedCM/getCompressedCM
 */
export function getCompressedCMApi(convId: number): Promise<GetCompressedCMResponse> {
    return service({
        url: `/conversations/${convId}/members`,
        method: 'get',
    }).then((resp: any) => {
        const members = resp?.data?.members || [];
        return {
            ...resp,
            data: members
        } as GetCompressedCMResponse;
    });
}

export const CompressedCMApi = {
    getCompressedCM: getCompressedCMApi
};

export default CompressedCMApi;
