<!-- File: src/components/MessageItem.vue -->
<template>
  <div class="message-item" :data-message-id="String(message.messageId)">
    <div v-if="message.isRecalled" class="message-recalled-line">
      <span class="message-recalled-pill">{{ message.messageContent }}</span>
    </div>
    <!-- 他人发送的消息 -->
    <div v-else-if="!isSentByMe" class="message-wrapper message-left">
      <div
        ref="avatarLeftSectionRef"
        class="avatar-section left"
        :class="{ 'avatar-section--group-peer': showGroupMemberPopoverTrigger }"
        v-bind="leftAvatarA11yAttrs"
        @click.stop="openMessageMemberPopoverFromAnchor"
        @keydown.enter.prevent="openMessageMemberPopoverFromAnchor"
      >
        <div class="avatar-face">
          <img
            v-if="avatarDisplayUrl"
            :src="avatarDisplayUrl"
            alt=""
            class="message-avatar-img"
            @error="onAvatarError"
          />
          <div v-else class="avatar-placeholder"></div>
        </div>
        <div class="display-name">{{ displayName }}</div>
      </div>

      <div class="message-body-col message-body-col--peer">
        <div class="message-bubble-row message-bubble-row--peer">
          <div
            class="message-bubble received"
            :class="{
              'message-bubble--flash': flashAnchor,
              'message-bubble--attachment': isAttachmentMessage,
            }"
          >
            <div
              v-if="flashAnchor"
              class="message-bubble-flash-layer"
              aria-hidden="true"
            />
            <template v-if="isImageMessage">
              <img
                class="message-image-thumb"
                :src="resolvedThumbnailUrl"
                alt="图片消息"
                @click="handleOpenImage"
              />
            </template>
            <template v-else-if="isVideoMessage">
              <div
                class="message-video-thumb-wrap"
                role="button"
                tabindex="0"
                @click="handleOpenVideo"
                @keydown.enter.prevent="handleOpenVideo"
                @keydown.space.prevent="handleOpenVideo"
              >
                <img
                  class="message-video-thumb-img"
                  :src="resolvedVideoPreviewUrl"
                  alt="视频消息"
                />
                <span class="message-video-play-overlay" aria-hidden="true">
                  <Play
                    class="message-video-play-icon"
                    :size="22"
                    :stroke-width="2.2"
                  />
                </span>
              </div>
            </template>
            <template v-else-if="isFileLikeMessage">
              <button
                class="file-message-card"
                type="button"
                @click="handleDownloadFile"
              >
                <div class="file-message-icon">{{ fileCardIcon }}</div>
                <div class="file-message-info">
                  <div class="file-message-name">{{ fileDisplayName }}</div>
                  <div class="file-message-meta">
                    {{ fileDisplaySize }} · {{ fileDisplayMimeType }}
                  </div>
                </div>
              </button>
            </template>
            <div v-else class="message-text">{{ message.messageContent }}</div>
            <div class="message-time">{{ formatTime(message.sendTime) }}</div>
          </div>
          <!-- 他人消息：气泡右侧从左到右 @ → 回复 → 撤回（与本人侧 撤回→回复→@ 中心对称） -->
          <button
            type="button"
            class="message-at-btn"
            title="@该发送者"
            aria-label="@该发送者"
            @click="emitStartAtMention"
          >
            <AtSign :size="22" :stroke-width="2.2" />
          </button>
          <button
            type="button"
            class="message-reply-btn"
            title="回复"
            aria-label="回复"
            @click="emitStartReply"
          >
            <Reply :size="22" :stroke-width="2.2" />
          </button>
          <button
            v-if="canRecallCurrentMessage"
            type="button"
            class="message-recall-btn"
            :disabled="recallLoading"
            title="撤回"
            aria-label="撤回"
            @click="emitRecallMessage"
          >
            <Trash :size="22" :stroke-width="2.2" />
          </button>
        </div>
        <div v-if="replyQuoteDisplay" class="message-reply-quote">
          <span class="message-reply-quote__sender">{{ replyQuoteDisplay.label }}</span>
          <span class="message-reply-quote__sep">：</span>
          <span class="message-reply-quote__text">{{ replyQuoteDisplay.text }}</span>
        </div>
        <div
          v-if="atMentionsLine?.length"
          class="message-at-mentions-bar message-at-mentions-bar--peer"
        >
          <span
            v-for="row in atMentionsLine"
            :key="row.userId"
            class="message-at-mention-chip"
            >@{{ row.label }}</span
          >
        </div>
      </div>
    </div>

    <!-- 自己发送的消息 -->
    <div v-else class="message-wrapper message-right message-sent">
      <div class="message-body-col message-body-col--self">
        <div class="message-bubble-row message-bubble-row--self">
          <!-- 本人消息：气泡左侧从左到右 撤回 → 回复 → @（与他人侧 @→回复→撤回 中心对称） -->
          <button
            v-if="canRecallCurrentMessage"
            type="button"
            class="message-recall-btn message-recall-btn--self"
            :disabled="recallLoading"
            title="撤回"
            aria-label="撤回"
            @click="emitRecallMessage"
          >
            <Trash :size="22" :stroke-width="2.2" />
          </button>
          <button
            type="button"
            class="message-reply-btn message-reply-btn--self"
            title="回复"
            aria-label="回复"
            @click="emitStartReply"
          >
            <Reply :size="22" :stroke-width="2.2" />
          </button>
          <button
            type="button"
            class="message-at-btn message-at-btn--self"
            title="@该发送者"
            aria-label="@该发送者"
            @click="emitStartAtMention"
          >
            <AtSign :size="22" :stroke-width="2.2" />
          </button>
          <div
            class="message-bubble sent"
            :class="{
              'message-bubble--flash': flashAnchor,
              'message-bubble--attachment': isAttachmentMessage,
            }"
          >
            <div
              v-if="flashAnchor"
              class="message-bubble-flash-layer"
              aria-hidden="true"
            />
            <template v-if="isImageMessage">
              <img
                class="message-image-thumb"
                :src="resolvedThumbnailUrl"
                alt="图片消息"
                @click="handleOpenImage"
              />
            </template>
            <template v-else-if="isVideoMessage">
              <div
                class="message-video-thumb-wrap"
                role="button"
                tabindex="0"
                @click="handleOpenVideo"
                @keydown.enter.prevent="handleOpenVideo"
                @keydown.space.prevent="handleOpenVideo"
              >
                <img
                  class="message-video-thumb-img"
                  :src="resolvedVideoPreviewUrl"
                  alt="视频消息"
                />
                <span class="message-video-play-overlay" aria-hidden="true">
                  <Play
                    class="message-video-play-icon"
                    :size="22"
                    :stroke-width="2.2"
                  />
                </span>
              </div>
            </template>
            <template v-else-if="isFileLikeMessage">
              <button
                class="file-message-card"
                type="button"
                @click="handleDownloadFile"
              >
                <div class="file-message-icon">{{ fileCardIcon }}</div>
                <div class="file-message-info">
                  <div class="file-message-name">{{ fileDisplayName }}</div>
                  <div class="file-message-meta">
                    {{ fileDisplaySize }} · {{ fileDisplayMimeType }}
                  </div>
                </div>
              </button>
            </template>
            <div v-else class="message-text">{{ message.messageContent }}</div>
            <div class="message-time">{{ formatTime(message.sendTime) }}</div>
          </div>
        </div>
        <div
          v-if="replyQuoteDisplay"
          class="message-reply-quote message-reply-quote--self"
        >
          <span class="message-reply-quote__sender">{{ replyQuoteDisplay.label }}</span>
          <span class="message-reply-quote__sep">：</span>
          <span class="message-reply-quote__text">{{ replyQuoteDisplay.text }}</span>
        </div>
        <div
          v-if="atMentionsLine?.length"
          class="message-at-mentions-bar message-at-mentions-bar--self"
        >
          <span
            v-for="row in atMentionsLine"
            :key="row.userId"
            class="message-at-mention-chip"
            >@{{ row.label }}</span
          >
        </div>
      </div>

      <div class="avatar-section right">
        <div class="avatar-face">
          <img
            v-if="avatarDisplayUrl"
            :src="avatarDisplayUrl"
            alt=""
            class="message-avatar-img"
            @error="onAvatarError"
          />
          <div v-else class="avatar-placeholder"></div>
        </div>
        <div class="display-name">{{ displayName }}</div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="videoDialogVisible"
      ref="videoOverlayRef"
      class="message-video-overlay"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-label="视频播放"
      @click.self="closeVideoPlayerOverlay"
      @keydown.escape.prevent="closeVideoPlayerOverlay"
    >
      <button
        type="button"
        class="message-video-close-btn"
        aria-label="关闭"
        @click.stop="closeVideoPlayerOverlay"
      >
        <X :size="22" :stroke-width="2.2" />
      </button>
      <video
        class="message-video-player"
        :src="videoDialogSrc || undefined"
        controls
        playsinline
        preload="metadata"
        @click.stop
      />
    </div>
  </Teleport>

  <Teleport to="body">
    <GroupMemberPopover
      v-if="messageMemberPopover"
      ref="groupMemberPopoverRef"
      :member="messageMemberPopover"
      :panel-style="messageMemberPopoverStyle"
      :conv-owner-id="messagePopoverConvOwnerId"
      :is-self="isMessagePopoverMemberSelf"
      :show-group-manage="showMessagePopoverGroupManage"
      :can-mute="canMuteMessagePopoverMember"
      :can-unmute="canUnmuteMessagePopoverMember"
      :show-send-message="showMessagePopoverSendMessageAction"
      :show-add-friend="showMessagePopoverAddFriendAction"
      :action-loading="messageMemberPopoverActionLoading"
      @kick="handleMessageMemberKick"
      @mute="handleMessageMemberMute"
      @unmute="handleMessageMemberUnmute"
      @send-message="handleMessageMemberSendMessage"
      @add-friend="handleMessageMemberAddFriend"
    />
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  watchEffect,
  nextTick,
} from "vue";
import { AtSign, Play, Reply, Trash, X } from "lucide-vue-next";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import {
  buildFileDownloadUrl,
  buildFileThumbnailUrl,
} from "@/commons/utils/file-url";
import { useShowMessageStore } from "@/store/message/showMessage";
import { useImagePreviewStore } from "@/store/message/imagePreview";
import { useConvStore } from "@/store/conv/conv";
import { useUserStore } from "@/store/user/user";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { useConvCreateStore } from "@/store/conv/convCreate";
import { useAppBootstrapStore } from "@/store/app/bootstrap";
import {
  executeFriendRequestFlow,
  mapFriendRequestErrorMessage,
} from "@/interactions/userSearch/UserSearchInteraction";
import toast from "@/commons/utils/toast";
import {
  getMemberEffectiveStatus,
  isGroupOwnerMember,
  memberListLabel,
} from "@/commons/utils/group-member-card-display";
import {
  clampMemberPopoverWithinViewportBottom as clampGroupMemberPopoverBottom,
  computeMemberPopoverPosition,
} from "@/commons/utils/group-member-popover-layout";
import GroupMemberPopover from "./GroupMemberPopover.vue";
import type { DisplayMessage } from "@/entity/message";
import { MemberStatus } from "@/entity/conversation-member";
import type { ConversationMemberDTO } from "@/types/dto/conversation-member";
import type {
  ConversationSummaryDTO,
  MessageDisplayMemberDTO,
} from "@/types/dto/conversation";
import { FriendRelationStatus, type FriendListItem } from "@/types/dto/friend";
import { formatQuotedMessageContentPreview } from "@/commons/utils/message-reply-content-preview";

interface Props {
  message: DisplayMessage;
  /** 搜索跳转锚点：灰色与默认背景交替闪烁约 3 秒 */
  flashAnchor?: boolean;
  /** 1 单聊 2 群聊；与 ChatContainer 当前会话一致 */
  convType?: number | null;
  /** 当前登录用户 ID；用于撤回权限计算。 */
  currentUserId?: number | null;
  /** 当前登录用户在当前群中的角色（0 成员 1 管理员 2 群主）。 */
  currentUserRole?: number | null;
  /** 当前消息是否正处于撤回请求中。 */
  recallLoading?: boolean;
}

const props = defineProps<Props>();

/** 交给 ChatContainer：回复 / @ 提及（可多选 sender）。 */
const emit = defineEmits<{
  "start-reply": [message: DisplayMessage];
  "start-at-mention": [message: DisplayMessage];
  "recall-message": [message: DisplayMessage];
}>();

const showMessageStore = useShowMessageStore();
const imagePreviewStore = useImagePreviewStore();
const convStore = useConvStore();
const authStore = useUserStore();
const friendStore = useFriendStore();
const conversationInfoStore = useConversationInfoStore();
const convCreateStore = useConvCreateStore();
const appBootstrapStore = useAppBootstrapStore();

const isAvatarLoadSuccessful = ref(true);

/** 会话类型优先使用父组件传入，未就绪时回退到 convStore 映射。 */
const resolvedConvType = computed<number | null>(() => {
  if (props.convType != null) return Number(props.convType);
  const conv = convStore.conversationMap.get(Number(props.message.convId));
  return conv?.convType == null ? null : Number(conv.convType);
});

const rawAvatarSource = computed(() => {
  if (resolvedConvType.value === 1) {
    if (props.message.isSentByMe) return authStore.user?.userAvatar || "";
    const conv = convStore.conversationMap.get(Number(props.message.convId));
    return conv?.convAvatar || "";
  }
  if (props.message.isSentByMe) return authStore.user?.userAvatar || "";
  return props.message.senderAvatar || "";
});

watch(rawAvatarSource, () => {
  isAvatarLoadSuccessful.value = true;
});

const avatarDisplayUrl = computed(() => {
  if (!isAvatarLoadSuccessful.value) return "";
  return normalizeAvatarUrl(rawAvatarSource.value);
});

const onAvatarError = () => {
  isAvatarLoadSuccessful.value = false;
};

const isSentByMe = computed(() => props.message.isSentByMe);
const recallLoading = computed(() => !!props.recallLoading);

/**
 * 判断当前消息是否可撤回。
 * 使用场景：控制消息操作区是否显示撤回按钮。
 */
const canRecallCurrentMessage = computed(() => {
  if (props.message.isRecalled) return false;
  const currentUserId = Number(props.currentUserId);
  if (!Number.isFinite(currentUserId) || currentUserId <= 0) return false;

  const sendTimeMs = Date.parse(props.message.sendTime || "");
  const withinTwoMinutes =
    Number.isFinite(sendTimeMs) && Date.now() - sendTimeMs <= 2 * 60 * 1000;
  const isSender = Number(props.message.senderId) === currentUserId;
  if (Number(resolvedConvType.value) === 1) {
    return isSender && withinTwoMinutes;
  }

  const role = Number(props.currentUserRole);
  const isAdmin = role === 1 || role === 2;
  return (isSender && withinTwoMinutes) || isAdmin;
});

/**
 * 当本条消息带有 replyToMessageId 时显示引用条：
 * 优先用当前列表里的原消息（备注/群昵称策略与头像旁一致）；
 * 否则用服务端下发的 replyQuote* 快照（他人客户端常见）；
 * 最后才降级为「原消息不在当前记录中」。
 */
const replyQuoteDisplay = computed((): { label: string; text: string } | null => {
  const rawId = props.message.replyToMessageId;
  if (rawId == null || rawId === undefined) return null;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return null;
  void friendStore.friends;
  const replied = showMessageStore.messages.find((m) => m.messageId === id);
  if (replied) {
    return {
      label: showMessageStore.getSenderDisplayName(replied),
      text: formatQuotedMessageContentPreview(replied),
    };
  }
  const ha = (props.message.replyQuoteAuthorHint || "").trim();
  const ht = (props.message.replyQuoteContentHint || "").trim();
  if (ha || ht) {
    return {
      label: ha || "…",
      text: ht || "原消息不在当前记录中",
    };
  }
  return { label: "…", text: "原消息不在当前记录中" };
});

/**
 * 本条消息带 atUserIds（下行/实体字段；库表可能为 at_user_ids）时，在气泡下展示 @群策略名。
 */
const atMentionsLine = computed((): { userId: number; label: string }[] | null => {
  const ids = props.message.atUserIds;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return null;
  void friendStore.friends;
  const convId = Number(props.message.convId);
  const members = convStore.compressedCMMap.get(convId) ?? [];
  const ct = resolvedConvType.value;
  return ids.map((uid) => {
    const n = Number(uid);
    const member = members.find((m) => Number(m.userId) === n);
    return {
      userId: n,
      label: showMessageStore.resolveSenderName(
        n,
        member?.userNickname || "User",
        ct ?? undefined,
        member?.memberNickname ?? null,
        convId
      ),
    };
  });
});

const emitStartReply = () => {
  emit("start-reply", props.message);
};

const emitStartAtMention = () => {
  emit("start-at-mention", props.message);
};

const emitRecallMessage = () => {
  if (recallLoading.value || !canRecallCurrentMessage.value) return;
  emit("recall-message", props.message);
};

/** 左侧头像区域 DOM；用于计算资料卡 fixed 位置与 document 点击判断。 */
const avatarLeftSectionRef = ref<HTMLElement | null>(null);
/** 群聊他人消息头像旁展开的成员资料；为 null 时不渲染 Teleport。 */
const messageMemberPopover = ref<ConversationMemberDTO | null>(null);
/** 资料卡 fixed 定位坐标。 */
const messageMemberPopoverPos = ref({ top: 0, left: 0 });
/** 最近一次打开资料卡的头像区元素；避免点同一头像误关。 */
const messageMemberPopoverAnchorRef = ref<HTMLElement | null>(null);
/** 资料卡子组件实例；用于测量高度与点击穿透。 */
const groupMemberPopoverRef = ref<{ panelRef: HTMLElement | null } | null>(
  null
);
/** 资料卡上踢人/禁言/发消息等请求进行中。 */
const messageMemberPopoverActionLoading = ref(false);

const showGroupMemberPopoverTrigger = computed(
  () => resolvedConvType.value === 2 && !isSentByMe.value
);

/**
 * 仅在群聊他人消息头像上附加可聚焦/按钮语义；单聊不抢键盘焦点。
 * 使用场景：与 `openMessageMemberPopoverFromAnchor` 配合的无障碍属性。
 */
const leftAvatarA11yAttrs = computed(() =>
  showGroupMemberPopoverTrigger.value
    ? ({ role: "button" as const, tabindex: 0 } as const)
    : ({ tabindex: -1 } as const)
);

/**
 * 从会话摘要中取群主 ID（若后端未挂在 summary 上则为 0，仍可依赖成员 role 判断群主）。
 * 使用场景：消息区成员资料卡「本群角色」与踢人权限。
 */
const messagePopoverConvOwnerId = computed((): number => {
  const conv = convStore.conversationMap.get(Number(props.message.convId)) as
    | (ConversationSummaryDTO & { convOwnerId?: number })
    | undefined;
  return Number(conv?.convOwnerId || 0);
});

/** 当前群会话成员缓存行；用于群主判断与禁言角标逻辑。 */
const membersForMessageConv = computed(() =>
  convStore.compressedCMMap.get(Number(props.message.convId)) ?? []
);

const isCurrentUserGroupOwnerForMessage = computed(() => {
  const myUserId = Number(authStore.user?.userId || 0);
  if (myUserId <= 0) return false;
  const oid = messagePopoverConvOwnerId.value;
  if (oid > 0 && oid === myUserId) return true;
  const me = membersForMessageConv.value.find(
    (m) => Number(m.userId) === myUserId
  );
  return me
    ? isGroupOwnerMember(me as MessageDisplayMemberDTO, oid)
    : false;
});

const getAuthUserIdForMessage = (): number => {
  const raw = authStore.user?.userId;
  if (raw == null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const isMessagePopoverMemberSelf = computed(() => {
  const me = getAuthUserIdForMessage();
  if (me <= 0 || !messageMemberPopover.value) return false;
  return Number(messageMemberPopover.value.userId) === me;
});

const findFriendRowByPeerUserIdForMessage = (
  peerUserId: number
): FriendListItem | undefined => {
  const pid = Number(peerUserId);
  if (!Number.isFinite(pid) || pid <= 0) return undefined;
  return friendStore.friends.find(
    (f) => Number(f.friendId) === pid || Number(f.userId) === pid
  );
};

const messagePopoverPeerRelationRow = computed((): FriendListItem | null => {
  const m = messageMemberPopover.value;
  if (!m) return null;
  return findFriendRowByPeerUserIdForMessage(Number(m.userId)) ?? null;
});

const isMessagePopoverPeerActiveFriend = computed((): boolean => {
  const row = messagePopoverPeerRelationRow.value;
  if (!row) return false;
  const r = Number(row.relationStatus);
  return (
    r === FriendRelationStatus.FRIEND_PINNED ||
    r === FriendRelationStatus.NORMAL
  );
});

const showMessagePopoverSendMessageAction = computed(
  () => isMessagePopoverPeerActiveFriend.value
);

const showMessagePopoverAddFriendAction = computed(
  () => !isMessagePopoverPeerActiveFriend.value
);

const showMessagePopoverGroupManage = computed(() => {
  if (!isCurrentUserGroupOwnerForMessage.value || isMessagePopoverMemberSelf.value)
    return false;
  const m = messageMemberPopover.value;
  if (!m) return false;
  const oid = messagePopoverConvOwnerId.value;
  if (isGroupOwnerMember(m, oid)) return false;
  return getMemberEffectiveStatus(m) !== MemberStatus.QUIT;
});

const canMuteMessagePopoverMember = computed(
  () =>
    showMessagePopoverGroupManage.value &&
    !!messageMemberPopover.value &&
    getMemberEffectiveStatus(messageMemberPopover.value) === MemberStatus.NORMAL
);

const canUnmuteMessagePopoverMember = computed(
  () =>
    showMessagePopoverGroupManage.value &&
    !!messageMemberPopover.value &&
    getMemberEffectiveStatus(messageMemberPopover.value) === MemberStatus.MUTED
);

const messageMemberPopoverStyle = computed(() => ({
  top: `${messageMemberPopoverPos.value.top}px`,
  left: `${messageMemberPopoverPos.value.left}px`,
}));

/**
 * 将资料卡顶边限制在视口内。
 * 使用场景：消息头像旁打开成员卡后的 nextTick / rAF。
 */
const clampMessageMemberPopoverWithinViewportBottom = () => {
  const el = groupMemberPopoverRef.value?.panelRef;
  if (!el) return;
  const next = clampGroupMemberPopoverBottom(el, messageMemberPopoverPos.value);
  if (next.top !== messageMemberPopoverPos.value.top) {
    messageMemberPopoverPos.value = {
      ...messageMemberPopoverPos.value,
      top: next.top,
    };
  }
};

/**
 * 关闭消息区成员资料卡。
 * 使用场景：点击空白、重复点头像、踢人成功后。
 */
const closeMessageMemberPopover = () => {
  messageMemberPopover.value = null;
  messageMemberPopoverAnchorRef.value = null;
};

/**
 * 确保已加载群成员压缩列表后，在他人头像旁打开/切换资料卡；若发送者已不在成员缓存（通常已被踢），则不展示。
 * 使用场景：群聊消息左侧头像点击或 Enter。
 */
const openMessageMemberPopoverFromAnchor = async () => {
  if (!showGroupMemberPopoverTrigger.value) return;
  const anchor = avatarLeftSectionRef.value;
  if (!anchor) return;
  const convId = Number(props.message.convId);
  const senderId = Number(props.message.senderId);
  if (!Number.isFinite(convId) || convId <= 0) return;
  if (!Number.isFinite(senderId) || senderId <= 0) return;

  await convStore.loadCompressedCM(convId, false);
  const list = convStore.compressedCMMap.get(convId) ?? [];
  const memberRow = list.find((m) => Number(m.userId) === senderId);
  if (!memberRow) {
    return;
  }

  messageMemberPopoverAnchorRef.value = anchor;
  if (messageMemberPopover.value?.userId === memberRow.userId) {
    closeMessageMemberPopover();
    return;
  }

  messageMemberPopover.value = memberRow as ConversationMemberDTO;
  const rect = anchor.getBoundingClientRect();
  messageMemberPopoverPos.value = computeMemberPopoverPosition(rect);

  await nextTick();
  clampMessageMemberPopoverWithinViewportBottom();
  requestAnimationFrame(() => {
    clampMessageMemberPopoverWithinViewportBottom();
  });
};

watchEffect((onCleanup) => {
  if (!messageMemberPopover.value) return;
  const onDocClick = (e: MouseEvent) => {
    const t = e.target as Node | null;
    if (!t) return;
    if (groupMemberPopoverRef.value?.panelRef?.contains(t)) return;
    if (messageMemberPopoverAnchorRef.value?.contains(t)) return;
    closeMessageMemberPopover();
  };
  document.addEventListener("click", onDocClick, false);
  onCleanup(() => document.removeEventListener("click", onDocClick, false));
});

/**
 * 同步资料卡上的成员对象与 Pinia 压缩成员列表中的最新一行。
 * 使用场景：禁言/解禁后 store 已更新引用，避免卡片上状态滞后。
 */
const syncMessagePopoverMemberFromCompressed = () => {
  const m = messageMemberPopover.value;
  if (!m) return;
  const uid = Number(m.userId);
  const convId = Number(props.message.convId);
  const fresh = convStore.compressedCMMap.get(convId)?.find(
    (x) => Number(x.userId) === uid
  );
  if (fresh) {
    messageMemberPopover.value = fresh as ConversationMemberDTO;
  } else {
    closeMessageMemberPopover();
  }
};

/**
 * 群主在消息列表中踢出该成员。
 * 使用场景：资料卡「踢出」与群资料页行为一致。
 */
const handleMessageMemberKick = async () => {
  const m = messageMemberPopover.value;
  const convId = Number(props.message.convId);
  if (!m || !Number.isFinite(convId) || convId <= 0) return;
  if (messageMemberPopoverActionLoading.value) return;
  const label = memberListLabel(m);
  if (!window.confirm(`确定将「${label}」移出群聊？`)) return;
  messageMemberPopoverActionLoading.value = true;
  try {
    const msg = await conversationInfoStore.removeGroupMember(convId, m.userId);
    toast.success(msg);
    closeMessageMemberPopover();
    await convStore.refreshConversationById(convId);
    await convStore.loadCompressedCM(convId, true);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "操作失败");
  } finally {
    messageMemberPopoverActionLoading.value = false;
  }
};

/**
 * 群主在消息列表中禁言该成员。
 */
const handleMessageMemberMute = async () => {
  const m = messageMemberPopover.value;
  const convId = Number(props.message.convId);
  if (!m || !Number.isFinite(convId) || convId <= 0) return;
  if (messageMemberPopoverActionLoading.value) return;
  messageMemberPopoverActionLoading.value = true;
  try {
    const msg = await conversationInfoStore.muteGroupMember(convId, m.userId);
    toast.success(msg);
    await convStore.patchConversationMemberStatusLocal(
      convId,
      m.userId,
      MemberStatus.MUTED
    );
    syncMessagePopoverMemberFromCompressed();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "操作失败");
  } finally {
    messageMemberPopoverActionLoading.value = false;
  }
};

/**
 * 群主在消息列表中解除该成员禁言。
 */
const handleMessageMemberUnmute = async () => {
  const m = messageMemberPopover.value;
  const convId = Number(props.message.convId);
  if (!m || !Number.isFinite(convId) || convId <= 0) return;
  if (messageMemberPopoverActionLoading.value) return;
  messageMemberPopoverActionLoading.value = true;
  try {
    const msg = await conversationInfoStore.unmuteGroupMember(convId, m.userId);
    toast.success(msg);
    await convStore.patchConversationMemberStatusLocal(
      convId,
      m.userId,
      MemberStatus.NORMAL
    );
    syncMessagePopoverMemberFromCompressed();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "操作失败");
  } finally {
    messageMemberPopoverActionLoading.value = false;
  }
};

/**
 * 从消息区成员卡打开与该用户的单聊。
 */
const handleMessageMemberSendMessage = async () => {
  const m = messageMemberPopover.value;
  if (!m || messageMemberPopoverActionLoading.value) return;
  if (!isMessagePopoverPeerActiveFriend.value) return;
  const peerId = Number(m.userId);
  const me = getAuthUserIdForMessage();
  if (me <= 0 || peerId === me) return;
  messageMemberPopoverActionLoading.value = true;
  try {
    const result = await convCreateStore.openOrCreateSingleConversation({
      peerUserId: peerId,
      currentUserId: me,
      loadMessages: (cid) => showMessageStore.loadMessages(cid),
      loadConversationsBootstrap: (userId) =>
        appBootstrapStore.loadOne("conversations", userId),
    });
    if (!result.ok) {
      if (result.message) toast.error(result.message);
      return;
    }
    closeMessageMemberPopover();
  } catch (e) {
    console.error("打开单聊失败:", e);
    toast.error("打开会话失败，请稍后重试");
  } finally {
    messageMemberPopoverActionLoading.value = false;
  }
};

/**
 * 从消息区成员卡向该用户发好友申请。
 */
const handleMessageMemberAddFriend = async () => {
  const m = messageMemberPopover.value;
  if (!m || messageMemberPopoverActionLoading.value) return;
  const targetId = Number(m.userId);
  const me = getAuthUserIdForMessage();
  if (me <= 0 || targetId === me) return;
  messageMemberPopoverActionLoading.value = true;
  try {
    const result = await executeFriendRequestFlow({
      targetUserId: targetId,
      isSelfTarget: false,
      sendFriendRequest: (id) => friendStore.sendFriendRequest(id),
    });
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  } catch (e: unknown) {
    toast.error(mapFriendRequestErrorMessage(e));
  } finally {
    messageMemberPopoverActionLoading.value = false;
  }
};
// 统一解析 image/file/video 的 JSON 消息体，兼容服务端回放和本地临时消息。
const parsedFilePayload = computed(() => {
  if (!["image", "file", "video"].includes(props.message.messageType || ""))
    return null;
  if (!props.message.messageContent) return null;
  try {
    const payload = JSON.parse(props.message.messageContent) as {
      fileId?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      /** 视频首帧或封面地址；优先于缩略图接口用于展示 */
      videoPreviewUrl?: string;
    };
    return payload;
  } catch {
    return null;
  }
});
const isImageMessage = computed(() => props.message.messageType === "image");
/** 是否为视频类消息（缩略图 + 弹窗播放，与图片并列） */
const isVideoMessage = computed(() => props.message.messageType === "video");
const isFileLikeMessage = computed(() => props.message.messageType === "file");
const isAttachmentMessage = computed(
  () => isImageMessage.value || isVideoMessage.value || isFileLikeMessage.value
);
const resolvedDownloadUrl = computed(() => {
  const directUrl = props.message.downloadUrl;
  if (directUrl) return directUrl;
  const fileId = props.message.fileId || parsedFilePayload.value?.fileId;
  return fileId ? buildFileDownloadUrl(fileId) : "";
});
const resolvedThumbnailUrl = computed(() => {
  const directUrl = props.message.thumbnailUrl;
  if (directUrl) return directUrl;
  const fileId = props.message.fileId || parsedFilePayload.value?.fileId;
  return fileId ? buildFileThumbnailUrl(fileId) : "";
});
/**
 * 视频消息列表缩略图地址。
 * 使用场景：优先展示 message_content.videoPreviewUrl（首帧图），缺省时回退与普通图片相同的缩略图规则。
 */
const resolvedVideoPreviewUrl = computed(() => {
  const raw = parsedFilePayload.value?.videoPreviewUrl;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return resolvedThumbnailUrl.value;
});
const fileDisplayName = computed(
  () =>
    props.message.fileName || parsedFilePayload.value?.fileName || "附件文件"
);
const fileDisplaySize = computed(() => {
  const rawSize =
    props.message.fileSize ?? parsedFilePayload.value?.fileSize ?? 0;
  if (rawSize < 1024) return `${rawSize} B`;
  if (rawSize < 1024 * 1024) return `${(rawSize / 1024).toFixed(1)} KB`;
  if (rawSize < 1024 * 1024 * 1024)
    return `${(rawSize / 1024 / 1024).toFixed(1)} MB`;
  return `${(rawSize / 1024 / 1024 / 1024).toFixed(1)} GB`;
});
const fileDisplayMimeType = computed(
  () =>
    props.message.fileMimeType || parsedFilePayload.value?.mimeType || "file/*"
);
const fileCardIcon = computed(() => "📄");

/**
 * 打开图片原图。
 * 作用场景：图片消息点击缩略图后查看原图。
 */
const handleOpenImage = () => {
  if (!resolvedDownloadUrl.value) return;
  void imagePreviewStore.openPreviewByDownloadUrl(resolvedDownloadUrl.value);
};

/** 全屏遮罩是否显示；与 videoDialogSrc 配合，仅渲染 video 本体（无 el-dialog 白底标题栏） */
const videoDialogVisible = ref(false);
/** 遮罩内 video 的 src，指向 /MIO/file/{fileId}/download */
const videoDialogSrc = ref("");
const videoOverlayRef = ref<HTMLElement | null>(null);

/**
 * 关闭视频全屏遮罩并清空 src。
 * 使用场景：点遮罩空白、关闭按钮或 Esc；v-if 卸载 video 节点以释放解码。
 */
const closeVideoPlayerOverlay = () => {
  videoDialogVisible.value = false;
  videoDialogSrc.value = "";
};

/**
 * 打开视频全屏遮罩。
 * 使用场景：用户点击缩略图后在暗色背景上居中展示原生 video（仅 controls，无外层卡片）。
 */
const handleOpenVideo = () => {
  if (!resolvedDownloadUrl.value) return;
  videoDialogSrc.value = resolvedDownloadUrl.value;
  videoDialogVisible.value = true;
  void nextTick(() => {
    videoOverlayRef.value?.focus();
  });
};

/**
 * 下载普通附件。
 * 作用场景：file 类型消息点击卡片后在新窗口打开下载链接。
 */
const handleDownloadFile = () => {
  if (!resolvedDownloadUrl.value) return;
  window.open(resolvedDownloadUrl.value, "_blank");
};

// 依赖好友列表，使修改备注后消息中的对方名称实时更新（优先级：群昵称 > 好友备注 > 用户昵称）
const displayName = computed(() => {
  void friendStore.friends;
  return showMessageStore.getSenderDisplayName(props.message);
});

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  try {
    const date = new Date(timeStr);
    return (
      date.getHours().toString().padStart(2, "0") +
      ":" +
      date.getMinutes().toString().padStart(2, "0")
    );
  } catch (e) {
    console.error("时间格式化错误:", e);
    return "";
  }
};
</script>

<style scoped>
/* 导入对应主题的样式 */
@import "@/assets/styles/message-item.css";

/* 搜索锚点：叠在气泡上的蒙层，只改 opacity。
 * 使用「每周期 0→亮→0」+ 偶数次 repeat + forwards，避免 alternate+偶数次停在 from 上导致结束时仍较亮、移除时突兀 */
@keyframes message-bubble-anchor-flash {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.38;
  }
  100% {
    opacity: 0;
  }
}

.message-bubble.message-bubble--flash {
  position: relative;
}

.message-bubble-flash-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: rgb(0 0 0 / 1);
  opacity: 0;
  animation: message-bubble-anchor-flash 0.5s ease-in-out 6 forwards;
}

.message-bubble.message-bubble--flash .message-text {
  position: relative;
  z-index: 2;
}

.message-bubble.message-bubble--flash .message-image-thumb,
.message-bubble.message-bubble--flash .message-video-thumb-wrap {
  position: relative;
  z-index: 2;
}

/* 保持全局里的 position:absolute 布局，仅抬高层级盖住蒙层 */
.message-bubble.message-bubble--flash .message-time {
  z-index: 2;
}
</style>
