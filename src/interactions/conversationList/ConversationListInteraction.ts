/**
 * ConversationListInteraction
 * - 存放 ConversationList 组件的界面交互方法。
 * - 这些方法负责“用户点了什么后界面要做什么”，不负责 DTO 字段转换。
 *
 * 方法目录（方法：功能）
 * - searchConversationMatchedIdsByMessages：按关键词在本地消息库反查命中的会话 ID。
 * - openConversationByClick：处理点击会话后的选择、清空、加载与已读动作。
 */

import { findConversationIdsByKeywordFromDB } from "@/commons/utils/local-db";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";

/** 按关键词在 IndexedDB 里搜索命中的会话 ID 集合。 */
export async function searchConversationMatchedIdsByMessages(
  keyword: string,
  conversations: ConversationSummaryDTO[]
): Promise<Set<number>> {
  if (!keyword) return new Set<number>();
  const normalizedKeyword = keyword.toLowerCase();
  const matchedIds = new Set<number>();
  try {
    const localMatchedConvIds = await findConversationIdsByKeywordFromDB(
      normalizedKeyword,
      { convIds: conversations.map((c) => c.convId) }
    );
    localMatchedConvIds.forEach((id) => matchedIds.add(id));
  } catch (error) {
    console.warn("IndexedDB search failed:", error);
  }
  return matchedIds;
}

/** 处理“打开会话”点击后的连续动作。 */
export async function openConversationByClick(input: {
  // 被点击的会话 ID
  convId: number;
  // 当前已选中的会话 ID
  currentConversationId: number | null;
  // 设置当前会话
  selectConversation: (convId: number) => void;
  // 清空旧消息
  clearMessages: () => void;
  // 加载会话消息
  loadMessages: (convId: number) => Promise<void>;
  // 进入会话并清空本地未读展示
  notifyConversationEntered: (convId: number) => void;
  // 通知父组件“会话被点击”
  emitConversationClick: (convId: number) => void;
}): Promise<void> {
  const isSwitchingConversation = input.currentConversationId !== input.convId;
  input.selectConversation(input.convId);
  if (isSwitchingConversation) {
    input.clearMessages();
  }
  input.notifyConversationEntered(input.convId);
  await input.loadMessages(input.convId);
  input.emitConversationClick(input.convId);
}
