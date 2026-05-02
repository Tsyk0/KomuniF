<template>
  <div class="group-conv-info">
    <div class="group-conv-info__header">
      <button
        v-if="isCurrentUserGroupOwner"
        class="group-conv-info__edit"
        type="button"
        title="编辑群聊信息"
        @click="openProfileEdit"
      >
        <Pencil :size="22" :stroke-width="2.2" />
      </button>
      <h2 class="group-conv-info__title">群聊详情</h2>
      <button
        class="group-conv-info__close"
        type="button"
        title="关闭群聊详情"
        @click="emit('close')"
      >
        <X :size="22" :stroke-width="2.2" />
      </button>
    </div>

    <div v-if="loading" class="group-conv-info__state">加载群聊信息中...</div>
    <div
      v-else-if="error"
      class="group-conv-info__state group-conv-info__state--error"
    >
      {{ error }}
    </div>

    <div v-else class="group-conv-info__content">
      <section class="group-section group-section--identity">
        <div class="group-identity-row">
          <div class="group-avatar">
            <img
              v-if="groupAvatarUrl"
              :src="groupAvatarUrl"
              alt="群头像"
              class="group-avatar__img"
            />
            <span v-else>{{ groupName.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="group-main-info">
            <div class="group-name">{{ groupName }}</div>
            <div class="group-id">群号：{{ groupNumber }}</div>
          </div>
        </div>
      </section>

      <section class="group-section">
        <div class="group-section-title">群公告</div>
        <textarea
          v-model="editableNotice"
          class="group-textarea"
          rows="3"
          placeholder="请输入群公告摘要"
          :disabled="!isCurrentUserGroupOwner"
        />
      </section>

      <section class="group-section">
        <div class="group-section-title">我的本群昵称</div>
        <input
          v-model="editableMyNickname"
          class="group-input"
          type="text"
          placeholder="请输入本群昵称"
          maxlength="50"
        />
      </section>

      <section class="group-section">
        <div class="group-section-title">群聊备注</div>
        <input
          v-model="editableGroupRemark"
          class="group-input"
          type="text"
          placeholder="填写备注"
          maxlength="50"
        />
      </section>

      <section class="group-section">
        <div class="settings-row">
          <span class="settings-label">设为置顶</span>
          <el-switch v-model="pinConversation" />
        </div>
        <div class="settings-row">
          <span class="settings-label">消息免打扰</span>
          <el-switch v-model="muteConversation" />
        </div>
        <div class="settings-row settings-row--status">
          <span class="settings-label">群消息设置</span>
          <span class="settings-status">{{ messageSettingText }}</span>
        </div>
      </section>

      <section class="group-section group-section--members">
        <button
          type="button"
          class="group-members-trigger"
          :aria-expanded="isMembersSectionExpanded"
          @click="toggleMembersSection"
        >
          <span class="group-members-trigger__label">查看群成员</span>
          <ChevronRight
            v-if="!isMembersSectionExpanded"
            class="group-members-trigger__chevron"
            :size="20"
            :stroke-width="2.2"
          />
          <ChevronDown
            v-else
            class="group-members-trigger__chevron"
            :size="20"
            :stroke-width="2.2"
          />
        </button>

        <div v-show="isMembersSectionExpanded" class="group-members-panel">
          <div class="group-members-panel__head">
            <span class="group-members-panel__title"
              >群聊成员 {{ filteredMembersForList.length }}</span
            >
            <button
              type="button"
              class="group-members-panel__search-btn"
              :class="{ 'is-active': isMemberSearchVisible }"
              title="搜索成员"
              aria-label="搜索成员"
              @click.stop="toggleMemberSearch"
            >
              <Search :size="18" :stroke-width="2.2" />
            </button>
          </div>
          <div v-if="isMemberSearchVisible" class="group-members-panel__filter">
            <input
              v-model="memberSearchQuery"
              type="search"
              class="group-members-panel__filter-input"
              placeholder="昵称 / 群昵称 / ID"
              autocomplete="off"
            />
          </div>
          <div class="group-members-panel__list">
            <button
              v-for="m in filteredMembersForList"
              :key="m.userId"
              type="button"
              class="group-member-row"
              @click="onMemberRowClick(m, $event)"
            >
              <div class="group-member-row__avatar">
                <img
                  v-if="memberAvatarUrl(m)"
                  :src="memberAvatarUrl(m)"
                  alt=""
                  class="group-member-row__avatar-img"
                />
                <span v-else class="group-member-row__avatar-fallback">{{
                  memberDisplayInitial(m)
                }}</span>
              </div>
              <span class="group-member-row__name">{{ memberListLabel(m) }}</span>
              <span
                v-if="isGroupOwnerMember(m)"
                class="group-member-row__badge is-owner"
              >群主</span>
              <span
                v-else-if="isGroupAdminMember(m)"
                class="group-member-row__badge is-admin"
              >管理员</span>
            </button>
            <p
              v-if="filteredMembersForList.length === 0"
              class="group-members-panel__empty"
            >
              无匹配成员
            </p>
          </div>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <div
        v-if="popoverMember"
        ref="memberPopoverPanelRef"
        class="group-member-popover"
        :style="memberPopoverStyle"
        role="dialog"
        aria-label="成员信息"
        @click.stop
      >
        <div class="group-member-popover__avatar">
          <img
            v-if="popoverMember && memberAvatarUrl(popoverMember)"
            :src="memberAvatarUrl(popoverMember)"
            alt=""
            class="group-member-popover__avatar-img"
          />
          <span v-else class="group-member-popover__avatar-fallback">{{
            memberDisplayInitial(popoverMember)
          }}</span>
        </div>
        <div class="group-member-popover__name">
          {{ memberListLabel(popoverMember) }}
        </div>
        <dl class="group-member-popover__dl">
          <div class="group-member-popover__row">
            <dt>用户昵称</dt>
            <dd>{{ popoverMember.userNickname }}</dd>
          </div>
          <div class="group-member-popover__row">
            <dt>群昵称</dt>
            <dd>{{ popoverMember.memberNickname || "—" }}</dd>
          </div>
          <div class="group-member-popover__row">
            <dt>用户 ID</dt>
            <dd>{{ popoverMember.userId }}</dd>
          </div>
          <div class="group-member-popover__row">
            <dt>本群角色</dt>
            <dd>{{ memberRolePlainText(popoverMember) }}</dd>
          </div>
        </dl>
      </div>
    </Teleport>

    <div class="group-actions-float" :class="{ visible: hasPendingChanges }">
      <button
        class="group-action-btn group-action-btn--apply"
        type="button"
        :disabled="isApplying"
        @click="handleApply"
      >
        {{ isApplying ? "保存中..." : "应用" }}
      </button>
      <button
        class="group-action-btn group-action-btn--cancel"
        type="button"
        :disabled="isApplying"
        @click="handleCancel"
      >
        取消
      </button>
    </div>

    <div class="group-danger-footer">
      <button
        class="group-danger-btn"
        type="button"
        :disabled="isLeavingGroup"
        @click="handleLeaveGroup"
      >
        <Trash :size="22" :stroke-width="2.2" />
        <span>{{ isLeavingGroup ? "退出中..." : "退出群聊" }}</span>
      </button>
    </div>

    <Transition name="conv-edit-drawer">
      <div
        v-if="isProfileEditOpen"
        class="conv-edit-drawer-mask"
        @click.self="closeProfileEdit"
      >
        <ConvProfileEdit
          :conv-id="Number(props.convId)"
          :initial-name="conversation?.convName || ''"
          :initial-description="conversation?.convDescription || ''"
          :initial-enable-read-receipt="
            Boolean(conversation?.enableReadReceipt)
          "
          @close="closeProfileEdit"
          @saved="handleProfileSaved"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from "vue";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Search,
  Trash,
  X,
} from "lucide-vue-next";
import toast from "@/commons/utils/toast";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import { useConvStore } from "@/store/conv/conv";
import { useUserStore } from "@/store/user/user";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import ConvProfileEdit from "./ConvProfileEdit.vue";
import type {
  ConversationEntity,
  ConversationMemberDTO,
} from "@/types/dto/conversation-member";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";

const props = defineProps<{
  convId: number | null;
}>();

const emit = defineEmits<{
  close: [];
  "changes-pending": [pending: boolean];
}>();

const conversationInfoStore = useConversationInfoStore();
const conversationStore = useConvStore();
const userStore = useUserStore();

const loading = ref(false);
const error = ref<string | null>(null);
const isApplying = ref(false);
const isLeavingGroup = ref(false);
const isProfileEditOpen = ref(false);
const conversation = ref<ConversationEntity | null>(null);
const members = ref<ConversationMemberDTO[]>([]);

/** 是否展开「查看群成员」下列表；用于 GroupConvInfo 群详情折叠区块。 */
const isMembersSectionExpanded = ref(false);
/** 是否显示成员本地筛选输入框；点击搜索图标切换。 */
const isMemberSearchVisible = ref(false);
/** 成员列表本地搜索关键字；用于昵称/群昵称/ID 过滤。 */
const memberSearchQuery = ref("");
/** 当前悬浮资料卡对应的成员；为 null 时不展示 Teleport 弹层。 */
const popoverMember = ref<ConversationMemberDTO | null>(null);
/** 悬浮资料卡 fixed 定位坐标；在 onMemberRowClick 中根据行元素 getBoundingClientRect 计算。 */
const memberPopoverPos = ref({ top: 0, left: 0 });
/** 最近一次打开资料卡所点击的成员行 DOM；用于文档点击判断，避免点同一行误关。 */
const memberPopoverAnchorRowRef = ref<HTMLElement | null>(null);
const memberPopoverPanelRef = ref<HTMLElement | null>(null);

const editableNotice = ref("");
const editableMyNickname = ref("");
const editableGroupRemark = ref("");
const pinConversation = ref(false);
const muteConversation = ref(false);

const initialNotice = ref("");
const initialMyNickname = ref("");
const initialGroupRemark = ref("");
const initialPinConversation = ref(false);
const initialMuteConversation = ref(false);

const groupAvatarUrl = computed(() =>
  normalizeAvatarUrl(conversation.value?.convAvatar || "")
);
const groupName = computed(() => conversation.value?.convName || "未命名群聊");
const groupNumber = computed(() => conversation.value?.convId || "-");
const messageSettingText = computed(() =>
  muteConversation.value ? "仅接收提醒消息" : "接收全部消息"
);
const hasPendingChanges = computed(
  () =>
    editableNotice.value !== initialNotice.value ||
    editableMyNickname.value !== initialMyNickname.value ||
    editableGroupRemark.value !== initialGroupRemark.value ||
    pinConversation.value !== initialPinConversation.value ||
    muteConversation.value !== initialMuteConversation.value
);
const isCurrentUserGroupOwner = computed(() => {
  const myUserId = Number(userStore.user?.userId || 0);
  if (myUserId <= 0) return false;
  if (Number(conversation.value?.convOwnerId || 0) === myUserId) return true;
  const me = members.value.find((member) => Number(member.userId) === myUserId);
  return Number(me?.role || 0) === 1;
});

/**
 * 判断成员是否为本群群主（优先 role=1，其次与 convOwnerId 一致）。
 * 使用场景：成员列表角标、资料卡「本群角色」展示。
 */
const isGroupOwnerMember = (member: ConversationMemberDTO): boolean => {
  const ownerId = Number(conversation.value?.convOwnerId || 0);
  if (member.role === 1) return true;
  return ownerId > 0 && Number(member.userId) === ownerId;
};

/**
 * 判断成员是否为管理员且非群主。
 * 使用场景：成员列表「管理员」角标。
 */
const isGroupAdminMember = (member: ConversationMemberDTO): boolean =>
  member.role === 2 && !isGroupOwnerMember(member);

/**
 * 成员在列表中的主展示名：有群昵称用群昵称，否则用户昵称，再否则回退 userId。
 * 使用场景：群成员行、悬浮资料卡标题。
 */
const memberListLabel = (member: ConversationMemberDTO): string => {
  const inGroup = member.memberNickname?.trim();
  if (inGroup) return inGroup;
  return member.userNickname?.trim() || String(member.userId);
};

/**
 * 成员头像 URL 字符串；无有效地址时返回空串，模板用 v-if 判断后绑定 :src。
 * 使用场景：成员行与资料卡头像。
 */
const memberAvatarUrl = (member: ConversationMemberDTO | null): string => {
  if (!member) return "";
  return normalizeAvatarUrl(member.userAvatar || "");
};

/**
 * 列表/卡片头像占位首字母。
 * 使用场景：无头像 URL 时的圆形占位符。
 */
const memberDisplayInitial = (member: ConversationMemberDTO): string =>
  memberListLabel(member).charAt(0).toUpperCase() || "?";

/**
 * 资料卡中「本群角色」纯文案。
 * 使用场景：悬浮矩形框内只读展示。
 */
const memberRolePlainText = (member: ConversationMemberDTO): string => {
  if (isGroupOwnerMember(member)) return "群主";
  if (isGroupAdminMember(member)) return "管理员";
  return "成员";
};

/** 成员排序权重；用于 sortedMembersForList 中把群主、管理员排在前面。 */
const memberSortRank = (member: ConversationMemberDTO): number => {
  if (isGroupOwnerMember(member)) return 0;
  if (isGroupAdminMember(member)) return 1;
  return 2;
};

/**
 * 已排序的群成员列表（群主/管理员优先，其余按展示名拼音序）。
 * 使用场景：展开「查看群成员」后的默认列表顺序。
 */
const sortedMembersForList = computed(() => {
  const list = [...members.value];
  list.sort((a, b) => {
    const d = memberSortRank(a) - memberSortRank(b);
    if (d !== 0) return d;
    return memberListLabel(a).localeCompare(memberListLabel(b), "zh-CN");
  });
  return list;
});

/**
 * 按搜索框关键字过滤后的成员列表。
 * 使用场景：点击搜索图标后输入昵称/群昵称/ID 缩小列表。
 */
const filteredMembersForList = computed(() => {
  const q = memberSearchQuery.value.trim().toLowerCase();
  if (!q) return sortedMembersForList.value;
  return sortedMembersForList.value.filter((m) => {
    const id = String(m.userId);
    const nn = (m.userNickname || "").toLowerCase();
    const mn = (m.memberNickname || "").toLowerCase();
    return nn.includes(q) || mn.includes(q) || id.includes(q);
  });
});

const memberPopoverStyle = computed(() => ({
  top: `${memberPopoverPos.value.top}px`,
  left: `${memberPopoverPos.value.left}px`,
}));

/**
 * 关闭成员悬浮资料卡并清理锚点引用。
 * 使用场景：切换会话、收起成员区、点击文档空白处或再次点击当前行。
 */
const closeMemberPopover = () => {
  popoverMember.value = null;
  memberPopoverAnchorRowRef.value = null;
};

/**
 * 展开/收起「查看群成员」整块面板。
 * 使用场景：用户点击「查看群成员」行；收起时同时关掉悬浮资料卡。
 */
const toggleMembersSection = () => {
  isMembersSectionExpanded.value = !isMembersSectionExpanded.value;
  if (!isMembersSectionExpanded.value) {
    closeMemberPopover();
  }
};

/**
 * 切换成员搜索输入框显隐；关闭时清空关键字。
 * 使用场景：点击面板标题栏右侧放大镜图标。
 */
const toggleMemberSearch = () => {
  isMemberSearchVisible.value = !isMemberSearchVisible.value;
  if (!isMemberSearchVisible.value) {
    memberSearchQuery.value = "";
  }
};

/**
 * 点击成员行：在行旁打开/切换资料卡，再次点击同一行则关闭。
 * 使用场景：群成员列表交互；坐标由 currentTarget.getBoundingClientRect 计算。
 */
const onMemberRowClick = (
  member: ConversationMemberDTO,
  event: MouseEvent
) => {
  const row = event.currentTarget as HTMLElement | null;
  if (!row) return;
  memberPopoverAnchorRowRef.value = row;
  if (popoverMember.value?.userId === member.userId) {
    closeMemberPopover();
    return;
  }
  popoverMember.value = member;
  const rect = row.getBoundingClientRect();
  const panelW = 256;
  const panelH = 220;
  const gap = 8;
  let left = rect.right + gap;
  if (left + panelW > window.innerWidth - gap) {
    left = rect.left - panelW - gap;
  }
  if (left < gap) {
    left = gap;
  }
  let top = rect.top;
  if (top + panelH > window.innerHeight - gap) {
    top = Math.max(gap, window.innerHeight - panelH - gap);
  }
  if (top < gap) {
    top = gap;
  }
  memberPopoverPos.value = { top, left };
};

watchEffect((onCleanup) => {
  if (!popoverMember.value) return;
  const onDocClick = (e: MouseEvent) => {
    const t = e.target as Node | null;
    if (!t) return;
    if (memberPopoverPanelRef.value?.contains(t)) return;
    if (memberPopoverAnchorRowRef.value?.contains(t)) return;
    closeMemberPopover();
  };
  document.addEventListener("click", onDocClick, false);
  onCleanup(() => document.removeEventListener("click", onDocClick, false));
});

/**
 * 打开群资料编辑抽屉。
 * 使用场景：群主点击 header 左侧铅笔图标后，从右侧滑出编辑面板。
 */
const openProfileEdit = () => {
  isProfileEditOpen.value = true;
};

/**
 * 关闭群资料编辑抽屉。
 * 使用场景：点击遮罩、关闭按钮或保存完成后收起右侧编辑面板。
 */
const closeProfileEdit = () => {
  isProfileEditOpen.value = false;
};

/**
 * 退出当前群聊。
 * 使用场景：用户点击底部“退出群聊”按钮后，调用 store action 走 API->normalize->store 链路并回收本地会话状态。
 */
const handleLeaveGroup = async () => {
  if (!props.convId || isLeavingGroup.value) return;
  const confirmLeave = window.confirm("确认退出该群聊吗？");
  if (!confirmLeave) return;
  isLeavingGroup.value = true;
  try {
    await conversationInfoStore.leaveConversation(props.convId);
    toast.success("已退出群聊");
    emit("close");
  } catch (leaveError) {
    console.error("退出群聊失败:", leaveError);
    toast.error("退出失败，请稍后重试");
  } finally {
    isLeavingGroup.value = false;
  }
};

/**
 * 处理群资料编辑保存回调并同步当前页面显示。
 * 使用场景：编辑抽屉保存成功后，详情面板立即更新群名/公告/回执开关。
 */
const handleProfileSaved = (payload: {
  convName: string;
  convDescription: string;
  enableReadReceipt: boolean;
}) => {
  if (!conversation.value || !props.convId) return;
  /** 群资料本地同步补丁；用于让会话列表与聊天头部在保存后立即响应。 */
  const groupProfilePatch: Partial<ConversationSummaryDTO> = {
    convName: payload.convName,
  };
  (
    groupProfilePatch as ConversationSummaryDTO & {
      convDescription?: string | null;
      enableReadReceipt?: boolean;
    }
  ).convDescription = payload.convDescription;
  (
    groupProfilePatch as ConversationSummaryDTO & {
      convDescription?: string | null;
      enableReadReceipt?: boolean;
    }
  ).enableReadReceipt = payload.enableReadReceipt;
  conversationStore.patchConversationLocal(props.convId, groupProfilePatch);

  conversation.value = {
    // ...：把原对象的所有可枚举属性“展开”到新对象中
    ...conversation.value,
    ...payload,
  };
  closeProfileEdit();
};

/**
 * 将群设置修改即时回写到 pinia 会话/成员缓存。
 * 使用场景：点击“应用”后，不等刷新即可让列表、消息区等引用处立即响应。
 */
const syncLocalChangesToPinia = () => {
  if (!props.convId) return;
  const convId = props.convId;
  const summaryPatch: Partial<ConversationSummaryDTO> = {};

  if (editableGroupRemark.value !== initialGroupRemark.value) {
    /**
     * 群聊备注本地值；空串统一归一成 null，避免“看似成功但后端不落库”的空值歧义。
     */
    const normalizedGroupRemark = editableGroupRemark.value.trim();
    summaryPatch.privateDisplayName =
      normalizedGroupRemark === "" ? null : normalizedGroupRemark;
    /**
     * 清空群聊备注时，显式回填会话原始名称用于本地即时回退展示。
     * 使用场景：从“备注名”恢复到“原始群名”时，避免等待刷新才能看到正确 convName。
     */
    if (!editableGroupRemark.value.trim() && conversation.value?.convName) {
      summaryPatch.convName = conversation.value.convName;
    }
  }
  if (Object.keys(summaryPatch).length > 0) {
    conversationStore.patchConversationLocal(convId, summaryPatch);
  }

  const myUserId = Number(userStore.user?.userId || 0);
  if (myUserId <= 0 || editableMyNickname.value === initialMyNickname.value)
    return;
  /** 群内昵称本地值；空串统一归一成 null，避免展示层出现空字符串脏值。 */
  const normalizedMemberNickname = editableMyNickname.value.trim();
  const localMemberNickname =
    normalizedMemberNickname === "" ? null : normalizedMemberNickname;
  const memberIndex = members.value.findIndex(
    (member) => Number(member.userId) === myUserId
  );
  if (memberIndex >= 0) {
    members.value[memberIndex] = {
      ...members.value[memberIndex],
      memberNickname: localMemberNickname,
    };
  }

  conversationStore.patchConversationMemberNicknameLocal(
    convId,
    myUserId,
    localMemberNickname
  );
};

/**
 * 取消编辑并回退到初始值。
 * 使用场景：用户点击 Cancel 后撤销当前未提交改动。
 */
const handleCancel = () => {
  editableNotice.value = initialNotice.value;
  editableMyNickname.value = initialMyNickname.value;
  editableGroupRemark.value = initialGroupRemark.value;
  pinConversation.value = initialPinConversation.value;
  muteConversation.value = initialMuteConversation.value;
};

/**
 * 提交群聊设置修改。
 * 使用场景：用户点击 Apply，将公告与个人昵称设置持久化到后端。
 */
const handleApply = async () => {
  if (!props.convId || isApplying.value) return;
  isApplying.value = true;
  try {
    if (editableNotice.value !== initialNotice.value) {
      await conversationInfoStore.persistConversationInfo(props.convId, {
        convDescription: editableNotice.value,
      });
    }
    const memberPayload: {
      memberNickname?: string | null;
      privateDisplayName?: string | null;
      clearMemberNickname?: boolean;
      clearPrivateDisplayName?: boolean;
    } = {};
    if (editableMyNickname.value !== initialMyNickname.value) {
      const normalizedMemberNickname = editableMyNickname.value.trim();
      if (normalizedMemberNickname === "") {
        memberPayload.clearMemberNickname = true;
      } else {
        memberPayload.memberNickname = normalizedMemberNickname;
      }
    }
    if (editableGroupRemark.value !== initialGroupRemark.value) {
      const normalizedGroupRemark = editableGroupRemark.value.trim();
      if (normalizedGroupRemark === "") {
        memberPayload.clearPrivateDisplayName = true;
      } else {
        memberPayload.privateDisplayName = normalizedGroupRemark;
      }
    }
    /** 群聊备注变更标识；用于提交成功后主动刷新会话摘要，确保 convName 与后端一致。 */
    const shouldRefreshConversationSummary =
      editableGroupRemark.value !== initialGroupRemark.value;
    if (Object.keys(memberPayload).length > 0) {
      await conversationInfoStore.updateConversationMemberNames(
        props.convId,
        memberPayload
      );
    }
    if (conversation.value) {
      conversation.value.convDescription = editableNotice.value;
    }
    syncLocalChangesToPinia();
    initialNotice.value = editableNotice.value;
    initialMyNickname.value = editableMyNickname.value;
    initialGroupRemark.value = editableGroupRemark.value;
    initialPinConversation.value = pinConversation.value;
    initialMuteConversation.value = muteConversation.value;
    if (shouldRefreshConversationSummary) {
      await conversationStore.refreshConversationById(props.convId);
    }
    toast.success("群设置已保存");
  } catch (applyError) {
    console.error("保存群设置失败:", applyError);
    toast.error("保存失败，请稍后重试");
  } finally {
    isApplying.value = false;
  }
};

/**
 * 从群聊详情和成员信息初始化编辑态字段。
 * 使用场景：首次加载群聊资料或切换 convId 后，构建内容区初始显示值。
 */
const initEditableFields = () => {
  const myUserId = Number(userStore.user?.userId || 0);
  const me = members.value.find((member) => Number(member.userId) === myUserId);
  initialNotice.value = conversation.value?.convDescription || "";
  initialMyNickname.value = me?.memberNickname || "";
  initialGroupRemark.value =
    conversationStore.getConversationById(Number(props.convId))
      ?.privateDisplayName || "";
  initialPinConversation.value = false;
  initialMuteConversation.value = false;

  editableNotice.value = initialNotice.value;
  editableMyNickname.value = initialMyNickname.value;
  editableGroupRemark.value = initialGroupRemark.value;
  pinConversation.value = initialPinConversation.value;
  muteConversation.value = initialMuteConversation.value;
};

/**
 * 加载群聊详情。
 * 使用场景：群聊侧栏打开或会话切换时刷新群设置页数据。
 */
const loadGroupConversationInfo = async () => {
  if (!props.convId) return;
  loading.value = true;
  error.value = null;
  try {
    const detail = await conversationInfoStore.loadConversationDetail(
      props.convId
    );
    conversation.value = detail.conversation as ConversationEntity;
    members.value = detail.members as ConversationMemberDTO[];
    initEditableFields();
  } catch (loadError) {
    console.error("加载群聊详情失败:", loadError);
    error.value = "加载群聊详情失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.convId,
  () => {
    isMembersSectionExpanded.value = false;
    isMemberSearchVisible.value = false;
    memberSearchQuery.value = "";
    closeMemberPopover();
    void loadGroupConversationInfo();
  },
  { immediate: true }
);

watch(hasPendingChanges, (pending) => {
  emit("changes-pending", pending);
});
</script>

<style scoped>
@import "@/assets/styles/group-conv-info.css";
@import "@/assets/styles/night/group-conv-info-night.css";
</style>

<style>
@import "@/assets/styles/group-member-popover.css";
</style>
