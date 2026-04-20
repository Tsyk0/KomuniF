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
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useConvCreateStore } from "@/stores/conv/conv-create";
import { conversationCreateApi } from "@/apis/chat/conversation-create";
import toast from "@/commons/utils/toast";

const emit = defineEmits<{
  exit: [];
  created: [convId: number];
}>();

const convCreateStore = useConvCreateStore();

const convName = ref("");
const submitting = ref(false);

const canSubmit = computed(() => {
  const name = convName.value.trim();
  return name.length > 0 && convCreateStore.selectedCount >= 1;
});

async function submit() {
  const name = convName.value.trim();
  if (!name) {
    toast.error("请填写群名称");
    return;
  }
  if (convCreateStore.selectedCount < 1) {
    toast.error("请在左侧至少选择 1 位好友");
    return;
  }

  const memberUserIds = [...convCreateStore.selectedFriendIds]
    .map(Number)
    .filter((id) => id > 0);
  if (memberUserIds.length < 1) {
    toast.error("成员 ID 无效");
    return;
  }

  submitting.value = true;
  try {
    const resp = await conversationCreateApi.createConversation({
      single: false,
      memberUserIds,
      convName: name,
    });

    if (resp.code !== 200 || !resp.data?.success || resp.data.convId == null) {
      toast.error(resp.message || resp.data?.message || "创建群聊失败");
      return;
    }

    toast.success(resp.data.message || "创建成功");
    emit("created", Number(resp.data.convId));
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    toast.error(
      err?.response?.data?.message ||
        err?.message ||
        "创建群聊失败，请稍后重试"
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
@import "@/assets/styles/conv-create-panel.css";
</style>
