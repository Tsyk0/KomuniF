import { conversationCreateApi } from "@/apis/chat/conversation-create";
import {
  mapConvCreateResponse,
  type ConvCreateResult,
} from "./convCreateMapper";

function normalizeMemberIds(memberUserIds: number[]): number[] {
  return [...new Set(memberUserIds.map(Number).filter((id) => id > 0))];
}

/**
 * 创建或复用单聊会话：
 * - 若单聊已存在，返回已有 convId
 * - 若不存在，创建后返回新 convId
 */
export async function createOrGetSingleConversationNormalized(
  peerUserId: number
): Promise<ConvCreateResult> {
  const memberUserIds = normalizeMemberIds([peerUserId]);
  if (memberUserIds.length !== 1) {
    return { success: false, convId: null, message: "无效的用户 ID" };
  }

  // 单聊语义：有会话就复用并返回；没有才创建。
  const response = await conversationCreateApi.createOrGetConversation({
    single: true,
    memberUserIds,
  });
  return mapConvCreateResponse(response);
}

export async function createGroupConversationNormalized(
  convName: string,
  memberUserIds: number[]
): Promise<ConvCreateResult> {
  const name = (convName || "").trim();
  if (!name) {
    return { success: false, convId: null, message: "请填写群名称" };
  }

  const normalizedIds = normalizeMemberIds(memberUserIds);
  if (normalizedIds.length < 1) {
    return { success: false, convId: null, message: "请至少选择 1 位好友" };
  }

  const response = await conversationCreateApi.createOrGetConversation({
    single: false,
    memberUserIds: normalizedIds,
    convName: name,
  });
  return mapConvCreateResponse(response);
}
