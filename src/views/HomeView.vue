<template>
  <div class="homeview home-container">
    <div class="main-content-wrapper">
      <div class="vertical-side-nav">
        <div class="nav-menu">
          <button
            class="nav-menu-item"
            @click="goToChat"
            v-ripple
            title="消息列表"
            :class="{
              active:
                currentListView === 'chat' &&
                !convCreateStore.active &&
                currentMainView !== 'notifications',
            }"
          >
            <MessageCircle class="menu-icon" :size="22" :stroke-width="2.2" />
          </button>

          <button
            class="nav-menu-item"
            @click="goToFriends"
            v-ripple
            title="好友列表"
            :class="{
              active:
                currentListView === 'friends' &&
                !convCreateStore.active &&
                currentMainView !== 'notifications',
            }"
          >
            <UsersRound class="menu-icon" :size="22" :stroke-width="2.2" />
          </button>

          <button
            class="nav-menu-item nav-menu-item--notif"
            @click="goToNotifications"
            v-ripple
            title="系统通知"
            :class="{ active: currentMainView === 'notifications' }"
          >
            <Bell class="menu-icon" :size="22" :stroke-width="2.2" />
            <span
              v-if="notificationUnreadCount > 0"
              class="nav-notification-badge"
              aria-label="未读通知"
            >
              {{
                notificationUnreadCount > 99 ? "99+" : notificationUnreadCount
              }}
            </span>
          </button>

          <button
            class="nav-menu-item"
            @click="startNewChat"
            v-ripple
            title="发起会话"
            :class="{ active: convCreateStore.active }"
          >
            <Plus class="menu-icon" :size="22" :stroke-width="2.2" />
          </button>
        </div>

        <div class="nav-bottom-menu">
          <button
            class="nav-menu-item"
            @click="toggleTheme"
            v-ripple
            :title="themeTitle"
          >
            <Sun
              v-if="!themeStore.isDarkMode"
              class="menu-icon"
              :size="22"
              :stroke-width="2.2"
            />
            <Moon v-else class="menu-icon" :size="22" :stroke-width="2.2" />
          </button>
          <button
            class="nav-menu-item"
            @click="showMoreOptions"
            v-ripple
            title="更多设置与帮助"
          >
            <Settings class="menu-icon" :size="22" :stroke-width="2.2" />
          </button>
          <button
            class="nav-menu-item logout-btn"
            @click="handleLogout"
            v-ripple
            title="退出登录"
          >
            <LogOut class="menu-icon" :size="22" :stroke-width="2.2" />
          </button>
        </div>
      </div>

      <div
        class="conversation-sidebar"
        :class="{ resizing: isResizing }"
        :style="{ width: sidebarWidth + 'px' }"
      >
        <div
          class="resize-handle"
          @mousedown="startResize"
          @touchstart="startResize"
          title="拖拽控制边界"
        ></div>
        <div class="sidebar-header">
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

          <SearchBar v-model="searchKeyword" :placeholder="searchPlaceholder" />
        </div>

        <div class="sidebar-content">
          <div v-if="convCreateStore.active" class="friend-pick-sidebar-wrap">
            <FriendPickSidebar :search-query="searchKeyword" />
          </div>

          <div
            v-else-if="currentListView === 'chat'"
            class="chat-list-container"
          >
            <ConversationList
              @conversation-click="handleConversationClick"
              :search-query="searchKeyword"
            />
          </div>

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

      <div
        class="chat-main-area"
        :class="{ 'is-profile-editing': currentMainView === 'profile' }"
      >
        <UserProfileEdit
          v-if="currentMainView === 'profile'"
          :user-data="editForm"
          @back="exitEditMode"
          @update:user-data="handleUserDataUpdate"
          @success="handleEditSuccess"
        />

        <MoreOptions
          v-else-if="currentMainView === 'more'"
          :user-id="userId.toString()"
          :user-nickname="userNickname"
          @back="backToMainMenu"
          @show-change-password="showChangePassword"
        />

        <ChangePassword
          v-else-if="currentMainView === 'password'"
          :user-nickname="userNickname"
          @back="backToAccountSecurity"
          @success="handlePasswordSuccess"
        />

        <FriendInfo
          v-else-if="currentMainView === 'friends-detail' && selectedFriend"
          :friend="selectedFriend"
          @back="clearSelectedFriend"
          @send-message="handleSendMessageToFriend"
          @delete-friend="handleDeleteFriend"
        />

        <NotificationCenter
          v-else-if="currentMainView === 'notifications'"
          @back="backToMainMenu"
        />

        <PlusPanel
          v-else-if="convCreateStore.active"
          @exit="exitConvCreate"
          @created="handleGroupCreated"
          @send-message="onUserSearchSendMessage"
        />

        <ChatContainer
          v-else-if="currentConversationId"
          :conv-id="currentConversationId"
          :friend-id="currentFriendId"
          :show-back-button="false"
          @back="clearCurrentConversation"
        />
      </div>
    </div>

    <div v-if="showSuccessMessage" class="success-toast">
      <div class="toast-content">
        <span class="toast-icon">&#x2705;</span>
        <span class="toast-text">{{ successMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import {
  Bell,
  LogOut,
  MessageCircle,
  Moon,
  Plus,
  Settings,
  Sun,
  UsersRound,
} from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useThemeStore } from "@/store/theme/theme";
import { useUserStore } from "@/store/user/user";
import { useConvStore } from "@/store/conv/conv";
import { useShowMessageStore } from "@/store/message/showMessage";
import { useSendMessageStore } from "@/store/message/sendMessage";
import { useConvCreateStore } from "@/store/conv/convCreate";
import { useSystemNotificationsStore } from "@/store/notification/systemNotifications";
import { useAppBootstrapStore } from "@/store/app/bootstrap";
import UserProfileEdit from "@/components/UserProfileEdit.vue";
import MoreOptions from "@/components/MoreOptions.vue";
import ChangePassword from "@/components/ChangePassword.vue";
import ChatContainer from "@/components/ChatContainer.vue";
import ConversationList from "@/components/ConversationList.vue";
import FriendInfo from "@/components/FriendInfo.vue";
import FriendList from "@/components/FriendList.vue";
import PlusPanel from "@/components/PlusPanel.vue";
import FriendPickSidebar from "@/components/FriendPickSidebar.vue";
import NotificationCenter from "@/components/NotificationCenter.vue";
import SearchBar from "@/components/SearchBar.vue";
import toast from "@/commons/utils/toast";
import {
  buildHomeUserStateFromSession,
  formatDateForInputInHome,
  handleSidebarResizeFlow,
  loadSidebarWidthFromStorage,
  mergeUserToSessionFlow,
  normalizeBackendUserPayload,
  processHomeAvatarUrl,
  runHomeLogoutFlow,
  startSidebarResizeFlow,
  stopSidebarResizeFlow,
} from "@/interactions/homeView/HomeViewInteraction";

import "@/assets/styles/homeview.css";
import "@/assets/styles/searchbar.css";
import "@/assets/styles/night/homeview-night.css";
import "@/assets/styles/night/searchbar-night.css";

const themeStore = useThemeStore();
const authStore = useUserStore();
const conversationStore = useConvStore();
const showMessageStore = useShowMessageStore();
const sendMessageStore = useSendMessageStore();
const convCreateStore = useConvCreateStore();
const notificationStore = useSystemNotificationsStore();
const appBootstrapStore = useAppBootstrapStore();

const getAuthUserIdOr = (fallback) => {
  const authUser = authStore.user;
  if (!authUser) return fallback;
  const id = authUser.userId;
  return id == null ? fallback : Number(id);
};
const router = useRouter();

const userId = ref("");
const userNickname = ref("用户");
const currentUserAvatar = ref("");
const avatarLoadError = ref(false);

const sidebarWidth = ref(400);
const isResizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

let animationFrameId = null;

const SIDEBAR_WIDTH_KEY = "komunif_sidebar_width";

const startResize = (e) => {
  startSidebarResizeFlow({
    event: e,
    currentWidth: sidebarWidth.value,
    setResizing: (value) => (isResizing.value = value),
    setStartX: (value) => (startX.value = value),
    setStartWidth: (value) => (startWidth.value = value),
    onPointerMove: handleResize,
    onPointerUp: stopResize,
  });
};

const handleResize = (e) => {
  handleSidebarResizeFlow({
    event: e,
    isResizing: isResizing.value,
    startX: startX.value,
    startWidth: startWidth.value,
    minWidth: 300,
    maxWidth: 600,
    animationFrameId,
    setAnimationFrameId: (id) => (animationFrameId = id),
    setWidth: (value) => (sidebarWidth.value = value),
  });
};

const stopResize = () => {
  stopSidebarResizeFlow({
    width: sidebarWidth.value,
    widthKey: SIDEBAR_WIDTH_KEY,
    animationFrameId,
    setAnimationFrameId: (id) => (animationFrameId = id),
    setResizing: (value) => (isResizing.value = value),
    onPointerMove: handleResize,
    onPointerUp: stopResize,
  });
};

const saveSidebarWidth = () => {
  try {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.value.toString());
  } catch (error) {
    console.warn("无法保存侧边栏宽度到localStorage:", error);
  }
};

const loadSidebarWidth = () => {
  const savedWidth = loadSidebarWidthFromStorage({
    widthKey: SIDEBAR_WIDTH_KEY,
    minWidth: 300,
    maxWidth: 600,
  });
  if (savedWidth != null) sidebarWidth.value = savedWidth;
};

const currentListView = ref("chat"); // 'chat' | 'friends' | 'create-group'
const currentMainView = ref(null);

const searchKeyword = ref("");
const searchPlaceholder = computed(() => {
  if (convCreateStore.active) return "搜索好友或选择...";
  if (currentListView.value === "friends") return "搜索好友名称...";
  return "搜索会话...";
});

watch(currentListView, () => {
  searchKeyword.value = "";
});

const showSuccessMessage = ref(false);
const successMessage = ref("");

const selectedFriend = ref(null);

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

const themeTitle = computed(() =>
  themeStore.isDarkMode ? "切换到日间模式" : "切换到夜间模式"
);

const currentConversationId = computed(() => {
  return conversationStore.currentConversation?.convId || null;
});

const isGroupChat = computed(() => {
  return conversationStore.currentConversation?.convType === 2;
});

const currentFriendId = computed(() => {
  const c = conversationStore.currentConversation;
  if (!c?.peer) return null;
  const peerId = Number(c.peer.peerUserId);
  return Number.isFinite(peerId) && peerId > 0 ? peerId : null;
});

const notificationUnreadCount = computed(() => notificationStore.unreadCount);

const toggleTheme = () => {
  themeStore.toggleTheme();
};

const goToChat = () => {
  if (convCreateStore.active) {
    convCreateStore.exit(false);
  }
  console.log("点击聊天按钮，切换到聊天列表");
  currentListView.value = "chat";
  currentMainView.value = null;
  selectedFriend.value = null;
  conversationStore.clearCurrentConversation();
};

const goToFriends = () => {
  if (convCreateStore.active) {
    convCreateStore.exit(false);
  }
  console.log("切换到好友列表");
  currentListView.value = "friends";
  currentMainView.value = null;
  conversationStore.clearCurrentConversation();
};

const goToNotifications = async () => {
  if (convCreateStore.active) {
    convCreateStore.exit(false);
  }
  currentListView.value = "chat";
  selectedFriend.value = null;
  conversationStore.clearCurrentConversation();
  currentMainView.value = "notifications";
  const uid = getAuthUserIdOr(Number(userId.value));
  if (Number.isFinite(uid) && uid > 0) {
    await appBootstrapStore.loadOne("notifications", uid);
    await notificationStore.advanceCursorToLocalMaxAndSyncUnread();
  }
};

const exitConvCreate = () => {
  const restore = convCreateStore.savedListView;
  convCreateStore.exit(false);
  currentListView.value = restore;
  currentMainView.value = null;
  conversationStore.clearCurrentConversation();
  selectedFriend.value = null;
};

/**
 * 以“对方 userId”为入口，确保单聊会话可被打开：
 * 1) 创建/获取单聊 convId；
 * 2) 刷新会话缓存（必要时补一次 conversations bootstrap）；
 * 3) 设为当前会话并加载消息。
 */
const openSingleChatWithPeerUserId = async (peerUserId) => {
  const result = await convCreateStore.openOrCreateSingleConversation({
    peerUserId: Number(peerUserId),
    currentUserId: getAuthUserIdOr(0),
    loadMessages: (convId) => showMessageStore.loadMessages(convId),
    loadConversationsBootstrap: (userId) =>
      appBootstrapStore.loadOne("conversations", userId),
  });
  if (!result.ok) {
    if (result.message) toast.error(result.message);
    return false;
  }
  return true;
};

const onUserSearchSendMessage = async (user) => {
  const peerId = user?.userId;
  if (peerId == null || Number.isNaN(Number(peerId))) {
    toast.error("无法获取用户 ID");
    return;
  }
  const n = Number(peerId);
  const me =
    authStore.user?.userId != null ? Number(authStore.user.userId) : NaN;
  if (Number.isFinite(me) && n === me) {
    toast.error("不能与自己发起会话");
    return;
  }

  const ok = await openSingleChatWithPeerUserId(n);
  if (!ok) return;

  const restore = convCreateStore.savedListView;
  convCreateStore.exit(true);
  currentListView.value = restore;
  currentMainView.value = null;
  selectedFriend.value = null;
};

/**
 * 群聊创建成功后的收口动作（由 ConvCreatePanel 的 created 事件触发）：
 * - 确认 convId 可用；
 * - 确保该会话在本地会话缓存中；
 * - 自动打开该群聊并加载消息。
 */
const handleGroupCreated = async (convId) => {
  const id = Number(convId);
  if (Number.isNaN(id)) {
    toast.error("无效的会话 ID");
    return;
  }
  convCreateStore.exit(true);
  const result = await convCreateStore.openExistingConversation({
    convId: id,
    currentUserId: getAuthUserIdOr(0),
    loadMessages: (cid) => showMessageStore.loadMessages(cid),
    loadConversationsBootstrap: (userId) =>
      appBootstrapStore.loadOne("conversations", userId),
  });
  if (!result.ok) {
    toast.error(result.message || "打开群聊失败，请稍后重试");
    return;
  }
  currentListView.value = "chat";
  currentMainView.value = null;
  selectedFriend.value = null;
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

const handleFriendClick = (friend) => {
  selectedFriend.value = friend;
  currentMainView.value = "friends-detail";
};

const clearSelectedFriend = () => {
  selectedFriend.value = null;
  currentMainView.value = null;
};

const handleSendMessageToFriend = async (friend) => {
  const peerId = friend?.friendId;
  if (peerId == null || Number.isNaN(Number(peerId))) {
    toast.error("无法获取好友 ID，请返回列表重试");
    return;
  }

  const ok = await openSingleChatWithPeerUserId(Number(peerId));
  if (!ok) return;

  currentListView.value = "chat";
  currentMainView.value = null;
  selectedFriend.value = null;
};

/**
 * 删除好友入口：当前后端删除接口未接入，明确提示而不是伪实现。
 */
const handleDeleteFriend = (friend) => {
  const name = friend?.displayName || friend?.nickname || "该好友";
  toast.warning(`删除好友（${name}）功能暂未接入，请先在后端完成接口后再启用`);
};

const handleAvatarError = () => {
  console.log("头像加载失败，使用默认头像");
  avatarLoadError.value = true;
};

const loadUserData = () => {
  const userStr = authStore.user ? JSON.stringify(authStore.user) : null;
  const userState = buildHomeUserStateFromSession({
    sessionUserRaw: userStr,
    baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081",
  });
  if (!userState) return;
  userId.value = userState.userId;
  userNickname.value = userState.userNickname;
  currentUserAvatar.value = userState.userAvatar;
  Object.assign(editForm, userState.formData);
};

const processAvatarUrl = (avatarUrl) => {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
  return processHomeAvatarUrl(avatarUrl, base);
};

const formatDateForInput = (dateString) => {
  return formatDateForInputInHome(dateString);
};

const handleConversationClick = (convId) => {
  console.log("HomeView: 收到会话点击事件，convId:", convId);

  const id = Number(convId);
  if (isNaN(id)) {
    console.error("无效的会话ID:", convId);
    return;
  }

  console.log("HomeView: 设置当前会话ID:", id);
  conversationStore.setCurrentConversation(id);
  currentMainView.value = null;
  selectedFriend.value = null;
};

const clearCurrentConversation = () => {
  conversationStore.clearCurrentConversation();
  currentMainView.value = null;
};

const handlePasswordSuccess = (message) => {
  backToAccountSecurity();
};

const handleUserDataUpdate = (backendUser) => {
  if (!backendUser) return;
  const normalized = normalizeBackendUserPayload(backendUser);

  Object.assign(editForm, {
    ...normalized,
    userBirthday: formatDateForInput(normalized.userBirthday),
  });
  userNickname.value = normalized.userNickname;
  currentUserAvatar.value = processAvatarUrl(normalized.userAvatar);

  const mergedUser = mergeUserToSessionFlow(normalized);
  authStore.user = mergedUser;
};

const handleEditSuccess = (message) => {
  exitEditMode();
};

const startNewChat = () => {
  const from = currentListView.value === "friends" ? "friends" : "chat";
  convCreateStore.enter(from, false);
  convCreateStore.setPanel("group");
  currentMainView.value = null;
  selectedFriend.value = null;
  conversationStore.clearCurrentConversation();
};

const handleLogout = async () => {
  try {
    await runHomeLogoutFlow({
      confirmLogout: () => confirm("确定要退出登录吗？"),
      resetConvCreate: () => convCreateStore.exit(true),
      resetNotification: () => notificationStore.reset(),
      resetConversation: () => conversationStore.resetConversations(),
      resetMessage: () => showMessageStore.resetMessages(),
      logoutAuth: () => authStore.logout(),
      goLogin: () => router.push("/"),
    });
  } catch (error) {
    console.error("? 登出失败:", error);
    alert("登出失败，请重试");
  }
};

onMounted(() => {
  loadUserData();
  console.log("HomeView mounted, initial list view:", currentListView.value);
  const uid = getAuthUserIdOr(Number(userId.value));
  if (Number.isFinite(uid) && uid > 0) {
    void appBootstrapStore.loadInitialData(uid);
  } else {
    toast.error("用户信息无效，请重新登录");
    void router.push("/");
    return;
  }

  loadSidebarWidth();
});
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/homeview.css";

@import "@/assets/styles/friend-list.css";
@import "@/assets/styles/friend-info.css";
@import "@/assets/styles/friend-item.css";
</style>
