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
    /** 选中的好友 userId（不含自己） */
    selectedFriendIds: [] as number[],
    /** 点击 ➕ 进入前的 currentListView，用于退出时恢复 */
    savedListView: "chat" as "chat" | "friends",
  }),

  getters: {
    selectedCount: (state) => state.selectedFriendIds.length,
  },

  actions: {
    enter(fromListView: "chat" | "friends") {
      this.savedListView = fromListView;
      this.active = true;
      this.panel = "group";
      this.selectedFriendIds = [];
    },

    exit() {
      this.active = false;
      this.panel = "group";
      this.selectedFriendIds = [];
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
  },
});
