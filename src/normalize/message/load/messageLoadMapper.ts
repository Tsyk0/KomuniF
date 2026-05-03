// src/normalize/message/load/messageLoadMapper.ts
import type { DisplayMessage } from "@/entity/message";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";
import type {
  MessageSummaryDTO,
  MessagesAroundResponseData,
  MessagesBoundaryPageResponseData,
} from "@/types/dto/message";

/**
 * 将单条消息摘要的 snake_case 与 camelCase 对齐，便于 loadmore/锚点/边界分页与后端字段同步。
 * 使用场景：HTTP 若仍带 `reply_to_message_id`、`at_user_ids` 等别名，映射层统一并进 DTO。
 */
function normalizeMessageSummaryRow(
  row: MessageSummaryDTO | Record<string, unknown>
): MessageSummaryDTO {
  const r = row as Record<string, unknown>;
  const base = { ...r } as MessageSummaryDTO;

  if (base.replyToMessageId == null && r.reply_to_message_id != null) {
    const n = Number(r.reply_to_message_id);
    base.replyToMessageId = Number.isFinite(n) ? n : null;
  }
  if (base.atUserIds == null && r.at_user_ids != null) {
    base.atUserIds = Array.isArray(r.at_user_ids)
      ? (r.at_user_ids as number[])
      : null;
  }
  if (base.replyToSenderDisplayName == null && r.reply_to_sender_display_name != null) {
    base.replyToSenderDisplayName = String(r.reply_to_sender_display_name);
  }
  if (base.replyToContentSnippet == null && r.reply_to_content_snippet != null) {
    base.replyToContentSnippet = String(r.reply_to_content_snippet);
  }
  return base;
}

/**
 * 统一历史消息数组兜底，保证调用方拿到可迭代数组。
 */
export function mapHistoryMessages(
  messages: MessageSummaryDTO[] | null | undefined
): MessageSummaryDTO[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => normalizeMessageSummaryRow(m));
}

/**
 * 统一锚点上下文响应兜底，避免上层反复判空。
 */
export function mapAroundMessages(
  data: MessagesAroundResponseData | null | undefined
): MessagesAroundResponseData {
  return {
    anchorMessageId: Number(data?.anchorMessageId || 0),
    windowSize: Number(data?.windowSize || 25),
    messages: mapHistoryMessages(data?.messages),
    total: Number(data?.total || 0),
  };
}

/**
 * 统一边界分页响应兜底，约束 direction / pageSize / messages。
 */
export function mapBoundaryMessages(
  data: MessagesBoundaryPageResponseData | null | undefined,
  direction: "before" | "after",
  pageSize: number
): MessagesBoundaryPageResponseData {
  const safeDirection = data?.direction === "after" ? "after" : "before";
  return {
    boundaryMessageId: Number(data?.boundaryMessageId || 0),
    direction: safeDirection || direction,
    messages: mapHistoryMessages(data?.messages),
    total: Number(data?.total || 0),
    pageSize: Number(data?.pageSize || pageSize),
  };
}

export interface MessageNameResolveContext {
  currentUserId: number | null;
  currentUserNickname: string;
  friends: Array<{
    friendId: number;
    remarkName?: string | null;
    nickname?: string;
  }>;
  membersByConvId?: Map<number, MessageDisplayMemberDTO[]>;
}

const normalizeText = (value?: string | null): string => (value || "").trim();

/**
 * 解析消息发送者显示名（备注 > 群昵称 > 用户昵称 > fallback）。
 */
export function resolveMessageSenderDisplayName(
  senderId: number,
  defaultName: string,
  context: MessageNameResolveContext,
  convType?: number,
  memberNickname?: string | null,
  convId?: number
): string {
  if (
    context.currentUserId != null &&
    Number(senderId) === Number(context.currentUserId)
  ) {
    return "我";
  }

  const friend = context.friends.find(
    (item) => Number(item.friendId) === Number(senderId)
  );

  let peerNickname = "";
  let peerMemberNickname = (memberNickname || "").trim();
  if (convId != null) {
    const members = context.membersByConvId?.get(convId);
    const member = members?.find((item) => Number(item.userId) === Number(senderId));
    if (!peerMemberNickname) {
      peerMemberNickname = (member?.memberNickname || "").trim();
    }
    peerNickname = (member?.userNickname || "").trim();
  }

  // 单聊：优先备注名，再用户昵称，最后回退默认名。
  if (Number(convType) === 1) {
    return (
      normalizeText(friend?.remarkName) ||
      normalizeText(friend?.nickname) ||
      normalizeText(peerNickname) ||
      defaultName ||
      "User"
    );
  }

  return (
    normalizeText(friend?.remarkName) ||
    normalizeText(peerMemberNickname) ||
    normalizeText(friend?.nickname) ||
    normalizeText(peerNickname) ||
    defaultName ||
    "User"
  );
}

/**
 * 将 MessageSummaryDTO 映射为 DisplayMessage，供 store 直接消费。
 */
export function mapMessageSummaryToDisplayMessage(
  message: MessageSummaryDTO,
  context: MessageNameResolveContext
): DisplayMessage {
  return {
    messageId: message.messageId,
    convId: message.convId,
    senderId: message.senderId,
    messageType: message.messageType,
    messageContent: message.messageContent,
    messageStatus: message.messageStatus,
    sendTime: message.sendTime,
    isRecalled: message.isRecalled,
    replyToMessageId: message.replyToMessageId,
    replyQuoteAuthorHint: message.replyToSenderDisplayName ?? null,
    replyQuoteContentHint: message.replyToContentSnippet ?? null,
    atUserIds: message.atUserIds,
    recallTime: message.recallTime,
    senderName: resolveMessageSenderDisplayName(
      message.senderId,
      message.displayName || message.privateDisplayName || "User",
      context,
      message.convType,
      message.memberNickname,
      message.convId
    ),
    senderAvatar: message.senderAvatar,
    isSentByMe:
      context.currentUserId != null && Number(message.senderId) === Number(context.currentUserId),
    fileId: message.fileId ?? null,
    fileName: message.fileName ?? null,
    fileSize: message.fileSize ?? null,
    fileMimeType: message.fileMimeType ?? null,
    thumbnailUrl: message.thumbnailUrl ?? null,
    downloadUrl: message.downloadUrl ?? null,
  };
}

/**
 * 规范单条 DisplayMessage 的 isSentByMe 字段。
 */
export function normalizeDisplayMessageSenderFlag(
  message: DisplayMessage,
  currentUserId: number | null
): DisplayMessage {
  return {
    ...message,
    isSentByMe:
      currentUserId != null && Number(message.senderId) === Number(currentUserId),
  };
}

/**
 * 按消息发送时间升序排序（早 -> 晚）。
 */
export function sortDisplayMessagesBySendTime(
  messages: DisplayMessage[]
): DisplayMessage[] {
  if (messages.length <= 1) return messages;
  return [...messages].sort((a, b) => {
    const timeA = new Date(a.sendTime).getTime();
    const timeB = new Date(b.sendTime).getTime();
    return timeA - timeB;
  });
}

/**
 * 合并消息列表并去重（以 messageId 唯一），支持 append/prepend。
 */
export function mergeDisplayMessages(
  baseMessages: DisplayMessage[],
  incomingMessages: DisplayMessage[],
  position: "append" | "prepend",
  currentUserId: number | null
): DisplayMessage[] {
  const normalizedIncoming = incomingMessages.map((item) =>
    normalizeDisplayMessageSenderFlag(item, currentUserId)
  );

  const uniqueIncoming = normalizedIncoming.filter(
    (incoming) =>
      !baseMessages.some((existing) => existing.messageId === incoming.messageId)
  );

  if (uniqueIncoming.length === 0) {
    return baseMessages;
  }

  return position === "append"
    ? [...baseMessages, ...uniqueIncoming]
    : [...uniqueIncoming, ...baseMessages];
}
