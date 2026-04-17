// File: src/capabilities/init/bootstrap-loader.ts
import { ConversationInitLoader } from "./conversation-loader";
import { FriendInitLoader } from "./friend-loader";
import { NotificationInitLoader } from "./notification-loader";
import type { InitContext, InitResult, InitTarget, InitLoader } from "./types";

/**
 * AppInitLoader = app startup orchestrator.
 */
export class AppInitLoader {
  private readonly loaders: Map<InitTarget, InitLoader>;

  constructor(customLoaders?: InitLoader[]) {
    const defaults: InitLoader[] = [
      new FriendInitLoader(),
      new ConversationInitLoader(),
      new NotificationInitLoader(),
    ];
    const merged = customLoaders?.length ? customLoaders : defaults;
    this.loaders = new Map(merged.map((loader) => [loader.target, loader]));
  }

  async loadOne(target: InitTarget, ctx: InitContext): Promise<InitResult> {
    const loader = this.loaders.get(target);
    if (!loader) {
      return { target, success: false, message: `loader not found: ${target}` };
    }
    return loader.load(ctx);
  }

  async loadAll(ctx: InitContext): Promise<InitResult[]> {
    const tasks = Array.from(this.loaders.values()).map((loader) =>
      loader.load(ctx)
    );
    return Promise.all(tasks);
  }
}

export { AppInitLoader as BootstrapLoader };
