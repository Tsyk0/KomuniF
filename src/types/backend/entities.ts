// File: src/types/backend/entities.ts
import type { DateString, DateTimeString, Gender, JavaLong, OnlineStatus } from "./common";

export interface UserEntity {
  userId: JavaLong;
  userNickname: string;
  userAvatar: string | null;
  userGender: Gender;
  userBirthday: DateString | null;
  userLocation: string | null;
  userSignature: string | null;
  userPhone: string | null;
  userEmail: string | null;
  userPassword?: string;
  userStatus: 0 | 1;
  onlineStatus: OnlineStatus;
  lastLoginTime: DateTimeString | null;
  createTime: DateTimeString;
  updateTime: DateTimeString;
}

export interface ConversationEntity {
  convId: JavaLong;
  convType: 1 | 2;
  convName: string | null;
  convAvatar: string | null;
  convDescription: string | null;
  convOwnerId: JavaLong | null;
  maxMemberCount: number | null;
  currentMemberCount: number;
  convStatus: 0 | 1;
  enableReadReceipt: boolean;
  createTime: DateTimeString;
  updateTime: DateTimeString;
}

export interface ConversationMemberEntity {
  id: JavaLong;
  convId: JavaLong;
  userId: JavaLong;
  memberNickname: string | null;
  memberRole: 0 | 1 | 2;
  memberStatus: 0 | 1 | 2;
  privateDisplayName: string | null;
  lastReadTime: DateTimeString | null;
  lastSpeakTime: DateTimeString | null;
  joinTime: DateTimeString;
  updateTime: DateTimeString;
  unreadCount: number;
}

export interface MessageEntity {
  messageId: JavaLong;
  convId: JavaLong;
  senderId: JavaLong;
  messageType: "text" | "image" | "file" | "audio" | "video" | "location" | "emoji" | "system";
  messageContent: string;
  messageStatus: 0 | 1 | 2 | 3 | 4;
  isRecalled: boolean;
  replyToMessageId: JavaLong | null;
  atUserIds: JavaLong[] | null;
  sendTime: DateTimeString;
  recallTime: DateTimeString | null;
}

export interface MessageReadStatusEntity {
  id: JavaLong;
  messageId: JavaLong;
  userId: JavaLong;
  readTime: DateTimeString;
}

export interface FriendRelationEntity {
  id: JavaLong;
  userId: JavaLong;
  friendId: JavaLong;
  relationStatus: 0 | 1 | 2;
  remarkName: string | null;
  friendGroup: string | null;
  addSource: string | null;
  addTime: DateTimeString;
  updateTime: DateTimeString;
}

export interface SystemNotificationEntity {
  notificationId: JavaLong;
  receiverId: JavaLong;
  notificationType: string;
  notificationTitle: string;
  notificationContent: string;
  relatedUserId: JavaLong | null;
  relatedConvId: JavaLong | null;
  isRead: boolean;
  createTime: DateTimeString;
  readTime: DateTimeString | null;
}

export interface NotificationHandleEntity {
  id: JavaLong;
  notificationId: JavaLong;
  handlerUserId: JavaLong;
  handleAction: string;
  handleStatus: 0 | 1 | 2;
  handleTime: DateTimeString | null;
  failureReason: string | null;
  bizPayload: string | null;
  clientRequestId: string | null;
  createTime: DateTimeString;
  updateTime: DateTimeString;
}

export interface FileAttachmentEntity {
  fileId: JavaLong;
  messageId: JavaLong;
  uploaderId: JavaLong;
  fileName: string;
  fileType: string;
  fileSize: JavaLong;
  filePath: string;
  thumbnailPath: string | null;
  fileMd5: string | null;
  uploadTime: DateTimeString;
}

export interface FileInfoEntity {
  id: JavaLong;
  fileId: string;
  userId: JavaLong;
  fileName: string;
  fileSize: JavaLong;
  plainHash: string;
  encryptAlgo: string;
  cipherObjectKey: string;
  encryptedFileKey: string;
  status: "UPLOADING" | "COMPLETED" | "FAILED";
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface UploadTaskEntity {
  id: JavaLong;
  uploadId: string;
  fileId: string;
  totalChunks: number;
  uploadedChunks: number;
  status: "UPLOADING" | "COMPLETED" | "FAILED";
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface UploadPartEntity {
  id: JavaLong;
  uploadId: string;
  fileId: string;
  partNumber: number;
  etag: string;
}
