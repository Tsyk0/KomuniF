import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
/**
 * HomeViewInteraction
 * - 存放 HomeView 的界面交互与页面编排方法。
 * - 负责侧边栏拖拽、用户资料解析、头像 URL 处理、登出流程编排等。
 *
 * 方法目录（方法：功能）
 * - startSidebarResizeFlow：开始侧边栏拖拽。
 * - handleSidebarResizeFlow：拖拽中更新宽度。
 * - stopSidebarResizeFlow：结束拖拽并保存宽度。
 * - loadSidebarWidthFromStorage：从 localStorage 恢复侧边栏宽度。
 * - processHomeAvatarUrl：处理头像 URL（补全 baseUrl）。
 * - formatDateForInputInHome：日期转 input 可用格式。
 * - buildHomeUserStateFromSession：从 sessionStorage 构建用户展示状态。
 * - normalizeBackendUserPayload：规范化后端返回用户字段。
 * - mergeUserToSessionFlow：把用户信息合并回 sessionStorage。
 * - runHomeLogoutFlow：执行 Home 页退出登录主流程。
 */

export function startSidebarResizeFlow(input: {
  event: MouseEvent | TouchEvent;
  currentWidth: number;
  setResizing: (value: boolean) => void;
  setStartX: (value: number) => void;
  setStartWidth: (value: number) => void;
  onPointerMove: (event: MouseEvent | TouchEvent) => void;
  onPointerUp: () => void;
}): void {
  input.event.preventDefault();
  const startX =
    "touches" in input.event
      ? input.event.touches[0].clientX
      : (input.event as MouseEvent).clientX;
  input.setResizing(true);
  input.setStartX(startX);
  input.setStartWidth(input.currentWidth);
  document.addEventListener("mousemove", input.onPointerMove as any);
  document.addEventListener("mouseup", input.onPointerUp as any);
  document.addEventListener("touchmove", input.onPointerMove as any);
  document.addEventListener("touchend", input.onPointerUp as any);
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
}

export function handleSidebarResizeFlow(input: {
  event: MouseEvent | TouchEvent;
  isResizing: boolean;
  startX: number;
  startWidth: number;
  minWidth?: number;
  maxWidth?: number;
  animationFrameId: number | null;
  setAnimationFrameId: (id: number | null) => void;
  setWidth: (value: number) => void;
}): void {
  if (!input.isResizing) return;
  if (input.animationFrameId) cancelAnimationFrame(input.animationFrameId);
  const nextId = requestAnimationFrame(() => {
    const currentX =
      "touches" in input.event
        ? input.event.touches[0].clientX
        : (input.event as MouseEvent).clientX;
    const deltaX = currentX - input.startX;
    const minWidth = input.minWidth ?? 300;
    const maxWidth = input.maxWidth ?? 600;
    let width = input.startWidth + deltaX;
    width = Math.max(minWidth, Math.min(maxWidth, width));
    input.setWidth(width);
  });
  input.setAnimationFrameId(nextId);
}

export function stopSidebarResizeFlow(input: {
  width: number;
  widthKey: string;
  animationFrameId: number | null;
  setAnimationFrameId: (id: number | null) => void;
  setResizing: (value: boolean) => void;
  onPointerMove: (event: MouseEvent | TouchEvent) => void;
  onPointerUp: () => void;
}): void {
  input.setResizing(false);
  if (input.animationFrameId) {
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
    localStorage.setItem(input.widthKey, String(input.width));
  } catch {
    // ignore storage errors
  }
}

export function loadSidebarWidthFromStorage(input: {
  widthKey: string;
  minWidth?: number;
  maxWidth?: number;
}): number | null {
  try {
    const raw = localStorage.getItem(input.widthKey);
    if (!raw) return null;
    const value = parseInt(raw, 10);
    const minWidth = input.minWidth ?? 300;
    const maxWidth = input.maxWidth ?? 600;
    if (Number.isNaN(value)) return null;
    if (value < minWidth || value > maxWidth) return null;
    return value;
  } catch {
    return null;
  }
}

export function processHomeAvatarUrl(avatarUrl: unknown): string {
  if (typeof avatarUrl !== "string") return "";
  return normalizeAvatarUrl(avatarUrl);
}

export function formatDateForInputInHome(dateString: unknown): string {
  if (!dateString) return "";
  const date = new Date(String(dateString));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0] || "";
}

export function buildHomeUserStateFromSession(input: {
  sessionUserRaw: string | null;
}): {
  userId: string;
  userNickname: string;
  userAvatar: string;
  formData: Record<string, any>;
} | null {
  if (!input.sessionUserRaw) return null;
  try {
    const user = JSON.parse(input.sessionUserRaw) || {};
    const avatarUrl = processHomeAvatarUrl(user.userAvatar || "");
    return {
      userId: user.userId || "",
      userNickname: user.userNickname || "用户",
      userAvatar: avatarUrl,
      formData: {
        userId: user.userId || "",
        userNickname: user.userNickname || "",
        userAvatar: avatarUrl,
        userGender: user.userGender || 0,
        userBirthday: formatDateForInputInHome(user.userBirthday),
        userLocation: user.userLocation || "",
        userSignature: user.userSignature || "",
        userPhone: user.userPhone || "",
        userEmail: user.userEmail || "",
      },
    };
  } catch {
    return null;
  }
}

export function normalizeBackendUserPayload(backendUser: any): Record<string, any> {
  const pickFirstDefined = (...values: any[]) => {
    for (const value of values) {
      if (value !== undefined && value !== null) return value;
    }
    return undefined;
  };
  return {
    userId: pickFirstDefined(backendUser.userId, backendUser.user_id),
    userNickname: pickFirstDefined(
      backendUser.userNickname,
      backendUser.user_nickname,
      "用户"
    ),
    userAvatar: pickFirstDefined(backendUser.userAvatar, backendUser.user_avatar, ""),
    userGender: pickFirstDefined(backendUser.userGender, backendUser.user_gender, 0),
    userBirthday: pickFirstDefined(backendUser.userBirthday, backendUser.user_birthday, ""),
    userLocation: pickFirstDefined(backendUser.userLocation, backendUser.user_location, ""),
    userSignature: pickFirstDefined(backendUser.userSignature, backendUser.user_signature, ""),
    userPhone: pickFirstDefined(backendUser.userPhone, backendUser.user_phone, ""),
    userEmail: pickFirstDefined(backendUser.userEmail, backendUser.user_email, ""),
  };
}

export function mergeUserToSessionFlow(normalized: Record<string, any>): Record<string, any> {
  const existingRaw = sessionStorage.getItem("user");
  const existing = existingRaw
    ? (() => {
        try {
          return JSON.parse(existingRaw) || {};
        } catch {
          return {};
        }
      })()
    : {};
  const merged = { ...existing, ...normalized };
  sessionStorage.setItem("user", JSON.stringify(merged));
  return merged;
}

export async function runHomeLogoutFlow(input: {
  confirmLogout: () => boolean;
  resetConvCreate: () => void;
  resetNotification: () => void;
  resetConversation: () => void;
  resetMessage: () => void;
  logoutAuth: () => void;
  goLogin: () => Promise<void> | void;
}): Promise<boolean> {
  if (!input.confirmLogout()) return false;
  input.resetConvCreate();
  input.resetNotification();
  input.resetConversation();
  input.resetMessage();
  input.logoutAuth();
  await input.goLogin();
  return true;
}
