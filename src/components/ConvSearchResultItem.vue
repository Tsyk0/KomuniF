<template>
  <button
    type="button"
    class="conv-search-result-item"
    :class="{ selected }"
    @click="emit('select', conversation)"
  >
    <div class="conv-search-result-main">
      <div class="conv-search-result-title">
        {{ conversation.convName || `群聊#${conversation.convId}` }}
      </div>
      <div class="conv-search-result-meta">
        ID {{ conversation.convId }} ·
        {{ Number(conversation.currentMemberCount || 0) }}/{{ Number(conversation.maxMemberCount || 0) }}
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { ConversationSummaryDTO } from "@/types/dto/conversation";

defineProps<{
  conversation: ConversationSummaryDTO;
  selected?: boolean;
}>();

const emit = defineEmits<{
  select: [conversation: ConversationSummaryDTO];
}>();
</script>

<style scoped>
.conv-search-result-item {
  width: 100%;
  text-align: left;
  border: 1px solid var(--cc-border);
  border-radius: var(--cc-radius-sm);
  background: var(--cc-surface);
  padding: 10px 12px;
  cursor: pointer;
}

.conv-search-result-item.selected {
  border-color: var(--cc-accent);
  background: var(--cc-accent-soft);
}

.conv-search-result-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.conv-search-result-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--cc-text-sub);
}

html.night-mode .conv-search-result-title,
html.night-mode .conv-search-result-meta {
  color: #ffffff;
}
</style>
