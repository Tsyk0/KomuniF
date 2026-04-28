<template>
  <el-input
    class="searchbar-el-input"
    :model-value="modelValue"
    :placeholder="placeholder || ''"
    @update:model-value="handleInput"
  >
    <template #suffix>
      <button
        class="search-action-btn"
        @click.stop="handleActionClick"
        :title="modelValue ? '清除' : '搜索'"
        :aria-label="modelValue ? '清除' : '搜索'"
        type="button"
      >
        <X
          v-if="modelValue"
          class="search-action-icon"
          :size="16"
          :stroke-width="2.2"
        />
        <Search
          v-else
          class="search-action-icon"
          :size="16"
          :stroke-width="2.2"
        />
      </button>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { Search, X } from "lucide-vue-next";

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const handleInput = (value: string) => {
  emit("update:modelValue", value);
};

const handleActionClick = () => {
  if (props.modelValue) emit("update:modelValue", "");
};
</script>
<style>
@import url("@/assets/styles/searchbar.css");
</style>
