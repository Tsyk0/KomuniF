// File: src/composables/useConversationDisplay.ts
import {
  computed,
  watch,
  type MaybeRefOrGetter,
  toValue,
} from "vue";
import { useAuthStore } from "@/stores/auth";
import type { ConversationDetailDTO } from "@/types/dto/conversation";
import { resolveConversationDisplayName } from "@/stores/chat/conversation-display-name";
import { normalizeAvatarUrl } from "@/utils/avatar-url";
import { useSingleChatPeerAvatarStore } from "@/stores/chat/single-chat-peer-avatar";

/**
 * 会话列表 / 聊天顶栏：展示名 + 头像。
 * 单聊（convType===1）：头像仅来自 {@link useSingleChatPeerAvatarStore}（按 convId 对方接口，失败则按对方 userId 拉好友资料），
 * 不使用 convAvatar、消息 senderAvatar、好友列表扫描等兜底。
 */
export function useConversationDisplay(
  conversation: MaybeRefOrGetter<ConversationDetailDTO | null | undefined>
) {
  const authStore = useAuthStore();
  const peerAvatarStore = useSingleChatPeerAvatarStore();

  watch(
    () => toValue(conversation),
    (c) => {
      if (c && Number(c.convType) === 1) {
        void peerAvatarStore.ensurePeerAvatar(c, authStore.user?.userId || null);
      }
    },
    { immediate: true }
  );

  const displayName = computed(() => {
    const c = toValue(conversation);
    if (!c) return "";
    return resolveConversationDisplayName(
      c,
      authStore.user?.userId || null
    );
  });

  const avatar = computed(() => {
    const c = toValue(conversation);
    if (!c) return "";
    if (Number(c.convType) === 1) {
      // 直接读 avatarByConvId，保证异步 ensurePeerAvatar 写入后 computed 会更新
      const id = Math.floor(Number(c.convId));
      return peerAvatarStore.avatarByConvId[id] || "";
    }
    return normalizeAvatarUrl(c.convAvatar || "");
  });

  return { displayName, avatar };
}
