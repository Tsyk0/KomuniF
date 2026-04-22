/**
 * ConvCreatePanelInteraction
 * - 存放 ConvCreatePanel 组件的交互流程方法。
 * - 负责创建群聊前的输入校验、成员 ID 清洗、异常文案映射。
 *
 * 方法目录（方法：功能）
 * - canSubmitConvCreate：判断“创建”按钮是否可点击。
 * - validateConvCreateDraft：校验群名和已选成员数量。
 * - normalizeSelectedMemberIds：把已选好友 ID 清洗为合法数字数组。
 * - mapConvCreateErrorMessage：统一提取创建失败提示文案。
 */

/** 判断“创建”按钮是否可点击。 */
export function canSubmitConvCreate(input: {
  draftConvName: string;
  selectedCount: number;
}): boolean {
  return input.draftConvName.trim().length > 0 && input.selectedCount >= 1;
}

/** 校验群名和已选成员数量。 */
export function validateConvCreateDraft(input: {
  draftConvName: string;
  selectedCount: number;
}): string | null {
  if (!input.draftConvName.trim()) return "请填写群名称";
  if (input.selectedCount < 1) return "请在左侧至少选择 1 位好友";
  return null;
}

/** 把已选好友 ID 清洗为合法数字数组。 */
export function normalizeSelectedMemberIds(
  selectedFriendIds: Iterable<unknown>
): number[] {
  const normalized: number[] = [];
  for (const id of selectedFriendIds) {
    const n = Number(id);
    if (Number.isFinite(n) && n > 0) normalized.push(n);
  }
  return normalized;
}

/** 统一提取创建失败提示文案。 */
export function mapConvCreateErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message || "创建群聊失败，请稍后重试";
}
