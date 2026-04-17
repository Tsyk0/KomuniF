// File: src/capabilities/notification/service.ts
import { notificationApi } from "@/apis/notification";
import type {
  NotificationHandleAction,
  NotificationHandleRecord,
  NotificationHandleSummaryDTO,
} from "@/types/dto/notification";

const toAscById = (
  list: NotificationHandleSummaryDTO[]
): NotificationHandleSummaryDTO[] => [...list].sort((a, b) => a.notificationId - b.notificationId);

export async function loadRecentNotifications(
  page?: number,
  pageSize?: number
): Promise<NotificationHandleSummaryDTO[]> {
  const resp = await notificationApi.getRecentNotifications(page, pageSize);
  if (resp.code !== 200) {
    throw new Error(resp.message || "加载通知失败");
  }
  return toAscById(Array.isArray(resp.data) ? resp.data : []);
}

export async function loadRecentNotificationsBeforeAnchor(
  anchorId: number,
  pageSize?: number
): Promise<NotificationHandleSummaryDTO[]> {
  const resp = await notificationApi.getRecentNotificationsBeforeAnchor(anchorId, pageSize);
  if (resp.code !== 200) {
    throw new Error(resp.message || "加载通知失败");
  }
  return toAscById(Array.isArray(resp.data) ? resp.data : []);
}

export async function submitNotificationHandleAction(payload: {
  notificationId: number;
  handleAction: NotificationHandleAction;
}): Promise<{ message: string; data: NotificationHandleRecord | null | undefined }> {
  const resp = await notificationApi.handleNotification(payload);
  if (resp.code !== 200) {
    throw new Error(resp.message || "操作失败");
  }
  return { message: resp.message || "已记录处理", data: resp.data };
}
