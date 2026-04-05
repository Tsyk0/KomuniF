import type { ConversationDetailDTO } from "@/types/dto/conversation";
import { useFriendStore } from "@/stores/friend/show-friend";

/** 群聊未设置会话名时的默认文案 */
export const DEFAULT_GROUP_CHAT_DISPLAY_NAME = "群聊会话";

/**
 * 统一「人」在会话语境下的展示优先级：群成员昵称 > 好友备注 > 用户昵称。
 * 单聊会话标题只走备注/用户昵称时，不传 `groupMemberNickname` 即可（该级自动跳过）。
 */
export function resolvePersonDisplayName(parts: {
  groupMemberNickname?: string | null;
  remarkName?: string | null;
  userNickname?: string | null;
}): string {
  const groupNick = (parts.groupMemberNickname ?? "").trim();
  if (groupNick) return groupNick;
  const remark = (parts.remarkName ?? "").trim();
  if (remark) return remark;
  return (parts.userNickname ?? "").trim();
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

/** 用 GET /friends 落在 friendStore 的数据，按 {@link resolvePersonDisplayName} 解析对方（无群昵称级） */
function peerTitleFromFriendList(peerUserId: number): string {
  const pid = Number(peerUserId);
  if (!Number.isFinite(pid) || pid <= 0) return "";
  const friendStore = useFriendStore();
  const f = friendStore.friends.find(
    (x) => Number(x.friendId) === pid || Number(x.userId) === pid
  );
  if (!f) return "";
  return resolvePersonDisplayName({
    remarkName: f.remarkName,
    userNickname: f.nickname,
  });
}

const singleChatTitleStrategy: ConversationTitleStrategy = {
  resolve(ctx) {
    const { conv, currentUserId } = ctx;
    /** 单聊优先展示「对方」昵称/备注，再退回服务端会话名，避免 convName 沿用群聊默认文案导致首字占位错乱 */
    const peerId = inferPeerUserId(ctx);
    if (peerId != null) {
      const fromFriends = peerTitleFromFriendList(peerId);
      if (fromFriends) return fromFriends;
    }

    const lm = conv.lastMessage;
    if (
      lm &&
      currentUserId != null &&
      lm.senderId !== currentUserId &&
      (lm.senderDisplayName || "").trim()
    ) {
      return lm.senderDisplayName.trim();
    }

    const serverName = (conv.convName || "").trim();
    if (serverName) return serverName;

    const priv = (conv.privateDisplayName || "").trim();
    if (priv) return priv;

    return "";
  },
};

const groupChatTitleStrategy: ConversationTitleStrategy = {
  resolve({ conv }) {
    const serverName = (conv.convName || "").trim();
    if (serverName) return serverName;
    const priv = (conv.privateDisplayName || "").trim();
    if (priv) return priv;
    return DEFAULT_GROUP_CHAT_DISPLAY_NAME;
  },
};

const unknownConvTypeTitleStrategy: ConversationTitleStrategy = {
  resolve({ conv }) {
    return (conv.convName || "").trim();
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
    titleStrategyByConvType[conv.convType] ?? unknownConvTypeTitleStrategy;
  return strategy.resolve({
    conv,
    currentUserId,
    peerUserIdOverride,
  });
}
