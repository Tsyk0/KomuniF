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
 * - compressImageToBase64：压缩图片并转为 base64（仅保留为通用工具，不用于会话头像上传）。
 * - loadFriendInfoFlow：加载好友资料并返回统一结果。
 * - loadConversationInfoFlow：加载会话资料并返回统一结果。
 * - refreshConversationAfterUpdateFlow：更新后刷新会话详情。
 * - applyFriendRemarkFlow：执行好友备注保存流程。
 * - applyConversationAvatarFlow：执行会话头像更新流程。
 * - applyConversationInfoFlow：执行会话资料保存流程。
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

export function compressImageToBase64(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
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
          reject(new Error("Failed to get Canvas context"));
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

/** 加载好友资料并返回统一结果。 */
export async function loadFriendInfoFlow<T>(input: {
  friendId: number | null | undefined;
  loadFriendDetail: (friendId: number) => Promise<T>;
}): Promise<{ friendInfo: T | null; error: string | null }> {
  if (input.friendId == null || input.friendId <= 0) {
    return { friendInfo: null, error: null };
  }
  try {
    const friendInfo = await input.loadFriendDetail(input.friendId);
    return { friendInfo, error: null };
  } catch (e: any) {
    return { friendInfo: null, error: e?.message || "Unable to load friend info" };
  }
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
    await input.reloadFriendInfo();
    await input.reloadFriendsBootstrap(input.currentUserId);
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

/** 执行会话头像更新流程。 */
export async function applyConversationAvatarFlow(input: {
  file: File | null | undefined;
  convId: number;
  updateConversation: (
    convId: number,
    payload?: Partial<ConversationEntity>,
    convAvatarFile?: File
  ) => Promise<void>;
  refreshAfterUpdate: (successMessage: string) => Promise<void>;
}): Promise<{ ok: boolean; message: string | null }> {
  const file = input.file;
  if (!file) return { ok: false, message: null };
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, message: "Image size cannot exceed 2MB" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Please select an image file" };
  }
  try {
    await input.updateConversation(input.convId, {}, file);
    await input.refreshAfterUpdate("Avatar updated");
    return { ok: true, message: null };
  } catch (e: unknown) {
    const rawMessage =
      e instanceof Error ? e.message : typeof e === "string" ? e : "Avatar upload failed, please retry";
    return { ok: false, message: rawMessage || "Avatar upload failed, please retry" };
  }
}

/** 执行会话资料保存流程。 */
export async function applyConversationInfoFlow(input: {
  conversation: ConversationEntity | null;
  canEditConversation: boolean;
  editableName: string;
  editableDescription: string;
  avatarFile?: File | null;
  updateConversation: (
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
    await input.updateConversation(
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
