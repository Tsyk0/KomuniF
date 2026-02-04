import service from "../service";
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

export const friendApi = {
  getFriendListByUserId: getFriendListByUserIdApi,
  getFriendInfoByUserIdAndFriendId: getFriendInfoByUserIdAndFriendIdApi
};

export default friendApi;
