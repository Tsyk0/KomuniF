<template>
  <button
    type="button"
    class="archived-folder-item conversation-item"
    @click="$emit('open')"
  >
    <div class="conversation-item-container">
      <div class="archived-folder-item__text-wrap">
        <Archive class="archived-folder-item__icon" :size="18" :stroke-width="2.2" />
        <div class="archived-folder-item__title">已归档的会话</div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { Archive } from "lucide-vue-next";

defineEmits<{
  open: [];
}>();
</script>

<style scoped>
.archived-folder-item {
  width: 100%;
  border: none;
  cursor: pointer;
  text-align: left;
}

.archived-folder-item__text-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #2563eb;
}

.archived-folder-item__title {
  font-size: 14px;
  font-weight: 600;
  color: inherit;
}

:global(html.night-mode) .archived-folder-item__text-wrap {
  color: var(--theme-primary-faint);
}
</style>
