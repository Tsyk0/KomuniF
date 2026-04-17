// File: src/capabilities/show-display-name/resolvers.ts
import type {
  ConversationTitleInput,
  MessageSenderDisplayNameInput,
  PersonDisplayNameInput,
} from "./types";
import {
  resolveConversationTitle,
  resolveMessageSenderDisplayName,
  resolvePersonDisplayName,
} from "./strategy";

/**
 * Resolver facade for display-name decisions.
 * Components/services should call this instead of hardcoding `remark || nickname`.
 */
export const displayNameResolver = {
  person(input: PersonDisplayNameInput) {
    return resolvePersonDisplayName(input);
  },
  conversationTitle(input: ConversationTitleInput) {
    return resolveConversationTitle(input);
  },
  messageSender(input: MessageSenderDisplayNameInput) {
    return resolveMessageSenderDisplayName(input);
  },
};
