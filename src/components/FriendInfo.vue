<!-- src/components/FriendInfo.vue -->
<template>
  <div class="friend-detail-container">
    <!-- 返回按钮和标题 -->
    <div class="friend-detail-header">
      <button class="back-button" @click="handleBack">
        <ArrowLeft class="back-icon" :size="22" :stroke-width="2.2" />
      </button>
      <h2 class="friend-detail-title">好友信息</h2>
    </div>

    <!-- 好友详情内容 -->
    <div v-if="info" class="friend-detail-content">
      <!-- 好友头像 -->
      <div class="friend-avatar-large">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt="头像"
          class="avatar-large-img"
        />
        <div v-else class="avatar-large-default">{{ displayInitial }}</div>
        <span class="online-status-badge" :class="onlineStatusClass">
          {{ onlineStatusText }}
        </span>
      </div>

      <!-- 好友基本信息 -->
      <div class="friend-basic-info">
        <h3 class="friend-name-large">{{ displayName }}</h3>

        <div v-if="info.remarkName" class="friend-remark">
          <span class="remark-label">备注：</span>
          <span class="remark-text">{{ info.remarkName }}</span>
        </div>

        <div class="friend-group">
          <span class="group-label">分组：</span>
          <span class="group-text">{{ info.friendGroup || "未分组" }}</span>
        </div>
      </div>

      <!-- 更多信息 -->
      <div class="friend-more-info">
        <div class="info-section">
          <h4 class="section-title">个人信息</h4>

          <div v-if="info.friendSignature" class="info-row">
            <span class="info-label">个性签名：</span>
            <span class="info-value">{{ info.friendSignature }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">昵称：</span>
            <span class="info-value">{{ info.friendNickname }}</span>
          </div>

          <div
            v-if="info.friendGender !== undefined && info.friendGender !== null"
            class="info-row"
          >
            <span class="info-label">性别：</span>
            <span class="info-value">{{ genderText }}</span>
          </div>

          <div v-if="info.friendBirthday" class="info-row">
            <span class="info-label">生日：</span>
            <span class="info-value">{{ info.friendBirthday }}</span>
          </div>

          <div v-if="info.friendLocation" class="info-row">
            <span class="info-label">地区：</span>
            <span class="info-value">{{ info.friendLocation }}</span>
          </div>

          <div v-if="info.friendPhone" class="info-row">
            <span class="info-label">手机号：</span>
            <span class="info-value">{{ info.friendPhone }}</span>
          </div>

          <div v-if="info.friendEmail" class="info-row">
            <span class="info-label">邮箱：</span>
            <span class="info-value">{{ info.friendEmail }}</span>
          </div>

          <div v-if="info.addTime" class="info-row">
            <span class="info-label">添加时间：</span>
            <span class="info-value">{{ info.addTime }}</span>
          </div>

          <div v-if="info.friendLastLoginTime" class="info-row">
            <span class="info-label">最后登录：</span>
            <span class="info-value">{{ info.friendLastLoginTime }}</span>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="friend-actions friend-actions-bottom">
          <button
            class="action-btn primary"
            @click="handleStartChat"
            type="button"
            title="发起聊天"
            aria-label="发起聊天"
          >
            <span class="action-icon">
              <MessageCircleMore :size="18" :stroke-width="2.2" />
            </span>
          </button>
          <button
            class="action-btn secondary danger"
            @click="handleDeleteFriend"
            type="button"
            title="删除好友"
            aria-label="删除好友"
          >
            <span class="action-icon">
              <UserX :size="18" :stroke-width="2.2" />
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from "vue";
import { ArrowLeft, MessageCircleMore, UserX } from "lucide-vue-next";
import { useFriendStore } from "@/store/friend/showFriend";
import type { FriendListItem } from "@/types/dto/friend";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import {
  resolveFriendDisplayInitial,
  resolveFriendGenderText,
  resolveNormalizedOnlineStatus,
  resolveOnlineStatusClass,
  resolveOnlineStatusText,
} from "@/interactions/friendInfo/FriendInfoInteraction";

type FriendInfoViewModel = FriendListItem & {
  friendNickname?: string;
  friendAvatar?: string | null;
  friendGender?: number | null;
  friendGroup?: string | null;
  friendBirthday?: string | null;
  friendLocation?: string | null;
  friendSignature?: string | null;
  friendPhone?: string | null;
  friendEmail?: string | null;
  friendOnlineStatus?: number | null;
  friendLastLoginTime?: string | null;
};

const props = defineProps<{
  friend: FriendListItem;
}>();

const emit = defineEmits<{
  back: [];
  "send-message": [friend: FriendListItem];
  "delete-friend": [friend: FriendListItem];
}>();

const friendStore = useFriendStore();

/**
 * 当前好友详情数据统一来源于 friend store 的 currentFriend。
 * 使用场景：确保详情页与好友列表数据一致，不再额外维护 friendInfo store 状态。
 */
const info = computed<FriendInfoViewModel | null>(() => {
  if (friendStore.currentFriend) return friendStore.currentFriend;
  return (props.friend as FriendInfoViewModel) || null;
});

const avatarUrl = computed(() =>
  normalizeAvatarUrl(
    (info.value as any)?.avatar || (info.value as any)?.friendAvatar || ""
  )
);

const displayName = computed(() => {
  if (!info.value) return "未知用户";
  return (
    info.value.remarkName ||
    info.value.friendNickname ||
    info.value.nickname ||
    "未知用户"
  );
});

const displayInitial = computed(() =>
  resolveFriendDisplayInitial(displayName.value)
);

const normalizedOnlineStatus = computed(() => {
  const raw = info.value?.friendOnlineStatus;
  if (raw != null) return resolveNormalizedOnlineStatus(raw);
  const listStatus = info.value?.onlineStatus;
  if (listStatus === "online") return 1;
  if (listStatus === "away") return 2;
  return 0;
});

const onlineStatusText = computed(() => {
  return resolveOnlineStatusText(normalizedOnlineStatus.value);
});

const onlineStatusClass = computed(() => {
  return resolveOnlineStatusClass(normalizedOnlineStatus.value);
});

const genderText = computed(() => {
  return resolveFriendGenderText(info.value?.friendGender);
});

/**
 * 同步当前详情好友上下文到 friend store。
 * 使用场景：详情页首次进入或 friendId 切换时，保持 currentFriend 与页面一致。
 */
function loadInfo() {
  friendStore.setCurrentFriend(props.friend as FriendInfoViewModel);
}

watch(
  () => props.friend?.friendId,
  (id) => {
    if (id) loadInfo();
  }
);

onMounted(() => {
  loadInfo();
});

onUnmounted(() => {
  friendStore.clearCurrentFriend();
});

const handleBack = () => {
  emit("back");
};

const handleStartChat = () => {
  emit("send-message", props.friend);
};

const handleDeleteFriend = () => {
  emit("delete-friend", props.friend);
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-info.css";
@import "@/assets/styles/night/friend-info-night.css";
</style>
