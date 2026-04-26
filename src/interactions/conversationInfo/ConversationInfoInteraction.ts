/**
 * ConversationInfoInteraction
 * - 存放 ConversationInfo 组件的界面交互方法。
 * - 负责成员展示名、表单同步、变更判断、本地输入校验与图片压缩等逻辑。
 *
 * 方法目录（方法：功能）
 * - resolveMemberDisplayName：生成成员显示名（群昵称 > 好友展示名 > 用户昵称）。
 * - resolveFriendGenderText：生成好友性别文案。
 * - resolveConversationStatusText：生成会话状态文案。
 * - syncConversationEditableFields：会话编辑字段回填。
 * - syncFriendEditableFields：好友编辑字段回填。
 * - hasConversationEditableChanges：判断会话资料是否有改动。
 * - hasFriendEditableChanges：判断好友备注/分组是否有改动。
 * - validateFriendRemarkInputs：校验好友备注与分组长度。
 * - buildFriendRemarkUpdatePayload：生成好友备注更新 payload。
 * - buildConversationUpdatePayload：生成会话资料更新 payload。
 * - loadConversationInfoFlow：加载会话资料并返回统一结果。
 * - refreshConversationAfterUpdateFlow：更新后刷新会话详情。
 * - applyFriendRemarkFlow：执行好友备注保存流程。
 * - submitConversationInfoFlow：执行会话资料提交流程。
 */

import type { ConversationEntity, ConversationMemberDTO } from "@/types/dto/conversation-member";

export function resolveMemberDisplayName(
  member: ConversationMemberDTO,
  friends: Array<{ friendId: number; displayName?: string; nickname?: string }>
): string {
  const memberNickname = member.memberNickname?.trim() || "";
  if (memberNickname) return memberNickname;
  const relatedFriend = friends.find((f) => f.friendId === member.userId);
  return relatedFriend?.displayName || member.userNickname || "Unknown user";
}

export function resolveFriendGenderText(gender: number | null | undefined): string {
  if (gender == null) return "";
  if (gender === 1) return "男";
  if (gender === 2) return "女";
  return "Unknown";
}

export function resolveConversationStatusText(status: number | null | undefined): string {
  if (status === 1) return "Active";
  if (status === 0) return "Dismissed";
  return "Unknown status";
}

export function syncConversationEditableFields(
  conversation: ConversationEntity | null | undefined
): { name: string; description: string } {
  return {
    name: conversation?.convName || "",
    description: conversation?.convDescription || "",
  };
}

export function syncFriendEditableFields(friend: {
  remarkName?: string | null;
  friendGroup?: string | null;
} | null | undefined): { remark: string; group: string } {
  return {
    remark: friend?.remarkName || "",
    group: friend?.friendGroup || "",
  };
}

export function hasConversationEditableChanges(
  editableName: string,
  editableDescription: string,
  conversation: ConversationEntity | null | undefined
): boolean {
  if (!conversation) return false;
  return (
    editableName !== (conversation.convName || "") ||
    editableDescription !== (conversation.convDescription || "")
  );
}

export function hasFriendEditableChanges(
  editableRemark: string,
  editableGroup: string,
  friend: { remarkName?: string | null; friendGroup?: string | null } | null | undefined
): boolean {
  if (!friend) return false;
  return (
    editableRemark !== (friend.remarkName || "") ||
    editableGroup !== (friend.friendGroup || "")
  );
}

export function syncMyMemberNameFields(input: {
  memberNickname?: string | null;
  privateDisplayName?: string | null;
}): { memberNickname: string; privateDisplayName: string } {
  return {
    memberNickname: input.memberNickname || "",
    privateDisplayName: input.privateDisplayName || "",
  };
}

export function hasMyMemberNameChanges(
  editableMemberNickname: string,
  editablePrivateDisplayName: string,
  originalMemberNickname: string,
  originalPrivateDisplayName: string
): boolean {
  return (
    editableMemberNickname !== originalMemberNickname ||
    editablePrivateDisplayName !== originalPrivateDisplayName
  );
}

export function validateMyMemberNameInputs(
  editableMemberNickname: string,
  editablePrivateDisplayName: string,
  maxLen = 50
): string | null {
  const memberNickname = editableMemberNickname.trim();
  const privateDisplayName = editablePrivateDisplayName.trim();
  if (memberNickname.length > maxLen) {
    return `成员昵称最多 ${maxLen} 个字符`;
  }
  if (privateDisplayName.length > maxLen) {
    return `私有显示名最多 ${maxLen} 个字符`;
  }
  return null;
}

export function buildMyMemberNameUpdatePayload(input: {
  oldMemberNickname: string;
  oldPrivateDisplayName: string;
  newMemberNickname: string;
  newPrivateDisplayName: string;
}): { memberNickname?: string; privateDisplayName?: string } | null {
  const memberNickname = input.newMemberNickname.trim();
  const privateDisplayName = input.newPrivateDisplayName.trim();
  const sameMemberNickname = memberNickname === input.oldMemberNickname;
  const samePrivateDisplayName = privateDisplayName === input.oldPrivateDisplayName;
  if (sameMemberNickname && samePrivateDisplayName) return null;
  const payload: { memberNickname?: string; privateDisplayName?: string } = {};
  if (!sameMemberNickname) payload.memberNickname = memberNickname;
  if (!samePrivateDisplayName) payload.privateDisplayName = privateDisplayName;
  return payload;
}

export function validateFriendRemarkInputs(
  remark: string,
  group: string,
  maxLen = 50
): string | null {
  if (remark.trim().length > maxLen) return `Remark 最多 ${maxLen} 个字符`;
  if (group.trim().length > maxLen) return `Group 最多 ${maxLen} 个字符`;
  return null;
}

export function buildFriendRemarkUpdatePayload(input: {
  // 保存前的备注
  oldRemark: string;
  // 保存前的分组
  oldGroup: string;
  // 用户当前输入备注
  newRemark: string;
  // 用户当前输入分组
  newGroup: string;
}): { remarkName?: string | null; friendGroup?: string | null } | null {
  const remark = input.newRemark.trim();
  const group = input.newGroup.trim();
  const sameRemark = input.oldRemark === remark;
  const sameGroup = input.oldGroup === group;
  if (sameRemark && sameGroup) return null;
  return {
    remarkName: sameRemark ? undefined : remark === "" ? null : remark,
    friendGroup: sameGroup ? undefined : group === "" ? null : group,
  };
}

export function buildConversationUpdatePayload(input: {
  // 原始会话对象
  conversation: ConversationEntity;
  // 当前编辑中的会话名
  editableName: string;
  // 当前编辑中的描述
  editableDescription: string;
}): Partial<ConversationEntity> | null {
  // Partial<T> 是 TypeScript 内置的工具类型，作用是把类型 T 的所有属性都变成可选的。
  const payload: Partial<ConversationEntity> = {};
  if (input.editableName !== input.conversation.convName) {
    payload.convName = input.editableName.trim();
  }
  if (input.editableDescription !== (input.conversation.convDescription || "")) {
    payload.convDescription = input.editableDescription.trim();
  }
  return Object.keys(payload).length === 0 ? null : payload;
}

/** 加载会话资料并返回统一结果。 */
export async function loadConversationInfoFlow<TConversation, TMember>(input: {
  convId: number | null | undefined;
  loadConversationDetail: (convId: number) => Promise<{
    conversation: TConversation;
    members: TMember[];
  }>;
}): Promise<{
  conversation: TConversation | null;
  members: TMember[];
  error: string | null;
}> {
  if (!input.convId) return { conversation: null, members: [], error: null };
  try {
    const detail = await input.loadConversationDetail(input.convId);
    return { conversation: detail.conversation, members: detail.members, error: null };
  } catch (e: any) {
    if (e?.response?.status === 401 || e?.code === 401) {
      return {
        conversation: null,
        members: [],
        error: e.response?.data?.message || "No permission to view this conversation",
      };
    }
    return {
      conversation: null,
      members: [],
      error: e?.message || "Unable to load conversation info",
    };
  }
}

/** 更新后刷新会话详情并返回提示文案。 */
export async function refreshConversationAfterUpdateFlow(input: {
  conversationId: number | null | undefined;
  successMessage: string;
  refreshConversationById: (convId: number) => Promise<void>;
  reloadConversationInfo: () => Promise<void>;
}): Promise<{ ok: boolean; message: string }> {
  if (!input.conversationId) return { ok: true, message: input.successMessage };
  try {
    await input.refreshConversationById(input.conversationId);
    await input.reloadConversationInfo();
    return { ok: true, message: input.successMessage };
  } catch {
    return {
      ok: false,
      message: "Saved but failed to refresh conversation details",
    };
  }
}

/** 执行好友备注保存流程。 */
export async function applyFriendRemarkFlow(input: {
  friendId: number | null | undefined;
  convId: number | null | undefined;
  currentUserId: number;
  editableRemark: string;
  editableGroup: string;
  oldRemark: string;
  oldGroup: string;
  validateInputs: (remark: string, group: string) => string | null;
  updateFriendRemark: (
    friendId: number,
    payload: { remarkName?: string | null; friendGroup?: string | null }
  ) => Promise<void>;
  reloadFriendInfo: () => Promise<void>;
  reloadFriendsBootstrap: (userId: number) => Promise<unknown>;
  refreshConversationById: (convId: number) => Promise<void>;
}): Promise<{ ok: boolean; message: string | null }> {
  if (!input.friendId) return { ok: false, message: null };
  const validationError = input.validateInputs(
    input.editableRemark,
    input.editableGroup
  );
  if (validationError) return { ok: false, message: validationError };
  const payload = buildFriendRemarkUpdatePayload({
    oldRemark: input.oldRemark,
    oldGroup: input.oldGroup,
    newRemark: input.editableRemark,
    newGroup: input.editableGroup,
  });
  if (!payload) return { ok: true, message: null };
  try {
    await input.updateFriendRemark(input.friendId, payload);
    await input.reloadFriendsBootstrap(input.currentUserId);
    await input.reloadFriendInfo();
    if (input.convId != null) {
      await input.refreshConversationById(input.convId);
    }
    return { ok: true, message: "Friend remark/group updated" };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message || "Failed to update friend remark/group",
    };
  }
}

/** 执行当前用户在会话内的成员昵称/私有显示名更新流程。 */
export async function applyMyMemberNamesFlow(input: {
  convId: number | null | undefined;
  oldMemberNickname: string;
  oldPrivateDisplayName: string;
  editableMemberNickname: string;
  editablePrivateDisplayName: string;
  validateInputs: (memberNickname: string, privateDisplayName: string) => string | null;
  updateMemberNames: (
    convId: number,
    payload: { memberNickname?: string; privateDisplayName?: string }
  ) => Promise<void>;
  refreshConversationById: (convId: number) => Promise<void>;
  refreshConversationMembers: (convId: number, force: boolean) => Promise<void>;
  reloadConversationInfo: () => Promise<void>;
}): Promise<{ ok: boolean; message: string | null }> {
  if (!input.convId) return { ok: false, message: null };
  const validationError = input.validateInputs(
    input.editableMemberNickname,
    input.editablePrivateDisplayName
  );
  if (validationError) return { ok: false, message: validationError };
  const payload = buildMyMemberNameUpdatePayload({
    oldMemberNickname: input.oldMemberNickname,
    oldPrivateDisplayName: input.oldPrivateDisplayName,
    newMemberNickname: input.editableMemberNickname,
    newPrivateDisplayName: input.editablePrivateDisplayName,
  });
  if (!payload) return { ok: true, message: null };
  try {
    await input.updateMemberNames(input.convId, payload);
    await input.refreshConversationById(input.convId);
    await input.refreshConversationMembers(input.convId, true);
    await input.reloadConversationInfo();
    return { ok: true, message: "修改成功" };
  } catch (e: any) {
    const message = e?.message || "";
    if (
      /未授权|unauthorized|forbidden|不是该会话成员|401|403/i.test(message)
    ) {
      return { ok: false, message: "您不是该会话成员，无法修改成员信息" };
    }
    if (/500|internal/i.test(message)) {
      return { ok: false, message: "修改失败，请稍后重试" };
    }
    return {
      ok: false,
      message: message || "修改失败，请稍后重试",
    };
  }
}

/** 执行会话资料提交流程（由 store/normalize 负责实际持久化）。 */
export async function submitConversationInfoFlow(input: {
  conversation: ConversationEntity | null;
  canEditConversation: boolean;
  editableName: string;
  editableDescription: string;
  avatarFile?: File | null;
  persistConversationInfo: (
    convId: number,
    payload?: Partial<ConversationEntity>,
    convAvatarFile?: File
  ) => Promise<void>;
  setConversationName: (name: string | null) => void;
  setConversationDescription: (description: string | null) => void;
  syncEditableFromConversation: () => void;
  refreshAfterUpdate: (successMessage: string) => Promise<void>;
}): Promise<{ ok: boolean; message: string | null }> {
  if (!input.conversation || !input.canEditConversation) {
    return { ok: false, message: null };
  }
  const payload = buildConversationUpdatePayload({
    conversation: input.conversation,
    editableName: input.editableName,
    editableDescription: input.editableDescription,
  });
  const avatarFile = input.avatarFile ?? undefined;
  if (!payload && !avatarFile) return { ok: true, message: null };
  try {
    await input.persistConversationInfo(
      input.conversation.convId,
      payload || {},
      avatarFile
    );
    if (payload?.convName !== undefined) {
      input.setConversationName(payload.convName);
    }
    if (payload?.convDescription !== undefined) {
      input.setConversationDescription(payload.convDescription);
    }
    input.syncEditableFromConversation();
    await input.refreshAfterUpdate("Conversation info updated");
    return { ok: true, message: null };
  } catch {
    return { ok: false, message: "Update failed, please retry" };
  }
}
