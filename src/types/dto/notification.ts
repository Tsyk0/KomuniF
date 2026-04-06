import type { BaseResponse } from "@/types/dto/base";

/** 与后端约定一致：成功 code 一般为 200 */
export type ApiResponse<T> = BaseResponse<T>;

/** 与后端 NotificationType 枚举 code 一致 */
export type SystemNotificationType =
  | "friend_add_request"
  | "conv_join_request"
  | "friend_remove_inform"
  | "conv_quit_inform"
  | "conv_disband_inform"
  /** 历史或其它后端值 */
  | string;

export interface SystemNotification {
  notificationId: number;
  receiverId: number;
  notificationType: SystemNotificationType;
  notificationTitle: string | null;
  notificationContent: string | null;
  relatedUserId: number | null;
  relatedConvId: number | null;
  isRead: boolean | null;
  createTime: string;
  readTime: string | null;
}

/** POST /friends/{userId}/friend-request 成功时 data */
export interface SendFriendRequestResult {
  notificationId: number;
  receiverId: number;
}

/** POST /notifications/handle */
export type NotificationHandleAction = "accept" | "reject" | "block";

export interface NotificationHandlePayload {
  notificationId: number;
  handleAction: NotificationHandleAction;
}

/** POST /notifications/handle 成功时 data（与后端 NotificationHandle 一致） */
export interface NotificationHandleRecord {
  id: number;
  notificationId: number;
  handlerUserId: number;
  handleAction: string;
  handleStatus: number;
  handleTime: string;
  failureReason: string | null;
  bizPayload: unknown | null;
  clientRequestId: string | null;
  createTime: string;
  updateTime: string;
}

/** 后端聚合后的处理记录 DTO（字段与 NotificationHandleRecord 保持一致） */
export type NotificationHandle = NotificationHandleRecord;

/** 通知列表聚合 DTO：同一 notificationId 下的通知 + 处理记录 */
export interface NotificationHandleSummaryDTO {
  notificationId: number;
  notification: SystemNotification;
  handle: NotificationHandle | null;
}

/** 需要展示「通过 / 拒绝 / 拉黑」的类型（与后端一致） */
export const REQUIRES_ACTION_TYPES = [
  "friend_add_request",
  "conv_join_request",
] as const;

export type RequiresActionNotificationType =
  (typeof REQUIRES_ACTION_TYPES)[number];

const REQUIRES_ACTION_SET = new Set<string>(REQUIRES_ACTION_TYPES);

/** 是否应在卡片上展示处理按钮（仅两类；其余含未知类型默认不展示） */
export function notificationRequiresAction(notificationType: string): boolean {
  return REQUIRES_ACTION_SET.has(notificationType);
}

/** 告知类：类型名以 _inform 结尾则只读展示 */
export function notificationIsInformOnly(notificationType: string): boolean {
  return notificationType.endsWith("_inform");
}

/** 徽章短文案（映射表 + 告知类兜底） */
const TYPE_BADGE_MAP: Record<string, string> = {
  friend_add_request: "好友申请",
  conv_join_request: "入群邀请",
  friend_remove_inform: "好友变动",
  conv_quit_inform: "退群通知",
  conv_disband_inform: "群解散",
  friend_request: "好友",
  group_invite: "群聊",
  system_message: "系统",
};

export function notificationTypeBadgeLabel(notificationType: string): string {
  if (TYPE_BADGE_MAP[notificationType]) {
    return TYPE_BADGE_MAP[notificationType];
  }
  if (notificationIsInformOnly(notificationType)) {
    return "告知";
  }
  return notificationType.length <= 14 ? notificationType : "通知";
}

/** 默认标题（无 notificationTitle 时） */
const TYPE_TITLE_MAP: Record<string, string> = {
  friend_add_request: "好友申请",
  conv_join_request: "入群/会话邀请",
  friend_remove_inform: "好友关系变更",
  conv_quit_inform: "退出会话",
  conv_disband_inform: "会话已解散",
  friend_request: "好友申请",
  group_invite: "群邀请",
  system_message: "系统消息",
};

export function notificationDefaultTitle(notificationType: string): string {
  return (
    TYPE_TITLE_MAP[notificationType] ||
    (notificationIsInformOnly(notificationType) ? "系统通知" : "通知")
  );
}
