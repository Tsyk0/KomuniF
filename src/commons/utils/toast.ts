// File: src/commons/utils/toast.ts
// Toast服务 - 添加防止滚动功能
class Toast {
  private container: HTMLElement | null = null;
  private hideTimer: number | null = null;
  private originalBodyOverflow = '';

  // 显示Toast
  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 2000) {
    console.log(`🚀 [Toast] 显示消息: "${message}", 类型: ${type}`);
    
    // 移除旧的Toast
    this.hide();
    
    // 防止body滚动
    this.disableBodyScroll();
    
    try {
      // 创建Toast元素
      const toast = document.createElement('div');
      toast.className = 'toast-message';
      
      // 根据类型设置样式
      const typeClass = `toast-${type}`;
      toast.classList.add(typeClass);
      
      // 设置内容
      const iconMap = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
      };
      
      toast.innerHTML = `
        <span class="toast-icon">${iconMap[type] || iconMap.success}</span>
        <span class="toast-text">${message}</span>
      `;
      
      // 添加到页面
      document.body.appendChild(toast);
      this.container = toast;
      
      console.log('✅ [Toast] 元素已创建');
      
      // 显示动画
      setTimeout(() => {
        console.log('🎬 [Toast] 添加show类');
        toast.classList.add('show');
      }, 10);
      
      // 自动关闭
      if (duration > 0) {
        console.log(`⏰ [Toast] 设置${duration}ms后自动关闭`);
        this.hideTimer = window.setTimeout(() => {
          this.hide();
        }, duration);
      }
    } catch (error) {
      console.error('❌ [Toast] 显示失败:', error);
      this.enableBodyScroll(); // 出错时恢复滚动
    }
  }

  // 禁用body滚动
  private disableBodyScroll() {
    this.originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('toast-active');
  }

  // 启用body滚动
  private enableBodyScroll() {
    document.body.style.overflow = this.originalBodyOverflow;
    document.body.classList.remove('toast-active');
  }

  // 快捷方法
  success(message: string, duration = 2000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 3000) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 2500) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 2000) {
    this.show(message, 'info', duration);
  }

  // 隐藏Toast
  hide() {
    console.log('👋 [Toast] 隐藏Toast');
    
    // 清除定时器
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    
    if (this.container) {
      this.container.classList.remove('show');
      
      // 等待动画完成后再移除元素
      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          console.log('🗑️ [Toast] 从DOM移除元素');
          this.container.remove();
        }
        this.container = null;
        
        // 恢复body滚动
        this.enableBodyScroll();
      }, 300);
    } else {
      // 如果没有container也恢复滚动（安全措施）
      this.enableBodyScroll();
    }
  }
}

// 创建全局实例
const toast = new Toast();

export default toast;