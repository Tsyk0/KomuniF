import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { notificationApi } from "@/apis/notification";
import type {
  SystemNotification,
  NotificationHandleAction,
} from "@/types/dto/notification";
import toast from "@/commons/utils/toast";

const DEFAULT_LIMIT = 30;

/**
 * Setup Store：显式 return actions，避免 Options Store 在部分环境下未挂上方法导致
 * `submitNotificationHandle is not a function`。
 */
export const useSystemNotificationsStore = defineStore(
  "systemNotifications",
  () => {
    const items = ref<SystemNotification[]>([]);
    const loading = ref(false);
    const errorMessage = ref("");
    const lastFetchedAt = ref<number | null>(null);
    const handlingNotificationId = ref<number | null>(null);

    const unreadCount = computed(
      () => items.value.filter((n) => n.isRead === false).length
    );

    function reset() {
      items.value = [];
      loading.value = false;
      errorMessage.value = "";
      lastFetchedAt.value = null;
      handlingNotificationId.value = null;
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
        items.value = items.value.filter(
          (n) => n.notificationId !== notificationId
        );
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

    async function fetchRecent(limit: number = DEFAULT_LIMIT) {
      loading.value = true;
      errorMessage.value = "";
      try {
        const resp = await notificationApi.getRecentNotifications(limit);
        if (resp.code !== 200) {
          errorMessage.value = resp.message || "加载通知失败";
          if (resp.code === 401) {
            errorMessage.value = "登录已失效，请重新登录";
          }
          return;
        }
        items.value = Array.isArray(resp.data) ? resp.data : [];
        lastFetchedAt.value = Date.now();
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (e as Error)?.message ||
          "网络异常，请稍后重试";
        errorMessage.value = msg;
      } finally {
        loading.value = false;
      }
    }

    return {
      items,
      loading,
      errorMessage,
      lastFetchedAt,
      handlingNotificationId,
      unreadCount,
      reset,
      submitNotificationHandle,
      fetchRecent,
    };
  }
);
