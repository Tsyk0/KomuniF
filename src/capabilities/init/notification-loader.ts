// File: src/capabilities/init/notification-loader.ts
import { loadRecentNotifications } from "@/capabilities/notification";
import type { InitContext, InitResult, InitLoader } from "./types";

export class NotificationInitLoader implements InitLoader {
  readonly target = "notifications" as const;

  async load(_ctx: InitContext): Promise<InitResult> {
    try {
      const notifications = await loadRecentNotifications();
      return {
        target: this.target,
        success: true,
        data: notifications,
      };
    } catch (error) {
      return {
        target: this.target,
        success: false,
        message: error instanceof Error ? error.message : "load notifications failed",
      };
    }
  }
}

export { NotificationInitLoader as NotificationLoader };
