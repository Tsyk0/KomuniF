import { TUICallKitAPI } from "@trtc/calls-uikit-vue";

/**
 * 等待 TUICallKit 内置 TIM（lite-chat）进入可鉴权状态。
 * 使用场景：`TUICallKitAPI.init` resolve 后，内部 login 可能仍在推进，`calls` 会校验引擎登录态；轮询 `getTim().isReady()` 再允许发起通话。
 */
export async function waitForTUICallKitImReady(options?: {
  timeoutMs?: number;
  pollMs?: number;
}): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 25_000;
  const pollMs = options?.pollMs ?? 80;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const engine = TUICallKitAPI.getTUICallEngineInstance();
    if (engine) {
      try {
        const tim = engine.getTim?.();
        if (
          tim &&
          typeof (tim as { isReady?: () => boolean }).isReady === "function" &&
          (tim as { isReady: () => boolean }).isReady()
        ) {
          return;
        }
      } catch {
        /* 下一拍再试 */
      }
    }
    await new Promise<void>((r) => setTimeout(r, pollMs));
  }

  throw new Error("即时通信未就绪（超时），请检查网络与 UserSig / IM 账号");
}
