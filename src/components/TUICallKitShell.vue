<template>
  <!-- TUICallKit 自带浮层与设备管理；依赖 IM 登录态，由 TUICallKitAPI.init 完成。 -->
  <TUICallKit v-if="ready" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { TUICallKit, TUICallKitAPI } from "@trtc/calls-uikit-vue";
import { useUserStore } from "@/store/user/user";
import { fetchTrtcUserSigApi } from "@/apis/tencent/trtc";
import toast from "@/commons/utils/toast";
import { waitForTUICallKitImReady } from "@/commons/utils/wait-for-tuikit-im-ready";
import { useTUICallKitSessionStore } from "@/store/trtc/tuikitSession";

const authStore = useUserStore();
const tuikitSession = useTUICallKitSessionStore();
const ready = ref(false);

/**
 * 拉取 UserSig 并登录 TUICallKit（内含腾讯 lite-chat / 呼叫引擎）。
 * 使用场景：Home 登录后自动初始化；退出登录时 destroyed。
 */
async function bootstrap(): Promise<void> {
  const u = authStore.user;
  if (!u?.userId) {
    ready.value = false;
    tuikitSession.setCallKitSessionReady(false);
    return;
  }
  tuikitSession.setCallKitSessionReady(false);
  try {
    // 1. 向后端申请当前用户的 UserSig（sdkAppId / userId / userSig）
    const { sdkAppId, userId, userSig } = await fetchTrtcUserSigApi();
    // 2. 初始化 TUICallKit（引擎 + 内部 IM login；Promise 结束不代表 TIM 已 isReady）
    await TUICallKitAPI.init({
      SDKAppID: sdkAppId,
      userID: userId,
      userSig,
    });
    // 3. 必须 await：waitFor… 内部是异步轮询 TIM.isReady()，无同步阻塞 API；若不 await 会先执行下面两行导致仍可过早拨打
    await waitForTUICallKitImReady();
    ready.value = true;
    tuikitSession.setCallKitSessionReady(true);
  } catch (e) {
    ready.value = false;
    tuikitSession.setCallKitSessionReady(false);
    const msg = e instanceof Error ? e.message : "TUICallKit 初始化失败";
    console.error("[TUICallKitShell]", e);
    toast.error(msg);
  }
}

/**
 * 退出登录或切换账号时释放通话 SDK。
 */
async function teardown(): Promise<void> {
  ready.value = false;
  tuikitSession.setCallKitSessionReady(false);
  try {
    await TUICallKitAPI.destroyed();
  } catch {
    /* ignore */
  }
}

watch(
  () => authStore.user?.userId,
  (id) => {
    if (id == null) void teardown();
    else void bootstrap();
  },
  { immediate: true }
);
</script>
