import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 从 Komuni 单聊头发起的 TUICallKit 呼叫上下文（仅主叫写入 rtc 摘要）。
 * 使用场景：`HomeView` 调 `calls` 前写入；引擎 `onCallNotConnected` / `onCallEnd` 读取后清空。
 */
export interface KomuniOutboundCallContext {
  convId: number;
  peerUserId: number;
  /** {@link TUICallType} 数值，与 `TUICallKitAPI.calls` 的 type 一致 */
  callMediaType: number;
  /** 是否判定为已接通（接听后进房） */
  hadConnected: boolean;
  /** 首次判定接通时的本地时间戳（ms），用于拼通话时长 */
  connectedAtMs: number | null;
}

/**
 * TUICallKit：`init` 内含「创建引擎 + IM login」，引擎实例会先存在、login 仍为异步。
 * 使用场景：`HomeView` 发起 `calls` 前必须以此为 true（勿仅用 `getTUICallEngineInstance()`，否则会误入「引擎已有但未 login」窗口）。
 */
export const useTUICallKitSessionStore = defineStore("tuikitCallKitSession", () => {
  /** `TUICallKitAPI.init` 已全部成功结束（含内部 login），可安全调用 `calls`。 */
  const callKitSessionReady = ref(false);

  /** 当前用户从 Komuni 主动发起且需在下一次通话结束时上报 rtc 的会话上下文（非被叫来电）。 */
  const komuniOutboundCall = ref<KomuniOutboundCallContext | null>(null);

  /**
   * 标记会话是否已就绪。
   * 使用场景：`TUICallKitShell` 在 bootstrap / teardown / init 失败时更新。
   */
  function setCallKitSessionReady(value: boolean): void {
    callKitSessionReady.value = value;
  }

  /**
   * 主叫在调用 `TUICallKitAPI.calls` 之前写入上下文。
   * 使用场景：`HomeView` 视频通话按钮；与「仅发送方写 rtc」产品一致。
   */
  function beginKomuniOutboundCall(input: {
    convId: number;
    peerUserId: number;
    callMediaType: number;
  }): void {
    komuniOutboundCall.value = {
      convId: Number(input.convId),
      peerUserId: Number(input.peerUserId),
      callMediaType: Number(input.callMediaType),
      hadConnected: false,
      connectedAtMs: null,
    };
  }

  /**
   * 引擎回调：对端接听并进房后标记接通时刻。
   * 使用场景：`USER_ACCEPT` / `USER_ENTER`（任一早于挂断即可）。
   */
  function markKomuniCallConnected(): void {
    const c = komuniOutboundCall.value;
    if (!c || c.hadConnected) return;
    komuniOutboundCall.value = {
      ...c,
      hadConnected: true,
      connectedAtMs: Date.now(),
    };
  }

  /**
   * 丢弃未发起成功或异常路径下的上下文。
   * 使用场景：`calls` 抛错；登出。
   */
  function clearKomuniOutboundCallContext(): void {
    komuniOutboundCall.value = null;
  }

  /**
   * 读取当前主叫上下文（不清空）。
   * 使用场景：`onCallEnd` 等在发送前读取。
   */
  function getKomuniOutboundCallContext(): KomuniOutboundCallContext | null {
    return komuniOutboundCall.value;
  }

  /**
   * 取出并清空主叫上下文（用于「未接通结束」仅处理一次）。
   * 使用场景：`onCallNotConnected`。
   */
  function takeKomuniOutboundCallContext(): KomuniOutboundCallContext | null {
    const v = komuniOutboundCall.value;
    komuniOutboundCall.value = null;
    return v;
  }

  return {
    callKitSessionReady,
    setCallKitSessionReady,
    beginKomuniOutboundCall,
    markKomuniCallConnected,
    clearKomuniOutboundCallContext,
    getKomuniOutboundCallContext,
    takeKomuniOutboundCallContext,
  };
});
