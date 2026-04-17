// File: src/types/backend/file-upload-dto.ts
import type { JavaLong } from "./common";

export interface InitMultipartUploadRequestDTO {
  fileName: string;
  fileSize: JavaLong;
  plainHash: string;
  totalChunks: number;
  encryptAlgo: string;
}

export interface InitMultipartUploadResponseDTO {
  fileId: string;
  uploadId: string;
  uploadedParts: number[];
  instantUpload: boolean;
}

export interface UploadChunkRequestDTO {
  fileId: string;
  uploadId: string;
  partNumber: number;
  chunkSize: JavaLong;
  chunkHash?: string;
}

export interface UploadProgressResponseDTO {
  fileId: string;
  uploadId: string;
  totalChunks: number;
  uploadedParts: number[];
}

export interface CompleteUploadRequestDTO {
  fileId: string;
  uploadId: string;
}
