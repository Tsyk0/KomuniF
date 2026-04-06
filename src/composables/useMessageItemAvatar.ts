import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import type { DisplayMessage } from "@/entity/message";
import { useAuthStore } from "@/stores/auth";
import { useSingleChatPeerAvatarStore } from "@/stores/chat/single-chat-peer-avatar";
import { normalizeAvatarUrl } from "@/utils/avatar-url";

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
  const imgOk = ref(true);

  const rawAvatarSource = computed(() => {
    const msg = getMessage();
    const ct = getConvType();
    const isSingle = Number(ct) === 1;

    if (isSingle) {
      if (msg.isSentByMe) {
        return authStore.user?.userAvatar ?? null;
      }
      const cid = Math.floor(Number(msg.convId));
      if (!Number.isFinite(cid) || cid <= 0) return "";
      return avatarByConvId.value[cid] ?? "";
    }

    if (msg.isSentByMe) {
      return authStore.user?.userAvatar ?? null;
    }
    return msg.senderAvatar ?? null;
  });

  watch(rawAvatarSource, () => {
    imgOk.value = true;
  });

  const avatarDisplayUrl = computed(() => {
    if (!imgOk.value) return "";
    return normalizeAvatarUrl(rawAvatarSource.value);
  });

  const onAvatarError = () => {
    imgOk.value = false;
  };

  return { avatarDisplayUrl, onAvatarError };
}
