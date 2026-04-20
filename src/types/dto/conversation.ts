// File: src/types/dto/conversation.ts
/**
 * 最后一条消息信息
 */
export interface LastMessageInfo {
  messageId: number;
  senderId: number;
  messageType: string;
  messageContent: string;
  senderDisplayName: string;
  senderAvatar: string | null;
  sendTime: string;
}

/**
 * 会话摘要 DTO（会话列表项）
 */
export interface ConversationSummaryDTO {
  // 会话基本信息
  convId: number;
  convType: number;           // 1-单聊，2-群聊
  convName: string;           // 会话显示名称
  convAvatar: string | null;  // 会话头像

  // 会话状态信息
  currentMemberCount: number;
  maxMemberCount: number;
  convStatus: number;

  // 会话成员相关
  privateDisplayName: string | null; // 用户设置的私有显示名称
  unreadCount: number;               // 未读消息数
  /** 单聊时对方用户 ID（好友 userId），由会话摘要接口返回 */
  targetUserId?: number;

  // 最后一条消息信息
  lastMessage: LastMessageInfo | null;

  // 时间信息
  updateTime: string;
}

// 兼容旧命名
export type ConversationDetailDTO = ConversationSummaryDTO;

/**
 * 会话成员展示 DTO（群成员简化信息）
 */
export interface MessageDisplayMemberDTO {
  userId: number;
  memberNickname: string | null; // 群昵称
  userNickname: string;          // 用户原本昵称
  userAvatar: string | null;     // 用户头像
  role?: number;                 // 角色 (1-群主, 2-管理员, 3-普通成员)
  joinTime?: string;
}

// 兼容旧命名
export type CompressedCM = MessageDisplayMemberDTO;

/**
 * 获取会话摘要列表响应
 */
export interface GetConversationSummariesResponse {
  code: number;
  message: string;
  data: ConversationSummaryDTO[];
  timestamp?: number;
}

/**
 * 获取会话成员列表响应
 */
export interface GetConversationMembersResponse {
  code: number;
  message: string;
  data: MessageDisplayMemberDTO[];
  timestamp?: number;
}
