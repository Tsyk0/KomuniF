import { manageConversationApi } from "@/apis/chat/manage-conversation";
import { friendApi } from "@/apis/friend";
import type { ConversationEntity } from "@/types/dto/conversation-member";

export type UpdateFriendRemarkPayload = {
  remarkName?: string | null;
  friendGroup?: string | null;
};

export type UpdateConversationMemberNamesPayload = {
  memberNickname?: string | null;
  privateDisplayName?: string | null;
  /**
   * 清空群内昵称标记。
   * 使用场景：仅清空昵称时，不传新值，通过 clear 标记让后端执行清空。
   */
  clearMemberNickname?: boolean;
  /**
   * 清空群聊备注标记。
   * 使用场景：仅清空备注时，不传新值，通过 clear 标记让后端执行清空。
   */
  clearPrivateDisplayName?: boolean;
};

/** 更新好友备注与分组（单聊语义）。 */
export async function updateFriendRemarkNormalized(
  friendId: number,
  payload: UpdateFriendRemarkPayload
): Promise<void> {
  const response = await friendApi.updateFriendRemarkAndGroup(friendId, payload);
  if (response.code !== 200) {
    throw new Error(response.message || "Update failed");
  }
}

/** 持久化会话属性（统一 multipart，可选头像文件）。 */
export async function persistConversationInfoNormalized(
  convId: number,
  payload: Partial<ConversationEntity>,
  convAvatarFile?: File
): Promise<void> {
  const response = await manageConversationApi.updateConversationInfo(
    convId,
    payload,
    convAvatarFile
  );
  if (response.code !== 200) {
    throw new Error(response.message || "Failed to update conversation info");
  }
}

/** 更新当前用户在会话内的 memberNickname / privateDisplayName。 */
export async function updateConversationMemberNamesNormalized(
  convId: number,
  payload: UpdateConversationMemberNamesPayload
): Promise<void> {
  const response = await manageConversationApi.updateConversationMemberNames(
    convId,
    payload
  );
  if (response.code !== 200) {
    throw new Error(response.message || "Failed to update member names");
  }
}
