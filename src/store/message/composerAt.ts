import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 管理输入区「@ 多人」状态（可切换多条消息，对应多个 senderId，自动去重保序）。
 * 使用场景：在消息旁点 @ 后，下一条发送的文本/附件会携带 atUserIds；发送成功或切会话后清空。
 */
export const useComposerAtStore = defineStore("composerAt", () => {
  const targetConvId = ref<number | null>(null);
  /** 被 @ 的用户 ID 列表（去重、按点击顺序） */
  const atUserIds = ref<number[]>([]);

  /**
   * 从某条消息切换其发送者：已选则取消，未选则追加。
   */
  const toggleAtFromMessage = (convId: number, senderId: number) => {
    const sid = Number(senderId);
    if (!Number.isFinite(sid) || sid <= 0) return;
    const cid = Number(convId);
    if (!Number.isFinite(cid) || cid <= 0) return;

    if (targetConvId.value == null || Number(targetConvId.value) !== cid) {
      targetConvId.value = cid;
      atUserIds.value = [];
    }

    const list = atUserIds.value;
    const idx = list.indexOf(sid);
    if (idx >= 0) {
      atUserIds.value = list.filter((id) => id !== sid);
      if (atUserIds.value.length === 0) {
        targetConvId.value = null;
      }
    } else {
      atUserIds.value = [...list, sid];
    }
  };

  /**
   * 放弃所有 @ 选中。
   */
  const clearAtTargets = () => {
    targetConvId.value = null;
    atUserIds.value = [];
  };

  /**
   * 读取当前会话下待发送的 @ ID 列表（不清空；发送成功后再 clear）。
   */
  const getPendingAtUserIdsForConv = (convId: number): number[] | undefined => {
    const cid = Number(convId);
    const tid =
      targetConvId.value == null ? NaN : Number(targetConvId.value);
    if (!Number.isFinite(cid) || cid <= 0 || tid !== cid || atUserIds.value.length === 0) {
      return undefined;
    }
    return [...atUserIds.value];
  };

  return {
    targetConvId,
    atUserIds,
    toggleAtFromMessage,
    clearAtTargets,
    getPendingAtUserIdsForConv,
  };
});
