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
        <template v-else-if="isVideoMessage">
          <div
            class="message-video-thumb-wrap"
            role="button"
            tabindex="0"
            @click="handleOpenVideo"
            @keydown.enter.prevent="handleOpenVideo"
            @keydown.space.prevent="handleOpenVideo"
          >
            <img
              class="message-video-thumb-img"
              :src="resolvedVideoPreviewUrl"
              alt="视频消息"
            />
            <span class="message-video-play-overlay" aria-hidden="true">
              <el-icon class="message-video-play-icon"><VideoPlay /></el-icon>
            </span>
          </div>
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
        <template v-else-if="isVideoMessage">
          <div
            class="message-video-thumb-wrap"
            role="button"
            tabindex="0"
            @click="handleOpenVideo"
            @keydown.enter.prevent="handleOpenVideo"
            @keydown.space.prevent="handleOpenVideo"
          >
            <img
              class="message-video-thumb-img"
              :src="resolvedVideoPreviewUrl"
              alt="视频消息"
            />
            <span class="message-video-play-overlay" aria-hidden="true">
              <el-icon class="message-video-play-icon"><VideoPlay /></el-icon>
            </span>
          </div>
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

  <Teleport to="body">
    <div
      v-if="videoDialogVisible"
      ref="videoOverlayRef"
      class="message-video-overlay"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-label="视频播放"
      @click.self="closeVideoPlayerOverlay"
      @keydown.escape.prevent="closeVideoPlayerOverlay"
    >
      <button
        type="button"
        class="message-video-close-btn"
        aria-label="关闭"
        @click.stop="closeVideoPlayerOverlay"
      >
        <el-icon :size="22"><Close /></el-icon>
      </button>
      <video
        class="message-video-player"
        :src="videoDialogSrc || undefined"
        controls
        playsinline
        preload="metadata"
        @click.stop
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { Close, VideoPlay } from "@element-plus/icons-vue";
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
      /** 视频首帧或封面地址；优先于缩略图接口用于展示 */
      videoPreviewUrl?: string;
    };
    return payload;
  } catch {
    return null;
  }
});
const isImageMessage = computed(() => props.message.messageType === "image");
/** 是否为视频类消息（缩略图 + 弹窗播放，与图片并列） */
const isVideoMessage = computed(() => props.message.messageType === "video");
const isFileLikeMessage = computed(() => props.message.messageType === "file");
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
/**
 * 视频消息列表缩略图地址。
 * 使用场景：优先展示 message_content.videoPreviewUrl（首帧图），缺省时回退与普通图片相同的缩略图规则。
 */
const resolvedVideoPreviewUrl = computed(() => {
  const raw = parsedFilePayload.value?.videoPreviewUrl;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return resolvedThumbnailUrl.value;
});
const fileDisplayName = computed(
  () =>
    props.message.fileName || parsedFilePayload.value?.fileName || "附件文件"
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
    props.message.fileMimeType || parsedFilePayload.value?.mimeType || "file/*"
);
const fileCardIcon = computed(() => "📄");

/**
 * 打开图片原图。
 * 作用场景：图片消息点击缩略图后查看原图。
 */
const handleOpenImage = () => {
  if (!resolvedDownloadUrl.value) return;
  void imagePreviewStore.openPreviewByDownloadUrl(resolvedDownloadUrl.value);
};

/** 全屏遮罩是否显示；与 videoDialogSrc 配合，仅渲染 video 本体（无 el-dialog 白底标题栏） */
const videoDialogVisible = ref(false);
/** 遮罩内 video 的 src，指向 /MIO/file/{fileId}/download */
const videoDialogSrc = ref("");
const videoOverlayRef = ref<HTMLElement | null>(null);

/**
 * 关闭视频全屏遮罩并清空 src。
 * 使用场景：点遮罩空白、关闭按钮或 Esc；v-if 卸载 video 节点以释放解码。
 */
const closeVideoPlayerOverlay = () => {
  videoDialogVisible.value = false;
  videoDialogSrc.value = "";
};

/**
 * 打开视频全屏遮罩。
 * 使用场景：用户点击缩略图后在暗色背景上居中展示原生 video（仅 controls，无外层卡片）。
 */
const handleOpenVideo = () => {
  if (!resolvedDownloadUrl.value) return;
  videoDialogSrc.value = resolvedDownloadUrl.value;
  videoDialogVisible.value = true;
  void nextTick(() => {
    videoOverlayRef.value?.focus();
  });
};

/**
 * 下载普通附件。
 * 作用场景：file 类型消息点击卡片后在新窗口打开下载链接。
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

.message-bubble.message-bubble--flash .message-image-thumb,
.message-bubble.message-bubble--flash .message-video-thumb-wrap {
  position: relative;
  z-index: 2;
}

/* 保持全局里的 position:absolute 布局，仅抬高层级盖住蒙层 */
.message-bubble.message-bubble--flash .message-time {
  z-index: 2;
}
</style>
