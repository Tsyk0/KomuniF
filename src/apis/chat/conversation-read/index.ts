import service from "../../service";
import type { BaseResponse } from "@/types/dto/base";
import type { LatestReadReceiptResponse } from "@/types/dto/message";

export interface MarkConversationReadPayload {
  messageId: number;
}

/**
 * 上报会话已读游标。
 * 使用场景：用户退出会话时，同步本次会话浏览到的最大 messageId。
 */
export function markConversationReadApi(
  convId: number,
  payload: MarkConversationReadPayload
): Promise<BaseResponse<string>> {
  return service({
    url: `/conversations/${convId}/mark-read`,
    method: "post",
    data: payload,
  });
}

/**
 * 页面关闭阶段尽力上报会话已读游标（优先 sendBeacon，失败时 keepalive fetch）。
 * 使用场景：beforeunload/pagehide 中做兜底同步，避免普通异步请求被浏览器取消。
 */
export function sendMarkConversationReadBeacon(
  convId: number,
  payload: MarkConversationReadPayload
): boolean {
  const baseUrl = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const url = `${baseUrl}/conversations/${convId}/mark-read`;
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    const ok = navigator.sendBeacon(url, blob);
    if (ok) return true;
  }

  try {
    const accessToken = localStorage.getItem("access_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    void fetch(url, {
      method: "POST",
      headers,
      body,
      credentials: "include",
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取当前用户在会话内「自己发送的最新一条消息」已读详情。
 * 使用场景：进入会话后渲染已读回执区域，以及弹窗分页加载。
 */
export function getLatestReadReceiptApi(params: {
  convId: number;
  limit?: number;
  offset?: number;
}): Promise<LatestReadReceiptResponse> {
  return service({
    url: "/message/latest/read-receipt",
    method: "get",
    params,
  });
}

export const conversationReadApi = {
  markConversationRead: markConversationReadApi,
  sendMarkConversationReadBeacon,
  getLatestReadReceipt: getLatestReadReceiptApi,
};

export default conversationReadApi;
