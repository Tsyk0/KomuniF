import service from "../service";
import type {
  GetFriendListRequest,
  GetFriendListResponse
} from "@/types/form/friend-detail";

/**
 * 获取用户好友列表
 * 对应后端接口：GET /friendRelationDetail/getFriendListbyUserId
 */
export function getFriendListByUserIdApi(
  params: GetFriendListRequest
): Promise<GetFriendListResponse> {
  return service({
    url: "/friendRelationDetail/getFriendListbyUserId",
    method: "get",
    params
  });
}

export const friendApi = {
  getFriendListByUserId: getFriendListByUserIdApi
};

export default friendApi;
