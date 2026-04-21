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

/** 更新会话用户侧属性（群聊语义）。 */
export async function updateConversationInfoNormalized(
  payload: Partial<ConversationEntity> & { convId: number }
): Promise<void> {
  const response =
    await manageConversationApi.updateConversationAttriUserOrientedByConvId(payload);
  if (response.code !== 200) {
    throw new Error(response.message || "Failed to update conversation info");
  }
}
