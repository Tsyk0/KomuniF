import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * TUICallKit：`init` 内含「创建引擎 + IM login」，引擎实例会先存在、login 仍为异步。
 * 使用场景：`HomeView` 发起 `calls` 前必须以此为 true（勿仅用 `getTUICallEngineInstance()`，否则会误入「引擎已有但未 login」窗口）。
 */
export const useTUICallKitSessionStore = defineStore("tuikitCallKitSession", () => {
  /** `TUICallKitAPI.init` 已全部成功结束（含内部 login），可安全调用 `calls`。 */
  const callKitSessionReady = ref(false);

  /**
   * 标记会话是否已就绪。
   * 使用场景：`TUICallKitShell` 在 bootstrap / teardown / init 失败时更新。
   */
  function setCallKitSessionReady(value: boolean): void {
    callKitSessionReady.value = value;
  }

  return { callKitSessionReady, setCallKitSessionReady };
});
