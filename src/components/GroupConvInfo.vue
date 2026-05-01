<template>
  <div class="group-conv-info">
    <div class="group-conv-info__header">
      <button
        v-if="isCurrentUserGroupOwner"
        class="group-conv-info__edit"
        type="button"
        title="编辑群聊信息"
        @click="openProfileEdit"
      >
        <Pencil :size="22" :stroke-width="2.2" />
      </button>
      <h2 class="group-conv-info__title">群聊详情</h2>
      <button
        class="group-conv-info__close"
        type="button"
        title="关闭群聊详情"
        @click="emit('close')"
      >
        <X :size="22" :stroke-width="2.2" />
      </button>
    </div>

    <div v-if="loading" class="group-conv-info__state">加载群聊信息中...</div>
    <div
      v-else-if="error"
      class="group-conv-info__state group-conv-info__state--error"
    >
      {{ error }}
    </div>

    <div v-else class="group-conv-info__content">
      <section class="group-section group-section--identity">
        <div class="group-identity-row">
          <div class="group-avatar">
            <img
              v-if="groupAvatarUrl"
              :src="groupAvatarUrl"
              alt="群头像"
              class="group-avatar__img"
            />
            <span v-else>{{ groupName.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="group-main-info">
            <div class="group-name">{{ groupName }}</div>
            <div class="group-id">群号：{{ groupNumber }}</div>
          </div>
        </div>
      </section>

      <section class="group-section">
        <div class="group-section-title">群公告</div>
        <textarea
          v-model="editableNotice"
          class="group-textarea"
          rows="3"
          placeholder="请输入群公告摘要"
        />
      </section>

      <section class="group-section">
        <div class="group-section-title">我的本群昵称</div>
        <input
          v-model="editableMyNickname"
          class="group-input"
          type="text"
          placeholder="请输入本群昵称"
          maxlength="50"
        />
      </section>

      <section class="group-section">
        <div class="group-section-title">群聊备注</div>
        <input
          v-model="editableGroupRemark"
          class="group-input"
          type="text"
          placeholder="填写备注"
          maxlength="50"
        />
      </section>

      <section class="group-section">
        <div class="settings-row">
          <span class="settings-label">设为置顶</span>
          <el-switch v-model="pinConversation" />
        </div>
        <div class="settings-row">
          <span class="settings-label">消息免打扰</span>
          <el-switch v-model="muteConversation" />
        </div>
        <div class="settings-row settings-row--status">
          <span class="settings-label">群消息设置</span>
          <span class="settings-status">{{ messageSettingText }}</span>
        </div>
      </section>
    </div>

    <div class="group-actions-float" :class="{ visible: hasPendingChanges }">
      <button
        class="group-action-btn group-action-btn--apply"
        type="button"
        :disabled="isApplying"
        @click="handleApply"
      >
        {{ isApplying ? "保存中..." : "应用" }}
      </button>
      <button
        class="group-action-btn group-action-btn--cancel"
        type="button"
        :disabled="isApplying"
        @click="handleCancel"
      >
        取消
      </button>
    </div>

    <Transition name="conv-edit-drawer">
      <div
        v-if="isProfileEditOpen"
        class="conv-edit-drawer-mask"
        @click.self="closeProfileEdit"
      >
        <ConvProfileEdit
          :conv-id="Number(props.convId)"
          :initial-name="conversation?.convName || ''"
          :initial-description="conversation?.convDescription || ''"
          :initial-enable-read-receipt="
            Boolean(conversation?.enableReadReceipt)
          "
          @close="closeProfileEdit"
          @saved="handleProfileSaved"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Pencil, X } from "lucide-vue-next";
import toast from "@/commons/utils/toast";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { useConvStore } from "@/store/conv/conv";
import { useUserStore } from "@/store/user/user";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import ConvProfileEdit from "./ConvProfileEdit.vue";
import type {
  ConversationEntity,
  ConversationMemberDTO,
} from "@/types/dto/conversation-member";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";

const props = defineProps<{
  convId: number | null;
}>();

const emit = defineEmits<{
  close: [];
  "changes-pending": [pending: boolean];
}>();

const conversationInfoStore = useConversationInfoStore();
const conversationStore = useConvStore();
const userStore = useUserStore();

const loading = ref(false);
const error = ref<string | null>(null);
const isApplying = ref(false);
const isProfileEditOpen = ref(false);
const conversation = ref<ConversationEntity | null>(null);
const members = ref<ConversationMemberDTO[]>([]);

const editableNotice = ref("");
const editableMyNickname = ref("");
const editableGroupRemark = ref("");
const pinConversation = ref(false);
const muteConversation = ref(false);

const initialNotice = ref("");
const initialMyNickname = ref("");
const initialGroupRemark = ref("");
const initialPinConversation = ref(false);
const initialMuteConversation = ref(false);

const groupAvatarUrl = computed(() =>
  normalizeAvatarUrl(conversation.value?.convAvatar || "")
);
const groupName = computed(() => conversation.value?.convName || "未命名群聊");
const groupNumber = computed(() => conversation.value?.convId || "-");
const messageSettingText = computed(() =>
  muteConversation.value ? "仅接收提醒消息" : "接收全部消息"
);
const hasPendingChanges = computed(
  () =>
    editableNotice.value !== initialNotice.value ||
    editableMyNickname.value !== initialMyNickname.value ||
    editableGroupRemark.value !== initialGroupRemark.value ||
    pinConversation.value !== initialPinConversation.value ||
    muteConversation.value !== initialMuteConversation.value
);
const isCurrentUserGroupOwner = computed(() => {
  const myUserId = Number(userStore.user?.userId || 0);
  if (myUserId <= 0) return false;
  if (Number(conversation.value?.convOwnerId || 0) === myUserId) return true;
  const me = members.value.find((member) => Number(member.userId) === myUserId);
  return Number(me?.role || 0) === 1;
});

/**
 * 打开群资料编辑抽屉。
 * 使用场景：群主点击 header 左侧铅笔图标后，从右侧滑出编辑面板。
 */
const openProfileEdit = () => {
  isProfileEditOpen.value = true;
};

/**
 * 关闭群资料编辑抽屉。
 * 使用场景：点击遮罩、关闭按钮或保存完成后收起右侧编辑面板。
 */
const closeProfileEdit = () => {
  isProfileEditOpen.value = false;
};

/**
 * 处理群资料编辑保存回调并同步当前页面显示。
 * 使用场景：编辑抽屉保存成功后，详情面板立即更新群名/公告/回执开关。
 */
const handleProfileSaved = (payload: {
  convName: string;
  convDescription: string;
  enableReadReceipt: boolean;
}) => {
  if (!conversation.value || !props.convId) return;
  /** 群资料本地同步补丁；用于让会话列表与聊天头部在保存后立即响应。 */
  const groupProfilePatch: Partial<ConversationSummaryDTO> = {
    convName: payload.convName,
  };
  (
    groupProfilePatch as ConversationSummaryDTO & {
      convDescription?: string | null;
      enableReadReceipt?: boolean;
    }
  ).convDescription = payload.convDescription;
  (
    groupProfilePatch as ConversationSummaryDTO & {
      convDescription?: string | null;
      enableReadReceipt?: boolean;
    }
  ).enableReadReceipt = payload.enableReadReceipt;
  conversationStore.patchConversationLocal(props.convId, groupProfilePatch);

  conversation.value = {
    // ...：把原对象的所有可枚举属性“展开”到新对象中
    ...conversation.value,
    ...payload,
  };
  closeProfileEdit();
};

/**
 * 将群设置修改即时回写到 pinia 会话/成员缓存。
 * 使用场景：点击“应用”后，不等刷新即可让列表、消息区等引用处立即响应。
 */
const syncLocalChangesToPinia = () => {
  if (!props.convId) return;
  const convId = props.convId;
  const summaryPatch: Partial<ConversationSummaryDTO> = {};

  if (editableGroupRemark.value !== initialGroupRemark.value) {
    /**
     * 群聊备注本地值；空串统一归一成 null，避免“看似成功但后端不落库”的空值歧义。
     */
    const normalizedGroupRemark = editableGroupRemark.value.trim();
    summaryPatch.privateDisplayName =
      normalizedGroupRemark === "" ? null : normalizedGroupRemark;
    /**
     * 清空群聊备注时，显式回填会话原始名称用于本地即时回退展示。
     * 使用场景：从“备注名”恢复到“原始群名”时，避免等待刷新才能看到正确 convName。
     */
    if (!editableGroupRemark.value.trim() && conversation.value?.convName) {
      summaryPatch.convName = conversation.value.convName;
    }
  }
  if (Object.keys(summaryPatch).length > 0) {
    conversationStore.patchConversationLocal(convId, summaryPatch);
  }

  const myUserId = Number(userStore.user?.userId || 0);
  if (myUserId <= 0 || editableMyNickname.value === initialMyNickname.value)
    return;
  /** 群内昵称本地值；空串统一归一成 null，避免展示层出现空字符串脏值。 */
  const normalizedMemberNickname = editableMyNickname.value.trim();
  const localMemberNickname =
    normalizedMemberNickname === "" ? null : normalizedMemberNickname;
  const memberIndex = members.value.findIndex(
    (member) => Number(member.userId) === myUserId
  );
  if (memberIndex >= 0) {
    members.value[memberIndex] = {
      ...members.value[memberIndex],
      memberNickname: localMemberNickname,
    };
  }

  conversationStore.patchConversationMemberNicknameLocal(
    convId,
    myUserId,
    localMemberNickname
  );
};

/**
 * 取消编辑并回退到初始值。
 * 使用场景：用户点击 Cancel 后撤销当前未提交改动。
 */
const handleCancel = () => {
  editableNotice.value = initialNotice.value;
  editableMyNickname.value = initialMyNickname.value;
  editableGroupRemark.value = initialGroupRemark.value;
  pinConversation.value = initialPinConversation.value;
  muteConversation.value = initialMuteConversation.value;
};

/**
 * 提交群聊设置修改。
 * 使用场景：用户点击 Apply，将公告与个人昵称设置持久化到后端。
 */
const handleApply = async () => {
  if (!props.convId || isApplying.value) return;
  isApplying.value = true;
  try {
    if (editableNotice.value !== initialNotice.value) {
      await conversationInfoStore.persistConversationInfo(props.convId, {
        convDescription: editableNotice.value,
      });
    }
    const memberPayload: {
      memberNickname?: string | null;
      privateDisplayName?: string | null;
      clearMemberNickname?: boolean;
      clearPrivateDisplayName?: boolean;
    } = {};
    if (editableMyNickname.value !== initialMyNickname.value) {
      const normalizedMemberNickname = editableMyNickname.value.trim();
      if (normalizedMemberNickname === "") {
        memberPayload.clearMemberNickname = true;
      } else {
        memberPayload.memberNickname = normalizedMemberNickname;
      }
    }
    if (editableGroupRemark.value !== initialGroupRemark.value) {
      const normalizedGroupRemark = editableGroupRemark.value.trim();
      if (normalizedGroupRemark === "") {
        memberPayload.clearPrivateDisplayName = true;
      } else {
        memberPayload.privateDisplayName = normalizedGroupRemark;
      }
    }
    /** 群聊备注变更标识；用于提交成功后主动刷新会话摘要，确保 convName 与后端一致。 */
    const shouldRefreshConversationSummary =
      editableGroupRemark.value !== initialGroupRemark.value;
    if (Object.keys(memberPayload).length > 0) {
      await conversationInfoStore.updateConversationMemberNames(
        props.convId,
        memberPayload
      );
    }
    if (conversation.value) {
      conversation.value.convDescription = editableNotice.value;
    }
    syncLocalChangesToPinia();
    initialNotice.value = editableNotice.value;
    initialMyNickname.value = editableMyNickname.value;
    initialGroupRemark.value = editableGroupRemark.value;
    initialPinConversation.value = pinConversation.value;
    initialMuteConversation.value = muteConversation.value;
    if (shouldRefreshConversationSummary) {
      await conversationStore.refreshConversationById(props.convId);
    }
    toast.success("群设置已保存");
  } catch (applyError) {
    console.error("保存群设置失败:", applyError);
    toast.error("保存失败，请稍后重试");
  } finally {
    isApplying.value = false;
  }
};

/**
 * 从群聊详情和成员信息初始化编辑态字段。
 * 使用场景：首次加载群聊资料或切换 convId 后，构建内容区初始显示值。
 */
const initEditableFields = () => {
  const myUserId = Number(userStore.user?.userId || 0);
  const me = members.value.find((member) => Number(member.userId) === myUserId);
  initialNotice.value = conversation.value?.convDescription || "";
  initialMyNickname.value = me?.memberNickname || "";
  initialGroupRemark.value =
    conversationStore.getConversationById(Number(props.convId))
      ?.privateDisplayName || "";
  initialPinConversation.value = false;
  initialMuteConversation.value = false;

  editableNotice.value = initialNotice.value;
  editableMyNickname.value = initialMyNickname.value;
  editableGroupRemark.value = initialGroupRemark.value;
  pinConversation.value = initialPinConversation.value;
  muteConversation.value = initialMuteConversation.value;
};

/**
 * 加载群聊详情。
 * 使用场景：群聊侧栏打开或会话切换时刷新群设置页数据。
 */
const loadGroupConversationInfo = async () => {
  if (!props.convId) return;
  loading.value = true;
  error.value = null;
  try {
    const detail = await conversationInfoStore.loadConversationDetail(
      props.convId
    );
    conversation.value = detail.conversation as ConversationEntity;
    members.value = detail.members as ConversationMemberDTO[];
    initEditableFields();
  } catch (loadError) {
    console.error("加载群聊详情失败:", loadError);
    error.value = "加载群聊详情失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.convId,
  () => {
    void loadGroupConversationInfo();
  },
  { immediate: true }
);

watch(hasPendingChanges, (pending) => {
  emit("changes-pending", pending);
});

onMounted(() => {
  void loadGroupConversationInfo();
});
</script>

<style scoped>
.group-conv-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.group-conv-info__header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  flex-shrink: 0;
}

.group-conv-info__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.group-conv-info__edit,
.group-conv-info__close {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
}

.group-conv-info__edit {
  left: 14px;
}

.group-conv-info__close {
  right: 14px;
}

.group-conv-info__edit:hover,
.group-conv-info__close:hover {
  background: #f3f4f6;
}

.group-conv-info__state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.group-conv-info__state--error {
  color: #dc2626;
}

.group-conv-info__content {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 16px;
}

.group-section {
  padding: 14px 0;
  border-bottom: 1px solid #e5e7eb;
}

.group-section--identity {
  padding-top: 16px;
}

.group-identity-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: 22px;
  font-weight: 600;
}

.group-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-main-info {
  min-width: 0;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.group-id {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}

.group-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.group-textarea,
.group-input {
  width: 100%;
  border: none;
  border-radius: 10px;
  background: rgba(156, 163, 175, 0.12);
  color: #111827;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  box-sizing: border-box;
  outline: none;
}

.group-textarea {
  resize: vertical;
  min-height: 80px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
}

.settings-row + .settings-row {
  border-top: 1px solid #f3f4f6;
}

.settings-label {
  font-size: 14px;
  color: #111827;
}

.settings-row--status .settings-status {
  font-size: 13px;
  color: #6b7280;
}

.group-actions-float {
  position: absolute;
  top: 50%;
  right: -98px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  pointer-events: none;
  transition: right 0.2s ease, opacity 0.2s ease;
}

.group-actions-float.visible {
  right: 8px;
  opacity: 1;
  pointer-events: auto;
}

.group-action-btn {
  border: none;
  border-radius: 999px;
  min-width: 74px;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.group-action-btn--apply {
  background: #2563eb;
  color: #fff;
}

.group-action-btn--cancel {
  background: #f3f4f6;
  color: #374151;
}

.group-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.conv-edit-drawer-mask {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(15, 23, 42, 0.25);
  display: flex;
  justify-content: flex-end;
}

.conv-edit-drawer-enter-active,
.conv-edit-drawer-leave-active {
  transition: opacity 0.22s ease;
}

.conv-edit-drawer-enter-from,
.conv-edit-drawer-leave-to {
  opacity: 0;
}
</style>
