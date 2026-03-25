<template>
  <div class="chat-container">
    <div
      v-if="convId"
      class="chat-layout"
      :class="{ 'info-open': isGroupInfoOpen && (isGroupChat || friendId) }"
    >
      <!-- 左侧聊天主区域 -->
      <div class="chat-main">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <div
            class="header-left"
            :class="{ clickable: isGroupChat || !!friendId }"
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
              class="header-action"
              @click="handleCall"
              title="音视频通话"
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
          @scroll="!isSearchOpen && !isRestoringScroll && handleMessagesScroll()"
        >
          <!-- 搜索打开时：只显示搜索面板（通过 v-if 彻底隐藏原消息列表） -->
          <Transition name="chat-search-slide">
            <ChatSearchPanel
              v-if="isSearchOpen"
              :open="isSearchOpen"
              :conv-id="convId"
              @close="isSearchOpen = false; void restoreMessageScrollPosition()"
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
              />

              <!-- 没有消息的提示 -->
              <div v-if="!isLoading && messages.length === 0" class="no-messages">
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

          <!-- 发送方式提示 - 新增部分 -->
          <div class="send-mode-hint" v-if="!isUsingWebSocket">
            <span class="hint-icon">⚠</span>
            <span class="hint-text">使用HTTP发送（WebSocket不可用）</span>
          </div>
        </div>
      </div>

      <!-- 右侧会话/好友信息面板（群聊或单聊均可打开） -->
      <div
        v-if="isGroupChat || friendId"
        ref="infoPanelWrapper"
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
          :friend-id="friendId"
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
import { useShowMessageStore } from "@/stores/chat/show-message";
import { useSendMessageStore } from "@/stores/chat/send-message";
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/chat/show-conversation";
import {
  useWebSocketStore,
  type WebSocketMessage,
} from "@/stores/chat/websocket-store";
import MessageItem from "./MessageItem.vue";
import ChatSearchPanel from "./ChatSearchPanel.vue";
import ConversationInfo from "./ConversationInfo.vue";
import { useConversationDisplay } from "@/composables/useConversationDisplay";
import type { DisplayMessage } from "@/entity/message";
import type { User } from "@/entity/user";
import BaseIcon from "./BaseIcon.vue";

// Store
const showMessageStore = useShowMessageStore();
const sendMessageStore = useSendMessageStore();
const authStore = useAuthStore();
const websocketStore = useWebSocketStore();
const conversationStore = useConversationStore();

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

const emit = defineEmits(["back", "search", "menu", "message-sent", "call"]);

// 当前会话（与会话列表同源，保证 chatinfo 与会话 item 显示一致）
const currentConversation = computed(() => {
  if (props.convId == null) return null;
  const cur = conversationStore.currentConversation;
  if (cur?.convId === props.convId) return cur;
  return conversationStore.conversationMap.get(props.convId) ?? null;
});
const { displayName: conversationDisplayName, avatar: conversationAvatar } =
  useConversationDisplay(currentConversation);

// 响应式数据
const messagesContainer = ref<HTMLElement | null>(null);
const messageInputRef = ref<HTMLTextAreaElement | null>(null);
const messageText = ref("");
const isSending = computed(() => sendMessageStore.isSending);
const isSearchOpen = ref(false);
const savedScrollTop = ref(0);
const savedWasAtBottom = ref(true);
const isRestoringScroll = ref(false);

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
const infoPanelWrapper = ref<HTMLElement | null>(null);
const infoPanelRight = ref(0);

// WebSocket相关状态
const websocketStatus = computed(() => {
  if (isWebSocketConnecting.value) return "connecting";
  return websocketStore.isConnected ? "connected" : "disconnected";
});
const connectionError = ref<string | null>(null);
const isUsingWebSocket = ref(true);
const webSocketListenersInitialized = ref(false);

// 防止重复连接的标志
const isWebSocketConnecting = ref(false);
let globalWebSocketCleanup: (() => void) | null = null;

// 计算属性
const processAvatarUrl = (avatarUrl: string): string => {
  if (!avatarUrl || avatarUrl === "") {
    return "";
  }

  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:image/")) {
    return avatarUrl;
  }

  avatarUrl = avatarUrl.trim();

  if (!avatarUrl.startsWith("/")) {
    avatarUrl = "/" + avatarUrl;
  }

  return "http://localhost:8081" + avatarUrl;
};

const avatarUrl = computed(() => {
  if (!conversationAvatar.value) return "";
  return processAvatarUrl(conversationAvatar.value);
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

const canUseWebSocket = computed(() => {
  const user = authStore.user;
  return (
    websocketStore.isConnected &&
    user?.userId !== undefined &&
    props.convId !== null
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
  const showPanel = isGroupChat.value || props.friendId;
  if (!showPanel) return {};
  const extra = hasInfoPendingChanges.value ? 80 : 0;
  return {
    width: isGroupInfoOpen.value ? `${infoPanelWidth.value + extra}px` : "0px",
  };
});

/**
 * 初始化WebSocket连接和监听器 - 修复重复连接问题
 */
const initWebSocket = async () => {
  if (!authStore.isAuthenticated || !props.convId) {
    console.log("未登录或无会话ID，跳过WebSocket连接");
    return;
  }

  // 防止重复连接
  if (isWebSocketConnecting.value || websocketStore.isConnected) {
    console.log("WebSocket已经在连接或已连接，只设置监听器");
    if (!webSocketListenersInitialized.value) {
      const cleanup = setupWebSocketEventListeners();
      if (cleanup) globalWebSocketCleanup = cleanup;
    }
    return;
  }

  const currentUser = authStore.user;
  if (!currentUser?.userId) {
    console.error("用户ID不存在，无法连接WebSocket");
    return;
  }

  isWebSocketConnecting.value = true;

  try {
    console.log("正在建立WebSocket连接...", {
      userId: currentUser.userId,
      convId: props.convId,
    });

    await websocketStore.connect(currentUser.userId, props.convId);
    console.log("WebSocket连接成功");
    connectionError.value = null;
    isUsingWebSocket.value = true;

    const cleanup = setupWebSocketEventListeners();
    if (cleanup) globalWebSocketCleanup = cleanup;
  } catch (error) {
    console.error("WebSocket连接失败:", error);
    connectionError.value = "无法连接到实时消息服务器";
    isUsingWebSocket.value = false;
  } finally {
    isWebSocketConnecting.value = false;
  }
};

/**
 * 设置WebSocket事件监听器 - 修复消息确认处理
 */
const setupWebSocketEventListeners = () => {
  if (webSocketListenersInitialized.value) {
    return;
  }

  console.log("设置WebSocket事件监听器");

  // 监听新消息事件
  const handleNewMessage = (event: CustomEvent) => {
    console.log("收到WebSocket新消息事件:", event.detail);
    const message = event.detail;

    if (message.convId === props.convId) {
      console.log("处理当前会话的新消息:", message);
      handleIncomingWebSocketMessage(message);
    } else {
      console.log("收到其他会话的消息，忽略:", message.convId);
    }
  };

  // 正确处理消息发送成功确认
  const handleMessageSent = (event: CustomEvent) => {
    console.log("消息发送成功确认:", event.detail);

    const message = event.detail;
    if (
      message.convId === props.convId &&
      message.success &&
      message.messageId
    ) {
      console.log("当前会话消息发送成功，消息ID:", message.messageId);

      // 找到所有状态为0（发送中）的消息
      const sendingMessages = showMessageStore.messages.filter(
        (msg) => msg.messageStatus === 0 && msg.isSentByMe
      );

      if (sendingMessages.length > 0) {
        // 取最后一条发送中的消息（假设是最新发送的）
        const tempMessage = sendingMessages[sendingMessages.length - 1];
        console.log(
          "更新临时消息状态:",
          tempMessage.messageId,
          "->",
          message.messageId
        );

        // 用服务器消息替换临时消息
        const serverMessage: DisplayMessage = {
          ...tempMessage,
          messageId: message.messageId,
          messageStatus: 1, // 已发送
          sendTime: new Date(message.timestamp || Date.now()).toISOString(),
        };

        showMessageStore.replaceTempMessage(
          tempMessage.messageId,
          serverMessage
        );
        console.log("临时消息已更新为服务器消息");
      }
    }
  };

  // 监听错误
  const handleError = (event: CustomEvent) => {
    console.error("WebSocket错误:", event.detail);
    connectionError.value = event.detail || "WebSocket连接错误";
  };

  // 添加事件监听
  window.addEventListener(
    "websocket:newMessage",
    handleNewMessage as EventListener
  );
  window.addEventListener(
    "websocket:messageSent",
    handleMessageSent as EventListener
  );
  window.addEventListener("websocket:error", handleError as EventListener);

  webSocketListenersInitialized.value = true;

  // 返回清理函数
  return () => {
    window.removeEventListener(
      "websocket:newMessage",
      handleNewMessage as EventListener
    );
    window.removeEventListener(
      "websocket:messageSent",
      handleMessageSent as EventListener
    );
    window.removeEventListener("websocket:error", handleError as EventListener);
    webSocketListenersInitialized.value = false;
  };
};

/**
 * 处理从WebSocket接收到的消息
 */
const handleIncomingWebSocketMessage = (message: any) => {
  const currentUser = authStore.user;
  if (!currentUser?.userId) return;

  // 检查是否已存在该消息（避免重复）
  const existingMessage = showMessageStore.messages.find(
    (msg) => msg.messageId === message.messageId
  );

  if (existingMessage) {
    console.log("消息已存在，跳过:", message.messageId);
    return;
  }

  // 构建完整的DisplayMessage对象
  // 获取会话类型以支持正确的昵称显示逻辑
  const conv = conversationStore.conversations.find(
    (c) => c.convId === message.convId
  );

  const displayMessage: DisplayMessage = {
    messageId: message.messageId || Date.now(),
    convId: message.convId,
    senderId: message.senderId,
    messageType: message.messageType || "text",
    messageContent: message.messageContent || message.content || "",
    messageStatus: message.messageStatus || 1,
    sendTime: message.sendTime
      ? new Date(message.sendTime).toISOString()
      : new Date().toISOString(),
    replyToMessageId: message.replyToMessageId || undefined,
    isRecalled: message.isRecalled || 0,

    // 显示字段 - 使用Store中的解析逻辑
    senderName: showMessageStore.resolveSenderName(
      message.senderId,
      `用户${message.senderId}`,
      conv?.convType,
      // 尝试从会话成员缓存中获取群昵称
      conv?.convType === 2
        ? getMemberNicknameFromCache(message.convId, message.senderId)
        : undefined,
      message.convId
    ),
    senderAvatar: getSenderAvatar(message.senderId),
    isSentByMe: message.senderId === currentUser.userId,
  };

  console.log("将WebSocket消息添加到Store:", displayMessage);
  showMessageStore.addMessage(displayMessage);

  // 如果是自己发送的消息，自动滚动到底部
  if (displayMessage.isSentByMe) {
    scrollToBottom();
  }
};

/**
 * 获取发送者名称
 */
const getSenderName = (senderId: number): string => {
  const currentUser = authStore.user;
  if (senderId === currentUser?.userId) {
    return currentUser.userNickname || "我";
  }

  // TODO: 从联系人缓存中获取名称
  return `用户${senderId}`;
};

/**
 * 获取发送者头像
 */
const getSenderAvatar = (senderId: number): string | null => {
  const currentUser = authStore.user;
  if (senderId === currentUser?.userId) {
    return currentUser.userAvatar || null;
  }

  // TODO: 从联系人缓存中获取头像
  return null;
};

/**
 * 从会话成员缓存中获取群昵称
 */
const getMemberNicknameFromCache = (
  convId: number,
  userId: number
): string | null => {
  const members = conversationStore.compressedCMMap.get(convId);
  if (members) {
    const member = members.find((m) => m.userId === userId);
    return member?.memberNickname || null;
  }
  return null;
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
  let messageTimeoutId: number | null = null;

  try {
    console.log("发送消息:", { convId: props.convId, content });

    // 1. 创建临时消息 - 使用resolveSenderName确保昵称正确
    tempMessage = {
      messageId: Date.now(),
      convId: props.convId,
      senderId: currentUser.userId,
      messageType: "text",
      messageContent: content,
      messageStatus: 0, // 发送中
      sendTime: new Date().toISOString(),
      senderName: showMessageStore.resolveSenderName(
        currentUser.userId,
        currentUser.userNickname || "我",
        conversationStore.currentConversation?.convType,
        getMemberNicknameFromCache(props.convId, currentUser.userId),
        props.convId
      ),
      senderAvatar: currentUser.userAvatar || null,
      isSentByMe: true,
    };

    // 2. 添加到Store
    showMessageStore.addMessage(tempMessage);

    // 3. 清空输入框
    messageText.value = "";
    if (messageInputRef.value) {
      messageInputRef.value.style.height = "auto";
    }

    // 4. 滚动到底部
    scrollToBottom();

    // 5. 优先尝试WebSocket发送
    if (isUsingWebSocket.value) {
      console.log("尝试使用WebSocket发送消息");

      // 确保WebSocket连接
      if (!websocketStore.isConnected) {
        console.log("WebSocket未连接，尝试连接...");
        await initWebSocket();
      }

      // 再次检查连接状态
      if (websocketStore.isConnected) {
        const success = websocketStore.sendTextMessage(props.convId, content);

        if (success) {
          console.log("WebSocket消息发送成功，等待服务器确认");

          // 更智能的超时处理
          messageTimeoutId = window.setTimeout(() => {
            if (!tempMessage) return;

            const sentMessage = showMessageStore.messages.find(
              (msg) => msg.messageId === tempMessage!.messageId
            );
            if (sentMessage && sentMessage.messageStatus === 0) {
              console.log("WebSocket确认超时，降级到HTTP");
              // 先清理定时器
              if (messageTimeoutId) clearTimeout(messageTimeoutId);
              fallbackToHttpSend(tempMessage!, content);
            }
          }, 5000);

          return;
        } else {
          console.log("WebSocket发送失败，降级到HTTP");
          isUsingWebSocket.value = false;
          if (tempMessage) {
            fallbackToHttpSend(tempMessage, content);
          }
        }
      } else {
        console.log("WebSocket连接失败，降级到HTTP");
        isUsingWebSocket.value = false;
        if (tempMessage) {
          fallbackToHttpSend(tempMessage, content);
        }
      }
    } else {
      // 6. 直接使用HTTP发送
      console.log("WebSocket不可用，使用HTTP发送消息");
      if (tempMessage) {
        fallbackToHttpSend(tempMessage, content);
      }
    }
  } catch (error) {
    console.error("发送消息失败:", error);

    if (tempMessage) {
      showMessageStore.updateMessageStatus(tempMessage.messageId, 4);
    }

    connectionError.value = "消息发送失败，请检查网络连接";
  } finally {
    // 清理定时器
    if (messageTimeoutId) clearTimeout(messageTimeoutId);
  }
};

/**
 * HTTP后备发送
 */
const fallbackToHttpSend = async (
  tempMessage: DisplayMessage,
  content: string
) => {
  try {
    const userId = authStore.user?.userId;
    if (userId === undefined) {
      throw new Error("用户未登录");
    }

    const response = await sendMessageStore.sendTextMessage(
      props.convId!,
      userId,
      content
    );

    console.log("HTTP服务器响应:", response);

    // 用服务器消息替换临时消息
    const serverMessage: DisplayMessage = {
      ...tempMessage,
      messageId: response.messageId,
      messageStatus: response.messageStatus,
      sendTime: response.sendTime,
    };

    showMessageStore.replaceTempMessage(tempMessage.messageId, serverMessage);

    // 触发消息发送事件
    emit("message-sent", response);
  } catch (error) {
    console.error("HTTP发送失败:", error);

    // 标记临时消息为失败状态
    showMessageStore.updateMessageStatus(tempMessage.messageId, 4);

    throw error;
  }
};

/**
 * 加载消息
 */
const loadMessages = async () => {
  if (!props.convId) return;

  console.log("ChatContainer: 触发加载消息，会话ID:", props.convId);

  // 1. 使用HTTP获取历史消息
  await showMessageStore.loadMessages(props.convId);

  // 2. WebSocket：未连接则建立连接；已连接则同步当前会话并发送 subscribe（便于后端更新 currentConvId 并回传在线人数）
  if (!websocketStore.isConnected && !isWebSocketConnecting.value) {
    await initWebSocket();
  } else {
    if (!webSocketListenersInitialized.value) {
      const cleanup = setupWebSocketEventListeners();
      if (cleanup) globalWebSocketCleanup = cleanup;
    }
    const currentUser = authStore.user;
    if (currentUser?.userId && props.convId) {
      await websocketStore.connect(currentUser.userId, props.convId);
      // 已连接时发送 subscribe，确保切换会话后后端回传新会话的在线人数
      websocketStore.sendSubscribe(props.convId);
    }
  }
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
    if (messageInputRef.value) {
      messageInputRef.value.style.height = "auto";
      const newHeight = Math.min(messageInputRef.value.scrollHeight, 120);
      messageInputRef.value.style.height = `${newHeight}px`;
    }
  });
};

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

/**
 * 事件处理
 */
const handleBack = () => emit("back");
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
const handleCall = () => emit("call");

const handleHeaderLeftClick = () => {
  if (!props.convId) return;
  if (!isGroupChat.value && !props.friendId) return;
  isGroupInfoOpen.value = !isGroupInfoOpen.value;
};

const closeGroupInfo = () => {
  isGroupInfoOpen.value = false;
};

const startInfoPanelResize = (e: MouseEvent | TouchEvent) => {
  if (!isGroupInfoOpen.value) return;

  e.preventDefault();
  isResizingInfoPanel.value = true;

  const clientX =
    "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
  infoPanelStartX.value = clientX;
  infoPanelStartWidth.value = infoPanelWidth.value;

  document.addEventListener("mousemove", handleInfoPanelResize as any);
  document.addEventListener("mouseup", stopInfoPanelResize as any);
  document.addEventListener("touchmove", handleInfoPanelResize as any);
  document.addEventListener("touchend", stopInfoPanelResize as any);

  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
};

const handleInfoPanelResize = (e: MouseEvent | TouchEvent) => {
  if (!isResizingInfoPanel.value) return;

  if (infoPanelAnimationFrameId !== null) {
    cancelAnimationFrame(infoPanelAnimationFrameId);
  }

  infoPanelAnimationFrameId = requestAnimationFrame(() => {
    const currentX =
      "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    // 右侧面板左边缘跟随光标：向左拖动变宽，向右拖动变窄
    const deltaX = infoPanelStartX.value - currentX;
    let newWidth = infoPanelStartWidth.value + deltaX;

    const minWidth = 360;
    const maxWidth = 800;
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    infoPanelWidth.value = newWidth;
  });
};

const stopInfoPanelResize = () => {
  isResizingInfoPanel.value = false;

  if (infoPanelAnimationFrameId !== null) {
    cancelAnimationFrame(infoPanelAnimationFrameId);
    infoPanelAnimationFrameId = null;
  }

  document.removeEventListener("mousemove", handleInfoPanelResize as any);
  document.removeEventListener("mouseup", stopInfoPanelResize as any);
  document.removeEventListener("touchmove", handleInfoPanelResize as any);
  document.removeEventListener("touchend", stopInfoPanelResize as any);

  document.body.style.userSelect = "";
  document.body.style.cursor = "";

  // 可选：与会话列表类似，保存宽度到 localStorage
  try {
    localStorage.setItem(INFO_PANEL_WIDTH_KEY, infoPanelWidth.value.toString());
  } catch (error) {
    console.warn("无法保存群信息面板宽度:", error);
  }
};

/**
 * 消息容器滚动事件：到达顶部时自动加载更旧的历史消息
 */
const handleMessagesScroll = async () => {
  const container = messagesContainer.value;
  if (!container || !props.convId) return;

  // 只有在接近顶部时才触发（给一点阈值，避免频繁触发）
  const threshold = 10;
  if (container.scrollTop > threshold) return;

  // 如果正在加载（任意类型）或没有更多历史，则不再触发
  if (
    showMessageStore.loading ||
    showMessageStore.historyLoading ||
    !showMessageStore.hasMoreHistory
  ) {
    return;
  }

  const oldest = showMessageStore.getOldestMessage();
  if (!oldest) return;

  console.log(
    "滚动到顶部，加载更早的历史消息，beforeMessageId:",
    oldest.messageId
  );
  await showMessageStore.loadMessages(
    props.convId,
    "history",
    oldest.messageId
  );
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

  isUsingWebSocket.value = false;
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

// 监听消息列表变化，自动滚动到底部
watch(
  () => showMessageStore.messages,
  () => {
    // 加载历史消息（向上翻）时不自动滚动到底部，避免打断用户位置
    if (showMessageStore.historyLoading) return;

    nextTick(() => {
      scrollToBottom();
    });
  },
  { deep: true }
);

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
      isUsingWebSocket.value = false;
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