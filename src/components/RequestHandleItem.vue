<template>
  <article class="sys-notif-item">
    <div class="sys-notif-item__accent" aria-hidden="true" />
    <div class="sys-notif-item__inner">
      <div class="sys-notif-item__meta">
        <span class="sys-notif-item__badge">请求</span>
        <span class="sys-notif-item__badge">{{ rah.type || "unknown" }}</span>
      </div>
      <div class="sys-notif-item__title-row">
        <span class="sys-notif-item__title">{{ rah.rahTitle || "请求待处理" }}</span>
      </div>
      <p v-if="rah.rahContent" class="sys-notif-item__body">{{ rah.rahContent }}</p>
      <p class="sys-notif-item__status">
        状态：{{ rah.status }} · requester={{ rah.requester }} · handler={{ rah.handler }}
      </p>
      <p class="sys-notif-item__time">{{ formatNotificationTime(rah.createTime) }}</p>
      <div v-if="showActions" class="sys-notif-external-actions sys-notif-external-actions--open">
        <button type="button" class="sys-notif-action-btn sys-notif-action-btn--accept" @click="$emit('action', 'accept')">通过</button>
        <button type="button" class="sys-notif-action-btn sys-notif-action-btn--reject" @click="$emit('action', 'reject')">拒绝</button>
        <button type="button" class="sys-notif-action-btn sys-notif-action-btn--block" @click="$emit('action', 'block')">拉黑</button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RequestHandle, RequestHandleAction } from "@/types/dto/notification";

const props = defineProps<{
  rah: RequestHandle;
  currentUserId: number;
}>();

defineEmits<{
  (e: "action", action: RequestHandleAction): void;
}>();

const showActions = computed(
  () =>
    String(props.rah.status || "").toLowerCase() === "pending" &&
    Number(props.rah.handler || 0) === Number(props.currentUserId || 0)
);

function formatNotificationTime(value: unknown): string {
  if (value == null || value === "") return "-";
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("zh-CN", { hour12: false });
}
</script>

<style scoped>
@import "@/assets/styles/system-notification-item.css";
@import "@/assets/styles/night/system-notification-item-night.css";
</style>
