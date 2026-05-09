/**
 * 构造文件下载地址（attachment 流，不宜作为 video src）。
 * 使用场景：附件「保存/下载」、浏览器下载任务。
 */
export function buildFileDownloadUrl(fileId: string): string {
  if (!fileId) return "";
  return `/MIO/file/${encodeURIComponent(fileId)}/download`;
}

/**
 * 构造内联播放/预览地址（支持 Range，适合 `<video>` / 原图拉流）。
 * 使用场景：图片放大预览、视频播放器 src；下载仍走 {@link buildFileDownloadUrl}。
 */
export function buildFilePlayUrl(fileId: string): string {
  if (!fileId) return "";
  return `/MIO/file/${encodeURIComponent(fileId)}/play`;
}

/**
 * 将后端返回的相对文件路径拼成可给浏览器或 axios 使用的完整 URL。
 * 使用场景：`playUrl` / `downloadUrl` 为 `/MIO/...` 且生产环境前端与 API 不同源时。
 * 说明：`VITE_API_BASE_URL` 为空时原样返回相对路径，便于开发环境走 Vite `/MIO` 代理。
 */
export function resolveFileResourceUrl(url: string): string {
  const s = (url || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const base = (import.meta.env.VITE_API_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  if (!base) return path;
  return `${base}${path}`;
}

/**
 * 构造图片缩略图地址。
 * 使用场景：消息列表渲染图片气泡缩略图。
 */
export function buildFileThumbnailUrl(fileId: string): string {
  if (!fileId) return "";
  return `/MIO/file/${encodeURIComponent(fileId)}/thumbnail`;
}
