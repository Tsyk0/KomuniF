<template>
  <div class="single-conv-info">
    <div class="single-conv-info__header">
      <h2 class="single-conv-info__title">单聊详情</h2>
      <button
        class="single-conv-info__close"
        type="button"
        title="关闭单聊详情"
        @click="emit('close')"
      >
        <X :size="22" :stroke-width="2.2" />
      </button>
    </div>

    <div v-if="loading" class="single-conv-info__state">加载单聊信息中...</div>
    <div v-else-if="!friendInfo" class="single-conv-info__state">
      暂无单聊用户信息
    </div>
    <div v-else class="single-conv-info__content">
      <section class="single-section single-section--identity">
        <div class="single-user-row">
          <div class="single-avatar">
            <img
              v-if="friendAvatarUrl"
              :src="friendAvatarUrl"
              alt="好友头像"
              class="single-avatar__img"
            />
            <span v-else>{{ displayName.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="single-main-info">
            <div class="single-name">{{ displayName }}</div>
            <div class="single-id">好友 ID：{{ friendInfo.friendId }}</div>
          </div>
        </div>
      </section>

      <section class="single-section">
        <div class="single-item-title">好友信息</div>
        <div class="single-readonly-row">
          <span class="single-readonly-label">昵称</span>
          <span class="single-readonly-value">{{ friendNicknameText }}</span>
        </div>
        <div class="single-readonly-row">
          <span class="single-readonly-label">个性签名</span>
          <span class="single-readonly-value">{{ friendSignatureText }}</span>
        </div>
        <div class="single-readonly-row">
          <span class="single-readonly-label">在线状态</span>
          <span class="single-readonly-value">{{ friendOnlineStatusText }}</span>
        </div>
      </section>

      <section class="single-section">
        <div class="single-item-title">备注</div>
        <input
          v-model="editableRemark"
          class="single-input"
          type="text"
          placeholder="填写备注"
          maxlength="50"
        />
      </section>

      <section class="single-section">
        <div class="single-item-title">分组</div>
        <input
          v-model="editableGroup"
          class="single-input"
          type="text"
          placeholder="填写分组"
          maxlength="50"
        />
      </section>
    </div>

    <div
      class="single-actions-float"
      :class="{ visible: hasPendingChanges }"
    >
      <button
        class="single-action-btn single-action-btn--apply"
        type="button"
        :disabled="isApplying"
        @click="handleApply"
      >
        {{ isApplying ? "保存中..." : "应用" }}
      </button>
      <button
        class="single-action-btn single-action-btn--cancel"
        type="button"
        :disabled="isApplying"
        @click="handleCancel"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { X } from "lucide-vue-next";
import toast from "@/commons/utils/toast";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { useConvStore } from "@/store/conv/conv";

type FriendInfoViewModel = {
  friendId: number;
  friendNickname?: string | null;
  displayName?: string | null;
  nickname?: string | null;
  remarkName?: string | null;
  avatar?: string | null;
  friendAvatar?: string | null;
  friendGroup?: string | null;
  group?: string | null;
  friendSignature?: string | null;
  friendOnlineStatus?: number | null;
};

const props = defineProps<{
  friendId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  "changes-pending": [pending: boolean];
}>();

const friendStore = useFriendStore();
const conversationInfoStore = useConversationInfoStore();
const conversationStore = useConvStore();
const loading = ref(false);
const isApplying = ref(false);
const friendInfo = ref<FriendInfoViewModel | null>(null);
const editableRemark = ref("");
const editableGroup = ref("");
const initialRemark = ref("");
const initialGroup = ref("");

const displayName = computed(() => {
  if (!friendInfo.value) return "未知用户";
  return (
    friendInfo.value.remarkName ||
    friendInfo.value.displayName ||
    friendInfo.value.nickname ||
    friendInfo.value.friendNickname ||
    "未知用户"
  );
});
const friendAvatarUrl = computed(() =>
  normalizeAvatarUrl(friendInfo.value?.avatar || friendInfo.value?.friendAvatar || "")
);
const friendNicknameText = computed(() => {
  return friendInfo.value?.friendNickname || friendInfo.value?.nickname || "未设置";
});
const friendSignatureText = computed(() => {
  return friendInfo.value?.friendSignature || "这个人很神秘，什么都没留下";
});
const friendOnlineStatusText = computed(() => {
  const status = Number(friendInfo.value?.friendOnlineStatus ?? -1);
  if (status === 1) return "在线";
  if (status === 0) return "离线";
  return "未知";
});
const hasPendingChanges = computed(
  () =>
    editableRemark.value !== initialRemark.value ||
    editableGroup.value !== initialGroup.value
);

/**
 * 将单聊备注改动回写到本地 pinia，保证列表与会话头部即时更新。
 * 使用场景：用户点击“应用”后，单聊名称/分组等依赖处无需刷新即可同步。
 */
const syncSingleLocalChangesToPinia = () => {
  const targetFriendId = Number(props.friendId || 0);
  if (!Number.isFinite(targetFriendId) || targetFriendId <= 0) return;
  const nextRemark = editableRemark.value.trim();
  const nextGroup = editableGroup.value.trim();
  const normalizedRemark = nextRemark === "" ? null : nextRemark;
  const normalizedGroup = nextGroup === "" ? null : nextGroup;

  if (friendStore.currentFriend && Number(friendStore.currentFriend.friendId) === targetFriendId) {
    friendStore.currentFriend = {
      ...friendStore.currentFriend,
      remarkName: normalizedRemark,
      group: normalizedGroup,
      displayName: normalizedRemark || friendStore.currentFriend.nickname || "未知用户",
    };
  }

  /** 好友列表补丁；用于让联系人列表和其他引用处即时更新备注和分组显示。 */
  friendStore.friends = friendStore.friends.map((friend) =>
    Number(friend.friendId) === targetFriendId
      ? {
          ...friend,
          remarkName: normalizedRemark,
          group: normalizedGroup,
          displayName: normalizedRemark || friend.nickname || "未知用户",
        }
      : friend
  );

  conversationStore.conversations
    .filter((conv) => {
      if (Number(conv.convType) !== 1) return false;
      const peerId = Number(conv.peer?.peerUserId || conv.targetUserId || 0);
      return peerId === targetFriendId;
    })
    .forEach((conv) => {
      conversationStore.patchConversationLocal(conv.convId, {
        privateDisplayName: normalizedRemark,
      });
    });
};

/**
 * 取消编辑并回退到初始值。
 * 使用场景：用户点击“取消”撤销当前未提交的备注/分组改动。
 */
const handleCancel = () => {
  editableRemark.value = initialRemark.value;
  editableGroup.value = initialGroup.value;
};

/**
 * 提交单聊备注和分组更新。
 * 使用场景：用户点击“应用”后将可编辑字段持久化到后端并同步本地状态。
 */
const handleApply = async () => {
  const targetFriendId = Number(props.friendId || 0);
  if (!Number.isFinite(targetFriendId) || targetFriendId <= 0 || isApplying.value) return;
  const payload: { remarkName?: string | null; friendGroup?: string | null } = {};
  const nextRemark = editableRemark.value.trim();
  const nextGroup = editableGroup.value.trim();
  if (nextRemark !== initialRemark.value.trim()) {
    payload.remarkName = nextRemark === "" ? null : nextRemark;
  }
  if (nextGroup !== initialGroup.value.trim()) {
    payload.friendGroup = nextGroup === "" ? null : nextGroup;
  }
  if (Object.keys(payload).length === 0) return;

  isApplying.value = true;
  try {
    await conversationInfoStore.updateFriendRemark(targetFriendId, payload);
    syncSingleLocalChangesToPinia();
    initialRemark.value = editableRemark.value;
    initialGroup.value = editableGroup.value;
    toast.success("单聊资料已保存");
  } catch (applyError) {
    console.error("保存单聊资料失败:", applyError);
    toast.error("保存失败，请稍后重试");
  } finally {
    isApplying.value = false;
  }
};

/**
 * 加载单聊好友信息并初始化可编辑字段。
 * 使用场景：单聊信息面板打开或 friendId 变化时更新右侧信息栏。
 */
const loadSingleConversationInfo = async () => {
  if (!props.friendId || props.friendId <= 0) {
    friendInfo.value = null;
    return;
  }
  loading.value = true;
  try {
    friendStore.setCurrentFriendById(props.friendId);
    friendInfo.value = (friendStore.currentFriend as FriendInfoViewModel | null) || null;
    initialRemark.value = friendInfo.value?.remarkName || "";
    initialGroup.value = friendInfo.value?.friendGroup || friendInfo.value?.group || "";
    editableRemark.value = initialRemark.value;
    editableGroup.value = initialGroup.value;
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.friendId,
  () => {
    void loadSingleConversationInfo();
  },
  { immediate: true }
);

watch(hasPendingChanges, (pending) => {
  emit("changes-pending", pending);
});
</script>

<style scoped>
.single-conv-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: relative;
}

.single-conv-info__header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.single-conv-info__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.single-conv-info__close {
  position: absolute;
  right: 14px;
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

.single-conv-info__close:hover {
  background: #f3f4f6;
}

.single-conv-info__state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.single-conv-info__content {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 16px;
}

.single-section {
  padding: 14px 0;
  border-bottom: 1px solid #e5e7eb;
}

.single-section--identity {
  padding-top: 16px;
}

.single-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.single-avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  overflow: hidden;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
}

.single-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.single-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.single-id {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}

.single-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.single-readonly-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
}

.single-readonly-row + .single-readonly-row {
  border-top: 1px solid #f3f4f6;
}

.single-readonly-label {
  font-size: 13px;
  color: #6b7280;
}

.single-readonly-value {
  max-width: 65%;
  text-align: right;
  font-size: 14px;
  color: #111827;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.single-input {
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

.single-actions-float {
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

.single-actions-float.visible {
  right: 8px;
  opacity: 1;
  pointer-events: auto;
}

.single-action-btn {
  border: none;
  border-radius: 999px;
  min-width: 74px;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.single-action-btn--apply {
  background: #2563eb;
  color: #fff;
}

.single-action-btn--cancel {
  background: #f3f4f6;
  color: #374151;
}

.single-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
