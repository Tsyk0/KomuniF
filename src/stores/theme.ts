// stores/theme.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(false)
  
  // ✅ 关键方法：应用主题到HTML元素
  const applyTheme = (isDark: boolean): void => {
    const html = document.documentElement
    if (isDark) {
      html.classList.add('night-mode')
      html.classList.remove('day-mode')
    } else {
      html.classList.add('day-mode')
      html.classList.remove('night-mode')
    }
  }
  
  // ✅ 初始化主题（从localStorage读取）
  const initTheme = (): void => {
    const savedTheme = localStorage.getItem('komuni-theme')
    isDarkMode.value = savedTheme === 'dark'
    applyTheme(isDarkMode.value) // 应用初始主题
  }
  
  // ✅ 切换主题
  const toggleTheme = (): void => {
    isDarkMode.value = !isDarkMode.value
    applyTheme(isDarkMode.value) // 应用新主题
    localStorage.setItem('komuni-theme', isDarkMode.value ? 'dark' : 'light')
  }
  
  // ✅ 设置特定主题
  const setTheme = (dark: boolean): void => {
    isDarkMode.value = dark
    applyTheme(dark)
    localStorage.setItem('komuni-theme', dark ? 'dark' : 'light')
  }
  
  return {
    isDarkMode,
    initTheme,
    toggleTheme,
    setTheme,
    applyTheme
  }
})