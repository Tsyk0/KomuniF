// File: src/apis/chat/manage-conversation/index.ts
import service from "../../service";
import type { ConversationEntity } from "@/types/dto/conversation-member";
import type { BaseResponse } from "@/types/dto/base";

/**
 * 更新会话信息（用户侧可修改字段）
 * 对应后端接口：POST /conversation/updateConversationAttriUserOrientedByConvId
 * 仅可更新 convType、convName、convAvatar、convDescription、enableReadReceipt 等字段
 */
export function updateConversationSummaryApi(
  payload: Partial<ConversationEntity> & { convId: number }
): Promise<BaseResponse<string>> {
  const { convId, ...data } = payload;
  return service({
    url: `/conversations/${convId}`,
    method: "patch",
    data,
  });
}

export const manageConversationApi = {
  updateConversationSummary: updateConversationSummaryApi,
  updateConversationAttriUserOrientedByConvId:
    updateConversationSummaryApi,
};

export default manageConversationApi;

