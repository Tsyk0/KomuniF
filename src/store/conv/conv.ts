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
import {
  mapRealtimePayloadToLastMessageInfo,
  mapDisplayMessageToLastMessageInfo,
} from "@/normalize/message/realtime/messageRealtimeMapper";
import type { DisplayMessage } from "@/entity/message";
import { useUserStore } from "@/store/user/user";
import { useFriendStore } from "@/store/friend/showFriend";

export const useConvStore = defineStore("conv", {
  state: () => ({
    conversations: [] as ConversationSummaryDTO[],
    currentConversation: null as ConversationSummaryDTO | null,
    compressedCMMap: new Map<number, MessageDisplayMemberDTO[]>(),
    conversationMap: new Map<number, ConversationSummaryDTO>(),
  }),

  getters: {
    totalUnreadCount: (state): number =>
      state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0),
  },

  actions: {
    setConversations(conversations: ConversationSummaryDTO[]) {
      this.conversations = conversations;
      this.rebuildConversationMap();
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

      if (this.currentConversation?.convId === convId) {
        this.currentConversation = updated;
      }
    },

    selectConversation(convId: number | null) {
      if (convId == null) {
        this.currentConversation = null;
        return;
      }
      this.currentConversation =
        this.conversations.find((item) => item.convId === convId) || null;
      if (this.currentConversation?.convType === 2) {
        void this.loadCompressedCM(convId);
      }
    },

    markConversationRead(convId: number) {
      const conv = this.conversations.find((item) => item.convId === convId);
      if (conv) conv.unreadCount = 0;
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
      this.currentConversation = null;
    },

    resetConversations() {
      this.conversations = [];
      this.currentConversation = null;
      this.conversationMap.clear();
      this.compressedCMMap.clear();
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

/**
 * 订阅实时 `newMessage` 并同步更新会话列表中的最后一条消息摘要。
 * 使用场景：应用入口在 `app.use(pinia)` 之后调用一次，使侧栏与 `ConversationItem` 预览随 WS 即时变化。
 */
export function bindConversationRealtimeLastMessageListener(): void {
  if (conversationRealtimeLastMessageListenerBound) return;
  conversationRealtimeLastMessageListenerBound = true;
  realtimeEventBus.on("newMessage", (payload) => {
    useConvStore().applyLastMessageFromRealtimePayload(payload);
  });
}
