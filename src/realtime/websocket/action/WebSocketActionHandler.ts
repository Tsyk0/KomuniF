// src/realtime/websocket/action/WebSocketActionHandler.ts
import type { SendMessageRequest as SendMessageDTO } from "@/types/dto/message";
import type {
  ReadMessageRequest,
  RecallMessageRequest,
  SendMessageRequest as SendMessageWSRequest,
  SubscribeRequest,
  TypingClientRequest,
  UnsubscribeRequest,
  WebSocketClientOutboundMessage,
} from "../types/action-enums";

type Sender = (payload: WebSocketClientOutboundMessage) => boolean;

export class WebSocketActionHandler {
  constructor(private readonly sender: Sender) {}

  /** 发送已构造好的上行消息。 */
  sendRaw(payload: WebSocketClientOutboundMessage): boolean {
    return this.sender(payload);
  }

  /** 统一消息发送入口：按 messageType 路由到具体发送实现。 */
  sendMessageByType(request: SendMessageDTO): boolean {
    const type = (request.messageType || "text").toLowerCase();
    switch (type) {
      case "text":
        return this.sendTextMessage(request.convId, request.messageContent, request.replyToMessageId);
      case "image":
      case "file":
      case "video":
        return this.sendTypedMessage(
          request.convId,
          type,
          request.messageContent,
          request.replyToMessageId
        );
      default:
        return false;
    }
  }

  /** 发送文本消息。 */
  sendTextMessage(convId: number, messageContent: string, replyToMessageId?: number): boolean {
    const payload: SendMessageWSRequest = {
      action: "sendMessage",
      convId,
      messageType: "text",
      messageContent,
      replyToMessageId,
      localMessageId: `local_${Date.now()}`,
    };
    return this.sender(payload);
  }

  /**
   * 发送非文本消息（image/file/video）。
   * 作用场景：附件上传完成后，前端把 JSON 消息体推给实时通道。
   */
  sendTypedMessage(
    convId: number,
    messageType: "image" | "file" | "video",
    messageContent: string,
    replyToMessageId?: number
  ): boolean {
    const payload: SendMessageWSRequest = {
      action: "sendMessage",
      convId,
      messageType,
      messageContent,
      replyToMessageId,
      localMessageId: `local_${Date.now()}`,
    };
    return this.sender(payload);
  }

  /** 发送消息已读动作。 */
  sendReadMessage(messageId: number, convId: number): boolean {
    const payload: ReadMessageRequest = { action: "readMessage", messageId, convId };
    return this.sender(payload);
  }

  /** 发送撤回消息动作。 */
  sendRecallMessage(messageId: number): boolean {
    const payload: RecallMessageRequest = { action: "recallMessage", messageId };
    return this.sender(payload);
  }

  /** 发送输入中动作。 */
  sendTyping(convId: number): boolean {
    const payload: TypingClientRequest = { action: "typing", convId };
    return this.sender(payload);
  }

  /** 订阅单个会话。 */
  subscribe(convId: number): boolean {
    const payload: SubscribeRequest = { action: "subscribe", convId };
    return this.sender(payload);
  }

  /** 取消订阅单个会话。 */
  unsubscribe(convId: number): boolean {
    const payload: UnsubscribeRequest = { action: "unsubscribe", convId };
    return this.sender(payload);
  }
}
