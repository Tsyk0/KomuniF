import type {
  LastMessageInfo,
  MessageDisplayMemberDTO,
} from "@/types/dto/conversation";
import type { FriendListItem } from "@/types/dto/friend";

/**
 * 群聊解析时传入：convType 与 `convStore.compressedCMMap.get(convId)`，用于优先取 `memberNickname`（群昵称）。
 * 使用场景：`ConversationItem` / `ConversationList` 调用 `resolveLastMessageSenderLabel` 时附带。
 */
export type LastMessageSenderResolveContext = {
  convType?: number;
  conversationMembers?: MessageDisplayMemberDTO[];
};

/**
 * 解析会话列表「最后一条消息」前缀里的发送者展示名。
 * 规则：本人 →「我」；好友有备注 → 备注；群聊且成员缓存可用 → 优先群昵称 `memberNickname`（非好友也适用）；
 * 再退回摘要 `senderDisplayName`、好友展示名/昵称；群聊最后可退回成员 `userNickname`。
 * 使用场景：`ConversationItem` 预览前缀、`ConversationList` 按发送者关键字过滤。
 */
export function resolveLastMessageSenderLabel(
  lastMsg: LastMessageInfo,
  friends: FriendListItem[],
  currentUserId: number | null | undefined,
  context?: LastMessageSenderResolveContext
): string {
  const senderId = Number(lastMsg.senderId);

  if (currentUserId != null && senderId === Number(currentUserId)) {
    return "我";
  }

  const friend = friends.find((f) => Number(f.friendId) === senderId);
  if (friend) {
    const remark = (friend.remarkName || "").trim();
    if (remark) return remark;
  }

  const convType = Number(context?.convType ?? 0);
  const members = context?.conversationMembers;
  if (convType === 2 && members && members.length > 0) {
    const member = members.find((m) => Number(m.userId) === senderId);
    const groupNick = (member?.memberNickname || "").trim();
    if (groupNick) return groupNick;
  }

  const fromSummary = (lastMsg.senderDisplayName || "").trim();
  if (friend) {
    if (fromSummary) return fromSummary;
    return (
      (friend.displayName || "").trim() ||
      (friend.nickname || "").trim() ||
      `User ${senderId}`
    );
  }

  if (fromSummary) return fromSummary;

  if (convType === 2 && members && members.length > 0) {
    const member = members.find((m) => Number(m.userId) === senderId);
    const globalNick = (member?.userNickname || "").trim();
    if (globalNick) return globalNick;
  }

  return `User ${senderId}`;
}
