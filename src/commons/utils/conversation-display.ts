import type { ConversationSummaryDTO } from "@/types/dto/conversation";

const DEFAULT_SINGLE_NAME = "未命名会话";
const DEFAULT_GROUP_NAME = "未命名群聊";
const DEFAULT_SYSTEM_NAME = "会话";

const normalizeText = (value?: string | null): string => (value || "").trim();

/**
 * 计算会话显示名称（仅用于 UI 展示，不修改原始数据）。
 * 使用场景：聊天头部、会话列表、搜索结果等需要统一显示策略时调用。
 */
export function getConversationDisplayName(
  conversation: ConversationSummaryDTO | null | undefined
): string {
  if (!conversation) return "";
  const convType = Number(conversation.convType);

  if (convType === 1) {
    const privateDisplayName = normalizeText(conversation.privateDisplayName);
    if (privateDisplayName) return privateDisplayName;

    /** 单聊备注名（后端摘要 peer）优先于会话公用名称。 */
    const peerRemarkName = normalizeText(conversation.peer?.peerRemarkName);
    if (peerRemarkName) return peerRemarkName;

    const serverName = normalizeText(conversation.convName);
    if (serverName) return serverName;

    const peerNickname = normalizeText(conversation.peer?.peerNickname);
    if (peerNickname) return peerNickname;

    return DEFAULT_SINGLE_NAME;
  }

  if (convType === 2) {
    const privateDisplayName = normalizeText(conversation.privateDisplayName);
    if (privateDisplayName) return privateDisplayName;
    const serverName = normalizeText(conversation.convName);
    if (serverName) return serverName;
    return DEFAULT_GROUP_NAME;
  }

  return normalizeText(conversation.convName) || DEFAULT_SYSTEM_NAME;
}

