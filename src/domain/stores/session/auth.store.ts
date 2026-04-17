// File: src/domain/stores/session/auth.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@/entity/user";

/**
 * 重构后的认证 Domain Store 骨架。
 * 具体实现将从 src/stores/auth.ts 分阶段迁移。
 * 文件编码：UTF-8。
 */
export const useAuthDomainStore = defineStore("domainAuth", () => {
  const user = ref<User | null>(null);
  const rememberMe = ref(false);
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const currentUserId = computed(() => user.value?.userId || null);

  async function login(_userId: string, _userPwd: string, _rememberMe = false) {
    throw new Error("TODO: migrate from src/stores/auth.ts -> login");
  }

  async function autoLogin() {
    throw new Error("TODO: migrate from src/stores/auth.ts -> autoLogin");
  }

  async function register() {
    throw new Error("TODO: migrate from registration flow");
  }

  function logout() {
    user.value = null;
    rememberMe.value = false;
  }

  function hydrateFromStorage() {
    throw new Error("TODO: migrate from src/stores/auth.ts -> initAuth");
  }

  return {
    user,
    rememberMe,
    loading,
    errorMessage,
    isAuthenticated,
    currentUserId,
    login,
    autoLogin,
    register,
    logout,
    hydrateFromStorage,
  };
});
