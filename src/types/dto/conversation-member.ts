// File: src/types/dto/conversation-member.ts
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
 * role：0 普通成员，1 管理员，2 群主（与后端 member_role 一致）。
 * memberStatus：0 已退出/被踢，1 正常，2 禁言（群聊）。
 */
export interface ConversationMemberDTO {
  userId: number;
  memberNickname: string | null;
  userNickname: string;
  userAvatar: string | null;
  role: number;
  /** 缺省按 1（正常）处理，与后端未返回时一致 */
  memberStatus?: number;
}

// RESTful 命名兼容别名
export type MessageDisplayMemberDTO = ConversationMemberDTO;

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

