/**
 * LoginViewInteraction
 * - 存放 LoginView 的页面交互方法。
 * - 负责 tab 切换与注册成功后的视图状态收口。
 *
 * 方法目录（方法：功能）
 * - resolveLoginViewTab：根据动作计算目标 tab。
 * - buildRegisterSuccessNotice：生成注册成功提示文案。
 */

export function resolveLoginViewTab(action: "login" | "register" | "forgot"): string {
  return action;
}

export function buildRegisterSuccessNotice(): string {
  return "注册成功！请登录";
}
