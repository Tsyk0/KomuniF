// src/store/message/sendMessage.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { SendMessageRequest, SendMessageResponseData } from "@/types/dto/message";
import { sendMessageNormalized } from "@/normalize/message";
import { buildTempFileMessage, buildTempTextMessage } from "@/normalize/message";
import type { DisplayMessage } from "@/entity/message";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";
import { useWebSocketStore } from "@/store/realtime/websocket";
import { useShowMessageStore } from "@/store/message/showMessage";

type LocalEchoPayload =
  | {
      kind: "text";
      content: string;
    }
  | {
      kind: "file";
      messageType: "image" | "file" | "video";
      fileId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    };

interface LocalEchoContext {
  convId: number;
  currentUserId: number;
  currentUserNickname?: string | null;
  currentUserAvatar?: string | null;
  conversationMembers?: MessageDisplayMemberDTO[];
}

export const useSendMessageStore = defineStore("sendMessage", () => {
  const webSocketStore = useWebSocketStore();
  const showMessageStore = useShowMessageStore();
  const isSending = ref(false);

  /**
   * 双通道发送：
   * 先尝试 WS 实时发送，再通过 HTTP 持久化，最终以 HTTP 结果为准。
   */
  const sendMessage = async (
    request: SendMessageRequest
  ): Promise<SendMessageResponseData> => {
    isSending.value = true;
    try {
      // 统一入口：根据 messageType 路由到具体发送逻辑（当前仅实现 text）。
      void webSocketStore.sendMessageByType(request);
      const normalized = await sendMessageNormalized(request);
      if (!normalized.success || !normalized.data) {
        throw new Error(normalized.message || "发送消息失败");
      }
      return normalized.data;
    } finally {
      isSending.value = false;
    }
  };

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
            conversationMembers: context.conversationMembers,
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
          });
    showMessageStore.addMessage(tempMessage);
    return tempMessage;
  };

  return {
    isSending,
    sendMessage,
    appendLocalMessageEcho,
  };
});
