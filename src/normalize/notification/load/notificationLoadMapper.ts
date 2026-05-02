// src/normalize/notification/load/notificationLoadMapper.ts
import type {
  NotificationRecentItemDTO,
  RequestHandle,
  SystemNotification,
} from "@/types/dto/notification";

/** 列表按 notificationId 升序，保证分页拼接稳定。 */
export function sortNotificationsAsc(
  list: NotificationRecentItemDTO[]
): NotificationRecentItemDTO[] {
  return [...list].sort((a, b) => a.notificationId - b.notificationId);
}

/**
 * 将收件箱 `noti.items` 中单条原始 JSON 转为前端列表行（含嵌套或平铺两种后端形态）。
 * 使用场景：`loadNotificationInboxNormalized` 映射系统通知分页块。
 */
export function mapNotiInboxRowToRecentItem(raw: unknown): NotificationRecentItemDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const nested = o.notification;
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    const nid = Number(o.notificationId ?? n.notificationId);
    if (!Number.isFinite(nid) || nid <= 0) return null;
    const rah = o.rah != null ? mapRahInboxRow(o.rah) : null;
    return {
      notificationId: nid,
      notification: buildSystemNotificationFromRecord(nid, n),
      rah,
    };
  }
  const nid = Number(o.notificationId ?? o.id);
  if (!Number.isFinite(nid) || nid <= 0) return null;
  const rah = o.rah != null ? mapRahInboxRow(o.rah) : null;
  return {
    notificationId: nid,
    notification: buildSystemNotificationFromRecord(nid, o),
    rah,
  };
}

/**
 * 将收件箱 `rah.items` 中单条原始 JSON 转为 `RequestHandle`。
 * 使用场景：`loadNotificationInboxNormalized` 映射待处理/历史请求分页块。
 */
export function mapRahInboxRow(raw: unknown): RequestHandle | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    type: String(o.type || ""),
    status: String(o.status || "pending"),
    requester: Number(o.requester || 0),
    handler: Number(o.handler || 0),
    convId: o.convId == null ? null : Number(o.convId),
    rahTitle: o.rahTitle == null ? null : String(o.rahTitle),
    rahContent: o.rahContent == null ? null : String(o.rahContent),
    rahFeedback: o.rahFeedback == null ? null : String(o.rahFeedback),
    createTime: String(o.createTime || ""),
    handleTime: o.handleTime == null ? null : String(o.handleTime),
  };
}

function buildSystemNotificationFromRecord(
  fallbackId: number,
  src: Record<string, unknown>
): SystemNotification {
  const nid = Number(src.notificationId ?? fallbackId);
  return {
    notificationId: Number.isFinite(nid) && nid > 0 ? nid : fallbackId,
    mode: String(src.mode || "inform"),
    type: String(src.type || ""),
    notificationTitle: src.notificationTitle == null ? null : String(src.notificationTitle),
    notificationContent: src.notificationContent == null ? null : String(src.notificationContent),
    receiverId: Number(src.receiverId || 0),
    relatedUserId: src.relatedUserId == null ? null : Number(src.relatedUserId),
    rahId: src.rahId == null ? null : Number(src.rahId),
    createTime:
      typeof src.createTime === "number"
        ? src.createTime
        : String(src.createTime ?? ""),
  };
}
