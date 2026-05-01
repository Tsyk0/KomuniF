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
                <p v-if="chatStatusText" class="chat-status">
                  {{ chatStatusText }}
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
          :class="{ 'search-open': isSearchOpen }"
          ref="messagesContainer"
          @scroll="
            !isSearchOpen &&
              !isRestoringScroll &&
              scheduleMessagesScrollPagination()
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
              <MessageItem
                v-for="message in messages"
                :key="message.messageId"
                :message="message"
                :conv-type="currentConvTypeOrNull"
                :flash-anchor="anchorFlashMessageId === message.messageId"
              />

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

        <!-- 发送消息区域 -->
        <div class="message-input-container">
          <div class="composer-row">
            <div class="input-wrapper">
              <button
                class="action-button emoji-button"
                title="表情"
                type="button"
              >
                <Smile :size="22" :stroke-width="2.2" />
              </button>

              <!-- 消息输入框 -->
              <div class="message-input-wrapper">
                <el-input
                  v-model="messageText"
                  class="message-input-el"
                  placeholder="输入消息..."
                  @keydown.enter.exact.prevent="handleEnterKey"
                />
              </div>

              <div class="attachment-trigger-wrap">
                <button
                  class="action-button attachment-button"
                  title="附件"
                  type="button"
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
            <button class="action-button mic-button" title="语音" type="button">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from "vue";
import { MessageCircleDashed, Mic, Paperclip, Smile } from "lucide-vue-next";
import { CircleEllipsis, Search, Video } from "lucide-vue-next";
import { useShowMessageStore } from "@/store/message/showMessage";
import { useSendMessageStore } from "@/store/message/sendMessage";
import { useFileUploadStore } from "@/store/message/fileUpload";
import { useImagePreviewStore } from "@/store/message/imagePreview";
import { useUserStore } from "@/store/user/user";
import { useConvStore } from "@/store/conv/conv";
import { useWebSocketStore } from "@/store/realtime/websocket";
import MessageItem from "./MessageItem.vue";
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
import { handleRealtimeIncomingMessage } from "@/normalize/message";
import type { DisplayMessage } from "@/entity/message";
import type { User } from "@/entity/user";

// Store
const showMessageStore = useShowMessageStore();
const sendMessageStore = useSendMessageStore();
const fileUploadStore = useFileUploadStore();
const imagePreviewStore = useImagePreviewStore();
const authStore = useUserStore();
const websocketStore = useWebSocketStore();
const conversationStore = useConvStore();

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

const snapshotMessageScrollPosition = () => {
  const el = messagesContainer.value;
  if (!el) return;
  savedScrollTop.value = el.scrollTop;
  const bottomGap = el.scrollHeight - (el.scrollTop + el.clientHeight);
  savedWasAtBottom.value = bottomGap <= 6;
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
    messageText.value.trim().length > 0 && props.convId && !isSending.value
  );
});

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
      if (message.convId === props.convId) {
        handleIncomingWebSocketMessage(message);
      }
    },
    // 按当前需求暂不处理 ACK，后续需要再补。
    onMessageSent: () => {},
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

  const box = messagesContainer.value;
  const result = handleRealtimeIncomingMessage({
    payload: message,
    currentUserId: currentUser.userId,
    currentUserAvatar: currentUser.userAvatar || null,
    conversationMembers:
      conversationStore.compressedCMMap.get(Number(message.convId)) || [],
    hasMessage: (messageId: number) =>
      showMessageStore.messages.some((msg) => msg.messageId === messageId),
    appendMessage: (displayMessage: DisplayMessage) =>
      showMessageStore.addMessage(displayMessage),
    isNearBottom: box ? isContainerNearBottom(box) : false,
  });
  if (!result.added) return;
  console.log("将WebSocket消息添加到Store:", result.displayMessage);
  if (result.shouldScrollToBottom) {
    scrollToBottom();
  }
};

/**
 * 发送消息（优先使用WebSocket）- 修复超时逻辑
 */
const sendMessage = async () => {
  if (!canSend.value || !props.convId) return;

  const content = messageText.value.trim();
  const currentUser = authStore.user;

  if (!currentUser?.userId) {
    console.error("用户未登录");
    return;
  }

  let tempMessage: DisplayMessage | undefined;
  isSending.value = true;

  try {
    console.log("发送消息:", { convId: props.convId, content });

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
      }
    );
    scrollToBottom();

    // 2. 清空输入框
    messageText.value = "";

    // 3. MVP 阶段仅保留 WebSocket 发送，不做 HTTP 降级。
    if (!websocketStore.isConnected) {
      console.log("WebSocket未连接，尝试连接...");
      await initWebSocket();
    }
    if (!websocketStore.isConnected) {
      throw new Error("WebSocket unavailable");
    }
    const success = websocketStore.sendTextMessage(props.convId, content);
    if (!success) {
      throw new Error("WebSocket send failed");
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

/**
 * 加载消息
 */
const loadMessages = async () => {
  if (!props.convId) return;

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
};

/**
 * 处理Enter键发送
 */
const handleEnterKey = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.shiftKey && canSend.value) {
    event.preventDefault();
    sendMessage();
  }
};

/**
 * 打开系统文件选择器。
 * 作用场景：用户点击回形针按钮后直接选取附件（不再经过二级菜单）。
 */
const openFilePicker = () => {
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
}) => {
  if (!props.convId || !authStore.user?.userId) return;
  const messagePayload = {
    fileId: params.fileId,
    fileName: params.fileName,
    fileSize: params.fileSize,
    mimeType: params.mimeType,
  };
  const messageContent = JSON.stringify(messagePayload);
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
      messageType: params.messageType,
      fileId: params.fileId,
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
    }
  );
  scrollToBottom();

  if (!websocketStore.isConnected) {
    await initWebSocket();
  }
  const success = websocketStore.sendMessageByType({
    convId: props.convId,
    messageType: params.messageType,
    messageContent,
  });
  if (!success) {
    showMessageStore.updateMessageStatus(tempMessage.messageId, 4);
    throw new Error("附件消息发送失败");
  }
};

/**
 * 仅做本地附件消息回显（不触发 WS 发送）。
 * 作用场景：秒传命中时，后端已持久化并广播给他人，但当前端需要立即看到自己的消息。
 */
const appendLocalFileMessageEcho = (params: {
  messageType: "image" | "file" | "video";
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}) => {
  if (!props.convId || !authStore.user?.userId) return;
  sendMessageStore.appendLocalMessageEcho(
    {
      convId: props.convId,
      currentUserId: authStore.user.userId,
      currentUserNickname: authStore.user.userNickname || null,
      currentUserAvatar: authStore.user.userAvatar || null,
      conversationMembers: conversationStore.compressedCMMap.get(props.convId),
    },
    {
      kind: "file",
      messageType: params.messageType,
      fileId: params.fileId,
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
    }
  );
  scrollToBottom();
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

  try {
    const messageType = resolveMessageTypeByFile(pickedFile);
    const uploadResult = await fileUploadStore.uploadFile({
      file: pickedFile,
      convId: props.convId,
      mimeType: pickedFile.type || "application/octet-stream",
    });
    if (uploadResult.instantUpload) {
      // 秒传命中时，后端已写消息并推送给其他端；当前端本端做即时回显但不重复发送。
      appendLocalFileMessageEcho({
        messageType,
        fileId: uploadResult.fileId,
        fileName: pickedFile.name,
        fileSize: pickedFile.size,
        mimeType: pickedFile.type || "application/octet-stream",
      });
      return;
    }
    await sendFileMessage({
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
 * 滚动到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    scrollContainerToBottom(messagesContainer.value);
  });
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
  if (props.convId) {
    loadMessages();
  }
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
</style>
