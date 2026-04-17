// File: src/capabilities/show-display-name/strategy.ts
import type {
  ConversationTitleInput,
  MessageSenderDisplayNameInput,
  PersonDisplayNameInput,
} from "./types";

const DEFAULT_GROUP_TITLE = "\u7fa4\u804a";
const DEFAULT_UNKNOWN_USER = "\u7528\u6237";

const normalize = (value?: string | null): string => (value || "").trim();

export function resolvePersonDisplayName(input: PersonDisplayNameInput): string {
  const remark = normalize(input.remarkName);
  if (remark) return remark;
  const nickname = normalize(input.userNickname);
  if (nickname) return nickname;
  return normalize(input.fallbackName) || DEFAULT_UNKNOWN_USER;
}

export function resolveConversationTitle(input: ConversationTitleInput): string {
  if (Number(input.convType) === 1) {
    const peerNickname = normalize(input.peerNickname);
    if (input.isPeerFriend) {
      return resolvePersonDisplayName({
        remarkName: input.peerRemarkName,
        userNickname: peerNickname,
        fallbackName: DEFAULT_UNKNOWN_USER,
      });
    }
    if (peerNickname) return peerNickname;

    const privateTitle = normalize(input.privateDisplayName);
    if (privateTitle) return privateTitle;

    const serverName = normalize(input.convName);
    if (serverName) return serverName;

    return DEFAULT_UNKNOWN_USER;
  }

  const serverName = normalize(input.convName);
  if (serverName) return serverName;

  const privateTitle = normalize(input.privateDisplayName);
  if (privateTitle) return privateTitle;

  return normalize(input.defaultGroupTitle) || DEFAULT_GROUP_TITLE;
}

export function resolveMessageSenderDisplayName(
  input: MessageSenderDisplayNameInput
): string {
  if (
    input.currentUserId != null &&
    Number(input.senderId) === Number(input.currentUserId)
  ) {
    return normalize(input.currentUserNickname) || DEFAULT_UNKNOWN_USER;
  }

  const remark = normalize(input.remarkName);
  if (remark) return remark;

  const memberNickname = normalize(input.memberNickname);
  if (memberNickname) return memberNickname;

  const userNickname = normalize(input.userNickname);
  if (userNickname) return userNickname;

  return normalize(input.fallbackName) || DEFAULT_UNKNOWN_USER;
}
