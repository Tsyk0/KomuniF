<template>
  <svg
    class="kf-icon"
    :class="`kf-icon--${name}`"
    :width="normalizedSize"
    :height="normalizedSize"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-for="(d, index) in iconPaths"
      :key="index"
      :d="d"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

type IconName =
  | "search"
  | "more-vertical"
  | "phone"
  | "add"
  | "user"
  | "message"
  | "trash"
  | "attachment"
  | "emoji"
  | "send";

const props = defineProps<{
  name: IconName;
  size?: number | string;
}>();

const normalizedSize = computed(() => {
  if (props.size === undefined) return 18;
  if (typeof props.size === "number") return props.size;
  const parsed = parseInt(props.size, 10);
  return Number.isNaN(parsed) ? 18 : parsed;
});

const ICON_PATHS: Record<IconName, string[]> = {
  search: [
    "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z",
    "M16.5 16.5 20 20",
  ],
  "more-vertical": ["M12 5.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z", "M12 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z", "M12 16.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"],
  phone: [
    "M6.75 4.5h2.25L10.5 8.25l-1.5 1.5a10.5 10.5 0 0 0 4.5 4.5l1.5-1.5L19.5 15v2.25A1.25 1.25 0 0 1 18.25 18 12.75 12.75 0 0 1 6 5.75 1.25 1.25 0 0 1 7.25 4.5Z",
  ],
  add: ["M12 5v14", "M5 12h14"],
  user: [
    "M12 4.75a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Z",
    "M6.75 18.25a5.25 5.25 0 0 1 10.5 0",
  ],
  message: [
    "M5 6.75A2.75 2.75 0 0 1 7.75 4h8.5A2.75 2.75 0 0 1 19 6.75v6.5A2.75 2.75 0 0 1 16.25 16H11l-3.5 3.25V16H7.75A2.75 2.75 0 0 1 5 13.25Z",
  ],
  trash: [
    "M9.5 4.75h5",
    "M5.75 7h12.5",
    "M9 7v10.25A1.75 1.75 0 0 0 10.75 19h2.5A1.75 1.75 0 0 0 15 17.25V7",
  ],
  attachment: [
    "M8.75 7.75 14 3.5a3 3 0 0 1 4.24 4.24l-7.2 7.2a4.25 4.25 0 0 1-6.01-6.01l6.01-6.01",
  ],
  emoji: [
    "M12 4.25a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Z",
    "M9 10.25h.01",
    "M15 10.25h.01",
    "M9 14a3.5 3.5 0 0 0 3 1.75A3.5 3.5 0 0 0 15 14",
  ],
  send: [
    "M4.75 5.75 18.5 12 4.75 18.25 7 12Z",
  ],
};

const iconPaths = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS.search);
</script>

<style scoped>
.kf-icon {
  display: inline-block;
}
</style>

