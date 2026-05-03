<!-- 群成员资料悬浮卡：展示头像、昵称、角色与可选管理/好友操作。使用场景：群资料成员列表旁、消息列表他人头像旁。 -->
<template>
  <div
    ref="panelRef"
    class="group-member-popover"
    :style="panelStyle"
    role="dialog"
    aria-label="成员信息"
    @click.stop
  >
    <div class="group-member-popover__avatar">
      <img
        v-if="memberAvatarUrl(member)"
        :src="memberAvatarUrl(member)"
        alt=""
        class="group-member-popover__avatar-img"
      />
      <span v-else class="group-member-popover__avatar-fallback">{{
        memberDisplayInitial(member)
      }}</span>
    </div>
    <div class="group-member-popover__name">
      {{ memberListLabel(member) }}
    </div>
    <p v-if="isSelf" class="group-member-popover__self-hint">我自己</p>
    <dl class="group-member-popover__dl">
      <div class="group-member-popover__row">
        <dt>用户昵称</dt>
        <dd>{{ member.userNickname }}</dd>
      </div>
      <div class="group-member-popover__row">
        <dt>群昵称</dt>
        <dd>{{ member.memberNickname || "—" }}</dd>
      </div>
      <div class="group-member-popover__row">
        <dt>用户 ID</dt>
        <dd>{{ member.userId }}</dd>
      </div>
      <div class="group-member-popover__row">
        <dt>本群角色</dt>
        <dd>{{ memberRolePlainText(member, convOwnerId) }}</dd>
      </div>
      <div class="group-member-popover__row">
        <dt>成员状态</dt>
        <dd>{{ memberStatusPlainText(member) }}</dd>
      </div>
    </dl>
    <div v-if="showGroupManage" class="group-member-popover__manage">
      <button
        type="button"
        class="group-member-popover__manage-btn"
        title="踢出群聊"
        aria-label="踢出群聊"
        :disabled="actionLoading"
        @click.stop="emit('kick')"
      >
        <UserMinus :size="20" :stroke-width="2.2" />
        <span>踢出</span>
      </button>
      <button
        v-if="canMute"
        type="button"
        class="group-member-popover__manage-btn"
        title="禁言"
        aria-label="禁言"
        :disabled="actionLoading"
        @click.stop="emit('mute')"
      >
        <MicOff :size="20" :stroke-width="2.2" />
        <span>禁言</span>
      </button>
      <button
        v-if="canUnmute"
        type="button"
        class="group-member-popover__manage-btn"
        title="解除禁言"
        aria-label="解除禁言"
        :disabled="actionLoading"
        @click.stop="emit('unmute')"
      >
        <Mic :size="20" :stroke-width="2.2" />
        <span>解除禁言</span>
      </button>
    </div>
    <div
      v-if="!isSelf && (showSendMessage || showAddFriend)"
      class="group-member-popover__actions"
    >
      <button
        v-if="showSendMessage"
        type="button"
        class="group-member-popover__icon-btn"
        title="发送消息"
        aria-label="发送消息"
        :disabled="actionLoading"
        @click.stop="emit('sendMessage')"
      >
        <MessageCircleMore :size="22" :stroke-width="2.2" />
      </button>
      <button
        v-if="showAddFriend"
        type="button"
        class="group-member-popover__icon-btn"
        title="加为好友"
        aria-label="加为好友"
        :disabled="actionLoading"
        @click.stop="emit('addFriend')"
      >
        <UserPlus :size="22" :stroke-width="2.2" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  MessageCircleMore,
  Mic,
  MicOff,
  UserMinus,
  UserPlus,
} from "lucide-vue-next";
import type { ConversationMemberDTO } from "@/types/dto/conversation-member";
import {
  memberAvatarUrl,
  memberDisplayInitial,
  memberListLabel,
  memberRolePlainText,
  memberStatusPlainText,
} from "@/commons/utils/group-member-card-display";

defineProps<{
  /** 当前卡片展示的成员一行（群详情 DTO 与消息区 compressed 行结构一致）。 */
  member: ConversationMemberDTO;
  /** 用于 fixed 定位的内联样式对象（top/left 为 px）。 */
  panelStyle: Record<string, string>;
  /** 会话群主用户 ID；用于「本群角色」与群主判断，缺省为 0。 */
  convOwnerId: number;
  /** 是否为当前登录用户本人。 */
  isSelf: boolean;
  /** 是否展示踢人/禁言管理条（群主视角）。 */
  showGroupManage: boolean;
  canMute: boolean;
  canUnmute: boolean;
  showSendMessage: boolean;
  showAddFriend: boolean;
  actionLoading: boolean;
}>();

const emit = defineEmits<{
  kick: [];
  mute: [];
  unmute: [];
  sendMessage: [];
  addFriend: [];
}>();

/** 弹层根节点；父组件用于测量高度做视口底部夹紧。 */
const panelRef = ref<HTMLElement | null>(null);

defineExpose({
  panelRef,
});
</script>

<style>
@import "@/assets/styles/group-member-popover.css";
</style>
