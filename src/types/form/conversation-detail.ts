// src/types/form/conversation-detail.ts
// 最后一条消息信息
export interface LastMessageInfo {
  messageId: number;
  senderId: number;
  messageType: string;
  messageContent: string;
  senderDisplayName: string;  // 发送者显示名称（优先群昵称）
  senderAvatar: string | null;
  sendTime: string;
}

// 会话详情DTO
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
  currentMsgSeq: number;
  
  // 会话成员相关
  privateDisplayName: string | null; // 用户设置的私有显示名称
  unreadCount: number;               // 未读消息数
  
  // 最后一条消息信息
  lastMessage: LastMessageInfo | null;
  
  // 时间信息
  updateTime: string;
}

// 获取会话详情请求参数
export interface GetConversationDetailsRequest {
  userId: number;
}

// 获取会话详情响应
export interface GetConversationDetailsResponse {
  code: number;
  message: string;
  data: ConversationDetailDTO[];
  timestamp?: number;
}