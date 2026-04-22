<!-- File: src/views/LoginView.vue -->
<template>
  <!-- 确保选择器匹配：.loginview.login-container -->
  <div class="loginview login-container">
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo">💬</div>
        <h1>Komuni</h1>
      </div>

      <!-- 表单区域 -->
      <div class="form-section">
        <!-- 标签页 -->
        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'login' }]"
            @click="activeTab = 'login'"
            v-ripple
          >
            登录
          </button>
          <button
            :class="['tab', { active: activeTab === 'register' }]"
            @click="activeTab = 'register'"
            v-ripple
          >
            注册
          </button>
          <button
            :class="['tab', { active: activeTab === 'forgot' }]"
            @click="activeTab = 'forgot'"
            v-ripple
          >
            忘记密码
          </button>
        </div>

        <!-- 表单内容区域（可滚动） -->
        <div class="form-content">
          <LoginForm
            v-if="activeTab === 'login'"
            @show-register="activeTab = 'register'"
            @show-forgot="activeTab = 'forgot'"
          />

          <RegisterForm
            v-else-if="activeTab === 'register'"
            @register-success="handleRegisterSuccess"
            @show-login="activeTab = 'login'"
          />

          <div v-else class="forgot-password-placeholder">
            <h3>忘记密码</h3>
            <p>密码重置功能开发中，敬请期待</p>
            <button class="back-btn" @click="activeTab = 'login'" v-ripple>
              返回登录
            </button>
          </div>
        </div>
      </div>

      <!-- 页脚 -->
      <div class="footer">
        <p>© 2026 Komuni.</p>
      </div>
    </div>
  </div>
</template>

<script>
import LoginForm from "@/components/LoginForm.vue";
import RegisterForm from "@/components/RegisterForm.vue";
import {
  buildRegisterSuccessNotice,
  resolveLoginViewTab,
} from "@/interactions/loginView/LoginViewInteraction";
import "@/assets/styles/loginview.css"; // 导入外部CSS文件

export default {
  components: {
    LoginForm,
    RegisterForm,
  },

  data() {
    return {
      activeTab: "login",
    };
  },

  methods: {
    handleRegisterSuccess() {
      alert(buildRegisterSuccessNotice());
      this.activeTab = resolveLoginViewTab("login");
    },
  },
};
</script>

<style scoped>
@import "@/assets/styles/loginview.css";
</style>