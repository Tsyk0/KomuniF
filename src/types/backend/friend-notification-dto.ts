// File: src/types/backend/friend-notification-dto.ts
import type { DateString, DateTimeString, JavaLong } from "./common";
import type { NotificationHandleEntity, SystemNotificationEntity } from "./entities";

export interface FriendProfileDTO {
  id: JavaLong;
  userId: JavaLong;
  friendId: JavaLong;
  relationStatus: number;
  remarkName: string | null;
  friendGroup: string | null;
  addSource: string | null;
  addTime: DateTimeString;
  updateTime: DateTimeString;
  friendNickname: string;
  friendAvatar: string | null;
  friendGender: number | null;
  friendBirthday: DateString | null;
  friendLocation: string | null;
  friendSignature: string | null;
  friendPhone: string | null;
  friendEmail: string | null;
  friendStatus: number;
  friendOnlineStatus: number;
  friendLastLoginTime: DateTimeString | null;
}

export interface FriendSummaryDTO {
  id: JavaLong;
  userId: JavaLong;
  friendId: JavaLong;
  relationStatus: number;
  remarkName: string | null;
  friendGroup: string | null;
  addSource: string | null;
  addTime: DateTimeString;
  updateTime: DateTimeString;
  friendNickname: string;
  friendAvatar: string | null;
  friendGender: number | null;
  friendSignature: string | null;
  friendOnlineStatus: number;
}

export interface FriendRequestSendResultDTO {
  notificationId: JavaLong;
  receiverId: JavaLong;
}

export type NotificationHandleAction = "accept" | "reject" | "ignore" | "dismiss" | "block";

export interface NotificationHandleSubmitRequestDTO {
  notificationId: JavaLong;
  handleAction: NotificationHandleAction;
}

export interface NotificationHandleSummaryDTO {
  notificationId: JavaLong;
  notification: SystemNotificationEntity;
  handle: NotificationHandleEntity | null;
}
