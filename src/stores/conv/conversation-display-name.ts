// File: src/stores/conv/conversation-display-name.ts
import type { ConversationDetailDTO } from "@/types/dto/conversation";
import { useFriendStore } from "@/stores/friend/show-friend";
import { displayNameResolver } from "@/capabilities/show-display-name";

/** 群聊未设置会话名时的默认文案 */
export const DEFAULT_GROUP_CHAT_DISPLAY_NAME = "群聊会话";

/**
 * 统一「人」在会话语境下的展示优先级：群成员昵称 > 好友备注 > 用户昵称。
 * 单聊会话标题只走备注/用户昵称时，不传 `groupMemberNickname` 即可（该级自动跳过）。
 */
export function resolvePersonDisplayName(parts: {
  remarkName?: string | null;
  userNickname?: string | null;
}): string {
  return displayNameResolver.person({
    remarkName: parts.remarkName,
    userNickname: parts.userNickname,
    fallbackName: "用户",
  });
}

/** 策略上下文：同一会话 DTO + 当前用户，可选「刚创建单聊」时的对方 ID 覆盖 */
export type ConversationTitleResolveContext = {
  conv: ConversationDetailDTO;
  currentUserId: number | null;
  peerUserIdOverride?: number | null;
};

export type ConversationTitleStrategy = {
  resolve(ctx: ConversationTitleResolveContext): string;
};

function inferPeerUserId(ctx: ConversationTitleResolveContext): number | null {
  const { conv, currentUserId, peerUserIdOverride } = ctx;
  if (conv.targetUserId != null && String(conv.targetUserId).trim() !== "") {
    const t = Number(conv.targetUserId);
    if (Number.isFinite(t) && t > 0) return t;
  }
  if (
    peerUserIdOverride != null &&
    String(peerUserIdOverride).trim() !== ""
  ) {
    const o = Number(peerUserIdOverride);
    if (Number.isFinite(o) && o > 0) return o;
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

const singleChatTitleStrategy: ConversationTitleStrategy = {
  resolve(ctx) {
    const { conv, currentUserId } = ctx;
    const peerId = inferPeerUserId(ctx);
    let peerRemarkName = "";
    let peerNickname = "";
    let isPeerFriend = false;
    if (peerId != null) {
      const pid = Number(peerId);
      const friendStore = useFriendStore();
      const f = friendStore.friends.find(
        (x) => Number(x.friendId) === pid || Number(x.userId) === pid
      );
      if (f) {
        isPeerFriend = true;
        peerRemarkName = (f.remarkName || "").trim();
        peerNickname = (f.nickname || "").trim();
      }
    }
    return displayNameResolver.conversationTitle({
      convType: 1,
      convName: conv.convName,
      privateDisplayName: conv.privateDisplayName,
      isPeerFriend,
      peerRemarkName,
      peerNickname:
        peerNickname ||
        (conv.lastMessage &&
        currentUserId != null &&
        Number(conv.lastMessage.senderId) !== Number(currentUserId)
          ? conv.lastMessage.senderDisplayName
          : ""),
      defaultGroupTitle: DEFAULT_GROUP_CHAT_DISPLAY_NAME,
    });
  },
};

const groupChatTitleStrategy: ConversationTitleStrategy = {
  resolve({ conv }) {
    return displayNameResolver.conversationTitle({
      convType: 2,
      convName: conv.convName,
      privateDisplayName: conv.privateDisplayName,
      defaultGroupTitle: DEFAULT_GROUP_CHAT_DISPLAY_NAME,
    });
  },
};

const unknownConvTypeTitleStrategy: ConversationTitleStrategy = {
  resolve({ conv }) {
    return displayNameResolver.conversationTitle({
      convType: Number(conv.convType),
      convName: conv.convName,
      privateDisplayName: conv.privateDisplayName,
      defaultGroupTitle: DEFAULT_GROUP_CHAT_DISPLAY_NAME,
    });
  },
};

/** 按 convType 分派（状态/策略表），避免在组件与多个 store 里手写分支 */
const titleStrategyByConvType: Record<number, ConversationTitleStrategy> = {
  1: singleChatTitleStrategy,
  2: groupChatTitleStrategy,
};

/**
 * 列表项、聊天顶栏等处的会话标题。
 * 单聊：服务端名 →（好友数据：备注→昵称）→ 最后消息展示名 → privateDisplayName。
 * 群聊：服务端名 → privateDisplayName → 默认「群聊会话」。
 */
export function resolveConversationDisplayName(
  conv: ConversationDetailDTO,
  currentUserId: number | null = null,
  peerUserIdOverride?: number | null
): string {
  const strategy =
    titleStrategyByConvType[conv.convType] || unknownConvTypeTitleStrategy;
  return strategy.resolve({
    conv,
    currentUserId,
    peerUserIdOverride,
  });
}
