import service from "../../service";
import type { BaseResponse } from "@/types/dto/base";

/**
 * 发起消息撤回请求。
 * 使用场景：聊天窗口中点击「撤回」后调用后端接口执行消息撤回。
 */
export function recallMessageApi(
  convId: number,
  messageId: number
): Promise<BaseResponse<null>> {
  return service({
    url: `/conversations/${convId}/messages/${messageId}/recall`,
    method: "post",
  });
}

export const messageRecallApi = {
  recallMessage: recallMessageApi,
};

