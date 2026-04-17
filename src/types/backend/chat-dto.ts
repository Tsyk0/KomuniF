// File: src/types/backend/chat-dto.ts
import type { DateTimeString, JavaLong } from "./common";
import type { ConversationEntity, UserEntity } from "./entities";

export interface ConversationCreateRequestDTO {
  single: boolean;
  memberUserIds: JavaLong[];
  convName?: string;
}

export interface ConversationCreateResultDTO {
  success: boolean;
  convId?: JavaLong;
  message?: string;
}

export interface ConversationAddMembersRequestDTO {
  userIds: JavaLong[];
}

export interface ConversationAddMembersResultDTO {
  convId: JavaLong;
  addedCount: number;
  skippedAlreadyMemberIds: JavaLong[];
}

export interface ConversationSummaryLastMessageInfoDTO {
  messageId: JavaLong;
  senderId: JavaLong;
  messageType: string;
  messageContent: string;
  senderDisplayName: string | null;
  senderAvatar: string | null;
  sendTime: DateTimeString;
}

export interface ConversationSummaryDTO {
  convId: JavaLong;
  convType: number;
  convName: string | null;
  convAvatar: string | null;
  currentMemberCount: number;
  maxMemberCount: number | null;
  convStatus: number;
  privateDisplayName: string | null;
  unreadCount: number;
  memberNickname: string | null;
  memberRole: number | null;
  memberStatus: number | null;
  lastReadTime: DateTimeString | null;
  lastSpeakTime: DateTimeString | null;
  joinTime: DateTimeString | null;
  lastMessage: ConversationSummaryLastMessageInfoDTO | null;
  updateTime: DateTimeString;
}

export interface MessageDisplayMemberDTO {
  userId: JavaLong;
  memberNickname: string | null;
  userNickname: string | null;
  userAvatar: string | null;
  role: number;
}

export interface ConversationWithMembersDTO {
  conversation: ConversationEntity;
  members: MessageDisplayMemberDTO[];
}

export interface MessageSummaryDTO {
  messageId: JavaLong;
  convId: JavaLong;
  senderId: JavaLong;
  messageType: string;
  messageContent: string;
  messageStatus: number;
  isRecalled: boolean;
  sendTime: DateTimeString;
  senderAvatar: string | null;
  displayName: string | null;
  memberNickname: string | null;
  privateDisplayName: string | null;
  convType: number;
  isSentByMe: boolean;
}

export interface SingleChatPeerUserItemDTO {
  convId: JavaLong;
  peerUser: UserEntity;
}
