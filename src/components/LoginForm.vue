<template>
  <!-- 在根元素上添加 loginform 类名 -->
  <div class="loginform login-form">
    <div class="form-container">
      <!-- 免密登录提示 -->
      <div v-if="showAutoLoginHint && !isLoggingIn" class="auto-login-hint">
        <div class="hint-content">
          <span class="hint-icon">🔑</span>
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
          >
            <span v-if="!isAutoLogging">免密登录</span>
            <span v-else>登录中...</span>
          </button>
          <button @click="showAutoLoginHint = false" class="normal-login-btn">
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
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

export default {
  name: "LoginForm",

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
    const authStore = useAuthStore();
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
      if (this.authStore.hasRememberedAccount) {
        try {
          const savedDataStr = localStorage.getItem("rememberMeData");
          if (savedDataStr) {
            const rememberMeData = JSON.parse(savedDataStr);
            this.savedUserId = rememberMeData.userId;
            this.form.userId = rememberMeData.userId; // 自动填充用户ID
            this.form.rememberMe = true; // 自动勾选记住我

            // 显示免密登录提示
            this.showAutoLoginHint = true;
          }
        } catch (error) {
          console.error("检查记住账户失败:", error);
          localStorage.removeItem("rememberMeData");
        }
      }
    },

    // 用户ID变化时隐藏免密登录提示
    onUserIdChange() {
      if (this.form.userId !== this.savedUserId) {
        this.showAutoLoginHint = false;
        this.form.rememberMe = false;
      } else if (this.authStore.checkAutoLoginAvailable(this.form.userId)) {
        this.form.rememberMe = true;
        if (!this.showAutoLoginHint) {
          this.showAutoLoginHint = true;
        }
      }
    },

    // 免密登录
    async handleAutoLogin() {
      this.isAutoLogging = true;
      this.errorMessage = "";
      this.hasError = false;

      try {
        console.log("🚀 开始免密登录...");
        const result = await this.authStore.autoLogin();

        if (result.success) {
          console.log("🎉 免密登录成功！");
          this.router.push("/home");
        } else {
          this.errorMessage = result.message;
          this.hasError = true;
          this.showAutoLoginHint = false;
          console.error("免密登录失败:", result.message);
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

      // 简单验证
      if (!this.form.userId.trim()) {
        this.errorMessage = "请输入用户ID";
        this.hasError = true;
        return;
      }
      if (!this.form.userPwd) {
        this.errorMessage = "请输入密码";
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
        this.errorMessage = "发生未知错误: " + error.message;
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