<template>
  <div class="login-form">
    <h2>登录</h2>

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
            :type="passwordVisible ? 'text' : 'password'"
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
.login-form {
  width: 100%;
}

.auto-login-hint {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  color: white;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hint-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.hint-icon {
  font-size: 24px;
}

.hint-text {
  flex: 1;
}

.hint-title {
  font-weight: 600;
  margin: 0 0 4px 0;
  font-size: 16px;
}

.hint-desc {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.hint-actions {
  display: flex;
  gap: 10px;
}

.auto-login-btn {
  flex: 2;
  background: white;
  color: #667eea;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.auto-login-btn:hover:not(:disabled) {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.auto-login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.normal-login-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.normal-login-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.error-box {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: #c33;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 14px;
}

.input-group {
  margin-bottom: 20px;
  position: relative;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.el-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.el-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.el-input.error {
  border-color: #f56565;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 42px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  color: #666;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.forgot-password:hover {
  color: #5a67d8;
  text-decoration: underline;
}

.button-group {
  display: flex;
  gap: 12px;
}

.el-button {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.el-button--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.el-button--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.el-button--default {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e0e0e0;
}

.el-button--default:hover {
  background: #e9ecef;
  border-color: #d0d7de;
}

.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

.form-container {
  background: white;
  padding: 25px;
  border-radius: 12px;
}

.error-box {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  color: #c62828;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.error-icon {
  margin-right: 8px;
  font-size: 16px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.el-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.el-input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.el-input.error {
  border-color: #ff3b30;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.remember-me {
  display: flex;
  align-items: center;
  color: #2c3e50;
  font-size: 14px;
  cursor: pointer;
}

.remember-me input {
  margin-right: 8px;
}

.forgot-password {
  color: #007aff;
  text-decoration: none;
  font-size: 14px;
}

.forgot-password:hover {
  text-decoration: underline;
}

.button-group {
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
}

.el-button {
  flex: 1;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.el-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.el-button--primary {
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: white;
}

.el-button--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056cc, #004099);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.el-button--default {
  background: #f0f0f0;
  color: #2c3e50;
  border: 1px solid #e0e0e0;
}

.el-button--default:hover {
  background: #e5e5e5;
}
</style>