import service from "../../service";
import type { ConversationEntity } from "@/types/dto/conversation-member";
import type { BaseResponse } from "@/types/dto/base";

/**
 * 更新会话信息（用户侧可修改字段）
 * 对应后端接口：POST /conversation/updateConversationAttriUserOrientedByConvId
 * 仅可更新 convType、convName、convAvatar、convDescription、enableReadReceipt 等字段
 */
export function updateConversationAttriUserOrientedByConvIdApi(
  payload: Partial<ConversationEntity> & { convId: number }
): Promise<BaseResponse<string>> {
  return service({
    url: "/conversation/updateConversationAttriUserOrientedByConvId",
    method: "post",
    data: payload,
  });
}

export const manageConversationApi = {
  updateConversationAttriUserOrientedByConvId:
    updateConversationAttriUserOrientedByConvIdApi,
};

export default manageConversationApi;

