import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 管理聊天输入区「单条待回复」状态（同一时间只能引用一条消息）。
 * 使用场景：用户在消息气泡旁点「回复」后，下一条发出的文本/附件会携带 reply_to_message_id；发送完成或切换会话后清空。
 */
export const useComposerReplyStore = defineStore("composerReply", () => {
  /** 待回复目标所在会话；与当前 ChatContainer.convId 不一致时应忽略。 */
  const targetConvId = ref<number | null>(null);
  /** 被引用消息的 messageId。 */
  const targetMessageId = ref<number | null>(null);

  /**
   * 选中一条消息作为下一条发送的回复目标（会覆盖之前的选中）。
   */
  const setPendingReply = (convId: number, messageId: number) => {
    targetConvId.value = convId;
    targetMessageId.value = messageId;
  };

  /**
   * 放弃引用（用户点关闭或切会话时调用）。
   */
  const clearPendingReply = () => {
    targetConvId.value = null;
    targetMessageId.value = null;
  };

  return {
    targetConvId,
    targetMessageId,
    setPendingReply,
    clearPendingReply,
  };
});
