<!-- File: src/components/UserSearch.vue -->
<template>
  <div class="conv-create-panel conv-create-panel--main-area user-search-root">
    <header class="conv-create-toolbar">
      <button type="button" class="conv-create-tool-btn" @click="emit('exit')">
        退出
      </button>
      <h3 class="conv-create-toolbar-title">添加好友</h3>
      <button
        type="button"
        class="conv-create-tool-btn conv-create-tool-btn--accent"
        @click="convCreateStore.setPanel('group')"
      >
        新建群聊
      </button>
    </header>

    <div class="user-search-body">
      <div
        class="user-search-left"
        :class="{ 'is-compact': selectedUser != null }"
        @click="onLeftPaneClick"
      >
        <div class="user-search-field" @click.stop>
          <label class="conv-create-label" for="user-search-input"
            >搜索用户</label
          >
          <input
            id="user-search-input"
            v-model="keywordInput"
            class="conv-create-input user-search-input"
            type="search"
            maxlength="64"
            placeholder="输入昵称等关键词"
            autocomplete="off"
            enterkeyhint="search"
            @input="scheduleSearch"
            @blur="onSearchBlur"
          />
        </div>

        <div class="user-search-list-region">
          <div v-if="listError" class="user-search-banner user-search-banner--error">
            {{ listError }}
          </div>
          <div
            v-else-if="searching && users.length === 0"
            class="conv-create-empty user-search-status"
          >
            搜索中…
          </div>
          <div
            v-else-if="!searching && lastSearchedKeyword && users.length === 0"
            class="conv-create-empty user-search-status"
          >
            未找到相关用户
          </div>
          <div
            v-else-if="!lastSearchedKeyword"
            class="conv-create-empty user-search-status"
          >
            输入关键词开始搜索（失焦或短暂停顿后查询）
          </div>

          <ul v-else class="user-search-list">
            <li v-for="u in users" :key="userKey(u)">
              <UserSearchResultItem
                :user="u"
                :selected="
                  selectedUser != null &&
                  Number(selectedUser.userId) === Number(u.userId)
                "
                @select="onPickUser"
              />
            </li>
          </ul>

          <button
            v-if="canLoadMore"
            type="button"
            class="user-search-load-more"
            :disabled="loadingMore"
            @click.stop="loadMore"
          >
            {{ loadingMore ? "加载中…" : "加载更多" }}
          </button>

          <p
            v-if="syncHint && users.length > 0"
            class="user-search-sync-hint"
          >
            {{ syncHint }}
          </p>
        </div>
      </div>

      <div
        class="user-search-detail"
        :class="{ 'is-open': selectedUser != null }"
        :aria-hidden="selectedUser == null"
      >
        <div class="user-search-detail-inner">
          <template v-if="selectedUser">
            <div class="user-search-detail-hero">
              <div class="user-search-detail-avatar-wrap">
                <img
                  v-if="detailAvatar"
                  :src="detailAvatar"
                  alt=""
                  class="user-search-detail-avatar"
                  @error="detailAvatarBroken = true"
                />
                <div v-else class="user-search-detail-avatar-ph">
                  {{ detailInitial }}
                </div>
              </div>
              <h4 class="user-search-detail-name">{{ detailNickname }}</h4>
              <p class="user-search-detail-meta">
                <span>{{ detailGender }}</span>
                <span v-if="selectedUser.userId != null" class="user-search-detail-id"
                  >ID {{ selectedUser.userId }}</span
                >
              </p>
            </div>

            <div class="user-search-detail-fields">
              <div v-if="selectedUser.userSignature" class="user-search-detail-row">
                <span class="user-search-detail-label">签名</span>
                <span class="user-search-detail-value">{{
                  selectedUser.userSignature
                }}</span>
              </div>
              <div v-if="selectedUser.userLocation" class="user-search-detail-row">
                <span class="user-search-detail-label">地区</span>
                <span class="user-search-detail-value">{{
                  selectedUser.userLocation
                }}</span>
              </div>
              <div v-if="selectedUser.userBirthday" class="user-search-detail-row">
                <span class="user-search-detail-label">生日</span>
                <span class="user-search-detail-value">{{
                  selectedUser.userBirthday
                }}</span>
              </div>
              <div v-if="selectedUser.userEmail" class="user-search-detail-row">
                <span class="user-search-detail-label">邮箱</span>
                <span class="user-search-detail-value">{{
                  selectedUser.userEmail
                }}</span>
              </div>
              <div v-if="selectedUser.userPhone" class="user-search-detail-row">
                <span class="user-search-detail-label">手机</span>
                <span class="user-search-detail-value">{{
                  selectedUser.userPhone
                }}</span>
              </div>
            </div>

            <div class="user-search-detail-actions">
              <button
                v-if="!isSelf(selectedUser)"
                type="button"
                class="conv-create-btn primary user-search-action-btn"
                :disabled="friendRequestSending"
                @click.stop="sendFriendRequest"
              >
                {{
                  friendRequestSending ? "发送中…" : "添加好友"
                }}
              </button>
              <p v-else class="user-search-self-note">这是当前登录账号</p>
              <button
                type="button"
                class="conv-create-btn secondary user-search-action-btn"
                @click.stop="onSendMessageClick"
              >
                发送消息
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import { useConvCreateStore } from "@/stores/chat/conv-create";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/entity/user";
import { userSearchApi } from "@/apis/user-search";
import { friendRequestApi } from "@/apis/friends/friend-request";
import { normalizeAvatarUrl } from "@/utils/avatar-url";
import toast from "@/commons/utils/toast";
import UserSearchResultItem from "./UserSearchResultItem.vue";

const DEBOUNCE_MS = 300;

const emit = defineEmits<{
  exit: [];
  /** 预留：与某用户发起会话（待后端接口对接） */
  "send-message": [user: User];
}>();

const convCreateStore = useConvCreateStore();
const authStore = useAuthStore();

const keywordInput = ref("");
const users = ref<User[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const searching = ref(false);
const loadingMore = ref(false);
const listError = ref("");
const lastSearchedKeyword = ref("");
const selectedUser = ref<User | null>(null);
const friendRequestSending = ref(false);
const detailAvatarBroken = ref(false);

let debounceTimer: number | null = null;

const userKey = (u: User): string => {
  const id = (u as any)?.userId;
  return String(id == null ? "" : id);
};

const selfUserId = computed(() => {
  const id = authStore.user?.userId;
  if (id == null) return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
});

const syncHint = computed(() => {
  if (total.value > 0 && users.value.length < total.value && users.value.length > 0) {
    const delta = total.value - users.value.length;
    if (delta > 0) {
      return `共约 ${total.value} 条命中，当前已加载 ${users.value.length} 条；若数量不一致可能为数据同步中。`;
    }
  }
  return "";
});

const canLoadMore = computed(() => {
  if (!lastSearchedKeyword.value || listError.value) return false;
  return users.value.length < total.value;
});

const detailNickname = computed(() => {
  if (!selectedUser.value) return "";
  return (
    selectedUser.value.userNickname?.trim() ||
    `用户 ${selectedUser.value.userId == null ? "" : selectedUser.value.userId}`
  );
});

const detailInitial = computed(() =>
  detailNickname.value.charAt(0).toUpperCase() || "?"
);

const detailGender = computed(() => {
  const g = selectedUser.value?.userGender;
  if (g === 1) return "男";
  if (g === 2) return "女";
  return "未知";
});

const detailAvatar = computed(() => {
  if (detailAvatarBroken.value || !selectedUser.value) return "";
  return normalizeAvatarUrl(selectedUser.value.userAvatar) || "";
});

watch(selectedUser, () => {
  detailAvatarBroken.value = false;
});

function isSelf(u: User): boolean {
  if (selfUserId.value == null || u.userId == null) return false;
  return Number(u.userId) === selfUserId.value;
}

function clearDebounce() {
  if (debounceTimer != null) {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

function scheduleSearch() {
  clearDebounce();
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    runSearch(true);
  }, DEBOUNCE_MS);
}

function onSearchBlur() {
  clearDebounce();
  runSearch(true);
}

async function runSearch(reset: boolean) {
  const kw = keywordInput.value.trim();
  if (!kw) {
    users.value = [];
    total.value = 0;
    lastSearchedKeyword.value = "";
    listError.value = "";
    selectedUser.value = null;
    return;
  }

  if (reset) {
    page.value = 1;
    selectedUser.value = null;
  }

  const keywordForRequest = reset ? kw : lastSearchedKeyword.value || kw;

  searching.value = true;
  listError.value = "";
  try {
    const resp = await userSearchApi.search({
      keyword: keywordForRequest,
      page: page.value,
      pageSize,
    });

    if (resp.code === 401) {
      if (reset) {
        listError.value = resp.message || "请先登录";
      } else {
        toast.error(resp.message || "请先登录");
        if (page.value > 1) page.value -= 1;
      }
      return;
    }
    if (resp.code !== 200 || !resp.data) {
      if (reset) {
        listError.value = resp.message || "搜索失败";
      } else {
        toast.error(resp.message || "加载更多失败");
        if (page.value > 1) page.value -= 1;
      }
      return;
    }

    const data = resp.data;
    if (reset) {
      lastSearchedKeyword.value = kw;
    }
    total.value = Number(data.total) || 0;
    if (reset) {
      users.value = Array.isArray(data.users) ? [...data.users] : [];
    } else {
      const prev = users.value;
      const next = Array.isArray(data.users) ? data.users : [];
      const seen = new Set(prev.map((u) => Number(u.userId)));
      for (const u of next) {
        const id = Number(u.userId);
        if (!seen.has(id)) {
          seen.add(id);
          prev.push(u);
        }
      }
      users.value = prev;
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "网络异常，请稍后重试";
    if (reset) {
      listError.value = msg;
    } else {
      toast.error(msg);
      if (page.value > 1) page.value -= 1;
    }
  } finally {
    searching.value = false;
  }
}

async function loadMore() {
  if (!canLoadMore.value || loadingMore.value) return;
  page.value += 1;
  loadingMore.value = true;
  try {
    await runSearch(false);
  } finally {
    loadingMore.value = false;
  }
}

function onPickUser(u: User) {
  selectedUser.value = u;
}

function onLeftPaneClick(e: MouseEvent) {
  const el = e.target as HTMLElement | null;
  if (!el) return;
  if (
    el.closest(".user-search-result-item") ||
    el.closest("input") ||
    el.closest("textarea") ||
    el.closest("button") ||
    el.closest(".user-search-field")
  ) {
    return;
  }
  selectedUser.value = null;
}

async function sendFriendRequest() {
  const u = selectedUser.value;
  const targetId = u?.userId;
  if (targetId == null || isSelf(u!)) {
    toast.error("无法向该用户发送申请");
    return;
  }
  friendRequestSending.value = true;
  try {
    const resp = await friendRequestApi.send(Number(targetId));
    if (resp.code === 200) {
      toast.success(resp.message || "已发送申请");
      return;
    }
    if (resp.code === 400) {
      toast.error(resp.message || "请求被拒绝");
      return;
    }
    if (resp.code === 401) {
      toast.error(resp.message || "登录已失效，请重新登录");
      return;
    }
    if (resp.code === 500) {
      toast.error("请稍后重试");
      return;
    }
    toast.error(resp.message || "发送失败");
  } catch (e: unknown) {
    const err = e as {
      response?: { status?: number; data?: { message?: string; code?: number } };
      message?: string;
    };
    const status = err.response?.status;
    const data = err.response?.data;
    if (status === 400 && data?.message) {
      toast.error(data.message);
      return;
    }
    if (status === 401) {
      toast.error(data?.message || "请先登录");
      return;
    }
    toast.error(data?.message || err.message || "发送失败，请稍后重试");
  } finally {
    friendRequestSending.value = false;
  }
}

function onSendMessageClick() {
  if (!selectedUser.value) return;
  emit("send-message", selectedUser.value);
}

onUnmounted(() => {
  clearDebounce();
});
</script>

<style scoped>
@import "@/assets/styles/conv-create-panel.css";
@import "@/assets/styles/night/conv-create-panel-night.css";

.user-search-root {
  border-radius: 0;
}

.user-search-body {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.user-search-left {
  flex: 1 1 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 12px;
  box-sizing: border-box;
  transition: flex-basis 0.28s ease, max-width 0.28s ease;
}

.user-search-left.is-compact {
  flex: 1 1 50%;
  max-width: 50%;
}

.user-search-field {
  flex-shrink: 0;
}

.user-search-input {
  margin-bottom: 10px;
}

.user-search-list-region {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.4) transparent;
}

.user-search-list-region::-webkit-scrollbar {
  width: 6px;
}

.user-search-list-region::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.35);
  border-radius: 999px;
}

.user-search-status {
  margin-top: 8px;
}

.user-search-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-search-banner {
  padding: 10px 12px;
  border-radius: var(--cc-radius-sm);
  font-size: 14px;
  margin-bottom: 8px;
}

.user-search-banner--error {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.user-search-load-more {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  border: 1px dashed var(--cc-border-strong);
  border-radius: var(--cc-radius-sm);
  background: var(--cc-surface);
  color: var(--cc-accent);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.user-search-load-more:hover:not(:disabled) {
  background: var(--cc-accent-soft);
}

.user-search-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-search-sync-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--cc-text-sub);
  line-height: 1.45;
}

.user-search-detail {
  flex: 0 0 0;
  min-width: 0;
  overflow: hidden;
  border-left: 1px solid transparent;
  transition: flex-basis 0.28s ease, min-width 0.28s ease,
    border-color 0.28s ease;
  background: var(--cc-surface);
  box-shadow: -6px 0 24px rgba(15, 23, 42, 0.06);
}

.user-search-detail.is-open {
  flex: 0 0 50%;
  min-width: 0;
  border-left-color: var(--cc-border);
}

.user-search-detail-inner {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 18px 18px;
  box-sizing: border-box;
  transform: translateX(100%);
  transition: transform 0.28s ease;
  overflow-y: auto;
}

.user-search-detail.is-open .user-search-detail-inner {
  transform: translateX(0);
}

.user-search-detail-hero {
  text-align: center;
  margin-bottom: 20px;
}

.user-search-detail-avatar-wrap {
  width: 88px;
  height: 88px;
  margin: 0 auto 14px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
  box-shadow: var(--cc-shadow-md);
}

.user-search-detail-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-search-detail-avatar-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: var(--cc-text-muted);
}

.user-search-detail-name {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--cc-text);
}

.user-search-detail-meta {
  margin: 0;
  font-size: 13px;
  color: var(--cc-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.user-search-detail-id {
  color: var(--cc-text-sub);
  font-variant-numeric: tabular-nums;
}

.user-search-detail-fields {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.user-search-detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.user-search-detail-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--cc-text-sub);
}

.user-search-detail-value {
  color: var(--cc-text);
  line-height: 1.5;
  word-break: break-word;
}

.user-search-detail-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  padding-top: 4px;
}

.user-search-action-btn {
  width: 100%;
}

.user-search-self-note {
  margin: 0;
  font-size: 13px;
  color: var(--cc-text-muted);
  text-align: center;
}
</style>
