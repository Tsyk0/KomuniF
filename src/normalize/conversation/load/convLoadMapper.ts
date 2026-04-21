// src/normalize/conversation/load/convLoadMapper.ts
import type {
  LastMessageInfo,
  ConversationSummaryDTO,
} from "@/types/dto/conversation";

const DEFAULT_SINGLE_NAME = "未命名会话";
const DEFAULT_GROUP_NAME = "未命名群聊";
const DEFAULT_SYSTEM_NAME = "会话";
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
 * 单聊会话名兜底策略：
 * 1) privateDisplayName（备注）
 * 2) 后端 convName（公用）
 * 3) summary.peerRemarkName
 * 4) summary.peerNickname
 * 5) 默认文案
 */
function resolveSingleChatName(conv: ConversationSummaryDTO): string {
  const privateDisplayName = normalizeText(conv.privateDisplayName);
  if (privateDisplayName) return privateDisplayName;

  // 后端 summary 直接返回的 peer 备注/昵称优先用于单聊显示名。
  const peerRemarkName = normalizeText(conv.peer?.peerRemarkName);
  if (peerRemarkName) return peerRemarkName;

  const serverName = normalizeText(conv.convName);
  if (serverName) return serverName;

  const peerNicknameFromSummary = normalizeText(conv.peer?.peerNickname);
  if (peerNicknameFromSummary) return peerNicknameFromSummary;

  return DEFAULT_SINGLE_NAME;
}

/** 群聊会话名兜底策略：私有备注名 -> 服务端群名 -> 默认文案。 */
function resolveGroupChatName(conv: ConversationSummaryDTO): string {
  const privateDisplayName = normalizeText(conv.privateDisplayName);
  if (privateDisplayName) return privateDisplayName;

  const serverName = normalizeText(conv.convName);
  if (serverName) return serverName;

  return DEFAULT_GROUP_NAME;
}

/**
 * 会话摘要归一化主入口：
 * - 规范 unreadCount
 * - 保证 lastMessage 可展示
 * - 对 convName/convAvatar 做兜底
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

  if (convType === 1) {
    normalized.convName = resolveSingleChatName(conv);
    if (!normalizeText(normalized.convAvatar)) {
      normalized.convAvatar = conv.peer?.peerAvatar || null;
    }
  } else if (convType === 2) {
    normalized.convName = resolveGroupChatName(conv);
  } else {
    normalized.convName = normalizeText(conv.convName) || DEFAULT_SYSTEM_NAME;
  }

  if (!normalizeText(normalized.lastMessage?.messageContent)) {
    normalized.lastMessage = {
      ...(normalized.lastMessage || buildFallbackLastMessage(conv.updateTime)),
      messageContent: DEFAULT_LAST_MESSAGE,
    };
  }

  return normalized;
}
