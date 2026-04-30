/**
 * 构造文件下载地址。
 * 使用场景：消息文件/视频点击下载、图片原图预览。
 */
export function buildFileDownloadUrl(fileId: string): string {
  if (!fileId) return "";
  return `/MIO/file/${encodeURIComponent(fileId)}/download`;
}

/**
 * 构造图片缩略图地址。
 * 使用场景：消息列表渲染图片气泡缩略图。
 */
export function buildFileThumbnailUrl(fileId: string): string {
  if (!fileId) return "";
  return `/MIO/file/${encodeURIComponent(fileId)}/thumbnail`;
}
