<!-- File: src/components/SystemNotificationItem.vue -->
<template>
  <article
    class="sys-notif-item"
    :class="{
      'sys-notif-item--unread': showUnreadMeta,
      'sys-notif-item--accent-accept': accentVariant === 'accept',
      'sys-notif-item--accent-reject': accentVariant === 'reject',
      'sys-notif-item--accent-dismiss': accentVariant === 'dismiss',
    }"
  >
    <div class="sys-notif-item__accent" aria-hidden="true" />
    <div class="sys-notif-item__inner">
      <div class="sys-notif-item__meta">
        <span class="sys-notif-item__badge">{{ typeBadge }}</span>
        <span v-if="showUnreadMeta" class="sys-notif-item__unread-tag">未读</span>
      </div>
      <div class="sys-notif-item__title-row">
        <span class="sys-notif-item__title">{{ titleText }}</span>
      </div>
      <p v-if="bodyText" class="sys-notif-item__body">{{ bodyText }}</p>
      <p class="sys-notif-item__status" :class="{ 'is-processed': isProcessed }">
        {{ statusText }}
      </p>
      <p class="sys-notif-item__time">{{ notification.createTime }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { NotificationHandle, SystemNotification } from "@/types/dto/notification";
import {
  notificationTypeBadgeLabel,
  notificationDefaultTitle,
} from "@/types/dto/notification";

const props = defineProps<{
  notification: SystemNotification;
  handle?: NotificationHandle | null;
  relatedLabel?: string | null;
  /** 左侧竖条：pending(灰) / accept(绿) / reject(红) / dismiss(黑) */
  accentVariant?: "pending" | "accept" | "reject" | "dismiss";
  /** 「未读」角标与徽章高亮 */
  showUnreadMeta: boolean;
}>();

const isProcessed = computed(() => props.handle != null);

const typeBadge = computed(() =>
  notificationTypeBadgeLabel(props.notification.notificationType)
);

const titleText = computed(() => {
  const n = props.notification;
  if (n.notificationTitle?.trim()) return n.notificationTitle.trim();
  return notificationDefaultTitle(n.notificationType);
});

const bodyText = computed(() => {
  const n = props.notification;
  if (n.notificationContent?.trim()) return n.notificationContent.trim();
  const t = n.notificationType;
  if (
    (t === "friend_add_request" || t === "friend_request") &&
    n.relatedUserId != null
  ) {
    const who = props.relatedLabel?.trim() || `用户 ${n.relatedUserId}`;
    return `${who} 申请添加您为好友`;
  }
  return "";
});

const actionLabelMap: Record<string, string> = {
  accept: "已通过",
  reject: "已拒绝",
  block: "已拉黑",
};

const statusText = computed(() => {
  if (!props.handle) return "待处理";
  const action = props.handle.handleAction?.trim().toLowerCase();
  const base = actionLabelMap[action] || "已处理";
  const time = props.handle.handleTime?.trim();
  return time ? `${base} · ${time}` : base;
});
</script>

<style scoped>
@import "@/assets/styles/system-notification-item.css";
@import "@/assets/styles/night/system-notification-item-night.css";
</style>
