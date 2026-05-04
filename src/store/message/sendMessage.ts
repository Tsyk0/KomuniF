// src/store/message/sendMessage.ts
import { defineStore } from "pinia";
import { buildTempFileMessage, buildTempTextMessage } from "@/normalize/message";
import type { DisplayMessage } from "@/entity/message";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";
import { useShowMessageStore } from "@/store/message/showMessage";

type LocalEchoPayload =
  | {
      kind: "text";
      content: string;
      /** 前端生成的临时消息标识，用于和 messageSent 回执对齐。 */
      clientMessageId?: string;
      /** 与下行 WS 一致：引用回复的目标 messageId。 */
      replyToMessageId?: number;
      /** 与下行 WS 一致的 @ 用户 ID 列表。 */
      atUserIds?: number[];
    }
  | {
      kind: "file";
      messageType: "image" | "file" | "video";
      fileId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      /** 前端生成的临时消息标识，用于和 messageSent 回执对齐。 */
      clientMessageId?: string;
      replyToMessageId?: number;
      atUserIds?: number[];
    };

interface LocalEchoContext {
  convId: number;
  currentUserId: number;
  currentUserNickname?: string | null;
  currentUserAvatar?: string | null;
  conversationMembers?: MessageDisplayMemberDTO[];
}

export const useSendMessageStore = defineStore("sendMessage", () => {
  const showMessageStore = useShowMessageStore();

  /**
   * 统一本地回显（文本 + 附件），用于“自己发送时先显示一条发送中消息”。
   * 场景：组件只负责交互，回显构建和入列逻辑统一放在 store 复用。
   */
  const appendLocalMessageEcho = (
    context: LocalEchoContext,
    payload: LocalEchoPayload
  ): DisplayMessage => {
    /** 构建并入列的临时消息，后续发送失败可用 messageId 回写失败状态。 */
    const tempMessage =
      payload.kind === "text"
        ? buildTempTextMessage({
            convId: context.convId,
            currentUserId: context.currentUserId,
            currentUserNickname: context.currentUserNickname || null,
            currentUserAvatar: context.currentUserAvatar || null,
            content: payload.content,
            clientMessageId: payload.clientMessageId,
            conversationMembers: context.conversationMembers,
            replyToMessageId: payload.replyToMessageId,
            atUserIds: payload.atUserIds,
          })
        : buildTempFileMessage({
            convId: context.convId,
            currentUserId: context.currentUserId,
            currentUserAvatar: context.currentUserAvatar || null,
            messageType: payload.messageType,
            messageContent: JSON.stringify({
              fileId: payload.fileId,
              fileName: payload.fileName,
              fileSize: payload.fileSize,
              mimeType: payload.mimeType,
            }),
            fileId: payload.fileId,
            fileName: payload.fileName,
            fileSize: payload.fileSize,
            mimeType: payload.mimeType,
            clientMessageId: payload.clientMessageId,
            replyToMessageId: payload.replyToMessageId,
            atUserIds: payload.atUserIds,
          });
    showMessageStore.addMessage(tempMessage);
    return tempMessage;
  };

  return {
    appendLocalMessageEcho,
  };
});
