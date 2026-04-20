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
            <span class="menu-icon">&#x1F4AC;</span>
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
            <span class="menu-icon">&#x1F465;</span>
          </button>

          <button
            class="nav-menu-item nav-menu-item--notif"
            @click="goToNotifications"
            v-ripple
            title="系统通知"
            :class="{ active: currentMainView === 'notifications' }"
          >
            <span class="menu-icon">&#x1F514;</span>
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
            <span class="menu-icon">&#x2795;</span>
          </button>
        </div>

        <div class="nav-bottom-menu">
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
            title="更多设置与帮助"
          >
            <span class="menu-icon">&#x2699;&#xFE0F;</span>
          </button>
          <button
            class="nav-menu-item logout-btn"
            @click="handleLogout"
            v-ripple
            title="退出登录"
          >
            <span class="menu-icon">&#x1F6AA;</span>
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

        <SystemNotificationContainer
          v-else-if="currentMainView === 'notifications'"
        />

        <ConvCreatePanel
          v-else-if="
            convCreateStore.active && convCreateStore.panel === 'group'
          "
          @exit="exitConvCreate"
          @created="handleGroupCreated"
        />

        <UserSearch
          v-else-if="
            convCreateStore.active && convCreateStore.panel === 'add-friend'
          "
          @exit="exitConvCreate"
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
import { useRouter } from "vue-router";
import { useThemeStore } from "@/stores/theme";
import { useAuthStore } from "@/stores/auth";
import { useConversationStore } from "@/stores/conv/show-conversation";
import { useShowMessageStore } from "@/stores/message/show-message";
import { useSendMessageStore } from "@/stores/message/send-message";
import { useConvCreateStore } from "@/stores/conv/conv-create";
import { useSystemNotificationsStore } from "@/stores/notification/system-notifications";
import { useSingleChatPeerAvatarStore } from "@/stores/conv/single-chat-peer-avatar";
import { useAppBootstrapStore } from "@/stores/app/bootstrap";
import UserProfileEdit from "@/components/UserProfileEdit.vue";
import MoreOptions from "@/components/MoreOptions.vue";
import ChangePassword from "@/components/ChangePassword.vue";
import ChatContainer from "@/components/ChatContainer.vue";
import ConversationList from "@/components/ConversationList.vue";
import FriendInfo from "@/components/FriendInfo.vue";
import FriendList from "@/components/FriendList.vue";
import ConvCreatePanel from "@/components/ConvCreatePanel.vue";
import UserSearch from "@/components/UserSearch.vue";
import FriendPickSidebar from "@/components/FriendPickSidebar.vue";
import SystemNotificationContainer from "@/components/SystemNotificationContainer.vue";
import SearchBar from "@/components/SearchBar.vue";
import toast from "@/commons/utils/toast";
import { conversationCreateApi } from "@/apis/chat/conversation-create";

import "@/assets/styles/homeview.css";
import "@/assets/styles/searchbar.css";
import "@/assets/styles/night/homeview-night.css";
import "@/assets/styles/night/searchbar-night.css";

const themeStore = useThemeStore();
const authStore = useAuthStore();
const conversationStore = useConversationStore();
const showMessageStore = useShowMessageStore();
const sendMessageStore = useSendMessageStore();
const convCreateStore = useConvCreateStore();
const notificationStore = useSystemNotificationsStore();
const singleChatPeerAvatarStore = useSingleChatPeerAvatarStore();
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
  e.preventDefault();
  isResizing.value = true;
  startX.value = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
  startWidth.value = sidebarWidth.value;

  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
  document.addEventListener("touchmove", handleResize);
  document.addEventListener("touchend", stopResize);

  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
};

const handleResize = (e) => {
  if (!isResizing.value) return;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(() => {
    const currentX = e.type.includes("touch")
      ? e.touches[0].clientX
      : e.clientX;
    const deltaX = currentX - startX.value;

    let newWidth = startWidth.value + deltaX;
    newWidth = Math.max(300, Math.min(600, newWidth));

    sidebarWidth.value = newWidth;
  });
};

const stopResize = () => {
  isResizing.value = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", handleResize);
  document.removeEventListener("touchend", stopResize);

  document.body.style.userSelect = "";
  document.body.style.cursor = "";

  saveSidebarWidth();
};

const saveSidebarWidth = () => {
  try {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.value.toString());
  } catch (error) {
    console.warn("无法保存侧边栏宽度到localStorage:", error);
  }
};

const loadSidebarWidth = () => {
  try {
    const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (!isNaN(width) && width >= 300 && width <= 600) {
        sidebarWidth.value = width;
      }
    }
  } catch (error) {
    console.warn("无法从localStorage加载侧边栏宽度:", error);
  }
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

const themeIcon = computed(() =>
  themeStore.isDarkMode ? "\u{1F31E}" : "\u{1F319}"
);
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
  if (c?.convType !== 1) return null;
  if (c.targetUserId != null && c.targetUserId > 0) return c.targetUserId;
  const myId = authStore.user?.userId;
  const messages = showMessageStore.messages || [];
  const otherIds = [
    ...new Set(
      messages.map((m) => m.senderId).filter((id) => id !== myId && id > 0)
    ),
  ];
  return otherIds.length > 0 ? otherIds[0] : null;
});

const notificationUnreadCount = computed(() => notificationStore.unreadCount);

const toggleTheme = () => {
  themeStore.toggleTheme();
};

const goToChat = () => {
  if (convCreateStore.active) {
    convCreateStore.exit();
  }
  console.log("点击聊天按钮，切换到聊天列表");
  currentListView.value = "chat";
  currentMainView.value = null;
  selectedFriend.value = null;
  conversationStore.clearCurrentConversation();
};

const goToFriends = () => {
  if (convCreateStore.active) {
    convCreateStore.exit();
  }
  console.log("切换到好友列表");
  currentListView.value = "friends";
  currentMainView.value = null;
  conversationStore.clearCurrentConversation();
};

const goToNotifications = () => {
  if (convCreateStore.active) {
    convCreateStore.exit();
  }
  currentListView.value = "chat";
  selectedFriend.value = null;
  conversationStore.clearCurrentConversation();
  currentMainView.value = "notifications";
  const uid = getAuthUserIdOr(Number(userId.value));
  if (Number.isFinite(uid) && uid > 0) {
    void appBootstrapStore.loadOne("notifications", uid);
  }
};

const exitConvCreate = () => {
  const restore = convCreateStore.savedListView;
  convCreateStore.exit();
  currentListView.value = restore;
  currentMainView.value = null;
  conversationStore.clearCurrentConversation();
  selectedFriend.value = null;
};

const openSingleChatWithPeerUserId = async (peerUserId) => {
  const pid = Number(peerUserId);
  if (!Number.isFinite(pid) || pid <= 0) {
    toast.error("无效的用户 ID");
    return false;
  }

  try {
    const resp = await conversationCreateApi.createConversation({
      single: true,
      memberUserIds: [pid],
    });

    if (resp.code !== 200 || !resp.data?.success || resp.data.convId == null) {
      toast.error(resp.message || resp.data?.message || "创建会话失败");
      return false;
    }

    const convId = Number(resp.data.convId);
    await conversationStore.refreshConversationById(convId);
    if (!conversationStore.getConversationById(convId)) {
      const loadResult = await appBootstrapStore.loadOne(
        "conversations",
        getAuthUserIdOr(0)
      );
      if (!loadResult.success) {
        throw new Error(loadResult.message || "加载会话失败");
      }
    }
    const conv = conversationStore.getConversationById(convId);
    if (!conv) {
      toast.error("会话已创建，但拉取会话详情失败，请稍后在会话列表中打开");
      return false;
    }

    if (conv.convType === 1 && pid > 0) {
      conversationStore.hydrateSingleChatPeerFromFriendList(convId, pid);
    }

    conversationStore.setCurrentConversation(convId);
    await showMessageStore.loadMessages(convId);
    conversationStore.markAsRead(convId);
    return true;
  } catch (e) {
    const msg =
      e?.response?.data?.message || e?.message || "创建会话失败，请稍后重试";
    toast.error(msg);
    return false;
  }
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
  convCreateStore.exit();
  currentListView.value = restore;
  currentMainView.value = null;
  selectedFriend.value = null;
};

const handleGroupCreated = async (convId) => {
  const id = Number(convId);
  if (Number.isNaN(id)) {
    toast.error("无效的会话 ID");
    return;
  }
  convCreateStore.exit();
  try {
    await conversationStore.refreshConversationById(id);
    if (!conversationStore.getConversationById(id)) {
      const loadResult = await appBootstrapStore.loadOne(
        "conversations",
        getAuthUserIdOr(0)
      );
      if (!loadResult.success) {
        throw new Error(loadResult.message || "加载会话失败");
      }
    }
    if (!conversationStore.getConversationById(id)) {
      toast.error("群聊已创建，但拉取会话详情失败，请稍后在列表中打开");
      return;
    }
    conversationStore.setCurrentConversation(id);
    await showMessageStore.loadMessages(id);
    conversationStore.markAsRead(id);
    currentListView.value = "chat";
    currentMainView.value = null;
    selectedFriend.value = null;
  } catch (e) {
    toast.error(e?.message || "打开群聊失败，请稍后重试");
  }
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

const handleAddFriend = () => {
  console.log("添加好友");
  // TODO
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

const handleDeleteFriend = (friend) => {
  if (
    confirm(`确定要删除好友「${friend.displayName || friend.nickname}」吗？`)
  ) {
    console.log("删除好友:", friend);
    // TODO
    clearSelectedFriend();
  }
};

const handleAvatarError = () => {
  console.log("头像加载失败，使用默认头像");
  avatarLoadError.value = true;
};

const loadUserData = () => {
  const userStr = sessionStorage.getItem("user");
  console.log("loadUserData调用, sessionStorage:", userStr);

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId.value = user.userId || "";
      userNickname.value = user.userNickname || "用户";

      let avatarUrl = user.userAvatar || "";
      avatarUrl = processAvatarUrl(avatarUrl);
      currentUserAvatar.value = avatarUrl;

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

  const pickFirstDefined = (...values) => {
    for (const v of values) {
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  const normalized = {
    userId: pickFirstDefined(backendUser.userId, backendUser.user_id),
    userNickname: pickFirstDefined(
      backendUser.userNickname,
      backendUser.user_nickname,
      "用户"
    ),
    userAvatar: pickFirstDefined(
      backendUser.userAvatar,
      backendUser.user_avatar,
      ""
    ),
    userGender: pickFirstDefined(
      backendUser.userGender,
      backendUser.user_gender,
      0
    ),
    userBirthday: pickFirstDefined(
      backendUser.userBirthday,
      backendUser.user_birthday,
      ""
    ),
    userLocation: pickFirstDefined(
      backendUser.userLocation,
      backendUser.user_location,
      ""
    ),
    userSignature: pickFirstDefined(
      backendUser.userSignature,
      backendUser.user_signature,
      ""
    ),
    userPhone: pickFirstDefined(
      backendUser.userPhone,
      backendUser.user_phone,
      ""
    ),
    userEmail: pickFirstDefined(
      backendUser.userEmail,
      backendUser.user_email,
      ""
    ),
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

const startNewChat = () => {
  const from = currentListView.value === "friends" ? "friends" : "chat";
  convCreateStore.enter(from);
  currentMainView.value = null;
  selectedFriend.value = null;
  conversationStore.clearCurrentConversation();
};

const handleLogout = async () => {
  if (confirm("确定要退出登录吗？")) {
    try {
      console.log("? 开始登出流程...");

      console.log("? 清理会话数据...");
      convCreateStore.exit();
      notificationStore.reset();
      singleChatPeerAvatarStore.reset();
      conversationStore.resetConversations();
      showMessageStore.resetMessages();

      console.log("? 清除认证状态...");
      authStore.logout();

      console.log("? 跳转到登录页...");
      router.push("/");
    } catch (error) {
      console.error("? 登出失败:", error);
      alert("登出失败，请重试");
    }
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
