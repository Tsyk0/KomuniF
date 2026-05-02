// File: src/apis/notification/index.ts
import service from "@/apis/service";
import type {
  ApiResponse,
  CreateGroupJoinRequestPayload,
  CreateGroupJoinRequestResult,
  NotificationCursorDTO,
  NotificationInboxDTO,
  NotificationUnreadSummaryDTO,
  SendFriendRequestResult,
  RequestHandlePayload,
} from "@/types/dto/notification";

/**
 * 收件箱：系统通知与待处理请求分块返回
 * GET /notifications/inbox
 */
export async function getNotificationInbox(
  page?: number,
  pageSize?: number
): Promise<ApiResponse<NotificationInboxDTO>> {
  const params: Record<string, number> = {};
  if (page != null && Number.isFinite(page)) {
    params.page = Math.max(1, Math.floor(Number(page)));
  }
  if (pageSize != null && Number.isFinite(pageSize)) {
    params.pageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize))));
  }
  return service({
    url: "/notifications/inbox",
    method: "get",
    params: Object.keys(params).length ? params : undefined,
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
 * 发起入群申请
 * POST /request-handles/{convId}/join-requests
 */
export async function createGroupJoinRequestApi(
  convId: number,
  payload?: CreateGroupJoinRequestPayload
): Promise<ApiResponse<CreateGroupJoinRequestResult>> {
  const id = Math.floor(Number(convId));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("无效的会话 ID");
  }
  return service({
    url: `/request-handles/${id}/join-requests`,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: payload,
  });
}

/**
 * 处理请求（通过/拒绝/忽略/免打扰/拉黑）
 * POST /request-handles/handle
 */
export async function submitRequestHandleApi(
  payload: RequestHandlePayload
): Promise<ApiResponse<RequestHandle>> {
  const body: RequestHandlePayload = {
    rahId: payload.rahId,
    handleAction: payload.handleAction,
    rahFeedback: payload.rahFeedback,
  };
  return service({
    url: "/request-handles/handle",
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: body,
  });
}

export const notificationApi = {
  getNotificationInbox,
  getNotificationCursor,
  updateNotificationCursor,
  getNotificationUnreadSummary,
  createGroupJoinRequest: createGroupJoinRequestApi,
  sendFriendRequest,
  submitRequestHandle: submitRequestHandleApi,
  // 兼容旧调用名，统一走新标准入口
  handleNotification: submitRequestHandleApi,
};

export default notificationApi;
