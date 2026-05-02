<!-- File: src/components/SystemNotificationItem.vue -->
<template>
  <article
    class="sys-notif-item"
    :class="{
      'sys-notif-item--accent-accept': accentVariant === 'accept',
      'sys-notif-item--accent-reject': accentVariant === 'reject',
      'sys-notif-item--accent-dismiss': accentVariant === 'dismiss',
    }"
  >
    <div class="sys-notif-item__accent" aria-hidden="true" />
    <div class="sys-notif-item__inner">
      <div class="sys-notif-item__meta">
        <span class="sys-notif-item__badge">{{ modeLabel }}</span>
        <span class="sys-notif-item__badge">{{ typeBadge }}</span>
      </div>
      <div class="sys-notif-item__title-row">
        <span class="sys-notif-item__title">{{ titleText }}</span>
      </div>
      <p v-if="bodyText" class="sys-notif-item__body">{{ bodyText }}</p>
      <p class="sys-notif-item__time">{{ timeText }}</p>
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
  /** 左侧竖条：pending(灰) / accept(绿) / reject(红) / dismiss(黑) */
  accentVariant?: "pending" | "accept" | "reject" | "dismiss";
}>();

const typeBadge = computed(() =>
  notificationTypeBadgeLabel(props.notification.type || "system_message")
);

const titleText = computed(() => {
  if (props.notification.notificationTitle?.trim()) {
    return props.notification.notificationTitle.trim();
  }
  if (props.notification.type === "conv_join") {
    return modeLabel.value === "确认"
      ? "入群申请已提交/已处理"
      : "入群申请处理结果";
  }
  return notificationDefaultTitle(props.notification.type);
});

const bodyText = computed(() => {
  if (props.notification.notificationContent?.trim()) {
    return props.notification.notificationContent.trim();
  }

  return " ";
});

const modeLabel = computed(() =>
  String(props.notification.mode || "").toLowerCase() === "confirm"
    ? "确认"
    : "告知"
);

function formatNotificationTime(value: unknown): string {
  if (value == null || value === "") return "-";
  if (typeof value === "number") {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("zh-CN", { hour12: false });
  }
  const raw = String(value).trim();
  if (!raw) return "-";
  const num = Number(raw);
  if (Number.isFinite(num)) {
    return formatNotificationTime(num);
  }
  const d = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("zh-CN", { hour12: false });
}

const timeText = computed(() => {
  return formatNotificationTime(props.notification.createTime);
});
</script>

<style scoped>
@import "@/assets/styles/system-notification-item.css";
@import "@/assets/styles/night/system-notification-item-night.css";
</style>
