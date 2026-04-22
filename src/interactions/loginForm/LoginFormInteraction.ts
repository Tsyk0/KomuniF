/**
 * LoginFormInteraction
 * - 存放 LoginForm 组件的交互流程方法。
 * - 负责记住我数据读取、免密提示判定、登录表单校验、异常文案映射。
 *
 * 方法目录（方法：功能）
 * - resolveRememberedAccountState：读取并解析记住我数据。
 * - resolveUserIdChangeState：用户 ID 变化后计算免密提示状态。
 * - validateLoginForm：校验登录必填项。
 * - mapLoginErrorMessage：统一提取登录异常文案。
 */

/** 读取并解析记住我数据。 */
export function resolveRememberedAccountState(input: {
  hasRememberedAccount: boolean;
  rememberMeDataRaw: string | null;
}): {
  savedUserId: string;
  formUserId: string;
  rememberMe: boolean;
  showAutoLoginHint: boolean;
  shouldClearCorruptedData: boolean;
} {
  if (!input.hasRememberedAccount || !input.rememberMeDataRaw) {
    return {
      savedUserId: "",
      formUserId: "",
      rememberMe: false,
      showAutoLoginHint: false,
      shouldClearCorruptedData: false,
    };
  }
  try {
    const parsed = JSON.parse(input.rememberMeDataRaw) as { userId?: unknown };
    const userId = String(parsed?.userId ?? "");
    if (!userId) {
      return {
        savedUserId: "",
        formUserId: "",
        rememberMe: false,
        showAutoLoginHint: false,
        shouldClearCorruptedData: true,
      };
    }
    return {
      savedUserId: userId,
      formUserId: userId,
      rememberMe: true,
      showAutoLoginHint: true,
      shouldClearCorruptedData: false,
    };
  } catch {
    return {
      savedUserId: "",
      formUserId: "",
      rememberMe: false,
      showAutoLoginHint: false,
      shouldClearCorruptedData: true,
    };
  }
}

/** 用户 ID 变化后计算免密提示状态。 */
export function resolveUserIdChangeState(input: {
  currentUserId: string;
  savedUserId: string;
  autoLoginAvailable: boolean;
  showAutoLoginHint: boolean;
}): { rememberMe: boolean; showAutoLoginHint: boolean } {
  if (input.currentUserId !== input.savedUserId) {
    return { rememberMe: false, showAutoLoginHint: false };
  }
  if (input.autoLoginAvailable) {
    return {
      rememberMe: true,
      showAutoLoginHint: input.showAutoLoginHint || true,
    };
  }
  return { rememberMe: false, showAutoLoginHint: false };
}

/** 校验登录必填项。 */
export function validateLoginForm(input: {
  userId: string;
  userPwd: string;
}): string | null {
  if (!input.userId.trim()) return "请输入用户ID";
  if (!input.userPwd) return "请输入密码";
  return null;
}

/** 统一提取登录异常文案。 */
export function mapLoginErrorMessage(error: unknown, prefix: string): string {
  const err = error as { message?: string };
  return `${prefix}${err?.message || "未知错误"}`;
}
