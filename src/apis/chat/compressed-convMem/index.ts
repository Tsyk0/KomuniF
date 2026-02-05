import service from '../../service';
import type { GetCompressedCMResponse } from '@/types/dto/conversation';

/**
 * 根据会话ID获取群成员列表
 * 对应后端接口：GET /compressedCM/getCompressedCM
 */
export function getCompressedCMApi(convId: number): Promise<GetCompressedCMResponse> {
    return service({
        url: '/compressedCM/getCompressedCM',
        method: 'get',
        params: { convId }
    });
}

export const CompressedCMApi = {
    getCompressedCM: getCompressedCMApi
};

export default CompressedCMApi;
