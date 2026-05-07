import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import { ConversationMemberDisplayStatus } from "@/types/dto/conversation";

/**
 * 将摘要上的展示状态规范为 0/1/2；非法或缺失时按默认会话处理（与库 DEFAULT 1 一致）。
 * 使用场景：`prepareMainConversationSidebarList`、与 `normalizeConversationSummary` 对齐的侧栏逻辑。
 */
function coerceConversationMemberDisplayStatus(raw: unknown): number {
  const n = Number(raw);
  if (
    n === ConversationMemberDisplayStatus.PINNED ||
    n === ConversationMemberDisplayStatus.DEFAULT ||
    n === ConversationMemberDisplayStatus.HIDDEN
  ) {
    return n;
  }
  return ConversationMemberDisplayStatus.DEFAULT;
}

/**
 * 按会话更新时间新在前比较；时间相同则按未读数高在前，保证同时间下更重要会话优先。
 * 使用场景：置顶组内、默认组内的二级排序。
 */
function compareConversationSummaryRecency(
  a: ConversationSummaryDTO,
  b: ConversationSummaryDTO
): number {
  const ta = new Date(a.updateTime).getTime();
  const tb = new Date(b.updateTime).getTime();
  if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) {
    return tb - ta;
  }
  return Number(b.unreadCount || 0) - Number(a.unreadCount || 0);
}

/**
 * 主会话侧栏用的列表：剔除「不显示」项，置顶(0)整体在前，各段内按更新时间排序。
 * 使用场景：`ConversationList` 渲染、侧栏内关键词过滤前的数据源；与 `convStatus` 无关。
 */
export function prepareMainConversationSidebarList(
  items: ConversationSummaryDTO[]
): ConversationSummaryDTO[] {
  /** 主列表可见项：排除 displayStatus===2 的会话；用于侧栏与消息搜索的基准集合。 */
  const visible = items.filter(
    (row) =>
      coerceConversationMemberDisplayStatus(row.displayStatus) !==
      ConversationMemberDisplayStatus.HIDDEN
  );
  return [...visible].sort((a, b) => {
    const da = coerceConversationMemberDisplayStatus(a.displayStatus);
    const db = coerceConversationMemberDisplayStatus(b.displayStatus);
    const aPinned = da === ConversationMemberDisplayStatus.PINNED;
    const bPinned = db === ConversationMemberDisplayStatus.PINNED;
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }
    return compareConversationSummaryRecency(a, b);
  });
}

/**
 * 归档会话列表：仅保留 displayStatus===2，并按更新时间降序（同时间按未读数降序）。
 * 使用场景：ConversationList 归档文件夹展开后的会话渲染与搜索。
 */
export function prepareArchivedConversationSidebarList(
  items: ConversationSummaryDTO[]
): ConversationSummaryDTO[] {
  const archived = items.filter(
    (row) =>
      coerceConversationMemberDisplayStatus(row.displayStatus) ===
      ConversationMemberDisplayStatus.HIDDEN
  );
  return [...archived].sort(compareConversationSummaryRecency);
}
