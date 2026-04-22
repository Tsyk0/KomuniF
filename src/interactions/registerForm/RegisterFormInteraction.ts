/**
 * RegisterFormInteraction
 * - 存放 RegisterForm 组件的交互流程方法。
 * - 负责注册表单校验、错误状态初始化、提交异常文案、成功提示文案构建。
 *
 * 方法目录（方法：功能）
 * - createRegisterErrors：创建空错误对象。
 * - validateRegisterForm：校验注册表单并返回错误对象。
 * - buildRegisterSuccessNotice：生成注册成功提示文案。
 * - mapRegisterExceptionMessage：统一提取注册异常提示文案。
 */

export type RegisterErrors = {
  userNickname: string;
  userPassword: string;
  confirmPassword: string;
  terms: string;
};

/** 创建空错误对象。 */
export function createRegisterErrors(): RegisterErrors {
  return {
    userNickname: "",
    userPassword: "",
    confirmPassword: "",
    terms: "",
  };
}

/** 校验注册表单并返回错误对象。 */
export function validateRegisterForm(input: {
  userNickname: string;
  userPassword: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}): { valid: boolean; errors: RegisterErrors } {
  const errors = createRegisterErrors();
  if (!input.userNickname.trim()) {
    errors.userNickname = "昵称不能为空";
  } else if (input.userNickname.length < 2) {
    errors.userNickname = "昵称至少2个字符";
  }
  if (!input.userPassword) {
    errors.userPassword = "密码不能为空";
  } else if (input.userPassword.length < 6) {
    errors.userPassword = "密码至少6个字符";
  }
  if (input.userPassword !== input.confirmPassword) {
    errors.confirmPassword = "两次输入的密码不一致";
  }
  if (!input.acceptedTerms) {
    errors.terms = "请同意服务条款和隐私政策";
  }
  const valid = Object.values(errors).every((v) => !v);
  return { valid, errors };
}

/** 生成注册成功提示文案。 */
export function buildRegisterSuccessNotice(userId: unknown): string {
  return `注册成功！\n\n您的用户ID是：${userId}\n\n请务必记住这个ID，这是您登录的唯一凭证`;
}

/** 统一提取注册异常提示文案。 */
export function mapRegisterExceptionMessage(error: unknown): string {
  const err = error as { message?: string };
  return `注册异常: ${err?.message || "未知错误"}`;
}
