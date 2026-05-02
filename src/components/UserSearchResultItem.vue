<!-- File: src/components/UserSearchResultItem.vue -->
<template>
  <button
    type="button"
    class="user-search-result-item"
    :class="{ selected: selected }"
    v-ripple="{ rippleOpts }"
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
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";

const props = defineProps<{
  user: User;
  selected?: boolean;
}>();

const emit = defineEmits<{
  select: [user: User];
}>();

/** 与侧栏统一列表项的 ripple 变量一致。 */
const rippleOpts = { color: "var(--sli-ripple-color)", duration: 520 };

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
  gap: 12px;
  text-align: left;
  font: inherit;
}
</style>
