<template>
  <el-dialog
    :model-value="visible"
    width="420px"
    :close-on-click-modal="true"
    :append-to-body="true"
    @close="emit('close')"
  >
    <template #header>
      <div class="read-receipt-dialog-title">已读成员（{{ totalCount }}人）</div>
    </template>
    <div class="read-receipt-dialog-list">
      <div
        v-for="member in members"
        :key="member.userId"
        class="read-receipt-dialog-row"
      >
        <img
          v-if="hasAvatar(member)"
          :src="avatarUrl(member)"
          alt="avatar"
          class="read-receipt-dialog-avatar"
          loading="lazy"
          @error="handleAvatarError(member.userId)"
        />
        <div v-else class="read-receipt-dialog-avatar read-receipt-dialog-avatar--fallback">
          {{ (member.userNickname || "用").slice(0, 1) }}
        </div>
        <div class="read-receipt-dialog-main">
          <span class="read-receipt-dialog-name">{{ member.userNickname || "用户" }}</span>
          <span class="read-receipt-dialog-time">{{ formatReadTime(member.readTime) }}</span>
        </div>
      </div>
      <div v-if="members.length === 0" class="read-receipt-dialog-empty">暂无已读成员</div>
    </div>
    <template #footer>
      <el-button v-if="hasMore" :loading="loadingMore" @click="emit('load-more')">
        加载更多
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ReadReceiptMemberDTO } from "@/types/dto/message";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";

interface Props {
  visible: boolean;
  members: ReadReceiptMemberDTO[];
  totalCount: number;
  hasMore: boolean;
  loadingMore?: boolean;
}

defineProps<Props>();
const avatarLoadFailedUserIdSet = ref(new Set<number>());

const emit = defineEmits<{
  close: [];
  "load-more": [];
}>();

/**
 * 格式化已读时间。
 * 使用场景：已读成员弹窗按成员行显示 readTime 的友好时间字符串。
 */
const formatReadTime = (readTime: string): string => {
  if (!readTime) return "";
  const date = new Date(readTime);
  if (Number.isNaN(date.getTime())) return readTime;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * 头像加载失败兜底。
 * 使用场景：成员头像链接失效时，隐藏图片并回退到昵称首字母占位。
 */
const handleAvatarError = (userId: number) => {
  avatarLoadFailedUserIdSet.value.add(Number(userId));
};

/**
 * 解析已读成员头像地址。
 * 使用场景：弹窗成员列表展示头像时，统一做 URL 归一化与失败回退。
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
.read-receipt-dialog-title {
  font-size: 16px;
  font-weight: 600;
}

.read-receipt-dialog-list {
  max-height: 420px;
  overflow-y: auto;
}

.read-receipt-dialog-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 2px;
}

.read-receipt-dialog-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.read-receipt-dialog-avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: #1e40af;
  font-size: 12px;
}

.read-receipt-dialog-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 10px;
}

.read-receipt-dialog-name {
  font-size: 14px;
  color: #1f2937;
}

.read-receipt-dialog-time {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.read-receipt-dialog-empty {
  color: #9ca3af;
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
}
</style>
