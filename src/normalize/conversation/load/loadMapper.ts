import type {
  LastMessageInfo,
  ConversationSummaryDTO,
} from "@/types/dto/conversation";
import type { FriendSummaryDTO } from "@/types/dto/friend";
import type { SingleChatPeerProfileItemDTO } from "@/types/dto/single-chat-peer";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";

const DEFAULT_SINGLE_NAME = "未命名会话";
const DEFAULT_GROUP_NAME = "未命名群聊";
const DEFAULT_SYSTEM_NAME = "会话";
const DEFAULT_LAST_MESSAGE = "[暂无消息]";

/** 统一去空白，避免各处重复 trim 判空。 */
const normalizeText = (value?: string | null): string => (value || "").trim();

/** 当 lastMessage 缺失时，提供一条可展示的默认消息对象。 */
function buildFallbackLastMessage(updateTime: string): LastMessageInfo {
  return {
    messageId: 0,
    senderId: 0,
    messageType: "text",
    messageContent: DEFAULT_LAST_MESSAGE,
    senderDisplayName: "",
    senderAvatar: null,
    sendTime: updateTime || new Date().toISOString(),
  };
}

/**
 * 单聊会话名兜底策略：
 * 1) 后端 convName
 * 2) 好友备注名
 * 3) 对端昵称（peer profile）
 * 4) 好友昵称
 * 5) 默认文案
 */
function resolveSingleChatName(
  conv: ConversationSummaryDTO,
  friendInfo?: FriendSummaryDTO,
  peerProfile?: SingleChatPeerProfileItemDTO
): string {
  const serverName = normalizeText(conv.convName);
  if (serverName) return serverName;

  const remarkName = normalizeText(friendInfo?.remarkName);
  if (remarkName) return remarkName;

  const peerNickname = normalizeText(peerProfile?.peerUser?.userNickname);
  if (peerNickname) return peerNickname;

  const friendNickname = normalizeText(friendInfo?.friendNickname);
  if (friendNickname) return friendNickname;

  return DEFAULT_SINGLE_NAME;
}

/** 群聊会话名兜底策略：私有备注名 -> 服务端群名 -> 默认文案。 */
function resolveGroupChatName(conv: ConversationSummaryDTO): string {
  const privateDisplayName = normalizeText(conv.privateDisplayName);
  if (privateDisplayName) return privateDisplayName;

  const serverName = normalizeText(conv.convName);
  if (serverName) return serverName;

  return DEFAULT_GROUP_NAME;
}

/** 构建好友映射：friendId -> FriendSummaryDTO。 */
export function buildFriendMap(
  items: FriendSummaryDTO[]
): Map<number, FriendSummaryDTO> {
  const map = new Map<number, FriendSummaryDTO>();
  for (const item of items) {
    if (Number.isFinite(Number(item.friendId))) {
      map.set(Number(item.friendId), item);
    }
  }
  return map;
}

/** 构建单聊对端资料映射：convId -> SingleChatPeerProfileItemDTO。 */
export function buildPeerProfileMap(
  items: SingleChatPeerProfileItemDTO[]
): Map<number, SingleChatPeerProfileItemDTO> {
  const map = new Map<number, SingleChatPeerProfileItemDTO>();
  for (const item of items) {
    if (Number.isFinite(Number(item.convId))) {
      map.set(Number(item.convId), item);
    }
  }
  return map;
}

/**
 * 推断单聊对端 userId（用于头像兜底等按用户维度接口）。
 * 优先使用后端返回 targetUserId，缺失时再从最后一条消息 senderId 推断。
 */
export function inferPeerUserId(
  conv: ConversationSummaryDTO,
  currentUserId: number | null
): number | null {
  if (conv.targetUserId != null && String(conv.targetUserId).trim() !== "") {
    const target = Number(conv.targetUserId);
    if (Number.isFinite(target) && target > 0) return target;
  }
  const lastMessage = conv.lastMessage;
  if (lastMessage && currentUserId != null) {
    const senderId = Number(lastMessage.senderId);
    const me = Number(currentUserId);
    if (
      Number.isFinite(senderId) &&
      senderId > 0 &&
      Number.isFinite(me) &&
      senderId !== me
    ) {
      return senderId;
    }
  }
  return null;
}

/** 头像 URL 统一标准化，确保最终可直接用于 img src。 */
export function normalizePeerAvatarUrl(raw: string | null | undefined): string {
  return normalizeAvatarUrl((raw || "").trim());
}

/**
 * 会话摘要归一化主入口：
 * - 规范 unreadCount
 * - 保证 lastMessage 可展示
 * - 对 convName/convAvatar 做兜底
 */
export function normalizeConversationSummary(
  conv: ConversationSummaryDTO,
  friendInfo?: FriendSummaryDTO,
  peerProfile?: SingleChatPeerProfileItemDTO
): ConversationSummaryDTO {
  const convType = Number(conv.convType);
  const normalized: ConversationSummaryDTO = {
    ...conv,
    unreadCount: Number.isFinite(Number(conv.unreadCount))
      ? Math.max(0, Number(conv.unreadCount))
      : 0,
    lastMessage: conv.lastMessage || buildFallbackLastMessage(conv.updateTime),
  };

  if (convType === 1) {
    normalized.convName = resolveSingleChatName(conv, friendInfo, peerProfile);
    if (!normalizeText(normalized.convAvatar)) {
      normalized.convAvatar = peerProfile?.peerUser?.userAvatar || null;
    }
  } else if (convType === 2) {
    normalized.convName = resolveGroupChatName(conv);
  } else {
    normalized.convName = normalizeText(conv.convName) || DEFAULT_SYSTEM_NAME;
  }

  if (!normalizeText(normalized.lastMessage?.messageContent)) {
    normalized.lastMessage = {
      ...(normalized.lastMessage || buildFallbackLastMessage(conv.updateTime)),
      messageContent: DEFAULT_LAST_MESSAGE,
    };
  }

  return normalized;
}
