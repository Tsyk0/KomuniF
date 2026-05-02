// File: src/types/dto/friend.ts
import type { BaseResponse } from "./base";

export type FriendOnlineStatus = "online" | "offline" | "away";

/**
 * 好友关系 `relation_status`（`friend_relation`）。
 * GET /friends 可返回全部状态：侧栏好友列表仅展示 0、1；2/3 等仍留在 Pinia 全量数据中，供备注名映射等非列表能力。
 * 使用场景：摘要 DTO、列表显隐与排序、按 friendId 解析显示名。
 */
export const FriendRelationStatus = {
  /** 好友且需在好友列表中置顶展示 */
  FRIEND_PINNED: 0,
  /** 正常好友 */
  NORMAL: 1,
  /** 拉黑：不在好友列表展示；可保留行用于策略/映射 */
  BLOCKED: 2,
  /** 非好友：不在好友列表展示；备注等可对非好友生效，依赖全量缓存与映射 */
  NOT_FRIEND: 3,
} as const;

export type FriendRelationStatusValue =
  (typeof FriendRelationStatus)[keyof typeof FriendRelationStatus];

/**
 * 好友关系摘要 DTO
 */
export interface FriendSummaryDTO {
  id: number;
  userId: number;
  friendId: number;
  /** 见 `FriendRelationStatus`；接口可返回任意合法状态 */
  relationStatus: number;
  remarkName?: string | null;
  friendGroup?: string | null;
  addSource?: string | null;
  addTime?: string | null;
  updateTime?: string | null;
  friendNickname: string;
  friendAvatar?: string | null;
  friendGender?: number | null;
  friendSignature?: string | null;
  friendOnlineStatus?: number | null;
}

/**
 * 获取好友列表响应
 */
export type GetFriendListResponse = BaseResponse<FriendSummaryDTO[]>;

/**
 * 好友列表展示项（前端使用）
 */
export interface FriendListItem {
  relationId: number;
  id: number;
  userId: number;
  friendId: number;
  /** 与 `FriendSummaryDTO.relationStatus` 一致；列表 UI 仅展示 0、1 */
  relationStatus: number;
  displayName: string;
  nickname: string;
  remarkName?: string | null;
  avatar?: string | null;
  signature?: string | null;
  onlineStatus: FriendOnlineStatus;
  group?: string | null;
  addTime?: string | null;
  updateTime?: string | null;
}

/**
 * 好友资料 DTO (包含完整用户信息)
 */
export interface FriendProfileDTO {
  id: number;
  userId: number;
  friendId: number;
  /** 见 `FriendRelationStatus` */
  relationStatus: number;
  remarkName?: string | null;
  friendGroup?: string | null;
  addSource?: string | null;
  addTime?: string | null;
  updateTime?: string | null;
  friendNickname: string;
  friendAvatar?: string | null;
  friendGender?: number | null;
  friendBirthday?: string | null;
  friendLocation?: string | null;
  friendSignature?: string | null;
  friendPhone?: string | null;
  friendEmail?: string | null;
  friendStatus?: number | null;
  friendOnlineStatus?: number | null;
  friendLastLoginTime?: string | null;
}

// 兼容旧命名
export type FriendInfoDTO = FriendProfileDTO;

export type GetFriendInfoResponse = BaseResponse<FriendProfileDTO>;
