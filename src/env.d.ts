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
  readonly VITE_APP_TITLE: string
  readonly VITE_API_TIMEOUT?: string
  // 可以在这里添加更多环境变量...
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