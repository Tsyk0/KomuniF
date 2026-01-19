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

        <!-- 修改会话列表区域 -->
        <div class="conversation-list">
          <!-- 添加 Telegram 风格的搜索框 -->
          <div class="search-container">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                v-model="searchKeyword"
                placeholder="搜索会话..."
                class="search-input"
                @input="handleSearch"
              />
              <button
                v-if="searchKeyword"
                class="clear-search"
                @click="clearSearch"
                title="清除搜索"
              >
                <span class="clear-icon">×</span>
              </button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <span>加载会话中...</span>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="loadError" class="error-state">
            <div class="error-icon">❌</div>
            <span>{{ loadError }}</span>
            <button @click="retryLoad" class="retry-btn">重试</button>
          </div>

          <!-- 搜索无结果 -->
          <div
            v-else-if="searchKeyword && filteredConversations.length === 0"
            class="no-results"
          >
            <div class="no-results-icon">🔍</div>
            <p class="no-results-text">未找到匹配的会话</p>
            <p class="no-results-hint">尝试其他搜索关键词</p>
          </div>

          <!-- 空状态 -->
          <div
            v-else-if="conversations.length === 0"
            class="empty-conversation"
          >
            <div class="empty-icon">💬</div>
            <p class="empty-text">暂无会话</p>
            <p class="empty-hint">开始新的对话或等待好友消息</p>
          </div>

          <!-- 会话列表 -->
          <div v-else class="conversations-container">
            <!-- 修改这里：传递 convId 参数 -->
            <ConversationItem
              v-for="conversation in filteredConversations"
              :key="conversation.convId"
              :conv-id="conversation.convId"
              :display-name="conversation.displayName"
              :avatar="conversation.avatar"
              :last-message="conversation.lastMessage"
              :last-message-time="conversation.lastMessageTime"
              :unread-count="conversation.unreadCount"
              :is-active="currentConversationId === conversation.convId"
              @click="handleConversationClick(conversation.convId)"
            />
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
import ConversationItem from "@/components/ConversationItem.vue";
import ChatContainer from "@/components/ChatContainer.vue";

export default {
  name: "HomeView",
  components: {
    ProfileEdit,
    MoreOptions,
    ChangePassword,
    ConversationItem,
    ChatContainer,
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

    // 从 conversation store 获取数据
    conversations() {
      return this.conversationStore.conversationList || [];
    },

    isLoading() {
      return this.conversationStore.isLoading || false;
    },

    loadError() {
      return this.conversationStore.error || "";
    },

    currentConversationId() {
      return this.conversationStore.currentConversationId || null;
    },

    // 过滤后的会话列表
    filteredConversations() {
      if (!this.searchKeyword.trim()) {
        return this.conversations;
      }

      const keyword = this.searchKeyword.toLowerCase();
      return this.conversations.filter((conversation) => {
        // 搜索会话名称
        if (conversation.displayName?.toLowerCase().includes(keyword)) {
          return true;
        }

        // 搜索最后消息内容
        if (conversation.lastMessage?.toLowerCase().includes(keyword)) {
          return true;
        }

        // 搜索会话ID
        if (conversation.convId.toString().includes(keyword)) {
          return true;
        }

        return false;
      });
    },

    // 当前会话名称
    currentConversationName() {
      if (!this.currentConversationId) return "";
      const conversation = this.conversations.find(
        (conv) => conv.convId === this.currentConversationId
      );
      return conversation?.displayName || `会话 ${this.currentConversationId}`;
    },

    // 当前会话头像
    currentConversationAvatar() {
      if (!this.currentConversationId) return "";
      const conversation = this.conversations.find(
        (conv) => conv.convId === this.currentConversationId
      );
      return conversation?.avatar || "";
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
      searchKeyword: "",
      searchTimeout: null,
    };
  },

  mounted() {
    this.loadUserData();
    this.loadConversations();
    console.log("HomeView mounted, 当前用户头像:", this.currentUserAvatar);
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
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

    // 加载会话列表
    async loadConversations() {
      try {
        const userStr = sessionStorage.getItem("user");
        if (!userStr) {
          console.warn("用户未登录，跳过加载会话列表");
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.userId;

        if (!userId) {
          console.warn("用户ID不存在，跳过加载会话列表");
          return;
        }

        console.log("开始加载会话列表，userId:", userId);

        await this.conversationStore.fetchUserConversations(userId);

        if (this.conversations.length > 0 && !this.currentConversationId) {
          this.conversationStore.setCurrentConversation(
            this.conversations[0].convId
          );
        }

        console.log("会话列表加载完成");
      } catch (error) {
        console.error("加载会话列表失败:", error);
      }
    },

    // 重试加载
    retryLoad() {
      this.conversationStore.clearError();
      this.loadConversations();
    },

    // 处理会话点击 - 修改这里！
    handleConversationClick(convId) {
      console.log(
        "HomeView: 点击会话事件，参数:",
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

    // 处理搜索输入
    handleSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        console.log("执行搜索，关键词:", this.searchKeyword);
      }, 300);
    },

    // 清除搜索
    clearSearch() {
      this.searchKeyword = "";
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