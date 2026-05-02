// File: src/types/dto/conversation.ts

/**
 * 会话成员 `display_status`：表示当前用户在该会话于会话栏/列表中的展示方式。
 * 与 `ConversationSummaryDTO.convStatus`（会话是否解散等）无关。
 * 使用场景：会话摘要 DTO、侧栏列表排序与显隐。
 */
export const ConversationMemberDisplayStatus = {
  /** 置顶 */
  PINNED: 0,
  /** 默认，参与普通排序 */
  DEFAULT: 1,
  /** 主会话列表不展示（可放到「更多/归档」等二级入口，由产品定） */
  HIDDEN: 2,
} as const;

export type ConversationMemberDisplayStatusValue =
  (typeof ConversationMemberDisplayStatus)[keyof typeof ConversationMemberDisplayStatus];

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

/** 单聊对端信息（仅 convType=1 时后端填充）。 */
export interface ConversationPeerInfoDTO {
  peerUserId: number;
  peerNickname: string;
  peerAvatar: string | null;
  peerRemarkName: string | null;
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
  /**
   * 会话本身状态（如是否已解散/只读），与当前用户在该会话的 `displayStatus` 无关。
   */
  convStatus: number;

  /**
   * 当前用户在该会话于会话列表中的展示状态（`conversation_member.display_status`）。
   * 0 置顶、1 默认、2 主列表隐藏；缺省由归一化层按 1 处理，与库 DEFAULT 一致。
   */
  displayStatus: number;

  // 会话成员相关
  privateDisplayName: string | null; // 用户设置的私有显示名称
  unreadCount: number;               // 未读消息数
  /** 单聊时对方用户 ID（好友 userId），由会话摘要接口返回 */
  targetUserId?: number;
  /** 单聊对端信息（群聊通常为 null/undefined）。 */
  peer?: ConversationPeerInfoDTO | null;

  // 最后一条消息信息
  lastMessage: LastMessageInfo | null;

  // 时间信息
  updateTime: string;
}

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
