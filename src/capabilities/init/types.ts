// File: src/capabilities/init/types.ts
import type { ConversationSummaryDTO } from "@/types/dto/conversation";
import type { FriendListItem } from "@/types/dto/friend";
import type { NotificationHandleSummaryDTO } from "@/types/dto/notification";

export type InitTarget = "friends" | "conversations" | "notifications";
export type LoadTarget = InitTarget;

export interface InitContext {
  userId: number;
}
export type LoadContext = InitContext;

export interface InitPayloadMap {
  friends: FriendListItem[];
  conversations: ConversationSummaryDTO[];
  notifications: NotificationHandleSummaryDTO[];
}
export type LoadPayloadMap = InitPayloadMap;

export type InitResult = {
  [T in InitTarget]: {
    target: T;
    success: boolean;
    message?: string;
    data?: InitPayloadMap[T];
  };
}[InitTarget];
export type LoadResult = InitResult;

export interface InitLoader {
  readonly target: InitTarget;
  load(ctx: InitContext): Promise<InitResult>;
}
export type Loader = InitLoader;
