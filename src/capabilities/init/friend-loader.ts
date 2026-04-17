// File: src/capabilities/init/friend-loader.ts
import { loadFriendListItems } from "@/capabilities/friend";
import type { InitContext, InitResult, InitLoader } from "./types";

export class FriendInitLoader implements InitLoader {
  readonly target = "friends" as const;

  async load(_ctx: InitContext): Promise<InitResult> {
    try {
      const friends = await loadFriendListItems();
      return { target: this.target, success: true, data: friends };
    } catch (error) {
      return {
        target: this.target,
        success: false,
        message: error instanceof Error ? error.message : "load friends failed",
      };
    }
  }
}

export { FriendInitLoader as FriendLoader };
