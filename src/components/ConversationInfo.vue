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
import { useAuthStore } from "@/stores/auth";
import { useFriendStore } from "@/stores/friend/show-friend";
import { useConversationStore } from "@/stores/chat/show-conversation";
import { conversationMemberApi } from "@/apis/chat/conversation-member";
import { manageConversationApi } from "@/apis/chat/manage-conversation";
import { friendApi } from "@/apis/friend";
import { normalizeAvatarUrl } from "@/utils/avatar-url";
import { displayNameResolver } from "@/capabilities/show-display-name";
import { BootstrapLoader } from "@/capabilities/load";
import type {
  ConversationEntity,
  ConversationMemberDTO,
} from "@/types/dto/conversation-member";
import type { FriendInfoDTO } from "@/types/dto/friend";

const props = defineProps<{
  convId: number | null;
  friendId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  "changes-pending": [pending: boolean];
}>();

const authStore = useAuthStore();
const friendStore = useFriendStore();
const conversationStore = useConversationStore();
const bootstrapLoader = new BootstrapLoader();

const loading = ref(false);
const error = ref<string | null>(null);
const conversation = ref<ConversationEntity | null>(null);
const members = ref<ConversationMemberDTO[]>([]);
const friendInfo = ref<FriendInfoDTO | null>(null);

const isFriendMode = computed(
  () => props.friendId != null && props.friendId > 0
);

const currentUserId = computed(() => {
  const id = authStore.user?.userId;
  return id == null ? null : id;
});

const resolveDisplayName = (member: ConversationMemberDTO): string => {
  const memberNickname = member.memberNickname?.trim() || "";
  if (memberNickname) return memberNickname;

  const friends = friendStore.friends;
  const relatedFriend = friends.find((f) => f.friendId === member.userId);
  return displayNameResolver.person({
    remarkName: relatedFriend?.remarkName == null ? "" : relatedFriend.remarkName,
    userNickname: member.userNickname == null ? "" : member.userNickname,
    fallbackName: "Unknown user",
  });
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
  return displayNameResolver.person({
    remarkName: friendInfo.value.remarkName,
    userNickname: friendInfo.value.friendNickname,
    fallbackName: "Unknown user",
  });
});
const friendGenderText = computed(() => {
  if (!friendInfo.value || friendInfo.value.friendGender == null) return "";
  const g = friendInfo.value.friendGender;
  if (g === 1) return "?";
  if (g === 2) return "?";
  return "Unknown";
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
  if (!conversation.value) return "";
  const status = conversation.value.convStatus;
  if (status === 1) return "Active";
  if (status === 0) return "Dismissed";
  return "Unknown status";
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
  editableName.value = conversation.value?.convName || "";
  editableDescription.value = conversation.value?.convDescription || "";
};

const syncEditableFromFriend = () => {
  editableRemark.value = friendInfo.value?.remarkName || "";
  editableGroup.value = friendInfo.value?.friendGroup || "";
};

const hasPendingChanges = computed(() => {
  if (!conversation.value) return false;
  return (
    editableName.value !== (conversation.value.convName || "") ||
    editableDescription.value !== (conversation.value.convDescription || "")
  );
});

const hasFriendPendingChanges = computed(() => {
  if (!friendInfo.value) return false;
  return (
    editableRemark.value !== (friendInfo.value.remarkName || "") ||
    editableGroup.value !== (friendInfo.value.friendGroup || "")
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
    const response = await friendApi.getFriendInfoByUserIdAndFriendId(
      props.friendId
    );
    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || "Failed to load friend info");
    }
    friendInfo.value = response.data;
    syncEditableFromFriend();
  } catch (e: any) {
    console.error("Failed to load friend info:", e);
    error.value = e?.message || "Unable to load friend info";
    friendInfo.value = null;
  } finally {
    loading.value = false;
  }
};

const handleFriendApply = async () => {
  if (!friendInfo.value || !props.friendId) return;
  const remark = editableRemark.value.trim();
  const group = editableGroup.value.trim();
  const sameRemark = (friendInfo.value.remarkName || "") === remark;
  const sameGroup = (friendInfo.value.friendGroup || "") === group;
  if (sameRemark && sameGroup) return;
  try {
    const resp = await friendApi.updateFriendRemarkAndGroup(
      props.friendId,
      {
      remarkName: sameRemark ? undefined : remark || null,
      friendGroup: sameGroup ? undefined : group || null,
      }
    );
    if (resp.code === 200) {
      await loadFriendInfo();
      await bootstrapLoader.loadOne("friends", {
        userId: Number(authStore.user?.userId || 0),
      });
      if (props.convId != null) {
        await conversationStore.refreshConversationById(props.convId);
      }
      toast.success("Friend remark/group updated");
    } else {
      toast.error(resp.message || "Update failed");
    }
  } catch (e: any) {
    console.error("Failed to update remark/group:", e);
    toast.error(e?.message || "Failed to update friend remark/group");
  }
};

const handleFriendCancel = () => {
  syncEditableFromFriend();
};

const loadConversationInfo = async () => {
  if (!props.convId) {
    conversation.value = null;
    members.value = [];
    error.value = null;
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const response = await conversationMemberApi.getConversationWithMembers(
      props.convId
    );

    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || "Failed to load conversation info");
    }

    conversation.value = response.data.conversation;
    members.value = response.data.members || [];
    syncEditableFromConversation();
  } catch (e: any) {
    console.error("Failed to load conversation info:", e);
    if (e?.response?.status === 401 || e?.code === 401) {
      error.value =
        e.response?.data?.message || "No permission to view this conversation";
    } else {
      error.value = e?.message || "Unable to load conversation info";
    }
    conversation.value = null;
    members.value = [];
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
  if (!conversation.value) {
    toast.success(successMessage);
    return;
  }
  const convId = conversation.value.convId;
  try {
    await conversationStore.refreshConversationById(convId);
    await loadConversationInfo();
    toast.success(successMessage);
  } catch (e) {
    console.error("Failed to refresh conversation details:", e);
    toast.error("Saved but failed to refresh conversation details");
  }
};

const compressImage = (
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7
) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get Canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const handleAvatarChange = async (event: Event) => {
  if (!conversation.value || !canEditConversation.value) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size cannot exceed 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const compressedBase64 = await compressImage(file, 400, 400, 0.7);

    const resp =
      await manageConversationApi.updateConversationAttriUserOrientedByConvId({
        convId: conversation.value.convId,
        convAvatar: compressedBase64,
      });

    if (resp.code === 200) {
      conversation.value.convAvatar = compressedBase64;
      await fetchConversationDetails("Avatar updated");
    } else {
      toast.error(resp.message || "Failed to upload avatar");
    }
  } catch (e) {
    console.error("Failed to upload avatar:", e);
    toast.error("Avatar upload failed, please retry");
  } finally {
    input.value = "";
  }
};

const handleApply = async () => {
  if (!conversation.value || !canEditConversation.value) return;

  try {
    const payload: Partial<ConversationEntity> & { convId: number } = {
      convId: conversation.value.convId,
    };

    if (editableName.value !== conversation.value.convName) {
      payload.convName = editableName.value.trim();
    }
    if (
      editableDescription.value !== (conversation.value.convDescription || "")
    ) {
      payload.convDescription = editableDescription.value.trim();
    }

    if (Object.keys(payload).length === 1) {
      return;
    }

    const resp =
      await manageConversationApi.updateConversationAttriUserOrientedByConvId(
        payload
      );

    if (resp.code === 200) {
      if (payload.convName !== undefined) {
        conversation.value.convName = payload.convName;
      }
      if (payload.convDescription !== undefined) {
        conversation.value.convDescription = payload.convDescription;
      }
      syncEditableFromConversation();
      await fetchConversationDetails("Conversation info updated");
    } else {
      console.error("Failed to update conversation info:", resp.message);
      toast.error(resp.message || "Failed to update conversation info");
    }
  } catch (e) {
    console.error("Failed to update conversation info:", e);
    toast.error("Update failed, please retry");
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
