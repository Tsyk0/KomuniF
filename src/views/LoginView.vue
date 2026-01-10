<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <div class="logo">💬</div>
        <h1>Komuni</h1>
        <p class="tagline">安全、快速的即时通讯</p>
      </div>

      <div class="form-section">
        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'login' }]"
            @click="activeTab = 'login'"
          >
            登录
          </button>
          <button
            :class="['tab', { active: activeTab === 'register' }]"
            @click="activeTab = 'register'"
          >
            注册
          </button>
          <button
            :class="['tab', { active: activeTab === 'forgot' }]"
            @click="activeTab = 'forgot'"
          >
            忘记密码
          </button>
        </div>

        <div class="form-content">
          <LoginForm
            v-if="activeTab === 'login'"
            @login-success="handleLoginSuccess"
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
            <p>密码重置功能开发中</p>
            <button class="back-btn" @click="activeTab = 'login'">
              返回登录
            </button>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>© 2024 Komuni. 基于Spring Boot + Vue的即时通讯平台</p>
      </div>
    </div>
  </div>
</template>

<script>
import LoginForm from "@/components/LoginForm.vue";
import RegisterForm from "@/components/RegisterForm.vue";

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
    handleLoginSuccess(userData) {
      console.log("登录成功:", userData);
      alert(`欢迎回来，${userData.username}!`);
    },

    handleRegisterSuccess() {
      alert("注册成功！请登录");
      this.activeTab = "login";
    },
  },
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.logo-section {
  text-align: center;
  padding: 40px 30px 20px;
  background: linear-gradient(135deg, #007aff 0%, #0056cc 100%);
  color: white;
}

.logo {
  font-size: 48px;
  margin-bottom: 20px;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.tagline {
  opacity: 0.9;
  font-size: 14px;
  font-weight: 300;
}

.form-section {
  padding: 30px;
}

.tabs {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 1px solid #f0f0f0;
}

.tab {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.tab.active {
  color: #007aff;
  border-bottom-color: #007aff;
  font-weight: 500;
}

.form-content {
  min-height: 300px;
}

.forgot-password-placeholder {
  text-align: center;
  padding: 40px 20px;
}

.forgot-password-placeholder h3 {
  margin-bottom: 10px;
  color: #333;
}

.forgot-password-placeholder p {
  color: #666;
  margin-bottom: 30px;
}

.back-btn {
  padding: 10px 24px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.back-btn:hover {
  background: #0056cc;
}

.footer {
  padding: 20px 30px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.footer p {
  color: #666;
  font-size: 12px;
}
</style>