<template>
  <article class="sys-notif-item">
    <div class="sys-notif-item__accent" aria-hidden="true" />
    <div class="sys-notif-item__inner">
      <div class="sys-notif-item__meta">
        <span class="sys-notif-item__badge">请求</span>
        <span class="sys-notif-item__badge">{{ requestTypeLabel }}</span>
      </div>
      <div class="sys-notif-item__title-row">
        <span class="sys-notif-item__title">{{ displayTitle }}</span>
      </div>
      <p v-if="displayContent" class="sys-notif-item__body">{{ displayContent }}</p>
      <p class="sys-notif-item__status">
        状态：{{ statusLabel }} · requester={{ rah.requester }} · handler={{ rah.handler }}
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

const requestTypeLabel = computed(() => {
  if (String(props.rah.type || "") === "conv_join") return "入群申请";
  if (String(props.rah.type || "") === "friend_add") return "好友申请";
  return props.rah.type || "unknown";
});

const displayTitle = computed(() => {
  if (props.rah.rahTitle) return props.rah.rahTitle;
  if (String(props.rah.type || "") === "conv_join") return "入群申请待处理";
  return "请求待处理";
});

const displayContent = computed(() => {
  if (props.rah.rahContent) return props.rah.rahContent;
  if (String(props.rah.type || "") === "conv_join") return "有用户申请加入群聊，等待审批。";
  return "";
});

const statusLabel = computed(() => {
  const status = String(props.rah.status || "").toLowerCase();
  if (status === "pending") return "待处理";
  if (status === "accepted") return "已通过";
  if (status === "rejected") return "已拒绝";
  if (status === "banned") return "已拉黑";
  return props.rah.status || "-";
});

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
