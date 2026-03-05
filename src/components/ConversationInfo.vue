<template>
  <div class="conversation-info-container">
    <!-- 头部：标题与关闭按钮 -->
    <div class="conversation-info-header">
      <div class="conversation-info-title-wrap">
        <h2 class="conversation-info-title">群聊信息</h2>
        <p v-if="conversation" class="conversation-info-subtitle">
          {{ conversation.convDescription || "暂无群简介" }}
        </p>
      </div>
      <button
        class="conversation-info-close"
        @click="handleClose"
        title="关闭群聊信息"
      >
        ✕
      </button>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="conversation-info-content conversation-info-loading"
    >
      <p>正在加载群聊信息...</p>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="error"
      class="conversation-info-content conversation-info-error"
    >
      <p>{{ error }}</p>
    </div>

    <!-- 成功内容 -->
    <div v-else class="conversation-info-content">
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

    <!-- 悬浮操作按钮：只在有改动且有权限时显示 -->
    <div
      v-if="canEditConversation"
      class="info-actions-float"
      :class="{ visible: hasPendingChanges }"
    >
      <button class="info-action-btn apply" @click="handleApply">应用</button>
      <button class="info-action-btn cancel" @click="handleCancel">撤销</button>
    </div>

    <input
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
import type {
  ConversationEntity,
  ConversationMemberDTO,
} from "@/types/dto/conversation-member";

const props = defineProps<{
  convId: number | null;
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

const currentUserId = computed(() => authStore.user?.userId ?? null);

const buildAvatarUrl = (avatar?: string | null): string => {
  if (!avatar) return "";
  const trimmed = avatar.trim();
  if (trimmed.startsWith("http") || trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  const prefix = import.meta.env.VITE_API_BASE_URL || "";
  if (!prefix) return trimmed;
  if (trimmed.startsWith("/")) {
    return `${prefix}${trimmed}`;
  }
  return `${prefix}/${trimmed}`;
};

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
  return buildAvatarUrl(conversation.value.convAvatar);
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
      avatarUrl: buildAvatarUrl(m.userAvatar),
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

// 可编辑字段本地状态
const editableName = ref("");
const editableDescription = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);

const syncEditableFromConversation = () => {
  editableName.value = conversation.value?.convName ?? "";
  editableDescription.value = conversation.value?.convDescription ?? "";
};

const hasPendingChanges = computed(() => {
  if (!conversation.value) return false;
  return (
    editableName.value !== (conversation.value.convName ?? "") ||
    editableDescription.value !== (conversation.value.convDescription ?? "")
  );
});

watch(hasPendingChanges, (pending) => {
  emit("changes-pending", pending);
});

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

// 重新获取会话详情（含会话列表和当前会话），用于在更新后同步全局与本地显示
const fetchConversationDetails = async (successMessage: string) => {
  if (!conversation.value) {
    toast.success(successMessage);
    return;
  }
  try {
    await conversationStore.loadConversations();
    conversationStore.setCurrentConversation(conversation.value.convId);
    // 重新拉取一次带成员信息的详情，保证本组件数据也是最新的
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
  loadConversationInfo();
});

watch(
  () => props.convId,
  () => {
    loadConversationInfo();
  }
);
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/conversation-info.css";
@import "@/assets/styles/night/conversation-info-night.css";
</style>

