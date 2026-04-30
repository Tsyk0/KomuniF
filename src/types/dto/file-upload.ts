export interface FileUploadInitRequest {
  convId: number;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  fileHash: string;
  mimeType: string;
}

export interface FileUploadInitResponseData {
  uploadId: string;
  instantUpload: boolean;
  fileId?: string;
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

export interface FileUploadCompleteResponseData {
  uploadId?: string;
  fileId?: string;
}
