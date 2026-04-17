// File: src/capabilities/show-display-name/types.ts
export type DisplayNameScene =
  | "person"
  | "conversation-title"
  | "message-sender";

export interface PersonDisplayNameInput {
  remarkName?: string | null;
  userNickname?: string | null;
  fallbackName?: string | null;
}

export interface ConversationTitleInput {
  convType: number;
  convName?: string | null;
  /** conversation_member.private_display_name */
  privateDisplayName?: string | null;
  /** 单聊时，对方是否为当前用户好友 */
  isPeerFriend?: boolean;
  peerRemarkName?: string | null;
  peerNickname?: string | null;
  defaultGroupTitle?: string;
}

export interface MessageSenderDisplayNameInput {
  senderId: number;
  currentUserId?: number | null;
  currentUserNickname?: string | null;
  remarkName?: string | null;
  memberNickname?: string | null;
  userNickname?: string | null;
  fallbackName?: string | null;
}
