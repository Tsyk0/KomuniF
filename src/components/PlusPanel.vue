<template>
  <div class="plus-panel">
    <header class="plus-panel-tabs">
      <button
        type="button"
        class="plus-panel-tab"
        :class="{ active: activePanel === 'group' }"
        @click="switchPanel('group')"
      >
        新建群聊
      </button>
      <button
        type="button"
        class="plus-panel-tab"
        :class="{ active: activePanel === 'add-friend' }"
        @click="switchPanel('add-friend')"
      >
        找人
      </button>
      <button
        type="button"
        class="plus-panel-tab"
        :class="{ active: activePanel === 'search-conv' }"
        @click="switchPanel('search-conv')"
      >
        找群
      </button>
    </header>

    <div class="plus-panel-viewport">
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

.plus-panel-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  padding: 0 30px;
  min-height: 70px;
  border-bottom: 1px solid rgba(240, 240, 240, 0.8);
  background: transparent;
  box-sizing: border-box;
  align-items: stretch;
}

.plus-panel-tab {
  height: auto;
  min-height: 50px;
  font-size: 15px;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.42);
  color: var(--cc-text-sub);
  cursor: pointer;
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.plus-panel-tab:hover {
  background: rgba(255, 255, 255, 0.56);
}

.plus-panel-tab.active {
  color: var(--cc-text);
  border-color: rgba(15, 23, 42, 0.5);
  background: rgba(255, 255, 255, 0.58);
}

html.night-mode .plus-panel-tabs {
  background: transparent;
  border-bottom-color: rgba(240, 240, 240, 0.16);
}

html.night-mode .plus-panel-tab {
  color: #ffffff;
  border-color: transparent;
  background: rgba(15, 23, 42, 0.5);
}

html.night-mode .plus-panel-tab:hover {
  background: rgba(51, 65, 85, 0.62);
}

html.night-mode .plus-panel-tab.active {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.72);
  background: rgba(30, 41, 59, 0.58);
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
