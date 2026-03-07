import service from "../service";
import type { BaseResponse } from "@/types/dto/base";
import type { GetFriendListResponse, GetFriendInfoResponse } from "@/types/dto/friend";

/**
 * 获取用户好友列表
 * 对应后端接口：GET /friendRelationDetail/getFriendListbyUserId
 */
export function getFriendListByUserIdApi(): Promise<GetFriendListResponse> {
  return service({
    url: "/friendRelationDetail/getFriendListbyUserId",
    method: "get"
  });
}

/**
 * 根据 friendId 获取好友详情
 * 对应后端接口：GET /friendInfo/getFriendInfoByUserIdAndFriendId
 * @param friendId 好友用户 ID（正整数）
 */
export function getFriendInfoByUserIdAndFriendIdApi(
  friendId: number
): Promise<GetFriendInfoResponse> {
  return service({
    url: "/friendInfo/getFriendInfoByUserIdAndFriendId",
    method: "get",
    params: { friendId }
  });
}

/**
 * 更新好友备注与分组（预留后端接口）
 * 建议后端：POST /friendInfo/updateRemarkAndGroup 或 PUT /friendRelation/updateRemarkAndGroup
 * 请求体：{ friendId: number, remarkName?: string | null, friendGroup?: string | null }
 */
export interface UpdateFriendRemarkAndGroupPayload {
  friendId: number;
  remarkName?: string | null;
  friendGroup?: string | null;
}

export function updateFriendRemarkAndGroupApi(
  payload: UpdateFriendRemarkAndGroupPayload
): Promise<BaseResponse<string>> {
  return service({
    url: "/friendInfo/updateRemarkAndGroup",
    method: "post",
    data: payload,
  });
}

export const friendApi = {
  getFriendListByUserId: getFriendListByUserIdApi,
  getFriendInfoByUserIdAndFriendId: getFriendInfoByUserIdAndFriendIdApi,
  updateFriendRemarkAndGroup: updateFriendRemarkAndGroupApi,
};

export default friendApi;
