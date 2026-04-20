import { conversationSummaryApi } from "@/apis/chat/conversation-summary";
import { conversationPeerApi } from "@/apis/chat/conversation-peer";
import { friendApi } from "@/apis/friend";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import type { FriendSummaryDTO } from "@/types/dto/friend";
import type { SingleChatPeerProfileItemDTO } from "@/types/dto/single-chat-peer";
import {
  buildFriendMap,
  buildPeerProfileMap,
  inferPeerUserId,
  normalizePeerAvatarUrl,
  normalizeConversationSummary,
} from "./loadMapper";

/**
 * 加载好友映射（friendId -> friend summary）。
 * 用于单聊会话名兜底：convName 为空时优先使用好友备注名。
 */
async function loadFriendMap(): Promise<Map<number, FriendSummaryDTO>> {
  try {
    const response = await friendApi.getFriendListByUserId();
    if (response.code !== 200 || !Array.isArray(response.data)) {
      return new Map<number, FriendSummaryDTO>();
    }
    return buildFriendMap(response.data);
  } catch {
    return new Map<number, FriendSummaryDTO>();
  }
}

/**
 * 加载单聊对端资料映射（convId -> peer profile）。
 * 用于会话列表首屏归一化：补单聊 convName / convAvatar。
 */
async function loadPeerProfileMap(): Promise<Map<number, SingleChatPeerProfileItemDTO>> {
  try {
    const response = await conversationPeerApi.getSingleChatsPeerProfiles();
    if (response.code !== 200 || !Array.isArray(response.data)) {
      return new Map<number, SingleChatPeerProfileItemDTO>();
    }
    return buildPeerProfileMap(response.data);
  } catch {
    return new Map<number, SingleChatPeerProfileItemDTO>();
  }
}

/**
 * 会话列表全量/单条加载入口：
 * - 拉取会话摘要
 * - 拉取好友映射与单聊对端资料映射
 * - 统一交给 mapper 产出“可直接展示”的会话数据
 */
export async function loadConversationsNormalized(
  convId?: number
): Promise<ConversationSummaryDTO[]> {
  const [summaryResponse, friendMap, peerProfileMap] = await Promise.all([
    conversationSummaryApi.getConversationSummaries(convId),
    loadFriendMap(),
    loadPeerProfileMap(),
  ]);

  if (summaryResponse.code !== 200) {
    throw new Error(summaryResponse.message || "加载会话失败");
  }

  const summaries = Array.isArray(summaryResponse.data) ? summaryResponse.data : [];

  return summaries.map((conv) => {
    const targetUserId = Number(conv.targetUserId);
    const friendInfo = Number.isFinite(targetUserId) ? friendMap.get(targetUserId) : undefined;
    const peerProfile = peerProfileMap.get(conv.convId);
    return normalizeConversationSummary(conv, friendInfo, peerProfile);
  });
}

/**
 * 批量加载当前用户所有单聊会话的对端头像（convId -> avatarUrl）。
 *
 * 说明：
 * - 这是“首屏批量填充”路径，和 loadConversationsNormalized 互补。
 * - 即使会话摘要里已带 convAvatar，也保留这条批量链路，
 *   以便消息行头像、聊天头部等场景复用统一缓存。
 */
export async function loadAllSingleChatPeerAvatarMapNormalized(): Promise<
  Record<number, string>
> {
  try {
    const response = await conversationPeerApi.getSingleChatsPeerProfiles();
    if (response.code !== 200 || !Array.isArray(response.data)) {
      return {};
    }
    const result: Record<number, string> = {};
    for (const row of response.data) {
      const convId = Math.floor(Number(row.convId));
      if (!Number.isFinite(convId) || convId <= 0) continue;
      const avatar = normalizePeerAvatarUrl(row.peerUser?.userAvatar);
      if (avatar) {
        result[convId] = avatar;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * 按 convId 动态补齐单聊对端头像（单条兜底）。
 *
 * 典型场景：
 * - 新创建单聊后只刷新一条会话
 * - 批量 peer-profiles 接口失败后的按需补齐
 * - 运行期某条会话延迟出现，需要即时补头像
 *
 * 策略：
 * 1) 先尝试按 convId 拉对端资料
 * 2) 失败时根据会话内容推断 peerUserId，再走好友资料兜底
 */
export async function loadSingleChatPeerAvatarNormalized(
  conv: ConversationSummaryDTO,
  currentUserId: number | null
): Promise<string> {
  const convId = Math.floor(Number(conv.convId));
  if (!Number.isFinite(convId) || convId <= 0) return "";

  try {
    const peerResponse = await conversationPeerApi.getSingleChatPeerByConvId(convId);
    if (peerResponse.code === 200 && peerResponse.data) {
      const avatar = normalizePeerAvatarUrl(peerResponse.data.userAvatar);
      if (avatar) return avatar;
    }
  } catch {
    // ignore and fallback to friend profile
  }

  const peerUserId = inferPeerUserId(conv, currentUserId);
  if (peerUserId == null || !Number.isFinite(peerUserId) || peerUserId <= 0) {
    return "";
  }

  try {
    const friendResponse = await friendApi.getFriendInfoByUserIdAndFriendId(peerUserId);
    if (friendResponse.code !== 200 || !friendResponse.data) return "";
    return normalizePeerAvatarUrl(friendResponse.data.friendAvatar);
  } catch {
    return "";
  }
}
