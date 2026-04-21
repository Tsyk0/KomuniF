// src/normalize/notification/load/notificationLoadMapper.ts
import type {
  NotificationHandleAction,
  NotificationHandleRecord,
  NotificationHandleSummaryDTO,
} from "@/types/dto/notification";

/** 列表按 notificationId 升序，保证分页拼接稳定。 */
export function sortNotificationsAsc(
  list: NotificationHandleSummaryDTO[]
): NotificationHandleSummaryDTO[] {
  return [...list].sort((a, b) => a.notificationId - b.notificationId);
}

/**
 * 将处理动作响应回写到列表项：
 * - 标记通知已读
 * - 合并/兜底 handle 字段
 */
export function mergeNotificationHandleResult(
  list: NotificationHandleSummaryDTO[],
  notificationId: number,
  handleAction: NotificationHandleAction,
  record: NotificationHandleRecord | null | undefined
): NotificationHandleSummaryDTO[] {
  const idx = list.findIndex((item) => item.notificationId === notificationId);
  if (idx < 0) return list;

  const cur = list[idx]!;
  const next = [...list];
  next[idx] = {
    ...cur,
    notification: { ...cur.notification, isRead: true },
    handle: {
      id: record?.id || Date.now(),
      notificationId: cur.notificationId,
      handlerUserId: record?.handlerUserId || 0,
      handleAction: record?.handleAction || handleAction,
      handleStatus: record?.handleStatus || 1,
      handleTime: record?.handleTime || new Date().toISOString(),
      failureReason: record?.failureReason || null,
      bizPayload: record?.bizPayload || null,
      clientRequestId: record?.clientRequestId || null,
      createTime: record?.createTime || new Date().toISOString(),
      updateTime: record?.updateTime || new Date().toISOString(),
    },
  };
  return next;
}
