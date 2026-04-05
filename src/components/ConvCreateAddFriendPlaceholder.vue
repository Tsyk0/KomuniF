<template>
  <div class="conv-create-panel conv-add-friend-placeholder">
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
    <div class="conv-add-friend-body">
      <p class="conv-add-friend-tip">添加好友功能即将接入，敬请期待。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConvCreateStore } from "@/stores/chat/conv-create";

const convCreateStore = useConvCreateStore();

const emit = defineEmits<{
  exit: [];
}>();
</script>

<style scoped>
@import "@/assets/styles/conv-create-panel.css";
.conv-add-friend-placeholder {
  border-radius: 0;
}
.conv-add-friend-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.conv-add-friend-tip {
  margin: 0;
  font-size: 15px;
  color: var(--cc-text-muted, #64748b);
  text-align: center;
  line-height: 1.6;
}
</style>
