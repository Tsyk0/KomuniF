import { defineStore } from "pinia";
import { recallMessageNormalized } from "@/normalize/message";
import type { DisplayMessage } from "@/entity/message";
import { MemberRole } from "@/entity/conversation-member";
import { useShowMessageStore } from "@/store/message/showMessage";
import { patchMessageInDB } from "@/commons/utils/local-db";
import toast from "@/commons/utils/toast";

const RECALL_LIMIT_MS = 2 * 60 * 1000;

interface RecallPermissionContext {
  currentUserId: number;
  convType: number | null;
  currentUserRole?: number | null;
  nowMs?: number;
}

export const useRecallMessageStore = defineStore("recallMessage", () => {
  const showMessageStore = useShowMessageStore();

  /**
   * 判断消息是否允许撤回。
   * 使用场景：消息菜单渲染「撤回」按钮前，以及点击撤回后二次校验。
   */
  const canRecallMessage = (
    message: DisplayMessage,
    context: RecallPermissionContext
  ): boolean => {
    if (!message || message.isRecalled) return false;
    const currentUserId = Number(context.currentUserId);
    if (!Number.isFinite(currentUserId) || currentUserId <= 0) return false;

    const senderId = Number(message.senderId);
    const sendTimeMs = Date.parse(message.sendTime || "");
    const nowMs = Number(context.nowMs ?? Date.now());
    const withinLimit =
      Number.isFinite(sendTimeMs) && nowMs - sendTimeMs <= RECALL_LIMIT_MS;
    const isSender = senderId === currentUserId;

    if (Number(context.convType) === 1) {
      return isSender && withinLimit;
    }

    const role = Number(context.currentUserRole);
    const isAdminOrOwner =
      role === MemberRole.ADMIN || role === MemberRole.OWNER;
    return (isSender && withinLimit) || isAdminOrOwner;
  };

  /**
   * 调用后端撤回接口并给出用户反馈。
   * 使用场景：消息菜单点击「撤回」后，统一处理成功/失败提示。
   */
  const requestRecallMessage = async (
    convId: number,
    messageId: number
  ): Promise<boolean> => {
    const result = await recallMessageNormalized(convId, messageId);
    if (result.ok) {
      toast.success("撤回成功");
      return true;
    }
    toast.error(result.errorMessage);
    return false;
  };

  /**
   * 本地将某条消息标记为已撤回并写入缓存。
   * 使用场景：收到 messageRecalled 广播后，原位更新消息列表中的单条记录。
   */
  const applyRecallPlaceholderToMessage = async (input: {
    messageId: number;
    recallTime: string;
    placeholderText: string;
  }): Promise<boolean> => {
    const idx = showMessageStore.messages.findIndex(
      (item) => Number(item.messageId) === Number(input.messageId)
    );
    if (idx < 0) return false;
    const target = showMessageStore.messages[idx];
    if (target.isRecalled) return false;

    showMessageStore.messages[idx] = {
      ...target,
      isRecalled: true,
      recallTime: input.recallTime,
      messageType: "system",
      messageContent: input.placeholderText,
      fileId: null,
      fileName: null,
      fileSize: null,
      fileMimeType: null,
      thumbnailUrl: null,
      downloadUrl: null,
      playUrl: null,
    };
    await patchMessageInDB(input.messageId, {
      isRecalled: true,
      recallTime: input.recallTime,
      messageType: "system",
      messageContent: input.placeholderText,
    });
    return true;
  };

  return {
    canRecallMessage,
    requestRecallMessage,
    applyRecallPlaceholderToMessage,
  };
});

