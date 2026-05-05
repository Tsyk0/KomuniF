// src/normalize/conversation/load/convLoadMapper.ts
import type {
  LastMessageInfo,
  ConversationSummaryDTO,
} from "@/types/dto/conversation";
import { ConversationMemberDisplayStatus } from "@/types/dto/conversation";

const DEFAULT_LAST_MESSAGE = "[暂无消息]";

/** 统一去空白，避免各处重复 trim 判空。 */
const normalizeText = (value?: string | null): string => (value || "").trim();

/** 入参可能来自接口原始 JSON，displayStatus 可能缺失；输出始终为合法枚举值。 */
type ConversationSummaryNormalizeInput = Omit<ConversationSummaryDTO, "displayStatus"> & {
  displayStatus?: unknown;
};

/**
 * 规范 display_status：0 置顶、1 默认、2 主列表不展示；与 convStatus 无关。
 * 使用场景：会话摘要写入 store 前统一数值，与库 COALESCE(display_status,1) 一致。
 */
function normalizeDisplayStatusField(raw: unknown): number {
  const n = Number(raw);
  if (
    n === ConversationMemberDisplayStatus.PINNED ||
    n === ConversationMemberDisplayStatus.DEFAULT ||
    n === ConversationMemberDisplayStatus.HIDDEN
  ) {
    return n;
  }
  return ConversationMemberDisplayStatus.DEFAULT;
}

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
 * - 补全 displayStatus（会话成员展示位，与 convStatus 无关）
 */
export function normalizeConversationSummary(
  conv: ConversationSummaryNormalizeInput
): ConversationSummaryDTO {
  const convType = Number(conv.convType);
  const normalized: ConversationSummaryDTO = {
    ...conv,
    displayStatus: normalizeDisplayStatusField(conv.displayStatus),
    lastReadMessageId: Number.isFinite(Number(conv.lastReadMessageId))
      ? Math.max(0, Number(conv.lastReadMessageId))
      : 0,
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
