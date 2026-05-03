/**
 * 群成员资料卡相关的纯展示逻辑（头像 URL、角色文案、状态文案等）。
 * 使用场景：GroupMemberPopover、群资料成员列表、消息列表头像旁弹层等共用，避免多处复制。
 */
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { MemberRole, MemberStatus } from "@/entity/conversation-member";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";

/** 与群成员 DTO / 消息区 compressed 成员行展示字段兼容的宽松类型。 */
export type GroupMemberCardLike = {
  userId: number;
  memberNickname: string | null;
  userNickname: string;
  userAvatar: string | null;
  role?: number;
  memberStatus?: number;
};

/**
 * 成员 member_status 数值；缺省按正常(1)。
 * 使用场景：列表过滤、禁言角标、群管理按钮显隐。
 */
export function getMemberEffectiveStatus(member: {
  memberStatus?: number;
}): number {
  const s = member.memberStatus;
  if (s === undefined || s === null) return MemberStatus.NORMAL;
  const n = Number(s);
  return Number.isFinite(n) ? n : MemberStatus.NORMAL;
}

/**
 * 判断成员是否为本群群主（member_role === 2 或与 convOwnerId 一致）。
 * 使用场景：成员列表角标、资料卡「本群角色」、踢人/禁言权限判断。
 */
export function isGroupOwnerMember(
  member: GroupMemberCardLike | MessageDisplayMemberDTO,
  convOwnerId: number
): boolean {
  const ownerId = Number(convOwnerId || 0);
  if (Number(member.role ?? MemberRole.NORMAL) === MemberRole.OWNER)
    return true;
  return ownerId > 0 && Number(member.userId) === ownerId;
}

/**
 * 判断成员是否为管理员且非群主（member_role === 1）。
 * 使用场景：成员列表「管理员」角标。
 */
export function isGroupAdminMember(
  member: GroupMemberCardLike | MessageDisplayMemberDTO,
  convOwnerId: number
): boolean {
  return (
    Number(member.role ?? MemberRole.NORMAL) === MemberRole.ADMIN &&
    !isGroupOwnerMember(member, convOwnerId)
  );
}

/**
 * 成员在列表中的主展示名：有群昵称用群昵称，否则用户昵称，再否则回退 userId。
 * 使用场景：群成员行、悬浮资料卡标题。
 */
export function memberListLabel(
  member: GroupMemberCardLike | MessageDisplayMemberDTO
): string {
  const inGroup = member.memberNickname?.trim();
  if (inGroup) return inGroup;
  return member.userNickname?.trim() || String(member.userId);
}

/**
 * 成员头像 URL 字符串；无有效地址时返回空串，模板用 v-if 判断后绑定 :src。
 * 使用场景：成员行与资料卡头像。
 */
export function memberAvatarUrl(
  member: (GroupMemberCardLike | MessageDisplayMemberDTO) | null
): string {
  if (!member) return "";
  return normalizeAvatarUrl(member.userAvatar || "");
}

/**
 * 列表/卡片头像占位首字母。
 * 使用场景：无头像 URL 时的圆形占位符。
 */
export function memberDisplayInitial(
  member: GroupMemberCardLike | MessageDisplayMemberDTO
): string {
  return memberListLabel(member).charAt(0).toUpperCase() || "?";
}

/**
 * 资料卡中「本群角色」纯文案。
 * 使用场景：悬浮矩形框内只读展示。
 */
export function memberRolePlainText(
  member: GroupMemberCardLike | MessageDisplayMemberDTO,
  convOwnerId: number
): string {
  if (isGroupOwnerMember(member, convOwnerId)) return "群主";
  if (isGroupAdminMember(member, convOwnerId)) return "管理员";
  return "成员";
}

/**
 * 成员状态文案（群管理、资料卡展示）。
 */
export function memberStatusPlainText(
  member: GroupMemberCardLike | MessageDisplayMemberDTO
): string {
  const s = getMemberEffectiveStatus(member);
  if (s === MemberStatus.QUIT) return "已退出";
  if (s === MemberStatus.MUTED) return "禁言中";
  return "正常";
}
