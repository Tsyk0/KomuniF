// src/directives/ripple/types.ts

export interface RippleDirectiveBinding {
  // 涟漪颜色，默认 'rgba(0, 0, 0, 0.1)'
  color?: string
  
  // 动画持续时间（毫秒），默认 600
  duration?: number
  
  // 是否禁用涟漪效果，默认 false
  disabled?: boolean
}

// 指令参数的类型
export type RippleValue = RippleDirectiveBinding | undefined