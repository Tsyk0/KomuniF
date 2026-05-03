/**
 * 计算群成员资料卡 fixed 定位的初始 top/left（相对视口）。
 * 使用场景：点击成员行或消息头像后，在锚点旁展开弹层。
 */
export function computeMemberPopoverPosition(
  anchorRect: DOMRect,
  options?: { panelWidth?: number; panelHeightEstimate?: number; gap?: number }
): { top: number; left: number } {
  const panelW = options?.panelWidth ?? 256;
  const panelHEstimate = options?.panelHeightEstimate ?? 360;
  const gap = options?.gap ?? 8;
  let left = anchorRect.right + gap;
  if (left + panelW > window.innerWidth - gap) {
    left = anchorRect.left - panelW - gap;
  }
  if (left < gap) {
    left = gap;
  }
  let top = anchorRect.top;
  if (top + panelHEstimate > window.innerHeight - gap) {
    top = Math.max(gap, window.innerHeight - panelHEstimate - gap);
  }
  if (top < gap) {
    top = gap;
  }
  return { top, left };
}

/**
 * 按弹层真实高度上推 top，使底边不超过视口底（留 margin）。
 * 使用场景：nextTick / rAF 后校正，避免底部按钮被裁切。
 */
export function clampMemberPopoverWithinViewportBottom(
  panelEl: HTMLElement,
  posRef: { top: number; left: number },
  margin = 8
): { top: number; left: number } {
  const h = panelEl.getBoundingClientRect().height;
  const maxTop = window.innerHeight - margin - h;
  const cur = posRef.top;
  const nextTop = Math.max(margin, Math.min(cur, maxTop));
  return { top: nextTop, left: posRef.left };
}
