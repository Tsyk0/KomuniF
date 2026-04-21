// src/store/notification/systemNotifications.ts
import { ref, computed } from "vue";
import { defineStore } from "pinia";
import {
  loadRecentNotificationsNormalized,
  loadRecentNotificationsBeforeAnchorNormalized,
  submitNotificationHandleActionNormalized,
  mergeNotificationHandleResult,
} from "@/normalize/notification";
import type {
  NotificationHandleSummaryDTO,
  NotificationHandleAction,
} from "@/types/dto/notification";
import toast from "@/commons/utils/toast";

const DEFAULT_PAGE_SIZE = 10;

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

    /** 是否已处理（存在 handle 记录）。 */
    function isNotificationProcessed(n: NotificationHandleSummaryDTO): boolean {
      return n.handle != null;
    }

    /** 未读数量（null 与 false 都视为未读）。 */
    const unreadCount = computed(
      () =>
        items.value.filter(
          (n) =>
            n.notification.isRead === false || n.notification.isRead === null
        ).length
    );

    /** 重置通知状态（登出/切换账号场景）。 */
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

    /** 计算最老通知 ID（分页锚点）。 */
    function getOldestNotificationId(): number | null {
      if (!items.value.length) return null;
      const minId = items.value[0]?.notificationId;
      return Number.isFinite(minId) && minId > 0 ? minId : null;
    }

    /** 覆盖当前通知列表并更新分页元数据。 */
    function setNotifications(list: NotificationHandleSummaryDTO[]) {
      items.value = Array.isArray(list) ? list : [];
      lastAnchorId.value = getOldestNotificationId();
      currentPage.value = 1;
      hasMore.value = items.value.length >= DEFAULT_PAGE_SIZE;
      lastFetchedAt.value = Date.now();
      errorMessage.value = "";
    }

    /** 提交通知处理动作并回写本地列表。 */
    async function submitNotificationHandle(
      notificationId: number,
      handleAction: NotificationHandleAction
    ) {
      if (handlingNotificationId.value != null) return;
      handlingNotificationId.value = notificationId;
      try {
        const resp = await submitNotificationHandleActionNormalized({
          notificationId,
          handleAction,
        });
        items.value = mergeNotificationHandleResult(
          items.value,
          notificationId,
          handleAction,
          resp.data
        );
        const msg = (resp.message && resp.message.trim()) || "已记录处理";
        toast.show(msg, "success", 2200);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ||
          (e as Error)?.message ||
          "网络异常，请稍后重试";
        toast.error(msg);
      } finally {
        handlingNotificationId.value = null;
      }
    }

    /** 拉取最近通知。 */
    async function fetchRecent(
      page: number = 1,
      pageSize: number = DEFAULT_PAGE_SIZE
    ) {
      loading.value = true;
      errorMessage.value = "";
      try {
        const list = await loadRecentNotificationsNormalized(page, pageSize);
        setNotifications(list);
        currentPage.value = Math.max(1, Math.floor(page));
        hasMore.value = items.value.length >= Math.max(1, Math.floor(pageSize));
      } catch {
        errorMessage.value = "加载失败，请稍后重试";
        toast.error("加载失败，请稍后重试");
      } finally {
        loading.value = false;
      }
    }

    /** 以最老通知为锚点加载更多历史。 */
    async function fetchOlderByAnchor(pageSize: number = DEFAULT_PAGE_SIZE) {
      if (loading.value || loadingMore.value || !hasMore.value) return;
      const anchorId = lastAnchorId.value || getOldestNotificationId();
      if (anchorId == null) {
        hasMore.value = false;
        return;
      }

      loadingMore.value = true;
      try {
        const incoming = await loadRecentNotificationsBeforeAnchorNormalized(
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
      } catch {
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
