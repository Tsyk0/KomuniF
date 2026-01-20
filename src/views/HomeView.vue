<template>
  <!-- 在根元素上添加 homeview 类名 -->
  <div class="homeview home-container">
    <!-- 主内容区域 -->
    <div class="main-content-wrapper">
      <!-- 左侧竖向导航栏 -->
      <div class="vertical-side-nav">
        <!-- 功能按钮区域 -->
        <div class="nav-menu">
          <button class="nav-menu-item" @click="goToChat" v-ripple title="聊天">
            <span class="menu-icon">💬</span>
          </button>
          <button
            class="nav-menu-item"
            @click="startNewChat"
            v-ripple
            title="新聊天"
          >
            <span class="menu-icon">➕</span>
          </button>
        </div>

        <!-- 设置按钮区域（底部） -->
        <div class="nav-bottom-menu">
          <!-- 修改这里：使用 themeStore -->
          <button
            class="nav-menu-item"
            @click="toggleTheme"
            v-ripple
            :title="themeTitle"
          >
            <span class="menu-icon">{{ themeIcon }}</span>
          </button>
          <button
            class="nav-menu-item"
            @click="showMoreOptions"
            v-ripple
            title="更多设置"
          >
            <span class="menu-icon">⚙️</span>
          </button>
          <button
            class="nav-menu-item logout-btn"
            @click="handleLogout"
            v-ripple
            title="退出登录"
          >
            <span class="menu-icon">🚪</span>
          </button>
        </div>
      </div>

      <!-- 中间会话列表区域 -->
      <div class="conversation-sidebar">
        <div class="sidebar-header">
          <!-- 可点击的用户资料区域 -->
          <div class="user-profile" @click="enterEditMode" v-ripple>
            <div class="avatar-placeholder">
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

        <!-- 使用 ConversationList 组件 -->
        <ConversationList
          :current-conversation-id="currentConversationId"
          @conversation-click="handleConversationClick"
          @retry-load="retryLoad"
        />
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

        <!-- 更多选项主菜单 -->
        <MoreOptions
          v-else-if="showMoreMenu && !showChangePasswordView"
          :user-id="userId.toString()"
          :user-nickname="userNickname"
          @back="backToMainMenu"
          @show-change-password="showChangePassword"
        />

        <!-- 修改密码组件 -->
        <ChangePassword
          v-else-if="showChangePasswordView"
          :user-id="userId"
          :user-nickname="userNickname"
          @back="backToAccountSecurity"
          @success="handlePasswordSuccess"
        />

        <!-- 聊天组件（当有选中会话且不在编辑模式时显示） -->
        <ChatContainer
          v-else-if="currentConversationId"
          :conv-id="currentConversationId"
          :conversation-name="currentConversationName"
          :conversation-avatar="currentConversationAvatar"
          :is-group="isGroupChat"
          @back="clearCurrentConversation"
        />

        <!-- 聊天区域（当不在编辑模式且没有选中会话时显示） -->
        <div v-else class="chat-area-label">
          <div class="chat-label-header">
            <span class="chat-label-icon">💭</span>
            <span class="chat-label-text">聊天区域</span>
          </div>
          <div class="chat-label-content">
            <p class="chat-label-description">选择一个对话以开始</p>
            <div class="chat-label-features">
              <div class="feature-item">
                <span class="feature-icon">🔍</span>
                <span class="feature-text">搜索好友</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">👥</span>
                <span class="feature-text">创建群聊</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📎</span>
                <span class="feature-text">发送文件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
// 导入部分
import { useThemeStore } from "@/stores/theme";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/chat/show-conversation";
import ProfileEdit from "@/components/ProfileEdit.vue";
import MoreOptions from "@/components/MoreOptions.vue";
import ChangePassword from "@/components/ChangePassword.vue";
import ChatContainer from "@/components/ChatContainer.vue";
import ConversationList from "@/components/ConversationList.vue";

export default {
  name: "HomeView",
  components: {
    ProfileEdit,
    MoreOptions,
    ChangePassword,
    ChatContainer,
    ConversationList,
  },

  setup() {
    const themeStore = useThemeStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();
    const conversationStore = useConversationStore();
    const router = useRouter();

    const themeIcon = () => (themeStore.isDarkMode ? "🌞" : "🌙");
    const themeTitle = () =>
      themeStore.isDarkMode ? "切换到日间模式" : "切换到夜间模式";

    const toggleTheme = () => {
      themeStore.toggleTheme();
    };

    return {
      themeStore,
      userStore,
      authStore,
      conversationStore,
      router,
      themeIcon,
      themeTitle,
      toggleTheme,
    };
  },

  computed: {
    // 主题相关计算属性
    themeIcon() {
      return this.themeStore?.isDarkMode ? "🌞" : "🌙";
    },

    themeTitle() {
      return this.themeStore?.isDarkMode ? "切换到日间模式" : "切换到夜间模式";
    },

    // 从 conversation store 获取当前会话ID
    currentConversationId() {
      return this.conversationStore.currentConversationId || null;
    },

    // 当前会话名称
    currentConversationName() {
      if (!this.currentConversationId) return "";
      const currentConv = this.conversationStore.currentConversation;
      return currentConv?.displayName || `会话 ${this.currentConversationId}`;
    },

    // 当前会话头像
    currentConversationAvatar() {
      if (!this.currentConversationId) return "";
      const currentConv = this.conversationStore.currentConversation;
      return currentConv?.avatar || "";
    },

    // 是否为群聊
    isGroupChat() {
      return false;
    },
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
      showChangePasswordView: false,
      showSuccessMessage: false,
      successMessage: "",
    };
  },

  mounted() {
    this.loadUserData();
    console.log("HomeView mounted");
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

    // 处理会话点击
    handleConversationClick(convId) {
      console.log(
        "HomeView: 收到会话点击事件，convId:",
        convId,
        "类型:",
        typeof convId
      );

      // 如果是事件对象，直接返回
      if (typeof convId === "object" && convId !== null && "target" in convId) {
        console.error("接收到事件对象而不是convId:", convId);
        return;
      }

      // 确保convId是数字
      const id = Number(convId);
      if (isNaN(id)) {
        console.error("无效的会话ID:", convId);
        return;
      }

      console.log("HomeView: 设置当前会话ID:", id);
      this.conversationStore.setCurrentConversation(id);
    },

    // 重试加载
    retryLoad() {
      console.log("HomeView: 收到重试加载事件");
      // ConversationList 组件会自己处理重试，这里只需要通知即可
    },

    // 进入编辑模式
    enterEditMode() {
      this.isEditingProfile = true;
      this.showMoreMenu = false;
      this.showChangePasswordView = false;
      console.log("进入编辑模式");
      this.loadUserData();
    },

    // 退出编辑模式
    exitEditMode() {
      this.isEditingProfile = false;
      console.log("退出编辑模式");
    },

    // 显示更多选项
    showMoreOptions() {
      this.showMoreMenu = true;
      this.showChangePasswordView = false;
      this.isEditingProfile = false;
    },

    // 显示修改密码页面
    showChangePassword() {
      this.showChangePasswordView = true;
      this.showMoreMenu = false;
      this.isEditingProfile = false;
    },

    // 返回主菜单
    backToMainMenu() {
      this.showMoreMenu = false;
      this.showChangePasswordView = false;
      this.isEditingProfile = false;
    },

    // 返回账号安全菜单
    backToAccountSecurity() {
      this.showChangePasswordView = false;
      this.showMoreMenu = true;
      this.isEditingProfile = false;
    },

    // 处理密码修改成功
    handlePasswordSuccess(message) {
      this.backToAccountSecurity();
      this.showSuccessToast(message);
    },

    // 处理用户数据更新
    handleUserDataUpdate(updatedData) {
      Object.assign(this.editForm, updatedData);
      this.userNickname = updatedData.userNickname;

      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        Object.assign(user, updatedData);
        sessionStorage.setItem("user", JSON.stringify(user));

        const avatarUrl = this.processAvatarUrl(updatedData.userAvatar);
        this.currentUserAvatar = avatarUrl;
      }
    },

    // 处理编辑成功
    handleEditSuccess(message) {
      this.showSuccessToast(message);
    },

    showSuccessToast(message) {
      const toast = document.createElement("div");
      toast.className = "simple-toast";
      toast.textContent = message;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add("show");
      }, 10);

      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, 2000);
    },

    clearCurrentConversation() {
      this.conversationStore.setCurrentConversation(null);
    },

    // 开始新聊天
    startNewChat() {
      alert("开始新聊天功能开发中...");
    },

    // 前往聊天界面
    goToChat() {
      alert("聊天功能开发中...");
    },

    // 登出方法
    handleLogout() {
      if (confirm("确定要退出登录吗？")) {
        this.conversationStore.reset();
        this.authStore.logout();
        this.router.push("/");
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