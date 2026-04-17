// File: src/apis/chat/conversation-create/index.ts
import service from "../../service";
import type { BaseResponse } from "@/types/dto/base";

export interface CreateConversationPayload {
  single: boolean;
  memberUserIds: number[];
  /** 群聊时由调用方传入；单聊不传，请求体中不包含该字段 */
  convName?: string;
}

export interface CreateConversationResult {
  success: boolean;
  convId: number;
  message: string;
}

export type CreateConversationResponse = BaseResponse<CreateConversationResult>;

/**
 * 创建会话（单聊/群聊）
 * POST /conversations/create
 */
export function createConversationApi(
  payload: CreateConversationPayload
): Promise<CreateConversationResponse> {
  const body: {
    single: boolean;
    memberUserIds: number[];
    convName?: string;
  } = {
    single: payload.single,
    memberUserIds: payload.memberUserIds,
  };
  if (!payload.single) {
    body.convName = (payload.convName || "").trim();
  }
  return service({
    url: "/conversations/create",
    method: "post",
    data: body,
  });
}

export const conversationCreateApi = {
  createConversation: createConversationApi,
};

export default conversationCreateApi;
