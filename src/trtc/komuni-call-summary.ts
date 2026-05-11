import { TUICallKitAPI } from "@trtc/calls-uikit-vue";
import {
  CallEndReason,
  TUICallEvent,
} from "@trtc/call-engine-lite-js";
import { useTUICallKitSessionStore } from "@/store/trtc/tuikitSession";
import { useWebSocketStore } from "@/store/realtime/websocket";

type EngineWithEvents = {
  on: (ev: string, fn: (...args: unknown[]) => void) => void;
  off: (ev: string, fn: (...args: unknown[]) => void) => void;
};

let installed = false;
/** 已注册的监听句柄，供 teardown 时 off，避免重复绑定或泄漏。 */
const bound: Array<{ ev: string; fn: (...args: unknown[]) => void }> = [];

/**
 * 将通话时长格式化为 mm:ss（与产品文档一致，分钟与秒均至少两位）。
 */
function formatDurationMmSs(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * 从未接通结束事件的回调载荷中解析 {@link CallEndReason}。
 */
function resolveCallEndReason(event: unknown): number {
  if (!event || typeof event !== "object") return CallEndReason.UnKnown;
  const e = event as Record<string, unknown>;
  const r = e.reason ?? e.callEndReason ?? e.CallEndReason;
  if (typeof r === "number" && Number.isFinite(r)) return r;
  if (typeof r === "string" && /^\d+$/.test(r)) return Number(r);
  return CallEndReason.UnKnown;
}

/**
 * 已接通结束时尽量使用 SDK 给出的时长（秒），否则用本地记录的接通时间推算。
 */
function resolveConnectedDurationSeconds(
  event: unknown,
  connectedAtMs: number | null
): number {
  if (event && typeof event === "object") {
    const e = event as Record<string, unknown>;
    const t = e.totalTime ?? e.duration ?? e.time;
    if (typeof t === "number" && Number.isFinite(t) && t >= 0) {
      return Math.floor(t);
    }
  }
  if (connectedAtMs != null && Number.isFinite(connectedAtMs)) {
    return Math.max(0, Math.floor((Date.now() - connectedAtMs) / 1000));
  }
  return 0;
}

/**
 * 未接通场景：根据引擎结束原因生成会话摘要文案。
 */
function summaryForNotConnected(reason: number): string {
  switch (reason) {
    case CallEndReason.Reject:
      return "对方已拒绝";
    case CallEndReason.Canceled:
      return "已取消";
    case CallEndReason.NoResponse:
      return "对方未接听";
    case CallEndReason.LineBusy:
      return "对方忙线";
    case CallEndReason.Offline:
      return "对方离线";
    default:
      return "通话未接通";
  }
}

/**
 * 通过 WS 发送一条 `rtc` 摘要（不含 @、不含 reply）。
 */
function sendRtcSummary(convId: number, messageContent: string): void {
  const trimmed = messageContent.trim();
  if (!trimmed) return;
  const ws = useWebSocketStore();
  const ok = ws.sendMessageByType({
    convId,
    messageType: "rtc",
    messageContent: trimmed,
  });
  if (!ok) {
    console.warn("[komuni-call-summary] 发送 rtc 失败（WS 未连接或队列拒绝）");
  }
}

function handleCallNotConnected(event: unknown): void {
  const tuikit = useTUICallKitSessionStore();
  const ctx = tuikit.takeKomuniOutboundCallContext();
  if (!ctx) return;
  const reason = resolveCallEndReason(event);
  sendRtcSummary(ctx.convId, summaryForNotConnected(reason));
}

function handleCallEnd(event: unknown): void {
  const tuikit = useTUICallKitSessionStore();
  const ctx = tuikit.getKomuniOutboundCallContext();
  if (!ctx?.hadConnected) return;
  tuikit.clearKomuniOutboundCallContext();
  const seconds = resolveConnectedDurationSeconds(event, ctx.connectedAtMs);
  sendRtcSummary(
    ctx.convId,
    `通话已结束，通话时长：${formatDurationMmSs(seconds)}`
  );
}

function handleMarkConnected(): void {
  useTUICallKitSessionStore().markKomuniCallConnected();
}

/**
 * 在 TUICallKit 初始化完成后注册引擎事件：仅当存在 Komuni 主叫上下文时发送 rtc。
 * 使用场景：`TUICallKitShell` bootstrap 成功且渲染 `<TUICallKit />` 之前或之后调用一次。
 */
export function installKomuniCallRtcSummaryListeners(): void {
  if (installed) return;
  const raw = TUICallKitAPI.getTUICallEngineInstance() as EngineWithEvents | null;
  if (!raw || typeof raw.on !== "function" || typeof raw.off !== "function") {
    console.warn("[komuni-call-summary] 引擎实例不可用，跳过 rtc 摘要监听");
    return;
  }

  const on = (ev: string, fn: (...args: unknown[]) => void) => {
    raw.on(ev, fn);
    bound.push({ ev, fn });
  };

  on(TUICallEvent.ON_CALL_NOT_CONNECTED, handleCallNotConnected);
  on(TUICallEvent.ON_CALL_END, handleCallEnd);
  on(TUICallEvent.USER_ACCEPT, handleMarkConnected);
  on(TUICallEvent.USER_ENTER, handleMarkConnected);

  installed = true;
}

/**
 * 卸载监听并在登出/销毁 CallKit 前调用。
 * 使用场景：`TUICallKitShell` teardown。
 */
export function uninstallKomuniCallRtcSummaryListeners(): void {
  const raw = TUICallKitAPI.getTUICallEngineInstance() as EngineWithEvents | null;
  if (raw && typeof raw.off === "function") {
    for (const { ev, fn } of bound) {
      try {
        raw.off(ev, fn);
      } catch {
        /* ignore */
      }
    }
  }
  bound.length = 0;
  installed = false;
  useTUICallKitSessionStore().clearKomuniOutboundCallContext();
}
