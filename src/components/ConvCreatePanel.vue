<!-- File: src/components/ConvCreatePanel.vue -->
<template>
  <div class="conv-create-panel conv-create-panel--main-area">
    <header class="conv-create-toolbar">
      <button type="button" class="conv-create-tool-btn" @click="emit('exit')">
        退出
      </button>
      <h3 class="conv-create-toolbar-title">新建群聊</h3>
      <button
        type="button"
        class="conv-create-tool-btn conv-create-tool-btn--accent"
        @click="convCreateStore.setPanel('add-friend')"
      >
        添加好友
      </button>
    </header>

    <div class="conv-create-body conv-create-body--centered">
      <label class="conv-create-label">群名称（必填）</label>
      <input
        v-model="convName"
        class="conv-create-input"
        type="text"
        maxlength="64"
        placeholder="例如：项目讨论"
        autocomplete="off"
      />

      <p class="conv-create-hint">
        在左侧好友列表中勾选成员，然后在下方创建群聊（不含自己；你将自动入群）
      </p>

      <p class="conv-create-selected-count">
        已选择 <strong>{{ convCreateStore.selectedCount }}</strong> 位好友
      </p>

      <div class="conv-create-actions">
        <button
          type="button"
          class="conv-create-submit-btn conv-create-reset-btn"
          :disabled="submitting"
          @click="resetDraft"
        >
          重置
        </button>
        <button
          type="button"
          class="conv-create-submit-btn"
          :disabled="!canSubmit || submitting"
          @click="submit"
        >
          {{ submitting ? "创建中…" : "将选中好友加入群聊" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useConvCreateStore } from "@/store/conv/convCreate";
import toast from "@/commons/utils/toast";
import {
  canSubmitConvCreate,
  normalizeSelectedMemberIds,
  validateConvCreateDraft,
} from "@/interactions/convCreatePanel/ConvCreatePanelInteraction";

const emit = defineEmits<{
  exit: [];
  created: [convId: number];
}>();

const convCreateStore = useConvCreateStore();

const submitting = ref(false);
const convName = computed({
  get: () => convCreateStore.draftConvName,
  set: (value: string) => convCreateStore.setDraftConvName(value),
});

const canSubmit = computed(() => {
  return canSubmitConvCreate({
    draftConvName: convName.value,
    selectedCount: convCreateStore.selectedCount,
  });
});

function resetDraft() {
  convCreateStore.resetDraft();
}

async function submit() {
  const validationMessage = validateConvCreateDraft({
    draftConvName: convName.value,
    selectedCount: convCreateStore.selectedCount,
  });
  if (validationMessage) {
    toast.error(validationMessage);
    return;
  }
  const name = convName.value.trim();

  const memberUserIds = normalizeSelectedMemberIds(convCreateStore.selectedFriendIds);
  if (memberUserIds.length < 1) {
    toast.error("成员 ID 无效");
    return;
  }

  submitting.value = true;
  try {
    const result = await convCreateStore.createGroupConversation({
      convName: name,
      memberUserIds,
    });
    if (!result.ok || result.convId == null) {
      toast.error(result.message || "创建群聊失败");
      return;
    }

    toast.success(result.message || "创建成功");
    convCreateStore.resetDraft();
    emit("created", Number(result.convId));
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
@import "@/assets/styles/conv-create-panel.css";
</style>
