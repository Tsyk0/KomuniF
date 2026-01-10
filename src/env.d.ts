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
  // 可以在这里添加更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}