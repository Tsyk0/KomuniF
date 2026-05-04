/**
 * ChatContainerInteraction
 * - 存放 ChatContainer 组件的界面交互与容器行为方法。
 * - 这些方法不负责 API 数据转换，仅处理滚动、输入框、锚点跳转、窗口事件等交互逻辑。
 *
 * 方法目录（方法：功能）
 * - resetMessageComposerView：发送后重置输入框内容与高度。
 * - resizeMessageComposer：根据内容自动调整输入框高度。
 * - isContainerNearBottom：判断消息容器是否贴近底部。
 * - scrollContainerToBottom：将消息容器滚动到底部。
 * - centerAnchorInContainer：将锚点消息居中到容器可视区。
 * - scrollAnchorIntoViewWhenReady：多帧重试等待锚点节点后滚动定位。
 * - runSearchAnchorJumpFlow：执行搜索结果跳转锚点的完整流程。
 * - preserveScrollAfterPrepend：顶部加载后保持视口位置稳定。
 * - preserveScrollAfterAppend：底部加载后保持距底距离稳定。
 * - runScrollPaginationStateMachine：执行顶部/底部分页触发与冷却控制。
 * - loadConversationMessagesAndSyncRealtime：切会话后加载消息并同步实时订阅。
 * - bindWindowWebSocketListeners：绑定/解绑页面级 websocket 事件监听。
 * - startInfoPanelResizeFlow：开始右侧信息面板拖拽。
 * - handleInfoPanelResizeFlow：拖拽中按光标更新面板宽度。
 * - stopInfoPanelResizeFlow：结束拖拽并清理页面副作用。
 */

/** 输入框最大高度（与 ChatContainer 展示保持一致）。 */
const MESSAGE_INPUT_MAX_HEIGHT = 120;
/** 滚动分页边界阈值。 */
const EDGE_TRIGGER_THRESHOLD_PX = 40;

/** 发送成功后重置消息输入框。 */
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
  // 消息滚动容器（聊天列表 DOM）
  container: HTMLElement | null;
  // 要定位到的消息 ID
  messageId: number;
  // 最多重试次数（节点还没渲染出来时会继续等）
  maxTries?: number;
  // 等待界面稳定的方法（一般是 nextTick + requestAnimationFrame）
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

/** 搜索跳锚点流程参数（状态由组件托管，流程在 interactions 执行）。 */
export interface SearchAnchorJumpInput {
  // 目标消息 ID
  messageId: number;
  // 当前会话 ID
  convId: number | null;
  // 当前请求序号（防止旧请求覆盖新请求）
  requestSeq: number;
  // 获取最新请求序号的方法
  getLatestSeq: () => number;
  // 控制搜索面板开关
  setSearchOpen: (open: boolean) => void;
  // 控制“跳转期间禁止自动滚底”
  setSuppressAutoScroll: (suppress: boolean) => void;
  // 加载锚点附近消息（把目标消息拉到列表中）
  loadAroundAnchor: (
    messageId: number,
    limit: number,
    convId: number | null
  ) => Promise<void>;
  // 消息滚动容器 DOM
  container: HTMLElement | null;
  // 等待界面稳定
  waitForLayout: () => Promise<void>;
  // 跳转成功后触发高亮
  onAnchorFlash: (messageId: number) => void;
  // 跳转失败（找不到节点）时回调
  onAnchorNotFound: (messageId: number) => void;
  // 流程出错时回调
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
  // 消息滚动容器 DOM
  container: HTMLElement | null;
  // 当前会话 ID（没有会话就不分页）
  convId: number | null;
  // 当前时间戳（用于判断是否在冷却期）
  now: number;
  // 现在是不是正在加载更多消息
  paginationInFlight: boolean;
  // 冷却截止时间（在此之前不再触发新的分页）
  edgeCooldownUntil: number;
  // 更新“正在加载”状态
  setPaginationInFlight: (value: boolean) => void;
  // 更新“冷却截止时间”
  setEdgeCooldownUntil: (value: number) => void;
  // 每次加载后冷却时长（毫秒）
  edgeCooldownMs: number;
  // 从 store 注入当前分页相关状态
  showMessageState: {
    // 主加载中
    loading: boolean;
    // 历史加载中
    historyLoading: boolean;
    // 当前是否为锚点视图
    anchorViewActive: boolean;
    // 锚点视图下还能否向上加载
    canLoadOlderAnchor: boolean;
    // 锚点视图下还能否向下加载
    canLoadNewerAnchor: boolean;
    // 普通历史是否还有更多
    hasMoreHistory: boolean;
    // 锚点向下翻页是否加载中
    anchorNewerPaginateLoading: boolean;
  };
  // 取当前最旧消息 ID
  getOldestMessageId: () => number | null;
  // 取当前最新消息 ID
  getLatestMessageId: () => number | null;
  // 锚点模式向上加载
  loadOlderAnchor: (boundaryMessageId: number) => Promise<void>;
  // 普通模式向上加载历史
  loadHistory: (convId: number, boundaryMessageId: number) => Promise<void>;
  // 锚点模式向下加载
  loadNewerAnchor: (boundaryMessageId: number) => Promise<void>;
  // 等待界面稳定
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
  // 当前会话 ID
  convId: number;
  // 加载会话消息
  loadMessages: (convId: number) => Promise<void>;
  // 等待消息渲染完成
  waitForLayout: () => Promise<void>;
  // 加载后滚到底部
  scrollToBottom: () => void;
  // WS 是否已连接
  isWsConnected: boolean;
  // WS 是否正在连接
  isWsConnecting: boolean;
  // 发起 WS 连接
  initWebSocket: () => Promise<void>;
  // 确保 WS 监听器已注册
  ensureWebSocketListeners: () => void;
  // 当前用户 ID（用于订阅）
  currentUserId?: number;
  // 连接 WS 到指定会话
  connectWebSocket: (userId: number, convId: number) => Promise<void>;
  // 订阅指定会话
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

/** 绑定页面级 WS 事件监听并返回清理函数。 */
export function bindWindowWebSocketListeners(input: {
  // 新消息事件回调
  onNewMessage: (detail: any) => void;
  // 发送确认事件回调（当前可空实现）
  onMessageSent: (detail: any) => void;
  // 撤回广播事件回调
  onMessageRecalled?: (detail: any) => void;
  // 错误事件回调
  onError: (detail: any) => void;
}): () => void {
  const handleNewMessage = (event: Event) => {
    input.onNewMessage((event as CustomEvent).detail);
  };
  const handleMessageSent = (event: Event) => {
    input.onMessageSent((event as CustomEvent).detail);
  };
  const handleMessageRecalled = (event: Event) => {
    input.onMessageRecalled?.((event as CustomEvent).detail);
  };
  const handleError = (event: Event) => {
    input.onError((event as CustomEvent).detail);
  };
  window.addEventListener("websocket:newMessage", handleNewMessage);
  window.addEventListener("websocket:messageSent", handleMessageSent);
  window.addEventListener("websocket:messageRecalled", handleMessageRecalled);
  window.addEventListener("websocket:error", handleError);
  return () => {
    window.removeEventListener("websocket:newMessage", handleNewMessage);
    window.removeEventListener("websocket:messageSent", handleMessageSent);
    window.removeEventListener("websocket:messageRecalled", handleMessageRecalled);
    window.removeEventListener("websocket:error", handleError);
  };
}

/** 开始右侧信息面板拖拽。 */
export function startInfoPanelResizeFlow(input: {
  event: MouseEvent | TouchEvent;
  canResize: boolean;
  currentPanelWidth: number;
  setResizing: (value: boolean) => void;
  setStartX: (value: number) => void;
  setStartWidth: (value: number) => void;
  onPointerMove: (event: MouseEvent | TouchEvent) => void;
  onPointerUp: () => void;
}): void {
  if (!input.canResize) return;
  input.event.preventDefault();
  const clientX =
    "touches" in input.event
      ? input.event.touches[0].clientX
      : (input.event as MouseEvent).clientX;
  input.setResizing(true);
  input.setStartX(clientX);
  input.setStartWidth(input.currentPanelWidth);
  document.addEventListener("mousemove", input.onPointerMove as any);
  document.addEventListener("mouseup", input.onPointerUp as any);
  document.addEventListener("touchmove", input.onPointerMove as any);
  document.addEventListener("touchend", input.onPointerUp as any);
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
}

/** 拖拽过程中更新右侧信息面板宽度。 */
export function handleInfoPanelResizeFlow(input: {
  event: MouseEvent | TouchEvent;
  isResizing: boolean;
  startX: number;
  startWidth: number;
  minWidth?: number;
  maxWidth?: number;
  animationFrameId: number | null;
  setAnimationFrameId: (id: number | null) => void;
  setPanelWidth: (width: number) => void;
}): void {
  if (!input.isResizing) return;
  if (input.animationFrameId !== null) {
    cancelAnimationFrame(input.animationFrameId);
  }
  const nextId = requestAnimationFrame(() => {
    const currentX =
      "touches" in input.event
        ? input.event.touches[0].clientX
        : (input.event as MouseEvent).clientX;
    const deltaX = input.startX - currentX;
    const minWidth = input.minWidth ?? 360;
    const maxWidth = input.maxWidth ?? 800;
    let nextWidth = input.startWidth + deltaX;
    if (nextWidth < minWidth) nextWidth = minWidth;
    if (nextWidth > maxWidth) nextWidth = maxWidth;
    input.setPanelWidth(nextWidth);
  });
  input.setAnimationFrameId(nextId);
}

/** 结束右侧信息面板拖拽并清理副作用。 */
export function stopInfoPanelResizeFlow(input: {
  panelWidth: number;
  widthStorageKey: string;
  animationFrameId: number | null;
  setAnimationFrameId: (id: number | null) => void;
  setResizing: (value: boolean) => void;
  onPointerMove: (event: MouseEvent | TouchEvent) => void;
  onPointerUp: () => void;
}): void {
  input.setResizing(false);
  if (input.animationFrameId !== null) {
    cancelAnimationFrame(input.animationFrameId);
    input.setAnimationFrameId(null);
  }
  document.removeEventListener("mousemove", input.onPointerMove as any);
  document.removeEventListener("mouseup", input.onPointerUp as any);
  document.removeEventListener("touchmove", input.onPointerMove as any);
  document.removeEventListener("touchend", input.onPointerUp as any);
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
  try {
    localStorage.setItem(input.widthStorageKey, input.panelWidth.toString());
  } catch {
    // 存宽度失败不影响主流程
  }
}
