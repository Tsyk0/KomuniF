// File: src/apis/friend/index.ts
import service from "../service";
import type { BaseResponse } from "@/types/dto/base";
import type { GetFriendListResponse, GetFriendInfoResponse } from "@/types/dto/friend";

/**
 * 获取用户好友列表
 * 对应后端接口：GET /friendRelationDetail/getFriendListbyUserId
 */
export function getFriendListByUserIdApi(): Promise<GetFriendListResponse> {
  return service({
    url: "/friends",
    method: "get"
  });
}

/**
 * 根据 friendId 获取好友详情
 * 对应后端接口：GET /friends/{friendId}/profile
 * @param friendId 好友用户 ID（正整数）
 */
export function getFriendInfoApi(
  friendId: number
): Promise<GetFriendInfoResponse> {
  return service({
    url: `/friends/${friendId}/profile`,
    method: "get",
  });
}

/**
 * 更新好友备注与分组
 * 对应后端接口：PATCH /friends/{friendId}/remark
 * 请求体：{ remarkName?: string | null, friendGroup?: string | null }
 */
export interface UpdateFriendRemarkAndGroupPayload {
  remarkName?: string | null;
  friendGroup?: string | null;
}

export function updateFriendRemarkAndGroupApi(
  friendId: number,
  payload: UpdateFriendRemarkAndGroupPayload
): Promise<BaseResponse<string>> {
  return service({
    url: `/friends/${friendId}/remark`,
    method: "patch",
    data: payload,
  });
}

export const friendApi = {
  getFriendListByUserId: getFriendListByUserIdApi,
  getFriendInfo: getFriendInfoApi,
  updateFriendRemarkAndGroup: updateFriendRemarkAndGroupApi,
};

export default friendApi;
