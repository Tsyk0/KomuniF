// 消息详情DTO - 精简版，只包含头像
export interface MessageDetailDTO {
  // 消息基本信息
  messageId: number;
  convId: number;
  senderId: number;
  messageType: string;
  messageContent: string;
  messageStatus: number;
  isRecalled: boolean;
  sendTime: string;
  
  // 发送者头像（直接字段）
  senderAvatar: string | null;
  
  // 显示名称
  displayName: string;
  memberNickname: string | null;
  privateDisplayName: string | null;
  
  // 会话类型
  convType: number;  // 1-单聊，2-群聊
  
  // 是否是自己发送的消息
  isSentByMe: boolean;
}

// 获取消息详情请求参数
export interface GetMessageDetailsRequest {
  convId: number;
  currentUserId: number;
  page?: number;
  pageSize?: number;
}

// 获取消息详情响应
export interface GetMessageDetailsResponse {
  code: number;
  message: string;
  data: {
    messages: MessageDetailDTO[];
    total: number;
    page: number;
    pageSize: number;
  };
  timestamp?: number;
}