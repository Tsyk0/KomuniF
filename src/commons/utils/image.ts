// File: src/commons/utils/image.ts
export type ValidateImageFileOptions = {
  maxSizeBytes?: number;
  allowMimePrefix?: string;
};

/**
 * 校验图片文件是否可上传。
 * 使用场景：头像选择后，在提交前统一做体积与 MIME 类型校验。
 */
export function validateImageFile(
  file: File | null | undefined,
  options: ValidateImageFileOptions = {}
): { ok: boolean; message?: string } {
  if (!file) return { ok: false, message: "未选择文件" };
  const maxSizeBytes = options.maxSizeBytes ?? 2 * 1024 * 1024;
  const allowMimePrefix = options.allowMimePrefix ?? "image/";
  if (file.size > maxSizeBytes) {
    return { ok: false, message: `图片大小不能超过 ${Math.floor(maxSizeBytes / 1024 / 1024)}MB` };
  }
  if (!file.type.startsWith(allowMimePrefix)) {
    return { ok: false, message: "请选择图片文件" };
  }
  return { ok: true };
}

/**
 * 压缩图片并输出 base64。
 * 使用场景：需要以 base64 形式暂存或提交图片（例如个人资料编辑）。
 */
export function compressImageToBase64(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.94
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 为图片文件生成本地预览 URL。
 * 使用场景：会话头像或用户头像在“点击保存前”即时预览。
 */
export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 释放通过 createObjectURL 创建的预览 URL。
 * 使用场景：重新选择图片、取消编辑、组件卸载时清理资源。
 */
export function revokeImagePreviewUrl(url: string | null | undefined): void {
  if (!url) return;
  URL.revokeObjectURL(url);
}

