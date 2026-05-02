<template>
  <button
    type="button"
    class="conv-search-result-item"
    :class="{ selected }"
    v-ripple="{ rippleOpts }"
    @click="emit('select', conversation)"
  >
    <div class="conv-search-result-main">
      <div class="conv-search-result-title">
        {{ displayName }}
      </div>
      <div class="conv-search-result-meta">
        ID {{ conversation.convId }} ·
        {{ Number(conversation.currentMemberCount || 0) }}/{{ Number(conversation.maxMemberCount || 0) }}
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getConversationDisplayName } from "@/commons/utils/conversation-display";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";

const props = defineProps<{
  conversation: ConversationSummaryDTO;
  selected?: boolean;
}>();

const displayName = computed(() => {
  return getConversationDisplayName(props.conversation) || `群聊#${props.conversation.convId}`;
});

const emit = defineEmits<{
  select: [conversation: ConversationSummaryDTO];
}>();

const rippleOpts = { color: "var(--sli-ripple-color)", duration: 520 };
</script>

<style scoped>
.conv-search-result-item {
  text-align: left;
  font: inherit;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
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
