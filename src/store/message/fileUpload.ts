import { defineStore } from "pinia";
import { ref } from "vue";
import {
  calculateFileSha256Normalized,
  uploadFileByChunksNormalized,
} from "@/normalize/message";

export const useFileUploadStore = defineStore("fileUpload", () => {
  const visible = ref(false);
  const fileName = ref("");
  const progress = ref(0);
  const uploading = ref(false);

  /**
   * 初始化上传状态。
   * 使用场景：用户刚选择文件，开始上传主流程前。
   */
  const startUploadState = (name: string) => {
    visible.value = true;
    fileName.value = name;
    progress.value = 1;
    uploading.value = true;
  };

  /**
   * 清理上传状态。
   * 使用场景：上传成功/失败后收尾，隐藏进度条并重置状态。
   */
  const resetUploadState = () => {
    visible.value = false;
    fileName.value = "";
    progress.value = 0;
    uploading.value = false;
  };

  /**
   * 执行“计算 hash + 分片上传 + complete”的完整流程。
   * 使用场景：组件只需调用本方法拿到 fileId，不直接接触 API。
   */
  const uploadFile = async (params: {
    file: File;
    convId: number;
    mimeType: string;
  }) => {
    startUploadState(params.file.name);
    try {
      const fileHash = await calculateFileSha256Normalized(params.file);
      progress.value = 5;
      const result = await uploadFileByChunksNormalized({
        file: params.file,
        convId: params.convId,
        mimeType: params.mimeType,
        fileHash,
        onProgress: (value) => {
          progress.value = value;
        },
      });
      return result;
    } finally {
      setTimeout(() => {
        resetUploadState();
      }, 1200);
    }
  };

  return {
    visible,
    fileName,
    progress,
    uploading,
    uploadFile,
    resetUploadState,
  };
});
