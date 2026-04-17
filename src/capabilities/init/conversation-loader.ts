// File: src/capabilities/init/conversation-loader.ts
import { loadConversationSummaries } from "@/capabilities/conversation";
import type { InitContext, InitResult, InitLoader } from "./types";

export class ConversationInitLoader implements InitLoader {
  readonly target = "conversations" as const;

  async load(_ctx: InitContext): Promise<InitResult> {
    try {
      const summaries = await loadConversationSummaries();
      return {
        target: this.target,
        success: true,
        data: summaries,
      };
    } catch (error) {
      return {
        target: this.target,
        success: false,
        message: error instanceof Error ? error.message : "load conversations failed",
      };
    }
  }
}

export { ConversationInitLoader as ConversationLoader };
