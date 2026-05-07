<template>
  <div class="conv-create-panel conv-create-panel--main-area user-search-root">
    <header class="conv-create-toolbar">
      <button type="button" class="conv-create-tool-btn" @click="emit('exit')">
        退出
      </button>
      <h3 class="conv-create-toolbar-title">找群入群</h3>
      <button
        type="button"
        class="conv-create-tool-btn conv-create-tool-btn--accent"
        @click="convCreateStore.setPanel('add-friend')"
      >
        添加好友
      </button>
    </header>

    <div class="user-search-body">
      <div class="user-search-left">
        <div class="user-search-field">
          <label class="conv-create-label" for="conv-search-input"
            >搜索群聊</label
          >
          <input
            id="conv-search-input"
            v-model="keyword"
            class="conv-create-input user-search-input"
            type="search"
            maxlength="64"
            placeholder="输入群名称关键词"
            autocomplete="off"
            @input="scheduleSearch"
            @blur="onSearchBlur"
          />
        </div>

        <div class="user-search-list-region">
          <div
            v-if="listError"
            class="user-search-banner user-search-banner--error"
          >
            {{ listError }}
          </div>
          <div
            v-else-if="searching && groups.length === 0"
            class="conv-create-empty user-search-status"
          >
            搜索中…
          </div>
          <div
            v-else-if="!searching && lastSearchedKeyword && groups.length === 0"
            class="conv-create-empty user-search-status"
          >
            未找到相关群聊
          </div>
          <div
            v-else-if="!lastSearchedKeyword"
            class="conv-create-empty user-search-status"
          >
            输入关键词开始搜索（失焦或短暂停顿后查询）
          </div>

          <ul v-else class="user-search-list">
            <li v-for="g in groups" :key="String(g.convId)">
              <ConvSearchResultItem
                :conversation="g"
                :selected="
                  selectedGroup != null &&
                  Number(selectedGroup.convId) === Number(g.convId)
                "
                @select="onPickGroup"
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
        </div>
      </div>

      <div
        class="user-search-detail is-open"
        :aria-hidden="selectedGroup == null"
      >
        <div class="user-search-detail-inner">
          <template v-if="selectedGroup">
            <div class="user-search-detail-hero">
              <div class="user-search-detail-avatar-wrap">
                <img
                  v-if="selectedGroupAvatar"
                  :src="selectedGroupAvatar"
                  alt=""
                  class="user-search-detail-avatar"
                  @error="selectedGroupAvatarBroken = true"
                />
                <div v-else class="user-search-detail-avatar-ph">
                  {{ selectedGroupInitial }}
                </div>
              </div>
              <h4 class="user-search-detail-name">
                {{ selectedGroupDisplayName }}
              </h4>
              <p class="user-search-detail-meta">
                <span class="user-search-detail-id"
                  >ID {{ selectedGroup.convId ?? "暂未设置" }}</span
                >
                <span>成员 {{ selectedGroupMemberCount }}</span>
              </p>
            </div>
            <div class="user-search-detail-fields">
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">群名称</span>
                <span class="user-search-detail-value">{{
                  formatOptionalText(selectedGroup.convName)
                }}</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">群头像</span>
                <span class="user-search-detail-value">{{
                  selectedGroup.convAvatar ? "已设置" : "暂未设置"
                }}</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">我的群备注</span>
                <span class="user-search-detail-value">{{
                  formatOptionalText(selectedGroup.privateDisplayName)
                }}</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">群类型</span>
                <span class="user-search-detail-value">群聊</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">当前成员数</span>
                <span class="user-search-detail-value">{{
                  formatOptionalNumber(selectedGroup.currentMemberCount)
                }}</span>
              </div>
              <div class="user-search-detail-row">
                <span class="user-search-detail-label">最大成员数</span>
                <span class="user-search-detail-value">{{
                  formatOptionalNumber(selectedGroup.maxMemberCount)
                }}</span>
              </div>
            </div>
            <div class="user-search-detail-actions">
              <button
                type="button"
                class="conv-create-btn primary user-search-action-btn"
                :disabled="groupJoinSubmitting"
                @click.stop="applyJoinGroup"
              >
                {{ groupJoinSubmitting ? "提交中…" : "申请加入" }}
              </button>
            </div>
          </template>
          <template v-else>
            <div class="user-search-detail-hero">
              <h4 class="user-search-detail-name">群聊详情</h4>
              <p class="user-search-detail-meta">
                从左侧选择一个群聊后，这里会显示详细信息。
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useConvCreateStore } from "@/store/conv/convCreate";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import { getConversationDisplayName } from "@/commons/utils/conversation-display";
import { normalizeConversationAvatarUrl } from "@/commons/utils/avatar-url";
import { searchGroupsApi } from "@/apis/user-search";
import { notificationApi } from "@/apis/notification";
import toast from "@/commons/utils/toast";
import ConvSearchResultItem from "./ConvSearchResultItem.vue";

const emit = defineEmits<{ exit: [] }>();
const convCreateStore = useConvCreateStore();

const keyword = ref("");
const groups = ref<ConversationSummaryDTO[]>([]);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const searching = ref(false);
const loadingMore = ref(false);
const listError = ref("");
const lastSearchedKeyword = ref("");
const selectedGroup = ref<ConversationSummaryDTO | null>(null);
const selectedGroupAvatarBroken = ref(false);
const groupJoinSubmitting = ref(false);
let debounceTimer: number | null = null;
const UNSET_TEXT = "暂未设置";

const canLoadMore = computed(
  () =>
    !!lastSearchedKeyword.value &&
    !listError.value &&
    groups.value.length < total.value
);
const selectedGroupDisplayName = computed(() => {
  return (
    getConversationDisplayName(selectedGroup.value) ||
    `群聊#${selectedGroup.value?.convId || "-"}`
  );
});
const selectedGroupInitial = computed(() => {
  return selectedGroupDisplayName.value.charAt(0).toUpperCase() || "群";
});
const selectedGroupAvatar = computed(() => {
  if (selectedGroupAvatarBroken.value || !selectedGroup.value) return "";
  return normalizeConversationAvatarUrl(selectedGroup.value.convAvatar) || "";
});
const selectedGroupMemberCount = computed(() => {
  const current = formatOptionalNumber(selectedGroup.value?.currentMemberCount);
  const max = formatOptionalNumber(selectedGroup.value?.maxMemberCount);
  return `${current}/${max}`;
});

watch(selectedGroup, () => {
  selectedGroupAvatarBroken.value = false;
});

function scheduleSearch() {
  if (debounceTimer != null) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    void runSearch(true);
  }, 300);
}

function onSearchBlur() {
  if (debounceTimer != null) window.clearTimeout(debounceTimer);
  debounceTimer = null;
  void runSearch(true);
}

async function runSearch(reset: boolean) {
  const kw = keyword.value.trim();
  if (!kw) {
    groups.value = [];
    total.value = 0;
    page.value = 1;
    listError.value = "";
    lastSearchedKeyword.value = "";
    selectedGroup.value = null;
    return;
  }
  if (reset) {
    page.value = 1;
    selectedGroup.value = null;
  }
  searching.value = true;
  listError.value = "";
  try {
    const resp = await searchGroupsApi({
      keyword: reset ? kw : lastSearchedKeyword.value || kw,
      page: page.value,
      pageSize,
      convType: 2,
    });
    if (resp.code !== 200 || !resp.data) {
      if (reset) listError.value = resp.message || "搜索群聊失败";
      return;
    }
    const data = resp.data;
    const incoming = Array.isArray(data.conversations)
      ? data.conversations
      : Array.isArray(data.convList)
      ? data.convList
      : [];
    groups.value = reset
      ? incoming
      : [
          ...groups.value,
          ...incoming.filter(
            (g) =>
              !groups.value.some((x) => Number(x.convId) === Number(g.convId))
          ),
        ];
    total.value = Number(data.total) || groups.value.length;
    lastSearchedKeyword.value = reset ? kw : lastSearchedKeyword.value;
  } catch (e: any) {
    if (reset)
      listError.value =
        e?.response?.data?.message || e?.message || "搜索群聊失败";
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

function onPickGroup(group: ConversationSummaryDTO) {
  selectedGroup.value = group;
}

/**
 * 将后端可空文本字段转成详情区展示文案。
 * 使用场景：群聊搜索详情展示未设置群名、群备注等资料时兜底。
 */
function formatOptionalText(value: unknown): string {
  if (value == null) return UNSET_TEXT;
  const trimmed = String(value).trim();
  return trimmed || UNSET_TEXT;
}

/**
 * 将后端可空数字段转成详情区展示文案。
 * 使用场景：群聊搜索详情展示成员数为空或异常时兜底。
 */
function formatOptionalNumber(value: unknown): string {
  if (value == null || value === "") return UNSET_TEXT;
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : UNSET_TEXT;
}

async function applyJoinGroup() {
  const convId = Number(selectedGroup.value?.convId || 0);
  if (!Number.isFinite(convId) || convId <= 0) {
    toast.error("无效的群聊 ID");
    return;
  }
  groupJoinSubmitting.value = true;
  try {
    const resp = await notificationApi.createGroupJoinRequest(convId, {});
    if (resp.code !== 200) {
      toast.error(resp.message || "提交申请失败");
      return;
    }
    toast.success("已提交申请");
  } catch (e: any) {
    toast.error(e?.response?.data?.message || e?.message || "提交申请失败");
  } finally {
    groupJoinSubmitting.value = false;
  }
}

onUnmounted(() => {
  if (debounceTimer != null) window.clearTimeout(debounceTimer);
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
  overflow: hidden;
}

.user-search-left {
  flex: 1 1 50%;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  padding: 16px;
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
}

.user-search-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-search-detail {
  flex: 1 1 50%;
  min-width: 300px;
  border-left: 1px solid var(--cc-border);
  background: var(--cc-surface);
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
}

.user-search-detail-id {
  color: var(--cc-text-sub);
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
  letter-spacing: 0.04em;
  color: var(--cc-text-sub);
}

.user-search-detail-value {
  color: var(--cc-text);
}

.user-search-detail-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-search-action-btn {
  width: 100%;
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

.user-search-status {
  margin-top: 8px;
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
}
</style>
