/**
 * UserSearchInteraction
 * - 存放 UserSearch 组件的界面交互方法。
 * - 负责搜索输入节流、翻页拼接、错误映射、详情区交互判定等纯交互逻辑。
 *
 * 方法目录（方法：功能）
 * - resolveSelfUserId：规范化当前登录用户 ID。
 * - buildSyncHint：构建“结果同步中”提示文案。
 * - canLoadMoreUsers：判断当前是否可继续加载更多。
 * - resolveDetailNickname：构建用户详情昵称展示文案。
 * - resolveDetailInitial：生成详情头像占位首字母。
 * - resolveDetailGender：生成详情性别文案。
 * - isSelfUser：判断目标用户是否是当前登录用户。
 * - mergeUsersWithoutDuplicate：分页拼接用户并去重。
 * - mapUserSearchErrorMessage：统一提取搜索错误文案。
 * - mapFriendRequestErrorMessage：统一提取好友申请错误文案。
 * - shouldClearUserDetailOnPaneClick：判断左侧空白点击是否需要收起详情。
 * - executeUserSearchFlow：执行用户搜索单次请求并返回可更新状态。
 * - executeFriendRequestFlow：执行好友申请并返回统一结果。
 */

import type { User } from "@/entity/user";

/** 规范化当前登录用户 ID。 */
export function resolveSelfUserId(userId: unknown): number | null {
  if (userId == null) return null;
  const n = Number(userId);
  return Number.isFinite(n) ? n : null;
}

/** 构建“结果同步中”提示文案。 */
export function buildSyncHint(total: number, loaded: number): string {
  if (!(total > 0 && loaded < total && loaded > 0)) return "";
  const delta = total - loaded;
  if (delta <= 0) return "";
  return `共约 ${total} 条命中，当前已加载 ${loaded} 条；若数量不一致可能为数据同步中。`;
}

/** 判断当前是否可继续加载更多。 */
export function canLoadMoreUsers(input: {
  // 当前是否已有有效关键词
  hasKeyword: boolean;
  // 当前列表是否处于报错状态
  hasError: boolean;
  // 已加载条数
  loaded: number;
  // 结果总条数
  total: number;
}): boolean {
  if (!input.hasKeyword || input.hasError) return false;
  return input.loaded < input.total;
}

/** 构建用户详情昵称展示文案。 */
export function resolveDetailNickname(user: User | null): string {
  if (!user) return "";
  return (
    user.userNickname?.trim() || `用户 ${user.userId == null ? "" : user.userId}`
  );
}

/** 生成详情头像占位首字母。 */
export function resolveDetailInitial(nickname: string): string {
  return nickname.charAt(0).toUpperCase() || "?";
}

/** 生成详情性别文案。 */
export function resolveDetailGender(userGender: number | undefined): string {
  if (userGender === 1) return "男";
  if (userGender === 2) return "女";
  return "未知";
}

/** 判断目标用户是否是当前登录用户。 */
export function isSelfUser(selfUserId: number | null, user: User): boolean {
  if (selfUserId == null || user.userId == null) return false;
  return Number(user.userId) === selfUserId;
}

/** 分页拼接用户并按 userId 去重。 */
export function mergeUsersWithoutDuplicate(prev: User[], next: User[]): User[] {
  const merged = [...prev];
  const seen = new Set(merged.map((u) => Number(u.userId)));
  for (const u of next) {
    const id = Number(u.userId);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(u);
    }
  }
  return merged;
}

/** 统一提取搜索失败文案。 */
export function mapUserSearchErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || "网络异常，请稍后重试";
}

/** 统一提取好友申请失败文案。 */
export function mapFriendRequestErrorMessage(error: unknown): string {
  const err = error as {
    response?: { status?: number; data?: { message?: string; code?: number } };
    message?: string;
  };
  const status = err.response?.status;
  const data = err.response?.data;
  if (status === 400 && data?.message) return data.message;
  if (status === 401) return data?.message || "请先登录";
  return data?.message || err.message || "发送失败，请稍后重试";
}

/** 判断左侧空白点击是否需要收起详情。 */
export function shouldClearUserDetailOnPaneClick(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (
    target.closest(".user-search-result-item") ||
    target.closest("input") ||
    target.closest("textarea") ||
    target.closest("button") ||
    target.closest(".user-search-field")
  ) {
    return false;
  }
  return true;
}

/** 执行用户搜索单次请求并返回下一步状态。 */
export async function executeUserSearchFlow(input: {
  keyword: string;
  reset: boolean;
  page: number;
  pageSize: number;
  lastSearchedKeyword: string;
  prevUsers: User[];
  searchUsers: (params: { keyword: string; page: number; pageSize: number }) => Promise<any>;
}): Promise<{
  clearAll?: boolean;
  listError?: string;
  users?: User[];
  total?: number;
  lastSearchedKeyword?: string;
  rollbackPage?: boolean;
}> {
  const kw = input.keyword.trim();
  if (!kw) {
    return { clearAll: true };
  }
  const keywordForRequest = input.reset ? kw : input.lastSearchedKeyword || kw;
  const resp = await input.searchUsers({
    keyword: keywordForRequest,
    page: input.page,
    pageSize: input.pageSize,
  });
  if (resp.code === 401) {
    return {
      listError: input.reset ? resp.message || "请先登录" : undefined,
      rollbackPage: !input.reset && input.page > 1,
    };
  }
  if (resp.code !== 200 || !resp.data) {
    return {
      listError: input.reset ? resp.message || "搜索失败" : undefined,
      rollbackPage: !input.reset && input.page > 1,
    };
  }
  const data = resp.data;
  const nextUsers = input.reset
    ? (Array.isArray(data.users) ? [...data.users] : [])
    : mergeUsersWithoutDuplicate(
        input.prevUsers,
        Array.isArray(data.users) ? data.users : []
      );
  return {
    users: nextUsers,
    total: Number(data.total) || 0,
    lastSearchedKeyword: input.reset ? kw : input.lastSearchedKeyword,
  };
}

/** 执行好友申请并返回统一结果。 */
export async function executeFriendRequestFlow(input: {
  targetUserId: number | null | undefined;
  isSelfTarget: boolean;
  sendFriendRequest: (targetUserId: number) => Promise<any>;
}): Promise<{ ok: boolean; message: string }> {
  if (input.targetUserId == null || input.isSelfTarget) {
    return { ok: false, message: "无法向该用户发送申请" };
  }
  const resp = await input.sendFriendRequest(Number(input.targetUserId));
  if (resp.code === 200) return { ok: true, message: resp.message || "已发送申请" };
  if (resp.code === 400) return { ok: false, message: resp.message || "请求被拒绝" };
  if (resp.code === 401) return { ok: false, message: resp.message || "登录已失效，请重新登录" };
  if (resp.code === 500) return { ok: false, message: "请稍后重试" };
  return { ok: false, message: resp.message || "发送失败" };
}
