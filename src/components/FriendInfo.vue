<!-- src/components/FriendInfo.vue -->
<template>
  <div class="friend-detail-container">
    <div class="friend-detail-header">
      <button class="back-button" type="button" aria-label="返回" @click="handleBack">
        <ArrowLeft class="back-icon" :size="22" :stroke-width="2.2" />
      </button>
      <h2 class="friend-detail-title">好友资料</h2>
    </div>

    <div v-if="info" class="friend-detail-body">
      <div class="friend-card-surface">
      <!-- 资料卡：头像 + 昵称 / ID / 在线 + 右侧快捷操作 -->
      <section class="friend-card-profile">
        <div class="friend-card-profile__main">
          <div class="friend-card-avatar">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="头像"
              class="friend-card-avatar__img"
            />
            <div v-else class="friend-card-avatar__placeholder">
              {{ displayInitial }}
            </div>
          </div>
          <div class="friend-card-profile__meta">
            <div class="friend-card-nickname">{{ nicknameDisplay }}</div>
            <div class="friend-card-id">ID {{ peerUserIdLabel }}</div>
            <div class="friend-card-status">
              <span class="friend-card-status__dot" :class="onlineStatusClass" />
              <span>{{ onlineStatusText }}</span>
            </div>
          </div>
        </div>
        <div class="friend-card-profile__actions" aria-label="快捷操作">
          <button
            class="friend-card-icon-btn"
            type="button"
            title="发起聊天"
            aria-label="发起聊天"
            @click="handleStartChat"
          >
            <MessageCircleMore :size="22" :stroke-width="2.2" />
          </button>
          <button
            class="friend-card-icon-btn friend-card-icon-btn--danger"
            type="button"
            title="删除好友"
            aria-label="删除好友"
            :disabled="deletingFriend"
            @click="handleDeleteFriend"
          >
            <UserX :size="22" :stroke-width="2.2" />
          </button>
        </div>
      </section>

      <div class="friend-card-divider" />

      <!-- 紧凑摘要：性别 | 年龄 | 生日星座 | 地区 -->
      <section v-if="metaSummaryText" class="friend-card-meta-line">
        {{ metaSummaryText }}
      </section>

      <!-- 只读资料行：左标签+图标，右值 -->
      <ul class="friend-card-rows" aria-label="好友个人信息">
        <li class="friend-card-row">
          <span class="friend-card-row__label">
            <User :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            昵称
          </span>
          <span class="friend-card-row__value">{{ nicknameDisplay }}</span>
        </li>
        <li class="friend-card-row">
          <span class="friend-card-row__label">
            <Fingerprint :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            好友 ID
          </span>
          <span class="friend-card-row__value">{{ peerUserIdLabel }}</span>
        </li>
        <li class="friend-card-row">
          <span class="friend-card-row__label">
            <component
              :is="genderIconComponent"
              :size="18"
              :stroke-width="2.2"
              class="friend-card-row__icon"
            />
            性别
          </span>
          <span class="friend-card-row__value">{{ genderText }}</span>
        </li>
        <li class="friend-card-row">
          <span class="friend-card-row__label">
            <Activity :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            在线状态
          </span>
          <span class="friend-card-row__value">{{ onlineStatusText }}</span>
        </li>
        <li v-if="info.friendBirthday" class="friend-card-row">
          <span class="friend-card-row__label">
            <Cake :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            生日
          </span>
          <span class="friend-card-row__value">{{ birthdayRowValue }}</span>
        </li>
        <li class="friend-card-row">
          <span class="friend-card-row__label">
            <MapPin :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            地址
          </span>
          <span class="friend-card-row__value">{{ locationDisplay }}</span>
        </li>
        <li class="friend-card-row">
          <span class="friend-card-row__label">
            <ScrollText :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            签名
          </span>
          <span class="friend-card-row__value">{{ signatureDisplay }}</span>
        </li>
        <li class="friend-card-row">
          <span class="friend-card-row__label">
            <Smartphone :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            手机号
          </span>
          <span class="friend-card-row__value">{{ phoneDisplay }}</span>
        </li>
        <li class="friend-card-row">
          <span class="friend-card-row__label">
            <Mail :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            邮箱
          </span>
          <span class="friend-card-row__value">{{ emailDisplay }}</span>
        </li>
      </ul>

      <div class="friend-card-divider friend-card-divider--section" />

      <!-- 底部可编辑：备注、分组（与 SingleConvInfo 同一 store 接口） -->
      <section class="friend-card-edit" aria-label="我的备注与分组">
        <div class="friend-card-row friend-card-row--field">
          <span class="friend-card-row__label">
            <Pencil :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            备注
          </span>
          <input
            v-model="editableRemark"
            class="friend-card-input"
            type="text"
            placeholder="填写备注"
            maxlength="50"
            autocomplete="off"
          />
        </div>
        <div class="friend-card-row friend-card-row--field">
          <span class="friend-card-row__label">
            <UsersRound :size="18" :stroke-width="2.2" class="friend-card-row__icon" />
            好友分组
          </span>
          <input
            v-model="editableGroup"
            class="friend-card-input"
            type="text"
            placeholder="填写分组"
            maxlength="50"
            autocomplete="off"
          />
        </div>
      </section>
      </div>

      <div
        class="friend-detail-actions-float"
        :class="{ 'friend-detail-actions-float--visible': hasPendingChanges }"
      >
        <button
          class="friend-detail-action-btn friend-detail-action-btn--apply"
          type="button"
          :disabled="isApplying"
          @click="handleApplyRemarkGroup"
        >
          {{ isApplying ? "保存中…" : "应用" }}
        </button>
        <button
          class="friend-detail-action-btn friend-detail-action-btn--cancel"
          type="button"
          :disabled="isApplying"
          @click="handleCancelRemarkGroup"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import {
  ArrowLeft,
  Cake,
  CircleHelp,
  Fingerprint,
  Mail,
  MapPin,
  Mars,
  MessageCircleMore,
  Pencil,
  Activity,
  ScrollText,
  Smartphone,
  User,
  UserX,
  UsersRound,
  Venus,
} from "lucide-vue-next";
import { useFriendStore } from "@/store/friend/showFriend";
import { useConversationInfoStore } from "@/store/conversationInfo/conversationInfo";
import type { FriendListItem } from "@/types/dto/friend";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import toast from "@/commons/utils/toast";
import { syncFriendRemarkToStores } from "@/interactions/friendRemark/syncFriendRemarkToStores";
import {
  computeAgeYearsFromBirthday,
  formatBirthdayMonthDayCn,
  getZodiacSignCn,
  resolveFriendDisplayInitial,
  resolveFriendGenderText,
  resolveNormalizedOnlineStatus,
  resolveOnlineStatusClass,
  resolveOnlineStatusText,
} from "@/interactions/friendInfo/FriendInfoInteraction";

type FriendInfoViewModel = FriendListItem & {
  friendNickname?: string;
  friendAvatar?: string | null;
  friendGender?: number | null;
  friendGroup?: string | null;
  friendBirthday?: string | null;
  friendLocation?: string | null;
  friendSignature?: string | null;
  friendPhone?: string | null;
  friendEmail?: string | null;
  friendOnlineStatus?: number | null;
  friendLastLoginTime?: string | null;
};

const props = defineProps<{
  friend: FriendListItem;
}>();

const emit = defineEmits<{
  back: [];
  "send-message": [friend: FriendListItem];
}>();

const friendStore = useFriendStore();
const conversationInfoStore = useConversationInfoStore();
const deletingFriend = ref(false);
const isApplying = ref(false);
const editableRemark = ref("");
const editableGroup = ref("");
const initialRemark = ref("");
const initialGroup = ref("");

const info = computed<FriendInfoViewModel | null>(() => {
  if (friendStore.currentFriend) return friendStore.currentFriend as FriendInfoViewModel;
  return (props.friend as FriendInfoViewModel) || null;
});

const avatarUrl = computed(() =>
  normalizeAvatarUrl(
    String((info.value as FriendInfoViewModel | null)?.avatar ||
      (info.value as FriendInfoViewModel | null)?.friendAvatar ||
      "")
  )
);

/** 卡片主标题：展示对方昵称（非备注），与备注编辑区分开。 */
const nicknameDisplay = computed(() => {
  if (!info.value) return "未知用户";
  return (
    info.value.friendNickname ||
    info.value.nickname ||
    "未知用户"
  );
});

const displayInitial = computed(() =>
  resolveFriendDisplayInitial(nicknameDisplay.value)
);

const peerUserIdLabel = computed(() => {
  const id = info.value?.friendId;
  if (id == null || Number.isNaN(Number(id))) return "—";
  return String(id);
});

const normalizedOnlineStatus = computed(() => {
  const raw = info.value?.friendOnlineStatus;
  if (raw != null) return resolveNormalizedOnlineStatus(raw);
  const listStatus = info.value?.onlineStatus;
  if (listStatus === "online") return 1;
  if (listStatus === "away") return 2;
  return 0;
});

const onlineStatusText = computed(() =>
  resolveOnlineStatusText(normalizedOnlineStatus.value)
);

const onlineStatusClass = computed(() =>
  resolveOnlineStatusClass(normalizedOnlineStatus.value)
);

const genderText = computed(() =>
  resolveFriendGenderText(info.value?.friendGender)
);

const genderIconComponent = computed(() => {
  const g = info.value?.friendGender;
  if (g === 1) return Mars;
  if (g === 2) return Venus;
  return CircleHelp;
});

const birthdayRowValue = computed(() => {
  const raw = info.value?.friendBirthday;
  if (!raw) return "—";
  const md = formatBirthdayMonthDayCn(raw);
  if (!md) return raw;
  const parts = raw.trim().split(/[-/.]/);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return md;
  return `${md} ${getZodiacSignCn(m, d)}`;
});

const locationDisplay = computed(() => {
  const loc = info.value?.friendLocation?.trim();
  if (!loc) return "未填写";
  return `现居 ${loc}`;
});

const signatureDisplay = computed(() => {
  const s = info.value?.friendSignature?.trim();
  return s || "这个人很神秘，什么都没留下";
});

const phoneDisplay = computed(() => {
  const p = info.value?.friendPhone?.trim();
  return p || "未填写";
});

const emailDisplay = computed(() => {
  const e = info.value?.friendEmail?.trim();
  return e || "未填写";
});

/**
 * 资料卡顶部摘要行：性别、年龄、生日+星座、地区，用竖线拼接。
 * 使用场景：模仿资料卡「男 | 76岁 | 10月1日 天秤座 | 现居 …」紧凑信息条。
 */
const metaSummaryText = computed(() => {
  if (!info.value) return "";
  const parts: string[] = [];
  parts.push(genderText.value);
  const age = computeAgeYearsFromBirthday(info.value.friendBirthday);
  if (age != null) parts.push(`${age}岁`);
  const b = info.value.friendBirthday;
  if (b) {
    const md = formatBirthdayMonthDayCn(b);
    if (md) {
      const segs = b.trim().split(/[-/.]/);
      const m = Number(segs[1]);
      const d = Number(segs[2]);
      if (Number.isFinite(m) && Number.isFinite(d)) {
        parts.push(`${md} ${getZodiacSignCn(m, d)}`);
      } else {
        parts.push(md);
      }
    }
  }
  const loc = info.value.friendLocation?.trim();
  if (loc) parts.push(`现居 ${loc}`);
  return parts.join("  |  ");
});

const hasPendingChanges = computed(
  () =>
    editableRemark.value !== initialRemark.value ||
    editableGroup.value !== initialGroup.value
);

/**
 * 从当前 info 初始化备注/分组编辑框（与 SingleConvInfo 字段来源一致）。
 * 使用场景：进入详情或切换好友时对齐可编辑初值。
 */
function syncEditableFromInfo() {
  const i = info.value;
  if (!i) return;
  initialRemark.value = i.remarkName || "";
  initialGroup.value = i.friendGroup || i.group || "";
  editableRemark.value = initialRemark.value;
  editableGroup.value = initialGroup.value;
}

function loadInfo() {
  friendStore.setCurrentFriend(props.friend as FriendInfoViewModel);
}

watch(
  () => props.friend?.friendId,
  (id) => {
    if (!id) return;
    loadInfo();
    syncEditableFromInfo();
  },
  { immediate: true }
);

onUnmounted(() => {
  friendStore.clearCurrentFriend();
});

const handleBack = () => {
  emit("back");
};

const handleStartChat = () => {
  emit("send-message", props.friend);
};

/**
 * 撤销未提交的备注/分组修改。
 * 使用场景：用户点击「取消」恢复为进入页或上次应用后的值。
 */
const handleCancelRemarkGroup = () => {
  editableRemark.value = initialRemark.value;
  editableGroup.value = initialGroup.value;
};

/**
 * 提交备注与分组：调用与 SingleConvInfo 相同的 store.updateFriendRemark，并同步 Pinia。
 * 使用场景：用户点击「应用」持久化「我」对该好友的备注与分组。
 */
const handleApplyRemarkGroup = async () => {
  const targetFriendId = Number(info.value?.friendId || props.friend?.friendId || 0);
  if (!Number.isFinite(targetFriendId) || targetFriendId <= 0 || isApplying.value) return;

  const payload: { remarkName?: string | null; friendGroup?: string | null } = {};
  const nextRemark = editableRemark.value.trim();
  const nextGroup = editableGroup.value.trim();
  if (nextRemark !== initialRemark.value.trim()) {
    payload.remarkName = nextRemark === "" ? null : nextRemark;
  }
  if (nextGroup !== initialGroup.value.trim()) {
    payload.friendGroup = nextGroup === "" ? null : nextGroup;
  }
  if (Object.keys(payload).length === 0) return;

  isApplying.value = true;
  try {
    await conversationInfoStore.updateFriendRemark(targetFriendId, payload);
    syncFriendRemarkToStores(targetFriendId, nextRemark, nextGroup);
    initialRemark.value = editableRemark.value;
    initialGroup.value = editableGroup.value;
    toast.success("备注与分组已保存");
  } catch (error) {
    console.error("保存备注/分组失败:", error);
    toast.error("保存失败，请稍后重试");
  } finally {
    isApplying.value = false;
  }
};

/**
 * 删除好友：走 store action 触发完整 API -> Normalize -> Store 链路，并在成功后返回上一层。
 * 使用场景：好友详情页点击删除按钮时，立即删除并同步本地 Pinia 中的好友/会话状态。
 */
const handleDeleteFriend = async () => {
  const friendId = Number(props.friend?.friendId);
  if (!friendId) {
    toast.error("好友ID无效，无法删除");
    return;
  }

  if (deletingFriend.value) return;

  const friendName =
    props.friend?.displayName || props.friend?.nickname || "该好友";
  const confirmed = window.confirm(`确认删除好友「${friendName}」吗？`);
  if (!confirmed) return;

  deletingFriend.value = true;
  try {
    await conversationInfoStore.deleteFriend(friendId);
    toast.success("好友已删除");
    emit("back");
  } catch (error) {
    console.error("删除好友失败:", error);
    toast.error("删除好友失败，请稍后重试");
  } finally {
    deletingFriend.value = false;
  }
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-info.css";
@import "@/assets/styles/night/friend-info-night.css";
</style>
