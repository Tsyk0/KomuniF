import type { DisplayMessage } from "@/entity/message";
import type { LastMessageInfo, MessageDisplayMemberDTO } from "@/types/dto/conversation";

/**
 * WS 入站消息映射的最小运行上下文。
 * 约定：优先使用当前会话的成员缓存（compressedCMMap）解析名称和头像。
 */
export interface RealtimeMessageMapContext {
  /** 当前登录用户 ID。 */
  currentUserId: number;
  /** 当前登录用户头像（本人消息回显时兜底）。 */
  currentUserAvatar?: string | null;
  /** 当前会话成员缓存（来自 pinia.compressedCMMap.get(convId)）。 */
  conversationMembers?: MessageDisplayMemberDTO[];
}

/**
 * 将 WS 入站 payload 映射为前端统一展示模型 DisplayMessage。
 *
 * - payload：后端 WS 推送的原始消息对象（字段可能不完整或有别名）
 * - context：当前前端运行态上下文（当前用户 + 会话成员缓存）
 *
 * 返回 null 表示 payload 缺少最基本标识（如 convId/senderId 非法），调用方应忽略。
 */
export function mapRealtimeIncomingToDisplayMessage(
  payload: Record<string, any>,
  context: RealtimeMessageMapContext
): DisplayMessage | null {
  // 1) 基础主键字段校验：没有会话或发送者就无法进入消息流。
  const convId = Number(payload.convId);
  const senderId = Number(payload.senderId);
  if (!Number.isFinite(convId) || convId <= 0) return null;
  if (!Number.isFinite(senderId) || senderId <= 0) return null;

  // 2) 归一化核心字段：兼容后端可能出现的空值/别名。
  const messageIdRaw = Number(payload.messageId);
  const messageId =
    Number.isFinite(messageIdRaw) && messageIdRaw > 0 ? messageIdRaw : Date.now();
  const sendTime = payload.sendTime
    ? new Date(payload.sendTime).toISOString()
    : new Date().toISOString();

  // 3) 使用会话成员缓存按 senderId 解析发送者名称与头像。
  const member = context.conversationMembers?.find(
    (m) => Number(m.userId) === senderId
  );
  const senderName =
    senderId === context.currentUserId
      ? "我"
      : (member?.memberNickname || "").trim() ||
        (member?.userNickname || "").trim() ||
        `用户${senderId}`;
  const senderAvatar =
    senderId === context.currentUserId
      ? context.currentUserAvatar || member?.userAvatar || null
      : member?.userAvatar || null;

  // 4) 组装统一展示消息：保证下游组件/Store 使用同一数据结构。
  return {
    messageId,
    convId,
    senderId,
    messageType: payload.messageType || "text",
    messageContent: payload.messageContent || payload.content || "",
    messageStatus: Number(payload.messageStatus) || 1,
    sendTime,
    replyToMessageId: payload.replyToMessageId || undefined,
    isRecalled: Boolean(Number(payload.isRecalled)),
    senderName,
    senderAvatar,
    fileId: payload.fileId ?? null,
    fileName: payload.fileName ?? null,
    fileSize:
      typeof payload.fileSize === "number" && Number.isFinite(payload.fileSize)
        ? payload.fileSize
        : null,
    fileMimeType: payload.fileMimeType ?? null,
    thumbnailUrl: payload.thumbnailUrl ?? null,
    downloadUrl: payload.downloadUrl ?? null,
    // 统一判定是否本人发送，供 UI 左右布局与状态渲染使用。
    isSentByMe: senderId === context.currentUserId,
  };
}

/**
 * 将 WS `newMessage` 的 payload 转为会话列表用的 `LastMessageInfo`（与 `mapRealtimeIncomingToDisplayMessage` 的字段解析一致）。
 * 使用场景：Pinia 会话摘要需根据实时推送更新「最后一条」预览与排序时间，而不打开聊天窗时。
 */
export function mapRealtimePayloadToLastMessageInfo(
  payload: Record<string, any>,
  context: RealtimeMessageMapContext
): LastMessageInfo | null {
  const convId = Number(payload.convId);
  const senderId = Number(payload.senderId);
  if (!Number.isFinite(convId) || convId <= 0) return null;
  if (!Number.isFinite(senderId) || senderId <= 0) return null;

  const messageIdRaw = Number(payload.messageId);
  const messageId =
    Number.isFinite(messageIdRaw) && messageIdRaw > 0 ? messageIdRaw : Date.now();

  const member = context.conversationMembers?.find(
    (m) => Number(m.userId) === senderId
  );
  const senderDisplayName =
    senderId === context.currentUserId
      ? "我"
      : (member?.memberNickname || "").trim() ||
        (member?.userNickname || "").trim() ||
        `用户${senderId}`;

  const senderAvatar =
    senderId === context.currentUserId
      ? context.currentUserAvatar || member?.userAvatar || null
      : member?.userAvatar || null;

  const sendTime = payload.sendTime
    ? new Date(payload.sendTime).toISOString()
    : new Date().toISOString();

  return {
    messageId,
    senderId,
    messageType: payload.messageType || "text",
    messageContent: payload.messageContent || payload.content || "",
    senderDisplayName,
    senderAvatar,
    sendTime,
  };
}

/**
 * 将本地回显的 `DisplayMessage` 转为会话侧栏用的 `LastMessageInfo`（当前用户刚发出的一条）。
 * 使用场景：WS 发送成功或秒传仅回显后，立即更新 Pinia 会话摘要，无需等服务端 `newMessage` 环回。
 */
export function mapDisplayMessageToLastMessageInfo(msg: DisplayMessage): LastMessageInfo {
  const senderDisplayName = (msg.senderName || "").trim() || "我";
  return {
    messageId: msg.messageId,
    senderId: msg.senderId,
    messageType: msg.messageType || "text",
    messageContent: msg.messageContent || "",
    senderDisplayName,
    senderAvatar: msg.senderAvatar ?? null,
    sendTime: msg.sendTime,
  };
}
