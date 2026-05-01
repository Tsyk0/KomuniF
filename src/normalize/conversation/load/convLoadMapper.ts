// src/normalize/conversation/load/convLoadMapper.ts
import type {
  LastMessageInfo,
  ConversationSummaryDTO,
} from "@/types/dto/conversation";

const DEFAULT_LAST_MESSAGE = "[暂无消息]";

/** 统一去空白，避免各处重复 trim 判空。 */
const normalizeText = (value?: string | null): string => (value || "").trim();

/** 当 lastMessage 缺失时，提供一条可展示的默认消息对象。 */
function buildFallbackLastMessage(updateTime: string): LastMessageInfo {
  return {
    messageId: 0,
    senderId: 0,
    messageType: "text",
    messageContent: DEFAULT_LAST_MESSAGE,
    senderDisplayName: "",
    senderAvatar: null,
    sendTime: updateTime || new Date().toISOString(),
  };
}

/**
 * 会话摘要归一化主入口：
 * - 规范 unreadCount
 * - 保证 lastMessage 可展示
 * - 保持 convName 原始值，仅做 avatar 兜底
 */
export function normalizeConversationSummary(conv: ConversationSummaryDTO): ConversationSummaryDTO {
  const convType = Number(conv.convType);
  const normalized: ConversationSummaryDTO = {
    ...conv,
    unreadCount: Number.isFinite(Number(conv.unreadCount))
      ? Math.max(0, Number(conv.unreadCount))
      : 0,
    lastMessage: conv.lastMessage || buildFallbackLastMessage(conv.updateTime),
  };

  if (convType === 1 && !normalizeText(normalized.convAvatar)) {
    normalized.convAvatar = conv.peer?.peerAvatar || null;
  }

  if (!normalizeText(normalized.lastMessage?.messageContent)) {
    normalized.lastMessage = {
      ...(normalized.lastMessage || buildFallbackLastMessage(conv.updateTime)),
      messageContent: DEFAULT_LAST_MESSAGE,
    };
  }

  return normalized;
}
