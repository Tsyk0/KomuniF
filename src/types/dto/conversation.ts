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
 * 会话详情 DTO
 */
export interface ConversationDetailDTO {
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
  
  // 最后一条消息信息
  lastMessage: LastMessageInfo | null;
  
  // 时间信息
  updateTime: string;
}

/**
 * 群成员信息 DTO
 */
export interface GroupMemberDTO {
  userId: number;
  memberNickname: string | null; // 群昵称
  userNickname: string;          // 用户原本昵称
  userAvatar: string | null;     // 用户头像
  role?: number;                 // 角色 (1-群主, 2-管理员, 3-普通成员)
  joinTime?: string;
}

/**
 * 获取会话详情响应
 */
export interface GetConversationDetailsResponse {
  code: number;
  message: string;
  data: ConversationDetailDTO[];
  timestamp?: number;
}

/**
 * 获取群成员列表响应
 */
export interface GetGroupMembersResponse {
  code: number;
  message: string;
  data: GroupMemberDTO[];
  timestamp?: number;
}
