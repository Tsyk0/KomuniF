<template>
  <button
    type="button"
    class="conv-search-result-item"
    :class="{ selected }"
    v-ripple="{ rippleOpts }"
    @click="emit('select', conversation)"
  >
    <div class="conv-search-result-avatar">
      <img
        v-if="avatarDisplay"
        :src="avatarDisplay"
        alt=""
        class="conv-search-result-avatar-img"
        @error="onImgError"
      />
      <span v-else class="conv-search-result-avatar-ph">{{ initial }}</span>
    </div>
    <div class="conv-search-result-main">
      <div class="conv-search-result-title">
        {{ displayName }}
      </div>
      <div class="conv-search-result-meta">
        ID {{ conversation.convId ?? "暂未设置" }} · 成员：
        {{ memberCountText }}
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { getConversationDisplayName } from "@/commons/utils/conversation-display";
import { normalizeConversationAvatarUrl } from "@/commons/utils/avatar-url";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";

const props = defineProps<{
  conversation: ConversationSummaryDTO;
  selected?: boolean;
}>();

const displayName = computed(() => {
  return getConversationDisplayName(props.conversation) || `群聊#${props.conversation.convId}`;
});

const initial = computed(() => displayName.value.charAt(0).toUpperCase() || "群");

const imgBroken = ref(false);

const avatarDisplay = computed(() => {
  if (imgBroken.value) return "";
  return normalizeConversationAvatarUrl(props.conversation.convAvatar) || "";
});

const memberCountText = computed(() => {
  const current = formatOptionalNumber(props.conversation.currentMemberCount);
  const max = formatOptionalNumber(props.conversation.maxMemberCount);
  return `${current}/${max}`;
});

const emit = defineEmits<{
  select: [conversation: ConversationSummaryDTO];
}>();

const rippleOpts = { color: "var(--sli-ripple-color)", duration: 520 };

/**
 * 将可空人数转成搜索结果可读文案。
 * 使用场景：群聊搜索结果列表展示后端返回 null 的成员数字段时兜底。
 */
function formatOptionalNumber(value: unknown): string {
  if (value == null || value === "") return "暂未设置";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "暂未设置";
}

/**
 * 标记群头像加载失败并切换为占位头像。
 * 使用场景：群聊搜索结果列表头像 URL/fileId 不可访问时兜底。
 */
function onImgError() {
  imgBroken.value = true;
}
</script>

<style scoped>
.conv-search-result-item {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: var(--sli-pad-y) var(--sli-pad-x);
  text-align: left;
  font: inherit;
  justify-content: center;
}

.conv-search-result-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--cc-surface);
  outline: 1px solid var(--cc-border);
  box-sizing: border-box;
}

.conv-search-result-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.conv-search-result-avatar-ph {
  font-size: 17px;
  font-weight: 700;
  color: var(--cc-text-muted);
}

.conv-search-result-main {
  flex: 1;
  min-width: 0;
}

.conv-search-result-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-search-result-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--cc-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

html.night-mode .conv-search-result-title,
html.night-mode .conv-search-result-meta {
  color: #ffffff;
}
</style>
