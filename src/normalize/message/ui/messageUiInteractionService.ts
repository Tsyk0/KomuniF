/** 输入框最大高度（与 ChatContainer 展示保持一致）。 */
const MESSAGE_INPUT_MAX_HEIGHT = 120;
/** 滚动分页边界阈值。 */
const EDGE_TRIGGER_THRESHOLD_PX = 40;

/** 发送成功后重置消息输入框视图。 */
export function resetMessageComposerView(
  setMessageText: (value: string) => void,
  inputEl?: HTMLTextAreaElement | null
): void {
  setMessageText("");
  if (inputEl) {
    inputEl.style.height = "auto";
  }
}

/** 按内容自适应输入框高度。 */
export function resizeMessageComposer(
  inputEl?: HTMLTextAreaElement | null,
  maxHeight = MESSAGE_INPUT_MAX_HEIGHT
): void {
  if (!inputEl) return;
  inputEl.style.height = "auto";
  const newHeight = Math.min(inputEl.scrollHeight, maxHeight);
  inputEl.style.height = `${newHeight}px`;
}

/** 判断容器是否贴近底部（用于新消息是否自动滚底）。 */
export function isContainerNearBottom(el: HTMLElement, px = 72): boolean {
  const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
  return gap <= px;
}

/** 直接把消息容器滚动到底。 */
export function scrollContainerToBottom(el?: HTMLElement | null): void {
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

/** 将锚点元素中心对齐到容器中心，减少嵌套滚动场景下偏移。 */
export function centerAnchorInContainer(
  container: HTMLElement,
  anchorEl: HTMLElement
): void {
  const cRect = container.getBoundingClientRect();
  const aRect = anchorEl.getBoundingClientRect();
  const anchorCenterY = aRect.top + aRect.height / 2;
  const containerCenterY = cRect.top + cRect.height / 2;
  const delta = anchorCenterY - containerCenterY;
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  const next = container.scrollTop + delta;
  container.scrollTop = Math.max(0, Math.min(next, maxScroll));
}

/** 多帧重试等待锚点节点渲染完成，并滚动到容器中心。 */
export async function scrollAnchorIntoViewWhenReady(input: {
  container: HTMLElement | null;
  messageId: number;
  maxTries?: number;
  waitForLayout: () => Promise<void>;
}): Promise<boolean> {
  const maxTries = input.maxTries ?? 24;
  for (let i = 0; i < maxTries; i++) {
    await input.waitForLayout();
    const container = input.container;
    if (!container) return false;
    const el = container.querySelector(
      `[data-message-id="${input.messageId}"]`
    ) as HTMLElement | null;
    if (el) {
      centerAnchorInContainer(container, el);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      centerAnchorInContainer(container, el);
      return true;
    }
  }
  return false;
}

/** 搜索跳锚点流程参数（状态由组件托管，业务流程由 normalize 执行）。 */
export interface SearchAnchorJumpInput {
  messageId: number;
  convId: number | null;
  requestSeq: number;
  getLatestSeq: () => number;
  setSearchOpen: (open: boolean) => void;
  setSuppressAutoScroll: (suppress: boolean) => void;
  loadAroundAnchor: (
    messageId: number,
    limit: number,
    convId: number | null
  ) => Promise<void>;
  container: HTMLElement | null;
  waitForLayout: () => Promise<void>;
  onAnchorFlash: (messageId: number) => void;
  onAnchorNotFound: (messageId: number) => void;
  onError: (message: string) => void;
}

/** 执行搜索结果跳转到锚点消息的完整链路。 */
export async function runSearchAnchorJumpFlow(
  input: SearchAnchorJumpInput
): Promise<void> {
  input.setSearchOpen(false);
  input.setSuppressAutoScroll(true);
  try {
    await input.loadAroundAnchor(input.messageId, 25, input.convId);
    if (input.requestSeq !== input.getLatestSeq()) return;
    const ok = await scrollAnchorIntoViewWhenReady({
      container: input.container,
      messageId: input.messageId,
      waitForLayout: input.waitForLayout,
    });
    if (input.requestSeq !== input.getLatestSeq()) return;
    if (ok) {
      input.onAnchorFlash(input.messageId);
    } else {
      input.onAnchorNotFound(input.messageId);
    }
  } catch (e: unknown) {
    if (input.requestSeq === input.getLatestSeq()) {
      const msg = e instanceof Error ? e.message : "无法定位到该消息";
      input.onError(msg);
    }
  } finally {
    if (input.requestSeq === input.getLatestSeq()) {
      input.setSuppressAutoScroll(false);
    }
  }
}

/** 顶部 prepend 加载后，保持原视口锚点不跳动。 */
export async function preserveScrollAfterPrepend(
  container: HTMLElement | null,
  runLoad: () => Promise<void>,
  waitForLayout: () => Promise<void>
): Promise<void> {
  if (!container) {
    await runLoad();
    return;
  }
  const h0 = container.scrollHeight;
  const top0 = container.scrollTop;
  await runLoad();
  await waitForLayout();
  const dh = container.scrollHeight - h0;
  if (dh > 0) {
    container.scrollTop = top0 + dh;
  }
}

/** 底部 append 加载后，保持距底距离不变。 */
export async function preserveScrollAfterAppend(
  container: HTMLElement | null,
  runLoad: () => Promise<void>,
  waitForLayout: () => Promise<void>
): Promise<void> {
  if (!container) {
    await runLoad();
    return;
  }
  const gap = container.scrollHeight - container.scrollTop - container.clientHeight;
  await runLoad();
  await waitForLayout();
  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
  container.scrollTop = Math.max(
    0,
    Math.min(maxTop, container.scrollHeight - container.clientHeight - gap)
  );
}

/** 滚动分页状态机依赖（由组件注入 store 读写能力）。 */
export interface ScrollPaginationMachineInput {
  container: HTMLElement | null;
  convId: number | null;
  now: number;
  paginationInFlight: boolean;
  edgeCooldownUntil: number;
  setPaginationInFlight: (value: boolean) => void;
  setEdgeCooldownUntil: (value: number) => void;
  edgeCooldownMs: number;
  showMessageState: {
    loading: boolean;
    historyLoading: boolean;
    anchorViewActive: boolean;
    canLoadOlderAnchor: boolean;
    canLoadNewerAnchor: boolean;
    hasMoreHistory: boolean;
    anchorNewerPaginateLoading: boolean;
  };
  getOldestMessageId: () => number | null;
  getLatestMessageId: () => number | null;
  loadOlderAnchor: (boundaryMessageId: number) => Promise<void>;
  loadHistory: (convId: number, boundaryMessageId: number) => Promise<void>;
  loadNewerAnchor: (boundaryMessageId: number) => Promise<void>;
  waitForLayout: () => Promise<void>;
}

/**
 * 顶/底分页状态机：负责边界触发、并发锁、冷却与滚动保持。
 * 说明：该方法不依赖 Vue，组件只需要提供输入状态与回调。
 */
export async function runScrollPaginationStateMachine(
  input: ScrollPaginationMachineInput
): Promise<void> {
  const container = input.container;
  if (!container || !input.convId) return;
  if (input.paginationInFlight) return;
  if (input.now < input.edgeCooldownUntil) return;

  const topHit = container.scrollTop <= EDGE_TRIGGER_THRESHOLD_PX;
  const bottomGap =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  const bottomHit = bottomGap <= EDGE_TRIGGER_THRESHOLD_PX;

  const lockAndCooldown = async (task: () => Promise<void>) => {
    input.setPaginationInFlight(true);
    try {
      await task();
    } finally {
      input.setPaginationInFlight(false);
      input.setEdgeCooldownUntil(Date.now() + input.edgeCooldownMs);
    }
  };

  if (topHit) {
    if (input.showMessageState.loading) return;
    if (input.showMessageState.anchorViewActive) {
      if (
        input.showMessageState.historyLoading ||
        !input.showMessageState.canLoadOlderAnchor
      ) {
        return;
      }
      const oldestId = input.getOldestMessageId();
      if (!oldestId) return;
      await lockAndCooldown(() =>
        preserveScrollAfterPrepend(
          container,
          () => input.loadOlderAnchor(oldestId),
          input.waitForLayout
        )
      );
      return;
    }

    if (
      input.showMessageState.historyLoading ||
      !input.showMessageState.hasMoreHistory
    ) {
      return;
    }
    const oldestId = input.getOldestMessageId();
    if (!oldestId) return;
    await lockAndCooldown(() =>
      preserveScrollAfterPrepend(
        container,
        () => input.loadHistory(input.convId!, oldestId),
        input.waitForLayout
      )
    );
    return;
  }

  if (
    bottomHit &&
    input.showMessageState.anchorViewActive &&
    input.showMessageState.canLoadNewerAnchor
  ) {
    if (
      input.showMessageState.loading ||
      input.showMessageState.historyLoading ||
      input.showMessageState.anchorNewerPaginateLoading
    ) {
      return;
    }
    const newestId = input.getLatestMessageId();
    if (!newestId) return;
    await lockAndCooldown(() =>
      preserveScrollAfterAppend(
        container,
        () => input.loadNewerAnchor(newestId),
        input.waitForLayout
      )
    );
  }
}

/** 会话切换时加载消息并同步当前会话的 WS 订阅。 */
export async function loadConversationMessagesAndSyncRealtime(input: {
  convId: number;
  loadMessages: (convId: number) => Promise<void>;
  waitForLayout: () => Promise<void>;
  scrollToBottom: () => void;
  isWsConnected: boolean;
  isWsConnecting: boolean;
  initWebSocket: () => Promise<void>;
  ensureWebSocketListeners: () => void;
  currentUserId?: number;
  connectWebSocket: (userId: number, convId: number) => Promise<void>;
  subscribeConversation: (convId: number) => unknown;
}): Promise<void> {
  await input.loadMessages(input.convId);
  await input.waitForLayout();
  input.scrollToBottom();

  if (!input.isWsConnected && !input.isWsConnecting) {
    await input.initWebSocket();
    return;
  }

  input.ensureWebSocketListeners();
  if (input.currentUserId) {
    await input.connectWebSocket(input.currentUserId, input.convId);
    input.subscribeConversation(input.convId);
  }
}
