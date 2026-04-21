import { defineStore } from "pinia";

export type ConvCreatePanel = "group" | "add-friend";

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
