<template>
  <div class="sys-notif-container">
    <header class="sys-notif-header">
      <div class="sys-notif-header__titles">
        <h2 class="sys-notif-header__title">通知中心</h2>
      </div>
      <button type="button" class="sys-notif-header__refresh" :disabled="store.loading" @click="refresh">
        {{ store.loading ? "加载中…" : "刷新" }}
      </button>
    </header>

    <div class="sys-notif-scroll__inner">
      <div class="sys-notif-pagination">
        <button type="button" class="sys-notif-load-more" :class="{ active: activeTab === 'system' }" @click="activeTab = 'system'">系统通知</button>
        <button type="button" class="sys-notif-load-more" :class="{ active: activeTab === 'request' }" @click="activeTab = 'request'">待处理请求</button>
      </div>

      <ul v-if="activeTab === 'system'" class="sys-notif-list">
        <li v-for="item in systemItems" :key="item.notificationId" class="sys-notif-list-row">
          <SystemNotificationItem :notification="item.notification" />
        </li>
      </ul>

      <ul v-else class="sys-notif-list">
        <li v-for="rah in requestItems" :key="rah.id" class="sys-notif-list-row">
          <RequestHandleItem
            :rah="rah"
            :current-user-id="currentUserId"
            @action="(action) => onHandleRah(rah.id, action)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useSystemNotificationsStore } from "@/store/notification/systemNotifications";
import { useUserStore } from "@/store/user/user";
import type { RequestHandleAction } from "@/types/dto/notification";
import SystemNotificationItem from "./SystemNotificationItem.vue";
import RequestHandleItem from "./RequestHandleItem.vue";

const store = useSystemNotificationsStore();
const userStore = useUserStore();
const activeTab = ref<"system" | "request">("system");

const currentUserId = computed(() => Number(userStore.user?.userId || 0));
const systemItems = computed(() =>
  store.items
    .filter((item) => !!item.notification)
    .map((item) => ({ notificationId: item.notificationId, notification: item.notification! }))
);
const requestItems = computed(() => store.pendingRequestHandleList);

function refresh() {
  void store.initialize();
}

async function onHandleRah(rahId: number, action: RequestHandleAction) {
  await store.submitRequestHandle(rahId, action);
  await store.fetchRecent();
}
</script>

<style scoped>
@import "@/assets/styles/system-notification-container.css";
@import "@/assets/styles/night/system-notification-container-night.css";
</style>
