<template>
  <div v-if="readCount > 0" class="message-read-receipt-row">
    <button type="button" class="message-read-receipt" @click="emit('click')">
      <span class="message-read-receipt-avatars">
        <span
          v-for="member in previewMembers"
          :key="member.userId"
          class="message-read-receipt-avatar-wrap"
        >
          <img
            v-if="hasAvatar(member)"
            :src="avatarUrl(member)"
            alt="avatar"
            class="message-read-receipt-avatar"
            loading="lazy"
            @error="handleAvatarError(member.userId)"
          />
          <span
            v-else
            class="message-read-receipt-avatar message-read-receipt-avatar--fallback"
          >
            {{ (member.userNickname || "用").slice(0, 1) }}
          </span>
        </span>
        <span v-if="overflowCount > 0" class="message-read-receipt-overflow"
          >+{{ overflowCount }}</span
        >
      </span>
      <span class="message-read-receipt-text">{{ readText }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { ReadReceiptMemberDTO } from "@/types/dto/message";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";

interface Props {
  readCount: number;
  members: ReadReceiptMemberDTO[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ click: [] }>();

const sortedMembers = computed(() =>
  [...(props.members || [])].sort(
    (a, b) => Date.parse(b.readTime || "") - Date.parse(a.readTime || "")
  )
);
const previewMembers = computed(() => sortedMembers.value.slice(0, 5));
const overflowCount = computed(() => Math.max(0, Number(props.readCount || 0) - 5));
const readText = computed(() =>
  Number(props.readCount || 0) > 5 ? `等 ${props.readCount} 人已读` : "已读"
);
const avatarLoadFailedUserIdSet = ref(new Set<number>());

/**
 * 头像错误回退。
 * 使用场景：已读头像资源失效时隐藏图片并显示字母占位。
 */
const handleAvatarError = (userId: number) => {
  avatarLoadFailedUserIdSet.value.add(Number(userId));
};

/**
 * 解析成员头像地址（含 baseUrl 归一化与失败降级）。
 * 使用场景：已读条展示头像时，统一兼容相对路径/绝对路径/失败重试。
 */
const resolveAvatarUrl = (member: ReadReceiptMemberDTO): string | null => {
  const uid = Number(member.userId);
  if (avatarLoadFailedUserIdSet.value.has(uid)) return null;
  const raw = typeof member.userAvatar === "string" ? member.userAvatar : "";
  const normalized = normalizeAvatarUrl(raw);
  return normalized || null;
};

/**
 * 判定成员是否可显示头像。
 * 使用场景：模板层控制 img/fallback 的分支渲染。
 */
const hasAvatar = (member: ReadReceiptMemberDTO): boolean =>
  !!resolveAvatarUrl(member);

/**
 * 获取成员头像地址（模板辅助）。
 * 使用场景：在 hasAvatar 分支内给 img 提供稳定 src。
 */
const avatarUrl = (member: ReadReceiptMemberDTO): string =>
  resolveAvatarUrl(member) || "";
</script>

<style scoped>
.message-read-receipt-row {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.message-read-receipt {
  margin: 4px 52px 2px 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 2px 0;
}

.message-read-receipt-avatars {
  display: inline-flex;
  align-items: center;
}

.message-read-receipt-avatar-wrap {
  margin-left: -6px;
}

.message-read-receipt-avatar-wrap:first-child {
  margin-left: 0;
}

.message-read-receipt-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #fff;
}

.message-read-receipt-avatar--fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  background: #e5e7eb;
  color: #374151;
}

.message-read-receipt-overflow {
  margin-left: 4px;
  border-radius: 9px;
  padding: 0 6px;
  line-height: 18px;
  height: 18px;
  font-size: 11px;
  background: #e5e7eb;
  color: #374151;
}

.message-read-receipt-text {
  font-size: 12px;
  color: #6b7280;
}
</style>
