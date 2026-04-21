// src/normalize/notification/load/notificationLoadService.ts
import { notificationApi } from "@/apis/notification";
import type {
  NotificationHandleAction,
  NotificationHandleRecord,
  NotificationHandleSummaryDTO,
} from "@/types/dto/notification";
import { sortNotificationsAsc } from "./notificationLoadMapper";

/** 拉取最近通知并标准化排序。 */
export async function loadRecentNotificationsNormalized(
  page?: number,
  pageSize?: number
): Promise<NotificationHandleSummaryDTO[]> {
  const resp = await notificationApi.getRecentNotifications(page, pageSize);
  if (resp.code !== 200) {
    throw new Error(resp.message || "加载通知失败");
  }
  return sortNotificationsAsc(Array.isArray(resp.data) ? resp.data : []);
}

/** 以锚点拉取更早通知并标准化排序。 */
export async function loadRecentNotificationsBeforeAnchorNormalized(
  anchorId: number,
  pageSize?: number
): Promise<NotificationHandleSummaryDTO[]> {
  const resp = await notificationApi.getRecentNotificationsBeforeAnchor(anchorId, pageSize);
  if (resp.code !== 200) {
    throw new Error(resp.message || "加载通知失败");
  }
  return sortNotificationsAsc(Array.isArray(resp.data) ? resp.data : []);
}

/** 提交通知处理动作（通过/拒绝/拉黑）。 */
export async function submitNotificationHandleActionNormalized(payload: {
  notificationId: number;
  handleAction: NotificationHandleAction;
}): Promise<{ message: string; data: NotificationHandleRecord | null | undefined }> {
  const resp = await notificationApi.handleNotification(payload);
  if (resp.code !== 200) {
    throw new Error(resp.message || "操作失败");
  }
  return { message: resp.message || "已记录处理", data: resp.data };
}
