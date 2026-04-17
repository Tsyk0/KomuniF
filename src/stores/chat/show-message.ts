// File: src/stores/chat/show-message.ts
import { defineStore } from 'pinia';
import { ref, nextTick } from 'vue';
import type { DisplayMessage } from '@/entity/message';
import type { MessageDetailDTO } from '@/types/dto/message';
import {
  loadConversationHistory,
  loadMessagesAfterBoundary,
  loadMessagesAround,
  loadMessagesBeforeBoundary,
} from '@/capabilities/message';
import { useAuthStore } from '@/stores/auth';
import { useFriendStore } from '@/stores/friend/show-friend';
import { useConversationStore } from '@/stores/chat/show-conversation';
import { displayNameResolver } from '@/capabilities/show-display-name';
import { getRecentMessagesFromDB, saveMessagesToDB, tryGetMessagesAroundFromDB } from '@/utils/local-db';

export const useShowMessageStore = defineStore('message', () => {
  const authStore = useAuthStore();
  const friendStore = useFriendStore();
  const conversationStore = useConversationStore();

  // Current message list
  const messages = ref<DisplayMessage[]>([]);

  // Global loading state
  const loading = ref(false);

  // Whether older history still exists
  const hasMoreHistory = ref(true);

  // History pagination loading flag
  const historyLoading = ref(false);

  /** Anchor view: loading newer page to avoid watch side effects */
  const anchorNewerPaginateLoading = ref(false);

  /** Whether current list is in anchor-view mode (before/after paging) */
  const anchorViewActive = ref(false);
  const canLoadOlderAnchor = ref(true);
  const canLoadNewerAnchor = ref(true);
  const ANCHOR_BOUNDARY_PAGE_SIZE = 50;

  /** Sequence id to discard stale anchor-around responses */
  let anchorAroundRequestSeq = 0;

  const resetAnchorView = () => {
    anchorViewActive.value = false;
    canLoadOlderAnchor.value = true;
    canLoadNewerAnchor.value = true;
    anchorNewerPaginateLoading.value = false;
  };

  const mapDtoToDisplayMessage = (
    msg: MessageDetailDTO,
    currentUserId?: number
  ): DisplayMessage => {
    return {
      messageId: msg.messageId,
      convId: msg.convId,
      senderId: msg.senderId,
      messageType: msg.messageType,
      messageContent: msg.messageContent,
      messageStatus: msg.messageStatus,
      sendTime: msg.sendTime,
      isRecalled: msg.isRecalled,
      replyToMessageId: msg.replyToMessageId,
      atUserIds: msg.atUserIds,
      recallTime: msg.recallTime,
      senderName: resolveSenderName(
        msg.senderId,
        msg.displayName || msg.privateDisplayName || 'User',
        msg.convType,
        msg.memberNickname,
        msg.convId
      ),
      senderAvatar: msg.senderAvatar,
      isSentByMe: currentUserId ? msg.senderId === currentUserId : false
    };
  };

  /**
   * Resolve sender display name.
   * Priority: friend remark > member nickname > user nickname.
   */
  const resolveSenderName = (
    senderId: number,
    defaultName: string,
    _convType?: number,
    memberNickname?: string | null,
    convId?: number
  ): string => {
    const friend = friendStore.friends.find((f) => Number(f.friendId) === Number(senderId));
    let peerNickname = '';
    let peerMemberNickname = (memberNickname || '').trim();
    if (convId) {
      const members = conversationStore.compressedCMMap.get(convId);
      const member = members?.find((m) => Number(m.userId) === Number(senderId));
      if (!peerMemberNickname) {
        peerMemberNickname = (member?.memberNickname || '').trim();
      }
      peerNickname = (member?.userNickname || '').trim();
    }
    return displayNameResolver.messageSender({
      senderId,
      currentUserId: authStore.user?.userId || null,
      currentUserNickname: authStore.user?.userNickname || 'User',
      remarkName: friend?.remarkName || '',
      memberNickname: peerMemberNickname,
      userNickname: friend?.nickname || peerNickname,
      fallbackName: defaultName || 'User',
    });
  };

  /**
   * Resolve sender display name for current friend/member cache.
   * Used by MessageItem so name updates can be reflected instantly.
   */
  const getSenderDisplayName = (message: DisplayMessage): string => {
    const convId = message.convId;
    const convType = conversationStore.currentConversation?.convId === convId
      ? conversationStore.currentConversation?.convType
      : undefined;
    let memberNickname: string | null = null;
    if (convId) {
      const members = conversationStore.compressedCMMap.get(convId);
      const member = members?.find(m => m.userId === message.senderId);
      memberNickname = member?.memberNickname || null;
    }
    return resolveSenderName(
      message.senderId,
      displayNameResolver.person({
        userNickname: message.senderName,
        fallbackName: 'User',
      }),
      convType,
      memberNickname,
      convId
    );
  };

  /**
   * Load messages in initial/latest/history mode.
   */
  const loadMessages = async (
    convId: number,
    loadType: 'initial' | 'latest' | 'history' = 'initial',
    lastMessageId?: number
  ) => {
    if (!convId) return;

    if (loadType === 'initial') {
      resetAnchorView();
      anchorAroundRequestSeq++;
    }

    if (loadType === 'history' && !hasMoreHistory.value) {
      console.log('No more history messages to load');
      return;
    }

    try {
      loading.value = true;
      if (loadType === 'history') {
        historyLoading.value = true;
      }
      console.log(`Start loading messages, convId=${convId}, mode=${loadType}`);

      const currentUserId = authStore.user?.userId;

      // Try local IndexedDB cache first on initial load.
      if (loadType === 'initial') {
        try {
          const cached = await getRecentMessagesFromDB(convId, 200);
          if (cached.length > 0) {
            const cachedDisplay = cached.map(msg =>
              mapDtoToDisplayMessage(msg, currentUserId)
            );
            messages.value = cachedDisplay;
            sortMessagesByTime();
            console.log(`Loaded ${cached.length} messages from local cache`);
          }
        } catch (e) {
          console.warn('Failed to read local message cache:', e);
        }
      }

      // Offline mode: show cache only, skip remote request.
      if (loadType === 'initial' && typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('Offline mode: only local cache messages are shown');
        return;
      }

      const pageSize = 50;

      if (loadType === 'initial') {
        hasMoreHistory.value = true;
      }

      // history uses beforeMessageId; initial/latest loads latest page.
      let messagesData: MessageDetailDTO[] = [];
      if (loadType === 'history' && lastMessageId) {
        messagesData = await loadConversationHistory({
          convId,
          beforeMessageId: lastMessageId,
          pageSize
        });
      } else {
        messagesData = await loadConversationHistory({
          convId,
          pageSize
        });
      }
      console.log(`Fetched ${messagesData.length} messages from server`);

        if (loadType === 'history' && messagesData.length === 0) {
          hasMoreHistory.value = false;
          console.log('Reached history boundary, hasMoreHistory=false');
        }

        const processedMessages = messagesData.map(msg =>
          mapDtoToDisplayMessage(msg, currentUserId)
        );

        if (loadType === 'initial') {
          messages.value = processedMessages;
        } else if (loadType === 'latest') {
          mergeMessages(processedMessages, 'append');
        } else if (loadType === 'history') {
          mergeMessages(processedMessages, 'prepend');
        }

        sortMessagesByTime();

        console.log(`Current message list size: ${messages.value.length}`);

        // Persist current fetched page into IndexedDB.
        try {
          await saveMessagesToDB(messagesData);
          console.log(`Saved ${messagesData.length} messages to local cache`);
        } catch (e) {
          console.warn('Failed to save messages to local cache:', e);
        }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      loading.value = false;
      // Delay historyLoading reset to avoid watch-triggered auto-scroll.
      if (loadType === 'history') {
        void nextTick(() => {
          historyLoading.value = false;
        });
      } else {
        historyLoading.value = false;
      }
    }
  };

  /**
   * Add a single message with deduplication.
   */
  const addMessage = (message: DisplayMessage) => {
    const currentUserId = authStore.user?.userId;
    if (currentUserId) {
      message.isSentByMe = message.senderId === currentUserId;
    }

    const exists = messages.value.some(
      msg => msg.messageId === message.messageId
    );

    if (!exists) {
      messages.value.push(message);
      console.log('[show-message] Added new message to store:', message);
      sortMessagesByTime();
      return true;
    }

    console.log('[show-message] Message already exists, skip:', message.messageId);
    return false;
  };

  /**
   * Batch add messages.
   */
  const addMessages = (newMessages: DisplayMessage[]) => {
    const currentUserId = authStore.user?.userId;

    newMessages.forEach(msg => {
      if (currentUserId) {
        msg.isSentByMe = msg.senderId === currentUserId;
      }

      const exists = messages.value.some(
        existingMsg => existingMsg.messageId === msg.messageId
      );

      if (!exists) {
        messages.value.push(msg);
      }
    });

    sortMessagesByTime();
    console.log(`[show-message] Batch added ${newMessages.length} messages`);
  };

  /**
   * Replace temporary message with server message.
   */
  const replaceTempMessage = (tempMessageId: number, serverMessage: DisplayMessage) => {
    const index = messages.value.findIndex(msg => msg.messageId === tempMessageId);

    if (index !== -1) {
      const currentUserId = authStore.user?.userId;
      if (currentUserId) {
        serverMessage.isSentByMe = serverMessage.senderId === currentUserId;
      }

      messages.value[index] = serverMessage;
      console.log(`[show-message] Replaced temp message ${tempMessageId} with:`, serverMessage.messageId);
      sortMessagesByTime();
      return true;
    } else {
      console.log(`[show-message] Temp message ${tempMessageId} not found, append server message directly`);
      return addMessage(serverMessage);
    }
  };

  /**
   * Update message status.
   */
  const updateMessageStatus = (messageId: number, status: number) => {
    const index = messages.value.findIndex(msg => msg.messageId === messageId);
    if (index !== -1) {
      messages.value[index].messageStatus = status;
      console.log(`[show-message] Updated message ${messageId} status to: ${status}`);
      return true;
    }
    return false;
  };

  /**
   * Merge messages by append/prepend mode.
   */
  const mergeMessages = (newMessages: DisplayMessage[], position: 'append' | 'prepend' = 'append') => {
    const currentUserId = authStore.user?.userId;

    const processedMessages = newMessages.map(msg => ({
      ...msg,
      isSentByMe: currentUserId ? msg.senderId === currentUserId : false
    }));

    const uniqueMessages = processedMessages.filter(newMsg =>
      !messages.value.some(existingMsg =>
        existingMsg.messageId === newMsg.messageId
      )
    );

    if (uniqueMessages.length === 0) {
      console.log('[show-message] No new messages to merge');
      return;
    }

    if (position === 'append') {
      messages.value = [...messages.value, ...uniqueMessages];
    } else {
      messages.value = [...uniqueMessages, ...messages.value];
    }

    console.log(`[show-message] Merged ${uniqueMessages.length} new messages`);
  };

  /**
   * Sort messages by send time ascending.
   */
  const sortMessagesByTime = () => {
    const arr = messages.value;
    if (arr.length <= 1) return;
    messages.value = [...arr].sort((a, b) => {
      const timeA = new Date(a.sendTime).getTime();
      const timeB = new Date(b.sendTime).getTime();
      return timeA - timeB;
    });
  };

  /**
   * Get latest message.
   */
  const getLatestMessage = () => {
    if (messages.value.length === 0) return null;
    return messages.value[messages.value.length - 1];
  };

  /**
   * Get oldest message.
   */
  const getOldestMessage = () => {
    if (messages.value.length === 0) return null;
    return messages.value[0];
  };

  /**
   * Clear message list.
   */
  const clearMessages = () => {
    messages.value = [];
    resetAnchorView();
    anchorAroundRequestSeq++;
    console.log('[show-message] Cleared message list');
  };

  /**
   * Reset message state.
   */
  const resetMessages = () => {
    console.log('Reset message state');
    clearMessages();
    hasMoreHistory.value = true;
  };

  /**
   * GET /messages/{anchorMessageId}/around:
   * jump to anchor and show surrounding context.
   */
  const loadMessagesAroundAnchor = async (
    anchorMessageId: number,
    windowSize = 25,
    convId?: number | null
  ) => {
    const seq = ++anchorAroundRequestSeq;
    loading.value = true;

    try {
      const expectedConvId =
        convId || conversationStore.currentConversation?.convId || null;

      let raw: MessageDetailDTO[] = [];

      if (expectedConvId != null) {
        const localSlice = await tryGetMessagesAroundFromDB(
          expectedConvId,
          anchorMessageId,
          windowSize
        );
        if (seq !== anchorAroundRequestSeq) return;
        if (localSlice && localSlice.length > 0) {
          raw = localSlice;
        }
      }

      if (raw.length === 0) {
        const around = await loadMessagesAround(anchorMessageId, windowSize);
        if (seq !== anchorAroundRequestSeq) return;
        raw = (around?.messages || []) as MessageDetailDTO[];
      }

      if (seq !== anchorAroundRequestSeq) return;

      anchorViewActive.value = true;
      canLoadOlderAnchor.value = true;
      canLoadNewerAnchor.value = true;
      hasMoreHistory.value = true;

      const currentUserId = authStore.user?.userId;
      messages.value = raw.map(msg => mapDtoToDisplayMessage(msg, currentUserId));
      sortMessagesByTime();
      try {
        await saveMessagesToDB(raw);
      } catch (e) {
        console.warn('Failed to save anchor window messages to local cache:', e);
      }
    } catch (e) {
      if (seq === anchorAroundRequestSeq) {
        resetAnchorView();
        throw e;
      }
    } finally {
      if (seq === anchorAroundRequestSeq) {
        loading.value = false;
      }
    }
  };

  /**
   * Anchor view: load older messages before current oldest messageId.
   */
  const loadOlderMessagesBeforeBoundary = async (boundaryMessageId: number) => {
    if (!anchorViewActive.value || !canLoadOlderAnchor.value) return;
    if (historyLoading.value) return;

    historyLoading.value = true;
    try {
      const responseData = await loadMessagesBeforeBoundary(
        boundaryMessageId,
        ANCHOR_BOUNDARY_PAGE_SIZE
      );
      const raw = (responseData?.messages || []) as MessageDetailDTO[];
      const pageSize = responseData?.pageSize || ANCHOR_BOUNDARY_PAGE_SIZE;
      const total = responseData?.total || raw.length;
      if (total < pageSize) {
        canLoadOlderAnchor.value = false;
      }
      const currentUserId = authStore.user?.userId;
      const processed = raw.map(msg => mapDtoToDisplayMessage(msg, currentUserId));
      mergeMessages(processed, 'prepend');
      sortMessagesByTime();
      try {
        await saveMessagesToDB(raw);
      } catch (err) {
        console.warn('Failed to save before-page messages to local cache:', err);
      }
      if (raw.length === 0) {
        canLoadOlderAnchor.value = false;
      }
    } finally {
      void nextTick(() => {
        historyLoading.value = false;
      });
    }
  };

  /**
   * Anchor view: load newer messages after current newest messageId.
   */
  const loadNewerMessagesAfterBoundary = async (boundaryMessageId: number) => {
    if (!anchorViewActive.value || !canLoadNewerAnchor.value) return;

    anchorNewerPaginateLoading.value = true;
    try {
      const responseData = await loadMessagesAfterBoundary(
        boundaryMessageId,
        ANCHOR_BOUNDARY_PAGE_SIZE
      );
      const raw = (responseData?.messages || []) as MessageDetailDTO[];
      const pageSize = responseData?.pageSize || ANCHOR_BOUNDARY_PAGE_SIZE;
      const total = responseData?.total || raw.length;
      if (total < pageSize) {
        canLoadNewerAnchor.value = false;
      }
      const currentUserId = authStore.user?.userId;
      const processed = raw.map(msg => mapDtoToDisplayMessage(msg, currentUserId));
      mergeMessages(processed, 'append');
      sortMessagesByTime();
      try {
        await saveMessagesToDB(raw);
      } catch (err) {
        console.warn('Failed to save after-page messages to local cache:', err);
      }
      if (raw.length === 0) {
        canLoadNewerAnchor.value = false;
      }
    } catch (e) {
      console.error('Failed to load after-page messages:', e);
    } finally {
      void nextTick(() => {
        anchorNewerPaginateLoading.value = false;
      });
    }
  };

  return {
    // state
    messages,
    loading,
    hasMoreHistory,
    historyLoading,
    anchorNewerPaginateLoading,
    anchorViewActive,
    canLoadOlderAnchor,
    canLoadNewerAnchor,

    // actions
    loadMessages,
    loadMessagesAroundAnchor,
    loadOlderMessagesBeforeBoundary,
    loadNewerMessagesAfterBoundary,
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
