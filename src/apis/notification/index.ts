// File: src/apis/notification/index.ts
import service from "@/apis/service";
import type {
  ApiResponse,
  NotificationCursorDTO,
  NotificationRecentItemDTO,
  NotificationUnreadSummaryDTO,
  SendFriendRequestResult,
  RequestHandlePayload,
  RequestHandle,
} from "@/types/dto/notification";

/**
 * 拉取当前用户最近系统通知
 * GET /notifications/recent
 */
export async function getRecentNotifications(
  page?: number,
  pageSize?: number
): Promise<ApiResponse<NotificationRecentItemDTO[]>> {
  const params: Record<string, number> = {};
  if (page != null && Number.isFinite(page)) {
    params.page = Math.max(1, Math.floor(Number(page)));
  }
  if (pageSize != null && Number.isFinite(pageSize)) {
    params.pageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize))));
  }
  return service({
    url: "/notifications/recent",
    method: "get",
    params: Object.keys(params).length ? params : undefined,
  });
}

/**
 * 以 notificationId 为锚点向更早翻页。
 * GET /notifications/recent/more?anchorId={id}&pageSize={n}
 */
export async function getRecentNotificationsBeforeAnchor(
  anchorId: number,
  pageSize?: number
): Promise<ApiResponse<NotificationRecentItemDTO[]>> {
  const id = Math.floor(Number(anchorId));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("无效的通知锚点 ID");
  }

  const params: Record<string, number> = {
    anchorId: id,
  };
  if (pageSize != null && Number.isFinite(pageSize)) {
    params.pageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize))));
  }

  return service({
    url: "/notifications/recent/more",
    method: "get",
    params,
  });
}

/** GET /notifications/cursor */
export async function getNotificationCursor(): Promise<
  ApiResponse<NotificationCursorDTO>
> {
  return service({
    url: "/notifications/cursor",
    method: "get",
  });
}

/** POST /notifications/cursor */
export async function updateNotificationCursor(payload: {
  notificationLastReadId?: number;
}): Promise<ApiResponse<null>> {
  return service({
    url: "/notifications/cursor",
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: payload,
  });
}

/** GET /notifications/unread-summary */
export async function getNotificationUnreadSummary(): Promise<
  ApiResponse<NotificationUnreadSummaryDTO>
> {
  return service({
    url: "/notifications/unread-summary",
    method: "get",
  });
}

/**
 * 发送好友申请（对方通知列表一般为 friend_add_request 等类型，以后端为准）
 * POST /friends/{userId}/friend-request，无 Body；userId 为接收方
 */
export async function sendFriendRequest(
  targetUserId: number
): Promise<ApiResponse<SendFriendRequestResult>> {
  const id = Math.floor(Number(targetUserId));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("无效的用户 ID");
  }
  return service({
    url: `/friends/${id}/friend-request`,
    method: "post",
  });
}

/**
 * 处理通知（通过 / 拒绝 / 拉黑）
 * POST /notifications/handle
 * Body（JSON）：{ "notificationId": <该条通知ID>, "handleAction": "accept" | "reject" | "block" }
 * 请求头由 axios 拦截器统一附加 Authorization: Bearer <access_token>
 */
export async function handleNotificationApi(
  payload: RequestHandlePayload
): Promise<ApiResponse<RequestHandle>> {
  const body: RequestHandlePayload = {
    rahId: payload.rahId,
    handleAction: payload.handleAction,
    rahFeedback: payload.rahFeedback,
  };
  return service({
    url: "/notifications/handle",
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: body,
  });
}

export const notificationApi = {
  getRecentNotifications,
  getRecentNotificationsBeforeAnchor,
  getNotificationCursor,
  updateNotificationCursor,
  getNotificationUnreadSummary,
  sendFriendRequest,
  handleNotification: handleNotificationApi,
};

export default notificationApi;
