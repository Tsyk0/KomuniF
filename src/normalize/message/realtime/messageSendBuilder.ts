import type { DisplayMessage } from "@/entity/message";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";

/** 临时文本消息构建参数。 */
export interface TempTextMessageBuildInput {
  /** 当前会话 ID。 */
  convId: number;
  /** 当前登录用户 ID。 */
  currentUserId: number;
  /** 当前登录用户昵称（本人消息兜底显示）。 */
  currentUserNickname?: string | null;
  /** 当前登录用户头像（本人消息兜底显示）。 */
  currentUserAvatar?: string | null;
  /** 文本消息内容。 */
  content: string;
  /** 当前会话成员缓存（来自 compressedCMMap）。 */
  conversationMembers?: MessageDisplayMemberDTO[];
}

/**
 * 构建发送中的临时文本消息。
 * 说明：这里只做“数据组装”，不负责 WS/HTTP 发送与回退流程。
 */
export function buildTempTextMessage(
  input: TempTextMessageBuildInput
): DisplayMessage {
  const now = Date.now();
  const me = input.conversationMembers?.find(
    (m) => Number(m.userId) === input.currentUserId
  );
  const senderName = "我";

  return {
    messageId: now,
    convId: input.convId,
    senderId: input.currentUserId,
    messageType: "text",
    messageContent: input.content,
    messageStatus: 0,
    sendTime: new Date(now).toISOString(),
    senderName,
    senderAvatar: input.currentUserAvatar || me?.userAvatar || null,
    isSentByMe: true,
  };
}
