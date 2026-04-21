import type { DisplayMessage } from "@/entity/message";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";
import { mapRealtimeIncomingToDisplayMessage } from "./messageRealtimeMapper";

/** WS 入站消息处理输入。 */
export interface HandleRealtimeIncomingInput {
  /** 原始 WS payload。 */
  payload: Record<string, any>;
  /** 当前登录用户 ID。 */
  currentUserId: number;
  /** 当前登录用户头像。 */
  currentUserAvatar?: string | null;
  /** 当前会话成员缓存（来自 compressedCMMap.get(convId)）。 */
  conversationMembers?: MessageDisplayMemberDTO[];
  /** 消息是否已存在（用于去重）。 */
  hasMessage: (messageId: number) => boolean;
  /** 将消息写入 store，返回是否新增成功。 */
  appendMessage: (message: DisplayMessage) => boolean;
  /** 视口是否贴底（用于判定是否自动滚动）。 */
  isNearBottom: boolean;
}

/** WS 入站消息处理结果。 */
export interface HandleRealtimeIncomingResult {
  /** 是否成功新增消息。 */
  added: boolean;
  /** 需要触发滚动到底部。 */
  shouldScrollToBottom: boolean;
  /** 归一化后的展示消息（若新增成功）。 */
  displayMessage?: DisplayMessage;
}

/**
 * 处理 WS 入站消息（去重 + 映射 + 入列 + 自动滚动判定）。
 * 说明：不直接操作 DOM，组件只需根据结果决定是否滚动。
 */
export function handleRealtimeIncomingMessage(
  input: HandleRealtimeIncomingInput
): HandleRealtimeIncomingResult {
  const messageId = Number(input.payload.messageId);
  if (Number.isFinite(messageId) && messageId > 0 && input.hasMessage(messageId)) {
    return { added: false, shouldScrollToBottom: false };
  }

  const displayMessage = mapRealtimeIncomingToDisplayMessage(input.payload, {
    currentUserId: input.currentUserId,
    currentUserAvatar: input.currentUserAvatar || null,
    conversationMembers: input.conversationMembers || [],
  });
  if (!displayMessage) {
    return { added: false, shouldScrollToBottom: false };
  }

  const added = input.appendMessage(displayMessage);
  if (!added) {
    return { added: false, shouldScrollToBottom: false };
  }

  return {
    added: true,
    shouldScrollToBottom: displayMessage.isSentByMe || input.isNearBottom,
    displayMessage,
  };
}
