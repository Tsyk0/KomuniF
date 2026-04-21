// src/store/theme/theme.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useThemeStore = defineStore("theme", () => {
  /** 当前是否夜间模式。 */
  const isDarkMode = ref(false);

  /** 将主题 class 应用到根节点。 */
  const applyTheme = (isDark: boolean): void => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("night-mode");
      html.classList.remove("day-mode");
    } else {
      html.classList.add("day-mode");
      html.classList.remove("night-mode");
    }
  };

  /** 初始化主题：读取本地缓存并立即应用。 */
  const initTheme = (): void => {
    const savedTheme = localStorage.getItem("komuni-theme");
    isDarkMode.value = savedTheme === "dark";
    applyTheme(isDarkMode.value);
  };

  /** 切换亮/暗主题并持久化。 */
  const toggleTheme = (): void => {
    isDarkMode.value = !isDarkMode.value;
    applyTheme(isDarkMode.value);
    localStorage.setItem("komuni-theme", isDarkMode.value ? "dark" : "light");
  };

  /** 显式设置主题并持久化。 */
  const setTheme = (dark: boolean): void => {
    isDarkMode.value = dark;
    applyTheme(dark);
    localStorage.setItem("komuni-theme", dark ? "dark" : "light");
  };

  return {
    isDarkMode,
    initTheme,
    toggleTheme,
    setTheme,
    applyTheme,
  };
});
