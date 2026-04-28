// File: src/types/dto/notification.ts
import type { BaseResponse } from "@/types/dto/base";

/** 与后端约定一致：成功 code 一般为 200 */
export type ApiResponse<T> = BaseResponse<T>;

export interface SystemNotification {
  notificationId: number;
  mode: "confirm" | "inform" | string;
  type: string;
  notificationTitle: string | null;
  notificationContent: string | null;
  receiverId: number;
  relatedUserId: number | null;
  rahId: number | null;
  createTime: string | number;
}

/** POST /friends/{userId}/friend-request 成功时 data */
export interface SendFriendRequestResult {
  rahId: number;
  handlerId: number;
}

export interface CreateGroupJoinRequestPayload {
  title?: string;
  content?: string;
}

export interface CreateGroupJoinRequestResult {
  rahId: number;
  convId: number;
}

/** POST /request-handles/handle */
export type RequestHandleAction =
  | "accept"
  | "reject"
  | "ignore"
  | "dismiss"
  | "block";

export interface RequestHandlePayload {
  rahId: number;
  handleAction: RequestHandleAction;
  rahFeedback?: string;
}

export interface RequestHandle {
  id: number;
  type: string;
  status: "pending" | "accepted" | "rejected" | "banned" | string;
  requester: number;
  handler: number;
  convId?: number | null;
  rahTitle: string | null;
  rahContent: string | null;
  rahFeedback: string | null;
  createTime: string;
  handleTime: string | null;
}

/** 通知列表项（后端 recent 返回） */
export interface NotificationRecentItemDTO {
  notificationId: number;
  notification: SystemNotification;
  rah: RequestHandle | null;
}

export interface NotificationCursorDTO {
  notificationLastReadId: number;
}

export interface NotificationUnreadSummaryDTO {
  notificationUnread: number;
}

export function requestHandleIsPending(rah: RequestHandle | null | undefined): boolean {
  return (rah?.status || "").toLowerCase() === "pending";
}

/** 徽章短文案（映射表 + 告知类兜底） */
const TYPE_BADGE_MAP: Record<string, string> = {
  friend_add: "好友申请",
  friend_remove_inform: "好友变动",
  conv_join: "入群",
  system_message: "系统",
};

export function notificationTypeBadgeLabel(type: string): string {
  if (TYPE_BADGE_MAP[type]) {
    return TYPE_BADGE_MAP[type];
  }
  if (type.endsWith("_inform")) {
    return "告知";
  }
  return type.length <= 14 ? type : "通知";
}

/** 默认标题（无 notificationTitle 时） */
const TYPE_TITLE_MAP: Record<string, string> = {
  friend_add: "好友申请",
  friend_remove_inform: "好友关系变更",
  conv_join: "入群申请",
  system_message: "系统消息",
};

export function notificationDefaultTitle(type: string): string {
  return (
    TYPE_TITLE_MAP[type] ||
    (type.endsWith("_inform") ? "系统通知" : "通知")
  );
}
