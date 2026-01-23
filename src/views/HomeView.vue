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
          <!-- 使用 themeStore -->
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
        <ConversationList @conversation-click="handleConversationClick" />
      </div>

      <!-- 右侧聊天区域 (MCA - Main Chat Area) -->
      <div class="chat-main-area">
        <!-- 用户资料编辑组件 -->
        <ProfileEdit
          v-if="currentView === 'profile'"
          :user-data="editForm"
          @back="exitEditMode"
          @update:user-data="handleUserDataUpdate"
          @success="handleEditSuccess"
        />

        <!-- 更多选项主菜单 -->
        <MoreOptions
          v-else-if="currentView === 'more'"
          :user-id="userId.toString()"
          :user-nickname="userNickname"
          @back="backToMainMenu"
          @show-change-password="showChangePassword"
        />

        <!-- 修改密码组件 -->
        <ChangePassword
          v-else-if="currentView === 'password'"
          :user-id="userId"
          :user-nickname="userNickname"
          @back="backToAccountSecurity"
          @success="handlePasswordSuccess"
        />

        <!-- 聊天组件（当有选中会话且视图为chat时显示） -->
        <ChatContainer
          v-else-if="currentView === 'chat' && currentConversationId"
          :conv-id="currentConversationId"
          :conversation-name="currentConversationName"
          :conversation-avatar="currentConversationAvatar"
          :show-back-button="false"
          @back="clearCurrentConversation"
        />

        <!-- 默认聊天区域（当视图为chat但没有选中会话时显示） -->
        <div v-else-if="currentView === 'chat'" class="chat-area-label">
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

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { useThemeStore } from "@/stores/theme";
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/chat/show-conversation";
import { useMessageStore } from "@/stores/chat/show-message";
import ProfileEdit from "@/components/ProfileEdit.vue";
import MoreOptions from "@/components/MoreOptions.vue";
import ChangePassword from "@/components/ChangePassword.vue";
import ChatContainer from "@/components/ChatContainer.vue";
import ConversationList from "@/components/ConversationList.vue";

// 初始化 store 和 router
const themeStore = useThemeStore();
const authStore = useAuthStore();
const conversationStore = useConversationStore();
const messageStore = useMessageStore();
const router = useRouter();

// 响应式数据
const userId = ref("");
const userNickname = ref("用户");
const currentUserAvatar = ref("");
const avatarLoadError = ref(false);
const currentView = ref("chat"); // 当前视图：'chat', 'profile', 'more', 'password'
const showSuccessMessage = ref(false);
const successMessage = ref("");

// 编辑表单数据
const editForm = reactive({
  userId: "",
  userNickname: "",
  userAvatar: "",
  userGender: 0,
  userBirthday: "",
  userLocation: "",
  userSignature: "",
  userPhone: "",
  userEmail: "",
});

// 计算属性
const themeIcon = computed(() => (themeStore.isDarkMode ? "🌞" : "🌙"));
const themeTitle = computed(() =>
  themeStore.isDarkMode ? "切换到日间模式" : "切换到夜间模式"
);

const currentConversationId = computed(() => {
  return conversationStore.currentConversation?.convId || null;
});

const currentConversationName = computed(() => {
  const currentConv = conversationStore.currentConversation;
  return currentConv?.convName || `会话 ${currentConversationId.value}`;
});

const currentConversationAvatar = computed(() => {
  const currentConv = conversationStore.currentConversation;
  return currentConv?.convAvatar || "";
});

const isGroupChat = computed(() => {
  return conversationStore.currentConversation?.convType === 2;
});

// 主题切换
const toggleTheme = () => {
  themeStore.toggleTheme();
};

// 视图切换方法
const goToChat = () => {
  console.log("点击聊天按钮，切换到聊天视图");
  currentView.value = "chat";
};

const enterEditMode = () => {
  console.log("进入用户资料编辑模式");
  currentView.value = "profile";
  loadUserData();
};

const exitEditMode = () => {
  console.log("退出用户资料编辑模式，返回聊天视图");
  currentView.value = "chat";
};

const showMoreOptions = () => {
  console.log("显示更多设置");
  currentView.value = "more";
};

const showChangePassword = () => {
  console.log("显示修改密码页面");
  currentView.value = "password";
};

const backToMainMenu = () => {
  console.log("从更多设置返回聊天视图");
  currentView.value = "chat";
};

const backToAccountSecurity = () => {
  console.log("从修改密码返回更多设置");
  currentView.value = "more";
};

// 头像相关方法
const handleAvatarError = () => {
  console.log("头像加载失败，使用默认头像");
  avatarLoadError.value = true;
};

// 用户数据方法
const loadUserData = () => {
  const userStr = sessionStorage.getItem("user");
  console.log("loadUserData调用, sessionStorage:", userStr);

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId.value = user.userId || "";
      userNickname.value = user.userNickname || "用户";

      // 处理头像URL
      let avatarUrl = user.userAvatar || "";
      avatarUrl = processAvatarUrl(avatarUrl);
      currentUserAvatar.value = avatarUrl;

      // 初始化编辑表单
      Object.assign(editForm, {
        userId: user.userId || "",
        userNickname: user.userNickname || "",
        userAvatar: avatarUrl,
        userGender: user.userGender || 0,
        userBirthday: formatDateForInput(user.userBirthday),
        userLocation: user.userLocation || "",
        userSignature: user.userSignature || "",
        userPhone: user.userPhone || "",
        userEmail: user.userEmail || "",
      });

      console.log("用户数据加载完成");
    } catch (e) {
      console.error("解析用户信息失败:", e);
    }
  } else {
    console.log("sessionStorage中没有用户数据");
  }
};

const processAvatarUrl = (avatarUrl) => {
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
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

// 会话相关方法
const handleConversationClick = (convId) => {
  console.log("HomeView: 收到会话点击事件，convId:", convId);

  const id = Number(convId);
  if (isNaN(id)) {
    console.error("无效的会话ID:", convId);
    return;
  }

  console.log("HomeView: 设置当前会话ID:", id);
  conversationStore.setCurrentConversation(id);
  currentView.value = "chat";
  messageStore.resetMessages();
};

const clearCurrentConversation = () => {
  conversationStore.clearCurrentConversation();
  messageStore.resetMessages();
};

const loadConversations = async () => {
  try {
    await conversationStore.loadConversations();
    console.log("会话列表加载完成");
  } catch (error) {
    console.error("加载会话列表失败:", error);
  }
};

// 事件处理方法
const handlePasswordSuccess = (message) => {
  backToAccountSecurity();
};

const handleUserDataUpdate = (updatedData) => {
  Object.assign(editForm, updatedData);
  userNickname.value = updatedData.userNickname;

  const userStr = sessionStorage.getItem("user");
  if (userStr) {
    const user = JSON.parse(userStr);
    Object.assign(user, updatedData);
    sessionStorage.setItem("user", JSON.stringify(user));

    const avatarUrl = processAvatarUrl(updatedData.userAvatar);
    currentUserAvatar.value = avatarUrl;
  }
};

const handleEditSuccess = (message) => {
  currentView.value = "chat";
};

// 工具方法
const startNewChat = () => {
  alert("开始新聊天功能开发中...");
};

// 核心登出方法 - 使用 Composition API
const handleLogout = async () => {
  if (confirm("确定要退出登录吗？")) {
    try {
      console.log("🚪 开始登出流程...");

      // 1. 清除会话和消息数据
      console.log("🧹 清理会话数据...");
      conversationStore.resetConversations();
      messageStore.resetMessages();

      // 2. 清除认证状态
      console.log("🔐 清除认证状态...");
      authStore.logout();

      // 3. 跳转到登录页
      console.log("🔄 跳转到登录页...");
      router.push("/");
    } catch (error) {
      console.error("❌ 登出失败:", error);
      alert("登出失败，请重试");
    }
  }
};

// 生命周期钩子
onMounted(() => {
  loadUserData();
  console.log("HomeView mounted, initial view:", currentView.value);
  loadConversations();
});
</script>

<style scoped>
/* 引入基础样式和组件专用样式 */
@import "@/assets/styles/base.css";
@import "@/assets/styles/homeview.css";
</style>