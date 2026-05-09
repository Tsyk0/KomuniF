import service from "@/apis/service";

/**
 * 获取内联预览资源（如图片 /play）的二进制数据。
 * 使用场景：聊天图片点击放大后走 Bearer 鉴权拉取原图；URL 须为 /play 而非 /download。
 */
export function fetchInlinePreviewBlobApi(playUrl: string) {
  return service.get(playUrl, {
    responseType: "blob",
  }) as unknown as Promise<Blob>;
}
