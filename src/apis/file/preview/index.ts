import service from "@/apis/service";

/**
 * 获取原图二进制数据。
 * 使用场景：点击聊天图片缩略图后，请求原图用于弹层预览。
 */
export function fetchOriginImageBlobApi(downloadUrl: string) {
  return service.get(downloadUrl, {
    responseType: "blob",
  }) as unknown as Promise<Blob>;
}
