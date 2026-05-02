// src/normalize/notification/load/notificationLoadService.ts
import { notificationApi } from "@/apis/notification";
import type {
  NotificationCursorDTO,
  NotificationInboxDTO,
  NotificationRecentItemDTO,
  NotificationUnreadSummaryDTO,
  RequestHandle,
  RequestHandleAction,
} from "@/types/dto/notification";
import {
  mapNotiInboxRowToRecentItem,
  mapRahInboxRow,
  sortNotificationsAsc,
} from "./notificationLoadMapper";

/** 收件箱一页拉取后的归一化结果，供 store 合并系统通知与 RAH 两路数据。 */
export interface NotificationInboxNormalized {
  systemRows: NotificationRecentItemDTO[];
  requestHandles: RequestHandle[];
  /** 本页 noti.items 条数；用于与 pageSize 比较判断是否还有下一页 */
  notiItemCount: number;
  /** 本页 rah.items 条数 */
  rahItemCount: number;
  /** 后端 noti 块声明的分页大小 */
  notiPageSize: number;
  /** 后端 rah 块声明的分页大小 */
  rahPageSize: number;
}

/**
 * 拉取通知收件箱（系统通知 + 待处理请求分块），并映射为前端 DTO。
 * 使用场景：通知中心首屏、刷新、按页加载更多（替代原 `/notifications/recent`）。
 */
export async function loadNotificationInboxNormalized(
  page?: number,
  pageSize?: number
): Promise<NotificationInboxNormalized> {
  const resp = await notificationApi.getNotificationInbox(page, pageSize);
  if (resp.code !== 200) {
    throw new Error(resp.message || "加载通知失败");
  }
  const data = (resp.data || {}) as NotificationInboxDTO;
  const notiItems = Array.isArray(data.noti?.items) ? data.noti.items : [];
  const rahItems = Array.isArray(data.rah?.items) ? data.rah.items : [];
  const notiPageSize = Math.max(
    1,
    Math.floor(Number(data.noti?.pageSize ?? pageSize ?? 10))
  );
  const rahPageSize = Math.max(
    1,
    Math.floor(Number(data.rah?.pageSize ?? pageSize ?? 10))
  );
  const systemRows = sortNotificationsAsc(
    notiItems
      .map(mapNotiInboxRowToRecentItem)
      .filter((row): row is NotificationRecentItemDTO => row != null)
  );
  const requestHandles = rahItems
    .map(mapRahInboxRow)
    .filter((row): row is RequestHandle => row != null);
  return {
    systemRows,
    requestHandles,
    notiItemCount: notiItems.length,
    rahItemCount: rahItems.length,
    notiPageSize,
    rahPageSize,
  };
}

/** 提交通知处理动作（通过/拒绝/拉黑）。 */
export async function submitNotificationHandleActionNormalized(payload: {
  rahId: number;
  handleAction: RequestHandleAction;
  rahFeedback?: string;
}): Promise<{ message: string; data: RequestHandle | null | undefined }> {
  const resp = await notificationApi.submitRequestHandle(payload);
  if (resp.code !== 200) {
    throw new Error(resp.message || "操作失败");
  }
  return { message: resp.message || "已记录处理", data: resp.data };
}

export async function loadNotificationCursorNormalized(): Promise<NotificationCursorDTO> {
  const resp = await notificationApi.getNotificationCursor();
  if (resp.code !== 200) {
    throw new Error(resp.message || "加载通知游标失败");
  }
  return {
    notificationLastReadId: Number(resp.data?.notificationLastReadId || 0),
  };
}

export async function loadNotificationUnreadSummaryNormalized(): Promise<NotificationUnreadSummaryDTO> {
  const resp = await notificationApi.getNotificationUnreadSummary();
  if (resp.code !== 200) {
    throw new Error(resp.message || "加载未读摘要失败");
  }
  return {
    notificationUnread: Number(resp.data?.notificationUnread || 0),
  };
}

export async function advanceNotificationCursorNormalized(payload: {
  notificationLastReadId?: number;
}): Promise<void> {
  const resp = await notificationApi.updateNotificationCursor(payload);
  if (resp.code !== 200) {
    throw new Error(resp.message || "推进通知游标失败");
  }
}
