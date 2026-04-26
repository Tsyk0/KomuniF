<!-- File: src/components/ConversationInfo.vue -->
<template>
  <div class="conversation-info-container">
    <div class="conversation-info-header">
      <div class="conversation-info-title-wrap">
        <h2 class="conversation-info-title">
          {{ isFriendMode ? "Friend Info" : "Conversation Info" }}
        </h2>
        <p v-if="isFriendMode && friendInfo" class="conversation-info-subtitle">
          {{ friendDisplayName }}
        </p>
        <p
          v-else-if="!isFriendMode && conversation"
          class="conversation-info-subtitle"
        >
          {{ conversation.convDescription || "No description" }}
        </p>
      </div>
      <button
        class="conversation-info-close"
        @click="handleClose"
        :title="isFriendMode ? 'Close friend info' : 'Close conversation info'"
      >
        ?
      </button>
    </div>

    <div
      v-if="loading"
      class="conversation-info-content conversation-info-loading"
    >
      <p>{{ isFriendMode ? "Loading friend info..." : "Loading conversation info..." }}</p>
    </div>

    <div
      v-else-if="error"
      class="conversation-info-content conversation-info-error"
    >
      <p>{{ error }}</p>
    </div>

    <div
      v-else-if="isFriendMode && friendInfo"
      class="conversation-info-content"
    >
      <section class="conversation-section">
        <h3 class="section-title">Basic Info</h3>
        <div class="conversation-fields">
          <div class="conversation-field-row">
            <div class="field-label">Avatar</div>
            <div class="field-value avatar-value">
              <div class="conversation-avatar-large">
                <img
                  v-if="friendAvatarUrl"
                  :src="friendAvatarUrl"
                  alt="friend avatar"
                  class="avatar-large-img"
                />
                <div v-else class="avatar-large-default">
                  {{ friendDisplayName.charAt(0).toUpperCase() }}
                </div>
              </div>
            </div>
          </div>
          <div class="conversation-field-row">
            <div class="field-label">Nickname</div>
            <div class="field-value">{{ friendInfo.friendNickname }}</div>
          </div>
          <div class="conversation-field-row conversation-field-editable">
            <div class="field-label">Remark</div>
            <div class="field-value">
              <input
                v-model="editableRemark"
                class="field-input"
                type="text"
                placeholder="Enter remark name"
                maxlength="50"
              />
            </div>
          </div>
          <div class="conversation-field-row conversation-field-editable">
            <div class="field-label">Group</div>
            <div class="field-value">
              <input
                v-model="editableGroup"
                class="field-input"
                type="text"
                placeholder="Enter group name"
                maxlength="50"
              />
            </div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.addSource">
            <div class="field-label">Add Source</div>
            <div class="field-value">{{ friendInfo.addSource }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.addTime">
            <div class="field-label">Added At</div>
            <div class="field-value">{{ friendInfo.addTime }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.updateTime">
            <div class="field-label">Updated At</div>
            <div class="field-value">{{ friendInfo.updateTime }}</div>
          </div>
        </div>
      </section>
      <section class="conversation-section">
        <h3 class="section-title">Details</h3>
        <div class="conversation-fields">
          <div class="conversation-field-row" v-if="friendInfo.friendSignature">
            <div class="field-label">Signature</div>
            <div class="field-value multiline">
              {{ friendInfo.friendSignature }}
            </div>
          </div>
          <div
            class="conversation-field-row"
            v-if="
              friendInfo.friendGender !== undefined &&
              friendInfo.friendGender !== null
            "
          >
            <div class="field-label">Gender</div>
            <div class="field-value">{{ friendGenderText }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.friendBirthday">
            <div class="field-label">Birthday</div>
            <div class="field-value">{{ friendInfo.friendBirthday }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.friendLocation">
            <div class="field-label">Location</div>
            <div class="field-value">{{ friendInfo.friendLocation }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.friendPhone">
            <div class="field-label">Phone</div>
            <div class="field-value">{{ friendInfo.friendPhone }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.friendEmail">
            <div class="field-label">Email</div>
            <div class="field-value">{{ friendInfo.friendEmail }}</div>
          </div>
          <div
            class="conversation-field-row"
            v-if="friendInfo.friendLastLoginTime"
          >
            <div class="field-label">Last Login</div>
            <div class="field-value">{{ friendInfo.friendLastLoginTime }}</div>
          </div>
          <div class="conversation-field-row">
            <div class="field-label">Friend ID</div>
            <div class="field-value">{{ friendInfo.friendId }}</div>
          </div>
        </div>
      </section>
    </div>

    <div v-else-if="!isFriendMode" class="conversation-info-content">
      <section v-if="conversation" class="conversation-section">
        <h3 class="section-title">Basic Info</h3>
        <div class="conversation-fields">
          <div class="conversation-field-row" :class="conversationFieldClass">
            <div class="field-label">Group Avatar</div>
            <div class="field-value avatar-value">
              <div
                class="conversation-avatar-large"
                :class="{ 'avatar-clickable': canEditConversation }"
                @click="handleAvatarClick"
              >
                <img
                  v-if="conversationAvatarUrl"
                  :src="conversationAvatarUrl"
                  alt="group avatar"
                  class="avatar-large-img"
                />
                <div v-else class="avatar-large-default">
                  {{ conversation.convName.charAt(0).toUpperCase() }}
                </div>
              </div>
            </div>
          </div>

          <div class="conversation-field-row" :class="conversationFieldClass">
            <div class="field-label">Name</div>
            <div class="field-value">
              <input
                v-model="editableName"
                :readonly="!canEditConversation"
                class="field-input"
                type="text"
              />
            </div>
          </div>

          <div class="conversation-field-row" :class="conversationFieldClass">
            <div class="field-label">Description</div>
            <div class="field-value multiline">
              <textarea
                v-model="editableDescription"
                :readonly="!canEditConversation"
                class="field-textarea"
                rows="2"
              ></textarea>
            </div>
          </div>

          <div class="conversation-field-row">
            <div class="field-label">Members</div>
            <div class="field-value">
              {{ conversation.currentMemberCount }} /
              {{ conversation.maxMemberCount }}
            </div>
          </div>

          <div class="conversation-field-row">
            <div class="field-label">Owner</div>
            <div class="field-value">
              {{ ownerDisplayName }}?ID: {{ conversation.convOwnerId }}?
            </div>
          </div>

          <div class="conversation-field-row">
            <div class="field-label">Read Receipt</div>
            <div class="field-value">
              {{
                conversation.enableReadReceipt
                  ? "Enabled"
                  : "Disabled"
              }}
            </div>
          </div>

          <div class="conversation-field-row">
            <div class="field-label">Status</div>
            <div class="field-value">
              {{ convStatusText }}
            </div>
          </div>

          <div class="conversation-field-row">
            <div class="field-label">Created At</div>
            <div class="field-value">
              {{ conversation.createTime }}
            </div>
          </div>

          <div class="conversation-field-row">
            <div class="field-label">Conversation ID</div>
            <div class="field-value">
              {{ conversation.convId }}
            </div>
          </div>
        </div>
      </section>

      <section class="conversation-section">
        <div class="section-header-row">
          <h3 class="section-title">Members</h3>
          <span class="section-subtext" v-if="conversation">
            ? {{ conversation.currentMemberCount }} ?
          </span>
        </div>

        <div v-if="displayMembers.length === 0" class="conversation-empty">
          No member data
        </div>
        <div v-else class="member-grid">
          <div
            v-for="member in displayMembers"
            :key="member.userId"
            class="member-item"
          >
            <div class="member-avatar">
              <img
                v-if="member.avatarUrl"
                :src="member.avatarUrl"
                alt="avatar"
                class="member-avatar-img"
              />
              <div v-else class="member-avatar-default">
                {{ member.displayName.charAt(0).toUpperCase() }}
              </div>
              <span v-if="member.isCurrentUser" class="member-tag me-tag">
                ?
              </span>
              <span v-else-if="member.roleTag" class="member-tag role-tag">
                {{ member.roleTag }}
              </span>
            </div>
            <div class="member-name" :title="member.displayName">
              {{ member.displayName }}
            </div>
          </div>

          <div v-if="extraMemberCount > 0" class="member-item member-more">
            <div class="member-more-circle">+{{ extraMemberCount }}</div>
            <div class="member-name">More members</div>
          </div>
        </div>
      </section>

      <section class="conversation-section">
        <h3 class="section-title">Personal Settings</h3>
        <div class="settings-card">
          <div class="settings-row">
            <div class="settings-label">My Group Nickname</div>
            <div class="settings-value">
              <input
                v-model="editableMemberNickname"
                class="field-input"
                type="text"
                maxlength="50"
                placeholder="Enter member nickname"
                :disabled="!canEditMyMemberNames || isApplying"
              />
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-label">My Private Display Name</div>
            <div class="settings-value">
              <input
                v-model="editablePrivateDisplayName"
                class="field-input"
                type="text"
                maxlength="50"
                placeholder="Enter private display name"
                :disabled="!canEditMyMemberNames || isApplying"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="
        (isFriendMode && hasFriendPendingChanges) ||
        (!isFriendMode && (canEditConversation || canEditMyMemberNames))
      "
      class="info-actions-float"
      :class="{
        visible:
          (isFriendMode && hasFriendPendingChanges) ||
          (!isFriendMode &&
            (hasPendingChanges || hasMemberNamePendingChanges)),
      }"
    >
      <button
        class="info-action-btn apply"
        :disabled="isApplying"
        @click="isFriendMode ? handleFriendApply() : handleApply()"
      >
        {{ isApplying ? "Applying..." : "Apply" }}
      </button>
      <button
        class="info-action-btn cancel"
        :disabled="isApplying"
        @click="isFriendMode ? handleFriendCancel() : handleCancel()"
      >
        Cancel
      </button>
    </div>

    <input
      v-if="!isFriendMode"
      ref="avatarInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleAvatarChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import toast from "@/commons/utils/toast";
import { useUserStore } from "@/store/user/user";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConvStore } from "@/store/conv/conv";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import {
  createImagePreviewUrl,
  revokeImagePreviewUrl,
  validateImageFile,
} from "@/commons/utils/image";
import { useAppBootstrapStore } from "@/store/app/bootstrap";
import type {
  ConversationEntity,
  ConversationMemberDTO,
} from "@/types/dto/conversation-member";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import {
  submitConversationInfoFlow,
  applyMyMemberNamesFlow,
  applyFriendRemarkFlow,
  hasConversationEditableChanges,
  hasFriendEditableChanges,
  hasMyMemberNameChanges,
  loadConversationInfoFlow,
  refreshConversationAfterUpdateFlow,
  resolveConversationStatusText,
  resolveFriendGenderText,
  resolveMemberDisplayName,
  syncMyMemberNameFields,
  syncConversationEditableFields,
  syncFriendEditableFields,
  validateMyMemberNameInputs,
  validateFriendRemarkInputs,
} from "@/interactions/conversationInfo/ConversationInfoInteraction";

type FriendInfoViewModel = {
  id: number;
  friendId: number;
  displayName?: string;
  nickname?: string;
  remarkName?: string | null;
  friendNickname?: string | null;
  avatar?: string | null;
  friendAvatar?: string | null;
  friendGender?: number | null;
  friendGroup?: string | null;
  group?: string | null;
  addSource?: string | null;
  addTime?: string | null;
  updateTime?: string | null;
  friendSignature?: string | null;
  friendBirthday?: string | null;
  friendLocation?: string | null;
  friendPhone?: string | null;
  friendEmail?: string | null;
  friendLastLoginTime?: string | null;
};

const props = defineProps<{
  convId: number | null;
  friendId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  "changes-pending": [pending: boolean];
}>();

const authStore = useUserStore();
const friendStore = useFriendStore();
const conversationStore = useConvStore();
const conversationInfoStore = useConversationInfoStore();
const appBootstrapStore = useAppBootstrapStore();

const loading = ref(false);
const error = ref<string | null>(null);
const conversation = ref<ConversationEntity | null>(null);
const members = ref<ConversationMemberDTO[]>([]);
const friendInfo = ref<FriendInfoViewModel | null>(null);

const isFriendMode = computed(
  () => props.friendId != null && props.friendId > 0
);

const currentUserId = computed(() => {
  const id = authStore.user?.userId;
  return id == null ? null : id;
});

const resolveDisplayName = (member: ConversationMemberDTO): string => {
  return resolveMemberDisplayName(member, friendStore.friends);
};

const currentUserRole = computed<number | null>(() => {
  if (!currentUserId.value) return null;
  const me = members.value.find((m) => m.userId === currentUserId.value);
  const r = me?.role;
  return r == null ? 0 : r;
});

const canEditConversation = computed(() => {
  return currentUserRole.value === 2 || currentUserRole.value === 1;
});

const conversationFieldClass = computed(() =>
  canEditConversation.value
    ? "conversation-field-editable"
    : "conversation-field-readonly"
);

const conversationAvatarUrl = computed(() => {
  if (stagedAvatarPreviewUrl.value) return stagedAvatarPreviewUrl.value;
  if (!conversation.value?.convAvatar) return "";
  return normalizeAvatarUrl(conversation.value.convAvatar);
});

const friendAvatarUrl = computed(() => {
  return normalizeAvatarUrl(
    friendInfo.value?.avatar || friendInfo.value?.friendAvatar || ""
  );
});
const friendDisplayName = computed(() => {
  if (!friendInfo.value) return "";
  return (
    friendInfo.value.remarkName ||
    friendInfo.value.displayName ||
    friendInfo.value.nickname ||
    friendInfo.value.friendNickname ||
    "Unknown user"
  );
});
const friendGenderText = computed(() => {
  return resolveFriendGenderText(friendInfo.value?.friendGender);
});

const ownerDisplayName = computed(() => {
  if (!conversation.value) return "";
  const owner = members.value.find(
    (m) => m.userId === conversation.value!.convOwnerId
  );
  if (!owner) return `User ${conversation.value.convOwnerId}`;
  return resolveDisplayName(owner);
});

const convStatusText = computed(() => {
  return resolveConversationStatusText(conversation.value?.convStatus);
});

const rawVisibleMembers = computed(() => {
  const maxVisible = 12;
  return members.value.slice(0, maxVisible);
});

const extraMemberCount = computed(() => {
  const total =
    conversation.value?.currentMemberCount || members.value.length || 0;
  const visibleCount = rawVisibleMembers.value.length;
  return total > visibleCount ? total - visibleCount : 0;
});

const displayMembers = computed(() =>
  rawVisibleMembers.value.map((m) => {
    const displayName = resolveDisplayName(m);
    let roleTag: string | null = null;
    if (m.role === 2) {
      roleTag = "Owner";
    } else if (m.role === 1) {
      roleTag = "Admin";
    }
    const isCurrentUser = m.userId === currentUserId.value;

    return {
      ...m,
      displayName,
      avatarUrl: normalizeAvatarUrl(m.userAvatar),
      roleTag,
      isCurrentUser,
    };
  })
);

const currentConversationSummary = computed(() => {
  if (!props.convId) return null;
  const fromMap = conversationStore.getConversationById(props.convId);
  if (fromMap) return fromMap;
  const cur = conversationStore.currentConversation;
  return cur?.convId === props.convId ? cur : null;
});

const currentMemberNickname = computed(() => {
  if (!currentUserId.value) return "";
  const me = members.value.find((m) => m.userId === currentUserId.value);
  return me?.memberNickname || "";
});

const currentPrivateDisplayName = computed(() => {
  return currentConversationSummary.value?.privateDisplayName || "";
});

const editableName = ref("");
const editableDescription = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);
/** 暂存待提交的会话头像文件，仅在点击 Apply 时随表单一起提交。 */
const stagedAvatarFile = ref<File | null>(null);
/** 暂存头像的本地预览 URL，用于“未提交前”在面板即时预览。 */
const stagedAvatarPreviewUrl = ref("");

const editableRemark = ref("");
const editableGroup = ref("");
const editableMemberNickname = ref("");
const editablePrivateDisplayName = ref("");
const isApplying = ref(false);

/**
 * 仅通过 conversationInfoStore 持久化当前用户会话内昵称设置。
 * 使用场景：点击 Apply 提交 memberNickname/privateDisplayName 时，统一走 pinia 数据链路。
 */
const updateConversationMemberNamesSafely = async (
  convId: number,
  payload: { memberNickname?: string; privateDisplayName?: string }
) => {
  await conversationInfoStore.updateConversationMemberNames(convId, payload);
};

const syncEditableFromConversation = () => {
  const fields = syncConversationEditableFields(conversation.value);
  editableName.value = fields.name;
  editableDescription.value = fields.description;
};

const syncEditableFromFriend = () => {
  const fields = syncFriendEditableFields(friendInfo.value);
  editableRemark.value = fields.remark;
  editableGroup.value = fields.group;
};

const syncEditableFromMemberSettings = () => {
  const fields = syncMyMemberNameFields({
    memberNickname: currentMemberNickname.value,
    privateDisplayName: currentPrivateDisplayName.value,
  });
  editableMemberNickname.value = fields.memberNickname;
  editablePrivateDisplayName.value = fields.privateDisplayName;
};

const hasPendingChanges = computed(() => {
  const textChanged = hasConversationEditableChanges(
    editableName.value,
    editableDescription.value,
    conversation.value
  );
  return textChanged || stagedAvatarFile.value != null;
});

const hasFriendPendingChanges = computed(() => {
  return hasFriendEditableChanges(
    editableRemark.value,
    editableGroup.value,
    friendInfo.value
  );
});

const hasMemberNamePendingChanges = computed(() => {
  return hasMyMemberNameChanges(
    editableMemberNickname.value,
    editablePrivateDisplayName.value,
    currentMemberNickname.value,
    currentPrivateDisplayName.value
  );
});

const canEditMyMemberNames = computed(() => {
  if (!currentUserId.value) return false;
  return members.value.some((m) => m.userId === currentUserId.value);
});

const anyPendingChanges = computed(() =>
  isFriendMode.value
    ? hasFriendPendingChanges.value
    : hasPendingChanges.value || hasMemberNamePendingChanges.value
);

watch(anyPendingChanges, (pending) => {
  emit("changes-pending", pending);
});

const loadFriendInfo = async () => {
  if (props.friendId == null || props.friendId <= 0) {
    friendStore.clearCurrentFriend();
    friendInfo.value = null;
    error.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  friendStore.setCurrentFriendById(props.friendId);
  friendInfo.value = (friendStore.currentFriend as FriendInfoViewModel | null) || null;
  if (!friendInfo.value) {
    error.value = "Friend not found in store";
  } else {
    syncEditableFromFriend();
  }
  loading.value = false;
};

const handleFriendApply = async () => {
  if (!friendInfo.value) return;
  const result = await applyFriendRemarkFlow({
    friendId: props.friendId,
    convId: props.convId,
    currentUserId: Number(authStore.user?.userId || 0),
    editableRemark: editableRemark.value,
    editableGroup: editableGroup.value,
    oldRemark: friendInfo.value.remarkName || "",
    oldGroup: friendInfo.value.friendGroup || friendInfo.value.group || "",
    validateInputs: (remark, group) => validateFriendRemarkInputs(remark, group),
    updateFriendRemark: (friendId, payload) =>
      conversationInfoStore.updateFriendRemark(friendId, payload),
    reloadFriendInfo: () => loadFriendInfo(),
    reloadFriendsBootstrap: (userId) => appBootstrapStore.loadOne("friends", userId),
    refreshConversationById: (convId) =>
      conversationStore.refreshConversationById(convId),
  });
  if (result.message) {
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }
};

const handleFriendCancel = () => {
  syncEditableFromFriend();
};

const loadConversationInfo = async () => {
  try {
    loading.value = true;
    error.value = null;
    const result = await loadConversationInfoFlow({
      convId: props.convId,
      loadConversationDetail: (convId) =>
        conversationInfoStore.loadConversationDetail(convId),
    });
    conversation.value = result.conversation as ConversationEntity | null;
    members.value = result.members as ConversationMemberDTO[];
    error.value = result.error;
    syncEditableFromConversation();
    syncEditableFromMemberSettings();
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit("close");
};

const handleAvatarClick = () => {
  if (!canEditConversation.value) return;
  avatarInputRef.value?.click();
};

/**
 * 清理头像暂存态（文件与预览 URL）。
 * 使用场景：重新选图、点击 Cancel、组件卸载，避免预览 URL 泄漏。
 */
const clearStagedAvatar = () => {
  revokeImagePreviewUrl(stagedAvatarPreviewUrl.value);
  stagedAvatarPreviewUrl.value = "";
  stagedAvatarFile.value = null;
};

const fetchConversationDetails = async (successMessage: string) => {
  const result = await refreshConversationAfterUpdateFlow({
    conversationId: conversation.value?.convId,
    successMessage,
    refreshConversationById: (convId) =>
      conversationStore.refreshConversationById(convId),
    reloadConversationInfo: () => loadConversationInfo(),
  });
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
};

/**
 * 选择会话头像时仅执行本地暂存，不直接提交。
 * 使用场景：用户希望头像与会话名称/描述在 Apply 时一次性提交。
 */
const handleAvatarChange = async (event: Event) => {
  if (!conversation.value || !canEditConversation.value) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  const validation = validateImageFile(file, { maxSizeBytes: 2 * 1024 * 1024 });
  if (!validation.ok) {
    if (validation.message) toast.error(validation.message);
    input.value = "";
    return;
  }
  clearStagedAvatar();
  stagedAvatarFile.value = file || null;
  stagedAvatarPreviewUrl.value = createImagePreviewUrl(file as File);
  input.value = "";
};

/**
 * 提交会话信息变更（名称/描述/头像）并同步当前详情视图。
 * 使用场景：用户点击 Apply 后统一提交，保证一次请求完成复合编辑。
 */
const handleApply = async () => {
  if (isApplying.value) return;
  isApplying.value = true;
  try {
    if (canEditConversation.value && hasPendingChanges.value) {
      const result = await submitConversationInfoFlow({
        conversation: conversation.value,
        canEditConversation: canEditConversation.value,
        editableName: editableName.value,
        editableDescription: editableDescription.value,
        avatarFile: stagedAvatarFile.value,
        persistConversationInfo: (convId, payload, convAvatarFile) =>
          conversationInfoStore.persistConversationInfo(convId, payload, convAvatarFile),
        setConversationName: (name) => {
          if (conversation.value) conversation.value.convName = name ?? "";
        },
        setConversationDescription: (description) => {
          if (conversation.value) conversation.value.convDescription = description ?? "";
        },
        syncEditableFromConversation,
        refreshAfterUpdate: (successMessage) => fetchConversationDetails(successMessage),
      });
      if (!result.ok && result.message) {
        toast.error(result.message);
        return;
      }
      clearStagedAvatar();
      const cid = Number(conversation.value?.convId || 0);
      if (cid > 0) {
        await conversationStore.refreshConversationById(cid);
        const updated = conversationStore.getConversationById(cid);
        if (updated && conversation.value) {
          const patch = updated as ConversationSummaryDTO & {
            convDescription?: string | null;
            enableReadReceipt?: boolean;
          };
          conversation.value.convName = patch.convName ?? conversation.value.convName;
          conversation.value.convAvatar = patch.convAvatar ?? conversation.value.convAvatar;
          if (patch.convDescription !== undefined) {
            conversation.value.convDescription = patch.convDescription;
          }
          if (patch.enableReadReceipt !== undefined) {
            conversation.value.enableReadReceipt = patch.enableReadReceipt;
          }
          if (patch.convType !== undefined) {
            conversation.value.convType = patch.convType;
          }
        }
      }
    }

    if (hasMemberNamePendingChanges.value) {
      const result = await applyMyMemberNamesFlow({
        convId: props.convId,
        oldMemberNickname: currentMemberNickname.value,
        oldPrivateDisplayName: currentPrivateDisplayName.value,
        editableMemberNickname: editableMemberNickname.value,
        editablePrivateDisplayName: editablePrivateDisplayName.value,
        validateInputs: (memberNickname, privateDisplayName) =>
          validateMyMemberNameInputs(memberNickname, privateDisplayName),
        updateMemberNames: (convId, payload) =>
          updateConversationMemberNamesSafely(convId, payload),
        refreshConversationById: (convId) =>
          conversationStore.refreshConversationById(convId),
        refreshConversationMembers: (convId, force) =>
          conversationStore.loadCompressedCM(convId, force),
        reloadConversationInfo: () => loadConversationInfo(),
      });
      if (!result.ok && result.message) {
        toast.error(result.message);
        return;
      }
      if (result.message) {
        toast.success(result.message);
      }
      syncEditableFromMemberSettings();
    }
  } finally {
    isApplying.value = false;
  }
};

const handleCancel = () => {
  syncEditableFromConversation();
  clearStagedAvatar();
  syncEditableFromMemberSettings();
};

onMounted(() => {
  if (isFriendMode.value) {
    loadFriendInfo();
  } else if (props.convId) {
    loadConversationInfo();
  }
});

onUnmounted(() => {
  clearStagedAvatar();
  friendStore.clearCurrentFriend();
});

watch(
  () => [props.convId, props.friendId] as const,
  ([convId, friendId]) => {
    if (friendId != null && friendId > 0) {
      loadFriendInfo();
    } else if (convId) {
      loadConversationInfo();
    } else {
      loading.value = false;
      error.value = null;
      conversation.value = null;
      members.value = [];
      friendInfo.value = null;
    }
  }
);

watch(
  () => [currentMemberNickname.value, currentPrivateDisplayName.value] as const,
  () => {
    if (!hasMemberNamePendingChanges.value) {
      syncEditableFromMemberSettings();
    }
  }
);
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/conversation-info.css";
@import "@/assets/styles/night/conversation-info-night.css";
</style>
