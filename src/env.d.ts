// File: src/env.d.ts
// src/env.d.ts
/// <reference types="vite/client" />

// 声明 .vue 文件的类型
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 声明 Vite 环境变量类型
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL?: string
  readonly VITE_APP_TITLE: string
  readonly VITE_API_TIMEOUT?: string
  /** 控制台 TRTC 应用的 SDKAppID，可暴露给前端；UserSig 必须由后端签发 */
  readonly VITE_TRTC_SDK_APP_ID?: string
  /** 申请 UserSig 的 HTTP 路径（相对 VITE_API_BASE_URL），默认 `/trtc/user-sig` */
  readonly VITE_API_TRTC_USER_SIG_PATH?: string
  /** 语音转文字上传接口路径，默认 `/api/tencent/asr/transcribe` */
  readonly VITE_API_ASR_TRANSCRIBE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 可选：为 Vue 3 的 defineProps、defineEmits 等提供全局类型支持
declare global {
  const defineProps: <T>() => T
  const defineEmits: <T>() => T
  const defineExpose: (exposed?: Record<string, any>) => void
  const withDefaults: <T, U extends Record<string, any>>(
    props: T,
    defaults: U
  ) => T & { [K in keyof U]: K extends keyof T ? T[K] : never }
}