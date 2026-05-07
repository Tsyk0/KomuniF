// File: src/commons/utils/avatar-url.ts
import { buildFileThumbnailUrl } from "@/commons/utils/file-url";
/**
 * 统一头像地址：会话列表、好友列表、聊天顶栏等处共用，与 Pinia 好友映射一致（基于 VITE_API_BASE_URL）。
 */
export function normalizeAvatarUrl(avatar?: string | null): string {
  if (avatar == null) return "";
  const trimmed = String(avatar).trim();
  if (!trimmed) return "";
  if (isLikelyMinioFileId(trimmed)) {
    return buildFileThumbnailUrl(trimmed);
  }

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

/**
 * 判断字符串是否更像 MINIO fileId（而不是 URL/相对路径）。
 * 使用场景：会话头像字段存放 fileId 时，决定是否走缩略图地址拼接。
 */
function isLikelyMinioFileId(raw: string): boolean {
  if (!raw) return false;
  if (raw.includes("/") || raw.includes("\\")) return false;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("//")) return false;
  if (raw.startsWith("data:image/")) return false;
  return /^[A-Za-z0-9_-]{8,}$/.test(raw);
}

/**
 * 统一会话头像地址：兼容旧 URL/相对路径与新 MINIO fileId。
 * 使用场景：群聊/单聊会话头像渲染时，按约定将 fileId 映射到缩略图接口。
 */
export function normalizeConversationAvatarUrl(avatar?: string | null): string {
  if (avatar == null) return "";
  const trimmed = String(avatar).trim();
  if (!trimmed) return "";
  return normalizeAvatarUrl(trimmed);
}
