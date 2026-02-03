<template>
  <!-- 在根元素上添加 homeview 类名 -->
  <div class="homeview home-container">
    <!-- 主内容区域 -->
    <div class="main-content-wrapper">
      <!-- 左侧竖向导航栏 -->
      <div class="vertical-side-nav">
        <!-- 功能按钮区域 -->
        <div class="nav-menu">
          <button
            class="nav-menu-item"
            @click="goToChat"
            v-ripple
            title="聊天"
            :class="{ active: currentListView === 'chat' }"
          >
            <span class="menu-icon">💬</span>
          </button>

          <!-- 新增：好友按钮 -->
          <button
            class="nav-menu-item"
            @click="goToFriends"
            v-ripple
            title="好友"
            :class="{ active: currentListView === 'friends' }"
          >
            <span class="menu-icon">👥</span>
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

      <!-- 中间会话/好友列表区域 -->
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

          <!-- 搜索框组件 -->
          <SearchBar v-model="searchKeyword" :placeholder="searchPlaceholder" />
        </div>

        <!-- 内容切换：会话列表或好友列表 -->
        <div class="sidebar-content">
          <!-- 会话列表（聊天视图时显示） -->
          <div v-if="currentListView === 'chat'" class="chat-list-container">
            <ConversationList
              @conversation-click="handleConversationClick"
              :search-query="searchKeyword"
            />
          </div>

          <!-- 好友列表（好友视图时显示） -->
          <div
            v-else-if="currentListView === 'friends'"
            class="friend-list-container"
          >
            <FriendList
              @friend-click="handleFriendClick"
              :search-query="searchKeyword"
            />
          </div>
        </div>
      </div>

      <!-- 右侧聊天区域 (CMA) -->
      <div class="chat-main-area">
        <!-- 用户资料编辑组件 -->
        <UserProfileEdit
          v-if="currentMainView === 'profile'"
          :user-data="editForm"
          @back="exitEditMode"
          @update:user-data="handleUserDataUpdate"
          @success="handleEditSuccess"
        />

        <!-- 更多选项主菜单 -->
        <MoreOptions
          v-else-if="currentMainView === 'more'"
          :user-id="userId.toString()"
          :user-nickname="userNickname"
          @back="backToMainMenu"
          @show-change-password="showChangePassword"
        />

        <!-- 修改密码组件 -->
        <ChangePassword
          v-else-if="currentMainView === 'password'"
          :user-id="userId"
          :user-nickname="userNickname"
          @back="backToAccountSecurity"
          @success="handlePasswordSuccess"
        />

        <!-- 好友详情组件 -->
        <FriendInfo
          v-else-if="currentMainView === 'friends-detail' && selectedFriend"
          :friend="selectedFriend"
          @back="clearSelectedFriend"
          @send-message="handleSendMessageToFriend"
          @delete-friend="handleDeleteFriend"
        />

        <!-- 聊天组件（当有选中会话时显示） -->
        <ChatContainer
          v-else-if="currentConversationId"
          :conv-id="currentConversationId"
          :conversation-name="currentConversationName"
          :conversation-avatar="currentConversationAvatar"
          :show-back-button="false"
          @back="clearCurrentConversation"
        />
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
import { ref, computed, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useThemeStore } from "@/stores/theme";
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/chat/show-conversation";
import { useShowMessageStore } from "@/stores/chat/show-message";
import { useSendMessageStore } from "@/stores/chat/send-message";
import UserProfileEdit from "@/components/UserProfileEdit.vue";
import MoreOptions from "@/components/MoreOptions.vue";
import ChangePassword from "@/components/ChangePassword.vue";
import ChatContainer from "@/components/ChatContainer.vue";
import ConversationList from "@/components/ConversationList.vue";
import FriendInfo from "@/components/FriendInfo.vue";
import FriendList from "@/components/FriendList.vue";
import SearchBar from "@/components/SearchBar.vue";

// 引入样式
import "@/assets/styles/homeview.css";
import "@/assets/styles/searchbar.css";
import "@/assets/styles/night/homeview-night.css";
import "@/assets/styles/night/searchbar-night.css";

// 初始化 store 和 router
const themeStore = useThemeStore();
const authStore = useAuthStore();
const conversationStore = useConversationStore();
const showMessageStore = useShowMessageStore();
const sendMessageStore = useSendMessageStore();
const router = useRouter();

// 响应式数据
const userId = ref("");
const userNickname = ref("用户");
const currentUserAvatar = ref("");
const avatarLoadError = ref(false);

// 视图状态分离：
const currentListView = ref("chat"); // 控制中间列表区域：'chat' | 'friends'
const currentMainView = ref(null); // 控制右侧主区域：'profile' | 'more' | 'password' | 'friends-detail' | null

const searchKeyword = ref("");
const searchPlaceholder = computed(() => {
  return currentListView.value === "friends" ? "搜索好友..." : "搜索会话...";
});

// 监听视图切换，清空搜索框
watch(currentListView, () => {
  searchKeyword.value = "";
});

const showSuccessMessage = ref(false);
const successMessage = ref("");

// 好友相关状态
const selectedFriend = ref(null);

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
  console.log("点击聊天按钮，切换到聊天列表");
  currentListView.value = "chat";
  currentMainView.value = null; // 清空主视图
  selectedFriend.value = null; // 切换时清空选中的好友
  conversationStore.clearCurrentConversation(); // 清空选中的会话
};

const goToFriends = () => {
  console.log("切换到好友列表");
  currentListView.value = "friends";
  currentMainView.value = null; // 清空主视图
  conversationStore.clearCurrentConversation(); // 清空选中的会话
};

const enterEditMode = () => {
  console.log("进入用户资料编辑模式");
  currentMainView.value = "profile";
  loadUserData();
};

const exitEditMode = () => {
  console.log("退出用户资料编辑模式");
  currentMainView.value = null;
};

const showMoreOptions = () => {
  console.log("显示更多设置");
  currentMainView.value = "more";
};

const showChangePassword = () => {
  console.log("显示修改密码页面");
  currentMainView.value = "password";
};

const backToMainMenu = () => {
  console.log("从更多设置返回");
  currentMainView.value = null;
};

const backToAccountSecurity = () => {
  console.log("从修改密码返回更多设置");
  currentMainView.value = "more";
};

// 搜索相关方法
// 好友相关方法
const handleFriendClick = (friend) => {
  selectedFriend.value = friend;
  currentMainView.value = "friends-detail";
};

const clearSelectedFriend = () => {
  selectedFriend.value = null;
  currentMainView.value = null; // 返回好友列表
};

const handleAddFriend = () => {
  console.log("添加好友");
  // TODO: 实现添加好友功能
};

const handleSendMessageToFriend = (friend) => {
  console.log("发送消息给好友:", friend);
  // TODO: 实现与好友开始聊天
  // 这里应该切换到聊天列表，并选择与该好友的会话
  currentListView.value = "chat";
  currentMainView.value = null;
  // 然后查找或创建与该好友的会话
};

const handleDeleteFriend = (friend) => {
  if (
    confirm(`确定要删除好友「${friend.displayName || friend.nickname}」吗？`)
  ) {
    console.log("删除好友:", friend);
    // TODO: 调用删除好友 API，成功后 clearSelectedFriend 并刷新好友列表
    clearSelectedFriend();
  }
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

  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
  return base.replace(/\/$/, "") + avatarUrl;
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
  currentMainView.value = null; // 清空其他视图，显示聊天
  selectedFriend.value = null; // 切换到聊天时清空选中的好友
};

const clearCurrentConversation = () => {
  conversationStore.clearCurrentConversation();
  currentMainView.value = null; // 返回默认视图
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

const handleUserDataUpdate = (backendUser) => {
  if (!backendUser) return;

  const normalized = {
    userId: backendUser.userId ?? backendUser.user_id,
    userNickname:
      backendUser.userNickname ?? backendUser.user_nickname ?? "用户",
    userAvatar: backendUser.userAvatar ?? backendUser.user_avatar ?? "",
    userGender: backendUser.userGender ?? backendUser.user_gender ?? 0,
    userBirthday: backendUser.userBirthday ?? backendUser.user_birthday ?? "",
    userLocation: backendUser.userLocation ?? backendUser.user_location ?? "",
    userSignature:
      backendUser.userSignature ?? backendUser.user_signature ?? "",
    userPhone: backendUser.userPhone ?? backendUser.user_phone ?? "",
    userEmail: backendUser.userEmail ?? backendUser.user_email ?? "",
  };

  Object.assign(editForm, {
    ...normalized,
    userBirthday: formatDateForInput(normalized.userBirthday),
  });
  userNickname.value = normalized.userNickname;
  currentUserAvatar.value = processAvatarUrl(normalized.userAvatar);

  const existingStr = sessionStorage.getItem("user");
  const existing = existingStr
    ? (() => {
        try {
          return JSON.parse(existingStr) || {};
        } catch {
          return {};
        }
      })()
    : {};
  const mergedUser = { ...existing, ...normalized };
  sessionStorage.setItem("user", JSON.stringify(mergedUser));
  authStore.user = mergedUser;
};

const handleEditSuccess = (message) => {
  exitEditMode();
};

// 工具方法
const startNewChat = () => {
  alert("开始新聊天功能开发中...");
};

// 核心登出方法
const handleLogout = async () => {
  if (confirm("确定要退出登录吗？")) {
    try {
      console.log("🚪 开始登出流程...");

      // 1. 清除会话和消息数据
      console.log("🧹 清理会话数据...");
      conversationStore.resetConversations();
      showMessageStore.resetMessages();

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
  console.log("HomeView mounted, initial list view:", currentListView.value);
  loadConversations();
});
</script>

<style scoped>
/* 引入基础样式和组件专用样式 */
@import "@/assets/styles/base.css";
@import "@/assets/styles/homeview.css";

/* 新增样式部分 */
@import "@/assets/styles/friend-list.css";
@import "@/assets/styles/friend-info.css";
@import "@/assets/styles/friend-item.css";
</style>