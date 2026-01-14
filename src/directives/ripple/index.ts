// src/directives/ripple/index.ts

import type { DirectiveBinding, ObjectDirective } from 'vue'

// 指令配置类型
export interface RippleOptions {
  color?: string
  duration?: number
  disabled?: boolean
}

// 涟漪元素的类名（用于样式和查找）
const RIPPLE_CLASS = 'vue-ripple-effect'

// 判断元素是否被禁用
function isElementDisabled(element: HTMLElement): boolean {
  // 检查元素本身的 disabled 属性（如果是可禁用元素）
  if ('disabled' in element && element.disabled) {
    return true
  }
  
  // 检查 aria-disabled 属性
  if (element.getAttribute('aria-disabled') === 'true') {
    return true
  }
  
  // 检查是否有禁用类名
  if (element.classList.contains('disabled')) {
    return true
  }
  
  return false
}

// 创建涟漪效果的函数
function createRipple(element: HTMLElement, event: MouseEvent, options: RippleOptions) {
  // 如果禁用则返回
  if (options.disabled || isElementDisabled(element)) return
  
  // 移除旧的涟漪元素
  const oldRipples = element.querySelectorAll(`.${RIPPLE_CLASS}`)
  oldRipples.forEach(ripple => {
    if (ripple.parentNode === element) {
      element.removeChild(ripple)
    }
  })
  
  // 计算涟漪位置和大小
  const rect = element.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  
  // 创建涟漪元素
  const ripple = document.createElement('span')
  ripple.className = RIPPLE_CLASS
  
  // 设置样式
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background-color: ${options.color || 'rgba(0, 0, 0, 0.1)'};
    transform: scale(0);
    pointer-events: none;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    animation: ripple-animation ${options.duration || 600}ms linear;
  `
  
  // 添加到按钮中
  element.appendChild(ripple)
  
  // 动画结束后移除元素
  setTimeout(() => {
    if (ripple.parentNode === element) {
      element.removeChild(ripple)
    }
  }, options.duration || 600)
}

// Vue 指令定义
const rippleDirective: ObjectDirective<HTMLElement, RippleOptions | undefined> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<RippleOptions | undefined>) {
    // 如果元素已被禁用，则不应用指令
    if (isElementDisabled(el)) return
    
    // 获取配置
    const options: RippleOptions = {
      color: binding.value?.color,
      duration: binding.value?.duration,
      disabled: binding.value?.disabled,
    }
    
    // 保存配置在元素上（用于更新时使用）
    el._rippleOptions = options
    
    // 应用必要的基础样式
    const originalPosition = el.style.position
    const originalOverflow = el.style.overflow
    
    el.style.position = 'relative'
    el.style.overflow = 'hidden'
    
    // 保存原始样式以便清理
    el._originalRippleStyle = { position: originalPosition, overflow: originalOverflow }
    
    // 添加点击事件监听
    el.addEventListener('click', handleRipple)
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding<RippleOptions | undefined>) {
    // 更新配置
    el._rippleOptions = {
      color: binding.value?.color,
      duration: binding.value?.duration,
      disabled: binding.value?.disabled,
    }
  },
  
  beforeUnmount(el: HTMLElement) {
    // 清理事件监听
    el.removeEventListener('click', handleRipple)
    
    // 恢复原始样式
    if (el._originalRippleStyle) {
      el.style.position = el._originalRippleStyle.position
      el.style.overflow = el._originalRippleStyle.overflow
    }
    
    // 清理内存
    delete el._rippleOptions
    delete el._originalRippleStyle
    
    // 移除所有涟漪元素
    const ripples = el.querySelectorAll(`.${RIPPLE_CLASS}`)
    ripples.forEach(ripple => {
      if (ripple.parentNode === el) {
        el.removeChild(ripple)
      }
    })
  }
}

// 事件处理函数
function handleRipple(this: HTMLElement, event: MouseEvent) {
  const options = this._rippleOptions || {}
  createRipple(this, event, options)
}

// 扩展 HTMLElement 类型
declare global {
  interface HTMLElement {
    _rippleOptions?: RippleOptions
    _originalRippleStyle?: {
      position: string
      overflow: string
    }
  }
}

export default rippleDirective