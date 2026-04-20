// File: src/capabilities/show-display-avatar/useConversationDisplay.ts
import {
  computed,
  watch,
  type MaybeRefOrGetter,
  toValue,
} from "vue";
import { useAuthStore } from "@/stores/auth";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import { displayNameResolver } from "@/capabilities/show-display-name";
import { useSingleChatPeerAvatarStore } from "@/store/conv-peer-avatar";
import { resolveConversationAvatarDisplayUrl } from "./resolvers";

const SINGLE_CHAT_TYPE = 1;

/**
 * 会话列表 / 聊天顶栏：展示名 + 头像。
 * 单聊（convType===1）：头像仅来自 peer 头像 store（按 convId 对方接口，失败则按对方 userId 拉好友资料），
 * 不使用 convAvatar、消息 senderAvatar、好友列表扫描等兜底。
 */
export function useConversationDisplay(
  conversation: MaybeRefOrGetter<ConversationSummaryDTO | null | undefined>
) {
  const authStore = useAuthStore();
  const peerAvatarStore = useSingleChatPeerAvatarStore();
  const currentUserId = computed(() => authStore.user?.userId || null);
  const conversationRef = computed(() => toValue(conversation));

  // 会话进入视图后，为单聊按需补齐对方头像缓存（批量加载失败时可兜底）。
  watch(
    conversationRef,
    (currentConversation) => {
      if (
        currentConversation &&
        Number(currentConversation.convType) === SINGLE_CHAT_TYPE
      ) {
        void peerAvatarStore.ensurePeerAvatar(
          currentConversation,
          currentUserId.value
        );
      }
    },
    { immediate: true }
  );

  const displayName = computed(() => {
    if (!conversationRef.value) return "";
    const conv = conversationRef.value;
    const convName = (conv.convName || "").trim();
    if (convName) return convName;
    return displayNameResolver.conversationTitle({
      convType: conv.convType,
      convName: conv.convName,
      privateDisplayName: conv.privateDisplayName,
      defaultGroupTitle: "会话",
    });
  });

  const avatar = computed(() => {
    return resolveConversationAvatarDisplayUrl(
      conversationRef.value,
      peerAvatarStore.avatarByConvId
    );
  });

  return { displayName, avatar };
}
