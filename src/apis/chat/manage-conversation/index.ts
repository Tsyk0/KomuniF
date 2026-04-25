// File: src/apis/chat/manage-conversation/index.ts
import service from "../../service";
import type { ConversationEntity } from "@/types/dto/conversation-member";
import type { BaseResponse } from "@/types/dto/base";

/**
 * 更新会话信息（统一 multipart 协议）
 * 对应后端接口：PATCH /conversations/{convId}
 * Content-Type: multipart/form-data
 * - 文件字段：convAvatarFile
 * - 文本字段：convName / convDescription / enableReadReceipt / convType / convAvatar(可选字符串URL)
 */
export function updateConversationInfoApi(
  convId: number,
  payload: Partial<ConversationEntity> = {},
  convAvatarFile?: File
): Promise<BaseResponse<string>> {
  const formData = new FormData();
  if (convAvatarFile) formData.append("convAvatarFile", convAvatarFile);
  if (payload.convName != null) formData.append("convName", String(payload.convName));
  if (payload.convDescription != null) {
    formData.append("convDescription", String(payload.convDescription));
  }
  if (payload.enableReadReceipt != null) {
    formData.append("enableReadReceipt", String(payload.enableReadReceipt));
  }
  if (payload.convType != null) formData.append("convType", String(payload.convType));
  if (payload.convAvatar != null) formData.append("convAvatar", String(payload.convAvatar));

  return service({
    url: `/conversations/${convId}`,
    method: "patch",
    headers: { "Content-Type": "multipart/form-data" },
    data: formData,
  });
}

export const manageConversationApi = {
  updateConversationInfo: updateConversationInfoApi,
};

export default manageConversationApi;

