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
              <span v-if="myDisplayName">
                {{ myDisplayName }}
              </span>
              <span v-else class="settings-placeholder">
                Not set. Default name will be used.
              </span>
            </div>
          </div>
          <div class="settings-row disabled-row">
            <div class="settings-label">Mute Notifications</div>
            <div class="settings-value">
              <span class="settings-badge disabled-badge">Not Available</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="
        (isFriendMode && hasFriendPendingChanges) ||
        (!isFriendMode && canEditConversation)
      "
      class="info-actions-float"
      :class="{
        visible:
          (isFriendMode && hasFriendPendingChanges) ||
          (!isFriendMode && hasPendingChanges),
      }"
    >
      <button
        class="info-action-btn apply"
        @click="isFriendMode ? handleFriendApply() : handleApply()"
      >
        Apply
      </button>
      <button
        class="info-action-btn cancel"
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
import { computed, onMounted, ref, watch } from "vue";
import toast from "@/commons/utils/toast";
import { useUserStore } from "@/store/user/user";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConvStore } from "@/store/conv/conv";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { useAppBootstrapStore } from "@/store/app/bootstrap";
import type {
  ConversationEntity,
  ConversationMemberDTO,
} from "@/types/dto/conversation-member";
import type { FriendProfileDTO } from "@/types/dto/friend";
import {
  applyConversationAvatarFlow,
  applyConversationInfoFlow,
  applyFriendRemarkFlow,
  compressImageToBase64,
  hasConversationEditableChanges,
  hasFriendEditableChanges,
  loadConversationInfoFlow,
  loadFriendInfoFlow,
  refreshConversationAfterUpdateFlow,
  resolveConversationStatusText,
  resolveFriendGenderText,
  resolveMemberDisplayName,
  syncConversationEditableFields,
  syncFriendEditableFields,
  validateFriendRemarkInputs,
} from "@/interactions/conversationInfo/ConversationInfoInteraction";

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
const friendInfo = ref<FriendProfileDTO | null>(null);

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
  if (!conversation.value?.convAvatar) return "";
  return normalizeAvatarUrl(conversation.value.convAvatar);
});

const friendAvatarUrl = computed(() => {
  if (!friendInfo.value?.friendAvatar) return "";
  return normalizeAvatarUrl(friendInfo.value.friendAvatar);
});
const friendDisplayName = computed(() => {
  if (!friendInfo.value) return "";
  return friendInfo.value.remarkName || friendInfo.value.friendNickname || "Unknown user";
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

const myDisplayName = computed(() => {
  if (!currentUserId.value) return "";
  const me = members.value.find((m) => m.userId === currentUserId.value);
  if (!me) return "";
  return resolveDisplayName(me);
});

const editableName = ref("");
const editableDescription = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);

const editableRemark = ref("");
const editableGroup = ref("");

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

const hasPendingChanges = computed(() => {
  return hasConversationEditableChanges(
    editableName.value,
    editableDescription.value,
    conversation.value
  );
});

const hasFriendPendingChanges = computed(() => {
  return hasFriendEditableChanges(
    editableRemark.value,
    editableGroup.value,
    friendInfo.value
  );
});

const anyPendingChanges = computed(() =>
  isFriendMode.value ? hasFriendPendingChanges.value : hasPendingChanges.value
);

watch(anyPendingChanges, (pending) => {
  emit("changes-pending", pending);
});

const loadFriendInfo = async () => {
  if (props.friendId == null || props.friendId <= 0) {
    friendInfo.value = null;
    error.value = null;
    return;
  }
  try {
    loading.value = true;
    error.value = null;
    const result = await loadFriendInfoFlow({
      friendId: props.friendId,
      loadFriendDetail: (friendId) => conversationInfoStore.loadFriendDetail(friendId),
    });
    friendInfo.value = result.friendInfo as FriendProfileDTO | null;
    error.value = result.error;
    syncEditableFromFriend();
  } finally {
    loading.value = false;
  }
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
    oldGroup: friendInfo.value.friendGroup || "",
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

const handleAvatarChange = async (event: Event) => {
  if (!conversation.value || !canEditConversation.value) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  const result = await applyConversationAvatarFlow({
    file,
    convId: conversation.value.convId,
    compressImage: (avatarFile) =>
      compressImageToBase64(avatarFile, 400, 400, 0.7),
    updateConversationInfo: (payload) =>
      conversationInfoStore.updateConversationInfo(payload),
    refreshAfterUpdate: (successMessage) => fetchConversationDetails(successMessage),
    setConversationAvatar: (avatar) => {
      if (conversation.value) conversation.value.convAvatar = avatar;
    },
  });
  if (result.message) toast.error(result.message);
  input.value = "";
};

const handleApply = async () => {
  const result = await applyConversationInfoFlow({
    conversation: conversation.value,
    canEditConversation: canEditConversation.value,
    editableName: editableName.value,
    editableDescription: editableDescription.value,
    updateConversationInfo: (payload) =>
      conversationInfoStore.updateConversationInfo(payload),
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
  }
};

const handleCancel = () => {
  syncEditableFromConversation();
};

onMounted(() => {
  if (isFriendMode.value) {
    loadFriendInfo();
  } else if (props.convId) {
    loadConversationInfo();
  }
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
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/conversation-info.css";
@import "@/assets/styles/night/conversation-info-night.css";
</style>
