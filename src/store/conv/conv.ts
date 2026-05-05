import { defineStore } from "pinia";
import type {
  ConversationSummaryDTO,
  MessageDisplayMemberDTO,
} from "@/types/dto/conversation";
import {
  loadConversationsNormalized,
  loadConversationMembersNormalized,
} from "@/normalize/conversation";
import { normalizeConversationSummary } from "@/normalize/conversation/load/convLoadMapper";
import { realtimeEventBus } from "@/realtime/websocket";
import { conversationReadApi } from "@/apis/chat/conversation-read";
import {
  mapRealtimePayloadToLastMessageInfo,
  mapDisplayMessageToLastMessageInfo,
} from "@/normalize/message/realtime/messageRealtimeMapper";
import type { DisplayMessage } from "@/entity/message";
import { useUserStore } from "@/store/user/user";
import { useFriendStore } from "@/store/friend/showFriend";
import { MemberRole } from "@/entity/conversation-member";

interface ConversationUnreadRuntimeState {
  /** 会话列表接口返回的未读基准值。 */
  baseUnreadCount: number;
  /** 在线期间前端本地累计的未读增量。 */
  localIncrement: number;
  /** 后端已同步的最后已读游标。 */
  lastReadMessageId: number;
  /** 前端待同步到后端的已读游标。 */
  pendingLastReadMessageId: number;
}

export const useConvStore = defineStore("conv", {
  state: () => ({
    conversations: [] as ConversationSummaryDTO[],
    currentConversation: null as ConversationSummaryDTO | null,
    compressedCMMap: new Map<number, MessageDisplayMemberDTO[]>(),
    conversationMap: new Map<number, ConversationSummaryDTO>(),
    unreadRuntimeMap: new Map<number, ConversationUnreadRuntimeState>(),
  }),

  getters: {
    totalUnreadCount: (state): number =>
      state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0),
  },

  actions: {
    setConversations(conversations: ConversationSummaryDTO[]) {
      this.conversations = conversations;
      this.rebuildConversationMap();
      this.rebuildUnreadRuntimeStateFromConversations();
    },

    /**
     * 基于会话摘要重建本地未读运行态（基准值 + 本地增量 + 游标）。
     * 使用场景：登录首屏拉取/WS 断线重连后重拉会话列表时，重置本地增量并对齐后端口径。
     */
    rebuildUnreadRuntimeStateFromConversations() {
      this.unreadRuntimeMap.clear();
      this.conversations.forEach((conv) => {
        const baseUnreadCount = Math.max(0, Number(conv.unreadCount || 0));
        const lastReadMessageId = Math.max(0, Number(conv.lastReadMessageId || 0));
        this.unreadRuntimeMap.set(conv.convId, {
          baseUnreadCount,
          localIncrement: 0,
          lastReadMessageId,
          pendingLastReadMessageId: lastReadMessageId,
        });
      });
    },

    rebuildConversationMap() {
      this.conversationMap.clear();
      this.conversations.forEach((item) => {
        this.conversationMap.set(item.convId, item);
      });
    },

    async loadConversations() {
      this.setConversations(await loadConversationsNormalized());
    },

    async refreshConversationById(convId: number) {
      const list = await loadConversationsNormalized(convId);
      const updated = list.find((item) => item.convId === convId);
      if (!updated) return;

      const index = this.conversations.findIndex((item) => item.convId === convId);
      if (index >= 0) {
        this.conversations.splice(index, 1, updated);
      } else {
        this.conversations.unshift(updated);
      }
      this.conversationMap.set(convId, updated);
      const runtime = this.getOrCreateUnreadRuntime(convId);
      runtime.baseUnreadCount = Math.max(0, Number(updated.unreadCount || 0));
      runtime.localIncrement = 0;
      runtime.lastReadMessageId = Math.max(0, Number(updated.lastReadMessageId || 0));
      runtime.pendingLastReadMessageId = runtime.lastReadMessageId;

      if (this.currentConversation?.convId === convId) {
        this.currentConversation = updated;
      }
    },

    selectConversation(convId: number | null) {
      const previousConvId = this.currentConversation?.convId ?? null;
      if (previousConvId && previousConvId !== convId) {
        void this.notifyConversationExited(previousConvId);
      }
      if (convId == null) {
        this.currentConversation = null;
        return;
      }
      this.currentConversation =
        this.conversations.find((item) => item.convId === convId) || null;
      this.notifyConversationEntered(convId);
      if (this.currentConversation?.convType === 2) {
        void this.loadCompressedCM(convId);
      }
    },

    markConversationRead(convId: number) {
      const runtime = this.getOrCreateUnreadRuntime(convId);
      runtime.baseUnreadCount = 0;
      runtime.localIncrement = 0;
      const conv = this.conversationMap.get(convId);
      const fallbackLastMessageId = Math.max(0, Number(conv?.lastMessage?.messageId || 0));
      runtime.pendingLastReadMessageId = Math.max(
        runtime.pendingLastReadMessageId,
        fallbackLastMessageId
      );
      this.patchConversationLocal(convId, {
        unreadCount: 0,
      });
    },

    /**
     * 标记“用户进入会话”，并立即清空该会话本地未读展示。
     * 使用场景：点击会话项进入聊天页时，红点无需等待后端接口即可立即消失。
     */
    notifyConversationEntered(convId: number) {
      this.markConversationRead(convId);
    },

    /**
     * 记录当前会话内最新已读消息游标（仅前进）。
     * 使用场景：会话内收到新消息或加载消息后，用最大 messageId 更新待同步游标。
     */
    trackConversationReadProgress(convId: number, messageId: number) {
      const normalizedMessageId = Number(messageId);
      if (!Number.isFinite(normalizedMessageId) || normalizedMessageId <= 0) return;
      const runtime = this.getOrCreateUnreadRuntime(convId);
      runtime.pendingLastReadMessageId = Math.max(
        runtime.pendingLastReadMessageId,
        normalizedMessageId
      );
    },

    /**
     * 处理新消息到达时的未读计数变更（当前会话不加未读，非当前会话本地增量 +1）。
     * 使用场景：WS `newMessage` 到达后，前端本地实时维护红点，不频繁请求后端。
     */
    applyUnreadDeltaFromRealtimePayload(payload: Record<string, unknown>) {
      const raw = payload as Record<string, any>;
      const convId = Number(raw.convId ?? raw.data?.convId ?? raw.message?.convId);
      const messageId = Number(raw.messageId ?? raw.data?.messageId ?? raw.message?.messageId);
      if (!Number.isFinite(convId) || convId <= 0) return;

      const runtime = this.getOrCreateUnreadRuntime(convId);
      if (this.currentConversation?.convId === convId) {
        this.trackConversationReadProgress(convId, messageId);
        this.patchConversationLocal(convId, { unreadCount: 0 });
        return;
      }

      if (
        Number.isFinite(messageId) &&
        messageId > 0 &&
        messageId <= runtime.lastReadMessageId
      ) {
        return;
      }

      runtime.localIncrement += 1;
      this.patchConversationLocal(convId, {
        unreadCount: runtime.baseUnreadCount + runtime.localIncrement,
      });
    },

    /**
     * 退出会话时同步该会话已读游标（仅当 pending > lastRead 时调用后端）。
     * 使用场景：切会话/关闭详情页前保存当前位置，保证下次登录未读数正确。
     */
    async notifyConversationExited(convId: number) {
      await this.flushConversationReadProgress(convId);
    },

    /**
     * 同步指定会话的已读游标到后端；成功后推进 lastRead 并清空本地增量。
     * 使用场景：会话退出路径、显式兜底同步前的单会话提交。
     */
    async flushConversationReadProgress(convId: number): Promise<void> {
      const runtime = this.unreadRuntimeMap.get(convId);
      if (!runtime) return;
      if (runtime.pendingLastReadMessageId <= runtime.lastReadMessageId) return;
      const nextReadId = runtime.pendingLastReadMessageId;
      await conversationReadApi.markConversationRead(convId, {
        lastReadMessageId: nextReadId,
      });
      runtime.lastReadMessageId = nextReadId;
      runtime.baseUnreadCount = 0;
      runtime.localIncrement = 0;
      this.patchConversationLocal(convId, {
        unreadCount: 0,
        lastReadMessageId: nextReadId,
      });
    },

    /**
     * 页面关闭/刷新阶段批量兜底同步所有待提交已读游标。
     * 使用场景：beforeunload/pagehide 触发时尽力保留已读进度。
     */
    flushAllPendingReadProgressOnPageUnload() {
      this.unreadRuntimeMap.forEach((runtime, convId) => {
        if (runtime.pendingLastReadMessageId <= runtime.lastReadMessageId) return;
        const nextReadId = runtime.pendingLastReadMessageId;
        const sent = conversationReadApi.sendMarkConversationReadBeacon(convId, {
          lastReadMessageId: nextReadId,
        });
        if (!sent) return;
        runtime.lastReadMessageId = nextReadId;
        runtime.baseUnreadCount = 0;
        runtime.localIncrement = 0;
      });
    },

    /**
     * 获取会话未读运行态；不存在时按当前摘要值构造默认态。
     * 使用场景：WS 新消息、进入会话、退出上报等统一读取/更新本地计数状态。
     */
    getOrCreateUnreadRuntime(convId: number): ConversationUnreadRuntimeState {
      const existing = this.unreadRuntimeMap.get(convId);
      if (existing) return existing;
      const conv = this.conversationMap.get(convId);
      const baseUnreadCount = Math.max(0, Number(conv?.unreadCount || 0));
      const lastReadMessageId = Math.max(0, Number(conv?.lastReadMessageId || 0));
      const created: ConversationUnreadRuntimeState = {
        baseUnreadCount,
        localIncrement: 0,
        lastReadMessageId,
        pendingLastReadMessageId: lastReadMessageId,
      };
      this.unreadRuntimeMap.set(convId, created);
      return created;
    },

    getConversationById(convId: number): ConversationSummaryDTO | undefined {
      return this.conversationMap.get(convId);
    },

    /**
     * 本人发送且本地回显成功后，立即把该条写入会话摘要的 `lastMessage` 与 `updateTime`。
     * 使用场景：`ChatContainer` 在 WS 文本/附件发送成功或秒传仅回显后，刷新侧栏 `ConversationItem` 预览与排序。
     */
    syncConversationLastMessageFromSentDisplay(convId: number, displayMessage: DisplayMessage) {
      if (!Number.isFinite(convId) || convId <= 0) return;
      if (!this.conversationMap.has(convId)) return;
      const lastMessage = mapDisplayMessageToLastMessageInfo(displayMessage);
      this.patchConversationLocal(convId, {
        lastMessage,
        updateTime: lastMessage.sendTime,
      });
    },

    /**
     * 当会话最后一条消息被撤回时，回写会话摘要里的 lastMessage 预览。
     * 使用场景：收到 messageRecalled 广播后，同步刷新 ConversationItem 与 Pinia 中的最后一条文案。
     */
    applyConversationLastMessageRecall(input: {
      convId: number;
      messageId: number;
      placeholderText: string;
      recallTime?: string | null;
      senderId?: number;
      originalMessageContent?: string | null;
      originalSendTime?: string | null;
    }) {
      const convId = Number(input.convId);
      const messageId = Number(input.messageId);
      if (!Number.isFinite(convId) || convId <= 0) return;
      if (!Number.isFinite(messageId) || messageId <= 0) return;
      const current = this.conversationMap.get(convId);
      if (!current?.lastMessage) return;
      const idMatched = Number(current.lastMessage.messageId) === messageId;
      const senderMatched =
        Number(input.senderId) > 0 &&
        Number(current.lastMessage.senderId) === Number(input.senderId);
      const contentMatched =
        typeof input.originalMessageContent === "string" &&
        input.originalMessageContent.length > 0 &&
        String(current.lastMessage.messageContent || "") ===
          String(input.originalMessageContent);
      const currentSendTimeMs = Date.parse(current.lastMessage.sendTime || "");
      const originalSendTimeMs = Date.parse(input.originalSendTime || "");
      const timeLikelyMatched =
        Number.isFinite(currentSendTimeMs) &&
        Number.isFinite(originalSendTimeMs) &&
        Math.abs(currentSendTimeMs - originalSendTimeMs) <= 120000;
      const fallbackMatched = senderMatched && contentMatched && timeLikelyMatched;
      if (!idMatched && !fallbackMatched) return;

      const patchedLastMessage = {
        ...current.lastMessage,
        messageId,
        messageType: "system",
        messageContent: input.placeholderText,
      };
      this.patchConversationLocal(convId, {
        lastMessage: patchedLastMessage,
        updateTime:
          (input.recallTime || "").trim() || current.updateTime || patchedLastMessage.sendTime,
      });
    },

    /**
     * 根据 WebSocket `newMessage` 推送更新该会话在列表中的「最后一条」与 `updateTime`，触发侧栏排序与预览刷新。
     * 使用场景：`realtimeEventBus` 收到 `newMessage` 且该 `convId` 已在本地会话列表中存在时（未在列表中的会话忽略）。
     */
    applyLastMessageFromRealtimePayload(payload: Record<string, unknown>) {
      const action = String(payload.action || "");
      if (action && action !== "newMessage") return;

      const raw = payload as Record<string, any>;
      const convId = Number(raw.convId);
      if (!Number.isFinite(convId) || convId <= 0) return;
      if (!this.conversationMap.has(convId)) return;

      const authStore = useUserStore();
      /** 当前登录用户 ID；用于解析「我」与本人头像，以及单聊好友名补全。 */
      const currentUserId = authStore.user?.userId;
      if (currentUserId == null) return;

      const friendStore = useFriendStore();
      /** 群成员缓存；单聊常为空，此时依赖好友列表补全发送者展示名。 */
      const conversationMembers = this.compressedCMMap.get(convId) || [];

      const mappedLast = mapRealtimePayloadToLastMessageInfo(raw, {
        currentUserId,
        currentUserAvatar: authStore.user?.userAvatar ?? null,
        conversationMembers,
      });
      if (!mappedLast) return;

      /** 经单聊好友名补全后的最后一条摘要；用于写入 patch，避免闭包内对可空变量的误判。 */
      let lastMessageForPatch = mappedLast;

      const conv = this.conversationMap.get(convId);
      if (
        conv &&
        Number(conv.convType) === 1 &&
        Number(lastMessageForPatch.senderId) !== Number(currentUserId)
      ) {
        const senderId = lastMessageForPatch.senderId;
        const friend = friendStore.friends.find((f) => Number(f.friendId) === Number(senderId));
        if (friend) {
          const fromFriend =
            (friend.displayName || "").trim() || (friend.nickname || "").trim();
          if (fromFriend) {
            lastMessageForPatch = { ...lastMessageForPatch, senderDisplayName: fromFriend };
          }
        }
      }

      this.patchConversationLocal(convId, {
        lastMessage: lastMessageForPatch,
        updateTime: lastMessageForPatch.sendTime,
      });
    },

    /**
     * 本地补丁更新会话摘要并保持 currentConversation 响应式同步。
     * 使用场景：会话属性编辑成功后立即反映在列表与当前会话头部，无需等待整页重载。
     */
    patchConversationLocal(convId: number, patch: Partial<ConversationSummaryDTO>) {
      const current = this.conversationMap.get(convId);
      if (!current) return;
      /**
       * 本地补丁后再次做会话归一化。
       * 作用场景：privateDisplayName 变更时，立即重算 convName（显示名）并驱动依赖视图实时更新。
       */
      const merged = normalizeConversationSummary({ ...current, ...patch });
      const index = this.conversations.findIndex((item) => item.convId === convId);
      if (index >= 0) {
        this.conversations.splice(index, 1, merged);
      }
      this.conversationMap.set(convId, merged);
      if (this.currentConversation?.convId === convId) {
        this.currentConversation = merged;
      }
    },

    /**
     * 本地补丁更新群成员展示缓存中的昵称字段。
     * 使用场景：用户在群聊资料中修改“我的本群昵称”后，消息列表等依赖成员缓存的区域立即响应。
     */
    patchConversationMemberNicknameLocal(
      convId: number,
      userId: number,
      memberNickname: string | null
    ) {
      const currentMembers = this.compressedCMMap.get(convId);
      if (!currentMembers || currentMembers.length === 0) return;
      /** 昵称补丁后的新成员数组；用于触发依赖 compressedCMMap 的视图更新。 */
      const patchedMembers = currentMembers.map((member) =>
        Number(member.userId) === Number(userId)
          ? { ...member, memberNickname }
          : member
      );
      this.compressedCMMap.set(convId, patchedMembers);
    },

    /**
     * 本地补丁更新群成员展示缓存中的禁言等 memberStatus。
     * 使用场景：群主禁言/解禁、WS 广播后同步消息区与资料页依赖的成员行。
     * 说明：若尚未加载过 compressedCMMap（例如只打开资料页未进聊天），会先请求成员列表再写入，避免早退导致 Pinia 与 DB 不一致。
     */
    async patchConversationMemberStatusLocal(
      convId: number,
      userId: number,
      memberStatus: number
    ) {
      const uid = Number(userId);
      if (!Number.isFinite(uid) || uid <= 0) return;

      let currentMembers = this.compressedCMMap.get(convId);
      if (!currentMembers || currentMembers.length === 0) {
        try {
          currentMembers = await loadConversationMembersNormalized(convId);
        } catch {
          currentMembers = [];
        }
      }

      let found = false;
      const patchedMembers = currentMembers.map((member) => {
        if (Number(member.userId) !== uid) return member;
        found = true;
        return { ...member, memberStatus };
      });

      if (!found) {
        patchedMembers.push({
          userId: uid,
          memberNickname: null,
          userNickname: "",
          userAvatar: null,
          role: MemberRole.NORMAL,
          memberStatus,
        });
      }

      this.compressedCMMap.set(convId, patchedMembers);
    },

    /**
     * 从群成员压缩缓存中移除一人（他人被踢）；无列表或已无此人时幂等。
     * 使用场景：WS `groupConvMemberManage` kicked 且目标非本人。
     */
    removeGroupMemberFromCompressedCache(convId: number, targetUserId: number) {
      const list = this.compressedCMMap.get(convId);
      if (!list || list.length === 0) return;
      const tid = Number(targetUserId);
      const next = list.filter((m) => Number(m.userId) !== tid);
      if (next.length === list.length) return;
      this.compressedCMMap.set(convId, next);
    },

    /**
     * 本地移除指定会话并同步 currentConversation。
     * 使用场景：退出群聊后，立即从会话列表删除该项并清理相关缓存。
     */
    removeConversationLocal(convId: number) {
      const nextConversations = this.conversations.filter(
        (conversation) => conversation.convId !== convId
      );
      this.conversations = nextConversations;
      this.conversationMap.delete(convId);
      this.compressedCMMap.delete(convId);
      this.unreadRuntimeMap.delete(convId);
      if (this.currentConversation?.convId === convId) {
        this.currentConversation = null;
      }
    },

    /**
     * 本地移除与指定好友关联的单聊会话。
     * 使用场景：删除好友后，移除相关单聊会话，避免仍展示已失效的聊天入口。
     */
    removeSingleConversationByPeerUserId(friendId: number) {
      /** 待删除会话 ID 列表；用于一次性清理 map 与成员缓存。 */
      const deletingConvIds = this.conversations
        .filter((conversation) => {
          if (Number(conversation.convType) !== 1) return false;
          const peerUserId = Number(
            conversation.peer?.peerUserId || conversation.targetUserId || 0
          );
          return peerUserId === Number(friendId);
        })
        .map((conversation) => conversation.convId);
      if (deletingConvIds.length === 0) return;

      this.conversations = this.conversations.filter(
        (conversation) => !deletingConvIds.includes(conversation.convId)
      );
      deletingConvIds.forEach((convId) => {
        this.conversationMap.delete(convId);
        this.compressedCMMap.delete(convId);
        this.unreadRuntimeMap.delete(convId);
      });
      if (
        this.currentConversation &&
        deletingConvIds.includes(this.currentConversation.convId)
      ) {
        this.currentConversation = null;
      }
    },

    async loadCompressedCM(convId: number, force = false) {
      if (!force && this.compressedCMMap.has(convId)) return;
      const members = await loadConversationMembersNormalized(convId);
      this.compressedCMMap.set(convId, members);
    },

    clearCurrentConversation() {
      const previousConvId = this.currentConversation?.convId ?? null;
      if (previousConvId) {
        void this.notifyConversationExited(previousConvId);
      }
      this.currentConversation = null;
    },

    resetConversations() {
      this.conversations = [];
      this.currentConversation = null;
      this.conversationMap.clear();
      this.compressedCMMap.clear();
      this.unreadRuntimeMap.clear();
    },

    // 过渡期兼容旧方法命名
    setCurrentConversation(convId: number) {
      this.selectConversation(convId);
    },
    markAsRead(convId: number) {
      this.markConversationRead(convId);
    },
  },
});

/** 防止 HMR 或重复初始化导致同一事件注册多次监听器。 */
let conversationRealtimeLastMessageListenerBound = false;
let conversationReconnectSyncBound = false;

/**
 * 订阅实时 `newMessage` 并同步更新会话列表中的最后一条消息摘要。
 * 使用场景：应用入口在 `app.use(pinia)` 之后调用一次，使侧栏与 `ConversationItem` 预览随 WS 即时变化。
 */
export function bindConversationRealtimeLastMessageListener(): void {
  if (conversationRealtimeLastMessageListenerBound) return;
  conversationRealtimeLastMessageListenerBound = true;
  realtimeEventBus.on("newMessage", (payload) => {
    const convStore = useConvStore();
    convStore.applyLastMessageFromRealtimePayload(payload);
    convStore.applyUnreadDeltaFromRealtimePayload(payload);
  });

  if (conversationReconnectSyncBound) return;
  conversationReconnectSyncBound = true;
  realtimeEventBus.on("connected", () => {
    void useConvStore().loadConversations();
  });
}

