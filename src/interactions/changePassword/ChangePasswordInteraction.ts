/**
 * ChangePasswordInteraction
 * - 存放 ChangePassword 组件的交互流程方法。
 * - 负责密码表单校验、错误清空与重置表单数据构建。
 *
 * 方法目录（方法：功能）
 * - isChangePasswordFormSubmittable：判断提交按钮是否可点击。
 * - validateNewPasswordInput：校验新密码相关规则。
 * - createEmptyChangePasswordForm：创建空表单数据。
 * - createEmptyChangePasswordErrors：创建空错误对象。
 */

export type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordErrors = {
  currentPassword: string;
  confirmPassword: string;
};

/** 判断提交按钮是否可点击。 */
export function isChangePasswordFormSubmittable(form: ChangePasswordForm): boolean {
  return (
    !!form.currentPassword &&
    !!form.newPassword &&
    !!form.confirmPassword &&
    form.newPassword === form.confirmPassword &&
    form.newPassword.length >= 6
  );
}

/** 校验新密码相关规则。 */
export function validateNewPasswordInput(form: ChangePasswordForm): string | null {
  if (form.newPassword.length < 6) return "新密码至少需要6个字符";
  if (form.newPassword !== form.confirmPassword) return "两次输入的新密码不一致";
  if (form.newPassword === form.currentPassword) return "新密码不能与原密码相同";
  return null;
}

/** 创建空表单数据。 */
export function createEmptyChangePasswordForm(): ChangePasswordForm {
  return {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

/** 创建空错误对象。 */
export function createEmptyChangePasswordErrors(): ChangePasswordErrors {
  return {
    currentPassword: "",
    confirmPassword: "",
  };
}
