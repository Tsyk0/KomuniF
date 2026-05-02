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

    <div class="single-danger-footer">
      <button
        class="single-danger-btn"
        type="button"
        :disabled="isDeletingFriend"
        @click="handleDeleteFriend"
      >
        <UserRoundX :size="22" :stroke-width="2.2" />
        <span>{{ isDeletingFriend ? "删除中..." : "删除好友" }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { UserRoundX, X } from "lucide-vue-next";
import toast from "@/commons/utils/toast";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { syncFriendRemarkToStores } from "@/interactions/friendRemark/syncFriendRemarkToStores";

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
const loading = ref(false);
const isApplying = ref(false);
const isDeletingFriend = ref(false);
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
    syncFriendRemarkToStores(
      targetFriendId,
      editableRemark.value.trim(),
      editableGroup.value.trim()
    );
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
 * 删除当前好友关系。
 * 使用场景：用户点击底部“删除好友”按钮后，调用 store action 走 API->normalize->store 链路并清理本地好友/单聊状态。
 */
const handleDeleteFriend = async () => {
  const targetFriendId = Number(props.friendId || 0);
  if (!Number.isFinite(targetFriendId) || targetFriendId <= 0 || isDeletingFriend.value) {
    return;
  }
  const confirmDelete = window.confirm("确认删除该好友吗？");
  if (!confirmDelete) return;
  isDeletingFriend.value = true;
  try {
    await conversationInfoStore.deleteFriend(targetFriendId);
    toast.success("已删除好友");
    emit("close");
  } catch (deleteError) {
    console.error("删除好友失败:", deleteError);
    toast.error("删除失败，请稍后重试");
  } finally {
    isDeletingFriend.value = false;
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
@import "@/assets/styles/single-conv-info.css";
@import "@/assets/styles/night/single-conv-info-night.css";
</style>
