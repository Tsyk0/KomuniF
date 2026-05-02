// src/normalize/conversation/update/groupMemberManageService.ts
import axios from "axios";
import { manageConversationApi } from "@/apis/chat/manage-conversation";

/**
 * 从 axios 错误体取出后端 message；用于 400 等 HTTP 错误与业务文案对齐。
 */
function throwNormalizedManageError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    const msg = (data?.message || "").trim();
    throw new Error(msg || fallback);
  }
  if (error instanceof Error && error.message) throw error;
  throw new Error(fallback);
}

/**
 * 群主踢出群成员。
 * 使用场景：GroupConvInfo 群管理；失败时抛出 Error(message) 供 toast；成功返回后端文案。
 */
export async function removeGroupMemberNormalized(
  convId: number,
  targetUserId: number
): Promise<string> {
  try {
    const r = await manageConversationApi.removeConversationMember(
      convId,
      targetUserId
    );
    if (r.code !== 200) {
      throw new Error(r.message || "踢出失败");
    }
    return (r.message || "").trim() || "已踢出该成员";
  } catch (e) {
    throwNormalizedManageError(e, "踢出失败，请稍后重试");
  }
}

/**
 * 禁言群成员。
 */
export async function muteGroupMemberNormalized(
  convId: number,
  targetUserId: number
): Promise<string> {
  try {
    const r = await manageConversationApi.muteConversationMember(
      convId,
      targetUserId
    );
    if (r.code !== 200) {
      throw new Error(r.message || "禁言失败");
    }
    return (r.message || "").trim() || "已禁言";
  } catch (e) {
    throwNormalizedManageError(e, "禁言失败，请稍后重试");
  }
}

/**
 * 解除群成员禁言。
 */
export async function unmuteGroupMemberNormalized(
  convId: number,
  targetUserId: number
): Promise<string> {
  try {
    const r = await manageConversationApi.unmuteConversationMember(
      convId,
      targetUserId
    );
    if (r.code !== 200) {
      throw new Error(r.message || "解除禁言失败");
    }
    return (r.message || "").trim() || "已解除禁言";
  } catch (e) {
    throwNormalizedManageError(e, "解除禁言失败，请稍后重试");
  }
}
