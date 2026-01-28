<!-- src/components/FriendGroup.vue -->
<template>
  <div class="friend-group">
    <!-- 分组标题 -->
    <div class="group-header" @click="handleToggle">
      <div class="header-left">
        <span class="toggle-icon">{{ isCollapsed ? "▶" : "▼" }}</span>
        <span class="group-title">{{ title }}</span>
      </div>
      <div class="group-count">
        <span v-if="total !== undefined">{{ count }}/{{ total }}</span>
        <span v-else>{{ count }}</span>
      </div>
    </div>

    <!-- 分组内容（可折叠） -->
    <div v-show="!isCollapsed" class="group-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  count: number;
  total?: number;
  isCollapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isCollapsed: false,
});

const emit = defineEmits<{
  toggle: [];
}>();

const handleToggle = () => {
  emit("toggle");
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-group.css";
</style>