import { fetchOriginImageBlobApi } from "@/apis/file/preview";

/**
 * 获取原图并转换成浏览器可直接展示的 object URL。
 * 使用场景：消息图片点击放大预览时，先通过后端下载接口拉取原图。
 */
export async function fetchOriginImagePreviewUrlNormalized(
  downloadUrl: string
): Promise<string> {
  const imageBlob = await fetchOriginImageBlobApi(downloadUrl);
  return URL.createObjectURL(imageBlob);
}
