// File: src/stores/chat/system-notifications.ts
import { ref, computed } from "vue";
import { defineStore } from "pinia";
import {
  loadRecentNotifications,
  loadRecentNotificationsBeforeAnchor,
  submitNotificationHandleAction,
} from "@/capabilities/notification";
import type {
  NotificationHandleSummaryDTO,
  NotificationHandleAction,
} from "@/types/dto/notification";
import toast from "@/commons/utils/toast";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Setup Store：显式 return actions，避免 Options Store 在部分环境下未挂上方法导致
 * `submitNotificationHandle is not a function`。
 */
export const useSystemNotificationsStore = defineStore(
  "systemNotifications",
  () => {
    const items = ref<NotificationHandleSummaryDTO[]>([]);
    const loading = ref(false);
    const loadingMore = ref(false);
    const hasMore = ref(true);
    const errorMessage = ref("");
    const lastFetchedAt = ref<number | null>(null);
    const handlingNotificationId = ref<number | null>(null);
    const currentPage = ref(1);
    const lastAnchorId = ref<number | null>(null);

    function isNotificationProcessed(n: NotificationHandleSummaryDTO): boolean {
      return n.handle != null;
    }

    const unreadCount = computed(
      () =>
        items.value.filter(
          (n) =>
            n.notification.isRead === false || n.notification.isRead === null
        ).length
    );

    function reset() {
      items.value = [];
      loading.value = false;
      loadingMore.value = false;
      hasMore.value = true;
      errorMessage.value = "";
      lastFetchedAt.value = null;
      handlingNotificationId.value = null;
      currentPage.value = 1;
      lastAnchorId.value = null;
    }

    function getOldestNotificationId(): number | null {
      if (!items.value.length) return null;
      const minId = items.value[0]?.notificationId;
      return Number.isFinite(minId) && minId > 0 ? minId : null;
    }

    function toAscById(list: NotificationHandleSummaryDTO[]): NotificationHandleSummaryDTO[] {
      return [...list].sort((a, b) => a.notificationId - b.notificationId);
    }

    function setNotifications(list: NotificationHandleSummaryDTO[]) {
      items.value = toAscById(Array.isArray(list) ? list : []);
      lastAnchorId.value = getOldestNotificationId();
      currentPage.value = 1;
      hasMore.value = items.value.length >= DEFAULT_PAGE_SIZE;
      lastFetchedAt.value = Date.now();
      errorMessage.value = "";
    }

    async function submitNotificationHandle(
      notificationId: number,
      handleAction: NotificationHandleAction
    ) {
      if (handlingNotificationId.value != null) {
        return;
      }
      handlingNotificationId.value = notificationId;
      try {
        const resp = await submitNotificationHandleAction({
          notificationId,
          handleAction,
        });
        const idx = items.value.findIndex(
          (n) => n.notificationId === notificationId
        );
        if (idx >= 0) {
          const cur = items.value[idx]!;
          items.value[idx] = {
            ...cur,
            notification: { ...cur.notification, isRead: true },
            handle: {
              id: resp.data?.id || Date.now(),
              notificationId: cur.notificationId,
              handlerUserId: resp.data?.handlerUserId || 0,
              handleAction: resp.data?.handleAction || handleAction,
              handleStatus: resp.data?.handleStatus || 1,
              handleTime: resp.data?.handleTime || new Date().toISOString(),
              failureReason: resp.data?.failureReason || null,
              bizPayload: resp.data?.bizPayload || null,
              clientRequestId: resp.data?.clientRequestId || null,
              createTime: resp.data?.createTime || new Date().toISOString(),
              updateTime: resp.data?.updateTime || new Date().toISOString(),
            },
          };
        }
        const msg = (resp.message && resp.message.trim()) || "已记录处理";
        toast.show(msg, "success", 2200);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (e as Error)?.message ||
          "网络异常，请稍后重试";
        toast.error(msg);
      } finally {
        handlingNotificationId.value = null;
      }
    }

    async function fetchRecent(page: number = 1, pageSize: number = DEFAULT_PAGE_SIZE) {
      loading.value = true;
      errorMessage.value = "";
      try {
        const list = await loadRecentNotifications(page, pageSize);
        setNotifications(list);
        currentPage.value = Math.max(1, Math.floor(page));
        hasMore.value = items.value.length >= Math.max(1, Math.floor(pageSize));
      } catch (e: unknown) {
        errorMessage.value = "加载失败，请稍后重试";
        toast.error("加载失败，请稍后重试");
      } finally {
        loading.value = false;
      }
    }

    async function fetchOlderByAnchor(pageSize: number = DEFAULT_PAGE_SIZE) {
      if (loading.value || loadingMore.value || !hasMore.value) return;
      const anchorId = lastAnchorId.value || getOldestNotificationId();
      if (anchorId == null) {
        hasMore.value = false;
        return;
      }

      loadingMore.value = true;
      try {
        const incoming = await loadRecentNotificationsBeforeAnchor(
          anchorId,
          pageSize
        );
        if (!incoming.length) {
          hasMore.value = false;
          return;
        }

        const existing = new Set(items.value.map((n) => n.notificationId));
        const older = incoming.filter((n) => !existing.has(n.notificationId));
        if (!older.length) {
          hasMore.value = false;
          return;
        }
        items.value = [...older, ...items.value];
        lastAnchorId.value = getOldestNotificationId();

        hasMore.value = incoming.length >= Math.max(1, Math.floor(pageSize));
      } catch (e: unknown) {
        toast.error("加载失败，请稍后重试");
      } finally {
        loadingMore.value = false;
      }
    }

    return {
      items,
      loading,
      loadingMore,
      hasMore,
      errorMessage,
      lastFetchedAt,
      handlingNotificationId,
      currentPage,
      lastAnchorId,
      isNotificationProcessed,
      unreadCount,
      reset,
      setNotifications,
      submitNotificationHandle,
      fetchRecent,
      fetchOlderByAnchor,
    };
  }
);
