import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { notificationApi } from "@/apis/notification";
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

    async function submitNotificationHandle(
      notificationId: number,
      handleAction: NotificationHandleAction
    ) {
      if (handlingNotificationId.value != null) {
        return;
      }
      handlingNotificationId.value = notificationId;
      try {
        const resp = await notificationApi.handleNotification({
          notificationId,
          handleAction,
        });
        if (resp.code !== 200) {
          toast.error(resp.message || "操作失败");
          return;
        }
        const idx = items.value.findIndex(
          (n) => n.notificationId === notificationId
        );
        if (idx >= 0) {
          const cur = items.value[idx]!;
          items.value[idx] = {
            ...cur,
            notification: { ...cur.notification, isRead: true },
            handle: {
              id: resp.data?.id ?? Date.now(),
              notificationId: cur.notificationId,
              handlerUserId: resp.data?.handlerUserId ?? 0,
              handleAction: resp.data?.handleAction ?? handleAction,
              handleStatus: resp.data?.handleStatus ?? 1,
              handleTime: resp.data?.handleTime ?? new Date().toISOString(),
              failureReason: resp.data?.failureReason ?? null,
              bizPayload: resp.data?.bizPayload ?? null,
              clientRequestId: resp.data?.clientRequestId ?? null,
              createTime: resp.data?.createTime ?? new Date().toISOString(),
              updateTime: resp.data?.updateTime ?? new Date().toISOString(),
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
        const resp = await notificationApi.getRecentNotifications(page, pageSize);
        if (resp.code !== 200) {
          errorMessage.value = resp.message || "加载通知失败";
          toast.error(resp.message || "加载失败，请稍后重试");
          return;
        }
        const list = Array.isArray(resp.data) ? toAscById(resp.data) : [];
        items.value = list;
        currentPage.value = Math.max(1, Math.floor(page));
        lastAnchorId.value = getOldestNotificationId();
        hasMore.value = list.length >= Math.max(1, Math.floor(pageSize));
        lastFetchedAt.value = Date.now();
      } catch (e: unknown) {
        errorMessage.value = "加载失败，请稍后重试";
        toast.error("加载失败，请稍后重试");
      } finally {
        loading.value = false;
      }
    }

    async function fetchOlderByAnchor(pageSize: number = DEFAULT_PAGE_SIZE) {
      if (loading.value || loadingMore.value || !hasMore.value) return;
      const anchorId = lastAnchorId.value ?? getOldestNotificationId();
      if (anchorId == null) {
        hasMore.value = false;
        return;
      }

      loadingMore.value = true;
      try {
        const resp = await notificationApi.getRecentNotificationsBeforeAnchor(
          anchorId,
          pageSize
        );
        if (resp.code !== 200) {
          toast.error(resp.message || "加载失败，请稍后重试");
          return;
        }

        const incoming = Array.isArray(resp.data) ? toAscById(resp.data) : [];
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
      submitNotificationHandle,
      fetchRecent,
      fetchOlderByAnchor,
    };
  }
);
