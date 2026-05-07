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
      <section class="conv-profile-edit__section conv-profile-edit__section--avatar">
        <button
          class="conv-profile-edit__avatar-trigger"
          type="button"
          :disabled="isSaving || isUploadingAvatar"
          @click="triggerAvatarUpload"
        >
          <img
            v-if="currentAvatarUrl"
            :src="currentAvatarUrl"
            alt="会话头像"
            class="conv-profile-edit__avatar-img"
          />
          <span v-else class="conv-profile-edit__avatar-fallback">{{
            editableName.trim().charAt(0).toUpperCase() || "群"
          }}</span>
          <span class="conv-profile-edit__avatar-mask">{{
            isUploadingAvatar ? "上传中..." : "更换头像"
          }}</span>
        </button>
        <div class="conv-profile-edit__avatar-tip">
          支持 JPG/PNG/WebP，最大 5MB
        </div>
        <input
          ref="avatarInputRef"
          class="conv-profile-edit__avatar-input"
          type="file"
          accept="image/*"
          @change="handleAvatarFileChange"
        />
      </section>

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
import { computed, onUnmounted, ref, watch } from "vue";
import { X } from "lucide-vue-next";
import toast from "@/commons/utils/toast";
import { normalizeConversationAvatarUrl } from "@/commons/utils/avatar-url";
import {
  createImagePreviewUrl,
  revokeImagePreviewUrl,
  validateImageFile,
} from "@/commons/utils/image";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { useFileUploadStore } from "@/store/message/fileUpload";

const props = defineProps<{
  convId: number;
  initialName: string;
  initialAvatar: string;
  initialDescription: string;
  initialEnableReadReceipt: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [
    payload: {
      convName: string;
      convAvatar: string;
      convDescription: string;
      enableReadReceipt: boolean;
    }
  ];
}>();

const conversationInfoStore = useConversationInfoStore();
const fileUploadStore = useFileUploadStore();
const isSaving = ref(false);
const isUploadingAvatar = ref(false);
const editableName = ref("");
const editableDescription = ref("");
const editableEnableReadReceipt = ref(false);
/** 头像文件 input 引用；用于点击圆形头像触发系统文件选择。 */
const avatarInputRef = ref<HTMLInputElement | null>(null);
/** 待上传头像文件；用于点保存时走 MINIO 分片上传并回填 convAvatar。 */
const stagedAvatarFile = ref<File | null>(null);
/** 头像本地预览 URL；用于保存前即时回显用户新选择的头像。 */
const stagedAvatarPreviewUrl = ref("");
/** 新头像 fileId（上传成功后）；用于提交 convAvatar 到会话更新接口。 */
const uploadedAvatarFileId = ref("");

const currentAvatarUrl = computed(() => {
  if (stagedAvatarPreviewUrl.value) return stagedAvatarPreviewUrl.value;
  return normalizeConversationAvatarUrl(
    uploadedAvatarFileId.value || props.initialAvatar
  );
});

const hasChanges = computed(() => {
  return (
    editableName.value.trim() !== props.initialName.trim() ||
    editableDescription.value.trim() !== props.initialDescription.trim() ||
    editableEnableReadReceipt.value !== props.initialEnableReadReceipt ||
    !!stagedAvatarFile.value ||
    uploadedAvatarFileId.value !== props.initialAvatar
  );
});

/**
 * 清理已创建的头像预览 URL。
 * 使用场景：切换文件、取消编辑、组件卸载时释放 URL 对象避免内存泄漏。
 */
const clearStagedAvatarPreview = () => {
  if (stagedAvatarPreviewUrl.value) {
    revokeImagePreviewUrl(stagedAvatarPreviewUrl.value);
    stagedAvatarPreviewUrl.value = "";
  }
};

watch(
  () => [
    props.initialName,
    props.initialAvatar,
    props.initialDescription,
    props.initialEnableReadReceipt,
  ],
  () => {
    clearStagedAvatarPreview();
    stagedAvatarFile.value = null;
    uploadedAvatarFileId.value = props.initialAvatar;
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
  clearStagedAvatarPreview();
  stagedAvatarFile.value = null;
  uploadedAvatarFileId.value = props.initialAvatar;
  editableName.value = props.initialName;
  editableDescription.value = props.initialDescription;
  editableEnableReadReceipt.value = props.initialEnableReadReceipt;
  emit("close");
};

/**
 * 触发头像文件选择器。
 * 使用场景：用户点击编辑抽屉顶部圆形头像时选择新图片。
 */
const triggerAvatarUpload = () => {
  avatarInputRef.value?.click();
};

/**
 * 处理头像文件选择并生成本地预览。
 * 使用场景：保存前先展示用户选中的新头像，待点击保存后再上传到 MINIO。
 */
const handleAvatarFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const nextFile = input.files?.[0] ?? null;
  if (!nextFile) {
    input.value = "";
    return;
  }
  const validation = validateImageFile(nextFile, {
    maxSizeBytes: 50 * 1024 * 1024,
  });
  if (!validation.ok) {
    toast.error(validation.message || "头像文件不合法");
    input.value = "";
    return;
  }
  clearStagedAvatarPreview();
  stagedAvatarFile.value = nextFile;
  uploadedAvatarFileId.value = "";
  stagedAvatarPreviewUrl.value = createImagePreviewUrl(nextFile);
  input.value = "";
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
    let nextAvatarFileId = uploadedAvatarFileId.value;
    if (stagedAvatarFile.value) {
      isUploadingAvatar.value = true;
      const uploadResult = await fileUploadStore.uploadFile({
        file: stagedAvatarFile.value,
        convId: props.convId,
        mimeType: stagedAvatarFile.value.type || "image/jpeg",
      });
      nextAvatarFileId = uploadResult.fileId;
      uploadedAvatarFileId.value = nextAvatarFileId;
      stagedAvatarFile.value = null;
      clearStagedAvatarPreview();
      toast.success("会话头像上传成功");
    }
    /**
     * 群资料更新载荷；用于统一提交会话基础信息并回写 Pinia 会话摘要。
     */
    const profilePayload = {
      convName: nextName,
      convAvatar: nextAvatarFileId,
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
    isUploadingAvatar.value = false;
    isSaving.value = false;
  }
};

onUnmounted(() => {
  clearStagedAvatarPreview();
});
</script>

<style scoped>
@import "@/assets/styles/conv-profile-edit.css";
@import "@/assets/styles/night/conv-profile-edit-night.css";
</style>
