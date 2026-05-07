import service from "@/apis/service";
import type { BaseResponse } from "@/types/dto/base";
import type {
  FileUploadCompleteRequest,
  FileUploadCompleteResponseData,
  FileUploadInitRequest,
  FileUploadInitResponseData,
  FileUploadProgressResponseData,
} from "@/types/dto/file-upload";

/**
 * 统一解包上传接口响应，兼容：
 * 1) Axios 原始响应：response.data.data
 * 2) 已被拦截器解包后的 ApiResponse：response.data
 */
const unwrapApiResponseData = <T>(response: any): T => {
  if (response?.data?.data !== undefined) return response.data.data as T;
  if (response?.data !== undefined && response?.code !== undefined)
    return response.data as T;
  return response as T;
};

/**
 * 初始化分片上传任务。
 * 作用场景：告知后端文件元信息，拿到 uploadId 或秒传结果。
 */
export function initFileUploadApi(data: FileUploadInitRequest) {
  const accessToken = localStorage.getItem("access_token");
  return service
    .post<BaseResponse<FileUploadInitResponseData>>("/MIO/file/upload/init", data, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    .then((response) =>
      unwrapApiResponseData<FileUploadInitResponseData>(response)
    ) as Promise<FileUploadInitResponseData>;
}

/**
 * 上传单个分片。
 * 作用场景：前端按分片索引逐个或并发调用，支持失败重试。
 */
export function uploadChunkApi(uploadId: string, index: number, chunk: Blob) {
  const formData = new FormData();
  formData.append("uploadId", uploadId);
  formData.append("index", String(index));
  formData.append("file", chunk);
  return service
    .post<BaseResponse<null>>("/MIO/file/upload/chunk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(() => undefined) as Promise<void>;
}

/**
 * 查询当前上传进度。
 * 作用场景：断网重连后同步后端已收分片，继续补传剩余分片。
 */
export function getFileUploadProgressApi(uploadId: string) {
  return service
    .get<BaseResponse<FileUploadProgressResponseData>>("/MIO/file/upload/progress", {
      params: { uploadId },
    })
    .then((response) =>
      unwrapApiResponseData<FileUploadProgressResponseData>(response)
    ) as Promise<FileUploadProgressResponseData>;
}

/**
 * 通知后端分片上传完成并触发合并。
 * 作用场景：所有 chunk 成功后校验 hash，产出最终 fileId。
 */
export function completeFileUploadApi(data: FileUploadCompleteRequest) {
  return service
    .post<BaseResponse<FileUploadCompleteResponseData>>(
      "/MIO/file/upload/complete",
      data
    )
    .then((response) =>
      unwrapApiResponseData<FileUploadCompleteResponseData>(response)
    ) as Promise<FileUploadCompleteResponseData>;
}
