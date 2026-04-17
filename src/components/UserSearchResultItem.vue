<!-- File: src/components/UserSearchResultItem.vue -->
<template>
  <button
    type="button"
    class="user-search-result-item"
    :class="{ selected: selected }"
    @click="emit('select', user)"
  >
    <div class="conv-create-row-avatar">
      <img
        v-if="avatarDisplay"
        :src="avatarDisplay"
        alt=""
        class="conv-create-avatar-img"
        @error="onImgError"
      />
      <span v-else class="conv-create-avatar-ph">{{ initial }}</span>
    </div>
    <div class="conv-create-row-text">
      <span class="conv-create-row-name">{{ nickname }}</span>
      <span class="conv-create-row-sub">{{ genderLabel }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { User } from "@/entity/user";
import { normalizeAvatarUrl } from "@/utils/avatar-url";

const props = defineProps<{
  user: User;
  selected?: boolean;
}>();

const emit = defineEmits<{
  select: [user: User];
}>();

const imgBroken = ref(false);

const nickname = computed(
  () =>
    props.user.userNickname?.trim() ||
    `用户 ${props.user.userId == null ? "" : props.user.userId}`
);

const initial = computed(() =>
  nickname.value.charAt(0).toUpperCase() || "?"
);

const genderLabel = computed(() => {
  const g = props.user.userGender;
  if (g === 1) return "男";
  if (g === 2) return "女";
  return "未知";
});

const avatarDisplay = computed(() => {
  if (imgBroken.value) return "";
  const u = normalizeAvatarUrl(props.user.userAvatar);
  return u || "";
});

function onImgError() {
  imgBroken.value = true;
}
</script>

<style scoped>
@import "@/assets/styles/conv-create-panel.css";

.user-search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  margin: 0;
  border: 1px solid transparent;
  border-radius: var(--cc-radius-sm, 12px);
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  box-sizing: border-box;
  transition: background 0.18s ease, border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.user-search-result-item:hover {
  background: var(--cc-row-hover, rgba(15, 23, 42, 0.04));
}

.user-search-result-item.selected {
  background: var(--cc-row-selected, rgba(37, 99, 235, 0.08));
  border-color: rgba(37, 99, 235, 0.2);
  box-shadow: var(--cc-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
}
</style>
