// File: src/apis/chat/manage-conversation/index.ts
import service from "../../service";
import type { ConversationEntity } from "@/types/dto/conversation-member";
import type { BaseResponse } from "@/types/dto/base";

// 占位：display_status 的 PATCH 待后端路径确定后在此模块补充；乐观更新可用 convStore.patchConversationLocal。

export interface UpdateConversationMemberNamesPayload {
  memberNickname?: string | null;
  privateDisplayName?: string | null;
  /**
   * 清空群内昵称标记。
   * 使用场景：用户将“我的本群昵称”清空时，后端通过该标记识别清空操作。
   */
  clearMemberNickname?: boolean;
  /**
   * 清空群聊备注标记。
   * 使用场景：用户将“群聊备注”清空时，后端通过该标记识别清空操作。
   */
  clearPrivateDisplayName?: boolean;
}

/**
 * 更新会话信息（统一 multipart 协议）
 * 对应后端接口：PATCH /conversations/{convId}
 * Content-Type: multipart/form-data
 * - 文件字段：convAvatarFile
 * - 文本字段：convName / convDescription / enableReadReceipt / convType / convAvatar(可选字符串URL)
 */
export function updateConversationInfoApi(
  convId: number,
  payload: Partial<ConversationEntity> = {},
  convAvatarFile?: File
): Promise<BaseResponse<string>> {
  const formData = new FormData();
  if (convAvatarFile) formData.append("convAvatarFile", convAvatarFile);
  if (payload.convName != null) formData.append("convName", String(payload.convName));
  if (payload.convDescription != null) {
    formData.append("convDescription", String(payload.convDescription));
  }
  if (payload.enableReadReceipt != null) {
    formData.append("enableReadReceipt", String(payload.enableReadReceipt));
  }
  if (payload.convType != null) formData.append("convType", String(payload.convType));
  if (payload.convAvatar != null) formData.append("convAvatar", String(payload.convAvatar));

  return service({
    url: `/conversations/${convId}`,
    method: "patch",
    headers: { "Content-Type": "multipart/form-data" },
    data: formData,
  });
}

/**
 * 更新当前登录用户在会话内的成员昵称与私有显示名
 * 对应后端接口：PATCH /conversations/{convId}/members/me/names
 * Content-Type: application/json
 */
export function updateConversationMemberNamesApi(
  convId: number,
  payload: UpdateConversationMemberNamesPayload
): Promise<BaseResponse<string>> {
  return service({
    url: `/conversations/${convId}/members/me/names`,
    method: "patch",
    data: payload,
  });
}

/**
 * 退出当前登录用户所在群聊。
 * 对应后端接口：DELETE /conversations/{convId}/members/me
 */
export function leaveConversationApi(
  convId: number
): Promise<BaseResponse<string>> {
  return service({
    url: `/conversations/${convId}/members/me`,
    method: "delete",
  });
}

/**
 * 群主踢出成员：目标 member_status → 0
 * DELETE /conversations/{convId}/members/{targetUserId}
 */
export function removeConversationMemberApi(
  convId: number,
  targetUserId: number
): Promise<BaseResponse<string>> {
  return service({
    url: `/conversations/${convId}/members/${targetUserId}`,
    method: "delete",
  });
}

/**
 * 禁言成员：正常 → 2
 * POST /conversations/{convId}/members/{targetUserId}/mute
 */
export function muteConversationMemberApi(
  convId: number,
  targetUserId: number
): Promise<BaseResponse<string>> {
  return service({
    url: `/conversations/${convId}/members/${targetUserId}/mute`,
    method: "post",
  });
}

/**
 * 解除禁言：2 → 1
 * DELETE /conversations/{convId}/members/{targetUserId}/mute
 */
export function unmuteConversationMemberApi(
  convId: number,
  targetUserId: number
): Promise<BaseResponse<string>> {
  return service({
    url: `/conversations/${convId}/members/${targetUserId}/mute`,
    method: "delete",
  });
}

export const manageConversationApi = {
  updateConversationInfo: updateConversationInfoApi,
  updateConversationMemberNames: updateConversationMemberNamesApi,
  leaveConversation: leaveConversationApi,
  removeConversationMember: removeConversationMemberApi,
  muteConversationMember: muteConversationMemberApi,
  unmuteConversationMember: unmuteConversationMemberApi,
};

export default manageConversationApi;

