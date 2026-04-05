import service from "@/apis/service";
import type {
  ApiResponse,
  SystemNotification,
  SendFriendRequestResult,
  NotificationHandlePayload,
  NotificationHandleRecord,
} from "@/types/dto/notification";

/**
 * 拉取当前用户最近系统通知
 * GET /notifications/recent
 */
export async function getRecentNotifications(
  limit?: number
): Promise<ApiResponse<SystemNotification[]>> {
  const params: Record<string, number> = {};
  if (limit != null && Number.isFinite(limit)) {
    params.limit = Math.min(100, Math.max(1, Math.floor(Number(limit))));
  }
  return service({
    url: "/notifications/recent",
    method: "get",
    params: Object.keys(params).length ? params : undefined,
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
  payload: NotificationHandlePayload
): Promise<ApiResponse<NotificationHandleRecord>> {
  const body: NotificationHandlePayload = {
    notificationId: payload.notificationId,
    handleAction: payload.handleAction,
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
  sendFriendRequest,
  handleNotification: handleNotificationApi,
};

export default notificationApi;
