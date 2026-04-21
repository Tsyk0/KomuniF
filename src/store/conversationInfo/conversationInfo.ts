import { defineStore } from "pinia";
import type { ConversationEntity } from "@/types/dto/conversation-member";
import { loadFriendInfoNormalized } from "@/normalize/friend";
import {
  loadConversationInfoNormalized,
  updateConversationInfoNormalized,
  updateFriendRemarkNormalized,
  type ConversationInfoDetail,
  type UpdateFriendRemarkPayload,
} from "@/normalize/conversation";

export const useConversationInfoStore = defineStore("conversationInfo", {
  actions: {
    /** 会话详情加载：供 ConversationInfo 组件调用。 */
    async loadConversationDetail(convId: number): Promise<ConversationInfoDetail> {
      return loadConversationInfoNormalized(convId);
    },

    /** 好友详情加载：供单聊信息面板调用。 */
    async loadFriendDetail(friendId: number) {
      return loadFriendInfoNormalized(friendId);
    },

    /** 单聊备注更新入口。 */
    async updateFriendRemark(friendId: number, payload: UpdateFriendRemarkPayload) {
      await updateFriendRemarkNormalized(friendId, payload);
    },

    /** 群信息更新入口。 */
    async updateConversationInfo(payload: Partial<ConversationEntity> & { convId: number }) {
      await updateConversationInfoNormalized(payload);
    },
  },
});
