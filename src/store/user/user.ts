// src/store/user/user.ts
import { defineStore } from "pinia";
import { loginApi, checkTokenApi, registerApi } from "@/apis/auth";
import { updateUserApi, getUserByIdApi, updateUserPasswordApi } from "@/apis/user";
import type { User } from "@/entity/user";
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  CheckTokenResponse,
  RememberMeData,
} from "@/types/dto/auth";
import type { UpdateUserRequest } from "@/types/dto/user";

/**
 * 统一用户会话 Store：
 * - user 信息
 * - accessToken（localStorage）
 * - rememberMe 偏好
 * - refreshToken 由后端 HttpOnly Cookie 托管，不入 Pinia
 */
export const useUserStore = defineStore("user", {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem("user") || "null") as User | null,
    rememberMe: false as boolean,
    isLoading: false,
    errorMessage: null as string | null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user,
    currentUser: (state): User | null => state.user,
    hasRememberedAccount: (): boolean => !!localStorage.getItem("rememberMeData"),
  },

  actions: {
    /** 登录：保存 accessToken 到 localStorage，user 到 sessionStorage。 */
    async login(userId: string, userPwd: string, rememberMe = false) {
      try {
        this.forceClearAuth();
        const req: LoginRequest = { userId, userPwd, rememberMe };
        const response = (await loginApi(req)) as LoginResponse;
        if (response.code !== 200) {
          return { success: false, message: response.message };
        }

        const accessToken = response.data.token;
        if (accessToken) localStorage.setItem("access_token", accessToken);

        this.user = response.data.user;
        this.rememberMe = rememberMe;
        sessionStorage.setItem("user", JSON.stringify(response.data.user));

        // 可选保活：依赖 refreshToken cookie
        try {
          await checkTokenApi();
        } catch {
          // ignore
        }

        if (rememberMe) {
          const rememberData: RememberMeData = { userId };
          localStorage.setItem("rememberMeData", JSON.stringify(rememberData));
        } else {
          localStorage.removeItem("rememberMeData");
        }

        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          (error?.request ? "无法连接到服务器" : error?.message) ||
          "登录失败";
        return { success: false, message };
      }
    },

    /** 注册。 */
    async register(data: RegisterRequest) {
      try {
        const response = await registerApi(data);
        if (response.code === 200 && response.data != null) {
          return { success: true, userId: response.data };
        }
        return { success: false, message: response.message || "注册失败" };
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          (error?.request ? "无法连接到服务器" : error?.message) ||
          "注册失败";
        return { success: false, message };
      }
    },

    /** 免密登录：依赖 rememberMeData + refreshToken cookie。 */
    async autoLogin() {
      try {
        const savedDataStr = localStorage.getItem("rememberMeData");
        if (!savedDataStr) return { success: false, message: "未找到记住的账户" };

        const response: CheckTokenResponse = await checkTokenApi();
        if (response.code === 200 && response.data.valid && response.data.user) {
          if (response.data.token) {
            localStorage.setItem("access_token", response.data.token);
          }
          this.user = response.data.user;
          this.rememberMe = true;
          sessionStorage.setItem("user", JSON.stringify(response.data.user));
          return { success: true, data: { user: response.data.user, fromAutoLogin: true } };
        }
        return { success: false, message: response.message || "登录验证失败" };
      } catch (error: any) {
        if (error?.response?.status === 401) localStorage.removeItem("rememberMeData");
        const message =
          error?.response?.data?.message ||
          (error?.request ? "无法连接到服务器" : error?.message) ||
          "免密登录失败";
        return { success: false, message };
      }
    },

    /** 检查某账户是否可免密登录。 */
    checkAutoLoginAvailable(currentUserId?: string): boolean {
      const savedDataStr = localStorage.getItem("rememberMeData");
      if (!savedDataStr) return false;
      try {
        const rememberMeData: RememberMeData = JSON.parse(savedDataStr);
        if (currentUserId && currentUserId !== rememberMeData.userId) return false;
        return true;
      } catch {
        localStorage.removeItem("rememberMeData");
        return false;
      }
    },

    /** 清除 rememberMe 标记。 */
    clearRememberedAccount(): void {
      localStorage.removeItem("rememberMeData");
      this.rememberMe = false;
    },

    /** 只清用户会话存储（不动 refreshToken cookie）。 */
    clearStorage(): void {
      sessionStorage.removeItem("user");
      localStorage.removeItem("access_token");
      this.user = null;
      this.rememberMe = false;
    },

    /** 强制清理认证态。 */
    forceClearAuth(): void {
      this.clearStorage();
      this.clearRememberedAccount();
    },

    /** 登出。 */
    logout(): void {
      this.clearStorage();
    },

    /** 初始化本地会话状态。 */
    initAuth(): void {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) {
        try {
          this.user = JSON.parse(sessionUser);
          this.rememberMe = false;
          return;
        } catch {
          this.clearStorage();
        }
      }
    },

    /** 校验/续签 accessToken（refreshToken 走 cookie）。 */
    async ensureAccessTokenValid(): Promise<boolean> {
      const currentToken = localStorage.getItem("access_token");
      try {
        const response: CheckTokenResponse = await checkTokenApi();
        if (response.code !== 200 || !response.data) return false;
        const { valid, refreshed, token, user } = response.data;
        if (!valid) {
          this.clearStorage();
          this.clearRememberedAccount();
          return false;
        }
        if (token && (refreshed || token !== currentToken)) {
          localStorage.setItem("access_token", token);
        }
        if (user) {
          this.user = user;
          sessionStorage.setItem("user", JSON.stringify(user));
        }
        return true;
      } catch (error: any) {
        if (error?.response?.status === 401) this.clearRememberedAccount();
        return false;
      }
    },

    /** 更新用户资料。 */
    async updateUser(userData: UpdateUserRequest) {
      try {
        this.isLoading = true;
        this.errorMessage = null;
        const response = await updateUserApi(userData);
        if (response.code === 200) {
          return { success: true, message: response.data || "更新成功" };
        }
        this.errorMessage = response.message;
        return { success: false, message: response.message || "更新失败" };
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          (error?.request ? "无法连接到服务器" : "更新失败");
        this.errorMessage = message;
        return { success: false, message };
      } finally {
        this.isLoading = false;
      }
    },

    /** 根据 userId 拉取用户详情。 */
    async fetchUserById(userId: number) {
      try {
        this.isLoading = true;
        this.errorMessage = null;
        const response = await getUserByIdApi(userId);
        if (response.code === 200) return { success: true, data: response.data };
        this.errorMessage = response.message;
        return { success: false, message: response.message || "获取用户信息失败" };
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          (error?.request ? "无法连接到服务器" : "获取用户信息失败");
        this.errorMessage = message;
        return { success: false, message };
      } finally {
        this.isLoading = false;
      }
    },

    /** 更新密码。 */
    async updateUserPassword(oldPwd: string, newPwd: string) {
      try {
        this.isLoading = true;
        this.errorMessage = null;
        const response = await updateUserPasswordApi(oldPwd, newPwd);
        if (response.code === 200) {
          return { success: true, message: response.message || "密码更新成功" };
        }
        this.errorMessage = response.message;
        return { success: false, message: response.message || "密码更新失败" };
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          (error?.request ? "无法连接到服务器" : "密码更新失败");
        this.errorMessage = message;
        return { success: false, message };
      } finally {
        this.isLoading = false;
      }
    },
  },
});
