import type { CreateConversationResponse } from "@/apis/chat/conversation-create";

export interface ConvCreateResult {
  success: boolean;
  convId: number | null;
  message: string;
}

export function mapConvCreateResponse(
  response: CreateConversationResponse
): ConvCreateResult {
  const convId =
    response?.data?.convId != null ? Number(response.data.convId) : null;
  const success =
    response.code === 200 && !!response.data?.success && convId != null;

  return {
    success,
    convId: success ? convId : null,
    message: response.message || response.data?.message || "创建会话失败",
  };
}
