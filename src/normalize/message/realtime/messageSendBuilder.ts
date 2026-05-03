import type { DisplayMessage } from "@/entity/message";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";
import {
  buildFileDownloadUrl,
  buildFileThumbnailUrl,
} from "@/commons/utils/file-url";

function normalizeAtUserIdsInput(ids?: number[] | null): number[] | undefined {
  if (!ids?.length) return undefined;
  const out: number[] = [];
  const seen = new Set<number>();
  for (const raw of ids) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out.length ? out : undefined;
}

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
  /** 被引用回复的消息 ID（与 WS sendMessage.replyToMessageId 一致）。 */
  replyToMessageId?: number | null;
  /** @ 提及的用户 ID 列表（与 WS sendMessage.atUserIds 一致）。 */
  atUserIds?: number[] | null;
}

export interface TempFileMessageBuildInput {
  /** 当前会话 ID。 */
  convId: number;
  /** 当前登录用户 ID。 */
  currentUserId: number;
  /** 当前登录用户头像（本人消息兜底显示）。 */
  currentUserAvatar?: string | null;
  /** 消息类型：image/file/video。 */
  messageType: "image" | "file" | "video";
  /** 业务消息 JSON 字符串。 */
  messageContent: string;
  /** 被引用回复的消息 ID；附件与文本共用。 */
  replyToMessageId?: number | null;
  /** @ 提及用户 ID；附件与文本共用。 */
  atUserIds?: number[] | null;
  /** 文件 ID。 */
  fileId: string;
  /** 文件名。 */
  fileName: string;
  /** 文件大小。 */
  fileSize: number;
  /** 文件 MIME。 */
  mimeType: string;
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

  const replyId = input.replyToMessageId;
  const replyToMessageId =
    replyId != null && Number.isFinite(Number(replyId)) && Number(replyId) > 0
      ? Number(replyId)
      : undefined;

  const atUserIds = normalizeAtUserIdsInput(input.atUserIds);

  return {
    messageId: now,
    convId: input.convId,
    senderId: input.currentUserId,
    messageType: "text",
    messageContent: input.content,
    messageStatus: 0,
    sendTime: new Date(now).toISOString(),
    replyToMessageId,
    atUserIds,
    senderName,
    senderAvatar: input.currentUserAvatar || me?.userAvatar || null,
    isSentByMe: true,
  };
}

/**
 * 构建发送中的临时附件消息。
 * 作用场景：上传成功后先把图片/文件/视频消息回显到列表，再等待服务端确认。
 */
export function buildTempFileMessage(input: TempFileMessageBuildInput): DisplayMessage {
  const now = Date.now();
  const replyId = input.replyToMessageId;
  const replyToMessageId =
    replyId != null && Number.isFinite(Number(replyId)) && Number(replyId) > 0
      ? Number(replyId)
      : undefined;
  const atUserIds = normalizeAtUserIdsInput(input.atUserIds);
  return {
    messageId: now,
    convId: input.convId,
    senderId: input.currentUserId,
    messageType: input.messageType,
    messageContent: input.messageContent,
    messageStatus: 0,
    sendTime: new Date(now).toISOString(),
    replyToMessageId,
    atUserIds,
    senderName: "我",
    senderAvatar: input.currentUserAvatar || null,
    isSentByMe: true,
    fileId: input.fileId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    fileMimeType: input.mimeType,
    thumbnailUrl: input.messageType === "image" ? buildFileThumbnailUrl(input.fileId) : null,
    downloadUrl: buildFileDownloadUrl(input.fileId),
  };
}
