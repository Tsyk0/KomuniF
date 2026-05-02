<template>
  <div class="sys-notif-container">
    <header class="sys-notif-header">
      <div class="sys-notif-header__left">
        <button
          type="button"
          class="sys-notif-header__back-btn"
          @click="handleBack"
          aria-label="返回"
          title="返回"
        >
          <ArrowLeft :size="22" :stroke-width="2.2" />
        </button>
      </div>
      <div class="sys-notif-header__titles">
        <h2 class="sys-notif-header__title">通知中心</h2>
      </div>
      <div class="sys-notif-header__right">
        <button
          type="button"
          class="sys-notif-header__refresh"
          :disabled="store.loading"
          @click="refresh"
          aria-label="刷新"
          title="刷新"
        >
          <RefreshCcw :size="22" :stroke-width="2.2" />
        </button>
      </div>
    </header>

    <div class="sys-notif-scroll__inner">
      <div class="sys-notif-pagination">
        <div class="sys-notif-segment" role="tablist" aria-label="通知分类">
          <div class="sys-notif-segment__track">
            <div
              class="sys-notif-segment__thumb"
              :class="{
                'sys-notif-segment__thumb--request': activeTab === 'request',
              }"
              aria-hidden="true"
            />
            <button
              type="button"
              role="tab"
              class="sys-notif-segment__tab"
              :class="{ active: activeTab === 'system' }"
              :aria-selected="activeTab === 'system'"
              id="sys-notif-tab-system"
              aria-controls="sys-notif-tab-panel"
              @click="activeTab = 'system'"
            >
              系统通知
            </button>
            <button
              type="button"
              role="tab"
              class="sys-notif-segment__tab"
              :class="{ active: activeTab === 'request' }"
              :aria-selected="activeTab === 'request'"
              id="sys-notif-tab-request"
              aria-controls="sys-notif-tab-panel"
              @click="activeTab = 'request'"
            >
              待处理请求<span v-if="requestItems.length > 0"
                >（{{ requestItems.length }}）</span
              >
            </button>
          </div>
        </div>
      </div>

      <div
        id="sys-notif-tab-panel"
        class="sidebar-list-items sys-notif-tab-panel"
        role="tabpanel"
        :aria-labelledby="
          activeTab === 'system' ? 'sys-notif-tab-system' : 'sys-notif-tab-request'
        "
      >
        <ul v-if="activeTab === 'system'" class="sys-notif-list">
          <li
            v-for="item in systemItems"
            :key="item.notificationId"
            class="sys-notif-list-row"
          >
            <SystemNotificationItem :notification="item.notification" />
          </li>
        </ul>

        <ul v-else class="sys-notif-list">
          <li
            v-for="rah in requestItems"
            :key="rah.id"
            class="sys-notif-list-row"
          >
            <RequestHandleItem
              :rah="rah"
              :current-user-id="currentUserId"
              @action="(action) => onHandleRah(rah.id, action)"
            />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowLeft, RefreshCcw } from "lucide-vue-next";
import { useSystemNotificationsStore } from "@/store/notification/systemNotifications";
import { useUserStore } from "@/store/user/user";
import type { RequestHandleAction } from "@/types/dto/notification";
import SystemNotificationItem from "./SystemNotificationItem.vue";
import RequestHandleItem from "./RequestHandleItem.vue";

const store = useSystemNotificationsStore();
const userStore = useUserStore();
const activeTab = ref<"system" | "request">("system");
const emit = defineEmits<{
  back: [];
}>();

const currentUserId = computed(() => Number(userStore.user?.userId || 0));
const systemItems = computed(() =>
  store.items
    .filter((item) => !!item.notification)
    .map((item) => ({
      notificationId: item.notificationId,
      notification: item.notification!,
    }))
);
const requestItems = computed(() => store.pendingRequestHandleList);

function refresh() {
  void store.initialize();
}

function handleBack() {
  emit("back");
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
