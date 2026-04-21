// src/store/message/sendMessage.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { SendMessageRequest, SendMessageResponseData } from "@/types/dto/message";
import { sendMessageNormalized } from "@/normalize/message";
import { useWebSocketStore } from "@/store/realtime/websocket";

export const useSendMessageStore = defineStore("sendMessage", () => {
  const webSocketStore = useWebSocketStore();
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

  /** 文本消息便捷方法，兼容现有调用签名。 */
  const sendTextMessage = async (
    convId: number,
    _senderId: number,
    content: string
  ): Promise<SendMessageResponseData> => {
    return sendMessage({
      convId,
      messageType: "text",
      messageContent: content,
    });
  };

  return {
    isSending,
    sendMessage,
    sendTextMessage,
  };
});
