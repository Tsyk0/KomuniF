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
              :alt="isPeerSidebarFriend ? '好友头像' : '对方头像'"
              class="single-avatar__img"
            />
            <span v-else>{{ displayName.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="single-main-info">
            <div class="single-name">{{ displayName }}</div>
            <div class="single-id">
              {{ isPeerSidebarFriend ? "好友 ID" : "对方 ID" }}：{{ friendInfo.friendId }}
            </div>
          </div>
        </div>
      </section>

      <section class="single-section">
        <div class="single-item-title">
          {{ isPeerSidebarFriend ? "好友信息" : "对方信息" }}
        </div>
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

    <div v-if="friendInfo && !loading" class="single-danger-footer">
      <button
        v-if="isPeerSidebarFriend"
        class="single-danger-btn"
        type="button"
        :disabled="isDeletingFriend"
        @click="handleDeleteFriend"
      >
        <UserRoundX :size="22" :stroke-width="2.2" />
        <span>{{ isDeletingFriend ? "删除中..." : "删除好友" }}</span>
      </button>
      <button
        v-else
        class="single-add-friend-btn"
        type="button"
        :disabled="isSendingFriendRequest || isSelfPeer"
        @click="handleAddFriend"
      >
        <UserPlus :size="22" :stroke-width="2.2" />
        <span>{{
          isSendingFriendRequest
            ? "发送中..."
            : isSelfPeer
              ? "无法添加自己"
              : "添加好友"
        }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { UserPlus, UserRoundX, X } from "lucide-vue-next";
import toast from "@/commons/utils/toast";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { useFriendStore } from "@/store/friend/showFriend";
import { useUserStore } from "@/store/user/user";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { syncFriendRemarkToStores } from "@/interactions/friendRemark/syncFriendRemarkToStores";
import { loadFriendInfoNormalized } from "@/normalize/friend";
import type { FriendListItem, FriendProfileDTO } from "@/types/dto/friend";
import { FriendRelationStatus } from "@/types/dto/friend";
import {
  executeFriendRequestFlow,
  mapFriendRequestErrorMessage,
} from "@/interactions/userSearch/UserSearchInteraction";

type FriendInfoViewModel = {
  friendId: number;
  /** 与 GET /friends 或资料接口一致，用于区分好友(0/1)与非好友等展示 */
  relationStatus?: number | null;
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
const userStore = useUserStore();
const conversationInfoStore = useConversationInfoStore();
const loading = ref(false);
const isApplying = ref(false);
const isDeletingFriend = ref(false);
const isSendingFriendRequest = ref(false);
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
 * 是否为「侧栏好友」关系（relationStatus 0/1）；用于单聊详情文案与删除/添加按钮。
 * 使用场景：与非好友单聊时隐藏「删除好友」，改为「添加好友」。
 */
const isPeerSidebarFriend = computed(() => {
  const r = friendInfo.value?.relationStatus;
  if (r === undefined || r === null || Number.isNaN(Number(r))) return false;
  const n = Number(r);
  return (
    n === FriendRelationStatus.FRIEND_PINNED || n === FriendRelationStatus.NORMAL
  );
});

/** 对端是否为自己；用于禁用「添加好友」。 */
const isSelfPeer = computed(() => {
  const me = userStore.user?.userId != null ? Number(userStore.user.userId) : NaN;
  const peer = Number(props.friendId || 0);
  return Number.isFinite(me) && Number.isFinite(peer) && me === peer;
});

/**
 * 将列表项上的在线枚举还原为资料接口同口径数字，便于复用现有在线文案逻辑。
 * 使用场景：仅从 Pinia 列表命中、未走资料接口时。
 */
function onlineStatusEnumToNumber(status: FriendListItem["onlineStatus"]): number {
  if (status === "online") return 1;
  if (status === "away") return 2;
  return 0;
}

/**
 * 从好友摘要行构建单聊侧栏展示模型。
 * 使用场景：`setCurrentFriendById` 命中全量 `/friends` 缓存时。
 */
function mapListItemToSingleConvViewModel(hit: FriendListItem): FriendInfoViewModel {
  return {
    friendId: Number(hit.friendId),
    relationStatus: Number(hit.relationStatus),
    friendNickname: hit.nickname,
    displayName: hit.displayName,
    nickname: hit.nickname,
    remarkName: hit.remarkName ?? null,
    avatar: hit.avatar,
    friendAvatar: hit.avatar,
    friendGroup: hit.group,
    group: hit.group,
    friendSignature: hit.signature,
    friendOnlineStatus: onlineStatusEnumToNumber(hit.onlineStatus),
  };
}

/**
 * 从好友资料 DTO 构建单聊侧栏展示模型。
 * 使用场景：全量缓存无行时回退 GET `/friends/{id}/profile`。
 */
function mapProfileToSingleConvViewModel(profile: FriendProfileDTO): FriendInfoViewModel {
  return {
    friendId: Number(profile.friendId),
    relationStatus: Number(profile.relationStatus),
    friendNickname: profile.friendNickname,
    displayName: profile.remarkName || profile.friendNickname,
    nickname: profile.friendNickname,
    remarkName: profile.remarkName ?? null,
    avatar: profile.friendAvatar,
    friendAvatar: profile.friendAvatar,
    friendGroup: profile.friendGroup,
    group: profile.friendGroup,
    friendSignature: profile.friendSignature,
    friendOnlineStatus: profile.friendOnlineStatus ?? null,
  };
}

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
 * 发送好友申请（非好友单聊侧栏入口）。
 * 使用场景：relationStatus 非 0/1 时底部「添加好友」；与 UserSearch 共用 normalize 申请链路。
 */
const handleAddFriend = async () => {
  const targetFriendId = Number(props.friendId || 0);
  if (
    !Number.isFinite(targetFriendId) ||
    targetFriendId <= 0 ||
    isSendingFriendRequest.value ||
    isSelfPeer.value
  ) {
    return;
  }
  isSendingFriendRequest.value = true;
  try {
    const result = await executeFriendRequestFlow({
      targetUserId: targetFriendId,
      isSelfTarget: isSelfPeer.value,
      sendFriendRequest: (id) => friendStore.sendFriendRequest(id),
    });
    if (result.ok) {
      toast.success(result.message);
      await friendStore.loadFriends();
      await loadSingleConversationInfo();
    } else {
      toast.error(result.message);
    }
  } catch (addError) {
    console.error("发送好友申请失败:", addError);
    toast.error(mapFriendRequestErrorMessage(addError));
  } finally {
    isSendingFriendRequest.value = false;
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
 * 加载单聊对端信息并初始化可编辑字段。
 * 使用场景：侧栏打开或 friendId 变化；优先 Pinia 全量 `/friends`，无行时再拉资料接口以拿到 relationStatus 与昵称等。
 */
const loadSingleConversationInfo = async () => {
  if (!props.friendId || props.friendId <= 0) {
    friendInfo.value = null;
    return;
  }
  loading.value = true;
  try {
    friendStore.setCurrentFriendById(props.friendId);
    const hit = friendStore.currentFriend;
    if (hit) {
      friendInfo.value = mapListItemToSingleConvViewModel(hit as FriendListItem);
    } else {
      try {
        const profile = await loadFriendInfoNormalized(props.friendId);
        friendInfo.value = mapProfileToSingleConvViewModel(profile);
      } catch {
        friendInfo.value = null;
      }
    }
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
