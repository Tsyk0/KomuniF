import {
  completeFileUploadApi,
  getFileUploadProgressApi,
  initFileUploadApi,
  uploadChunkApi,
} from "@/apis/file/upload";

export interface UploadFileByChunksNormalizedParams {
  file: File;
  convId: number;
  mimeType: string;
  fileHash: string;
  onProgress?: (progress: number) => void;
}

export interface UploadFileByChunksNormalizedResult {
  fileId: string;
  instantUpload: boolean;
}

/**
 * 等待网络恢复。
 * 使用场景：上传过程中断网后暂停分片发送，联网后继续补传。
 */
const waitForNetworkOnline = () =>
  new Promise<void>((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }
    const onlineHandler = () => {
      window.removeEventListener("online", onlineHandler);
      resolve();
    };
    window.addEventListener("online", onlineHandler);
  });

/**
 * 上传单个分片并重试。
 * 使用场景：网络抖动导致单片失败时，避免整次上传直接失败。
 */
const uploadSingleChunkWithRetry = async (
  uploadId: string,
  chunkIndex: number,
  chunk: Blob,
  retryTimes = 3
) => {
  let lastError: unknown;
  for (let attempt = 0; attempt < retryTimes; attempt++) {
    try {
      await uploadChunkApi(uploadId, chunkIndex, chunk);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
};

/**
 * 计算文件 SHA-256。
 * 使用场景：上传 init/complete 阶段用于秒传判定与完整性校验。
 */
export const calculateFileSha256Normalized = async (file: File): Promise<string> => {
  const fileBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * 执行分片上传并返回最终 fileId。
 * 使用场景：store 调用该方法完成上传主流程，再把结果交给组件发送业务消息。
 */
export async function uploadFileByChunksNormalized(
  params: UploadFileByChunksNormalizedParams
): Promise<UploadFileByChunksNormalizedResult> {
  const CHUNK_SIZE = 1024 * 1024;
  const totalChunks = Math.ceil(params.file.size / CHUNK_SIZE);
  const initResponse = await initFileUploadApi({
    convId: params.convId,
    fileName: params.file.name,
    fileSize: params.file.size,
    totalChunks,
    fileHash: params.fileHash,
    mimeType: params.mimeType,
  });
  const initData = initResponse;
  if (!initData) {
    throw new Error("上传初始化失败");
  }
  if (initData.instantUpload && initData.fileId) {
    params.onProgress?.(100);
    return { fileId: initData.fileId, instantUpload: true };
  }
  if (!initData.uploadId) {
    throw new Error("上传初始化失败");
  }

  const uploadId = initData.uploadId;
  const concurrency = 3;
  /** 后端已确认分片序号集合（从 1 开始）；用于断点续传去重 */
  const uploadedIndexSet = new Set<number>();

  while (uploadedIndexSet.size < totalChunks) {
    if (!navigator.onLine) {
      await waitForNetworkOnline();
    }
    const progressResponse = await getFileUploadProgressApi(uploadId);
    const uploadedIndexes = progressResponse.uploadedIndexes || [];
    uploadedIndexes
      .filter((chunkIndex: number) => chunkIndex >= 1 && chunkIndex <= totalChunks)
      .forEach((chunkIndex: number) => uploadedIndexSet.add(chunkIndex));

    const pendingIndexes: number[] = [];
    for (let chunkIndex = 1; chunkIndex <= totalChunks; chunkIndex++) {
      if (!uploadedIndexSet.has(chunkIndex)) pendingIndexes.push(chunkIndex);
    }
    if (pendingIndexes.length === 0) break;

    for (let i = 0; i < pendingIndexes.length; i += concurrency) {
      const batch = pendingIndexes.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (chunkIndex) => {
          /** 后端 chunkIndex 从 1 开始；本地切片偏移要转成 0 基 */
          const zeroBasedIndex = chunkIndex - 1;
          const start = zeroBasedIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, params.file.size);
          const chunk = params.file.slice(start, end);
          await uploadSingleChunkWithRetry(uploadId, chunkIndex, chunk);
          uploadedIndexSet.add(chunkIndex);
          const progress = Math.min(
            99,
            Math.floor((uploadedIndexSet.size / totalChunks) * 100)
          );
          params.onProgress?.(progress);
        })
      );
    }
  }

  const completeResponse = await completeFileUploadApi({
    uploadId,
    fileHash: params.fileHash,
  });
  const finalFileId = completeResponse || initData.fileId;

  if (!finalFileId) {
    throw new Error("上传完成但未返回 fileId");
  }
  params.onProgress?.(100);
  return { fileId: finalFileId, instantUpload: false };
}
