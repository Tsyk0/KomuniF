<!-- File: src/components/ChatContainer.vue -->
<template>
  <div class="chat-container">
    <div
      v-if="convId"
      class="chat-layout"
      :class="{
        'info-open': isGroupInfoOpen && (isGroupChat || singlePeerUserId),
      }"
    >
      <!-- 左侧聊天主区域 -->
      <div class="chat-main">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <div
            class="header-left"
            :class="{ clickable: isGroupChat || !!singlePeerUserId }"
            @click="handleHeaderLeftClick"
          >
            <div class="chat-info">
              <div class="avatar-wrapper">
                <div class="chat-avatar">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    alt="会话头像"
                    class="chat-avatar-img"
                    @error="handleAvatarError"
                  />
                  <span v-else>{{ firstChar }}</span>
                </div>
              </div>
              <div class="chat-details">
                <h3 class="chat-name">{{ conversationDisplayName }}</h3>
                <p
                  v-if="chatStatusText || isCurrentUserMutedInGroup"
                  class="chat-status"
                >
                  <template v-if="isCurrentUserMutedInGroup"
                    >您已被禁言</template
                  >
                  <template v-else-if="chatStatusText">{{
                    chatStatusText
                  }}</template>
                </p>
              </div>
            </div>
          </div>

          <div class="header-right">
            <button
              v-if="canVoiceVideoCall"
              class="header-action"
              @click="handleCall"
              v-ripple
              title="音视频通话（单聊）"
            >
              <Video class="action-icon" :size="22" :stroke-width="2.2" />
            </button>
            <button
              class="header-action"
              @click="handleSearch"
              v-ripple
              title="搜索"
            >
              <Search class="action-icon" :size="22" :stroke-width="2.2" />
            </button>
            <button
              class="header-action"
              @click="handleMenu"
              v-ripple
              title="更多"
            >
              <CircleEllipsis
                class="action-icon"
                :size="22"
                :stroke-width="2.2"
              />
            </button>
          </div>
          <div v-if="uploadState.visible" class="header-upload-progress-line">
            <div
              class="header-upload-progress-inner"
              :style="{ width: `${uploadState.progress}%` }"
            ></div>
          </div>
        </div>

        <!-- 消息列表区域 -->
        <div
          class="messages-container"
          :class="{
            'search-open': isSearchOpen,
            'messages-loading': !isMessagesReady,
          }"
          ref="messagesContainer"
          @scroll="
            updateIsAtBottom();
            !isSearchOpen &&
              !isRestoringScroll &&
              scheduleMessagesScrollPagination();
          "
        >
          <!-- 搜索打开时：只显示搜索面板（通过 v-if 彻底隐藏原消息列表） -->
          <Transition name="chat-search-slide">
            <ChatSearchPanel
              v-if="isSearchOpen"
              :open="isSearchOpen"
              :conv-id="convId"
              :conv-type="currentConvTypeOrNull"
              @close="
                isSearchOpen = false;
                void restoreMessageScrollPosition();
              "
              @jump-to-message="handleJumpToSearchMessage"
            />
          </Transition>

          <!-- 搜索关闭时：显示正常消息列表 -->
          <template v-if="!isSearchOpen">
            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-indicator">加载消息中...</div>

            <!-- 消息列表 -->
            <div class="messages-list">
              <!-- 每条消息使用MessageItem组件 -->
              <div v-for="message in messages" :key="messageListRowKey(message)">
                <MessageItem
                  :message="message"
                  :conv-type="currentConvTypeOrNull"
                  :current-user-id="currentUserId"
                  :current-user-role="currentUserRoleInGroup"
                  :recall-loading="recallingMessageIdSet.has(message.messageId)"
                  :flash-anchor="anchorFlashMessageId === message.messageId"
                  @start-reply="handleStartReplyMessage"
                  @start-at-mention="handleStartAtMention"
                  @recall-message="handleRecallMessage"
                />
                <MessageReadReceipt
                  v-if="shouldShowReadReceiptForMessage(message.messageId)"
                  :read-count="currentConvReadReceipt.readCount"
                  :members="currentConvReadReceipt.readMembers"
                  @click="openReadReceiptDialog"
                />
              </div>

              <!-- 没有消息的提示 -->
              <div
                v-if="!isLoading && messages.length === 0"
                class="no-messages"
              >
                暂无消息
              </div>
            </div>
          </template>
        </div>

        <!-- 滚到底部浮动按钮：仅在未处于底部且非搜索模式时显示 -->
        <Transition name="scroll-btn-fade">
          <button
            v-if="!isAtBottom && !isSearchOpen"
            class="scroll-to-bottom-btn"
            type="button"
            aria-label="滚到最新消息"
            title="滚到最新消息"
            v-ripple
            @click="scrollToBottomSmooth"
          >
            <ChevronsDown :size="22" :stroke-width="2.2" />
          </button>
        </Transition>

        <!-- 发送消息区域 -->
        <div class="message-input-container">
          <div
            v-if="isCurrentUserMutedInGroup"
            class="chat-muted-banner"
            role="status"
          >
            您已被禁言，无法发送消息
          </div>
          <div
            v-if="!isCurrentUserMutedInGroup && pendingReplyPreview"
            class="composer-reply-strip"
            role="status"
          >
            <div class="composer-reply-strip__main">
              <span class="composer-reply-strip__label">
                回复 {{ pendingReplyPreview.title }}
              </span>
              <span class="composer-reply-strip__snippet">{{
                pendingReplyPreview.detail
              }}</span>
            </div>
            <button
              type="button"
              class="composer-reply-strip__close"
              aria-label="取消回复"
              @click="composerReplyStore.clearPendingReply()"
            >
              ×
            </button>
          </div>
          <div
            v-if="!isCurrentUserMutedInGroup && pendingAtStripChips.length > 0"
            class="composer-at-strip"
            role="status"
          >
            <div class="composer-at-strip__main">
              <span
                v-for="chip in pendingAtStripChips"
                :key="chip.userId"
                class="composer-at-strip__chip"
                >@{{ chip.label }}</span
              >
            </div>
            <button
              type="button"
              class="composer-at-strip__close"
              aria-label="取消@提及"
              @click="composerAtStore.clearAtTargets()"
            >
              ×
            </button>
          </div>
          <div
            v-if="!isCurrentUserMutedInGroup && pendingFileDrafts.length > 0"
            class="composer-file-strip"
            role="status"
          >
            <div class="composer-file-strip__title">
              待发送附件（回车统一发送）
            </div>
            <div class="composer-file-strip__list">
              <div
                v-for="draft in pendingFileDrafts"
                :key="draft.localDraftId"
                class="composer-file-strip__item"
              >
                <span class="composer-file-strip__name">{{ draft.fileName }}</span>
                <span class="composer-file-strip__meta">{{
                  formatPendingFileSize(draft.fileSize)
                }}</span>
                <button
                  type="button"
                  class="composer-file-strip__remove"
                  :aria-label="`移除附件 ${draft.fileName}`"
                  @click="removePendingFileDraft(draft.localDraftId)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          <div class="composer-row">
            <div class="input-wrapper">
              <button
                class="action-button emoji-button"
                title="表情"
                type="button"
                :disabled="composerDisabled"
              >
                <Smile :size="22" :stroke-width="2.2" />
              </button>

              <!-- 消息输入框 -->
              <div class="message-input-wrapper">
                <el-input
                  v-model="messageText"
                  class="message-input-el"
                  :placeholder="composerPlaceholder"
                  :disabled="composerDisabled"
                  @keydown.enter.exact.prevent="handleEnterKey"
                />
              </div>

              <div class="attachment-trigger-wrap">
                <button
                  class="action-button attachment-button"
                  title="附件"
                  type="button"
                  :disabled="composerDisabled"
                  @click.stop="openFilePicker"
                >
                  <Paperclip :size="22" :stroke-width="2.2" />
                </button>
                <input
                  ref="fileInputRef"
                  class="hidden-file-input"
                  type="file"
                  accept="*/*"
                  @change="handleFilePicked"
                />
              </div>
            </div>
            <button
              class="action-button mic-button"
              title="语音"
              type="button"
              :disabled="composerDisabled"
            >
              <Mic :size="22" :stroke-width="2.2" />
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧会话/好友信息面板（群聊或单聊均可打开） -->
      <div
        v-if="isGroupChat || singlePeerUserId"
        class="chat-conversation-info-wrapper"
        :class="{ open: isGroupInfoOpen, resizing: isResizingInfoPanel }"
        :style="infoPanelStyle"
      >
        <div
          class="info-resize-handle"
          @mousedown="startInfoPanelResize"
          @touchstart.prevent="startInfoPanelResize"
        ></div>
        <GroupConvInfo
          v-if="isGroupChat"
          :conv-id="convId"
          @close="closeGroupInfo"
          @changes-pending="hasInfoPendingChanges = $event"
        />
        <SingleConvInfo
          v-else-if="singlePeerUserId"
          :friend-id="singlePeerUserId"
          @close="closeGroupInfo"
          @changes-pending="hasInfoPendingChanges = $event"
        />
      </div>
    </div>

    <!-- 未选择会话状态 -->
    <div v-else class="no-conversation">
      <div class="placeholder-icon">
        <MessageCircleDashed :size="22" :stroke-width="2.2" />
      </div>
      <p class="placeholder-text">选择一个会话以开始聊天</p>
    </div>

    <Teleport to="body">
      <div
        v-if="imagePreviewState.visible"
        class="image-preview-overlay"
        @click="closeImagePreview"
      >
        <div class="image-preview-stage" @wheel.prevent="handlePreviewWheel">
          <img
            class="image-preview-origin"
            :src="imagePreviewState.imageUrl"
            alt="原图预览"
            :style="imagePreviewTransformStyle"
            @click.stop
            @mousedown.prevent="handlePreviewMouseDown"
          />
        </div>
      </div>
    </Teleport>
    <ReadReceiptMemberListDialog
      :visible="readReceiptDialogVisible"
      :members="currentConvReadReceipt.readMembers"
      :total-count="currentConvReadReceipt.readCount"
      :has-more="currentConvReadReceipt.readMembers.length < currentConvReadReceipt.readCount"
      :loading-more="readReceiptDialogLoadingMore"
      @close="readReceiptDialogVisible = false"
      @load-more="loadMoreReadReceiptMembers"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from "vue";
import { MessageCircleDashed, Mic, Paperclip, Smile } from "lucide-vue-next";
import { CircleEllipsis, Search, Video, ChevronsDown } from "lucide-vue-next";
import { useShowMessageStore } from "@/store/message/showMessage";
import { useComposerReplyStore } from "@/store/message/composerReply";
import { useComposerAtStore } from "@/store/message/composerAt";
import { useSendMessageStore } from "@/store/message/sendMessage";
import { useRecallMessageStore } from "@/store/message/recallMessage";
import { useFileUploadStore } from "@/store/message/fileUpload";
import { useImagePreviewStore } from "@/store/message/imagePreview";
import { useUserStore } from "@/store/user/user";
import { useConvStore } from "@/store/conv/conv";
import { useWebSocketStore } from "@/store/realtime/websocket";
import MessageItem from "./MessageItem.vue";
import MessageReadReceipt from "./MessageReadReceipt.vue";
import ReadReceiptMemberListDialog from "./ReadReceiptMemberListDialog.vue";
import ChatSearchPanel from "./ChatSearchPanel.vue";
import GroupConvInfo from "./GroupConvInfo.vue";
import SingleConvInfo from "./SingleConvInfo.vue";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { getConversationDisplayName } from "@/commons/utils/conversation-display";
import {
  loadConversationMessagesAndSyncRealtime,
  runScrollPaginationStateMachine,
  scrollContainerToBottom,
  isContainerNearBottom,
  runSearchAnchorJumpFlow,
  startInfoPanelResizeFlow,
  handleInfoPanelResizeFlow,
  stopInfoPanelResizeFlow,
  bindWindowWebSocketListeners,
} from "@/interactions/chatContainer/ChatContainerInteraction";
import {
  handleRealtimeIncomingMessage,
  flattenRealtimeNewMessagePayload,
} from "@/normalize/message";
import { formatQuotedMessageContentPreview } from "@/commons/utils/message-reply-content-preview";
import type { DisplayMessage } from "@/entity/message";
import { useFriendStore } from "@/store/friend/showFriend";
import type { User } from "@/entity/user";
import toast from "@/commons/utils/toast";
import { MemberStatus, MemberRole } from "@/entity/conversation-member";

// Store
const showMessageStore = useShowMessageStore();
const composerReplyStore = useComposerReplyStore();
const composerAtStore = useComposerAtStore();
const sendMessageStore = useSendMessageStore();
const recallMessageStore = useRecallMessageStore();
const fileUploadStore = useFileUploadStore();
const imagePreviewStore = useImagePreviewStore();
const authStore = useUserStore();
const websocketStore = useWebSocketStore();
const conversationStore = useConvStore();
const friendStore = useFriendStore();

// Props
const props = defineProps({
  convId: {
    type: Number,
    default: null,
  },
  /** 单聊时对方用户 ID（好友 userId），用于点击 chat-info 打开好友信息面板 */
  friendId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits<{
  search: [];
  menu: [];
  call: [{ convId: number; peerUserId: number }];
}>();

// 当前会话（与会话列表同源，保证 chatinfo 与会话 item 显示一致）
const currentConversation = computed(() => {
  if (props.convId == null) return null;
  const cur = conversationStore.currentConversation;
  if (cur?.convId === props.convId) return cur;
  const fromMap = conversationStore.conversationMap.get(props.convId);
  return fromMap == null ? null : fromMap;
});

/**
 * 当前群聊会话中，本人是否被禁言（summary.memberStatus === 2）。
 * 使用场景：禁用输入区并在发送前拦截（含附件）。
 */
const isCurrentUserMutedInGroup = computed(() => {
  const c = currentConversation.value;
  if (!c || Number(c.convType) !== 2) return false;
  return Number(c.memberStatus) === MemberStatus.MUTED;
});

const composerDisabled = computed(() => isCurrentUserMutedInGroup.value);

const composerPlaceholder = computed(() =>
  isCurrentUserMutedInGroup.value ? "您已被禁言，无法发送消息" : "输入消息..."
);

const conversationDisplayName = computed(() => {
  return getConversationDisplayName(currentConversation.value);
});

const currentConvTypeOrNull = computed(() => {
  const t = currentConversation.value?.convType;
  return t == null ? null : t;
});

/** 单聊对端 userId：仅来源于 currentConversation.peer（Pinia conv 状态）。 */
const singlePeerUserId = computed((): number | null => {
  const c = currentConversation.value;
  if (!c?.peer) return null;
  const peerId = Number(c.peer.peerUserId);
  return Number.isFinite(peerId) && peerId > 0 ? peerId : null;
});

/** 1 对 1 通话：单聊且能解析到对端 userId */
const canVoiceVideoCall = computed(
  () =>
    !!currentConversation.value?.peer &&
    singlePeerUserId.value != null &&
    singlePeerUserId.value > 0
);

// 响应式数据
const messagesContainer = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadState = computed(() => ({
  visible: fileUploadStore.visible,
  fileName: fileUploadStore.fileName,
  progress: fileUploadStore.progress,
}));
const imagePreviewState = computed(() => ({
  visible: imagePreviewStore.visible,
  imageUrl: imagePreviewStore.imageUrl,
}));
/** 原图缩放倍数；用于预览层滚轮缩放 */
const previewScale = ref(1);
/** 原图水平偏移(px)；用于拖拽查看大图 */
const previewOffsetX = ref(0);
/** 原图垂直偏移(px)；用于拖拽查看大图 */
const previewOffsetY = ref(0);
/** 拖拽起始鼠标位置；用于计算每次移动增量 */
const previewDragStartX = ref(0);
const previewDragStartY = ref(0);
/** 拖拽起始图片偏移；用于和鼠标位移叠加 */
const previewDragOriginOffsetX = ref(0);
const previewDragOriginOffsetY = ref(0);
const isPreviewDragging = ref(false);
const imagePreviewTransformStyle = computed(() => ({
  transform: `translate(${previewOffsetX.value}px, ${previewOffsetY.value}px) scale(${previewScale.value})`,
}));
const messageText = ref("");
const isSending = ref(false);
const isSearchOpen = ref(false);
const savedScrollTop = ref(0);
const savedWasAtBottom = ref(true);
const isRestoringScroll = ref(false);
/** 当前消息列表是否处于底部，控制「滚到底部」浮动按钮的显示 */
const isAtBottom = ref(true);
/**
 * 消息区域是否已就绪（加载完成且 scroll 已定位到底部）。
 * 为 false 时对用户不可见，防止"先显示顶端再跳底"的闪烁。
 */
const isMessagesReady = ref(false);
/** 搜索跳锚点期间禁止「消息 watch 自动滚到底部」，避免抢滚动位置 */
const suppressAutoScrollForAnchorJump = ref(false);
/** 顶/底分页单次飞行，避免滚动事件连触发多次加载 */
const paginationInFlight = ref(false);
/** 一次分页结束后的冷却（ms），防止纠正 scrollTop 后又立刻命中边界再次加载 */
const edgePaginationCooldownUntil = ref(0);
const EDGE_PAGINATION_COOLDOWN_MS = 480;
let messagesScrollRafId: number | null = null;
/** 连续多次点击搜索结果时，只让最后一次跳转做滚动定位 */
let searchJumpSeq = 0;
/** 搜索跳转后高亮锚点条（约 3s 闪烁） */
const anchorFlashMessageId = ref<number | null>(null);
let anchorFlashClearTimer: ReturnType<typeof setTimeout> | null = null;
/** 正在发起撤回请求的消息 ID 集合；用于按钮加载态与防重复点击。 */
const recallingMessageIdSet = ref(new Set<number>());
const currentUserId = computed(() => Number(authStore.user?.userId || 0));
const readReceiptDialogVisible = ref(false);
const readReceiptDialogLoadingMore = ref(false);
/** 文件发送防重入锁；避免 input change/用户连击导致同一文件触发两次发送链路。 */
const fileMessageSendInFlight = ref(false);
type PendingFileDraft = {
  localDraftId: string;
  messageType: "image" | "file" | "video";
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};
const pendingFileDrafts = ref<PendingFileDraft[]>([]);
/**
 * 生成客户端临时消息标识。
 * 使用场景：发送消息时与后端回执 clientMessageId 对齐，回填真实 messageId。
 */
const buildClientMessageId = (): string =>
  `client_${Number(currentUserId.value || 0)}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
const buildPendingFileDraftId = (): string =>
  `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * 消息列表 v-for 的稳定 key。
 * 场景：messageSent 回执会把临时 messageId 换成服务端 ID；若 key 绑 messageId，Vue 会卸载旧节点再挂载新节点，气泡会闪一下。临时行优先用 clientMessageId 作 key，ACK 后仍不变，只更新 props。
 */
const messageListRowKey = (m: DisplayMessage): string | number => {
  const cid = String(m.clientMessageId || "").trim();
  return cid.length > 0 ? cid : m.messageId;
};

/**
 * 判断消息是否已持久化到后端（可用于 mark-read 上报游标）。
 * 使用场景：过滤本地发送中的临时消息，避免把临时 messageId 当作已读游标提交。
 */
const isPersistedServerMessage = (message: DisplayMessage | null | undefined): boolean => {
  if (!message) return false;
  const messageId = Number(message.messageId);
  if (!Number.isFinite(messageId) || messageId <= 0) return false;
  // 发送中的本人本地回显（messageStatus=0）尚未落库，不能用于 mark-read。
  if (message.isSentByMe && Number(message.messageStatus) === 0) return false;
  return true;
};

/**
 * 当前用户在当前群中的角色。
 * 使用场景：群聊中判断“管理员/群主可撤回任意成员消息”。
 */
const currentUserRoleInGroup = computed((): number | null => {
  if (props.convId == null || Number(currentConvTypeOrNull.value) !== 2)
    return null;
  const members = conversationStore.compressedCMMap.get(props.convId) || [];
  const me = members.find(
    (m) => Number(m.userId) === Number(currentUserId.value)
  );
  return me?.role == null ? null : Number(me.role);
});

const snapshotMessageScrollPosition = () => {
  const el = messagesContainer.value;
  if (!el) return;
  savedScrollTop.value = el.scrollTop;
  const bottomGap = el.scrollHeight - (el.scrollTop + el.clientHeight);
  savedWasAtBottom.value = bottomGap <= 6;
};

/**
 * 实时更新 isAtBottom 状态，供「滚到底部」按钮判断是否显示。
 * 作用场景：每次 messages-container 触发 scroll 事件时调用，
 * 距底部超过 80px 则认为用户离开底部，显示浮动按钮。
 */
const updateIsAtBottom = () => {
  const el = messagesContainer.value;
  if (!el) return;
  const bottomGap = el.scrollHeight - (el.scrollTop + el.clientHeight);
  isAtBottom.value = bottomGap <= 80;
};

const restoreMessageScrollPosition = async () => {
  const el = messagesContainer.value;
  if (!el) return;

  isRestoringScroll.value = true;
  await nextTick();

  // 如果之前用户就在底部，则恢复到底部；否则恢复到原 scrollTop
  if (savedWasAtBottom.value) {
    scrollToBottom();
  } else {
    el.scrollTop = savedScrollTop.value;
  }

  // 下一帧再解除，避免恢复过程中触发历史加载
  requestAnimationFrame(() => {
    isRestoringScroll.value = false;
  });
};

// 群聊信息面板状态
const isGroupInfoOpen = ref(false);
const infoPanelWidth = ref(320);
const isResizingInfoPanel = ref(false);
const infoPanelStartX = ref(0);
const infoPanelStartWidth = ref(0);
let infoPanelAnimationFrameId: number | null = null;
const INFO_PANEL_WIDTH_KEY = "komunif_chat_info_width";

// WebSocket相关状态
const connectionError = ref<string | null>(null);
const webSocketListenersInitialized = ref(false);

// 防止重复连接的标志
const isWebSocketConnecting = ref(false);
let globalWebSocketCleanup: (() => void) | null = null;

const avatarUrl = computed(() => {
  const conv = currentConversation.value;
  if (!conv) return "";

  const raw = conv.convAvatar || "";

  return normalizeAvatarUrl(raw);
});

const firstChar = computed(() => {
  const name = conversationDisplayName.value || "";
  return name ? name.charAt(0) : "";
});

const canSend = computed(() => {
  return (
    (messageText.value.trim().length > 0 || pendingFileDrafts.value.length > 0) &&
    props.convId &&
    !isSending.value &&
    !isCurrentUserMutedInGroup.value
  );
});

const formatPendingFileSize = (rawSize: number): string => {
  if (rawSize < 1024) return `${rawSize} B`;
  if (rawSize < 1024 * 1024) return `${(rawSize / 1024).toFixed(1)} KB`;
  if (rawSize < 1024 * 1024 * 1024)
    return `${(rawSize / 1024 / 1024).toFixed(1)} MB`;
  return `${(rawSize / 1024 / 1024 / 1024).toFixed(1)} GB`;
};
const removePendingFileDraft = (localDraftId: string) => {
  pendingFileDrafts.value = pendingFileDrafts.value.filter(
    (draft) => draft.localDraftId !== localDraftId
  );
};

/** 当前会话在线人数（有后端下发且为当前会话时显示，否则不显示该区域） */
const chatStatusText = computed(() => {
  const count = websocketStore.conversationOnlineCount;
  const isCurrentConv =
    props.convId != null && websocketStore.currentConvId === props.convId;
  if (isCurrentConv && typeof count === "number") {
    return `${count}人在线`;
  }
  return "";
});

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};

// 使用Store的数据
const messages = computed(() => showMessageStore.messages);
const isLoading = computed(() => showMessageStore.loading);

/**
 * 输入框上方「待回复」条：展示被引用消息发送者（备注/群昵称/昵称策略）与内容摘要。
 * 使用场景：用户从消息气泡旁选中回复后、尚未发出下一条前。
 */
const pendingReplyPreview = computed(
  (): {
    title: string;
    detail: string;
  } | null => {
    void friendStore.friends;
    if (props.convId == null) return null;
    if (
      composerReplyStore.targetConvId !== props.convId ||
      composerReplyStore.targetMessageId == null
    ) {
      return null;
    }
    const mid = Number(composerReplyStore.targetMessageId);
    if (!Number.isFinite(mid) || mid <= 0) return null;
    const src = showMessageStore.messages.find((m) => m.messageId === mid);
    if (!src) {
      return { title: "消息", detail: `引用 #${mid}` };
    }
    return {
      title: showMessageStore.getSenderDisplayName(src),
      detail: formatQuotedMessageContentPreview(src),
    };
  }
);

/**
 * 输入框上方「待 @」条：展示已被选中提及的用户（群策略展示名）。
 */
const pendingAtStripChips = computed(
  (): { userId: number; label: string }[] => {
    void friendStore.friends;
    if (props.convId == null) return [];
    const ids = composerAtStore.getPendingAtUserIdsForConv(props.convId);
    if (!ids?.length) return [];
    const members = conversationStore.compressedCMMap.get(props.convId) ?? [];
    const ct = currentConvTypeOrNull.value;
    return ids.map((uid) => {
      const member = members.find((m) => Number(m.userId) === Number(uid));
      return {
        userId: uid,
        label: showMessageStore.resolveSenderName(
          Number(uid),
          member?.userNickname || "User",
          ct ?? undefined,
          member?.memberNickname ?? null,
          props.convId
        ),
      };
    });
  }
);

const currentConvReadReceipt = computed(() => {
  if (!props.convId) {
    return {
      latestOwnMessageId: 0,
      readCount: 0,
      readMembers: [],
      updatedAt: 0,
      lastFetchedAt: 0,
    };
  }
  return conversationStore.getOrCreateReadReceiptRuntime(props.convId);
});

const latestSelfMessageIdInList = computed(() => {
  const myId = Number(currentUserId.value || 0);
  if (myId <= 0) return 0;
  for (let i = showMessageStore.messages.length - 1; i >= 0; i -= 1) {
    const row = showMessageStore.messages[i];
    if (Number(row.senderId) === myId) return Number(row.messageId || 0);
  }
  return 0;
});

/**
 * 判断指定消息是否应渲染已读回执条。
 * 使用场景：消息列表逐条渲染时，只在“本人最新一条消息”下方显示已读组件。
 */
const shouldShowReadReceiptForMessage = (messageId: number): boolean => {
  const runtime = currentConvReadReceipt.value;
  if (runtime.readCount <= 0) return false;
  return Number(runtime.latestOwnMessageId) === Number(messageId);
};

/**
 * 按当前消息列表同步回执目标消息并拉取已读详情。
 * 使用场景：进入会话、消息列表变化（本人发送新消息）后刷新该会话回执缓存。
 */
const syncAndRefreshReadReceiptForCurrentConv = async () => {
  if (!props.convId) return;
  const latestOwnMessageId = Number(latestSelfMessageIdInList.value || 0);
  conversationStore.syncLatestOwnMessageForReadReceipt(
    props.convId,
    latestOwnMessageId || null
  );
  if (latestOwnMessageId <= 0) return;
  await conversationStore.refreshConversationReadReceipt(props.convId, {
    offset: 0,
    limit: 50,
  });
};

/**
 * 打开已读成员弹窗。
 * 使用场景：用户点击消息下方已读条时展开完整成员列表。
 */
const openReadReceiptDialog = () => {
  readReceiptDialogVisible.value = true;
};

/**
 * 已读成员弹窗分页加载。
 * 使用场景：已读成员数量较大时，点击“加载更多”按 offset 拉取下一页。
 */
const loadMoreReadReceiptMembers = async () => {
  if (!props.convId || readReceiptDialogLoadingMore.value) return;
  readReceiptDialogLoadingMore.value = true;
  try {
    await conversationStore.refreshConversationReadReceipt(props.convId, {
      force: true,
      limit: 50,
      offset: currentConvReadReceipt.value.readMembers.length,
    });
  } finally {
    readReceiptDialogLoadingMore.value = false;
  }
};

/**
 * 读取当前会话已选中的 reply_to_message_id，不改变 store（发送成功后再清空）。
 */
const takeReplyToMessageIdForCurrentConv = (): number | undefined => {
  if (props.convId == null) return undefined;
  const cid = Number(props.convId);
  const tid =
    composerReplyStore.targetConvId == null
      ? NaN
      : Number(composerReplyStore.targetConvId);
  if (
    !Number.isFinite(cid) ||
    cid <= 0 ||
    tid !== cid ||
    composerReplyStore.targetMessageId == null
  ) {
    return undefined;
  }
  const n = Number(composerReplyStore.targetMessageId);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const handleStartReplyMessage = (msg: DisplayMessage) => {
  if (props.convId == null || msg.convId !== props.convId) return;
  composerReplyStore.setPendingReply(props.convId, msg.messageId);
};

/**
 * 从消息气泡旁 @：将该条发送者加入/移出下一条要带的 atUserIds（WS/HTTP 驼峰）。
 */
const handleStartAtMention = (msg: DisplayMessage) => {
  if (props.convId == null || msg.convId !== props.convId) return;
  composerAtStore.toggleAtFromMessage(props.convId, msg.senderId);
};

watch(
  () => props.convId,
  () => {
    composerReplyStore.clearPendingReply();
    composerAtStore.clearAtTargets();
    pendingFileDrafts.value = [];
    readReceiptDialogVisible.value = false;
  }
);

watch(
  () => [props.convId, latestSelfMessageIdInList.value, isMessagesReady.value] as const,
  ([convId, , ready]) => {
    if (!convId || !ready) return;
    void syncAndRefreshReadReceiptForCurrentConv();
  }
);

// 是否为群聊
const isGroupChat = computed(() => {
  return (
    conversationStore.currentConversation?.convType === 2 &&
    !conversationStore.currentConversation?.peer
  );
});

const hasInfoPendingChanges = ref(false);

const infoPanelStyle = computed(() => {
  const showPanel = isGroupChat.value || singlePeerUserId.value;
  if (!showPanel) return {};
  const extra = hasInfoPendingChanges.value ? 80 : 0;
  return {
    width: isGroupInfoOpen.value ? `${infoPanelWidth.value + extra}px` : "0px",
  };
});

/**
 * 初始化 WebSocket：只做最小连接与监听器就绪（不在组件内做复杂 WS 编排）。
 */
const initWebSocket = async () => {
  if (!authStore.isAuthenticated || !props.convId) return;
  if (isWebSocketConnecting.value || websocketStore.isConnected) {
    if (!webSocketListenersInitialized.value) {
      const cleanup = setupWebSocketEventListeners();
      if (cleanup) globalWebSocketCleanup = cleanup;
    }
    return;
  }
  const currentUserId = authStore.user?.userId;
  if (!currentUserId) return;
  isWebSocketConnecting.value = true;
  try {
    await websocketStore.connect(currentUserId, props.convId);
    connectionError.value = null;
    if (!webSocketListenersInitialized.value) {
      const cleanup = setupWebSocketEventListeners();
      if (cleanup) globalWebSocketCleanup = cleanup;
    }
  } catch {
    connectionError.value = "无法连接到实时消息服务器";
  } finally {
    isWebSocketConnecting.value = false;
  }
};

/**
 * 设置 WebSocket 事件监听器（MVP 阶段只处理新消息与错误）。
 */
const setupWebSocketEventListeners = () => {
  if (webSocketListenersInitialized.value) {
    return;
  }

  const cleanup = bindWindowWebSocketListeners({
    onNewMessage: (message) => {
      const g = flattenRealtimeNewMessagePayload(message);
      const cid = Number(g.convId ?? message.convId);
      if (cid === props.convId) {
        handleIncomingWebSocketMessage(message);
      }
    },
    onMessageSent: (message) => {
      handleMessageSentAck(message);
    },
    onMessageRecalled: (message) => {
      const cid = Number(message?.convId);
      if (!Number.isFinite(cid) || cid !== Number(props.convId)) return;
      void applyIncomingMessageRecall(message);
    },
    onError: (d) => {
      const msg =
        typeof d === "string"
          ? d
          : d && typeof d.message === "string"
          ? d.message
          : "WebSocket连接错误";
      connectionError.value = msg;
    },
  });

  webSocketListenersInitialized.value = true;

  return () => {
    cleanup();
    webSocketListenersInitialized.value = false;
  };
};

/**
 * 处理从WebSocket接收到的消息
 */
const handleIncomingWebSocketMessage = (message: any) => {
  const currentUser = authStore.user;
  if (!currentUser?.userId) return;

  const flat = flattenRealtimeNewMessagePayload(message);
  const convIdForMembers = Number(flat.convId ?? message.convId);
  const safeConvId =
    Number.isFinite(convIdForMembers) && convIdForMembers > 0
      ? convIdForMembers
      : Number(message.convId);

  const box = messagesContainer.value;
  const result = handleRealtimeIncomingMessage({
    payload: message,
    currentUserId: currentUser.userId,
    currentUserAvatar: currentUser.userAvatar || null,
    conversationMembers:
      conversationStore.compressedCMMap.get(safeConvId) || [],
    hasMessage: (messageId: number) =>
      showMessageStore.messages.some((msg) => msg.messageId === messageId),
    appendMessage: (displayMessage: DisplayMessage) => {
      const cid = String(displayMessage.clientMessageId || "").trim();
      if (displayMessage.isSentByMe && cid) {
        const merged = showMessageStore.reconcileTempMessageByClientMessageId({
          clientMessageId: cid,
          messageId: Number(displayMessage.messageId),
          messageStatus: Number(displayMessage.messageStatus),
          sendTime: displayMessage.sendTime,
        });
        if (merged) return true;
      }
      return showMessageStore.addMessage(displayMessage);
    },
    isNearBottom: box ? isContainerNearBottom(box) : false,
  });
  const flatDebug = flattenRealtimeNewMessagePayload(message);
  console.log("[file-msg-debug] ws:newMessage received", {
    action: message?.action,
    convId: Number(flatDebug?.convId ?? message?.convId),
    messageId: Number(flatDebug?.messageId),
    senderId: Number(flatDebug?.senderId),
    messageType: String(flatDebug?.messageType || ""),
    clientMessageId: String(flatDebug?.clientMessageId || "").trim(),
    fileId:
      flatDebug?.fileId ??
      (() => {
        try {
          const c = String(flatDebug?.messageContent || "");
          if (!c) return null;
          const p = JSON.parse(c) as { fileId?: string };
          return p?.fileId || null;
        } catch {
          return null;
        }
      })(),
    added: result.added,
  });
  if (!result.added) return;
  console.log("将WebSocket消息添加到Store:", result.displayMessage);
  if (props.convId && isPersistedServerMessage(result.displayMessage)) {
    conversationStore.trackConversationReadProgress(
      props.convId,
      Number(result.displayMessage!.messageId)
    );
  }
  if (result.shouldScrollToBottom) {
    scrollToBottom();
  }
};

/**
 * 处理 messageSent 回执：按 clientMessageId 将本地临时消息回填为真实 messageId。
 */
const handleMessageSentAck = (payload: any) => {
  const clientMessageId = String(payload?.clientMessageId || "").trim();
  const messageId = Number(payload?.messageId);
  console.log("[file-msg-debug] ws:messageSent ack", {
    convId: Number(payload?.convId),
    messageId,
    clientMessageId,
    messageType: String(payload?.messageType || ""),
    fileId: payload?.fileId ?? null,
  });
  if (!clientMessageId || !Number.isFinite(messageId) || messageId <= 0) return;
  showMessageStore.reconcileTempMessageByClientMessageId({
    clientMessageId,
    messageId,
    messageStatus: Number(payload?.messageStatus),
    sendTime: payload?.sendTime,
  });
};

/**
 * 生成撤回占位文案。
 * 使用场景：messageRecalled 广播到达后，按操作者/发送者关系渲染系统提示文本。
 */
const buildRecallPlaceholderText = (params: {
  recalledMessage: DisplayMessage;
  recalledByUserId: number;
}): string => {
  const senderId = Number(params.recalledMessage.senderId);
  const recalledByUserId = Number(params.recalledByUserId);
  const convId = Number(params.recalledMessage.convId);
  const isOperatorSelf = recalledByUserId === Number(currentUserId.value);
  const isSelfRecall = recalledByUserId === senderId;

  if (isOperatorSelf && isSelfRecall) {
    return "你撤回了一条消息";
  }

  const members = conversationStore.compressedCMMap.get(convId) || [];
  const operatorMember = members.find(
    (member) => Number(member.userId) === recalledByUserId
  );
  const operatorRole = Number(operatorMember?.role);
  const operatorName = showMessageStore.resolveSenderName(
    recalledByUserId,
    operatorMember?.userNickname || "用户",
    currentConvTypeOrNull.value ?? undefined,
    operatorMember?.memberNickname ?? null,
    convId
  );
  if (
    !isSelfRecall &&
    (operatorRole === MemberRole.ADMIN || operatorRole === MemberRole.OWNER)
  ) {
    return `管理员 ${operatorName} 撤回了一条消息`;
  }

  return `${showMessageStore.getSenderDisplayName(
    params.recalledMessage
  )} 撤回了一条消息`;
};

/**
 * 消费撤回广播并仅更新目标消息。
 * 使用场景：所有在线端收到 messageRecalled 后统一执行本地消息状态回写。
 */
const applyIncomingMessageRecall = async (payload: any) => {
  const messageId = Number(payload?.messageId);
  if (!Number.isFinite(messageId) || messageId <= 0) return;
  const targetMessage = showMessageStore.messages.find(
    (message) => Number(message.messageId) === messageId
  );
  if (!targetMessage || targetMessage.isRecalled) return;

  const recalledByUserId = Number(payload?.recalledByUserId || 0);
  const recallTimeRaw = payload?.recallTime;
  const recallTime =
    typeof recallTimeRaw === "string" && recallTimeRaw.trim()
      ? recallTimeRaw
      : new Date().toISOString();

  const placeholderText = buildRecallPlaceholderText({
    recalledMessage: targetMessage,
    recalledByUserId,
  });
  await recallMessageStore.applyRecallPlaceholderToMessage({
    messageId,
    recallTime,
    placeholderText,
  });
  conversationStore.applyConversationLastMessageRecall({
    convId: Number(targetMessage.convId),
    messageId,
    placeholderText,
    recallTime,
    senderId: Number(targetMessage.senderId),
    originalMessageContent: targetMessage.messageContent,
    originalSendTime: targetMessage.sendTime,
  });
  recallingMessageIdSet.value.delete(messageId);
};

/**
 * 点击消息撤回按钮后执行二次校验与请求。
 * 使用场景：消息操作菜单触发撤回，避免重复点击和越权请求。
 */
const handleRecallMessage = async (message: DisplayMessage) => {
  if (!props.convId) return;
  const messageId = Number(message.messageId);
  if (!Number.isFinite(messageId) || messageId <= 0) return;
  if (message.isRecalled || recallingMessageIdSet.value.has(messageId)) {
    toast.error("该消息已撤回");
    return;
  }
  const canRecall = recallMessageStore.canRecallMessage(message, {
    currentUserId: Number(currentUserId.value),
    currentUserRole: currentUserRoleInGroup.value,
    convType: currentConvTypeOrNull.value,
  });
  if (!canRecall) {
    toast.error("无权撤回该消息或已超过2分钟");
    return;
  }

  recallingMessageIdSet.value.add(messageId);
  const success = await recallMessageStore.requestRecallMessage(
    Number(props.convId),
    messageId
  );
  if (!success) {
    recallingMessageIdSet.value.delete(messageId);
  }
};

/**
 * 发送消息（优先使用WebSocket）- 修复超时逻辑
 */
const sendTextMessage = async (input?: {
  content?: string;
  replyToMessageId?: number;
  atUserIds?: number[];
}) => {
  if (!canSend.value || !props.convId) return;
  if (isCurrentUserMutedInGroup.value) {
    toast.error("您已被禁言，无法发送消息");
    return;
  }

  const content = (input?.content ?? messageText.value).trim();
  const currentUser = authStore.user;

  if (!currentUser?.userId) {
    console.error("用户未登录");
    return;
  }

  let tempMessage: DisplayMessage | undefined;
  isSending.value = true;

  try {
    const clientMessageId = buildClientMessageId();
    /** 与下行 WS 一致的引用回复目标；仅下一条发送消费。 */
    const replyToMessageId =
      input?.replyToMessageId ?? takeReplyToMessageIdForCurrentConv();
    const pendingAtUserIds =
      input?.atUserIds ?? composerAtStore.getPendingAtUserIdsForConv(props.convId);
    console.log("发送消息:", {
      convId: props.convId,
      content,
      replyToMessageId,
      pendingAtUserIds,
    });

    // 1. 本地即时回显（文本与附件统一走 appendLocalMessageEcho）
    tempMessage = sendMessageStore.appendLocalMessageEcho(
      {
        convId: props.convId,
        currentUserId: currentUser.userId,
        currentUserNickname: currentUser.userNickname || null,
        currentUserAvatar: currentUser.userAvatar || null,
        conversationMembers: conversationStore.compressedCMMap.get(
          props.convId
        ),
      },
      {
        kind: "text",
        content,
        clientMessageId,
        ...(replyToMessageId != null ? { replyToMessageId } : {}),
        ...(pendingAtUserIds?.length
          ? { atUserIds: [...pendingAtUserIds] }
          : {}),
      }
    );
    conversationStore.clearConversationReadReceipt(props.convId);
    scrollToBottom();

    // 2. MVP 阶段仅保留 WebSocket 发送，不做 HTTP 降级。
    if (!websocketStore.isConnected) {
      console.log("WebSocket未连接，尝试连接...");
      await initWebSocket();
    }
    if (!websocketStore.isConnected) {
      throw new Error("WebSocket unavailable");
    }
    const success = websocketStore.sendMessageByType({
      convId: props.convId,
      messageType: "text",
      messageContent: content,
      clientMessageId,
      ...(replyToMessageId != null ? { replyToMessageId } : {}),
      ...(pendingAtUserIds?.length ? { atUserIds: [...pendingAtUserIds] } : {}),
    });
    if (!success) {
      throw new Error("WebSocket send failed");
    }
    if (tempMessage) {
      conversationStore.syncConversationLastMessageFromSentDisplay(
        props.convId,
        tempMessage
      );
    }
  } catch (error) {
    console.error("发送消息失败:", error);

    if (tempMessage) {
      showMessageStore.updateMessageStatus(tempMessage.messageId, 4);
    }

    connectionError.value = "消息发送失败，请检查网络连接";
  } finally {
    isSending.value = false;
  }
};

const sendComposerBatch = async () => {
  if (!canSend.value || !props.convId) return;
  try {
    const content = messageText.value.trim();
    const drafts = [...pendingFileDrafts.value];
    const replyToMessageId = takeReplyToMessageIdForCurrentConv();
    const pendingAtUserIds = composerAtStore.getPendingAtUserIdsForConv(
      props.convId
    );

    // 混合发送约定：
    // - 存在待发文件时，输入框文本不单独发 text 消息，而是挂到每条非文本 messageContent.textbtw。
    // - 仅无待发文件时，才走纯文本发送。
    if (content && drafts.length === 0) {
      await sendTextMessage({
        content,
        replyToMessageId,
        atUserIds: pendingAtUserIds,
      });
    }

    for (const draft of drafts) {
      await sendFileMessage({
        messageType: draft.messageType,
        fileId: draft.fileId,
        fileName: draft.fileName,
        fileSize: draft.fileSize,
        mimeType: draft.mimeType,
        ...(content ? { textByTheWay: content } : {}),
        ...(replyToMessageId != null ? { replyToMessageId } : {}),
        ...(pendingAtUserIds?.length ? { atUserIds: [...pendingAtUserIds] } : {}),
      });
    }

    messageText.value = "";
    pendingFileDrafts.value = [];
    if (replyToMessageId != null) {
      composerReplyStore.clearPendingReply();
    }
    if (pendingAtUserIds?.length) {
      composerAtStore.clearAtTargets();
    }
  } catch (error) {
    console.error("统一发送失败:", error);
    toast.error("发送失败，请稍后重试");
  }
};

/**
 * 加载消息
 */
const loadMessages = async () => {
  if (!props.convId) return;

  // 切换会话时先隐藏容器，防止"先见顶端再跳底"的闪烁
  isMessagesReady.value = false;
  isAtBottom.value = true;

  console.log("ChatContainer: 触发加载消息，会话ID:", props.convId);
  await loadConversationMessagesAndSyncRealtime({
    convId: props.convId,
    loadMessages: (convId) => showMessageStore.loadMessages(convId),
    waitForLayout: async () => {
      await nextTick();
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    },
    scrollToBottom,
    isWsConnected: websocketStore.isConnected,
    isWsConnecting: isWebSocketConnecting.value,
    initWebSocket,
    ensureWebSocketListeners: () => {
      if (!webSocketListenersInitialized.value) {
        const cleanup = setupWebSocketEventListeners();
        if (cleanup) globalWebSocketCleanup = cleanup;
      }
    },
    currentUserId: authStore.user?.userId,
    connectWebSocket: (userId, convId) =>
      websocketStore.connect(userId, convId),
    subscribeConversation: (convId) => websocketStore.sendSubscribe(convId),
  });

  // scrollToBottom 内部用 nextTick 设置 scrollTop，再等一个 rAF 确保
  // 浏览器已提交绘制，然后才显示容器，彻底消除"先见顶端再跳底"的闪烁。
  await nextTick();
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  isMessagesReady.value = true;
  const latestMessage = showMessageStore.getLatestMessage();
  let latestPersistedId = 0;
  if (props.convId && isPersistedServerMessage(latestMessage)) {
    latestPersistedId = Number(latestMessage!.messageId);
    conversationStore.trackConversationReadProgress(props.convId, latestPersistedId);
  }
  if (props.convId) {
    conversationStore.onChatViewportReadyForWsReadReport(props.convId, latestPersistedId);
  }
  await syncAndRefreshReadReceiptForCurrentConv();
};

/**
 * 处理Enter键发送
 */
const handleEnterKey = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.shiftKey && canSend.value) {
    event.preventDefault();
    void sendComposerBatch();
  }
};

/**
 * 打开系统文件选择器。
 * 作用场景：用户点击回形针按钮后直接选取附件（不再经过二级菜单）。
 */
const openFilePicker = () => {
  if (composerDisabled.value) {
    toast.error("您已被禁言，无法发送消息");
    return;
  }
  fileInputRef.value?.click();
};

/**
 * 按文件 MIME 推断消息类型。
 * 作用场景：上传完成后发送 WS 消息时区分 image / video / 普通文件。
 */
const resolveMessageTypeByFile = (file: File): "image" | "file" | "video" => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
};

/**
 * 发送附件消息。
 * 作用场景：上传成功后发送 messageType + JSON messageContent。
 */
const sendFileMessage = async (params: {
  messageType: "image" | "file" | "video";
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** 非文本消息附带文案（后端标准字段）。 */
  textByTheWay?: string;
  replyToMessageId?: number;
  atUserIds?: number[];
}) => {
  if (!props.convId || !authStore.user?.userId) return;
  if (isCurrentUserMutedInGroup.value) {
    toast.error("您已被禁言，无法发送消息");
    return;
  }
  const messagePayload = {
    fileId: params.fileId,
    fileName: params.fileName,
    fileSize: params.fileSize,
    mimeType: params.mimeType,
    ...(params.textByTheWay?.trim()
      ? {
          textByTheWay: params.textByTheWay.trim(),
          // 兼容后端旧别名（后端会归一化到 textByTheWay）。
          textbtw: params.textByTheWay.trim(),
        }
      : {}),
  };
  const clientMessageId = buildClientMessageId();
  const messageContent = JSON.stringify(messagePayload);
  const replyToMessageId =
    params.replyToMessageId ?? takeReplyToMessageIdForCurrentConv();
  const pendingAtUserIds =
    params.atUserIds ?? composerAtStore.getPendingAtUserIdsForConv(props.convId);
  const tempMessage = sendMessageStore.appendLocalMessageEcho(
    {
      convId: props.convId,
      currentUserId: authStore.user.userId,
      currentUserNickname: authStore.user.userNickname || null,
      currentUserAvatar: authStore.user.userAvatar || null,
      conversationMembers: conversationStore.compressedCMMap.get(props.convId),
    },
    {
      kind: "file",
      clientMessageId,
      messageType: params.messageType,
      fileId: params.fileId,
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      ...(params.textByTheWay?.trim()
        ? { textByTheWay: params.textByTheWay.trim() }
        : {}),
      ...(replyToMessageId != null ? { replyToMessageId } : {}),
      ...(pendingAtUserIds?.length ? { atUserIds: [...pendingAtUserIds] } : {}),
    }
  );
  conversationStore.clearConversationReadReceipt(props.convId);
  scrollToBottom();
  console.log("[file-msg-debug] append local file echo", {
    convId: props.convId,
    tempMessageId: tempMessage.messageId,
    clientMessageId,
    messageType: params.messageType,
    fileId: params.fileId,
    fileName: params.fileName,
  });

  if (!websocketStore.isConnected) {
    await initWebSocket();
  }
  const success = websocketStore.sendMessageByType({
    convId: props.convId,
    messageType: params.messageType,
    messageContent,
    clientMessageId,
    ...(replyToMessageId != null ? { replyToMessageId } : {}),
    ...(pendingAtUserIds?.length ? { atUserIds: [...pendingAtUserIds] } : {}),
  });
  console.log("[file-msg-debug] send ws file message", {
    convId: props.convId,
    success,
    clientMessageId,
    messageType: params.messageType,
    fileId: params.fileId,
  });
  if (!success) {
    showMessageStore.updateMessageStatus(tempMessage.messageId, 4);
    throw new Error("附件消息发送失败");
  }
  conversationStore.syncConversationLastMessageFromSentDisplay(
    props.convId,
    tempMessage
  );
};

/**
 * 处理用户选中文件事件。
 * 作用场景：入口总控，串起 hash、init、分片上传、complete、消息发送。
 */
const handleFilePicked = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const pickedFile = input.files?.[0];
  if (!pickedFile || !props.convId) {
    if (input) input.value = "";
    return;
  }
  if (isCurrentUserMutedInGroup.value) {
    toast.error("您已被禁言，无法发送消息");
    if (input) input.value = "";
    return;
  }

  try {
    if (fileMessageSendInFlight.value) {
      console.warn("[file-msg-debug] duplicate file pick ignored", {
        convId: props.convId,
        name: pickedFile.name,
        size: pickedFile.size,
      });
      return;
    }
    fileMessageSendInFlight.value = true;
    const messageType = resolveMessageTypeByFile(pickedFile);
    console.log("[file-msg-debug] file selected", {
      convId: props.convId,
      name: pickedFile.name,
      size: pickedFile.size,
      mimeType: pickedFile.type || "application/octet-stream",
      messageType,
    });
    const uploadResult = await fileUploadStore.uploadFile({
      file: pickedFile,
      convId: props.convId,
      mimeType: pickedFile.type || "application/octet-stream",
    });
    console.log("[file-msg-debug] upload completed, append pending file draft", {
      convId: props.convId,
      fileId: uploadResult.fileId,
      messageType,
      instantUpload: !!uploadResult.instantUpload,
    });
    pendingFileDrafts.value.push({
      localDraftId: buildPendingFileDraftId(),
      messageType,
      fileId: uploadResult.fileId,
      fileName: pickedFile.name,
      fileSize: pickedFile.size,
      mimeType: pickedFile.type || "application/octet-stream",
    });
  } catch (error) {
    console.error("附件上传失败:", error);
    connectionError.value = "附件上传失败，请稍后重试";
  } finally {
    fileMessageSendInFlight.value = false;
    input.value = "";
  }
};

/**
 * 关闭原图预览弹层。
 * 作用场景：用户点击暗化区域时退出查看原图状态。
 */
const closeImagePreview = () => {
  isPreviewDragging.value = false;
  previewScale.value = 1;
  previewOffsetX.value = 0;
  previewOffsetY.value = 0;
  imagePreviewStore.closePreview();
};

/**
 * 处理原图预览滚轮缩放。
 * 作用场景：用户滚动鼠标滚轮时放大/缩小原图，便于查看细节。
 */
const handlePreviewWheel = (event: WheelEvent) => {
  const delta = event.deltaY < 0 ? 0.12 : -0.12;
  const nextScale = Math.min(4, Math.max(1, previewScale.value + delta));
  previewScale.value = Number(nextScale.toFixed(2));
  if (previewScale.value === 1) {
    previewOffsetX.value = 0;
    previewOffsetY.value = 0;
  }
};

/**
 * 开始原图拖拽。
 * 作用场景：图片被放大后，按住鼠标拖动查看图片其他区域。
 */
const handlePreviewMouseDown = (event: MouseEvent) => {
  if (previewScale.value <= 1) return;
  isPreviewDragging.value = true;
  previewDragStartX.value = event.clientX;
  previewDragStartY.value = event.clientY;
  previewDragOriginOffsetX.value = previewOffsetX.value;
  previewDragOriginOffsetY.value = previewOffsetY.value;
};

/**
 * 处理原图拖拽移动。
 * 作用场景：拖拽过程中实时更新图片位移，形成平移查看效果。
 */
const handlePreviewMouseMove = (event: MouseEvent) => {
  if (!isPreviewDragging.value) return;
  const deltaX = event.clientX - previewDragStartX.value;
  const deltaY = event.clientY - previewDragStartY.value;
  previewOffsetX.value = previewDragOriginOffsetX.value + deltaX;
  previewOffsetY.value = previewDragOriginOffsetY.value + deltaY;
};

/**
 * 结束原图拖拽。
 * 作用场景：用户松开鼠标后停止平移，避免误触继续移动。
 */
const handlePreviewMouseUp = () => {
  isPreviewDragging.value = false;
};

/**
 * 滚动到底部（瞬移）。
 * 作用场景：初始加载、发送消息、WS 实时推送等需要立即到底的时机。
 */
const scrollToBottom = () => {
  nextTick(() => {
    scrollContainerToBottom(messagesContainer.value);
  });
};

/**
 * 丝滑滚动到底部，仅供「滚到底部」浮动按钮调用。
 * 作用场景：用户主动点击按钮时，用 smooth 动画过渡避免跳屏感。
 */
const scrollToBottomSmooth = () => {
  const el = messagesContainer.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
};

const startAnchorFlash = (messageId: number) => {
  if (anchorFlashClearTimer != null) {
    clearTimeout(anchorFlashClearTimer);
    anchorFlashClearTimer = null;
  }
  anchorFlashMessageId.value = messageId;
  anchorFlashClearTimer = window.setTimeout(() => {
    anchorFlashMessageId.value = null;
    anchorFlashClearTimer = null;
  }, 3100);
};

const handleJumpToSearchMessage = async (messageId: number) => {
  const mySeq = ++searchJumpSeq;
  await runSearchAnchorJumpFlow({
    messageId,
    convId: props.convId == null ? null : props.convId,
    requestSeq: mySeq,
    getLatestSeq: () => searchJumpSeq,
    setSearchOpen: (open) => (isSearchOpen.value = open),
    setSuppressAutoScroll: (suppress) =>
      (suppressAutoScrollForAnchorJump.value = suppress),
    loadAroundAnchor: (anchorMessageId, limit, convId) =>
      showMessageStore.loadMessagesAroundAnchor(anchorMessageId, limit, convId),
    container: messagesContainer.value,
    waitForLayout: async () => {
      await nextTick();
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    },
    onAnchorFlash: (anchorMessageId) => startAnchorFlash(anchorMessageId),
    onAnchorNotFound: (anchorMessageId) =>
      console.warn("锚点消息节点未找到，messageId:", anchorMessageId),
    onError: (message) => alert(message),
  });
};

/**
 * 事件处理
 */
const handleSearch = () => {
  if (!isSearchOpen.value) {
    snapshotMessageScrollPosition();
    isSearchOpen.value = true;
  } else {
    isSearchOpen.value = false;
    void restoreMessageScrollPosition();
  }
  emit("search");
};
const handleMenu = () => emit("menu");
const handleCall = () => {
  const peer = singlePeerUserId.value;
  if (
    !canVoiceVideoCall.value ||
    props.convId == null ||
    peer == null ||
    peer <= 0
  ) {
    return;
  }
  emit("call", { convId: props.convId, peerUserId: peer });
};

const handleHeaderLeftClick = () => {
  if (!props.convId) return;
  if (!isGroupChat.value && !singlePeerUserId.value) return;
  isGroupInfoOpen.value = !isGroupInfoOpen.value;
};

const closeGroupInfo = () => {
  isGroupInfoOpen.value = false;
};

const startInfoPanelResize = (e: MouseEvent | TouchEvent) => {
  startInfoPanelResizeFlow({
    event: e,
    canResize: isGroupInfoOpen.value,
    currentPanelWidth: infoPanelWidth.value,
    setResizing: (value) => (isResizingInfoPanel.value = value),
    setStartX: (value) => (infoPanelStartX.value = value),
    setStartWidth: (value) => (infoPanelStartWidth.value = value),
    onPointerMove: handleInfoPanelResize,
    onPointerUp: stopInfoPanelResize,
  });
};

const handleInfoPanelResize = (e: MouseEvent | TouchEvent) => {
  handleInfoPanelResizeFlow({
    event: e,
    isResizing: isResizingInfoPanel.value,
    startX: infoPanelStartX.value,
    startWidth: infoPanelStartWidth.value,
    animationFrameId: infoPanelAnimationFrameId,
    setAnimationFrameId: (id) => (infoPanelAnimationFrameId = id),
    setPanelWidth: (width) => (infoPanelWidth.value = width),
  });
};

const stopInfoPanelResize = () => {
  stopInfoPanelResizeFlow({
    panelWidth: infoPanelWidth.value,
    widthStorageKey: INFO_PANEL_WIDTH_KEY,
    animationFrameId: infoPanelAnimationFrameId,
    setAnimationFrameId: (id) => (infoPanelAnimationFrameId = id),
    setResizing: (value) => (isResizingInfoPanel.value = value),
    onPointerMove: handleInfoPanelResize,
    onPointerUp: stopInfoPanelResize,
  });
};

/** rAF 合并滚动事件，状态机入口在 normalize。 */
const scheduleMessagesScrollPagination = () => {
  if (messagesScrollRafId != null) return;
  messagesScrollRafId = requestAnimationFrame(() => {
    messagesScrollRafId = null;
    void runScrollPaginationStateMachine({
      container: messagesContainer.value,
      convId: props.convId,
      now: Date.now(),
      paginationInFlight: paginationInFlight.value,
      edgeCooldownUntil: edgePaginationCooldownUntil.value,
      setPaginationInFlight: (value) => (paginationInFlight.value = value),
      setEdgeCooldownUntil: (value) =>
        (edgePaginationCooldownUntil.value = value),
      edgeCooldownMs: EDGE_PAGINATION_COOLDOWN_MS,
      showMessageState: {
        loading: showMessageStore.loading,
        historyLoading: showMessageStore.historyLoading,
        anchorViewActive: showMessageStore.anchorViewActive,
        canLoadOlderAnchor: showMessageStore.canLoadOlderAnchor,
        canLoadNewerAnchor: showMessageStore.canLoadNewerAnchor,
        hasMoreHistory: showMessageStore.hasMoreHistory,
        anchorNewerPaginateLoading: showMessageStore.anchorNewerPaginateLoading,
      },
      getOldestMessageId: () =>
        showMessageStore.getOldestMessage()?.messageId ?? null,
      getLatestMessageId: () =>
        showMessageStore.getLatestMessage()?.messageId ?? null,
      loadOlderAnchor: (boundaryMessageId) =>
        showMessageStore.loadOlderMessagesBeforeBoundary(boundaryMessageId),
      loadHistory: (convId, boundaryMessageId) =>
        showMessageStore.loadMessages(convId, "history", boundaryMessageId),
      loadNewerAnchor: (boundaryMessageId) =>
        showMessageStore.loadNewerMessagesAfterBoundary(boundaryMessageId),
      waitForLayout: async () => {
        await nextTick();
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
      },
    });
  });
};

/**
 * 清理WebSocket监听器
 */
const cleanupWebSocketListeners = () => {
  console.log("ChatContainer: 清理WebSocket监听器");

  // 只清理监听器，不断开全局WebSocket连接（除非明确需要）
  if (globalWebSocketCleanup) {
    globalWebSocketCleanup();
    globalWebSocketCleanup = null;
  }

  webSocketListenersInitialized.value = false;
  connectionError.value = null;
};

// 监听会话ID变化
watch(
  () => props.convId,
  (newConvId, oldConvId) => {
    console.log("ChatContainer: 会话ID变化:", {
      旧ID: oldConvId,
      新ID: newConvId,
    });

    if (newConvId) {
      loadMessages();
      messageText.value = "";
      isSearchOpen.value = false;
    } else {
      // 当没有会话时，只清空消息，不断开WebSocket连接
      showMessageStore.clearMessages();
      cleanupWebSocketListeners();
      isGroupInfoOpen.value = false;
      isSearchOpen.value = false;
    }
  },
  { immediate: true }
);

// 不在此对 messages 做 deep watch + scrollToBottom（会与顶/底分页、异步写库等产生竞态，导致瞬间滚底、连触发加载）。
// 滚底仅在：进入会话初始 load、用户发送、贴底收新消息、WS/HTTP 发送确认等路径显式调用 scrollToBottom。

// 监听认证状态变化
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated && props.convId) {
      console.log("用户已认证，准备连接WebSocket");
      initWebSocket();
    } else {
      console.log("用户未认证或会话不存在，清理WebSocket监听器");
      cleanupWebSocketListeners();
    }
  }
);

// 监听WebSocket连接错误
watch(
  () => websocketStore.connectionError,
  (error) => {
    if (error) {
      console.error("WebSocket连接错误:", error);
      connectionError.value = error;
    }
  }
);

onMounted(() => {
  console.log("ChatContainer mounted");
  window.addEventListener("mousemove", handlePreviewMouseMove);
  window.addEventListener("mouseup", handlePreviewMouseUp);
});

onUnmounted(() => {
  console.log("ChatContainer unmounted");
  window.removeEventListener("mousemove", handlePreviewMouseMove);
  window.removeEventListener("mouseup", handlePreviewMouseUp);
  if (messagesScrollRafId != null) {
    cancelAnimationFrame(messagesScrollRafId);
    messagesScrollRafId = null;
  }
  if (anchorFlashClearTimer != null) {
    clearTimeout(anchorFlashClearTimer);
    anchorFlashClearTimer = null;
  }
  // 组件卸载时只清理监听器，不断开全局连接
  cleanupWebSocketListeners();
  imagePreviewStore.closePreview();
});
</script>
<style scoped>
/* 使用外部样式文件 */
@import "@/assets/styles/chat-container.css";

/* 搜索面板展开动画（作用于 messages-container 内覆盖层） */
.chat-search-slide-enter-active,
.chat-search-slide-leave-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.chat-search-slide-enter-from,
.chat-search-slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
.chat-search-slide-enter-to,
.chat-search-slide-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 加载状态和空消息提示样式 */
.loading-indicator {
  text-align: center;
  padding: 16px;
  color: #666;
  font-size: 14px;
}

.no-messages {
  text-align: center;
  padding: 40px 16px;
  color: #999;
  font-size: 14px;
}

.hidden-file-input {
  display: none;
}

.chat-header {
  position: relative;
}

.header-upload-progress-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: transparent;
  pointer-events: none;
}

.header-upload-progress-inner {
  height: 100%;
  background: #409eff;
  transition: width 0.2s ease;
}

html.night-mode .header-upload-progress-inner {
  background: #a855f7;
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  background: rgb(0 0 0 / 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.image-preview-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-preview-origin {
  max-width: min(92vw, 1280px);
  max-height: 88vh;
  border-radius: 10px;
  box-shadow: 0 16px 48px rgb(0 0 0 / 0.4);
  object-fit: contain;
  cursor: grab;
  user-select: none;
  transition: transform 0.05s linear;
  transform-origin: center center;
}

.image-preview-origin:active {
  cursor: grabbing;
}

.composer-file-strip {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgb(64 158 255 / 8%);
}

.composer-file-strip__title {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.composer-file-strip__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.composer-file-strip__item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}

.composer-file-strip__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.composer-file-strip__meta {
  font-size: 12px;
  color: #909399;
}

.composer-file-strip__remove {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: #909399;
}
</style>
