import { defineStore } from "pinia";
import type {
  ConversationSummaryDTO,
  MessageDisplayMemberDTO,
} from "@/types/dto/conversation";
import type { ReadReceiptMemberDTO } from "@/types/dto/message";
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
import { useWebSocketStore } from "@/store/realtime/websocket";
import { MemberRole } from "@/entity/conversation-member";

/** WS `readMessage` 按需上报：新消息后延迟（毫秒），计时器不随新消息重置。 */
const WS_READ_MESSAGE_REPORT_DELAY_MS = 2000;

/**
 * 当前聊天视图的已读游标 WS 上报运行态（模块级，避免 Pinia 序列化定时器）。
 * 使用场景：`onChatViewportReadyForWsReadReport` 与 `newMessage` 驱动的 2s 计时器。
 */
interface WsReadMessageReportRuntimeState {
  convId: number;
  lastReportedMessageId: number;
  pendingReportMessageId: number;
  reportTimerId: ReturnType<typeof setTimeout> | null;
}

let wsReadMessageReportState: WsReadMessageReportRuntimeState | null = null;
/**
 * 会话已读回执请求去重表（按 convId + offset + limit）。
 * 使用场景：进入会话阶段同一参数被多处并发触发时，复用同一 Promise，避免重复 HTTP。
 */
const readReceiptInFlightMap = new Map<string, Promise<ConversationReadReceiptRuntimeState>>();

/**
 * 清除 WS 已读上报计时器引用。
 * 使用场景：退出会话、pagehide 立即上报前。
 */
function clearWsReadMessageReportTimer(): void {
  const s = wsReadMessageReportState;
  if (!s?.reportTimerId) return;
  clearTimeout(s.reportTimerId);
  s.reportTimerId = null;
}

/**
 * 计时器到期：若 pending 与上次上报不同则发送 `readMessage`。
 * 使用场景：`WS_READ_MESSAGE_REPORT_DELAY_MS` 到期回调（不重置计时器，自然结束）。
 */
function runWsReadMessageReportTimerTick(): void {
  const s = wsReadMessageReportState;
  if (!s) return;
  s.reportTimerId = null;
  if (s.pendingReportMessageId <= 0) return;
  if (s.pendingReportMessageId === s.lastReportedMessageId) return;
  const ws = useWebSocketStore();
  const ok = ws.sendReadReceipt(s.pendingReportMessageId, s.convId);
  if (ok) {
    s.lastReportedMessageId = s.pendingReportMessageId;
    useConvStore().trackConversationReadProgress(s.convId, s.pendingReportMessageId);
  }
}

/**
 * 退出会话时：清计时器，若有未上报游标则立即发 WS，并销毁运行态。
 * 使用场景：`notifyConversationExited`、删除会话。
 */
function finalizeWsReadMessageReportOnLeave(convId: number): void {
  const s = wsReadMessageReportState;
  if (!s || s.convId !== convId) return;
  clearWsReadMessageReportTimer();
  if (s.pendingReportMessageId > s.lastReportedMessageId && s.pendingReportMessageId > 0) {
    const ws = useWebSocketStore();
    if (ws.sendReadReceipt(s.pendingReportMessageId, convId)) {
      useConvStore().trackConversationReadProgress(convId, s.pendingReportMessageId);
    }
  }
  wsReadMessageReportState = null;
}

/**
 * 页面隐藏时：立即补发未同步的 WS 已读游标，保留运行态以便用户回到页签后继续。
 * 使用场景：`pagehide` / `visibilitychange` 兜底。
 */
function flushWsReadMessageReportPendingForPageHide(convId: number): void {
  const s = wsReadMessageReportState;
  if (!s || s.convId !== convId) return;
  clearWsReadMessageReportTimer();
  if (s.pendingReportMessageId > s.lastReportedMessageId && s.pendingReportMessageId > 0) {
    const ws = useWebSocketStore();
    if (ws.sendReadReceipt(s.pendingReportMessageId, convId)) {
      s.lastReportedMessageId = s.pendingReportMessageId;
      useConvStore().trackConversationReadProgress(convId, s.pendingReportMessageId);
    }
  }
}

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

interface ConversationReadReceiptRuntimeState {
  latestOwnMessageId: number;
  readCount: number;
  readMembers: ReadReceiptMemberDTO[];
  updatedAt: number;
  lastFetchedAt: number;
}

export const useConvStore = defineStore("conv", {
  state: () => ({
    conversations: [] as ConversationSummaryDTO[],
    currentConversation: null as ConversationSummaryDTO | null,
    compressedCMMap: new Map<number, MessageDisplayMemberDTO[]>(),
    conversationMap: new Map<number, ConversationSummaryDTO>(),
    unreadRuntimeMap: new Map<number, ConversationUnreadRuntimeState>(),
    readReceiptRuntimeMap: new Map<number, ConversationReadReceiptRuntimeState>(),
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

    /**
     * 获取会话已读回执运行态；用于消息气泡下方已读展示与弹窗列表。
     * 使用场景：进入会话后读取缓存，以及实时消息已读广播增量更新。
     */
    getOrCreateReadReceiptRuntime(convId: number): ConversationReadReceiptRuntimeState {
      const existing = this.readReceiptRuntimeMap.get(convId);
      if (existing) return existing;
      const created: ConversationReadReceiptRuntimeState = {
        latestOwnMessageId: 0,
        readCount: 0,
        readMembers: [],
        updatedAt: 0,
        lastFetchedAt: 0,
      };
      this.readReceiptRuntimeMap.set(convId, created);
      return created;
    },

    /**
     * 进入/切换会话后同步“我发送的最新消息 ID”到回执缓存，变化时自动清空旧回执。
     * 使用场景：消息列表加载完成后，从展示消息中找出本人最新一条并驱动回执查询。
     */
    syncLatestOwnMessageForReadReceipt(convId: number, latestOwnMessageId: number | null) {
      const runtime = this.getOrCreateReadReceiptRuntime(convId);
      const normalizedId = Math.max(0, Number(latestOwnMessageId || 0));
      if (runtime.latestOwnMessageId === normalizedId) return;
      runtime.latestOwnMessageId = normalizedId;
      runtime.readCount = 0;
      runtime.readMembers = [];
      runtime.updatedAt = Date.now();
      runtime.lastFetchedAt = 0;
    },

    /**
     * 清空会话的已读回执缓存。
     * 使用场景：本人发送新消息后，旧消息回执立即隐藏，等待新消息回执重新累积。
     */
    clearConversationReadReceipt(convId: number) {
      const runtime = this.getOrCreateReadReceiptRuntime(convId);
      runtime.latestOwnMessageId = 0;
      runtime.readCount = 0;
      runtime.readMembers = [];
      runtime.updatedAt = Date.now();
      runtime.lastFetchedAt = 0;
    },

    /**
     * 拉取会话最新消息已读回执（带短期缓存，默认 8 秒内复用）。
     * 使用场景：进入会话后首次展示已读回执，或弹窗打开时主动刷新最新成员列表。
     */
    async refreshConversationReadReceipt(
      convId: number,
      options?: {
        force?: boolean;
        limit?: number;
        offset?: number;
      }
    ) {
      const runtime = this.getOrCreateReadReceiptRuntime(convId);
      const authStore = useUserStore();
      const currentUserId = Number(authStore.user?.userId || 0);
      const force = !!options?.force;
      const offset = Math.max(0, Number(options?.offset || 0));
      const limit = Math.max(1, Number(options?.limit || 50));
      const inFlightKey = `${convId}:${offset}:${limit}`;
      const now = Date.now();
      if (!force && offset === 0 && now - runtime.lastFetchedAt < 8000) {
        return runtime;
      }
      if (!force) {
        const existing = readReceiptInFlightMap.get(inFlightKey);
        if (existing) {
          return existing;
        }
      }
      const task = (async () => {
        try {
          const response = await conversationReadApi.getLatestReadReceipt({
            convId,
            limit,
            offset,
          });
          if (response.code !== 200) return runtime;
          const data = response.data;
          if (!data || Number(data.messageId) <= 0) {
            runtime.latestOwnMessageId = 0;
            runtime.readCount = 0;
            runtime.readMembers = [];
            runtime.updatedAt = Date.now();
            runtime.lastFetchedAt = Date.now();
            return runtime;
          }
          const incomingMembers = (Array.isArray(data.readMembers) ? data.readMembers : []).filter(
            (member) => Number(member.userId) !== currentUserId
          );
          if (offset > 0) {
            const seen = new Set<number>();
            const merged = [...runtime.readMembers, ...incomingMembers].filter((member) => {
              const uid = Number(member.userId);
              if (!Number.isFinite(uid) || uid <= 0 || seen.has(uid)) return false;
              seen.add(uid);
              return true;
            });
            runtime.readMembers = merged.sort(
              (a, b) => Date.parse(b.readTime || "") - Date.parse(a.readTime || "")
            );
          } else {
            runtime.readMembers = incomingMembers.sort(
              (a, b) => Date.parse(b.readTime || "") - Date.parse(a.readTime || "")
            );
          }
          runtime.latestOwnMessageId = Math.max(0, Number(data.messageId || 0));
          runtime.readCount = Math.max(0, Number(data.readCount || 0) - 1);
          runtime.updatedAt = Date.now();
          runtime.lastFetchedAt = Date.now();
        } catch {
          // 静默失败，不影响消息主链路。
        } finally {
          readReceiptInFlightMap.delete(inFlightKey);
        }
        return runtime;
      })();
      if (!force) {
        readReceiptInFlightMap.set(inFlightKey, task);
      }
      return task;
    },

    /**
     * 消费 WS messageRead 广播并对当前会话回执做增量合并。
     * 使用场景：有人读了当前会话里“我发送的最新消息”时，头像与人数实时增加。
     */
    applyReadReceiptFromRealtimePayload(payload: Record<string, unknown>) {
      const raw = payload as Record<string, any>;
      const convId = Number(raw.convId);
      const lastReadMessageId = Number(raw.lastReadMessageId);
      const userId = Number(raw.userId);
      if (!Number.isFinite(convId) || convId <= 0) return;
      if (!Number.isFinite(lastReadMessageId) || lastReadMessageId <= 0) return;
      if (!Number.isFinite(userId) || userId <= 0) return;
      const authStore = useUserStore();
      const currentUserId = Number(authStore.user?.userId || 0);
      if (userId === currentUserId) return;
      const runtime = this.readReceiptRuntimeMap.get(convId);
      if (!runtime) return;
      if (runtime.latestOwnMessageId <= 0) return;
      if (runtime.latestOwnMessageId !== lastReadMessageId) return;
      const exists = runtime.readMembers.some((member) => Number(member.userId) === userId);
      if (exists) return;
      const members = this.compressedCMMap.get(convId) || [];
      const memberRow = members.find((m) => Number(m.userId) === userId);

      let userNickname: string;
      let userAvatar: string | null;

      if (Number(userId) === currentUserId && authStore.user) {
        userNickname =
          (authStore.user.userNickname || "").trim() ||
          (authStore.user.userEmail || "").trim() ||
          "我";
        userAvatar =
          typeof authStore.user.userAvatar === "string"
            ? authStore.user.userAvatar
            : null;
      } else if (memberRow) {
        userNickname =
          (memberRow.memberNickname || "").trim() ||
          (memberRow.userNickname || "").trim() ||
          "用户";
        userAvatar =
          typeof memberRow.userAvatar === "string" ? memberRow.userAvatar : null;
      } else if (Number(this.conversationMap.get(convId)?.convType) === 1) {
        const conv = this.conversationMap.get(convId);
        const peer = conv?.peer;
        const friendStore = useFriendStore();
        const friend = friendStore.friends.find(
          (f) => Number(f.friendId) === userId || Number(f.userId) === userId
        );
        userNickname =
          (friend?.displayName || "").trim() ||
          (friend?.remarkName || "").trim() ||
          (peer?.peerRemarkName || "").trim() ||
          (peer?.peerNickname || "").trim() ||
          "用户";
        userAvatar =
          (typeof friend?.avatar === "string" && friend.avatar) ||
          (typeof peer?.peerAvatar === "string" && peer.peerAvatar) ||
          (typeof conv?.convAvatar === "string" && conv.convAvatar) ||
          null;
      } else {
        userNickname = String(raw.userNickname || raw.nickname || "用户");
        userAvatar =
          typeof raw.userAvatar === "string" ? raw.userAvatar : null;
      }

      let readTimeIso: string;
      if (typeof raw.readTime === "number" && Number.isFinite(raw.readTime)) {
        readTimeIso = new Date(raw.readTime).toISOString();
      } else if (typeof raw.readTime === "string" && raw.readTime.trim()) {
        readTimeIso = raw.readTime;
      } else {
        readTimeIso = new Date().toISOString();
      }

      runtime.readMembers.unshift({
        userId,
        userNickname,
        userAvatar,
        readTime: readTimeIso,
      });
      runtime.readMembers.sort(
        (a, b) => Date.parse(b.readTime || "") - Date.parse(a.readTime || "")
      );
      runtime.readCount = Math.max(runtime.readCount + 1, runtime.readMembers.length);
      runtime.updatedAt = Date.now();
    },

    /**
     * 聊天区消息列表就绪：立即 WS 上报当前最新已持久化 messageId，不启动 2s 计时器。
     * 使用场景：`ChatContainer` 首屏/切换会话加载完成且 `isMessagesReady` 之后。
     */
    onChatViewportReadyForWsReadReport(convId: number, latestPersistedMessageId: number) {
      const cid = Number(convId);
      if (!Number.isFinite(cid) || cid <= 0) return;
      if (wsReadMessageReportState && wsReadMessageReportState.convId !== cid) {
        finalizeWsReadMessageReportOnLeave(wsReadMessageReportState.convId);
      }
      clearWsReadMessageReportTimer();
      let mid = Math.max(0, Number(latestPersistedMessageId || 0));
      if (wsReadMessageReportState?.convId === cid) {
        mid = Math.max(mid, wsReadMessageReportState.pendingReportMessageId);
      }
      if (mid <= 0) {
        wsReadMessageReportState = {
          convId: cid,
          lastReportedMessageId: 0,
          pendingReportMessageId: 0,
          reportTimerId: null,
        };
        return;
      }
      wsReadMessageReportState = {
        convId: cid,
        pendingReportMessageId: mid,
        lastReportedMessageId: 0,
        reportTimerId: null,
      };
      const ws = useWebSocketStore();
      const ok = ws.sendReadReceipt(mid, cid);
      if (ok) {
        wsReadMessageReportState.lastReportedMessageId = mid;
        this.trackConversationReadProgress(cid, mid);
      }
    },

    /**
     * 当前会话内收到 WS `newMessage`：更新 pending；若无计时器则启动 2s（不重置已有计时器）。
     * 使用场景：`bindConversationRealtimeLastMessageListener` 与未读增量并行调用。
     */
    applyNewMessageWsReadReportFromRealtimePayload(payload: Record<string, unknown>) {
      const raw = payload as Record<string, any>;
      const convId = Number(raw.convId ?? raw.data?.convId ?? raw.message?.convId);
      const messageId = Number(raw.messageId ?? raw.data?.messageId ?? raw.message?.messageId);
      if (!Number.isFinite(convId) || convId <= 0) return;
      if (!Number.isFinite(messageId) || messageId <= 0) return;
      if (this.currentConversation?.convId !== convId) return;

      let s = wsReadMessageReportState;
      if (!s || s.convId !== convId) {
        wsReadMessageReportState = {
          convId,
          pendingReportMessageId: messageId,
          lastReportedMessageId: 0,
          reportTimerId: null,
        };
        s = wsReadMessageReportState;
        const ws = useWebSocketStore();
        if (ws.sendReadReceipt(messageId, convId)) {
          s.lastReportedMessageId = messageId;
          this.trackConversationReadProgress(convId, messageId);
        }
        return;
      }

      s.pendingReportMessageId = Math.max(s.pendingReportMessageId, messageId);
      if (s.reportTimerId != null) return;
      s.reportTimerId = window.setTimeout(() => {
        runWsReadMessageReportTimerTick();
      }, WS_READ_MESSAGE_REPORT_DELAY_MS);
    },

    /**
     * 页面隐藏/关闭前补发 WS 已读游标（不销毁运行态，避免回到页签后状态丢失）。
     * 使用场景：`pagehide` / `visibilitychange` 与 HTTP beacon 并行兜底。
     */
    flushWsReadMessageReportOnPageHide() {
      const convId = this.currentConversation?.convId;
      if (convId == null) return;
      flushWsReadMessageReportPendingForPageHide(convId);
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
      finalizeWsReadMessageReportOnLeave(convId);
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
        messageId: nextReadId,
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
          messageId: nextReadId,
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
      finalizeWsReadMessageReportOnLeave(convId);
      const nextConversations = this.conversations.filter(
        (conversation) => conversation.convId !== convId
      );
      this.conversations = nextConversations;
      this.conversationMap.delete(convId);
      this.compressedCMMap.delete(convId);
      this.unreadRuntimeMap.delete(convId);
      this.readReceiptRuntimeMap.delete(convId);
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

      deletingConvIds.forEach((id) => finalizeWsReadMessageReportOnLeave(id));

      this.conversations = this.conversations.filter(
        (conversation) => !deletingConvIds.includes(conversation.convId)
      );
      deletingConvIds.forEach((convId) => {
        this.conversationMap.delete(convId);
        this.compressedCMMap.delete(convId);
        this.unreadRuntimeMap.delete(convId);
        this.readReceiptRuntimeMap.delete(convId);
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
      if (wsReadMessageReportState) {
        finalizeWsReadMessageReportOnLeave(wsReadMessageReportState.convId);
      }
      this.conversations = [];
      this.currentConversation = null;
      this.conversationMap.clear();
      this.compressedCMMap.clear();
      this.unreadRuntimeMap.clear();
      this.readReceiptRuntimeMap.clear();
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
let conversationReadReceiptRealtimeBound = false;

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
    convStore.applyNewMessageWsReadReportFromRealtimePayload(payload);
  });

  if (!conversationReadReceiptRealtimeBound) {
    conversationReadReceiptRealtimeBound = true;
    realtimeEventBus.on("messageRead", (payload) => {
      const convStore = useConvStore();
      convStore.applyReadReceiptFromRealtimePayload(payload);
    });
  }

  if (conversationReconnectSyncBound) return;
  conversationReconnectSyncBound = true;
  realtimeEventBus.on("connected", () => {
    void useConvStore().loadConversations();
  });
}

