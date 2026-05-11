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

function normalizeAtUserIds(ids: number[] | null | undefined): number[] | undefined {
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

export class WebSocketActionHandler {
  constructor(private readonly sender: Sender) { }
  // 上面两行等价于：
  // export class WebSocketActionHandler {
  //   private readonly sender: Sender;  // ← 声明一个实例属性

  //   constructor(sender: Sender) {
  //     this.sender = sender;  // ← 把参数赋值给实例属性
  //   }
  // }
  //   类比java中的构造函数：
  //   public class WebSocketActionHandler {
  //     private Sender sender;  // 实例属性

  //     // 构造函数（没有返回类型）
  //     public WebSocketActionHandler(Sender sender) {
  //         this.sender = sender;  // 参数赋值给实例属性
  //     }
  // }
  /** 发送已构造好的上行消息。 */
  sendRaw(payload: WebSocketClientOutboundMessage): boolean {
    return this.sender(payload);
  }

  /** 统一消息发送入口：按 messageType 路由到具体发送实现。 */
  sendMessageByType(request: SendMessageDTO): boolean {
    const type = (request.messageType || "text").toLowerCase();
    const atUserIds = normalizeAtUserIds(request.atUserIds);
    switch (type) {
      case "text":
        return this.sendTextMessage(
          request.convId,
          request.messageContent,
          request.clientMessageId,
          request.replyToMessageId,
          atUserIds
        );
      case "image":
      case "file":
      case "video":
        return this.sendTypedMessage(
          request.convId,
          type,
          request.messageContent,
          request.clientMessageId,
          request.replyToMessageId,
          atUserIds
        );
      case "rtc":
        // 通话摘要由流程自动生成：不传 reply / @（第 4、5 参 undefined）；第 6 参置 messageType 为 rtc。
        return this.sendTextMessage(
          request.convId,
          request.messageContent,
          request.clientMessageId,
          undefined,
          undefined,
          "rtc"
        );
      default:
        return false;
    }
  }

  /**
   * 发送文本或与文本同形的上行帧（含通话摘要 `rtc`）。
   * 使用场景：`sendMessageByType` 中 text / rtc 共用同一帧结构。
   *
   * 参数位次说明（避免把末尾的 `"rtc"` 当成「多出来的字符串」）：
   * 1. convId
   * 2. messageContent
   * 3. clientMessageId
   * 4. replyToMessageId（仅普通文本/附件引用回复；rtc 传 undefined）
   * 5. atUserIds（提及用户；rtc 传 undefined，由 handler 忽略请求体里的 @）
   * 6. messageType：WS 帧里的消息类型，默认 `"text"`；通话摘要为 `"rtc"`。
   */
  sendTextMessage(
    convId: number,
    messageContent: string,
    clientMessageId?: string,
    replyToMessageId?: number,
    atUserIds?: number[],
    messageType: "text" | "rtc" = "text"
  ): boolean {
    const normalizedClientMessageId = clientMessageId || `client_${Date.now()}`;
    const payload: SendMessageWSRequest = {
      action: "sendMessage",
      convId,
      messageType,
      messageContent,
      clientMessageId: normalizedClientMessageId,
    };
    if (replyToMessageId != null && Number(replyToMessageId) > 0) {
      payload.replyToMessageId = replyToMessageId;
    }
    if (atUserIds != null && atUserIds.length > 0) {
      payload.mentionedUserIds = [...atUserIds];
      payload.atUserIds = [...atUserIds];
    }
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
    clientMessageId?: string,
    replyToMessageId?: number,
    atUserIds?: number[]
  ): boolean {
    const normalizedClientMessageId = clientMessageId || `client_${Date.now()}`;
    const payload: SendMessageWSRequest = {
      action: "sendMessage",
      convId,
      messageType,
      messageContent,
      clientMessageId: normalizedClientMessageId,
    };
    if (replyToMessageId != null && Number(replyToMessageId) > 0) {
      payload.replyToMessageId = replyToMessageId;
    }
    if (atUserIds != null && atUserIds.length > 0) {
      payload.mentionedUserIds = [...atUserIds];
      payload.atUserIds = [...atUserIds];
    }
    return this.sender(payload);
  }

  /** 发送消息已读动作。 */
  sendReadMessage(messageId: number, convId: number): boolean {
    const payload: ReadMessageRequest = { action: "readMessage", messageId, convId };
    return this.sender(payload);
  }

  /** 发送撤回消息动作。 */
  sendRecallMessage(messageId: number, convId?: number): boolean {
    const payload: RecallMessageRequest = { action: "recallMessage", messageId };
    if (convId != null && Number.isFinite(Number(convId)) && Number(convId) > 0) {
      payload.convId = Number(convId);
    }
    return this.sender(payload);
  }

  /** 发送输入中动作。 */
  sendTyping(convId: number, isCancel?: boolean): boolean {
    const payload: TypingClientRequest = { action: "typing", convId };
    if (typeof isCancel === "boolean") {
      payload.isCancel = isCancel;
    }
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
