<template>
  <div class="search-bar-container">
    <div class="search-bar-wrapper">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        class="search-input"
        @input="handleInput"
      />
      <button
        v-if="modelValue"
        class="clear-search-btn"
        @click="$emit('update:modelValue', '')"
        title="清除"
      >
        <span class="clear-icon">×</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  // emit("update:modelValue", target.value);
};
</script>
<style scoped>
@import url("@/assets/styles/searchbar.css");
</style>
