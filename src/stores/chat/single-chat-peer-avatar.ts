import { ref } from "vue";
import { defineStore } from "pinia";
import { conversationPeerApi } from "@/apis/chat/conversation-peer";
import { friendApi } from "@/apis/friend/index";
import type { ConversationDetailDTO } from "@/types/dto/conversation";
import { normalizeAvatarUrl } from "@/utils/avatar-url";

const inflight = new Set<number>();

/** 从会话 DTO 推断对方 userId（仅用于拉取「用户资料」类接口，不用消息里的头像字段） */
function inferPeerUserId(
  conv: ConversationDetailDTO,
  currentUserId: number | null
): number | null {
  if (conv.targetUserId != null && String(conv.targetUserId).trim() !== "") {
    const t = Number(conv.targetUserId);
    if (Number.isFinite(t) && t > 0) return t;
  }
  const lm = conv.lastMessage;
  if (lm && currentUserId != null) {
    const sid = Number(lm.senderId);
    const me = Number(currentUserId);
    if (
      Number.isFinite(sid) &&
      sid > 0 &&
      Number.isFinite(me) &&
      sid !== me
    ) {
      return sid;
    }
  }
  return null;
}

function setCache(
  map: Record<number, string>,
  convId: number,
  raw: string | null | undefined
): Record<number, string> {
  const u = normalizeAvatarUrl((raw ?? "").trim());
  if (!u) return map;
  if (map[convId] === u) return map;
  return { ...map, [convId]: u };
}

/**
 * 单聊会话「展示用头像」= 对方用户头像。
 * 仅通过：① 按 convId 的对方接口 ② 对方 userId 的好友资料接口 写入缓存；
 * 不再使用 lastMessage.senderAvatar、本地消息列表、conv.convAvatar、好友列表扫描。
 */
export const useSingleChatPeerAvatarStore = defineStore(
  "singleChatPeerAvatar",
  () => {
    const avatarByConvId = ref<Record<number, string>>({});

    function reset() {
      avatarByConvId.value = {};
      inflight.clear();
    }

    /**
     * 与 summary 衔接：summary 成功后调用，一次性写入所有单聊对方头像。
     */
    async function loadAllSingleChatPeerProfiles(): Promise<void> {
      try {
        const r = await conversationPeerApi.getSingleChatsPeerProfiles();
        if (r.code !== 200 || !Array.isArray(r.data)) return;
        let next = avatarByConvId.value;
        for (const row of r.data) {
          const cid = Math.floor(Number(row.convId));
          if (!Number.isFinite(cid) || cid <= 0) continue;
          const raw = row.peerUser?.userAvatar;
          const merged = setCache(next, cid, raw);
          if (merged !== next) next = merged;
        }
        if (next !== avatarByConvId.value) {
          avatarByConvId.value = next;
        }
      } catch {
        /* 静默，列表仍可走 ensurePeerAvatar 好友兜底 */
      }
    }

    function getAvatar(convId: number): string {
      const id = Math.floor(Number(convId));
      if (!Number.isFinite(id) || id <= 0) return "";
      return avatarByConvId.value[id] ?? "";
    }

    /**
     * 为单聊会话拉取对方头像并写入缓存（幂等）。
     */
    async function ensurePeerAvatar(
      conv: ConversationDetailDTO | null | undefined,
      currentUserId: number | null
    ): Promise<void> {
      if (!conv || Number(conv.convType) !== 1) return;
      const convId = Math.floor(Number(conv.convId));
      if (!Number.isFinite(convId) || convId <= 0) return;
      if (avatarByConvId.value[convId]) return;
      if (inflight.has(convId)) return;

      inflight.add(convId);
      try {
        try {
          const r = await conversationPeerApi.getSingleChatPeerByConvId(convId);
          if (r.code === 200 && r.data) {
            const next = setCache(
              avatarByConvId.value,
              convId,
              r.data.userAvatar
            );
            if (next !== avatarByConvId.value) {
              avatarByConvId.value = next;
            }
            if (avatarByConvId.value[convId]) return;
          }
        } catch {
          /* 接口未实现或网络错误：走好友资料 */
        }

        const peerId = inferPeerUserId(conv, currentUserId);
        if (peerId == null || !Number.isFinite(peerId) || peerId <= 0) {
          return;
        }

        const fr = await friendApi.getFriendInfoByUserIdAndFriendId(peerId);
        if (fr.code !== 200 || !fr.data) return;
        const next = setCache(
          avatarByConvId.value,
          convId,
          fr.data.friendAvatar
        );
        if (next !== avatarByConvId.value) {
          avatarByConvId.value = next;
        }
      } catch {
        /* 静默 */
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
