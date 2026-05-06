/**
 * ChatSearchPanelInteraction
 * - 存放 ChatSearchPanel 的搜索交互方法。
 * - 负责关键词搜索、远端优先、本地兜底、分页与竞态控制。
 *
 * 方法目录（方法：功能）
 * - mapSearchSummaryToDisplayMessage：将搜索接口消息 DTO 转成可渲染消息对象。
 * - runChatMessageSearch：执行搜索流程（远端优先、本地兜底、加载更多、竞态保护）。
 * - buildChatSearchEmptyState：构建清空关键词后的初始状态。
 * - mapChatSearchErrorMessage：统一提取搜索错误文案。
 */

import type { DisplayMessage } from "@/entity/message";
import type { MessageSummaryDTO } from "@/types/dto/message";

const TEXT_MESSAGE_TYPE = "text";

function isTextMessage(dto: { messageType?: string } | null | undefined): boolean {
  return String(dto?.messageType || "").toLowerCase() === TEXT_MESSAGE_TYPE;
}

/** MessageSummaryDTO -> DisplayMessage（供搜索结果列表渲染）。 */
export function mapSearchSummaryToDisplayMessage(
  dto: MessageSummaryDTO
): DisplayMessage {
  return {
    messageId: dto.messageId,
    convId: dto.convId,
    senderId: dto.senderId,
    messageType: dto.messageType,
    messageContent: dto.messageContent,
    messageStatus: dto.messageStatus,
    isRecalled: dto.isRecalled,
    replyToMessageId: dto.replyToMessageId == null ? null : dto.replyToMessageId,
    replyQuoteAuthorHint: dto.replyToSenderDisplayName ?? null,
    replyQuoteContentHint: dto.replyToContentSnippet ?? null,
    atUserIds: dto.atUserIds == null ? null : dto.atUserIds,
    sendTime: dto.sendTime,
    recallTime: dto.recallTime == null ? null : dto.recallTime,
    senderAvatar: dto.senderAvatar == null ? null : dto.senderAvatar,
    senderName: dto.displayName,
    isSentByMe: dto.isSentByMe,
  };
}

/** 搜索请求统一执行（远端优先，本地兜底）。 */
export async function runChatMessageSearch(input: {
  // 搜索关键词
  keyword: string;
  // 当前会话 ID（为空时直接返回空结果）
  convId: number | null;
  // 目标页码（1=首次，>1=加载更多）
  nextPage: number;
  // 每页大小
  pageSize: number;
  // 本次请求序号
  requestId: number;
  // 当前最新请求序号（用于竞态判断）
  latestRequestId: number;
  // 当前结果来源（本地或远端）
  searchSource: "local" | "remote";
  // 当前已有结果（加载更多时会拼接）
  results: DisplayMessage[];
  // 本地搜索函数（IndexedDB）
  searchLocal: (convId: number, keyword: string, page: number, pageSize: number) => Promise<{
    messages: MessageSummaryDTO[];
    total: number;
  }>;
  // 远端搜索函数（HTTP）
  searchRemote: (params: {
    keyword: string;
    convId: number;
    page: number;
    pageSize: number;
    signal?: AbortSignal;
  }) => Promise<any>;
  // 取消信号（输入变化时中断旧请求）
  signal?: AbortSignal;
}): Promise<{
  // 本次结果是否仍然有效（false 说明被新请求覆盖）
  requestMatched: boolean;
  // 最终采用的数据来源
  source: "local" | "remote";
  // 最终可渲染结果
  results: DisplayMessage[];
  // 总条数
  total: number;
  // 当前页码
  page: number;
}> {
  const kw = input.keyword.trim();
  if (!kw || !input.convId) {
    return {
      requestMatched: input.requestId === input.latestRequestId,
      source: "remote",
      results: [],
      total: 0,
      page: 1,
    };
  }

  const isLoadMore = input.nextPage > 1;
  try {
    const resp = await input.searchRemote({
      keyword: kw,
      convId: input.convId,
      page: input.nextPage,
      pageSize: input.pageSize,
      signal: input.signal,
    });
    if (input.requestId !== input.latestRequestId) {
      return {
        requestMatched: false,
        source: "remote",
        results: input.results,
        total: 0,
        page: input.nextPage,
      };
    }
    const incomingRaw = (resp.data?.messages || []) as MessageSummaryDTO[];
    // 需求：搜索结果只展示文本消息；image/video/file 等类型不参与匹配（远端无法控制匹配时，前端做过滤兜底）
    const incoming = incomingRaw
      .filter(isTextMessage)
      .map(mapSearchSummaryToDisplayMessage);
    const totalFromResp = resp.data?.total == null ? 0 : resp.data.total;
    const pageFromResp = resp.data?.page == null ? input.nextPage : resp.data.page;
    return {
      requestMatched: true,
      source: "remote",
      results: isLoadMore ? input.results.concat(incoming) : incoming,
      total: totalFromResp,
      page: pageFromResp,
    };
  } catch (error: unknown) {
    const err = error as { name?: string; code?: string };
    // 主动取消请求不走本地兜底，避免产生过期结果闪烁
    if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED" || err?.name === "AbortError") {
      throw error;
    }

    const localPage = await input.searchLocal(
      input.convId,
      kw,
      input.nextPage,
      input.pageSize
    );
    if (input.requestId !== input.latestRequestId) {
      return {
        requestMatched: false,
        source: "local",
        results: input.results,
        total: localPage.total,
        page: input.nextPage,
      };
    }
    return {
      requestMatched: true,
      source: "local",
      results: isLoadMore
        ? input.results.concat(localPage.messages.map(mapSearchSummaryToDisplayMessage))
        : localPage.messages.map(mapSearchSummaryToDisplayMessage),
      total: localPage.total,
      page: input.nextPage,
    };
  }
}

/** 构建清空关键词后的初始状态。 */
export function buildChatSearchEmptyState(): {
  results: DisplayMessage[];
  total: number;
  page: number;
  error: string | null;
  source: "remote";
} {
  return {
    results: [],
    total: 0,
    page: 1,
    error: null,
    source: "remote",
  };
}

/** 统一提取搜索失败文案。 */
export function mapChatSearchErrorMessage(error: unknown): string | null {
  const err = error as { name?: string; code?: string; message?: string };
  if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return null;
  if (err?.name === "AbortError") return null;
  return err?.message ? `搜索失败：${err.message}` : "搜索失败";
}
