// File: src/domain/stores/notification/system-notification.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { NotificationHandleSummaryDTO } from "@/types/dto/notification";

/**
 * 重构后的系统通知 Domain Store 骨架。
 * 具体实现将从 src/stores/chat/system-notifications.ts 迁移。
 * 文件编码：UTF-8。
 */
export const useSystemNotificationDomainStore = defineStore(
  "domainSystemNotification",
  () => {
    const items = ref<NotificationHandleSummaryDTO[]>([]);
    const loading = ref(false);
    const loadingMore = ref(false);
    const hasMore = ref(true);

    const unreadCount = computed(
      () =>
        items.value.filter(
          (n) => n.notification.isRead === false || n.notification.isRead === null
        ).length
    );

    async function fetchRecent() {
      throw new Error(
        "TODO: migrate from src/stores/chat/system-notifications.ts -> fetchRecent"
      );
    }

    async function fetchOlderByAnchor() {
      throw new Error(
        "TODO: migrate from src/stores/chat/system-notifications.ts -> fetchOlderByAnchor"
      );
    }

    function reset() {
      items.value = [];
      loading.value = false;
      loadingMore.value = false;
      hasMore.value = true;
    }

    return {
      items,
      loading,
      loadingMore,
      hasMore,
      unreadCount,
      fetchRecent,
      fetchOlderByAnchor,
      reset,
    };
  }
);
