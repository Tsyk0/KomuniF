<!-- File: src/components/MessageItem.vue -->
<template>
  <div class="message-item" :data-message-id="String(message.messageId)">
    <!-- 他人发送的消息 -->
    <div v-if="!isSentByMe" class="message-wrapper message-left">
      <div class="avatar-section left">
        <div class="avatar-face">
          <img
            v-if="avatarDisplayUrl"
            :src="avatarDisplayUrl"
            alt=""
            class="message-avatar-img"
            @error="onAvatarError"
          />
          <div v-else class="avatar-placeholder"></div>
        </div>
        <div class="display-name">{{ displayName }}</div>
      </div>

      <div
        class="message-bubble received"
        :class="{ 'message-bubble--flash': flashAnchor }"
      >
        <div
          v-if="flashAnchor"
          class="message-bubble-flash-layer"
          aria-hidden="true"
        />
        <template v-if="isImageMessage">
          <img
            class="message-image-thumb"
            :src="resolvedThumbnailUrl"
            alt="图片消息"
            @click="handleOpenImage"
          />
        </template>
        <template v-else-if="isFileLikeMessage">
          <button
            class="file-message-card"
            type="button"
            @click="handleDownloadFile"
          >
            <div class="file-message-icon">{{ fileCardIcon }}</div>
            <div class="file-message-info">
              <div class="file-message-name">{{ fileDisplayName }}</div>
              <div class="file-message-meta">
                {{ fileDisplaySize }} · {{ fileDisplayMimeType }}
              </div>
            </div>
          </button>
        </template>
        <div v-else class="message-text">{{ message.messageContent }}</div>
        <div class="message-time">{{ formatTime(message.sendTime) }}</div>
      </div>
    </div>

    <!-- 自己发送的消息 -->
    <div v-else class="message-wrapper message-right message-sent">
      <div
        class="message-bubble sent"
        :class="{ 'message-bubble--flash': flashAnchor }"
      >
        <div
          v-if="flashAnchor"
          class="message-bubble-flash-layer"
          aria-hidden="true"
        />
        <template v-if="isImageMessage">
          <img
            class="message-image-thumb"
            :src="resolvedThumbnailUrl"
            alt="图片消息"
            @click="handleOpenImage"
          />
        </template>
        <template v-else-if="isFileLikeMessage">
          <button
            class="file-message-card"
            type="button"
            @click="handleDownloadFile"
          >
            <div class="file-message-icon">{{ fileCardIcon }}</div>
            <div class="file-message-info">
              <div class="file-message-name">{{ fileDisplayName }}</div>
              <div class="file-message-meta">
                {{ fileDisplaySize }} · {{ fileDisplayMimeType }}
              </div>
            </div>
          </button>
        </template>
        <div v-else class="message-text">{{ message.messageContent }}</div>
        <div class="message-time">{{ formatTime(message.sendTime) }}</div>
      </div>

      <div class="avatar-section right">
        <div class="avatar-face">
          <img
            v-if="avatarDisplayUrl"
            :src="avatarDisplayUrl"
            alt=""
            class="message-avatar-img"
            @error="onAvatarError"
          />
          <div v-else class="avatar-placeholder"></div>
        </div>
        <div class="display-name">{{ displayName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import {
  buildFileDownloadUrl,
  buildFileThumbnailUrl,
} from "@/commons/utils/file-url";
import { useShowMessageStore } from "@/store/message/showMessage";
import { useImagePreviewStore } from "@/store/message/imagePreview";
import { useConvStore } from "@/store/conv/conv";
import { useUserStore } from "@/store/user/user";
import { useFriendStore } from "@/store/friend/showFriend";
import type { DisplayMessage } from "@/entity/message";

interface Props {
  message: DisplayMessage;
  /** 搜索跳转锚点：灰色与默认背景交替闪烁约 3 秒 */
  flashAnchor?: boolean;
  /** 1 单聊 2 群聊；与 ChatContainer 当前会话一致 */
  convType?: number | null;
}

const props = defineProps<Props>();
const showMessageStore = useShowMessageStore();
const imagePreviewStore = useImagePreviewStore();
const convStore = useConvStore();
const authStore = useUserStore();
const friendStore = useFriendStore();

const isAvatarLoadSuccessful = ref(true);

/** 会话类型优先使用父组件传入，未就绪时回退到 convStore 映射。 */
const resolvedConvType = computed<number | null>(() => {
  if (props.convType != null) return Number(props.convType);
  const conv = convStore.conversationMap.get(Number(props.message.convId));
  return conv?.convType == null ? null : Number(conv.convType);
});

const rawAvatarSource = computed(() => {
  if (resolvedConvType.value === 1) {
    if (props.message.isSentByMe) return authStore.user?.userAvatar || "";
    const conv = convStore.conversationMap.get(Number(props.message.convId));
    return conv?.convAvatar || "";
  }
  if (props.message.isSentByMe) return authStore.user?.userAvatar || "";
  return props.message.senderAvatar || "";
});

watch(rawAvatarSource, () => {
  isAvatarLoadSuccessful.value = true;
});

const avatarDisplayUrl = computed(() => {
  if (!isAvatarLoadSuccessful.value) return "";
  return normalizeAvatarUrl(rawAvatarSource.value);
});

const onAvatarError = () => {
  isAvatarLoadSuccessful.value = false;
};

const isSentByMe = computed(() => props.message.isSentByMe);
// 统一解析 image/file/video 的 JSON 消息体，兼容服务端回放和本地临时消息。
const parsedFilePayload = computed(() => {
  if (!["image", "file", "video"].includes(props.message.messageType || ""))
    return null;
  if (!props.message.messageContent) return null;
  try {
    const payload = JSON.parse(props.message.messageContent) as {
      fileId?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    };
    return payload;
  } catch {
    return null;
  }
});
const isImageMessage = computed(() => props.message.messageType === "image");
const isFileLikeMessage = computed(
  () =>
    props.message.messageType === "file" ||
    props.message.messageType === "video"
);
const resolvedDownloadUrl = computed(() => {
  const directUrl = props.message.downloadUrl;
  if (directUrl) return directUrl;
  const fileId = props.message.fileId || parsedFilePayload.value?.fileId;
  return fileId ? buildFileDownloadUrl(fileId) : "";
});
const resolvedThumbnailUrl = computed(() => {
  const directUrl = props.message.thumbnailUrl;
  if (directUrl) return directUrl;
  const fileId = props.message.fileId || parsedFilePayload.value?.fileId;
  return fileId ? buildFileThumbnailUrl(fileId) : "";
});
const fileDisplayName = computed(
  () =>
    props.message.fileName ||
    parsedFilePayload.value?.fileName ||
    (props.message.messageType === "video" ? "视频文件" : "附件文件")
);
const fileDisplaySize = computed(() => {
  const rawSize =
    props.message.fileSize ?? parsedFilePayload.value?.fileSize ?? 0;
  if (rawSize < 1024) return `${rawSize} B`;
  if (rawSize < 1024 * 1024) return `${(rawSize / 1024).toFixed(1)} KB`;
  if (rawSize < 1024 * 1024 * 1024)
    return `${(rawSize / 1024 / 1024).toFixed(1)} MB`;
  return `${(rawSize / 1024 / 1024 / 1024).toFixed(1)} GB`;
});
const fileDisplayMimeType = computed(
  () =>
    props.message.fileMimeType ||
    parsedFilePayload.value?.mimeType ||
    (props.message.messageType === "video" ? "video/*" : "file/*")
);
const fileCardIcon = computed(() =>
  props.message.messageType === "video" ? "🎬" : "📄"
);

/**
 * 打开图片原图。
 * 作用场景：图片消息点击缩略图后查看原图。
 */
const handleOpenImage = () => {
  if (!resolvedDownloadUrl.value) return;
  void imagePreviewStore.openPreviewByDownloadUrl(resolvedDownloadUrl.value);
};

/**
 * 下载文件或视频。
 * 作用场景：file/video 消息点击卡片后触发下载。
 */
const handleDownloadFile = () => {
  if (!resolvedDownloadUrl.value) return;
  window.open(resolvedDownloadUrl.value, "_blank");
};

// 依赖好友列表，使修改备注后消息中的对方名称实时更新（优先级：群昵称 > 好友备注 > 用户昵称）
const displayName = computed(() => {
  void friendStore.friends;
  return showMessageStore.getSenderDisplayName(props.message);
});

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  try {
    const date = new Date(timeStr);
    return (
      date.getHours().toString().padStart(2, "0") +
      ":" +
      date.getMinutes().toString().padStart(2, "0")
    );
  } catch (e) {
    console.error("时间格式化错误:", e);
    return "";
  }
};
</script>

<style scoped>
/* 导入对应主题的样式 */
@import "@/assets/styles/message-item.css";

/* 搜索锚点：叠在气泡上的蒙层，只改 opacity。
 * 使用「每周期 0→亮→0」+ 偶数次 repeat + forwards，避免 alternate+偶数次停在 from 上导致结束时仍较亮、移除时突兀 */
@keyframes message-bubble-anchor-flash {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.38;
  }
  100% {
    opacity: 0;
  }
}

.message-bubble.message-bubble--flash {
  position: relative;
}

.message-bubble-flash-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: rgb(0 0 0 / 1);
  opacity: 0;
  animation: message-bubble-anchor-flash 0.5s ease-in-out 6 forwards;
}

.message-bubble.message-bubble--flash .message-text {
  position: relative;
  z-index: 2;
}

/* 保持全局里的 position:absolute 布局，仅抬高层级盖住蒙层 */
.message-bubble.message-bubble--flash .message-time {
  z-index: 2;
}
</style>
