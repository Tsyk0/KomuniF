import { manageConversationApi } from "@/apis/chat/manage-conversation";
import { friendApi } from "@/apis/friend";
import type { ConversationEntity } from "@/types/dto/conversation-member";

export type UpdateFriendRemarkPayload = {
  remarkName?: string | null;
  friendGroup?: string | null;
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

/** 更新会话属性（统一 multipart，可选头像文件）。 */
export async function updateConversationInfoNormalized(
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
