// File: src/capabilities/show-display-avatar/useMessageItemAvatar.ts
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import type { DisplayMessage } from "@/entity/message";
import { useAuthStore } from "@/stores/auth";
import { useSingleChatPeerAvatarStore } from "@/stores/conv/single-chat-peer-avatar";
import { normalizeAvatarUrl } from "@/commons/utils/avatar-url";
import { resolveMessageRowAvatarRawSource } from "./resolvers";

/**
 * 消息条头像：单聊时对方消息用 peer-profiles 缓存，自己用登录用户头像；群聊用消息里的 senderAvatar。
 */
export function useMessageItemAvatar(
  getMessage: () => DisplayMessage,
  getConvType: () => number | null | undefined
) {
  const authStore = useAuthStore();
  const peerStore = useSingleChatPeerAvatarStore();
  const { avatarByConvId } = storeToRefs(peerStore);
  const isAvatarLoadSuccessful = ref(true);

  // 第一步：解析“头像来源值”（可能是缓存 URL，也可能是原始头像字段）
  const rawAvatarSource = computed(() =>
    resolveMessageRowAvatarRawSource({
      convType: getConvType(),
      message: getMessage(),
      avatarByConvId: avatarByConvId.value,
      currentUserAvatar: authStore.user?.userAvatar,
    })
  );

  // 第二步：头像来源变化时，重置 <img> 错误状态，允许重新尝试加载
  watch(rawAvatarSource, () => {
    isAvatarLoadSuccessful.value = true;
  });

  // 第三步：输出最终给模板使用的 URL（若图片加载失败则返回空串，交给 UI 占位）
  const avatarDisplayUrl = computed(() => {
    if (!isAvatarLoadSuccessful.value) return "";
    return normalizeAvatarUrl(rawAvatarSource.value);
  });

  // 由模板的 @error 事件触发，避免破图反复闪烁
  const onAvatarError = () => {
    isAvatarLoadSuccessful.value = false;
  };

  return { avatarDisplayUrl, onAvatarError };
}
