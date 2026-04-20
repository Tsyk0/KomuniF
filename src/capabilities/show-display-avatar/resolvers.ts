// File: src/capabilities/show-display-avatar/resolvers.ts
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import type { DisplayMessage } from "@/entity/message";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";

const SINGLE_CHAT_TYPE = 1;

function toValidPositiveInt(value: unknown): number | null {
  const normalized = Math.floor(Number(value));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
}

/**
 * 会话列表 / 顶栏：最终用于展示的头像 URL。
 * 单聊：仅使用 peer 头像缓存（已由 store 规范化为绝对 URL）；群聊等：规范化 conv.convAvatar。
 */
export function resolveConversationAvatarDisplayUrl(
  conversation: ConversationSummaryDTO | null | undefined,
  avatarByConvId: Record<number, string>
): string {
  if (!conversation) return "";
  if (Number(conversation.convType) === SINGLE_CHAT_TYPE) {
    const convId = toValidPositiveInt(conversation.convId);
    if (!convId) return "";
    return avatarByConvId[convId] || "";
  }
  return normalizeAvatarUrl(conversation.convAvatar || "");
}

export type MessageAvatarResolveInput = {
  convType: number | null | undefined;
  message: DisplayMessage;
  /** 与 {@link useSingleChatPeerAvatarStore#avatarByConvId} 一致，值为已规范化的展示 URL */
  avatarByConvId: Record<number, string>;
  currentUserAvatar?: string | null;
};

/**
 * 消息行头像：在调用 {@link normalizeAvatarUrl} 之前的原始来源（或单聊缓存中的已规范化 URL）。
 */
export function resolveMessageRowAvatarRawSource(
  input: MessageAvatarResolveInput
): string | null {
  const {
    message,
    convType,
    avatarByConvId,
    currentUserAvatar = null,
  } = input;
  const isSingleChat = Number(convType) === SINGLE_CHAT_TYPE;

  // 单聊头像规则：自己消息 -> 当前用户头像；对方消息 -> peer 缓存
  if (isSingleChat) {
    if (message.isSentByMe) {
      return currentUserAvatar;
    }

    const convId = toValidPositiveInt(message.convId);
    if (!convId) return "";
    return avatarByConvId[convId] || "";
  }

  // 群聊/其他：自己消息优先用当前用户头像，否则使用消息发送者头像
  if (message.isSentByMe) {
    return currentUserAvatar;
  }
  return message.senderAvatar || null;
}
