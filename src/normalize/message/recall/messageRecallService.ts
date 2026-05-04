import { messageRecallApi } from "@/apis/chat/message-recall";

/**
 * 发送撤回请求并返回是否成功。
 * 使用场景：消息菜单点击「撤回」后，由聊天组件调用并按结果给出提示。
 */
export async function recallMessageNormalized(
  convId: number,
  messageId: number
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
  try {
    const response = await messageRecallApi.recallMessage(convId, messageId);
    if (response.code === 200) {
      return { ok: true };
    }
    return {
      ok: false,
      errorMessage: response.message || "撤回失败，请稍后重试",
    };
  } catch {
    return {
      ok: false,
      errorMessage: "撤回失败，请重试",
    };
  }
}

