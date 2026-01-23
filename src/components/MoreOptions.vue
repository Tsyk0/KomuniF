<template>
  <!-- 在根元素上添加 more-options 类名 -->
  <div class="more-options more-options-container">
    <div class="more-options-header">
      <button class="back-btn" @click="handleBack" v-ripple>
        <span>←</span> 返回
      </button>
      <h2>{{ headerTitle }}</h2>
    </div>

    <div class="more-options-content">
      <!-- 主菜单 -->
      <div v-if="currentView === 'main'" class="options-list">
        <button class="option-btn" @click="showAccountSecurity" v-ripple>
          <span class="option-icon">🔒</span>
          <span class="option-text">账号与安全</span>
          <span class="option-arrow">→</span>
        </button>
        <button class="option-btn" @click="showPrivacySettings" v-ripple>
          <span class="option-icon">👁️</span>
          <span class="option-text">隐私设置</span>
          <span class="option-arrow">→</span>
        </button>
        <button class="option-btn" @click="showNotificationSettings" v-ripple>
          <span class="option-icon">🔔</span>
          <span class="option-text">通知设置</span>
          <span class="option-arrow">→</span>
        </button>
      </div>

      <!-- 账号安全子菜单 -->
      <div v-else-if="currentView === 'account'" class="options-list">
        <button class="option-btn" @click="showChangePassword" v-ripple>
          <span class="option-icon">🔑</span>
          <span class="option-text">修改密码</span>
          <span class="option-arrow">→</span>
        </button>
        <button class="option-btn" @click="showLoginDevices" v-ripple>
          <span class="option-icon">📱</span>
          <span class="option-text">登录设备管理</span>
          <span class="option-arrow">→</span>
        </button>
        <button class="option-btn" @click="showTwoFactorAuth" v-ripple>
          <span class="option-icon">🔐</span>
          <span class="option-text">双重验证</span>
          <span class="option-arrow">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<!-- script 部分保持不变 -->
<script>
import { ref, computed } from "vue";
import toast from "@/commons/utils/toast";
export default {
  name: "MoreOptions",
  props: {
    userId: {
      type: String,
      required: true,
    },
    userNickname: {
      type: String,
      required: true,
    },
  },
  emits: ["back", "showChangePassword"],
  setup(props, { emit }) {
    const currentView = ref("main");

    const headerTitle = computed(() => {
      switch (currentView.value) {
        case "main":
          return "更多选项";
        case "account":
          return "账号与安全";
        default:
          return "更多选项";
      }
    });

    const handleBack = () => {
      if (currentView.value === "main") {
        emit("back");
      } else {
        currentView.value = "main";
      }
    };

    const showAccountSecurity = () => {
      currentView.value = "account";
    };

    const showChangePassword = () => {
      emit("showChangePassword");
    };

    const showPrivacySettings = () => {
      toast.warning("隐私设置功能开发中...");
    };

    const showNotificationSettings = () => {
      toast.warning("通知设置功能开发中...");
    };

    const showLoginDevices = () => {
      toast.warning("登录设备管理功能开发中...");
    };

    const showTwoFactorAuth = () => {
      toast.warning("双重验证功能开发中...");
    };

    return {
      currentView,
      headerTitle,
      handleBack,
      showAccountSecurity,
      showChangePassword,
      showPrivacySettings,
      showNotificationSettings,
      showLoginDevices,
      showTwoFactorAuth,
    };
  },
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/more-options.css";
</style>