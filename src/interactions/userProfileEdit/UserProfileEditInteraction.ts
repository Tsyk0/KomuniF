/**
 * UserProfileEditInteraction
 * - 存放 UserProfileEdit 组件的界面交互方法。
 * - 负责表单初始化、本地校验、头像压缩、错误文案与重置确认等逻辑。
 *
 * 方法目录（方法：功能）
 * - formatDateForInput：将日期转成 input[type=date] 可用格式。
 * - buildProfileFormData：由用户资料生成可编辑表单对象。
 * - compressImageToBase64：压缩图片并输出 base64。
 * - validateUserProfileForm：校验昵称/手机/邮箱等输入。
 * - buildUserProfileUpdatePayload：生成提交给 store 的更新 payload。
 * - mapUserProfileSaveError：统一保存失败文案。
 * - mapAvatarUploadError：统一头像上传失败文案。
 * - shouldResetProfileForm：重置前确认动作。
 */

export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0] || "";
}

export function buildProfileFormData(userData: any) {
  return {
    userId: userData.userId || "",
    userNickname: userData.userNickname || "",
    userAvatar: userData.userAvatar || "",
    userGender: userData.userGender || 0,
    userBirthday: formatDateForInput(userData.userBirthday),
    userLocation: userData.userLocation || "",
    userSignature: userData.userSignature || "",
    userPhone: userData.userPhone || "",
    userEmail: userData.userEmail || "",
  };
}

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

export function validateUserProfileForm(formData: any): string | null {
  if (!formData.userNickname?.trim()) return "昵称不能为空";
  if (formData.userPhone && !/^1[3-9]\d{9}$/.test(formData.userPhone)) {
    return "请输入有效的手机号";
  }
  if (formData.userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
    return "请输入有效的邮箱地址";
  }
  return null;
}

export function buildUserProfileUpdatePayload(formData: any) {
  const payload: any = {
    userId: formData.userId,
    userNickname: formData.userNickname?.trim(),
    userGender: formData.userGender,
    userBirthday: formData.userBirthday || null,
    userLocation: formData.userLocation?.trim() || null,
    userSignature: formData.userSignature?.trim() || null,
    userPhone: formData.userPhone?.trim() || null,
    userEmail: formData.userEmail?.trim() || null,
  };
  if (formData.userAvatar && String(formData.userAvatar).startsWith("data:image/")) {
    payload.userAvatar = formData.userAvatar;
  }
  return payload;
}

export function mapUserProfileSaveError(error: unknown): string {
  const err = error as { message?: string };
  return err?.message || "保存失败，请稍后重试";
}

export function mapAvatarUploadError(error: unknown): string {
  const err = error as { message?: string };
  return err?.message || "图片处理失败，请重试";
}

export function shouldResetProfileForm(confirmFn: (message: string) => boolean): boolean {
  return confirmFn("确定要重置所有修改吗？");
}
