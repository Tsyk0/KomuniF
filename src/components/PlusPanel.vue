<template>
  <div class="plus-panel">
    <header class="plus-panel-header">
      <button
        type="button"
        class="plus-panel-header__back"
        aria-label="返回"
        title="返回"
        v-ripple
        @click="emit('exit')"
      >
        <ArrowLeft :size="22" :stroke-width="2.2" />
      </button>
      <h2 class="plus-panel-header__title">探索</h2>
      <div class="plus-panel-header__spacer" aria-hidden="true" />
    </header>

    <div class="plus-panel-segment-area">
      <div class="plus-panel-segment" role="tablist" aria-label="功能切换">
        <div class="plus-panel-segment__track">
          <div
            class="plus-panel-segment__thumb"
            :style="thumbStyle"
            aria-hidden="true"
          />
          <button
            type="button"
            role="tab"
            class="plus-panel-segment__tab"
            :class="{ active: activePanel === 'group' }"
            :aria-selected="activePanel === 'group'"
            id="plus-panel-tab-group"
            aria-controls="plus-panel-pages"
            @click="switchPanel('group')"
          >
            新建群聊
          </button>
          <button
            type="button"
            role="tab"
            class="plus-panel-segment__tab"
            :class="{ active: activePanel === 'add-friend' }"
            :aria-selected="activePanel === 'add-friend'"
            id="plus-panel-tab-add-friend"
            aria-controls="plus-panel-pages"
            @click="switchPanel('add-friend')"
          >
            找人
          </button>
          <button
            type="button"
            role="tab"
            class="plus-panel-segment__tab"
            :class="{ active: activePanel === 'search-conv' }"
            :aria-selected="activePanel === 'search-conv'"
            id="plus-panel-tab-search-conv"
            aria-controls="plus-panel-pages"
            @click="switchPanel('search-conv')"
          >
            找群
          </button>
        </div>
      </div>
    </div>

    <div
      id="plus-panel-pages"
      class="plus-panel-viewport"
      role="tabpanel"
      :aria-labelledby="
        activePanel === 'group'
          ? 'plus-panel-tab-group'
          : activePanel === 'add-friend'
          ? 'plus-panel-tab-add-friend'
          : 'plus-panel-tab-search-conv'
      "
    >
      <div class="plus-panel-track" :style="trackStyle">
        <section class="plus-panel-page">
          <ConvCreatePanel
            @exit="emit('exit')"
            @created="(convId) => emit('created', convId)"
          />
        </section>
        <section class="plus-panel-page">
          <UserSearch
            @exit="emit('exit')"
            @send-message="(user) => emit('send-message', user)"
          />
        </section>
        <section class="plus-panel-page">
          <ConvSearch @exit="emit('exit')" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ArrowLeft } from "lucide-vue-next";
import {
  useConvCreateStore,
  type ConvCreatePanel as ConvCreatePanelType,
} from "@/store/conv/convCreate";
import type { User } from "@/entity/user";
import ConvCreatePanel from "./ConvCreatePanel.vue";
import UserSearch from "./UserSearch.vue";
import ConvSearch from "./ConvSearch.vue";

const emit = defineEmits<{
  exit: [];
  created: [convId: number];
  "send-message": [user: User];
}>();

const convCreateStore = useConvCreateStore();
const panelOrder: ConvCreatePanelType[] = [
  "group",
  "add-friend",
  "search-conv",
];
const activePanel = ref<ConvCreatePanelType>(
  panelOrder.includes(convCreateStore.panel) ? convCreateStore.panel : "group"
);

watch(
  () => convCreateStore.panel,
  (panel) => {
    if (panelOrder.includes(panel)) {
      activePanel.value = panel;
    }
  }
);

const currentIndex = computed(() =>
  Math.max(0, panelOrder.indexOf(activePanel.value))
);
const trackStyle = computed(() => ({
  transform: `translateX(-${currentIndex.value * 100}%)`,
}));

/** 顶部分段胶囊内滑块位置（三项等分），与通知中心 sys-notif-segment 交互一致 */
const thumbStyle = computed(() => ({
  transform: `translateX(calc(${currentIndex.value} * (100% + 4px)))`,
}));

function switchPanel(panel: ConvCreatePanelType) {
  activePanel.value = panel;
  convCreateStore.setPanel(panel);
}
</script>

<style scoped>
.plus-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

/* 顶栏：对齐 UserProfileEdit .edit-header */
.plus-panel-header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(240, 240, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  min-height: 70px;
  box-sizing: border-box;
  background: #ffffff;
}

.plus-panel-header__title {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 700;
  white-space: nowrap;
}

.plus-panel-header__back {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #6b7280;
  box-shadow: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.plus-panel-header__back:hover {
  background: rgba(107, 114, 128, 0.12);
  color: #6b7280;
}

.plus-panel-header__back:active {
  background: rgba(107, 114, 128, 0.2);
}

.plus-panel-header__spacer {
  width: 44px;
  min-width: 44px;
  height: 44px;
}

html.night-mode .plus-panel-header {
  background: #18181b;
  border-bottom-color: rgba(55, 65, 81, 0.8);
}

html.night-mode .plus-panel-header__title {
  color: #ffffff;
}

html.night-mode .plus-panel-header__back {
  color: #9ca3af;
}

html.night-mode .plus-panel-header__back:hover {
  background: rgba(156, 163, 175, 0.16);
  color: #9ca3af;
}

html.night-mode .plus-panel-header__back:active {
  background: rgba(156, 163, 175, 0.24);
}

/**
 * 分段胶囊：与通知中心 sys-notif-segment 同款（主题色滑块 + 横向滑动），此处为三等分。
 */
.plus-panel-segment-area {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 6px 0 12px;
  position: sticky;
  top: 0;
  z-index: 8;
  background: transparent;
}

.plus-panel-segment {
  width: 100%;
  max-width: 520px;
  padding: 0 16px;
  box-sizing: border-box;
}

.plus-panel-segment__track {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-sizing: border-box;
}

.plus-panel-segment__thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc((100% - 16px) / 3);
  height: calc(100% - 8px);
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    var(--theme-primary, #0ea5e9) 0%,
    var(--theme-primary-strong, #0284c7) 100%
  );
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  z-index: 0;
  pointer-events: none;
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.plus-panel-segment__tab {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  padding: 10px 8px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--cc-text-sub, #475569);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  transition: color 0.22s ease, transform 0.15s ease;
}

.plus-panel-segment__tab:hover {
  color: var(--cc-text, #0f172a);
}

.plus-panel-segment__tab.active {
  color: #ffffff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.12);
}

.plus-panel-segment__tab:active {
  transform: scale(0.98);
}

.plus-panel-segment__tab:focus-visible {
  outline: 2px solid var(--theme-focus-ring, rgba(14, 165, 233, 0.45));
  outline-offset: 2px;
}

html.night-mode .plus-panel-segment__track {
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(148, 163, 184, 0.28);
}

html.night-mode .plus-panel-segment__thumb {
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

html.night-mode .plus-panel-segment__tab {
  color: #cbd5e1;
}

html.night-mode .plus-panel-segment__tab:hover {
  color: #e2e8f0;
}

html.night-mode .plus-panel-segment__tab.active {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .plus-panel-segment__thumb {
    transition: none;
  }
}

.plus-panel-viewport {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.plus-panel-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 280ms ease;
  will-change: transform;
}

.plus-panel-page {
  flex: 0 0 100%;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  overflow: hidden;
}

/* 由 PlusPanel 统一控制导航，子面板自身 toolbar 隐藏 */
.plus-panel-page :deep(.conv-create-toolbar) {
  display: none;
}

/* 限制子组件内容宽度，避免右边界被撑开 */
.plus-panel-page :deep(.conv-create-panel),
.plus-panel-page :deep(.user-search-root) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
</style>
