// main.ts - 修正版本
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import rippleDirective from '@/directives/ripple/index'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import '@/directives/ripple/style.css'
import './assets/styles/toast.css'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'

// 创建Vue应用实例
const app = createApp(App)

// 使用Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 使用路由
app.use(router)
app.directive('ripple', rippleDirective)

// 使用Element Plus UI库
app.use(ElementPlus)

// ✅ 关键：初始化主题
const themeStore = useThemeStore()
themeStore.initTheme()

// ✅ 优化的动态加载夜间样式函数
const loadNightStyles = () => {
  // 夜间样式文件列表（包括toast和ripple）
  const nightStyles = [
    'base-night.css',
    'homeview-night.css',
    'profile-edit-night.css',
    'more-options-night.css',
    'change-password-night.css',
    'loginview-night.css',
    'loginform-night.css',
    'toast-night.css',      
    'ripple-night.css',    
    'chat-container-night.css',
    'conversation-list-night.css',
    'message-item-night.css',
    'conversation-item-night.css',
    'friend-detail-night.css',
    'friend-list-night.css',
    'friend-item-night.css',
    'friend-group-night.css'
  ]
  
  // TypeScript安全的方式检查href
  // 移除已存在的夜间样式
  document.querySelectorAll('link[data-theme="night"]').forEach(link => {
    const htmlLink = link as HTMLLinkElement
    // 直接移除所有夜间样式，然后重新加载
    htmlLink.remove()
  })
  
  // 如果是夜间模式，添加所有夜间样式
  if (themeStore.isDarkMode) {
    nightStyles.forEach(filename => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `/src/assets/styles/night/${filename}`
      link.setAttribute('data-theme', 'night')
      // 确保在日间样式之后加载
      document.head.appendChild(link)
    })
  } else {
    // 日间模式：确保日间样式正常加载
    // 可以在这里加载日间版本的toast和ripple（如果需要）
    const dayToastLink = document.createElement('link')
    dayToastLink.rel = 'stylesheet'
    dayToastLink.href = '/src/assets/styles/toast.css'
    document.head.appendChild(dayToastLink)
    
    const dayRippleLink = document.createElement('link')
    dayRippleLink.rel = 'stylesheet'
    dayRippleLink.href = '/src/assets/styles/directives/ripple/style.css'
    document.head.appendChild(dayRippleLink)
  }
}

// 初始加载 - 确保DOM加载完成后再加载样式
const initThemeStyles = () => {
  setTimeout(() => {
    loadNightStyles()
  }, 100)
}

// 监听主题变化
themeStore.$subscribe(() => {
  setTimeout(() => {
    loadNightStyles()
  }, 50)
})

// 在路由切换后重新检查主题样式
router.afterEach(() => {
  setTimeout(() => {
    loadNightStyles()
  }, 100)
})

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载应用
app.mount('#app')

// 初始加载主题样式
initThemeStyles()