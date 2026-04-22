/**
 * SystemNotificationContainerInteraction
 * - 存放系统通知列表的界面交互方法。
 * - 负责行展开、按钮显隐、样式状态等纯交互规则。
 *
 * 方法目录（方法：功能）
 * - canToggleNotificationActions：判断该通知是否允许展开操作按钮。
 * - shouldShowNotificationActionButtons：判断是否显示该通知的操作按钮。
 * - resolveNotificationAccentVariant：根据处理动作返回通知卡片强调样式。
 * - shouldShowNotificationUnreadMeta：判断该通知是否显示未读角标。
 * - resolveNotificationRelatedLabel：根据 relatedUserId 解析好友展示名。
 * - resolveNotificationOpenedActionId：计算点击通知行后的展开状态。
 * - handleNotificationActionFlow：执行通知处理并返回收口状态。
 */

import {
  notificationRequiresAction,
  type NotificationHandleSummaryDTO,
} from "@/types/dto/notification";

/** 该行是否可展开“通过/拒绝/拉黑”操作按钮。 */
export function canToggleNotificationActions(
  item: NotificationHandleSummaryDTO,
  // 由组件传入：判断该通知是否已处理
  isProcessed: (item: NotificationHandleSummaryDTO) => boolean
): boolean {
  return (
    notificationRequiresAction(item.notification.notificationType) &&
    !isProcessed(item)
  );
}

/** 该行是否显示操作按钮。 */
export function shouldShowNotificationActionButtons(
  item: NotificationHandleSummaryDTO,
  // 由组件传入：判断该通知是否已处理
  isProcessed: (item: NotificationHandleSummaryDTO) => boolean
): boolean {
  return canToggleNotificationActions(item, isProcessed);
}

/** 根据处理动作返回卡片强调样式。 */
export function resolveNotificationAccentVariant(
  item: NotificationHandleSummaryDTO
): "accept" | "reject" | "dismiss" | "pending" {
  const action = item.handle?.handleAction?.trim().toLowerCase();
  if (action === "accept") return "accept";
  if (action === "reject") return "reject";
  if (action === "dismiss" || action === "block") return "dismiss";
  return "pending";
}

/** 是否显示“未读”角标。 */
export function shouldShowNotificationUnreadMeta(
  item: NotificationHandleSummaryDTO,
  // 由组件传入：判断该通知是否已处理
  isProcessed: (item: NotificationHandleSummaryDTO) => boolean
): boolean {
  return (
    !isProcessed(item) &&
    (item.notification.isRead === false || item.notification.isRead === null)
  );
}

/** 根据 relatedUserId 解析好友展示名。 */
export function resolveNotificationRelatedLabel(
  relatedUserId: number | null | undefined,
  friends: Array<{ friendId: number; displayName?: string | null; nickname?: string | null }>
): string | null {
  if (relatedUserId == null || relatedUserId <= 0) return null;
  const f = friends.find((x) => x.friendId === relatedUserId);
  return f?.displayName || f?.nickname || null;
}

/** 计算点击通知行后的展开状态。 */
export function resolveNotificationOpenedActionId(input: {
  item: NotificationHandleSummaryDTO;
  currentOpenedActionId: number | null;
  canToggle: boolean;
}): number | null {
  if (!input.canToggle) {
    return input.currentOpenedActionId === input.item.notificationId ? null : input.currentOpenedActionId;
  }
  return input.currentOpenedActionId === input.item.notificationId
    ? null
    : input.item.notificationId;
}

/** 执行通知处理并返回收口状态。 */
export async function handleNotificationActionFlow(input: {
  notificationId: number;
  handleAction: string;
  submitHandle: (notificationId: number, handleAction: string) => Promise<void>;
}): Promise<{ shouldCloseActions: boolean }> {
  await input.submitHandle(input.notificationId, input.handleAction);
  return { shouldCloseActions: true };
}
