import { defineStore } from "pinia";
import type { ConversationEntity } from "@/types/dto/conversation-member";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import { useConvStore } from "@/store/conv/conv";
import { useFriendStore } from "@/store/friend/showFriend";
import {
  deleteFriendNormalized,
  leaveConversationNormalized,
  loadConversationInfoNormalized,
  muteGroupMemberNormalized,
  persistConversationInfoNormalized,
  removeGroupMemberNormalized,
  unmuteGroupMemberNormalized,
  updateConversationMemberNamesNormalized,
  updateFriendRemarkNormalized,
  type ConversationInfoDetail,
  type UpdateConversationMemberNamesPayload,
  type UpdateFriendRemarkPayload,
} from "@/normalize/conversation";

export const useConversationInfoStore = defineStore("conversationInfo", {
  actions: {
    /** 会话详情加载：供 ConversationInfo 组件调用。 */
    async loadConversationDetail(convId: number): Promise<ConversationInfoDetail> {
      return loadConversationInfoNormalized(convId);
    },

    /** 单聊备注更新入口。 */
    async updateFriendRemark(friendId: number, payload: UpdateFriendRemarkPayload) {
      await updateFriendRemarkNormalized(friendId, payload);
    },

    /**
     * 更新会话信息（支持文本字段与可选头像文件）并同步 conv store。
     * 使用场景：ConversationInfo 点击 Apply 后，先调用后端接口，再把可确定字段即时回写到会话列表与当前会话。
     */
    async persistConversationInfo(
      convId: number,
      payload: Partial<ConversationEntity> = {},
      convAvatarFile?: File
    ) {
      await persistConversationInfoNormalized(convId, payload, convAvatarFile);
      const convStore = useConvStore();
      /**
       * 本地摘要补丁：只放会话列表模型中已有/可兼容的字段，
       * 用于 patchConversationLocal 进行即时响应式回写。
       */
      const patch: Partial<ConversationSummaryDTO> = {};
      if (payload.convName !== undefined) patch.convName = payload.convName;
      if (payload.convDescription !== undefined) {
        (patch as ConversationSummaryDTO & { convDescription?: string | null }).convDescription =
          payload.convDescription ?? null;
      }
      if (payload.enableReadReceipt !== undefined) {
        (patch as ConversationSummaryDTO & { enableReadReceipt?: boolean }).enableReadReceipt =
          payload.enableReadReceipt;
      }
      if (payload.convType !== undefined) patch.convType = payload.convType;
      if (payload.convAvatar !== undefined) patch.convAvatar = payload.convAvatar;
      if (Object.keys(patch).length > 0) {
        convStore.patchConversationLocal(convId, patch);
      }
    },

    /** 更新当前用户在当前会话的昵称与私有显示名。 */
    async updateConversationMemberNames(
      convId: number,
      payload: UpdateConversationMemberNamesPayload
    ) {
      await updateConversationMemberNamesNormalized(convId, payload);
    },

    /**
     * 退出群聊并同步本地会话状态。
     * 使用场景：群资料页点击“退出群聊”后，立即从会话列表移除对应群会话。
     */
    async leaveConversation(convId: number) {
      await leaveConversationNormalized(convId);
      const convStore = useConvStore();
      convStore.removeConversationLocal(convId);
    },

    /**
     * 删除好友并同步本地好友/单聊会话状态。
     * 使用场景：单聊资料页点击“删除好友”后，立即移除好友与相关单聊会话入口。
     */
    async deleteFriend(friendId: number) {
      await deleteFriendNormalized(friendId);
      const friendStore = useFriendStore();
      const convStore = useConvStore();
      friendStore.removeFriendLocal(friendId);
      convStore.removeSingleConversationByPeerUserId(friendId);
    },

    /** 群主踢出成员；成功返回后端提示文案。 */
    removeGroupMember(convId: number, targetUserId: number) {
      return removeGroupMemberNormalized(convId, targetUserId);
    },

    /** 群主禁言成员。 */
    muteGroupMember(convId: number, targetUserId: number) {
      return muteGroupMemberNormalized(convId, targetUserId);
    },

    /** 群主解除成员禁言。 */
    unmuteGroupMember(convId: number, targetUserId: number) {
      return unmuteGroupMemberNormalized(convId, targetUserId);
    },
  },
});
