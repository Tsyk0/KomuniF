import { fetchInlinePreviewBlobApi } from "@/apis/file/preview";

/**
 * 通过 /play 拉取图片并转成 object URL（保留 axios 鉴权头）。
 * 使用场景：消息图片点击放大预览；禁止改用 /download 以免与附件下载语义混淆。
 */
export async function fetchOriginImagePreviewUrlNormalized(
  playUrl: string
): Promise<string> {
  const imageBlob = await fetchInlinePreviewBlobApi(playUrl);
  return URL.createObjectURL(imageBlob);
}
