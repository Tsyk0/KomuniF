// src/normalize/conversation/member/groupMemberRecordMapper.ts
import type { ConversationMemberDTO } from "@/types/dto/conversation-member";
import type { MessageDisplayMemberDTO } from "@/types/dto/conversation";
import { MemberRole, MemberStatus } from "@/entity/conversation-member";

type RawMember = Record<string, unknown>;

function pickString(raw: RawMember, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = raw[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

/**
 * 将接口返回的单条群成员 JSON 规范为 ConversationMemberDTO。
 * 使用场景：群详情成员列表、与后端 member_role / member_status 对齐。
 */
export function normalizeConversationMemberDtoFromApi(
  raw: unknown
): ConversationMemberDTO {
  const r = (raw && typeof raw === "object" ? raw : {}) as RawMember;
  const userId = Number(r.userId ?? r.user_id ?? 0);
  const roleRaw = r.memberRole ?? r.member_role ?? r.role;
  const role = Number.isFinite(Number(roleRaw)) ? Number(roleRaw) : MemberRole.NORMAL;
  /** 后端可能用数值字段或布尔 muted；缺省再尝试 isMuted。 */
  let statusRaw: unknown =
    r.memberStatus ?? r.member_status ?? r.memberStatusCode ?? r.member_status_code;
  if (statusRaw === undefined || statusRaw === null) {
    const mutedFlag = r.muted ?? r.isMuted ?? r.is_muted;
    if (typeof mutedFlag === "boolean") {
      statusRaw = mutedFlag ? MemberStatus.MUTED : MemberStatus.NORMAL;
    }
  }
  const memberStatus =
    statusRaw === undefined || statusRaw === null
      ? MemberStatus.NORMAL
      : Number(statusRaw);

  return {
    userId,
    memberNickname: pickString(r, "memberNickname", "member_nickname"),
    userNickname:
      pickString(r, "userNickname", "user_nickname", "nickname") ||
      (Number.isFinite(userId) && userId > 0 ? String(userId) : ""),
    userAvatar: pickString(r, "userAvatar", "user_avatar", "avatar"),
    role,
    memberStatus: Number.isFinite(memberStatus) ? memberStatus : MemberStatus.NORMAL,
  };
}

/**
 * 将接口成员行规范为消息区展示用 MessageDisplayMemberDTO。
 * 使用场景：GET /conversations/:id/members 写入 compressedCMMap。
 */
export function normalizeMessageDisplayMemberFromApi(
  raw: unknown
): MessageDisplayMemberDTO {
  const dto = normalizeConversationMemberDtoFromApi(raw);
  const r = (raw && typeof raw === "object" ? raw : {}) as RawMember;
  const joinRaw = r.joinTime ?? r.join_time;
  return {
    userId: dto.userId,
    memberNickname: dto.memberNickname,
    userNickname: dto.userNickname,
    userAvatar: dto.userAvatar,
    role: dto.role,
    memberStatus: dto.memberStatus,
    joinTime:
      joinRaw != null && String(joinRaw).trim() ? String(joinRaw) : undefined,
  };
}
