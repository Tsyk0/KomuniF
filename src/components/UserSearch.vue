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
        @click="convCreateStore.setPanel('search-conv')"
      >
        找群入群
      </button>
    </header>

    <div class="user-search-body">
      <div
        class="user-search-left"
        :class="{ 'is-compact': selectedUser != null }"
        @click="onLeftPaneClick"
      >
        <div class="user-search-field" @click.stop>
          <label class="conv-create-label" for="user-search-input">搜索用户</label>
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

      <div class="user-search-detail" :aria-hidden="false">
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
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">个性签名</span>
                <span class="user-search-detail-value">{{
                  formatOptionalText(selectedUser.userSignature)
                }}</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">所在地区</span>
                <span class="user-search-detail-value">{{
                  formatOptionalText(selectedUser.userLocation)
                }}</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">用户生日</span>
                <span class="user-search-detail-value">{{
                  formatOptionalText(selectedUser.userBirthday)
                }}</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">电子邮箱</span>
                <span class="user-search-detail-value">{{
                  formatOptionalText(selectedUser.userEmail)
                }}</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">手机号码</span>
                <span class="user-search-detail-value">{{
                  formatOptionalText(selectedUser.userPhone)
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
          <template v-else>
            <div class="user-search-detail-hero">
              <h4 class="user-search-detail-name">用户详情</h4>
              <p class="user-search-detail-meta">从左侧选择一位用户后，这里会显示详细信息。</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import { useConvCreateStore } from "@/store/conv/convCreate";
import { useFriendStore } from "@/store/friend/showFriend";
import { useUserStore } from "@/store/user/user";
import type { User } from "@/entity/user";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import toast from "@/commons/utils/toast";
import UserSearchResultItem from "./UserSearchResultItem.vue";
import {
  buildSyncHint,
  canLoadMoreUsers,
  executeFriendRequestFlow,
  executeUserSearchFlow,
  isSelfUser,
  mapFriendRequestErrorMessage,
  mapUserSearchErrorMessage,
  resolveDetailGender,
  resolveDetailInitial,
  resolveDetailNickname,
  resolveSelfUserId,
  shouldClearUserDetailOnPaneClick,
} from "@/interactions/userSearch/UserSearchInteraction";

const DEBOUNCE_MS = 300;
const UNSET_TEXT = "暂未设置";

const emit = defineEmits<{
  exit: [];
  /** 预留：与某用户发起会话（待后端接口对接） */
  "send-message": [user: User];
}>();

const convCreateStore = useConvCreateStore();
const friendStore = useFriendStore();
const authStore = useUserStore();

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
  return resolveSelfUserId(authStore.user?.userId);
});

const syncHint = computed(() => {
  return buildSyncHint(total.value, users.value.length);
});

const canLoadMore = computed(() => {
  return canLoadMoreUsers({
    hasKeyword: !!lastSearchedKeyword.value,
    hasError: !!listError.value,
    loaded: users.value.length,
    total: total.value,
  });
});

const detailNickname = computed(() => {
  return resolveDetailNickname(selectedUser.value);
});

const detailInitial = computed(() =>
  resolveDetailInitial(detailNickname.value)
);

const detailGender = computed(() => {
  return resolveDetailGender(selectedUser.value?.userGender);
});

const detailAvatar = computed(() => {
  if (detailAvatarBroken.value || !selectedUser.value) return "";
  return normalizeAvatarUrl(selectedUser.value.userAvatar) || "";
});

watch(selectedUser, () => {
  detailAvatarBroken.value = false;
});

function isSelf(u: User): boolean {
  return isSelfUser(selfUserId.value, u);
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
  if (reset) {
    page.value = 1;
    selectedUser.value = null;
  }
  searching.value = true;
  listError.value = "";
  try {
    const result = await executeUserSearchFlow({
      keyword: kw,
      reset,
      page: page.value,
      pageSize,
      lastSearchedKeyword: lastSearchedKeyword.value,
      prevUsers: users.value,
      searchUsers: (params) => friendStore.searchUsers(params),
    });
    if (result.clearAll) {
      users.value = [];
      total.value = 0;
      lastSearchedKeyword.value = "";
      listError.value = "";
      selectedUser.value = null;
      return;
    }
    if (result.rollbackPage && page.value > 1) {
      page.value -= 1;
    }
    if (result.listError) {
      if (reset) listError.value = result.listError;
      else toast.error(result.listError);
      return;
    }
    if (result.users) users.value = result.users;
    if (typeof result.total === "number") total.value = result.total;
    if (typeof result.lastSearchedKeyword === "string") {
      lastSearchedKeyword.value = result.lastSearchedKeyword;
    }
  } catch (e: unknown) {
    const msg = mapUserSearchErrorMessage(e);
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

/**
 * 将后端可空资料字段转成详情区展示文案。
 * 使用场景：用户搜索详情展示未设置生日、签名、邮箱等资料时兜底。
 */
function formatOptionalText(value: unknown): string {
  if (value == null) return UNSET_TEXT;
  const trimmed = String(value).trim();
  return trimmed || UNSET_TEXT;
}

function onLeftPaneClick(e: MouseEvent) {
  const el = e.target as HTMLElement | null;
  if (shouldClearUserDetailOnPaneClick(el)) selectedUser.value = null;
}

async function sendFriendRequest() {
  const u = selectedUser.value;
  const targetId = u?.userId;
  friendRequestSending.value = true;
  try {
    const result = await executeFriendRequestFlow({
      targetUserId: targetId,
      isSelfTarget: !!u && isSelf(u),
      sendFriendRequest: (id) => friendStore.sendFriendRequest(id),
    });
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  } catch (e: unknown) {
    toast.error(mapFriendRequestErrorMessage(e));
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
  min-width: 300px;
}

.user-search-field {
  flex-shrink: 0;
}

.user-search-mode-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.user-search-mode-btn {
  border: 1px solid var(--cc-border-strong);
  background: var(--cc-surface);
  color: var(--cc-text-sub);
  border-radius: 999px;
  padding: 4px 12px;
  cursor: pointer;
}

.user-search-mode-btn.active {
  color: var(--cc-accent);
  border-color: var(--cc-accent);
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

.user-search-group-item {
  border: 1px solid var(--cc-border);
  border-radius: var(--cc-radius-sm);
  padding: 10px 12px;
  cursor: pointer;
}

.user-search-group-item.selected {
  border-color: var(--cc-accent);
  background: var(--cc-accent-soft);
}

.user-search-group-item-title {
  font-size: 14px;
  font-weight: 600;
}

.user-search-group-item-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--cc-text-sub);
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
  flex: 0 0 50%;
  min-width: 300px;
  overflow: hidden;
  border-left: 1px solid var(--cc-border);
  background: var(--cc-surface);
  box-shadow: -6px 0 24px rgba(15, 23, 42, 0.06);
}

.user-search-detail-inner {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 18px 18px;
  box-sizing: border-box;
  overflow-y: auto;
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
