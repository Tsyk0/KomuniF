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
            :class="{ active: currentView === 'chat' }"
          >
            <span class="menu-icon">💬</span>
          </button>

          <!-- 新增：好友按钮 -->
          <button
            class="nav-menu-item"
            @click="goToFriends"
            v-ripple
            title="好友"
            :class="{ active: currentView === 'friends' }"
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
        </div>

        <!-- 内容切换：会话列表或好友列表 -->
        <div class="sidebar-content">
          <!-- 会话列表（聊天视图时显示） -->
          <div v-if="currentView === 'chat'" class="chat-list-container">
            <conversationlist @conversation-click="handleConversationClick" />
          </div>

          <!-- 好友列表（好友视图时显示） -->
          <div
            v-else-if="currentView === 'friends'"
            class="friend-list-container"
          >
            <!-- 好友分组 -->
            <div class="friends-groups">
              <div class="friends-group">
                <div class="group-header" @click="toggleGroup('specialCare')">
                  <div class="group-title">
                    <span class="toggle-icon">{{
                      collapsedGroups.specialCare ? "▶" : "▼"
                    }}</span>
                    <span>特别关心</span>
                  </div>
                  <div class="group-count">1/1</div>
                </div>
                <div v-if="!collapsedGroups.specialCare" class="group-content">
                  <div
                    class="friend-item"
                    :class="{ active: selectedFriendId === 1001 }"
                    @click="selectFriend(specialCareFriends[0])"
                  >
                    <div class="friend-avatar">
                      <div class="avatar-default">张</div>
                      <span class="online-dot online"></span>
                    </div>
                    <div class="friend-info">
                      <div class="friend-name">
                        {{ specialCareFriends[0].displayName }}
                      </div>
                      <div class="friend-signature">
                        {{ specialCareFriends[0].signature }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="friends-group">
                <div class="group-header" @click="toggleGroup('myFriends')">
                  <div class="group-title">
                    <span class="toggle-icon">{{
                      collapsedGroups.myFriends ? "▶" : "▼"
                    }}</span>
                    <span>我的好友</span>
                  </div>
                  <div class="group-count">0/5</div>
                </div>
                <div v-if="!collapsedGroups.myFriends" class="group-content">
                  <div class="empty-group">
                    <p>暂无好友</p>
                  </div>
                </div>
              </div>

              <div class="friends-group">
                <div class="group-header" @click="toggleGroup('classmates')">
                  <div class="group-title">
                    <span class="toggle-icon">{{
                      collapsedGroups.classmates ? "▶" : "▼"
                    }}</span>
                    <span>同学</span>
                  </div>
                  <div class="group-count">20/24</div>
                </div>
                <div v-if="!collapsedGroups.classmates" class="group-content">
                  <div
                    v-for="friend in classmatesFriends"
                    :key="friend.id"
                    class="friend-item"
                    :class="{ active: selectedFriendId === friend.id }"
                    @click="selectFriend(friend)"
                  >
                    <div class="friend-avatar">
                      <div class="avatar-default">
                        {{ friend.displayName.charAt(0) }}
                      </div>
                      <span
                        class="online-dot"
                        :class="friend.onlineStatus"
                      ></span>
                    </div>
                    <div class="friend-info">
                      <div class="friend-name">{{ friend.displayName }}</div>
                      <div v-if="friend.signature" class="friend-signature">
                        {{ friend.signature }}
                      </div>
                      <div v-else-if="friend.lastSeen" class="friend-last-seen">
                        {{ friend.lastSeen }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 添加好友按钮 -->
            <div class="friend-list-footer">
              <button class="add-friend-btn" @click="handleAddFriend">
                <span class="add-icon">➕</span>
                <span class="add-text">添加好友</span>
              </button>
            </div>
          </div>
        </div>
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

        <!-- 好友详情组件 -->
        <FriendDetail
          v-else-if="currentView === 'friends' && selectedFriend"
          :friend="selectedFriend"
          @back="clearSelectedFriend"
          @send-message="handleSendMessageToFriend"
          @more-actions="handleFriendMoreActions"
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

        <!-- 好友视图默认状态 -->
        <!-- <div
          v-else-if="currentView === 'friends' && !selectedFriend"
          class="friend-default-view"
        >
          <div class="friend-default-content">
            <div class="friend-default-icon">👥</div>
            <h3 class="friend-default-title">好友列表</h3>
            <p class="friend-default-description">
              从左侧列表中选择一个好友以查看详细信息
            </p>
            <div class="friend-default-features">
              <div class="feature-item">
                <span class="feature-icon">🔍</span>
                <span class="feature-text">搜索好友</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">➕</span>
                <span class="feature-text">添加好友</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📱</span>
                <span class="feature-text">管理分组</span>
              </div>
            </div>
          </div> -->
        <!-- </div> -->
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
import { useShowMessageStore } from "@/stores/chat/show-message";
import { useSendMessageStore } from "@/stores/chat/send-message";
import ProfileEdit from "@/components/ProfileEdit.vue";
import MoreOptions from "@/components/MoreOptions.vue";
import ChangePassword from "@/components/ChangePassword.vue";
import ChatContainer from "@/components/ChatContainer.vue";
import conversationlist from "@/components/conversationlist.vue";
import FriendDetail from "@/components/FriendDetail.vue";

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
const currentView = ref("chat");
const showSuccessMessage = ref(false);
const successMessage = ref("");

// 好友相关状态
const searchKeyword = ref("");
const selectedFriend = ref(null);
const collapsedGroups = reactive({
  specialCare: false,
  myFriends: false,
  classmates: false,
});

// 模拟好友数据
const specialCareFriends = ref([
  {
    id: 1001,
    nickname: "张三",
    remarkName: "三哥",
    displayName: "三哥",
    group: "特别关心",
    signature: "努力工作，快乐生活",
    onlineStatus: "online",
    lastSeen: "刚刚",
    joinTime: "2023-10-01",
  },
]);

const classmatesFriends = ref([
  {
    id: 2001,
    nickname: "李四",
    remarkName: "四哥",
    displayName: "四哥",
    group: "同学",
    signature: "好好学习，天天向上",
    onlineStatus: "online",
    lastSeen: "刚刚",
    joinTime: "2023-09-15",
  },
  {
    id: 2002,
    nickname: "王五",
    remarkName: "",
    displayName: "王五",
    group: "同学",
    signature: "",
    onlineStatus: "offline",
    lastSeen: "2小时前",
    joinTime: "2023-09-20",
  },
  {
    id: 2003,
    nickname: "赵六",
    remarkName: "六哥",
    displayName: "六哥",
    group: "同学",
    signature: "前端开发工程师",
    onlineStatus: "away",
    lastSeen: "30分钟前",
    joinTime: "2023-09-25",
  },
]);

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

const selectedFriendId = computed(() => {
  return selectedFriend.value?.id || null;
});

// 主题切换
const toggleTheme = () => {
  themeStore.toggleTheme();
};

// 视图切换方法
const goToChat = () => {
  console.log("点击聊天按钮，切换到聊天视图");
  currentView.value = "chat";
  selectedFriend.value = null; // 切换时清空选中的好友
};

const goToFriends = () => {
  console.log("切换到好友视图");
  currentView.value = "friends";
  conversationStore.clearCurrentConversation(); // 切换到好友视图时清空选中的会话
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

// 搜索相关方法
const handleSearchInput = (event) => {
  searchKeyword.value = event.target.value;
  console.log("搜索关键词:", searchKeyword.value);
};

const clearSearch = () => {
  searchKeyword.value = "";
};

// 好友相关方法
const toggleGroup = (groupName) => {
  collapsedGroups[groupName] = !collapsedGroups[groupName];
};

const selectFriend = (friend) => {
  selectedFriend.value = { ...friend };
  console.log("选择好友:", friend);
};

const clearSelectedFriend = () => {
  selectedFriend.value = null;
};

const handleAddFriend = () => {
  console.log("添加好友");
  // TODO: 实现添加好友功能
};

const handleSendMessageToFriend = (friend) => {
  console.log("发送消息给好友:", friend);
  // TODO: 实现与好友开始聊天
};

const handleFriendMoreActions = (friend) => {
  console.log("好友更多操作:", friend);
  // TODO: 显示好友操作菜单
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
  selectedFriend.value = null; // 切换到聊天时清空选中的好友
};

const clearCurrentConversation = () => {
  conversationStore.clearCurrentConversation();
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
  console.log("HomeView mounted, initial view:", currentView.value);
  loadConversations();
});
</script>

<style scoped>
/* 引入基础样式和组件专用样式 */
@import "@/assets/styles/base.css";
@import "@/assets/styles/homeview.css";

/* 新增样式部分 */
@import "@/assets/styles/friend-list.css";
@import "@/assets/styles/friend-detail.css";
</style>