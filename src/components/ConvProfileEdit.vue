<template>
  <aside class="conv-profile-edit" @click.stop>
    <div class="conv-profile-edit__header">
      <h3 class="conv-profile-edit__title">编辑群聊信息</h3>
      <button
        class="conv-profile-edit__close"
        type="button"
        title="关闭编辑面板"
        @click="emit('close')"
      >
        <X :size="22" :stroke-width="2.2" />
      </button>
    </div>

    <div class="conv-profile-edit__content">
      <section class="conv-profile-edit__section">
        <div class="conv-profile-edit__label">群聊名称</div>
        <input
          v-model="editableName"
          class="conv-profile-edit__input"
          type="text"
          maxlength="80"
          placeholder="请输入群聊名称"
        />
      </section>

      <section class="conv-profile-edit__section">
        <div class="conv-profile-edit__label">群公告</div>
        <textarea
          v-model="editableDescription"
          class="conv-profile-edit__textarea"
          rows="4"
          maxlength="300"
          placeholder="请输入群公告"
        />
      </section>

      <section class="conv-profile-edit__section">
        <div class="conv-profile-edit__switch-row">
          <span class="conv-profile-edit__label">已读回执</span>
          <el-switch v-model="editableEnableReadReceipt" />
        </div>
      </section>
    </div>

    <div class="conv-profile-edit__footer">
      <button
        class="conv-profile-edit__btn conv-profile-edit__btn--ghost"
        type="button"
        :disabled="isSaving"
        @click="handleCancel"
      >
        取消
      </button>
      <button
        class="conv-profile-edit__btn conv-profile-edit__btn--primary"
        type="button"
        :disabled="isSaving || !hasChanges"
        @click="handleSave"
      >
        {{ isSaving ? "保存中..." : "保存" }}
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { X } from "lucide-vue-next";
import toast from "@/commons/utils/toast";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";

const props = defineProps<{
  convId: number;
  initialName: string;
  initialDescription: string;
  initialEnableReadReceipt: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [
    payload: {
      convName: string;
      convDescription: string;
      enableReadReceipt: boolean;
    }
  ];
}>();

const conversationInfoStore = useConversationInfoStore();
const isSaving = ref(false);
const editableName = ref("");
const editableDescription = ref("");
const editableEnableReadReceipt = ref(false);

const hasChanges = computed(() => {
  return (
    editableName.value.trim() !== props.initialName.trim() ||
    editableDescription.value.trim() !== props.initialDescription.trim() ||
    editableEnableReadReceipt.value !== props.initialEnableReadReceipt
  );
});

watch(
  () => [props.initialName, props.initialDescription, props.initialEnableReadReceipt],
  () => {
    editableName.value = props.initialName;
    editableDescription.value = props.initialDescription;
    editableEnableReadReceipt.value = props.initialEnableReadReceipt;
  },
  { immediate: true }
);

/**
 * 取消编辑并关闭面板。
 * 使用场景：用户不想保存本次改动时，恢复初始值并退出编辑抽屉。
 */
const handleCancel = () => {
  editableName.value = props.initialName;
  editableDescription.value = props.initialDescription;
  editableEnableReadReceipt.value = props.initialEnableReadReceipt;
  emit("close");
};

/**
 * 保存群资料编辑内容。
 * 使用场景：群主在抽屉中修改群名/公告/已读回执后提交到后端并同步页面状态。
 */
const handleSave = async () => {
  if (!Number.isFinite(props.convId) || props.convId <= 0 || isSaving.value) return;
  const nextName = editableName.value.trim();
  const nextDescription = editableDescription.value.trim();
  if (!nextName) {
    toast.error("群聊名称不能为空");
    return;
  }

  isSaving.value = true;
  try {
    /**
     * 群资料更新载荷；用于统一提交会话基础信息并回写 Pinia 会话摘要。
     */
    const profilePayload = {
      convName: nextName,
      convDescription: nextDescription,
      enableReadReceipt: editableEnableReadReceipt.value,
    };
    await conversationInfoStore.persistConversationInfo(props.convId, profilePayload);
    emit("saved", profilePayload);
    toast.success("群聊信息已更新");
  } catch (saveError) {
    console.error("更新群聊信息失败:", saveError);
    toast.error("保存失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
@import "@/assets/styles/conv-profile-edit.css";
@import "@/assets/styles/night/conv-profile-edit-night.css";
</style>
