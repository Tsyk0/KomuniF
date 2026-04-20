import service from "../../service";
import type { GetConversationSummariesResponse } from "@/types/dto/conversation";

/**
 * 获取用户会话摘要列表。
 * 对应后端接口：GET /conversations/summary
 * @param convId 可选，仅查询指定会话摘要（用于局部刷新）
 */
export function getConversationSummariesApi(
  convId?: number
): Promise<GetConversationSummariesResponse> {
  return service({
    url: "/conversations/summary",
    method: "get",
    params: convId != null ? { convId } : undefined,
  });
}

export const conversationSummaryApi = {
  getConversationSummaries: getConversationSummariesApi,
};

export default conversationSummaryApi;
