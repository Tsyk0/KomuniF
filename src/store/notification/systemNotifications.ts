import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  advanceNotificationCursorNormalized,
  loadNotificationCursorNormalized,
  loadNotificationInboxNormalized,
  loadNotificationUnreadSummaryNormalized,
  submitNotificationHandleActionNormalized,
} from "@/normalize/notification";
import { realtimeEventBus } from "@/realtime/websocket";
import type {
  NotificationCursorDTO,
  NotificationRecentItemDTO,
  NotificationUnreadSummaryDTO,
  RequestHandle,
  RequestHandleAction,
  SystemNotification,
} from "@/types/dto/notification";
import toast from "@/commons/utils/toast";

const DEFAULT_PAGE_SIZE = 10;

export const useSystemNotificationsStore = defineStore("systemNotifications", () => {
  const itemsMap = ref<Map<number, NotificationRecentItemDTO>>(new Map());
  const requestHandlesMap = ref<Map<number, RequestHandle>>(new Map());
  const loading = ref(false);
  const loadingMore = ref(false);
  const hasMore = ref(true);
  const errorMessage = ref("");
  const handlingNotificationId = ref<number | null>(null);
  const lastAnchorId = ref<number | null>(null);
  /** 已成功拉取的收件箱页码；用于 `fetchOlderByAnchor` 请求下一页；由 `systemNotifications` 的 fetch 流程维护 */
  const lastInboxPage = ref(0);
  const cursor = ref<NotificationCursorDTO>({ notificationLastReadId: 0 });
  const unreadSummary = ref<NotificationUnreadSummaryDTO>({ notificationUnread: 0 });
  const hasBoundRealtime = ref(false);
  const recentRealtimeEventKeys = ref<Set<string>>(new Set());

  const items = computed<NotificationRecentItemDTO[]>(() =>
    [...itemsMap.value.values()].sort((a, b) => a.notificationId - b.notificationId)
  );
  const pendingRequestHandleList = computed<RequestHandle[]>(() =>
    [...requestHandlesMap.value.values()]
      .filter((rah) => (rah.status || "").toLowerCase() === "pending")
      .sort((a, b) => b.id - a.id)
  );
  const unreadCount = computed(() => unreadSummary.value.notificationUnread);

  function reset() {
    itemsMap.value = new Map();
    requestHandlesMap.value = new Map();
    loading.value = false;
    loadingMore.value = false;
    hasMore.value = true;
    errorMessage.value = "";
    handlingNotificationId.value = null;
    lastAnchorId.value = null;
    lastInboxPage.value = 0;
    cursor.value = { notificationLastReadId: 0 };
    unreadSummary.value = { notificationUnread: 0 };
  }

  function getOldestNotificationId(): number | null {
    if (!items.value.length) return null;
    const id = Number(items.value[0]?.notificationId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  /**
   * 合并一页收件箱中的系统通知行与 RAH 列表到本地 Map（支持追加翻页）。
   * 使用场景：inbox 接口返回后、或仅合并带嵌套 `rah` 的 `NotificationRecentItemDTO[]`（`setNotifications`）。
   */
  function applyInboxPage(
    systemRows: NotificationRecentItemDTO[],
    rahList: RequestHandle[]
  ) {
    const mergedItems = new Map<number, NotificationRecentItemDTO>(itemsMap.value);
    const mergedRah = new Map<number, RequestHandle>(requestHandlesMap.value);
    for (const row of Array.isArray(systemRows) ? systemRows : []) {
      const id = Number(row?.notificationId);
      if (!Number.isFinite(id) || id <= 0) continue;
      const cur = mergedItems.get(id);
      const next: NotificationRecentItemDTO = {
        notificationId: id,
        notification: row.notification || cur?.notification,
        rah: row.rah ?? cur?.rah ?? null,
      };
      mergedItems.set(id, next);
      if (next.rah) mergedRah.set(next.rah.id, next.rah);
    }
    for (const rah of Array.isArray(rahList) ? rahList : []) {
      const rid = Number(rah?.id);
      if (!Number.isFinite(rid) || rid <= 0) continue;
      mergedRah.set(rid, rah);
      for (const [k, v] of mergedItems.entries()) {
        if (v.notification?.rahId === rid || v.rah?.id === rid) {
          mergedItems.set(k, { ...v, rah });
        }
      }
    }
    itemsMap.value = mergedItems;
    requestHandlesMap.value = mergedRah;
    lastAnchorId.value = getOldestNotificationId();
  }

  function setNotifications(list: NotificationRecentItemDTO[]) {
    applyInboxPage(list, []);
  }

  function upsertSystemNotification(notification: SystemNotification): void {
    const id = Number(notification.notificationId);
    if (!Number.isFinite(id) || id <= 0) return;
    const current = itemsMap.value.get(id);
    const next = new Map(itemsMap.value);
    next.set(id, {
      notificationId: id,
      notification,
      rah: current?.rah ?? null,
    });
    itemsMap.value = next;
  }

  function upsertRequestHandle(rah: RequestHandle): void {
    const id = Number(rah.id);
    if (!Number.isFinite(id) || id <= 0) return;
    const nextRah = new Map(requestHandlesMap.value);
    nextRah.set(id, rah);
    requestHandlesMap.value = nextRah;
    const nextItems = new Map(itemsMap.value);
    for (const [k, v] of nextItems.entries()) {
      if (v.notification?.rahId === id || v.rah?.id === id) {
        nextItems.set(k, { ...v, rah });
      }
    }
    itemsMap.value = nextItems;
  }

  /**
   * 拉取收件箱第 1 页并替换本地缓存（刷新 / 首屏）。
   * 使用场景：`initialize`、处理完 RAH 后刷新；更多历史走 `fetchOlderByAnchor`。
   */
  async function fetchRecent(_page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    loading.value = true;
    errorMessage.value = "";
    try {
      itemsMap.value = new Map();
      requestHandlesMap.value = new Map();
      lastInboxPage.value = 0;
      const inbox = await loadNotificationInboxNormalized(1, pageSize);
      lastInboxPage.value = 1;
      applyInboxPage(inbox.systemRows, inbox.requestHandles);
      hasMore.value =
        inbox.notiItemCount >= inbox.notiPageSize ||
        inbox.rahItemCount >= inbox.rahPageSize;
    } catch {
      errorMessage.value = "加载通知失败";
      toast.error(errorMessage.value);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载收件箱下一页（与旧「按锚点翻更早」语义对齐：仍用 store 暴露的同名方法）。
   * 使用场景：通知列表触底加载更多；后端已改为按 `page` 分页的 inbox。
   */
  async function fetchOlderByAnchor(pageSize = DEFAULT_PAGE_SIZE) {
    if (loading.value || loadingMore.value || !hasMore.value) return;
    if (lastInboxPage.value < 1) return;
    loadingMore.value = true;
    try {
      const nextPage = lastInboxPage.value + 1;
      const inbox = await loadNotificationInboxNormalized(nextPage, pageSize);
      lastInboxPage.value = nextPage;
      applyInboxPage(inbox.systemRows, inbox.requestHandles);
      hasMore.value =
        inbox.notiItemCount >= inbox.notiPageSize ||
        inbox.rahItemCount >= inbox.rahPageSize;
    } catch {
      toast.error("加载更多通知失败");
    } finally {
      loadingMore.value = false;
    }
  }

  async function submitRequestHandle(rahId: number, handleAction: RequestHandleAction, rahFeedback?: string) {
    if (handlingNotificationId.value != null) return;
    handlingNotificationId.value = rahId;
    try {
      const resp = await submitNotificationHandleActionNormalized({ rahId, handleAction, rahFeedback });
      if (resp.data) upsertRequestHandle(resp.data);
      toast.show(resp.message || "已处理", "success", 2000);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "操作失败");
    } finally {
      handlingNotificationId.value = null;
    }
  }

  async function fetchCursor() {
    try {
      cursor.value = await loadNotificationCursorNormalized();
    } catch {
      cursor.value = { notificationLastReadId: 0 };
    }
  }

  async function fetchUnreadSummary() {
    try {
      unreadSummary.value = await loadNotificationUnreadSummaryNormalized();
    } catch {
      unreadSummary.value = { notificationUnread: 0 };
    }
  }

  async function initialize() {
    await Promise.all([fetchRecent(), fetchCursor(), fetchUnreadSummary()]);
  }

  async function advanceCursorToLocalMaxAndSyncUnread() {
    const maxId = items.value.reduce((m, item) => Math.max(m, Number(item.notificationId || 0)), 0);
    const nextId = Math.max(Number(cursor.value.notificationLastReadId || 0), maxId);
    await advanceNotificationCursorNormalized({ notificationLastReadId: nextId });
    cursor.value = { notificationLastReadId: nextId };
    await fetchUnreadSummary();
  }

  function bindRealtimeListeners(): void {
    if (hasBoundRealtime.value) return;
    hasBoundRealtime.value = true;

    const consumeOnce = (key: string): boolean => {
      if (recentRealtimeEventKeys.value.has(key)) return false;
      const next = new Set(recentRealtimeEventKeys.value);
      next.add(key);
      recentRealtimeEventKeys.value = next;
      window.setTimeout(() => {
        const cleanup = new Set(recentRealtimeEventKeys.value);
        cleanup.delete(key);
        recentRealtimeEventKeys.value = cleanup;
      }, 2000);
      return true;
    };

    const onSystem = (payload: unknown) => {
      const p = payload as Record<string, any>;
      const body = ((p.data as Record<string, any>) || p) as Record<string, any>;
      const id = Number(body.notificationId ?? body.id);
      if (!Number.isFinite(id) || id <= 0) return;
      const key = `sys:${id}:${String(body.createTime ?? "")}`;
      if (!consumeOnce(key)) return;
      upsertSystemNotification({
        notificationId: id,
        mode: String(body.mode || "inform"),
        type: String(body.type || body.notificationType || ""),
        notificationTitle: body.notificationTitle ?? null,
        notificationContent: body.notificationContent ?? null,
        receiverId: Number(body.receiverId || 0),
        relatedUserId: body.relatedUserId == null ? null : Number(body.relatedUserId),
        rahId: body.rahId == null ? null : Number(body.rahId),
        createTime: body.createTime ?? Date.now(),
      });
      unreadSummary.value.notificationUnread += 1;
      console.info("[WS-NOTIF-RT][STORE][MERGED]", "newSystemNotification", { notificationId: id });
    };

    const onRequest = (payload: unknown) => {
      const p = payload as Record<string, any>;
      const body = ((p.data as Record<string, any>) || p) as Record<string, any>;
      const id = Number(body.id ?? body.rahId);
      if (!Number.isFinite(id) || id <= 0) return;
      const key = `rah:${id}:${String(body.createTime ?? body.handleTime ?? "")}`;
      if (!consumeOnce(key)) return;
      upsertRequestHandle({
        id,
        type: String(body.type || ""),
        status: String(body.status || "pending"),
        requester: Number(body.requester || 0),
        handler: Number(body.handler || body.receiverUserId || 0),
        rahTitle: body.rahTitle ?? null,
        rahContent: body.rahContent ?? null,
        rahFeedback: body.rahFeedback ?? null,
        createTime: String(body.createTime || new Date().toISOString()),
        handleTime: body.handleTime == null ? null : String(body.handleTime),
      });
      console.info("[WS-NOTIF-RT][STORE][MERGED]", "newRequestHandle", { rahId: id });
    };

    realtimeEventBus.on("newSystemNotification", onSystem);
    realtimeEventBus.on("newRequestHandle", onRequest);
    window.addEventListener("websocket:newSystemNotification", (event) => onSystem((event as CustomEvent).detail));
    window.addEventListener("websocket:newRequestHandle", (event) => onRequest((event as CustomEvent).detail));
  }

  bindRealtimeListeners();

  return {
    items,
    pendingRequestHandleList,
    loading,
    loadingMore,
    hasMore,
    errorMessage,
    handlingNotificationId,
    cursor,
    unreadSummary,
    unreadCount,
    reset,
    setNotifications,
    fetchRecent,
    fetchOlderByAnchor,
    submitRequestHandle,
    fetchCursor,
    fetchUnreadSummary,
    initialize,
    advanceCursorToLocalMaxAndSyncUnread,
  };
});
