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

          <!-- WebSocket状态显示 - 新增部分 -->
          <div class="header-center" v-if="shouldShowWebSocketStatus">
            <div class="websocket-status" :class="websocketStatus">
              <span class="status-icon">
                <span v-if="websocketStatus === 'connected'">✓</span>
                <span v-if="websocketStatus === 'connecting'">⟳</span>
                <span v-if="websocketStatus === 'disconnected'">⚠</span>
              </span>
              <span class="status-text">
                <span v-if="websocketStatus === 'connected'">实时连接</span>
                <span v-if="websocketStatus === 'connecting'">连接中...</span>
                <span v-if="websocketStatus === 'disconnected'">离线</span>
              </span>
              <span
                v-if="connectionError"
                class="error-text"
                :title="connectionError"
              >
                ({{
                  connectionError.length > 10
                    ? connectionError.substring(0, 10) + "..."
                    : connectionError
                }})
              </span>
            </div>
          </div>

          <div class="header-right">
            <button
              v-if="canVoiceVideoCall"
              class="header-action"
              @click="handleCall"
              title="音视频通话（单聊）"
            >
              <BaseIcon class="action-icon" name="phone" />
            </button>
            <button class="header-action" @click="handleSearch" title="搜索">
              <BaseIcon class="action-icon" name="search" />
            </button>
            <button class="header-action" @click="handleMenu" title="更多">
              <BaseIcon class="action-icon" name="more-vertical" />
            </button>
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
          <div class="input-wrapper">
            <!-- 左侧功能按钮 -->
            <div class="input-left-actions">
              <button class="action-button attachment-button" title="附件">
                <BaseIcon class="action-icon" name="attachment" />
              </button>
              <button class="action-button emoji-button" title="表情">
                <BaseIcon class="action-icon" name="emoji" />
              </button>
            </div>

            <!-- 消息输入框 -->
            <div class="message-input-wrapper">
              <textarea
                ref="messageInputRef"
                v-model="messageText"
                class="message-input"
                placeholder="输入消息..."
                rows="1"
                @keydown.enter.prevent="handleEnterKey"
                @input="handleInputResize"
              ></textarea>
            </div>

            <!-- 右侧发送按钮 -->
            <div class="input-right-actions">
              <button
                class="action-button send-button"
                :class="{ disabled: !canSend }"
                :disabled="!canSend || isSending"
                @click="sendMessage"
                title="发送"
              >
                <span class="send-icon" v-if="!isSending">
                  <BaseIcon name="send" />
                </span>
                <span class="loading-icon" v-if="isSending">
                  <span class="loading-spinner small"></span>
                </span>
              </button>
            </div>
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
        <ConversationInfo
          :conv-id="convId"
          :friend-id="singlePeerUserId"
          @close="closeGroupInfo"
          @changes-pending="hasInfoPendingChanges = $event"
        />
      </div>
    </div>

    <!-- 未选择会话状态 -->
    <div v-else class="no-conversation">
      <div class="placeholder-icon">
        <BaseIcon name="message" :size="40" />
      </div>
      <p class="placeholder-text">选择一个会话以开始聊天</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from "vue";
import { useShowMessageStore } from "@/store/message/showMessage";
import { useUserStore } from "@/store/user/user";
import { useConvStore } from "@/store/conv/conv";
import { useWebSocketStore } from "@/store/realtime/websocket";
import MessageItem from "./MessageItem.vue";
import ChatSearchPanel from "./ChatSearchPanel.vue";
import ConversationInfo from "./ConversationInfo.vue";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import {
  resetMessageComposerView,
  resizeMessageComposer,
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
  buildTempTextMessage,
} from "@/normalize/message";
import type { DisplayMessage } from "@/entity/message";
import type { User } from "@/entity/user";
import BaseIcon from "./BaseIcon.vue";

// Store
const showMessageStore = useShowMessageStore();
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
  const conv = currentConversation.value;
  if (!conv) return "";
  return conv.convName || "未命名会话";
});

const currentConvTypeOrNull = computed(() => {
  const t = currentConversation.value?.convType;
  return t == null ? null : t;
});

/**
 * 单聊对端 userId：与 HomeView 的 currentFriendId 一致——
 * 优先父组件传入的 friendId，否则用会话 targetUserId，再没有则从当前消息列表推断。
 * 避免「无消息且摘要未带 targetUserId」时父组件传 null 导致不显示通话按钮 / 无法打开侧栏。
 */
const singlePeerUserId = computed((): number | null => {
  if (props.friendId != null && props.friendId > 0) {
    return props.friendId;
  }
  const c = currentConversation.value;
  if (c?.convType !== 1) return null;
  if (c.targetUserId != null && c.targetUserId > 0) {
    return c.targetUserId;
  }
  const myId = authStore.user?.userId;
  const msgs = showMessageStore.messages || [];
  const otherIds = [
    ...new Set(
      msgs.map((m) => m.senderId).filter((id) => id !== myId && id > 0)
    ),
  ];
  return otherIds.length > 0 ? otherIds[0]! : null;
});

/** 1 对 1 通话：单聊且能解析到对端 userId */
const canVoiceVideoCall = computed(
  () =>
    currentConversation.value?.convType === 1 &&
    singlePeerUserId.value != null &&
    singlePeerUserId.value > 0
);

// 响应式数据
const messagesContainer = ref<HTMLElement | null>(null);
const messageInputRef = ref<HTMLTextAreaElement | null>(null);
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
const websocketStatus = computed(() => {
  if (isWebSocketConnecting.value) return "connecting";
  return websocketStore.isConnected ? "connected" : "disconnected";
});
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

const shouldShowWebSocketStatus = computed(() => {
  return (
    websocketStatus.value !== "connected" ||
    connectionError.value !== null ||
    websocketStore.connectionError !== null
  );
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
  return conversationStore.currentConversation?.convType === 2;
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

    // 1. 创建临时消息（构建逻辑下沉到 normalize）
    tempMessage = buildTempTextMessage({
      convId: props.convId,
      currentUserId: currentUser.userId,
      currentUserNickname: currentUser.userNickname || null,
      currentUserAvatar: currentUser.userAvatar || null,
      content,
      conversationMembers: conversationStore.compressedCMMap.get(props.convId),
    });

    // 2. 添加到Store
    showMessageStore.addMessage(tempMessage);

    // 3. 清空输入框
    resetMessageComposerView((value) => (messageText.value = value), messageInputRef.value);

    // 4. 滚动到底部
    scrollToBottom();

    // 5. MVP 阶段仅保留 WebSocket 发送，不做 HTTP 降级。
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
    connectWebSocket: (userId, convId) => websocketStore.connect(userId, convId),
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
 * 输入框自适应高度
 */
const handleInputResize = () => {
  nextTick(() => {
    resizeMessageComposer(messageInputRef.value);
  });
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
      setEdgeCooldownUntil: (value) => (edgePaginationCooldownUntil.value = value),
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
      getOldestMessageId: () => showMessageStore.getOldestMessage()?.messageId ?? null,
      getLatestMessageId: () => showMessageStore.getLatestMessage()?.messageId ?? null,
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
});

onUnmounted(() => {
  console.log("ChatContainer unmounted");
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
</style>