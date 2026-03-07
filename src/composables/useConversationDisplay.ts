import { computed, type MaybeRefOrGetter, toValue, type Ref } from "vue";
import { useFriendStore } from "@/stores/friend/show-friend";
import type { ConversationDetailDTO } from "@/types/dto/conversation";

/**
 * 根据会话与好友列表解析展示名称与头像（与 ConversationItem 一致）。
 * 单聊：好友备注/昵称优先；群聊：会话名。头像为会话头像。
 */
export function useConversationDisplay(
  conversation: MaybeRefOrGetter<ConversationDetailDTO | null | undefined>
) {
  const friendStore = useFriendStore();

  const displayName = computed(() => {
    const c = toValue(conversation);
    if (!c) return "";
    if (c.convType === 1) {
      const friendId = c.targetUserId;
      if (friendId != null) {
        const friend = friendStore.friends.find((f) => f.friendId === friendId);
        if (friend) return friend.displayName;
      }
      return c.convName || c.privateDisplayName || "";
    }
    return c.convName || "";
  });

  const avatar = computed(() => {
    const c = toValue(conversation);
    return c?.convAvatar ?? "";
  });

  return { displayName, avatar };
}
