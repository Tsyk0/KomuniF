<!-- File: src/components/ChatSearchResultItem.vue -->
<template>
  <div
    class="search-result-item"
    role="button"
    tabindex="0"
    @click="emitSelect"
    @keydown.enter.prevent="emitSelect"
    @keydown.space.prevent="emitSelect"
  >
    <div class="avatar">
      <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" @error="onImgError" />
      <span v-else class="avatar-fallback">{{ fallbackChar }}</span>
    </div>

    <div class="content">
      <div class="top-row">
        <div class="name" :title="displayName">{{ displayName }}</div>
        <div class="time">{{ timeText }}</div>
      </div>
      <div class="message" :title="message.messageContent">
        {{ message.messageContent }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMessageItemAvatar } from "@/capabilities/show-display-avatar";
import { displayNameResolver } from "@/capabilities/show-display-name";
import type { DisplayMessage } from "@/entity/message";

const props = defineProps<{
  message: DisplayMessage;
  convType?: number | null;
}>();

const emit = defineEmits<{
  (e: "select", message: DisplayMessage): void;
}>();

const emitSelect = () => {
  emit("select", props.message);
};

const displayName = computed(() =>
  displayNameResolver.person({
    userNickname: props.message.senderName,
    fallbackName: String(props.message.senderId == null ? "" : props.message.senderId),
  })
);

const fallbackChar = computed(() => {
  const n = displayName.value || "";
  return n ? n.charAt(0) : "?";
});

const { avatarDisplayUrl: avatarUrl, onAvatarError: onImgError } =
  useMessageItemAvatar(
    () => props.message,
    () => (props.convType == null ? null : props.convType)
  );

const timeText = computed(() => {
  const t = props.message.sendTime;
  if (!t) return "";
  try {
    const d = new Date(t);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
});
</script>

<style scoped>
.search-result-item {
  display: flex;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  outline: none;
}

.search-result-item:focus-visible {
  box-shadow: 0 0 0 2px rgba(51, 144, 236, 0.45);
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: white;
  font-weight: 600;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 14px;
}

.content {
  flex: 1;
  min-width: 0;
}

.top-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  flex-shrink: 0;
}

.message {
  margin-top: 4px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

html.night-mode .search-result-item {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.55);
}

html.night-mode .name {
  color: rgba(226, 232, 240, 0.9);
}

html.night-mode .time {
  color: rgba(226, 232, 240, 0.55);
}

html.night-mode .message {
  color: rgba(226, 232, 240, 0.85);
}
</style>
