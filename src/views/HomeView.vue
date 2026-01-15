<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <div class="top-navbar">
      <div class="nav-left">
        <h1 class="app-title">Komuni</h1>
      </div>
      <div class="nav-center">
        <span class="current-user">{{ userNickname }}</span>
        <span class="status-indicator online">● 在线</span>
      </div>
      <div class="nav-right">
        <!-- 添加更多按钮 -->
        <button class="nav-btn" @click="showMoreOptions" v-ripple>
          <span class="nav-icon">⋮</span> 更多
        </button>
        <!-- 原有的退出按钮 -->
        <button class="nav-btn" @click="handleLogout" v-ripple>
          <span class="nav-icon">🚪</span> 退出
        </button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content-wrapper">
      <!-- 左侧会话列表区域 -->
      <div class="conversation-sidebar">
        <!-- 左侧会话列表区域 -->
        <div class="sidebar-header">
          <div class="user-profile" @click="enterEditMode">
            <!-- 修改这里：使用动态头像 -->
            <div class="avatar-placeholder">
              <!-- 如果有图片URL，显示图片 -->
              <img
                v-if="
                  currentUserAvatar &&
                  currentUserAvatar !== '' &&
                  !currentUserAvatar.startsWith('data:image/')
                "
                :src="currentUserAvatar"
                alt="头像"
                class="avatar-img-small"
                @error="handleAvatarError"
              />
              <!-- 否则显示文字 -->
              <span v-else>
                {{ userNickname.charAt(0) }}
              </span>
            </div>
            <div class="user-info">
              <div class="user-name">{{ userNickname }}</div>
              <div class="user-status online">在线</div>
            </div>
          </div>
        </div>

        <div class="conversation-list">
          <div class="section-title">会话列表</div>
          <div class="empty-conversation">
            <div class="empty-icon">💬</div>
            <p class="empty-text">暂无会话</p>
            <p class="empty-hint">开始新的对话或等待好友消息</p>
          </div>
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div class="chat-main-area">
        <!-- 用户资料编辑组件 -->
        <ProfileEdit
          v-if="isEditingProfile"
          :user-data="editForm"
          @back="exitEditMode"
          @update:user-data="handleUserDataUpdate"
          @success="handleEditSuccess"
        />

        <!-- 更多选项组件 -->
        <MoreOptions
          v-else-if="showMoreMenu"
          :user-id="userId"
          :user-nickname="userNickname"
          @back="backToMainMenu"
        />

        <!-- 聊天区域（当不在编辑模式时显示） -->
        <div v-else class="chat-area-label">
          <div class="chat-label-header">
            <span class="chat-label-icon">💭</span>
            <span class="chat-label-text">聊天区域</span>
          </div>
          <div class="chat-label-content">
            <p class="chat-label-description">选择一个对话以开始</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="bottom-info-bar">
      <p>
        用户ID: {{ userId }} | 最后登录: {{ lastLoginTime || "刚刚" }} | Komuni
        © 2026
      </p>
    </div>

    <!-- 成功提示 -->
    <div v-if="showSuccessMessage" class="success-toast">
      <div class="toast-content">
        <span class="toast-icon">✅</span>
        <span class="toast-text">{{ successMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useAuthStore } from "@/stores/auth";
import ProfileEdit from "@/components/ProfileEdit.vue";
import MoreOptions from "@/components/MoreOptions.vue";

export default {
  name: "HomeView",
  components: {
    ProfileEdit,
    MoreOptions,
  },
  data() {
    return {
      userId: "",
      userNickname: "用户",
      lastLoginTime: "",
      isEditingProfile: false,
      currentUserAvatar: "",
      editForm: {
        userId: "",
        userNickname: "",
        userAvatar: "",
        userGender: 0,
        userBirthday: "",
        userLocation: "",
        userSignature: "",
        userPhone: "",
        userEmail: "",
      },
      avatarLoadError: false,
      showMoreMenu: false,
      showSuccessMessage: false,
      successMessage: "",
    };
  },
  mounted() {
    this.loadUserData();
    console.log("HomeView mounted, 当前用户头像:", this.currentUserAvatar);
  },
  setup() {
    const userStore = useUserStore();
    const authStore = useAuthStore();
    const router = useRouter();
    return { userStore, authStore, router };
  },
  methods: {
    // 头像加载失败处理
    handleAvatarError() {
      console.log("头像加载失败，使用默认头像");
      this.avatarLoadError = true;
    },

    // 加载用户数据
    loadUserData() {
      const userStr = sessionStorage.getItem("user");
      console.log("loadUserData调用, sessionStorage:", userStr);

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.userId = user.userId || "";
          this.userNickname = user.userNickname || "用户";
          this.lastLoginTime = user.lastLoginTime || "";

          // 处理头像URL
          let avatarUrl = user.userAvatar || "";
          avatarUrl = this.processAvatarUrl(avatarUrl);
          this.currentUserAvatar = avatarUrl;

          // 初始化编辑表单
          this.editForm = {
            userId: user.userId || "",
            userNickname: user.userNickname || "",
            userAvatar: avatarUrl,
            userGender: user.userGender || 0,
            userBirthday: this.formatDateForInput(user.userBirthday),
            userLocation: user.userLocation || "",
            userSignature: user.userSignature || "",
            userPhone: user.userPhone || "",
            userEmail: user.userEmail || "",
          };

          console.log("用户数据加载完成");
        } catch (e) {
          console.error("解析用户信息失败:", e);
        }
      } else {
        console.log("sessionStorage中没有用户数据");
      }
    },

    // 处理头像URL
    processAvatarUrl(avatarUrl) {
      if (!avatarUrl || avatarUrl === "") {
        return "";
      }

      if (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:image/")) {
        return avatarUrl;
      }

      avatarUrl = avatarUrl.trim();

      if (!avatarUrl.startsWith("/")) {
        avatarUrl = "/" + avatarUrl;
      }

      return "http://localhost:8081" + avatarUrl;
    },

    formatDateForInput(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    },

    // 进入编辑模式
    enterEditMode() {
      this.isEditingProfile = true;
      this.showMoreMenu = false;
      console.log("进入编辑模式");
      this.loadUserData();
    },

    // 退出编辑模式
    exitEditMode() {
      this.isEditingProfile = false;
      console.log("退出编辑模式");
    },

    // 处理用户数据更新
    handleUserDataUpdate(updatedData) {
      // 同步更新编辑表单
      Object.assign(this.editForm, updatedData);

      // 更新主界面的显示
      this.userNickname = updatedData.userNickname;

      // 更新sessionStorage
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        Object.assign(user, updatedData);
        sessionStorage.setItem("user", JSON.stringify(user));

        // 更新头像显示
        const avatarUrl = this.processAvatarUrl(updatedData.userAvatar);
        this.currentUserAvatar = avatarUrl;
      }
    },

    // 处理编辑成功
    handleEditSuccess(message) {
      this.showSuccessToast(message);
    },

    // 显示更多选项
    showMoreOptions() {
      this.showMoreMenu = true;
      this.isEditingProfile = false;
    },

    // 返回主菜单
    backToMainMenu() {
      this.showMoreMenu = false;
    },

    showSuccessToast(message) {
      // 创建提示框
      const toast = document.createElement("div");
      toast.className = "simple-toast";
      toast.textContent = message;

      document.body.appendChild(toast);

      // 显示
      setTimeout(() => {
        toast.classList.add("show");
      }, 10);

      // 2秒后渐隐
      setTimeout(() => {
        toast.classList.remove("show");

        // 动画完成后移除
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, 2000);
    },

    // 登出方法
    handleLogout() {
      if (confirm("确定要退出登录吗？")) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        localStorage.removeItem("rememberMe");
        this.router.push("/");
      }
    },

    // 调试方法
    debugAvatar() {
      console.log("=== 调试信息 ===");
      console.log("1. currentUserAvatar:", this.currentUserAvatar);
      console.log("2. editForm.userAvatar:", this.editForm.userAvatar);
      console.log("3. sessionStorage:", sessionStorage.getItem("user"));

      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log("4. 数据库路径:", user.userAvatar);

        if (user.userAvatar && user.userAvatar.startsWith("/")) {
          const testUrl = "http://localhost:8081" + user.userAvatar;
          console.log("5. 测试URL:", testUrl);
          window.open(testUrl, "_blank");
        }
      }
    },
  },
};
</script>

<style scoped>
/* 引入基础样式和组件专用样式 */
@import "@/assets/styles/base.css";
@import "@/assets/styles/homeview.css";
@import "@/assets/styles/scrollbar.css";
</style>