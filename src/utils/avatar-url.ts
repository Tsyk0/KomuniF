/**
 * 统一头像地址：会话列表、好友列表、聊天顶栏等处共用，与 Pinia 好友映射一致（基于 VITE_API_BASE_URL）。
 */
export function normalizeAvatarUrl(avatar?: string | null): string {
  if (avatar == null) return "";
  const trimmed = String(avatar).trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:image/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) {
    if (typeof window !== "undefined" && window.location?.protocol) {
      return `${window.location.protocol}${trimmed}`;
    }
    return `https:${trimmed}`;
  }

  const prefix = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!prefix) return path;
  return `${prefix}${path}`;
}
