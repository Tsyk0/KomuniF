import type { BaseResponse } from "./base";

/**
 * 会话实体（用于会话+成员详情）
 */
export interface ConversationEntity {
  convId: number;
  convType: number;
  convName: string;
  convAvatar: string | null;
  convDescription?: string | null;
  convOwnerId: number;
  maxMemberCount: number;
  currentMemberCount: number;
  convStatus: number;
  enableReadReceipt: boolean;
  createTime: string;
  updateTime: string;
}

/**
 * 会话成员信息（含群昵称与用户原始昵称）
 */
export interface ConversationMemberDTO {
  userId: number;
  memberNickname: string | null;
  userNickname: string;
  userAvatar: string | null;
  role: number;
}

/**
 * 会话+成员详情数据
 */
export interface ConversationWithMembersData {
  conversation: ConversationEntity;
  members: ConversationMemberDTO[];
}

/**
 * 获取会话及其成员详情响应
 * 对应：GET /conversationMember/getConversationWithMembers
 */
export type GetConversationWithMembersResponse =
  BaseResponse<ConversationWithMembersData | null>;

