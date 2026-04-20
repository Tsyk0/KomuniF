import { ref } from "vue";
import { defineStore } from "pinia";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import {
  loadAllSingleChatPeerAvatarMapNormalized,
  loadSingleChatPeerAvatarNormalized,
} from "@/normalize/conversation";

/** 单条补齐防抖：避免同一 convId 在短时间内重复请求。 */
const inflight = new Set<number>();

export const useSingleChatPeerAvatarStore = defineStore(
  "singleChatPeerAvatar",
  () => {
    /** 单聊对端头像缓存：convId -> normalized avatarUrl。 */
    const avatarByConvId = ref<Record<number, string>>({});

    /** 清空头像缓存（登出/重置场景使用）。 */
    function reset() {
      avatarByConvId.value = {};
      inflight.clear();
    }

    /** 读取缓存头像，不触发网络请求。 */
    function getAvatar(convId: number): string {
      const id = Math.floor(Number(convId));
      if (!Number.isFinite(id) || id <= 0) return "";
      return avatarByConvId.value[id] || "";
    }

    /**
     * 批量填充缓存：
     * 通常在会话摘要加载后调用，让列表/头部尽快有头像可显示。
     */
    async function loadAllSingleChatPeerProfiles(): Promise<void> {
      const nextMap = await loadAllSingleChatPeerAvatarMapNormalized();
      if (Object.keys(nextMap).length === 0) return;
      avatarByConvId.value = { ...avatarByConvId.value, ...nextMap };
    }

    /**
     * 单条动态补齐：
     * 仅在该 convId 缓存缺失时触发，且同一时刻只允许一个请求在飞行。
     */
    async function ensurePeerAvatar(
      conv: ConversationSummaryDTO | null | undefined,
      currentUserId: number | null
    ): Promise<void> {
      if (!conv || Number(conv.convType) !== 1) return;
      const convId = Math.floor(Number(conv.convId));
      if (!Number.isFinite(convId) || convId <= 0) return;
      if (avatarByConvId.value[convId]) return;
      if (inflight.has(convId)) return;

      inflight.add(convId);
      try {
        const avatar = await loadSingleChatPeerAvatarNormalized(conv, currentUserId);
        if (!avatar) return;
        avatarByConvId.value = { ...avatarByConvId.value, [convId]: avatar };
      } finally {
        inflight.delete(convId);
      }
    }

    return {
      avatarByConvId,
      getAvatar,
      loadAllSingleChatPeerProfiles,
      ensurePeerAvatar,
      reset,
    };
  }
);
