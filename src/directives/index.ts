// src/directives/index.ts

import type { App } from 'vue'
import rippleDirective from './ripple/index'

// 导出所有指令（按需导入时使用）
export { default as ripple } from './ripple/index'

// 安装所有指令的插件函数
export function installDirectives(app: App) {
  // 注册涟漪指令
  app.directive('ripple', rippleDirective)
  
  // 未来可以在这里添加更多指令
  // app.directive('click-outside', clickOutsideDirective)
  // app.directive('permission', permissionDirective)
}

// 默认导出插件
export default {
  install: installDirectives
}