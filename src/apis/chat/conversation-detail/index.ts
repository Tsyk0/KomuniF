import service from "../../service";
import type { GetConversationDetailsResponse } from "@/types/dto/conversation";

/**
 * 获取用户会话详情列表（复合查询）- 新接口
 * 对应后端接口：GET /conversationDetail/getConversationDetailsViaToken
 * 一次性获取会话信息、最后消息、发送者信息等
 * @param convId 可选，传入时仅查询该会话的详情（用于单独刷新某条会话，如修改备注后更新会话项）
 */
export function getConversationDetailsViaTokenApi(
  convId?: number
): Promise<GetConversationDetailsResponse> {
  return service({
    url: "/conversationDetail/getConversationDetailsViaToken",
    method: "get",
    params: convId != null ? { convId } : undefined,
  });
}

/**
 * 统一导出 API 对象
 */
export const conversationDetailApi = {
  getConversationDetailsViaToken: getConversationDetailsViaTokenApi,
};

export default conversationDetailApi;