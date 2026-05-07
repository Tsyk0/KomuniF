<!-- File: src/components/LoginForm.vue -->
<template>
  <!-- 在根元素上添加 loginform 类名 -->
  <div class="loginform login-form">
    <div class="form-container">
      <!-- 免密登录提示 -->
      <div v-if="showAutoLoginHint && !isLoggingIn" class="auto-login-hint">
        <div class="hint-content">
          <KeyRound class="hint-icon" :size="22" :stroke-width="2.2" />
          <div class="hint-text">
            <p class="hint-title">欢迎回来！</p>
            <p class="hint-desc">您上次选择了"记住我"</p>
          </div>
        </div>
        <div class="hint-actions">
          <button
            @click="handleAutoLogin"
            :disabled="isAutoLogging"
            class="auto-login-btn"
            v-ripple="{ color: 'rgba(255, 255, 255, 0.28)', duration: 600 }"
          >
            <span v-if="!isAutoLogging">免密登录</span>
            <span v-else>登录中...</span>
          </button>
          <button
            @click="showAutoLoginHint = false"
            class="normal-login-btn"
            v-ripple="{ color: 'rgba(255, 255, 255, 0.2)', duration: 600 }"
          >
            其他账号
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-box">
        <span class="error-icon">❌</span> {{ errorMessage }}
      </div>

      <div class="input-group">
        <label>用户ID</label>
        <input
          v-model="form.userId"
          type="text"
          placeholder="请输入您的用户ID（数字）"
          class="el-input"
          :class="{ error: hasError }"
          @keyup.enter="handleSubmit"
          @input="onUserIdChange"
        />
      </div>

      <div class="input-group">
        <label>密码</label>
        <div class="password-input-wrapper">
          <input
            v-model="form.userPwd"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            class="el-input"
            :class="{ error: hasError }"
            @keyup.enter="handleSubmit"
          />
        </div>
      </div>

      <div class="form-options">
        <label class="remember-me">
          <input v-model="form.rememberMe" type="checkbox" />
          记住我
        </label>

        <a href="#" class="forgot-password" @click.prevent="showForgotPassword">
          忘记密码？
        </a>
      </div>

      <div class="button-group">
        <button
          class="el-button el-button--primary"
          @click="handleSubmit"
          :disabled="loading || isAutoLogging"
        >
          {{ loading ? "正在登录..." : "登录" }}
        </button>
        <button class="el-button el-button--default" @click="showRegister">
          去注册
        </button>
      </div>
    </div>
  </div>
</template>

<!-- script 部分保持不变 -->
<script>
import { KeyRound } from "lucide-vue-next";
import { useUserStore } from "@/store/user/user";
import { useRouter } from "vue-router";
import {
  mapLoginErrorMessage,
  resolveRememberedAccountState,
  resolveUserIdChangeState,
  validateLoginForm,
} from "@/interactions/loginForm/LoginFormInteraction";

export default {
  name: "LoginForm",
  components: {
    KeyRound,
  },

  emits: ["show-register", "show-forgot"],

  data() {
    return {
      form: {
        userId: "",
        userPwd: "",
        rememberMe: false,
      },
      loading: false,
      isAutoLogging: false,
      errorMessage: "",
      hasError: false,
      showPassword: false,
      showAutoLoginHint: false,
      savedUserId: "",
      savedUserNickname: "",
    };
  },

  setup() {
    const authStore = useUserStore();
    const router = useRouter();
    return { authStore, router };
  },

  computed: {
    isLoggingIn() {
      return this.loading || this.isAutoLogging;
    },
  },

  mounted() {
    this.checkRememberedAccount();
  },

  methods: {
    // 检查是否有记住的账户
    checkRememberedAccount() {
      const state = resolveRememberedAccountState({
        hasRememberedAccount: this.authStore.hasRememberedAccount,
        rememberMeDataRaw: localStorage.getItem("rememberMeData"),
      });
      if (state.shouldClearCorruptedData) {
        localStorage.removeItem("rememberMeData");
      }
      this.savedUserId = state.savedUserId;
      this.form.userId = state.formUserId;
      this.form.rememberMe = state.rememberMe;
      this.showAutoLoginHint = state.showAutoLoginHint;
    },

    // 用户ID变化时隐藏免密登录提示
    onUserIdChange() {
      const state = resolveUserIdChangeState({
        currentUserId: this.form.userId,
        savedUserId: this.savedUserId,
        autoLoginAvailable: this.authStore.checkAutoLoginAvailable(this.form.userId),
        showAutoLoginHint: this.showAutoLoginHint,
      });
      this.form.rememberMe = state.rememberMe;
      this.showAutoLoginHint = state.showAutoLoginHint;
    },

    // 免密登录
    async handleAutoLogin() {
      this.isAutoLogging = true;
      this.errorMessage = "";
      this.hasError = false;

      try {
        const rememberMeData = localStorage.getItem("rememberMeData");
        const hasAccessToken = !!localStorage.getItem("access_token");
        console.group("🔍 [AutoLogin] 点击免密登录");
        console.log("rememberMeData:", rememberMeData);
        console.log("hasAccessToken:", hasAccessToken);
        console.log("currentRoute:", this.$route?.fullPath);
        console.groupEnd();

        console.log("🚀 开始免密登录...");
        const result = await this.authStore.autoLogin();

        if (result.success) {
          console.log("🎉 免密登录成功！");
          this.router.push("/home");
        } else {
          this.errorMessage = result.message;
          this.hasError = true;
          this.showAutoLoginHint = false;
          console.error("免密登录失败:", result.message, {
            rememberMeData: localStorage.getItem("rememberMeData"),
            hasAccessToken: !!localStorage.getItem("access_token"),
          });
        }
      } catch (error) {
        console.error("免密登录异常:", error);
        this.errorMessage = "免密登录失败: " + error.message;
        this.hasError = true;
        this.showAutoLoginHint = false;
      } finally {
        this.isAutoLogging = false;
      }
    },

    // 正常登录
    async handleSubmit() {
      // 重置错误状态
      this.errorMessage = "";
      this.hasError = false;

      const validationError = validateLoginForm({
        userId: this.form.userId,
        userPwd: this.form.userPwd,
      });
      if (validationError) {
        this.errorMessage = validationError;
        this.hasError = true;
        return;
      }

      this.loading = true;

      try {
        console.log("🔄 开始登录流程...");

        // 使用 Pinia store 调用后端API，传递 rememberMe 参数
        const result = await this.authStore.login(
          this.form.userId,
          this.form.userPwd,
          this.form.rememberMe // 传递记住我选项
        );

        if (result.success) {
          console.log("🎉 登录成功！", result.data);
          this.router.push("/home");
        } else {
          this.errorMessage = result.message;
          this.hasError = true;
          console.error("登录失败:", result.message);
        }
      } catch (error) {
        console.error("登录异常:", error);
        this.errorMessage = mapLoginErrorMessage(error, "发生未知错误: ");
        this.hasError = true;
      } finally {
        this.loading = false;
      }
    },

    showRegister() {
      this.$emit("show-register");
    },

    showForgotPassword() {
      this.$emit("show-forgot");
    },
  },
};
</script>

<style scoped>
@import "@/assets/styles/loginform.css";
</style>