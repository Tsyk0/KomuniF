<!-- File: src/components/SystemNotificationContainer.vue -->
<template>
  <div class="sys-notif-container">
    <header class="sys-notif-header">
      <div class="sys-notif-header__titles">
        <h2 class="sys-notif-header__title">系统通知</h2>
        <p class="sys-notif-header__subtitle">好友申请与系统消息会显示在这里</p>
      </div>
      <button
        type="button"
        class="sys-notif-header__refresh"
        :disabled="store.loading"
        @click="refresh"
      >
        {{ store.loading ? "加载中…" : "刷新" }}
      </button>
    </header>

    <div class="sys-notif-scroll">
      <div class="sys-notif-scroll__inner">
        <div
          v-if="store.loading && store.items.length === 0"
          class="sys-notif-state"
        >
          <div class="sys-notif-spinner" aria-hidden="true" />
          <p class="sys-notif-state__title">正在加载通知</p>
        </div>

        <div
          v-else-if="store.errorMessage"
          class="sys-notif-state sys-notif-state--error"
        >
          <div class="sys-notif-state__icon" aria-hidden="true">⚠️</div>
          <p class="sys-notif-state__title">加载失败</p>
          <p>{{ store.errorMessage }}</p>
          <button type="button" class="sys-notif-retry" @click="refresh">
            重试
          </button>
        </div>

        <div
          v-else-if="store.items.length === 0"
          class="sys-notif-state sys-notif-state--empty"
        >
          <div class="sys-notif-state__icon" aria-hidden="true">🔔</div>
          <p class="sys-notif-state__title">暂无系统通知</p>
          <p class="sys-notif-state__hint">
            收到好友申请或系统消息时，将在此处显示
          </p>
        </div>

        <div v-else-if="store.items.length > 0" class="sys-notif-pagination">
          <button
            v-if="store.hasMore"
            type="button"
            class="sys-notif-load-more"
            :disabled="store.loadingMore"
            @click="loadMore"
          >
            {{ store.loadingMore ? "加载中…" : "加载更多" }}
          </button>
          <p v-else class="sys-notif-pagination__end">没有更多通知了</p>
        </div>

        <ul
          v-if="displayItems.length > 0"
          class="sys-notif-list"
          aria-label="系统通知列表"
        >
          <li
            v-for="n in displayItems"
            :key="n.notificationId"
            class="sys-notif-list-row"
          >
            <div
              class="sys-notif-list-row__card"
              :class="{
                'sys-notif-list-row__card--activatable': rowCanToggleActions(n),
              }"
              role="presentation"
              @click="onItemCardClick(n)"
            >
              <SystemNotificationItem
                :notification="n.notification"
                :handle="n.handle"
                :related-label="
                  resolveRelatedLabel(n.notification.relatedUserId)
                "
                :accent-variant="rowAccentVariant(n)"
                :show-unread-meta="rowShowUnreadMeta(n)"
              />
            </div>
            <div
              v-if="rowShowsActionButtons(n)"
              class="sys-notif-external-actions"
              :class="{
                'sys-notif-external-actions--open':
                  openedActionId === n.notificationId,
              }"
              role="group"
              aria-label="通知处理"
              @click.stop
            >
              <button
                type="button"
                class="sys-notif-action-btn sys-notif-action-btn--accept"
                :disabled="isHandling(n.notificationId)"
                @click.stop="onHandle(n.notificationId, 'accept')"
              >
                通过
              </button>
              <button
                type="button"
                class="sys-notif-action-btn sys-notif-action-btn--reject"
                :disabled="isHandling(n.notificationId)"
                @click.stop="onHandle(n.notificationId, 'reject')"
              >
                拒绝
              </button>
              <button
                type="button"
                class="sys-notif-action-btn sys-notif-action-btn--block"
                :disabled="isHandling(n.notificationId)"
                @click.stop="onHandle(n.notificationId, 'block')"
              >
                拉黑
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useSystemNotificationsStore } from "@/store/notification/systemNotifications";
import { useFriendStore } from "@/store/friend/showFriend";
import { useUserStore } from "@/store/user/user";
import { useAppBootstrapStore } from "@/store/app/bootstrap";
import SystemNotificationItem from "./SystemNotificationItem.vue";
import {
  type NotificationHandleSummaryDTO,
  type NotificationHandleAction,
} from "@/types/dto/notification";
import {
  canToggleNotificationActions,
  handleNotificationActionFlow,
  resolveNotificationOpenedActionId,
  resolveNotificationRelatedLabel,
  resolveNotificationAccentVariant,
  shouldShowNotificationActionButtons,
  shouldShowNotificationUnreadMeta,
} from "@/interactions/systemNotification/SystemNotificationContainerInteraction";

const store = useSystemNotificationsStore();
const friendStore = useFriendStore();
const authStore = useUserStore();
const appBootstrapStore = useAppBootstrapStore();

/** 点击某条 item 后才展开右侧按钮；再次点击同一条收起 */
const openedActionId = ref<number | null>(null);

const PAGE_SIZE = 10;
const displayItems = computed(() =>
  [...store.items].sort((a, b) => a.notificationId - b.notificationId)
);

function resolveRelatedLabel(relatedUserId: number | null | undefined) {
  return resolveNotificationRelatedLabel(relatedUserId, friendStore.friends);
}

function refresh() {
  openedActionId.value = null;
  void appBootstrapStore.loadOne(
    "notifications",
    Number(authStore.user?.userId == null ? 0 : authStore.user.userId)
  );
}

function loadMore() {
  void store.fetchOlderByAnchor(PAGE_SIZE);
}

function rowCanToggleActions(n: NotificationHandleSummaryDTO) {
  return canToggleNotificationActions(n, (item) => store.isNotificationProcessed(item));
}

function rowShowsActionButtons(n: NotificationHandleSummaryDTO) {
  return shouldShowNotificationActionButtons(
    n,
    (item) => store.isNotificationProcessed(item)
  );
}

/** 竖条颜色：pending(灰) / accept(绿) / reject(红) / dismiss(黑) */
function rowAccentVariant(n: NotificationHandleSummaryDTO) {
  return resolveNotificationAccentVariant(n);
}

/** 未读角标：同上，与 isRead===false 对齐（含 null 视为未读） */
function rowShowUnreadMeta(n: NotificationHandleSummaryDTO) {
  return shouldShowNotificationUnreadMeta(
    n,
    (item) => store.isNotificationProcessed(item)
  );
}

function onItemCardClick(n: NotificationHandleSummaryDTO) {
  openedActionId.value = resolveNotificationOpenedActionId({
    item: n,
    currentOpenedActionId: openedActionId.value,
    canToggle: rowCanToggleActions(n),
  });
}

function isHandling(notificationId: number) {
  return store.handlingNotificationId === notificationId;
}

async function onHandle(
  notificationId: number,
  handleAction: NotificationHandleAction
) {
  const result = await handleNotificationActionFlow({
    notificationId,
    handleAction,
    submitHandle: (id, action) => store.submitNotificationHandle(id, action as NotificationHandleAction),
  });
  if (result.shouldCloseActions) {
    openedActionId.value = null;
  }
}
</script>

<style scoped>
@import "@/assets/styles/system-notification-container.css";
@import "@/assets/styles/night/system-notification-container-night.css";
</style>
