export interface FileUploadInitRequest {
  convId: number;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  fileHash: string;
  mimeType: string;
}

export interface FileUploadInitResponseData {
  uploadId: string | null;
  instantUpload: boolean;
  fileId: string | null;
  uploadedIndexes: number[];
}

export interface FileUploadProgressResponseData {
  uploadId: string;
  totalChunks: number;
  uploadedIndexes: number[];
}

export interface FileUploadCompleteRequest {
  uploadId: string;
  fileHash: string;
}

export type FileUploadCompleteResponseData = string;
