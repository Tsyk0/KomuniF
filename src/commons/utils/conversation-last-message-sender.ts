import type { LastMessageInfo } from "@/types/dto/conversation";
import type { FriendListItem } from "@/types/dto/friend";

/**
 * 解析会话列表「最后一条消息」前缀里的发送者展示名。
 * 规则：若发送者在 Pinia 好友列表中，优先使用备注名；无备注时使用摘要中的展示名（如群成员昵称）；非好友仅用摘要展示名。
 * 使用场景：`ConversationItem` 预览前缀、`ConversationList` 按发送者关键字过滤时，与侧栏展示一致。
 */
export function resolveLastMessageSenderLabel(
  lastMsg: LastMessageInfo,
  friends: FriendListItem[],
  currentUserId: number | null | undefined
): string {
  if (currentUserId != null && Number(lastMsg.senderId) === Number(currentUserId)) {
    return "我";
  }

  const friend = friends.find((f) => Number(f.friendId) === Number(lastMsg.senderId));
  if (friend) {
    const remark = (friend.remarkName || "").trim();
    if (remark) return remark;
    const fromSummary = (lastMsg.senderDisplayName || "").trim();
    if (fromSummary) return fromSummary;
    return (
      (friend.displayName || "").trim() ||
      (friend.nickname || "").trim() ||
      `User ${lastMsg.senderId}`
    );
  }

  const fallback = (lastMsg.senderDisplayName || "").trim();
  return fallback || `User ${lastMsg.senderId}`;
}
