<!-- File: src/components/RegisterForm.vue -->
<template>
  <div class="register-form">
    <h2>创建新账户</h2>
    <p class="subtitle">加入 Komuni 即时通讯平台</p>

    <!-- 注册表单 -->
    <div class="form-container">
      <div class="input-group">
        <label>昵称</label>
        <input
          v-model="form.userNickname"
          type="text"
          placeholder="设置你的显示名称"
          class="el-input"
          :class="{ error: errors.userNickname }"
        />
        <div v-if="errors.userNickname" class="error-message">
          <span class="error-icon">⚠</span> {{ errors.userNickname }}
        </div>
        <div class="hint">这将是其他用户看到的名称</div>
      </div>

      <div class="input-group">
        <label>密码</label>
        <div class="input-with-hint">
          <input
            v-model="form.userPassword"
            type="password"
            placeholder="设置登录密码"
            class="el-input"
            :class="{ error: errors.userPassword }"
          />
          <div class="hint">至少6位字符</div>
        </div>
        <div v-if="errors.userPassword" class="error-message">
          <span class="error-icon">⚠</span> {{ errors.userPassword }}
        </div>
      </div>

      <div class="input-group">
        <label>确认密码</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="再次输入密码"
          class="el-input"
          :class="{ error: errors.confirmPassword }"
        />
        <div v-if="errors.confirmPassword" class="error-message">
          <span class="error-icon">⚠</span> {{ errors.confirmPassword }}
        </div>
      </div>

      <div class="terms">
        <label class="checkbox-label">
          <input type="checkbox" v-model="acceptedTerms" />
          <span
            >我已阅读并同意 <a href="#" class="terms-link">服务条款</a> 和
            <a href="#" class="terms-link">隐私政策</a></span
          >
        </label>
        <div v-if="errors.terms" class="error-message">
          <span class="error-icon">⚠</span> {{ errors.terms }}
        </div>
      </div>

      <div class="button-group">
        <button
          class="el-button el-button--primary"
          @click="handleSubmit"
          :disabled="loading || !acceptedTerms"
        >
          {{ loading ? "注册中..." : "创建账户" }}
        </button>
        <button class="el-button el-button--default" @click="showLogin">
          已有账户？登录
        </button>
      </div>

      <div class="important-notice">
        <p>⚠️ 重要提示：</p>
        <p>1. 注册成功后系统会分配一个用户ID</p>
        <p>2. 请务必记住您的用户ID，这是您登录的唯一凭证</p>
        <p>3. 昵称可以修改，但用户ID不可更改</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from "@/stores/auth";

export default {
  data() {
    return {
      form: {
        userNickname: "",
        userPassword: "",
        confirmPassword: "",
      },
      acceptedTerms: false,
      errors: {
        userNickname: "",
        userPassword: "",
        confirmPassword: "",
        terms: "",
      },
      loading: false,
    };
  },

  // 添加 setup 函数初始化 store
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },

  methods: {
    validateForm() {
      let isValid = true;

      // 清空错误
      this.errors = {
        userNickname: "",
        userPassword: "",
        confirmPassword: "",
        terms: "",
      };

      // 验证昵称
      if (!this.form.userNickname.trim()) {
        this.errors.userNickname = "昵称不能为空";
        isValid = false;
      } else if (this.form.userNickname.length < 2) {
        this.errors.userNickname = "昵称至少2个字符";
        isValid = false;
      }

      // 验证密码
      if (!this.form.userPassword) {
        this.errors.userPassword = "密码不能为空";
        isValid = false;
      } else if (this.form.userPassword.length < 6) {
        this.errors.userPassword = "密码至少6个字符";
        isValid = false;
      }

      // 验证确认密码
      if (this.form.userPassword !== this.form.confirmPassword) {
        this.errors.confirmPassword = "两次输入的密码不一致";
        isValid = false;
      }

      // 验证条款
      if (!this.acceptedTerms) {
        this.errors.terms = "请同意服务条款和隐私政策";
        isValid = false;
      }

      return isValid;
    },

    async handleSubmit() {
      if (!this.validateForm()) {
        return;
      }

      this.loading = true;

      try {
        console.log("🔄 开始注册流程...");

        // 调用 auth store 的注册方法
        const result = await this.authStore.register({
          userNickname: this.form.userNickname,
          userPassword: this.form.userPassword,
          // 目前只传必填字段，可选字段暂时不传
        });

        if (result.success) {
          console.log("🎉 注册成功！用户ID:", result.userId);

          // 显示成功消息
          alert(
            `注册成功！\n\n您的用户ID是：${result.userId}\n\n请务必记住这个ID，这是您登录的唯一凭证`
          );

          // 注册成功后，自动切换到登录页
          this.$emit("register-success", {
            userNickname: this.form.userNickname,
            userId: result.userId,
          });

          // 清空表单
          this.form = {
            userNickname: "",
            userPassword: "",
            confirmPassword: "",
          };
          this.acceptedTerms = false;
        } else {
          // 显示错误消息
          alert("注册失败: " + result.message);
          this.errors.terms = result.message;
        }
      } catch (error) {
        console.error("注册异常:", error);
        alert("注册异常，请稍后重试");
        this.errors.terms = "注册异常: " + (error.message || "未知错误");
      } finally {
        this.loading = false;
      }
    },

    showLogin() {
      this.$emit("show-login");
    },
  },
};
</script>

<style scoped>
/* 引入外部CSS文件 */
@import "@/assets/styles/register.css";
</style>