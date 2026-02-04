import service from '../../service';
import type { GetGroupMembersResponse } from '@/types/dto/conversation';


export function getGroupMembersByConvIdApi(convId: number): Promise<GetGroupMembersResponse> {
    return service({
        url: '/compressedCM/getCompressedCM',
        method: 'get',
        params: { convId }
    });
}

export const groupMemberApi = {
    getGroupMembersByConvId: getGroupMembersByConvIdApi
};

export default groupMemberApi;
