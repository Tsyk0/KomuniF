<template>
  <div class="login-form">
    <h2>登录</h2>

    <div class="form-container">
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
        />
      </div>

      <div class="input-group">
        <label>密码</label>
        <input
          v-model="form.userPwd"
          type="password"
          placeholder="请输入密码"
          class="el-input"
          :class="{ error: hasError }"
          @keyup.enter="handleSubmit"
        />
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
          :disabled="loading"
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
// 删除 simple-auth 导入，改用正式的 auth store
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

export default {
  data() {
    return {
      form: {
        userId: "",
        userPwd: "",
        rememberMe: false,
      },
      loading: false,
      errorMessage: "",
      hasError: false,
    };
  },

  // 添加 setup 函数来初始化 Pinia store
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    return { authStore, router };
  },

  methods: {
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

        // 使用 Pinia store 调用后端API
        const result = await this.authStore.login(
          this.form.userId,
          this.form.userPwd
        );

        if (result.success) {
          console.log("🎉 登录成功！", result.data);

          // 注意：store 内部已经保存到 sessionStorage，这里不需要再保存
          // 跳转到主页
          this.router.push("/home");
        } else {
          // 显示错误消息
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