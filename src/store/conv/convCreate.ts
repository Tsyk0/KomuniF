import { defineStore } from "pinia";
import {
  createGroupConversationNormalized,
  createOrGetSingleConversationNormalized,
} from "@/normalize/conversation";
import { useConvStore } from "@/store/conv/conv";

export type ConvCreatePanel = "group" | "add-friend" | "search-conv";

/**
 * 新建群聊流程：侧栏勾选好友 + 主区域填群名并创建。
 * 退出后恢复进入前的列表视图（chat / friends）。
 */
export const useConvCreateStore = defineStore("convCreate", {
  state: () => ({
    active: false,
    panel: "group" as ConvCreatePanel,
    selectedFriendIds: [] as number[],
    draftConvName: "",
    savedListView: "chat" as "chat" | "friends",
  }),

  getters: {
    selectedCount: (state) => state.selectedFriendIds.length,
  },

  actions: {
    /**
     * 创建群聊会话。
     * 使用场景：ConvCreatePanel 点击“创建群聊”后统一通过 store 执行持久化。
     */
    async createGroupConversation(input: {
      convName: string;
      memberUserIds: number[];
    }): Promise<{ ok: boolean; convId: number | null; message: string | null }> {
      const name = (input.convName || "").trim();
      if (!name) {
        return { ok: false, convId: null, message: "请填写群名称" };
      }
      if (!Array.isArray(input.memberUserIds) || input.memberUserIds.length < 1) {
        return { ok: false, convId: null, message: "请至少选择 1 位好友" };
      }
      try {
        const result = await createGroupConversationNormalized(
          name,
          input.memberUserIds
        );
        if (!result.success || result.convId == null) {
          return {
            ok: false,
            convId: null,
            message: result.message || "创建群聊失败",
          };
        }
        return {
          ok: true,
          convId: Number(result.convId),
          message: result.message || "创建成功",
        };
      } catch (e: any) {
        return {
          ok: false,
          convId: null,
          message: e?.response?.data?.message || e?.message || "创建群聊失败，请稍后重试",
        };
      }
    },

    /**
     * 创建或复用单聊并打开会话。
     * 使用场景：好友详情/用户搜索点击“发消息”后，统一通过 store 打开单聊。
     */
    async openOrCreateSingleConversation(input: {
      peerUserId: number;
      currentUserId: number;
      loadMessages: (convId: number) => Promise<void>;
      loadConversationsBootstrap: (
        userId: number
      ) => Promise<{ success: boolean; message?: string }>;
    }): Promise<{ ok: boolean; convId: number | null; message: string | null }> {
      const pid = Number(input.peerUserId);
      if (!Number.isFinite(pid) || pid <= 0) {
        return { ok: false, convId: null, message: "无效的用户 ID" };
      }
      const convStore = useConvStore();
      try {
        const result = await createOrGetSingleConversationNormalized(pid);
        if (!result.success || result.convId == null) {
          return {
            ok: false,
            convId: null,
            message: result.message || "创建会话失败",
          };
        }
        const convId = Number(result.convId);
        await convStore.refreshConversationById(convId);
        if (!convStore.getConversationById(convId)) {
          const loadResult = await input.loadConversationsBootstrap(
            Number(input.currentUserId)
          );
          if (!loadResult.success) {
            return {
              ok: false,
              convId: null,
              message: loadResult.message || "加载会话失败",
            };
          }
        }
        if (!convStore.getConversationById(convId)) {
          return {
            ok: false,
            convId: null,
            message: "会话已创建，但拉取会话详情失败，请稍后在会话列表中打开",
          };
        }
        convStore.setCurrentConversation(convId);
        await input.loadMessages(convId);
        convStore.markAsRead(convId);
        return { ok: true, convId, message: null };
      } catch (e: any) {
        return {
          ok: false,
          convId: null,
          message: e?.response?.data?.message || e?.message || "创建会话失败，请稍后重试",
        };
      }
    },

    /**
     * 打开已存在会话（典型用于“群聊创建成功后立即打开”）。
     * 使用场景：HomeView 收到 created 事件后，通过 store 统一完成会话刷新与打开。
     */
    async openExistingConversation(input: {
      convId: number;
      currentUserId: number;
      loadMessages: (convId: number) => Promise<void>;
      loadConversationsBootstrap: (
        userId: number
      ) => Promise<{ success: boolean; message?: string }>;
    }): Promise<{ ok: boolean; convId: number | null; message: string | null }> {
      const convId = Number(input.convId);
      if (!Number.isFinite(convId) || convId <= 0) {
        return { ok: false, convId: null, message: "无效的会话 ID" };
      }
      const convStore = useConvStore();
      try {
        await convStore.refreshConversationById(convId);
        if (!convStore.getConversationById(convId)) {
          const loadResult = await input.loadConversationsBootstrap(
            Number(input.currentUserId)
          );
          if (!loadResult.success) {
            return {
              ok: false,
              convId: null,
              message: loadResult.message || "加载会话失败",
            };
          }
        }
        if (!convStore.getConversationById(convId)) {
          return {
            ok: false,
            convId: null,
            message: "会话已创建，但拉取会话详情失败，请稍后在会话列表中打开",
          };
        }
        convStore.setCurrentConversation(convId);
        await input.loadMessages(convId);
        convStore.markAsRead(convId);
        return { ok: true, convId, message: null };
      } catch (e: any) {
        return {
          ok: false,
          convId: null,
          message: e?.response?.data?.message || e?.message || "打开会话失败，请稍后重试",
        };
      }
    },

    enter(fromListView: "chat" | "friends", resetDraft = false) {
      this.savedListView = fromListView;
      this.active = true;
      if (resetDraft) {
        this.resetDraft();
      }
    },

    exit(resetDraft = false) {
      this.active = false;
      if (resetDraft) {
        this.resetDraft();
      }
    },

    toggleFriendId(friendId: number) {
      if (friendId <= 0) return;
      const idx = this.selectedFriendIds.indexOf(friendId);
      if (idx >= 0) {
        this.selectedFriendIds.splice(idx, 1);
      } else {
        this.selectedFriendIds.push(friendId);
      }
    },

    setPanel(p: ConvCreatePanel) {
      this.panel = p;
    },

    setDraftConvName(name: string) {
      this.draftConvName = name;
    },

    resetDraft() {
      this.panel = "group";
      this.selectedFriendIds = [];
      this.draftConvName = "";
    },
  },
});
