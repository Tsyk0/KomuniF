/**
 * ChatSearchPanelInteraction
 * - 存放 ChatSearchPanel 的搜索交互方法。
 * - 负责关键词搜索、本地优先、远端回退、分页与竞态控制。
 *
 * 方法目录（方法：功能）
 * - mapSearchSummaryToDisplayMessage：将搜索接口消息 DTO 转成可渲染消息对象。
 * - runChatMessageSearch：执行搜索流程（本地优先、远端回退、加载更多、竞态保护）。
 * - buildChatSearchEmptyState：构建清空关键词后的初始状态。
 * - mapChatSearchErrorMessage：统一提取搜索错误文案。
 */

import type { DisplayMessage } from "@/entity/message";
import type { MessageSummaryDTO } from "@/types/dto/message";

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
    atUserIds: dto.atUserIds == null ? null : dto.atUserIds,
    sendTime: dto.sendTime,
    recallTime: dto.recallTime == null ? null : dto.recallTime,
    senderAvatar: dto.senderAvatar == null ? null : dto.senderAvatar,
    senderName: dto.displayName,
    isSentByMe: dto.isSentByMe,
  };
}

/** 搜索请求统一执行（本地优先，远端回退）。 */
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
  if (!isLoadMore) {
    const localFirst = await input.searchLocal(
      input.convId,
      kw,
      1,
      input.pageSize
    );
    if (input.requestId !== input.latestRequestId) {
      return {
        requestMatched: false,
        source: input.searchSource,
        results: input.results,
        total: 0,
        page: input.nextPage,
      };
    }
    if (localFirst.total > 0) {
      return {
        requestMatched: true,
        source: "local",
        results: localFirst.messages.map(mapSearchSummaryToDisplayMessage),
        total: localFirst.total,
        page: 1,
      };
    }
  }

  if (isLoadMore && input.searchSource === "local") {
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
      results: input.results.concat(
        localPage.messages.map(mapSearchSummaryToDisplayMessage)
      ),
      total: localPage.total,
      page: input.nextPage,
    };
  }

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
  const incoming = ((resp.data?.messages || []) as MessageSummaryDTO[]).map(
    mapSearchSummaryToDisplayMessage
  );
  const totalFromResp = resp.data?.total == null ? 0 : resp.data.total;
  const pageFromResp = resp.data?.page == null ? input.nextPage : resp.data.page;
  return {
    requestMatched: true,
    source: "remote",
    results: isLoadMore ? input.results.concat(incoming) : incoming,
    total: totalFromResp,
    page: pageFromResp,
  };
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
