<template>
  <article
    class="sys-notif-item"
    :class="{ 'sys-notif-item--unread': isUnread }"
  >
    <div class="sys-notif-item__accent" aria-hidden="true" />
    <div class="sys-notif-item__inner">
      <div class="sys-notif-item__meta">
        <span class="sys-notif-item__badge">{{ typeBadge }}</span>
        <span v-if="isUnread" class="sys-notif-item__unread-tag">未读</span>
      </div>
      <div class="sys-notif-item__title-row">
        <span class="sys-notif-item__title">{{ titleText }}</span>
      </div>
      <p v-if="bodyText" class="sys-notif-item__body">{{ bodyText }}</p>
      <p class="sys-notif-item__time">{{ notification.createTime }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SystemNotification } from "@/types/dto/notification";
import {
  notificationTypeBadgeLabel,
  notificationDefaultTitle,
} from "@/types/dto/notification";

const props = defineProps<{
  notification: SystemNotification;
  relatedLabel?: string | null;
}>();

const isUnread = computed(() => props.notification.isRead === false);

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
</script>

<style scoped>
@import "@/assets/styles/system-notification-item.css";
@import "@/assets/styles/night/system-notification-item-night.css";
</style>
