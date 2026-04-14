<template>
  <div class="conversation-info-container">
    <!-- 头部：标题与关闭按钮 -->
    <div class="conversation-info-header">
      <div class="conversation-info-title-wrap">
        <h2 class="conversation-info-title">
          {{ isFriendMode ? "好友信息" : "群聊信息" }}
        </h2>
        <p v-if="isFriendMode && friendInfo" class="conversation-info-subtitle">
          {{ friendDisplayName }}
        </p>
        <p
          v-else-if="!isFriendMode && conversation"
          class="conversation-info-subtitle"
        >
          {{ conversation.convDescription || "暂无群简介" }}
        </p>
      </div>
      <button
        class="conversation-info-close"
        @click="handleClose"
        :title="isFriendMode ? '关闭好友信息' : '关闭群聊信息'"
      >
        ✕
      </button>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="conversation-info-content conversation-info-loading"
    >
      <p>{{ isFriendMode ? "正在加载好友信息..." : "正在加载群聊信息..." }}</p>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="error"
      class="conversation-info-content conversation-info-error"
    >
      <p>{{ error }}</p>
    </div>

    <!-- 好友信息内容（单聊） -->
    <div
      v-else-if="isFriendMode && friendInfo"
      class="conversation-info-content"
    >
      <section class="conversation-section">
        <h3 class="section-title">基本信息</h3>
        <div class="conversation-fields">
          <div class="conversation-field-row">
            <div class="field-label">头像</div>
            <div class="field-value avatar-value">
              <div class="conversation-avatar-large">
                <img
                  v-if="friendAvatarUrl"
                  :src="friendAvatarUrl"
                  alt="好友头像"
                  class="avatar-large-img"
                />
                <div v-else class="avatar-large-default">
                  {{ friendDisplayName.charAt(0).toUpperCase() }}
                </div>
              </div>
            </div>
          </div>
          <div class="conversation-field-row">
            <div class="field-label">昵称</div>
            <div class="field-value">{{ friendInfo.friendNickname }}</div>
          </div>
          <div class="conversation-field-row conversation-field-editable">
            <div class="field-label">备注</div>
            <div class="field-value">
              <input
                v-model="editableRemark"
                class="field-input"
                type="text"
                placeholder="未设置备注"
              />
            </div>
          </div>
          <div class="conversation-field-row conversation-field-editable">
            <div class="field-label">分组</div>
            <div class="field-value">
              <input
                v-model="editableGroup"
                class="field-input"
                type="text"
                placeholder="未分组"
              />
            </div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.addSource">
            <div class="field-label">添加来源</div>
            <div class="field-value">{{ friendInfo.addSource }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.addTime">
            <div class="field-label">添加时间</div>
            <div class="field-value">{{ friendInfo.addTime }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.updateTime">
            <div class="field-label">更新时间</div>
            <div class="field-value">{{ friendInfo.updateTime }}</div>
          </div>
        </div>
      </section>
      <section class="conversation-section">
        <h3 class="section-title">个人信息</h3>
        <div class="conversation-fields">
          <div class="conversation-field-row" v-if="friendInfo.friendSignature">
            <div class="field-label">个性签名</div>
            <div class="field-value multiline">
              {{ friendInfo.friendSignature }}
            </div>
          </div>
          <div
            class="conversation-field-row"
            v-if="
              friendInfo.friendGender !== undefined &&
              friendInfo.friendGender !== null
            "
          >
            <div class="field-label">性别</div>
            <div class="field-value">{{ friendGenderText }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.friendBirthday">
            <div class="field-label">生日</div>
            <div class="field-value">{{ friendInfo.friendBirthday }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.friendLocation">
            <div class="field-label">地区</div>
            <div class="field-value">{{ friendInfo.friendLocation }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.friendPhone">
            <div class="field-label">手机号</div>
            <div class="field-value">{{ friendInfo.friendPhone }}</div>
          </div>
          <div class="conversation-field-row" v-if="friendInfo.friendEmail">
            <div class="field-label">邮箱</div>
            <div class="field-value">{{ friendInfo.friendEmail }}</div>
          </div>
          <div
            class="conversation-field-row"
            v-if="friendInfo.friendLastLoginTime"
          >
            <div class="field-label">最后登录</div>
            <div class="field-value">{{ friendInfo.friendLastLoginTime }}</div>
          </div>
          <div class="conversation-field-row">
            <div class="field-label">用户 ID</div>
            <div class="field-value">{{ friendInfo.friendId }}</div>
          </div>
        </div>
      </section>
    </div>

    <!-- 群聊成功内容 -->
    <div v-else-if="!isFriendMode" class="conversation-info-content">
      <!-- 群基础信息：以“文本框行”的形式展示 -->
      <section v-if="conversation" class="conversation-section">
        <h3 class="section-title">群聊信息</h3>
        <div class="conversation-fields">
          <!-- 头像 -->
          <div class="conversation-field-row" :class="conversationFieldClass">
            <div class="field-label">群头像</div>
            <div class="field-value avatar-value">
              <div
                class="conversation-avatar-large"
                :class="{ 'avatar-clickable': canEditConversation }"
                @click="handleAvatarClick"
              >
                <img
                  v-if="conversationAvatarUrl"
                  :src="conversationAvatarUrl"
                  alt="群头像"
                  class="avatar-large-img"
                />
                <div v-else class="avatar-large-default">
                  {{ conversation.convName.charAt(0).toUpperCase() }}
                </div>
              </div>
            </div>
          </div>

          <!-- 群名称 -->
          <div class="conversation-field-row" :class="conversationFieldClass">
            <div class="field-label">群名称</div>
            <div class="field-value">
              <input
                v-model="editableName"
                :readonly="!canEditConversation"
                class="field-input"
                type="text"
              />
            </div>
          </div>

          <!-- 群介绍 -->
          <div class="conversation-field-row" :class="conversationFieldClass">
            <div class="field-label">群介绍</div>
            <div class="field-value multiline">
              <textarea
                v-model="editableDescription"
                :readonly="!canEditConversation"
                class="field-textarea"
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- 成员数 -->
          <div class="conversation-field-row">
            <div class="field-label">成员数</div>
            <div class="field-value">
              {{ conversation.currentMemberCount }} /
              {{ conversation.maxMemberCount }}
            </div>
          </div>

          <!-- 群主 -->
          <div class="conversation-field-row">
            <div class="field-label">群主</div>
            <div class="field-value">
              {{ ownerDisplayName }}（ID: {{ conversation.convOwnerId }}）
            </div>
          </div>

          <!-- 已读回执 -->
          <div class="conversation-field-row">
            <div class="field-label">已读回执</div>
            <div class="field-value">
              {{
                conversation.enableReadReceipt
                  ? "已启用（功能开发中）"
                  : "未启用"
              }}
            </div>
          </div>

          <!-- 状态 -->
          <div class="conversation-field-row">
            <div class="field-label">状态</div>
            <div class="field-value">
              {{ convStatusText }}
            </div>
          </div>

          <!-- 创建时间 -->
          <div class="conversation-field-row">
            <div class="field-label">创建时间</div>
            <div class="field-value">
              {{ conversation.createTime }}
            </div>
          </div>

          <!-- 会话 ID -->
          <div class="conversation-field-row">
            <div class="field-label">会话 ID</div>
            <div class="field-value">
              {{ conversation.convId }}
            </div>
          </div>
        </div>
      </section>

      <!-- 群成员部分（仅展示部分成员） -->
      <section class="conversation-section">
        <div class="section-header-row">
          <h3 class="section-title">群成员</h3>
          <span class="section-subtext" v-if="conversation">
            共 {{ conversation.currentMemberCount }} 人
          </span>
        </div>

        <div v-if="displayMembers.length === 0" class="conversation-empty">
          暂无成员信息
        </div>
        <div v-else class="member-grid">
          <div
            v-for="member in displayMembers"
            :key="member.userId"
            class="member-item"
          >
            <div class="member-avatar">
              <img
                v-if="member.avatarUrl"
                :src="member.avatarUrl"
                alt="头像"
                class="member-avatar-img"
              />
              <div v-else class="member-avatar-default">
                {{ member.displayName.charAt(0).toUpperCase() }}
              </div>
              <span v-if="member.isCurrentUser" class="member-tag me-tag">
                我
              </span>
              <span v-else-if="member.roleTag" class="member-tag role-tag">
                {{ member.roleTag }}
              </span>
            </div>
            <div class="member-name" :title="member.displayName">
              {{ member.displayName }}
            </div>
          </div>

          <div v-if="extraMemberCount > 0" class="member-item member-more">
            <div class="member-more-circle">+{{ extraMemberCount }}</div>
            <div class="member-name">更多成员</div>
          </div>
        </div>
      </section>

      <!-- 我的群设置（占位，可后续扩展更多功能） -->
      <section class="conversation-section">
        <h3 class="section-title">我的群设置</h3>
        <div class="settings-card">
          <div class="settings-row">
            <div class="settings-label">我的群昵称</div>
            <div class="settings-value">
              <span v-if="myDisplayName">
                {{ myDisplayName }}
              </span>
              <span v-else class="settings-placeholder">
                未设置，当前显示为原始昵称
              </span>
            </div>
          </div>
          <div class="settings-row disabled-row">
            <div class="settings-label">免打扰</div>
            <div class="settings-value">
              <span class="settings-badge disabled-badge">即将上线</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 悬浮操作按钮：群聊有改动且有权限时 / 好友模式有改动时显示 -->
    <div
      v-if="
        (isFriendMode && hasFriendPendingChanges) ||
        (!isFriendMode && canEditConversation)
      "
      class="info-actions-float"
      :class="{
        visible:
          (isFriendMode && hasFriendPendingChanges) ||
          (!isFriendMode && hasPendingChanges),
      }"
    >
      <button
        class="info-action-btn apply"
        @click="isFriendMode ? handleFriendApply() : handleApply()"
      >
        应用
      </button>
      <button
        class="info-action-btn cancel"
        @click="isFriendMode ? handleFriendCancel() : handleCancel()"
      >
        撤销
      </button>
    </div>

    <input
      v-if="!isFriendMode"
      ref="avatarInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleAvatarChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import toast from "@/commons/utils/toast";
import { useAuthStore } from "@/stores/auth";
import { useFriendStore } from "@/stores/friend/show-friend";
import { useConversationStore } from "@/stores/chat/show-conversation";
import { conversationMemberApi } from "@/apis/chat/conversation-member";
import { manageConversationApi } from "@/apis/chat/manage-conversation";
import { friendApi } from "@/apis/friend";
import { normalizeAvatarUrl } from "@/utils/avatar-url";
import type {
  ConversationEntity,
  ConversationMemberDTO,
} from "@/types/dto/conversation-member";
import type { FriendInfoDTO } from "@/types/dto/friend";

const props = defineProps<{
  convId: number | null;
  /** 单聊时对方用户 ID（好友 userId），传入时展示好友详情而非群聊信息 */
  friendId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  "changes-pending": [pending: boolean];
}>();

const authStore = useAuthStore();
const friendStore = useFriendStore();
const conversationStore = useConversationStore();

const loading = ref(false);
const error = ref<string | null>(null);
const conversation = ref<ConversationEntity | null>(null);
const members = ref<ConversationMemberDTO[]>([]);
const friendInfo = ref<FriendInfoDTO | null>(null);

const isFriendMode = computed(
  () => props.friendId != null && props.friendId > 0
);

const currentUserId = computed(() => authStore.user?.userId ?? null);

const resolveDisplayName = (member: ConversationMemberDTO): string => {
  // 1. 群昵称
  if (member.memberNickname && member.memberNickname.trim() !== "") {
    return member.memberNickname.trim();
  }

  // 2. 备注名（如果是好友）
  const friends = friendStore.friends;
  const relatedFriend = friends.find((f) => f.friendId === member.userId);
  if (relatedFriend?.remarkName && relatedFriend.remarkName.trim() !== "") {
    return relatedFriend.remarkName.trim();
  }

  // 3. 用户原始昵称
  return member.userNickname || "未知用户";
};

// 当前用户在群内的角色（2=群主，1=管理员，0=普通成员）
const currentUserRole = computed<number | null>(() => {
  if (!currentUserId.value) return null;
  const me = members.value.find((m) => m.userId === currentUserId.value);
  return me?.role ?? 0;
});

const canEditConversation = computed(() => {
  return currentUserRole.value === 2 || currentUserRole.value === 1;
});

const conversationFieldClass = computed(() =>
  canEditConversation.value
    ? "conversation-field-editable"
    : "conversation-field-readonly"
);

const conversationAvatarUrl = computed(() => {
  if (!conversation.value?.convAvatar) return "";
  return normalizeAvatarUrl(conversation.value.convAvatar);
});

// 好友模式下的展示
const friendAvatarUrl = computed(() => {
  if (!friendInfo.value?.friendAvatar) return "";
  return normalizeAvatarUrl(friendInfo.value.friendAvatar);
});
const friendDisplayName = computed(() => {
  if (!friendInfo.value) return "";
  return (
    friendInfo.value.remarkName?.trim() ||
    friendInfo.value.friendNickname ||
    "未知"
  );
});
const friendGenderText = computed(() => {
  if (!friendInfo.value || friendInfo.value.friendGender == null) return "";
  const g = friendInfo.value.friendGender;
  if (g === 1) return "男";
  if (g === 2) return "女";
  return "未知";
});

const ownerDisplayName = computed(() => {
  if (!conversation.value) return "";
  const owner = members.value.find(
    (m) => m.userId === conversation.value!.convOwnerId
  );
  if (!owner) return `用户 ${conversation.value.convOwnerId}`;
  return resolveDisplayName(owner);
});

const convStatusText = computed(() => {
  if (!conversation.value) return "";
  const status = conversation.value.convStatus;
  if (status === 1) return "正常";
  if (status === 0) return "已关闭";
  return "未知状态";
});

const rawVisibleMembers = computed(() => {
  // 默认最多展示 12 个成员
  const maxVisible = 12;
  return members.value.slice(0, maxVisible);
});

const extraMemberCount = computed(() => {
  const total =
    conversation.value?.currentMemberCount || members.value.length || 0;
  const visibleCount = rawVisibleMembers.value.length;
  return total > visibleCount ? total - visibleCount : 0;
});

const displayMembers = computed(() =>
  rawVisibleMembers.value.map((m) => {
    const displayName = resolveDisplayName(m);
    let roleTag: string | null = null;
    if (m.role === 2) {
      roleTag = "群主";
    } else if (m.role === 1) {
      roleTag = "管理员";
    }
    const isCurrentUser = m.userId === currentUserId.value;

    return {
      ...m,
      displayName,
      avatarUrl: normalizeAvatarUrl(m.userAvatar),
      roleTag,
      isCurrentUser,
    };
  })
);

const myDisplayName = computed(() => {
  if (!currentUserId.value) return "";
  const me = members.value.find((m) => m.userId === currentUserId.value);
  if (!me) return "";
  return resolveDisplayName(me);
});

// 可编辑字段本地状态（群聊）
const editableName = ref("");
const editableDescription = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);

// 可编辑字段本地状态（好友模式：备注、分组）
const editableRemark = ref("");
const editableGroup = ref("");

const syncEditableFromConversation = () => {
  editableName.value = conversation.value?.convName ?? "";
  editableDescription.value = conversation.value?.convDescription ?? "";
};

const syncEditableFromFriend = () => {
  editableRemark.value = friendInfo.value?.remarkName ?? "";
  editableGroup.value = friendInfo.value?.friendGroup ?? "";
};

const hasPendingChanges = computed(() => {
  if (!conversation.value) return false;
  return (
    editableName.value !== (conversation.value.convName ?? "") ||
    editableDescription.value !== (conversation.value.convDescription ?? "")
  );
});

const hasFriendPendingChanges = computed(() => {
  if (!friendInfo.value) return false;
  return (
    editableRemark.value !== (friendInfo.value.remarkName ?? "") ||
    editableGroup.value !== (friendInfo.value.friendGroup ?? "")
  );
});

const anyPendingChanges = computed(() =>
  isFriendMode.value ? hasFriendPendingChanges.value : hasPendingChanges.value
);

watch(anyPendingChanges, (pending) => {
  emit("changes-pending", pending);
});

const loadFriendInfo = async () => {
  if (props.friendId == null || props.friendId <= 0) {
    friendInfo.value = null;
    error.value = null;
    return;
  }
  try {
    loading.value = true;
    error.value = null;
    const response = await friendApi.getFriendInfoByUserIdAndFriendId(
      props.friendId
    );
    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || "获取好友信息失败");
    }
    friendInfo.value = response.data;
    syncEditableFromFriend();
  } catch (e: any) {
    console.error("加载好友信息失败:", e);
    error.value = e?.message || "加载好友信息失败，请检查网络连接";
    friendInfo.value = null;
  } finally {
    loading.value = false;
  }
};

const handleFriendApply = async () => {
  if (!friendInfo.value || !props.friendId) return;
  const remark = editableRemark.value.trim();
  const group = editableGroup.value.trim();
  const sameRemark = (friendInfo.value.remarkName ?? "") === remark;
  const sameGroup = (friendInfo.value.friendGroup ?? "") === group;
  if (sameRemark && sameGroup) return;
  try {
    const resp = await friendApi.updateFriendRemarkAndGroup(
      props.friendId,
      {
      remarkName: sameRemark ? undefined : remark || null,
      friendGroup: sameGroup ? undefined : group || null,
      }
    );
    if (resp.code === 200) {
      await loadFriendInfo();
      await friendStore.loadFriends();
      if (props.convId != null) {
        await conversationStore.refreshConversationById(props.convId);
      }
      toast.success("备注与分组已更新");
    } else {
      toast.error(resp.message || "更新失败");
    }
  } catch (e: any) {
    console.error("更新好友备注/分组失败:", e);
    toast.error(e?.message || "更新失败，请稍后重试");
  }
};

const handleFriendCancel = () => {
  syncEditableFromFriend();
};

const loadConversationInfo = async () => {
  if (!props.convId) {
    conversation.value = null;
    members.value = [];
    error.value = null;
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const response = await conversationMemberApi.getConversationWithMembers(
      props.convId
    );

    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || "获取群聊信息失败，请稍后重试");
    }

    conversation.value = response.data.conversation;
    members.value = response.data.members || [];
    // 同步可编辑字段为当前会话最新值
    syncEditableFromConversation();
  } catch (e: any) {
    console.error("加载会话成员详情失败:", e);
    if (e?.response?.status === 401 || e?.code === 401) {
      error.value =
        e.response?.data?.message || "您不是该会话的成员，无法查看会话详情";
    } else {
      error.value = e?.message || "加载群聊信息失败，请检查网络连接";
    }
    conversation.value = null;
    members.value = [];
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit("close");
};

const handleAvatarClick = () => {
  if (!canEditConversation.value) return;
  avatarInputRef.value?.click();
};

// 按 convId 定向拉取会话详情并写回 store，再刷新本组件带成员信息的详情
const fetchConversationDetails = async (successMessage: string) => {
  if (!conversation.value) {
    toast.success(successMessage);
    return;
  }
  const convId = conversation.value.convId;
  try {
    await conversationStore.refreshConversationById(convId);
    await loadConversationInfo();
    toast.success(successMessage);
  } catch (e) {
    console.error("刷新会话详情失败:", e);
    toast.error("信息已更新，但刷新会话列表失败，请稍后重试");
  }
};

// 复用 UserProfileEdit 中的思路：压缩图片得到 base64，再通过会话更新接口上传
const compressImage = (
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7
) => {
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
          reject(new Error("无法获取 Canvas 上下文"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const handleAvatarChange = async (event: Event) => {
  if (!conversation.value || !canEditConversation.value) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("图片大小不能超过 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    const compressedBase64 = await compressImage(file, 400, 400, 0.7);

    const resp =
      await manageConversationApi.updateConversationAttriUserOrientedByConvId({
        convId: conversation.value.convId,
        convAvatar: compressedBase64,
      });

    if (resp.code === 200) {
      // 前端立即更新显示
      conversation.value.convAvatar = compressedBase64;
      await fetchConversationDetails("群头像更新成功");
    } else {
      toast.error(resp.message || "群头像更新失败");
    }
  } catch (e) {
    console.error("更新群头像失败:", e);
    toast.error("群头像更新失败，请稍后重试");
  } finally {
    input.value = "";
  }
};

const handleApply = async () => {
  if (!conversation.value || !canEditConversation.value) return;

  try {
    const payload: Partial<ConversationEntity> & { convId: number } = {
      convId: conversation.value.convId,
    };

    if (editableName.value !== conversation.value.convName) {
      payload.convName = editableName.value.trim();
    }
    if (
      editableDescription.value !== (conversation.value.convDescription ?? "")
    ) {
      payload.convDescription = editableDescription.value.trim();
    }

    if (Object.keys(payload).length === 1) {
      // 只有 convId，说明没有修改
      return;
    }

    const resp =
      await manageConversationApi.updateConversationAttriUserOrientedByConvId(
        payload
      );

    if (resp.code === 200) {
      if (payload.convName !== undefined) {
        conversation.value.convName = payload.convName;
      }
      if (payload.convDescription !== undefined) {
        conversation.value.convDescription = payload.convDescription;
      }
      syncEditableFromConversation();
      await fetchConversationDetails("群聊信息更新成功");
    } else {
      console.error("更新会话信息失败:", resp.message);
      toast.error(resp.message || "更新群聊信息失败");
    }
  } catch (e) {
    console.error("更新会话信息异常:", e);
    toast.error("更新群聊信息异常，请稍后重试");
  }
};

const handleCancel = () => {
  syncEditableFromConversation();
};

onMounted(() => {
  if (isFriendMode.value) {
    loadFriendInfo();
  } else if (props.convId) {
    loadConversationInfo();
  }
});

watch(
  () => [props.convId, props.friendId] as const,
  ([convId, friendId]) => {
    if (friendId != null && friendId > 0) {
      loadFriendInfo();
    } else if (convId) {
      loadConversationInfo();
    } else {
      loading.value = false;
      error.value = null;
      conversation.value = null;
      members.value = [];
      friendInfo.value = null;
    }
  }
);
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/conversation-info.css";
@import "@/assets/styles/night/conversation-info-night.css";
</style>

