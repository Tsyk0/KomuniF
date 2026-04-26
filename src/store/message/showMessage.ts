// src/store/message/showMessage.ts
import { defineStore } from "pinia";
import { nextTick, ref } from "vue";
import type { DisplayMessage } from "@/entity/message";
import type { MessageSummaryDTO } from "@/types/dto/message";
import { useUserStore } from "@/store/user/user";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConvStore } from "@/store/conv/conv";
import {
  loadConversationHistoryNormalized,
  loadMessagesAfterBoundaryNormalized,
  loadMessagesAroundNormalized,
  loadMessagesBeforeBoundaryNormalized,
  mapMessageSummaryToDisplayMessage,
  mergeDisplayMessages,
  normalizeDisplayMessageSenderFlag,
  resolveMessageSenderDisplayName,
  searchMessagesNormalized,
  sortDisplayMessagesBySendTime,
  type MessageNameResolveContext,
} from "@/normalize/message";
import {
  getRecentMessagesFromDB,
  saveMessagesToDB,
  tryGetMessagesAroundFromDB,
} from "@/commons/utils/local-db";

type LoadType = "initial" | "latest" | "history";

export const useShowMessageStore = defineStore("message", () => {
  const authStore = useUserStore();
  const friendStore = useFriendStore();
  const convStore = useConvStore();

  const messages = ref<DisplayMessage[]>([]);
  const loading = ref(false);
  const hasMoreHistory = ref(true);
  const historyLoading = ref(false);
  const anchorNewerPaginateLoading = ref(false);
  const anchorViewActive = ref(false);
  const canLoadOlderAnchor = ref(true);
  const canLoadNewerAnchor = ref(true);

  const ANCHOR_BOUNDARY_PAGE_SIZE = 50;
  let anchorAroundRequestSeq = 0;

  /**
   * 组装显示名解析上下文（当前用户、好友缓存、会话成员缓存）。
   * 供 normalize mapper 统一计算 senderName。
   */
  const buildNameContext = (): MessageNameResolveContext => ({
    currentUserId: authStore.user?.userId || null,
    currentUserNickname: authStore.user?.userNickname || "User",
    friends: friendStore.friends,
    membersByConvId: convStore.compressedCMMap,
  });

  /** 单条 DTO -> DisplayMessage 映射。 */
  const mapSummary = (item: MessageSummaryDTO): DisplayMessage =>
    mapMessageSummaryToDisplayMessage(item, buildNameContext());

  /** 批量 DTO 映射。 */
  const mapSummaryList = (list: MessageSummaryDTO[]): DisplayMessage[] =>
    list.map(mapSummary);

  /** 重置锚点分页状态。切会话/清空消息时调用。 */
  const resetAnchorView = () => {
    anchorViewActive.value = false;
    canLoadOlderAnchor.value = true;
    canLoadNewerAnchor.value = true;
    anchorNewerPaginateLoading.value = false;
  };

  /** 保证消息列表按发送时间升序。 */
  const sortMessagesByTime = () => {
    messages.value = sortDisplayMessagesBySendTime(messages.value);
  };

  /** 暴露给组件的发送者显示名解析入口。 */
  const resolveSenderName = (
    senderId: number,
    defaultName: string,
    convType?: number,
    memberNickname?: string | null,
    convId?: number
  ): string =>
    resolveMessageSenderDisplayName(
      senderId,
      defaultName,
      buildNameContext(),
      convType,
      memberNickname,
      convId
    );

  /** 在 MessageItem 渲染时按最新缓存重新计算显示名。 */
  const getSenderDisplayName = (message: DisplayMessage): string => {
    const convId = message.convId;
    let memberNickname: string | null = null;
    if (convId) {
      const members = convStore.compressedCMMap.get(convId);
      const member = members?.find((item) => item.userId === message.senderId);
      memberNickname = member?.memberNickname || null;
    }
    return resolveSenderName(
      message.senderId,
      message.senderName || "User",
      undefined,
      memberNickname,
      convId
    );
  };

  /** 合并消息并去重，支持 prepend/append。 */
  const mergeMessages = (
    newMessages: DisplayMessage[],
    position: "append" | "prepend" = "append"
  ) => {
    const merged = mergeDisplayMessages(
      messages.value,
      newMessages,
      position,
      authStore.user?.userId || null
    );
    if (merged !== messages.value) {
      messages.value = merged;
    }
  };

  /** 添加单条消息（含去重与 isSentByMe 规范化）。 */
  const addMessage = (message: DisplayMessage) => {
    const normalized = normalizeDisplayMessageSenderFlag(
      message,
      authStore.user?.userId || null
    );
    if (messages.value.some((item) => item.messageId === normalized.messageId)) {
      return false;
    }
    messages.value.push(normalized);
    sortMessagesByTime();
    return true;
  };

  /** 批量追加消息。 */
  const addMessages = (newMessages: DisplayMessage[]) => {
    mergeMessages(newMessages, "append");
    sortMessagesByTime();
  };

  /**
   * 用服务端确认后的消息替换本地临时消息。
   * 常用于发送成功回执后将临时 ID 替换为真实 messageId。
   */
  const replaceTempMessage = (tempMessageId: number, serverMessage: DisplayMessage) => {
    const index = messages.value.findIndex((item) => item.messageId === tempMessageId);
    if (index < 0) return addMessage(serverMessage);

    messages.value[index] = normalizeDisplayMessageSenderFlag(
      serverMessage,
      authStore.user?.userId || null
    );
    sortMessagesByTime();
    return true;
  };

  /** 更新单条消息状态（发送中/失败/已发送等）。 */
  const updateMessageStatus = (messageId: number, status: number) => {
    const index = messages.value.findIndex((item) => item.messageId === messageId);
    if (index < 0) return false;
    messages.value[index].messageStatus = status;
    return true;
  };

  /**
   * 获取当前列表中“最新一条”消息。
   * 用于底部分页（after 边界加载）时提供 boundaryMessageId。
   */
  const getLatestMessage = () => {
    if (messages.value.length === 0) return null;
    return messages.value[messages.value.length - 1];
  };

  /**
   * 获取当前列表中“最旧一条”消息。
   * 用于顶部分页（before 边界加载）时提供 boundaryMessageId。
   */
  const getOldestMessage = () => {
    if (messages.value.length === 0) return null;
    return messages.value[0];
  };

  /** 清空消息列表并重置锚点状态。 */
  const clearMessages = () => {
    messages.value = [];
    resetAnchorView();
    anchorAroundRequestSeq++;
  };

  /** 清空消息状态（如登出/会话重置场景）。 */
  const resetMessages = () => {
    clearMessages();
    hasMoreHistory.value = true;
  };

  /**
   * 加载消息主入口：
   * - initial：首屏（含本地缓存预读）
   * - history：向上翻页
   * - latest：向下追加
   */
  const loadMessages = async (
    convId: number,
    loadType: LoadType = "initial",
    lastMessageId?: number
  ) => {
    if (!convId) return;

    if (loadType === "initial") {
      resetAnchorView();
      anchorAroundRequestSeq++;
      hasMoreHistory.value = true;
    }

    if (loadType === "history" && !hasMoreHistory.value) return;

    try {
      loading.value = true;
      if (loadType === "history") {
        historyLoading.value = true;
      }

      if (loadType === "initial") {
        try {
          const cached = await getRecentMessagesFromDB(convId, 200);
          if (cached.length > 0) {
            messages.value = mapSummaryList(cached);
            sortMessagesByTime();
          }
        } catch {
          // ignore local cache read error
        }
      }

      if (
        loadType === "initial" &&
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        return;
      }

      const pageSize = 50;
      const remote = await loadConversationHistoryNormalized(
        loadType === "history" && lastMessageId
          ? { convId, beforeMessageId: lastMessageId, pageSize }
          : { convId, pageSize }
      );

      if (loadType === "history" && remote.length === 0) {
        hasMoreHistory.value = false;
      }

      const displayMessages = mapSummaryList(remote);
      if (loadType === "initial") {
        messages.value = displayMessages;
      } else if (loadType === "latest") {
        mergeMessages(displayMessages, "append");
      } else {
        mergeMessages(displayMessages, "prepend");
      }
      sortMessagesByTime();

      try {
        await saveMessagesToDB(remote);
      } catch {
        // ignore local cache write error
      }
    } finally {
      loading.value = false;
      if (loadType === "history") {
        void nextTick(() => {
          historyLoading.value = false;
        });
      } else {
        historyLoading.value = false;
      }
    }
  };

  /**
   * 以锚点消息为中心加载窗口，并切换到锚点模式。
   * 优先使用本地缓存，缺失时请求远端。
   */
  const loadMessagesAroundAnchor = async (
    anchorMessageId: number,
    windowSize = 25,
    convId?: number | null
  ) => {
    const seq = ++anchorAroundRequestSeq;
    loading.value = true;
    try {
      const expectedConvId = convId || convStore.currentConversation?.convId || null;
      let raw: MessageSummaryDTO[] = [];

      if (expectedConvId != null) {
        const local = await tryGetMessagesAroundFromDB(
          expectedConvId,
          anchorMessageId,
          windowSize
        );
        if (seq !== anchorAroundRequestSeq) return;
        if (local && local.length > 0) {
          raw = local;
        }
      }

      if (raw.length === 0) {
        const around = await loadMessagesAroundNormalized(anchorMessageId, windowSize);
        if (seq !== anchorAroundRequestSeq) return;
        raw = around.messages || [];
      }

      if (seq !== anchorAroundRequestSeq) return;

      anchorViewActive.value = true;
      canLoadOlderAnchor.value = true;
      canLoadNewerAnchor.value = true;
      hasMoreHistory.value = true;

      messages.value = mapSummaryList(raw);
      sortMessagesByTime();

      try {
        await saveMessagesToDB(raw);
      } catch {
        // ignore
      }
    } finally {
      if (seq === anchorAroundRequestSeq) {
        loading.value = false;
      }
    }
  };

  /** 锚点模式：加载 boundary 之前的更旧消息。 */
  const loadOlderMessagesBeforeBoundary = async (boundaryMessageId: number) => {
    if (!anchorViewActive.value || !canLoadOlderAnchor.value || historyLoading.value) {
      return;
    }

    historyLoading.value = true;
    try {
      const response = await loadMessagesBeforeBoundaryNormalized(
        boundaryMessageId,
        ANCHOR_BOUNDARY_PAGE_SIZE
      );
      const raw = response.messages || [];
      if (response.total < response.pageSize) {
        canLoadOlderAnchor.value = false;
      }
      if (raw.length === 0) {
        canLoadOlderAnchor.value = false;
      }

      mergeMessages(mapSummaryList(raw), "prepend");
      sortMessagesByTime();

      try {
        await saveMessagesToDB(raw);
      } catch {
        // ignore
      }
    } finally {
      void nextTick(() => {
        historyLoading.value = false;
      });
    }
  };

  /** 锚点模式：加载 boundary 之后的更新消息。 */
  const loadNewerMessagesAfterBoundary = async (boundaryMessageId: number) => {
    if (!anchorViewActive.value || !canLoadNewerAnchor.value) return;

    anchorNewerPaginateLoading.value = true;
    try {
      const response = await loadMessagesAfterBoundaryNormalized(
        boundaryMessageId,
        ANCHOR_BOUNDARY_PAGE_SIZE
      );
      const raw = response.messages || [];
      if (response.total < response.pageSize) {
        canLoadNewerAnchor.value = false;
      }
      if (raw.length === 0) {
        canLoadNewerAnchor.value = false;
      }

      mergeMessages(mapSummaryList(raw), "append");
      sortMessagesByTime();

      try {
        await saveMessagesToDB(raw);
      } catch {
        // ignore
      }
    } finally {
      void nextTick(() => {
        anchorNewerPaginateLoading.value = false;
      });
    }
  };

  /**
   * 按会话搜索消息（远端）。
   * 使用场景：ChatSearchPanel 通过 store 统一触发消息搜索，避免组件直连 normalize。
   */
  const searchMessages = (
    params: { keyword: string; convId: number; page: number; pageSize: number },
    config?: { signal?: AbortSignal }
  ) => searchMessagesNormalized(params, config);

  return {
    messages,
    loading,
    hasMoreHistory,
    historyLoading,
    anchorNewerPaginateLoading,
    anchorViewActive,
    canLoadOlderAnchor,
    canLoadNewerAnchor,

    loadMessages,
    loadMessagesAroundAnchor,
    loadOlderMessagesBeforeBoundary,
    loadNewerMessagesAfterBoundary,
    searchMessages,
    addMessage,
    addMessages,
    replaceTempMessage,
    updateMessageStatus,
    mergeMessages,
    getLatestMessage,
    getOldestMessage,
    clearMessages,
    resetMessages,
    resolveSenderName,
    getSenderDisplayName,
  };
});
