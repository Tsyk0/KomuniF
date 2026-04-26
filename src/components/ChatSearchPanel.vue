<!-- File: src/components/ChatSearchPanel.vue -->
<template>
  <div class="chat-search-overlay" role="dialog" aria-label="搜索消息" @keydown.esc.prevent="emitClose">
    <div class="chat-search-panel" @click.stop>
      <div class="chat-search-top">
        <div class="chat-search-input-wrap">
          <input
            ref="inputRef"
            v-model="keyword"
            class="chat-search-input"
            type="text"
            placeholder="搜索消息"
            autocomplete="off"
          />
          <button
            v-if="keyword"
            class="chat-search-clear"
            type="button"
            title="清除"
            @click="clearKeyword"
          >
            ×
          </button>
        </div>

        <button class="chat-search-close" type="button" title="关闭" @click="emitClose">
          关闭
        </button>
      </div>

      <div class="chat-search-body">
        <div v-if="hintText" class="chat-search-hint">{{ hintText }}</div>
        <div v-else-if="loading" class="chat-search-hint">搜索中...</div>
        <div v-else-if="error" class="chat-search-hint error">{{ error }}</div>

        <div v-else class="chat-search-results">
          <ChatSearchResultItem
            v-for="m in results"
            :key="m.messageId"
            :message="m"
            :conv-type="convTypeOrNull"
            @select="onSelectResult"
          />

          <div v-if="results.length === 0" class="chat-search-hint">未找到相关消息</div>

          <div v-if="canLoadMore" class="chat-search-more">
            <button type="button" class="chat-search-more-btn" :disabled="loadingMore" @click="loadMore">
              <span v-if="!loadingMore">加载更多</span>
              <span v-else>加载中...</span>
            </button>
            <div class="chat-search-meta">已加载 {{ results.length }} / {{ total }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-search-backdrop" @click="emitClose"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import ChatSearchResultItem from "@/components/ChatSearchResultItem.vue";
import type { DisplayMessage } from "@/entity/message";
import { useShowMessageStore } from "@/store/message/showMessage";
import { searchMessagesInConvFromDB } from "@/commons/utils/local-db";
import {
  buildChatSearchEmptyState,
  mapChatSearchErrorMessage,
  runChatMessageSearch,
} from "@/interactions/chatSearchPanel/ChatSearchPanelInteraction";

const props = defineProps<{
  open: boolean;
  convId: number | null;
  /** 与当前聊天一致，单聊时搜索结果头像与对方对齐 */
  convType?: number | null;
  pageSize?: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "jump-to-message", messageId: number): void;
}>();

const emitClose = () => emit("close");
const showMessageStore = useShowMessageStore();

const onSelectResult = (m: DisplayMessage) => {
  emit("jump-to-message", m.messageId);
};

const inputRef = ref<HTMLInputElement | null>(null);
const keyword = ref("");
const results = ref<DisplayMessage[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
/** 当前关键词下，结果是否完全来自 IndexedDB（加载更多也只翻本地） */
const searchSource = ref<"local" | "remote">("remote");

const convTypeOrNull = computed(() => (props.convType == null ? null : props.convType));

const effectivePageSize = computed(() =>
  props.pageSize == null ? 20 : props.pageSize
);

// 防抖：用户停止输入一小段时间后才发请求
let debounceTimer: number | null = null;

// 请求取消 + 竞态保护
let latestRequestId = 0;
let abortController: AbortController | null = null;

const hintText = computed(() => {
  if (!keyword.value.trim()) return "输入关键词开始搜索";
  return "";
});

const canLoadMore = computed(() => results.value.length > 0 && results.value.length < total.value);

const cancelInFlight = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
};

const clearKeyword = () => {
  const emptyState = buildChatSearchEmptyState();
  keyword.value = "";
  results.value = emptyState.results;
  total.value = emptyState.total;
  page.value = emptyState.page;
  error.value = emptyState.error;
  searchSource.value = emptyState.source;
  cancelInFlight();
};

const runSearch = async (nextPage: number) => {
  const kw = keyword.value.trim();
  if (!kw) {
    const emptyState = buildChatSearchEmptyState();
    results.value = emptyState.results;
    total.value = emptyState.total;
    page.value = emptyState.page;
    error.value = emptyState.error;
    searchSource.value = emptyState.source;
    cancelInFlight();
    return;
  }

  if (!props.convId) return;

  const requestId = ++latestRequestId;
  cancelInFlight();
  abortController = new AbortController();

  const isLoadMore = nextPage > 1;
  error.value = null;
  if (isLoadMore) loadingMore.value = true;
  else loading.value = true;

  try {
    const searchResult = await runChatMessageSearch({
      keyword: kw,
      convId: props.convId,
      nextPage,
      pageSize: effectivePageSize.value,
      requestId,
      latestRequestId,
      searchSource: searchSource.value,
      results: results.value,
      searchLocal: (convId, keyword, page, pageSize) =>
        searchMessagesInConvFromDB(convId, keyword, page, pageSize),
      searchRemote: ({ keyword, convId, page, pageSize, signal }) =>
        showMessageStore.searchMessages(
          { keyword, convId, page, pageSize },
          { signal }
        ),
      signal: abortController.signal,
    });
    if (!searchResult.requestMatched) return;
    searchSource.value = searchResult.source;
    results.value = searchResult.results;
    total.value = searchResult.total;
    page.value = searchResult.page;
  } catch (e: any) {
    const mappedError = mapChatSearchErrorMessage(e);
    if (!mappedError) return;
    if (requestId !== latestRequestId) return;
    error.value = mappedError;
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
};

const scheduleSearch = () => {
  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  debounceTimer = window.setTimeout(() => {
    page.value = 1;
    void runSearch(1);
  }, 300);
};

const loadMore = () => void runSearch(page.value + 1);

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      cancelInFlight();
      return;
    }
    await nextTick();
    inputRef.value?.focus();
  },
  { immediate: true }
);

watch(
  () => props.convId,
  () => {
    // 切换会话时重置搜索
    clearKeyword();
  }
);

watch(keyword, () => scheduleSearch());

onBeforeUnmount(() => {
  cancelInFlight();
  if (debounceTimer) window.clearTimeout(debounceTimer);
});
</script>

<style scoped>
.chat-search-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.chat-search-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
}

.chat-search-panel {
  position: relative;
  z-index: 1;
  height: 100%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

/* 夜晚模式适配（主题由 html.night-mode 控制） */
html.night-mode .chat-search-panel {
  background: rgba(2, 6, 23, 0.78);
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.35);
}

html.night-mode .chat-search-top {
  background: rgba(2, 6, 23, 0.9);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

html.night-mode .chat-search-input {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(226, 232, 240, 0.92);
}

html.night-mode .chat-search-input::placeholder {
  color: rgba(226, 232, 240, 0.5);
}

html.night-mode .chat-search-clear,
html.night-mode .chat-search-close {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(226, 232, 240, 0.9);
}

html.night-mode .chat-search-hint {
  color: rgba(226, 232, 240, 0.68);
}

html.night-mode .chat-search-hint.error {
  color: #fca5a5;
}

html.night-mode .chat-search-more-btn {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(226, 232, 240, 0.9);
}

html.night-mode .chat-search-meta {
  color: rgba(226, 232, 240, 0.6);
}

html.night-mode .chat-search-backdrop {
  background: rgba(0, 0, 0, 0.35);
}

.chat-search-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.96);
}

.chat-search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.chat-search-input {
  width: 100%;
  height: 38px;
  padding: 0 34px 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  outline: none;
  font-size: 14px;
  background: white;
}

.chat-search-input:focus {
  border-color: #3390ec;
  box-shadow: 0 0 0 3px rgba(51, 144, 236, 0.14);
}

.chat-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.06);
  color: #333;
}

.chat-search-close {
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: #333;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.chat-search-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 12px;
}

.chat-search-hint {
  color: #666;
  font-size: 13px;
  padding: 16px 6px;
  text-align: center;
}

.chat-search-hint.error {
  color: #c62828;
}

.chat-search-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-search-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 0 2px;
}

.chat-search-more-btn {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
  color: #333;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.chat-search-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-search-meta {
  font-size: 12px;
  color: #777;
}
</style>
