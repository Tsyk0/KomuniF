// src/interactions/realtime/groupConvMemberManageInteraction.ts
/**
 * 处理 WebSocket `groupConvMemberManage` 下行，与 HTTP 群管理结果互补。
 * 使用场景：服务端广播踢人/禁言/解禁后，同步会话列表、成员缓存、当前聊天输入态与群资料成员列表。
 * 幂等：同一 convId + targetUserId + manageType 重复投递时，最终状态与处理一次一致。
 */
import { realtimeEventBus } from "@/realtime/websocket/events/eventBus";
import toast from "@/commons/utils/toast";
import { MemberStatus } from "@/entity/conversation-member";
import { useConvStore } from "@/store/conv/conv";
import { useShowMessageStore } from "@/store/message/showMessage";
import { useUserStore } from "@/store/user/user";

export type GroupConvManageType = "kicked" | "muted" | "unmuted";

const MEMBERS_REFRESH_EVENT = "groupconv:members-need-refresh";

function parsePayload(raw: Record<string, unknown>): {
  convId: number;
  targetUserId: number;
  manageType: GroupConvManageType | null;
  operatorUserId: number;
} {
  const convId = Number(raw.convId ?? raw.conv_id ?? 0);
  const targetUserId = Number(raw.targetUserId ?? raw.target_user_id ?? 0);
  const operatorUserId = Number(raw.operatorUserId ?? raw.operator_user_id ?? 0);
  const mt = String(raw.manageType ?? raw.manage_type ?? "")
    .trim()
    .toLowerCase();
  let manageType: GroupConvManageType | null = null;
  if (mt === "kicked" || mt === "muted" || mt === "unmuted") {
    manageType = mt;
  }
  return { convId, targetUserId, manageType, operatorUserId };
}

function emitMembersNeedRefresh(convId: number): void {
  window.dispatchEvent(
    new CustomEvent(MEMBERS_REFRESH_EVENT, { detail: { convId } })
  );
}

/**
 * 应用一条 `groupConvMemberManage` 帧；内部按 manageType 分支更新 Pinia 与可选 Toast。
 */
export function applyGroupConvMemberManageFromRealtime(
  payload: Record<string, unknown>
): void {
  const { convId, targetUserId, manageType } = parsePayload(payload);
  if (!manageType || !Number.isFinite(convId) || convId <= 0) return;
  if (!Number.isFinite(targetUserId) || targetUserId <= 0) return;

  const userStore = useUserStore();
  const convStore = useConvStore();
  const showMessageStore = useShowMessageStore();
  const myId = Number(userStore.user?.userId ?? 0);
  const isSelfTarget = myId > 0 && targetUserId === myId;

  if (manageType === "kicked") {
    if (isSelfTarget) {
      const wasViewing =
        convStore.currentConversation?.convId === convId;
      convStore.removeConversationLocal(convId);
      if (wasViewing) {
        showMessageStore.clearMessages();
      }
      toast.warning("你已被移出群聊");
    } else {
      convStore.removeGroupMemberFromCompressedCache(convId, targetUserId);
      emitMembersNeedRefresh(convId);
      void convStore.refreshConversationById(convId);
    }
    return;
  }

  if (manageType === "muted") {
    if (isSelfTarget) {
      convStore.patchConversationLocal(convId, {
        memberStatus: MemberStatus.MUTED,
      });
      toast.warning("你已被禁言");
    } else {
      void (async () => {
        await convStore.patchConversationMemberStatusLocal(
          convId,
          targetUserId,
          MemberStatus.MUTED
        );
        emitMembersNeedRefresh(convId);
      })();
    }
    return;
  }

  if (manageType === "unmuted") {
    if (isSelfTarget) {
      convStore.patchConversationLocal(convId, {
        memberStatus: MemberStatus.NORMAL,
      });
      toast.success("已解除禁言");
    } else {
      void (async () => {
        await convStore.patchConversationMemberStatusLocal(
          convId,
          targetUserId,
          MemberStatus.NORMAL
        );
        emitMembersNeedRefresh(convId);
      })();
    }
  }
}

export const GROUP_CONV_MEMBERS_REFRESH_EVENT = MEMBERS_REFRESH_EVENT;

let groupConvMemberManageRealtimeBound = false;

/**
 * 注册 `groupConvMemberManage` 的 eventBus 监听（仅一次）。
 * 使用场景：`main.ts` 在 `app.use(pinia)` 之后调用。
 */
export function bindGroupConvMemberManageRealtimeListener(): void {
  if (groupConvMemberManageRealtimeBound) return;
  groupConvMemberManageRealtimeBound = true;
  realtimeEventBus.on("groupConvMemberManage", (payload) => {
    applyGroupConvMemberManageFromRealtime(payload as Record<string, unknown>);
  });
}
