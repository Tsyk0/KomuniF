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
        <!-- 用户资料编辑界面 -->
        <div v-if="isEditingProfile" class="profile-edit-container">
          <div class="edit-header">
            <button class="back-btn" @click="exitEditMode" v-ripple>
              <span>←</span> 返回
            </button>
            <h2>编辑个人资料</h2>
            <button
              class="save-btn"
              @click="saveProfile"
              :disabled="saving"
              v-ripple="{ color: 'rgba(0, 119, 230, 0.3)', duration: 600 }"
            >
              {{ saving ? "保存中..." : "保存" }}
            </button>
          </div>

          <div class="edit-content">
            <!-- 左半部分：头像区域 -->
            <div class="avatar-section">
              <div class="avatar-display" @click="triggerAvatarUpload">
                <div v-if="editForm.userAvatar" class="avatar-img-container">
                  <img :src="editForm.userAvatar" class="avatar-img" />
                  <div class="avatar-overlay"></div>
                </div>
                <div v-else class="avatar-placeholder-large">
                  {{ editForm.userNickname?.charAt(0) || " " }}
                  <div class="upload-hint">点击上传头像</div>
                </div>
              </div>

              <input
                type="file"
                ref="avatarInput"
                accept="image/*"
                @change="handleAvatarUpload"
                style="display: none"
              />

              <div class="avatar-info">
                <p class="avatar-hint">支持 JPG、PNG 格式</p>
                <p class="avatar-hint">最大 2MB</p>
                <p class="avatar-hint">点击头像选择图片</p>
              </div>
            </div>

            <!-- 右半部分：基本信息表单 -->
            <div class="form-section">
              <div class="form-group">
                <label for="userNickname">昵称 *</label>
                <input
                  id="userNickname"
                  v-model="editForm.userNickname"
                  type="text"
                  placeholder="请输入昵称"
                  class="el-input"
                  maxlength="20"
                />
                <div class="char-count">
                  {{ editForm.userNickname?.length || 0 }}/20
                </div>
              </div>

              <div class="form-group">
                <label for="userGender">性别</label>
                <div class="gender-options">
                  <label
                    class="gender-option"
                    :class="{ active: editForm.userGender === 0 }"
                  >
                    <input
                      type="radio"
                      v-model="editForm.userGender"
                      :value="0"
                      style="display: none"
                    />
                    <span class="gender-icon">⚪</span>
                    <span>未知</span>
                  </label>
                  <label
                    class="gender-option"
                    :class="{ active: editForm.userGender === 1 }"
                  >
                    <input
                      type="radio"
                      v-model="editForm.userGender"
                      :value="1"
                      style="display: none"
                    />
                    <span class="gender-icon">♂️</span>
                    <span>男</span>
                  </label>
                  <label
                    class="gender-option"
                    :class="{ active: editForm.userGender === 2 }"
                  >
                    <input
                      type="radio"
                      v-model="editForm.userGender"
                      :value="2"
                      style="display: none"
                    />
                    <span class="gender-icon">♀️</span>
                    <span>女</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label for="userBirthday">生日</label>
                <input
                  id="userBirthday"
                  v-model="editForm.userBirthday"
                  type="date"
                  class="el-input"
                />
              </div>

              <div class="form-group">
                <label for="userLocation">所在地</label>
                <input
                  id="userLocation"
                  v-model="editForm.userLocation"
                  type="text"
                  placeholder="请输入所在地"
                  class="el-input"
                  maxlength="50"
                />
              </div>

              <div class="form-group">
                <label for="userSignature">个性签名</label>
                <textarea
                  id="userSignature"
                  v-model="editForm.userSignature"
                  placeholder="介绍一下自己吧～"
                  class="el-textarea"
                  rows="3"
                  maxlength="100"
                ></textarea>
                <div class="char-count">
                  {{ editForm.userSignature?.length || 0 }}/100
                </div>
              </div>

              <div class="form-group">
                <label for="userPhone">手机号</label>
                <input
                  id="userPhone"
                  v-model="editForm.userPhone"
                  type="tel"
                  placeholder="请输入手机号"
                  class="el-input"
                  maxlength="11"
                />
              </div>

              <div class="form-group">
                <label for="userEmail">邮箱</label>
                <input
                  id="userEmail"
                  v-model="editForm.userEmail"
                  type="email"
                  placeholder="请输入邮箱"
                  class="el-input"
                  maxlength="50"
                />
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button class="cancel-btn" @click="resetForm" v-ripple>
              <span class="btn-icon">↺</span>
              重置
            </button>
          </div>
        </div>

        <!-- 更多选项菜单 -->
        <div v-else-if="showMoreMenu" class="more-options-container">
          <div class="more-options-header">
            <button class="back-btn" @click="backToMainMenu" v-ripple>
              <span>←</span> 返回
            </button>
            <h2>更多选项</h2>
          </div>

          <div class="more-options-content">
            <!-- 主菜单 -->
            <div v-if="!currentSubMenu" class="options-list">
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
              <button
                class="option-btn"
                @click="showNotificationSettings"
                v-ripple
              >
                <span class="option-icon">🔔</span>
                <span class="option-text">通知设置</span>
                <span class="option-arrow">→</span>
              </button>
            </div>

            <!-- 账号安全子菜单 -->
            <div v-else-if="currentSubMenu === 'account'" class="options-list">
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

            <!-- 修改密码界面 -->
            <div
              v-else-if="currentSubMenu === 'changePassword'"
              class="change-password-container"
            >
              <div class="change-password-header">
                <button class="back-btn" @click="backToAccountMenu" v-ripple>
                  <span>←</span> 返回
                </button>
                <h2>修改密码</h2>
              </div>

              <div class="change-password-form">
                <div class="form-group">
                  <label for="currentNickname">当前用户</label>
                  <input
                    id="currentNickname"
                    type="text"
                    :value="userNickname"
                    class="el-input disabled"
                    disabled
                    placeholder="当前用户名"
                  />
                </div>

                <div class="form-group">
                  <label for="currentPassword">原密码 *</label>
                  <input
                    id="currentPassword"
                    v-model="passwordForm.currentPassword"
                    type="password"
                    placeholder="请输入原密码"
                    class="el-input"
                    @input="clearPasswordError"
                  />
                  <div v-if="passwordError" class="error-message">
                    {{ passwordError }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="newPassword">新密码 *</label>
                  <input
                    id="newPassword"
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    class="el-input"
                    @input="clearPasswordError"
                  />
                </div>

                <div class="form-group">
                  <label for="confirmPassword">确认新密码 *</label>
                  <input
                    id="confirmPassword"
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    class="el-input"
                    @input="clearPasswordError"
                  />
                  <div v-if="passwordMismatch" class="error-message">
                    两次输入的新密码不一致
                  </div>
                </div>

                <div class="password-requirements">
                  <p>密码要求：</p>
                  <ul>
                    <li>至少6个字符</li>
                    <li>建议包含字母、数字和特殊字符</li>
                  </ul>
                </div>

                <button
                  class="submit-btn"
                  @click="handleChangePassword"
                  :disabled="changingPassword || !isPasswordFormValid"
                  v-ripple
                >
                  {{ changingPassword ? "处理中..." : "修改密码" }}
                </button>
              </div>
            </div>
          </div>
        </div>

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
        © 2024
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

<!-- script 部分保持不变 -->

<script>
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useAuthStore } from "@/stores/auth";

export default {
  name: "HomeView",
  data() {
    return {
      userId: "",
      userNickname: "用户",
      lastLoginTime: "",
      isEditingProfile: false,
      saving: false,
      currentUserAvatar: "", // 新增：专门用于左侧显示的头像
      // 编辑表单数据
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
      // 原始数据备份（用于重置）
      originalUserData: null,
      avatarLoadError: false, // 新增：头像加载错误标志

      // 新增：修改密码相关数据
      showMoreMenu: false,
      currentSubMenu: "", // 'account', 'changePassword'等
      changingPassword: false,
      passwordError: "",
      passwordMismatch: false,
      showSuccessMessage: false, // 修改变量名，避免冲突
      successMessage: "",
      passwordForm: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    };
  },
  computed: {
    // 新增：密码表单验证
    isPasswordFormValid() {
      return (
        this.passwordForm.currentPassword &&
        this.passwordForm.newPassword &&
        this.passwordForm.confirmPassword &&
        this.passwordForm.newPassword === this.passwordForm.confirmPassword &&
        this.passwordForm.newPassword.length >= 6
      );
    },
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

    // 在 HomeView.vue 中修改 loadUserData 方法
    loadUserData() {
      const userStr = sessionStorage.getItem("user");
      console.log("loadUserData调用, sessionStorage:", userStr);

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.userId = user.userId || "";
          this.userNickname = user.userNickname || "用户";
          this.lastLoginTime = user.lastLoginTime || "";

          // 处理头像URL - 优化逻辑
          let avatarUrl = user.userAvatar || "";
          console.log("原始头像路径:", avatarUrl);

          // 统一头像URL处理逻辑
          avatarUrl = this.processAvatarUrl(avatarUrl);
          console.log("处理后头像URL:", avatarUrl);

          // 更新左侧头像
          this.currentUserAvatar = avatarUrl;
          console.log("设置currentUserAvatar:", this.currentUserAvatar);

          // 初始化编辑表单 - 使用处理后的头像URL
          this.editForm = {
            userId: user.userId || "",
            userNickname: user.userNickname || "",
            userAvatar: avatarUrl, // 使用处理后的URL
            userGender: user.userGender || 0,
            userBirthday: this.formatDateForInput(user.userBirthday),
            userLocation: user.userLocation || "",
            userSignature: user.userSignature || "",
            userPhone: user.userPhone || "",
            userEmail: user.userEmail || "",
          };

          // 保存原始数据用于重置
          this.originalUserData = JSON.parse(JSON.stringify(this.editForm));

          console.log("用户数据加载完成");
        } catch (e) {
          console.error("解析用户信息失败:", e);
        }
      } else {
        console.log("sessionStorage中没有用户数据");
      }
    },

    // 新增辅助方法：处理头像URL
    processAvatarUrl(avatarUrl) {
      if (!avatarUrl || avatarUrl === "") {
        return "";
      }

      // 如果已经是完整URL或base64格式，直接返回
      if (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:image/")) {
        return avatarUrl;
      }

      // 清理路径
      avatarUrl = avatarUrl.trim();

      // 确保路径以斜杠开头
      if (!avatarUrl.startsWith("/")) {
        avatarUrl = "/" + avatarUrl;
      }

      // 拼接完整URL
      return "http://localhost:8081" + avatarUrl;
    },

    formatDateForInput(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    },

    // 图片压缩方法
    compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.7) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedBase64);
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    // 验证表单
    validateForm() {
      if (!this.editForm.userNickname?.trim()) {
        alert("昵称不能为空");
        return false;
      }

      if (
        this.editForm.userPhone &&
        !/^1[3-9]\d{9}$/.test(this.editForm.userPhone)
      ) {
        alert("请输入有效的手机号");
        return false;
      }

      if (
        this.editForm.userEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editForm.userEmail)
      ) {
        alert("请输入有效的邮箱地址");
        return false;
      }

      return true;
    },

    // 在 HomeView.vue 中修改 saveProfile 方法
    async saveProfile() {
      if (!this.validateForm()) {
        return;
      }

      this.saving = true;
      console.log("开始保存资料...");

      try {
        const userUpdateData = {
          userId: this.editForm.userId,
          userNickname: this.editForm.userNickname?.trim(),
          userGender: this.editForm.userGender,
          userBirthday: this.editForm.userBirthday || null,
          userLocation: this.editForm.userLocation?.trim() || null,
          userSignature: this.editForm.userSignature?.trim() || null,
          userPhone: this.editForm.userPhone?.trim() || null,
          userEmail: this.editForm.userEmail?.trim() || null,
        };

        // 如果有base64格式的头像，添加到更新数据中
        if (
          this.editForm.userAvatar &&
          this.editForm.userAvatar.startsWith("data:image/")
        ) {
          userUpdateData.userAvatar = this.editForm.userAvatar;
          console.log("包含base64头像，长度:", this.editForm.userAvatar.length);
        }

        console.log("提交数据到后端");

        // 1. 调用更新接口
        const userResult = await this.userStore.updateUser(userUpdateData);

        if (!userResult.success) {
          alert("更新用户信息失败: " + userResult.message);
          return;
        }

        console.log("后端更新成功，开始获取最新的用户信息");

        // 2. 调用API获取最新的用户信息
        const latestUserResult = await this.userStore.fetchUserById(
          this.editForm.userId
        );

        if (!latestUserResult.success) {
          console.warn("获取最新用户信息失败:", latestUserResult.message);
          alert("更新成功，但获取最新信息失败，部分信息可能不会立即显示");
        } else {
          // 3. 用最新的数据更新sessionStorage和界面
          await this.syncUserData(latestUserResult.data);
        }

        // this.exitEditMode();
      } catch (error) {
        console.error("保存资料失败:", error);
        alert("保存失败，请稍后重试");
      } finally {
        this.saving = false;
      }
    },

    // 新增方法：同步用户数据到sessionStorage和界面
    async syncUserData(latestUserData) {
      try {
        console.log("开始同步用户数据:", latestUserData);

        // 获取当前sessionStorage中的数据
        const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

        // 更新为新数据（使用后端返回的最新数据）
        const updatedUser = {
          ...currentUser,
          // 覆盖所有可能更新的字段
          userId: latestUserData.userId,
          userNickname: latestUserData.userNickname,
          userAvatar: latestUserData.userAvatar, // 关键：使用服务器返回的头像路径
          userGender: latestUserData.userGender,
          userBirthday: latestUserData.userBirthday,
          userLocation: latestUserData.userLocation,
          userSignature: latestUserData.userSignature,
          userPhone: latestUserData.userPhone,
          userEmail: latestUserData.userEmail,
          userStatus: latestUserData.userStatus,
          onlineStatus: latestUserData.onlineStatus,
          lastLoginTime: latestUserData.lastLoginTime,
          updateTime: latestUserData.updateTime,
        };

        // 保存到sessionStorage
        sessionStorage.setItem("user", JSON.stringify(updatedUser));

        // 更新组件数据
        this.userId = updatedUser.userId;
        this.userNickname = updatedUser.userNickname;
        this.lastLoginTime = updatedUser.lastLoginTime;

        // 使用统一的头像处理方法
        const avatarUrl = this.processAvatarUrl(updatedUser.userAvatar);

        // 更新左侧头像
        this.currentUserAvatar = avatarUrl;
        console.log("左侧头像已更新:", this.currentUserAvatar);

        // 同时更新编辑表单中的头像（避免下次编辑时显示旧数据）
        this.editForm.userAvatar = avatarUrl;

        // 重置头像错误标志
        this.avatarLoadError = false;

        console.log("用户数据同步完成");
        return true;
      } catch (error) {
        console.error("同步用户数据失败:", error);
        return false;
      }
    },

    // 新增方法：获取最新的用户信息
    async fetchLatestUserInfo(userId) {
      try {
        console.log("获取最新的用户信息，用户ID:", userId);

        // 使用axios或其他HTTP客户端进行GET请求
        const response = await this.$http.get(
          `/user/selectUserByUserId?userId=${userId}`
        );

        if (response.data.code === 200) {
          console.log("获取最新用户信息成功:", response.data.data);
          return response.data.data;
        } else {
          console.error("获取用户信息失败:", response.data.message);
          return null;
        }
      } catch (error) {
        console.error("获取用户信息异常:", error);
        return null;
      }
    },

    // 新增方法：同步用户数据到sessionStorage
    syncUserDataToSessionStorage(userData) {
      try {
        // 获取当前sessionStorage中的数据
        const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

        // 更新为新数据
        const updatedUser = {
          ...currentUser,
          userId: userData.userId,
          userNickname: userData.userNickname,
          userAvatar: userData.userAvatar,
          userGender: userData.userGender,
          userBirthday: userData.userBirthday,
          userLocation: userData.userLocation,
          userSignature: userData.userSignature,
          userPhone: userData.userPhone,
          userEmail: userData.userEmail,
          userStatus: userData.userStatus,
          onlineStatus: userData.onlineStatus,
          lastLoginTime: userData.lastLoginTime,
          updateTime: userData.updateTime,
        };

        // 保存到sessionStorage
        sessionStorage.setItem("user", JSON.stringify(updatedUser));

        // 更新组件数据
        this.userId = updatedUser.userId;
        this.userNickname = updatedUser.userNickname;
        this.lastLoginTime = updatedUser.lastLoginTime;

        // 处理头像URL
        let avatarUrl = updatedUser.userAvatar || "";
        if (
          avatarUrl &&
          !avatarUrl.startsWith("http") &&
          !avatarUrl.startsWith("data:image")
        ) {
          avatarUrl = avatarUrl.trim();
          if (!avatarUrl.startsWith("/")) {
            avatarUrl = "/" + avatarUrl;
          }
          avatarUrl = "http://localhost:8081" + avatarUrl;
        }

        // 更新左侧头像
        this.currentUserAvatar = avatarUrl;

        console.log("用户数据同步完成:", {
          userId: updatedUser.userId,
          nickname: updatedUser.userNickname,
          avatar: avatarUrl,
        });

        return true;
      } catch (error) {
        console.error("同步用户数据失败:", error);
        return false;
      }
    },

    // 触发头像上传
    triggerAvatarUpload() {
      this.$refs.avatarInput.click();
    },

    // 处理头像上传
    async handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        alert("图片大小不能超过2MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
      }

      try {
        this.saving = true;
        console.log("开始压缩图片...");

        const compressedBase64 = await this.compressImage(file, 400, 400, 0.7);

        console.log("图片压缩完成，base64长度:", compressedBase64.length);

        // 更新编辑表单中的头像（base64格式）
        this.editForm.userAvatar = compressedBase64;

        // 注意：这里不更新currentUserAvatar，因为还是base64
        // 等保存成功后，后端会返回URL，再更新
      } catch (error) {
        console.error("图片处理失败:", error);
        alert("图片处理失败，请重试");
      } finally {
        this.saving = false;
        event.target.value = "";
      }
    },

    // 进入编辑模式
    enterEditMode() {
      this.isEditingProfile = true;
      console.log("进入编辑模式");
      this.loadUserData();
    },

    // 退出编辑模式
    exitEditMode() {
      this.isEditingProfile = false;
      console.log("退出编辑模式");
    },

    // 重置表单
    resetForm() {
      if (confirm("确定要重置所有修改吗？")) {
        this.editForm = JSON.parse(JSON.stringify(this.originalUserData));
        console.log("表单已重置");
      }
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

        // 测试URL访问
        if (user.userAvatar && user.userAvatar.startsWith("/")) {
          const testUrl = "http://localhost:8081" + user.userAvatar;
          console.log("5. 测试URL:", testUrl);
          window.open(testUrl, "_blank");
        }
      }
    },

    // ============ 新增：修改密码相关方法 ============

    // 显示更多选项
    showMoreOptions() {
      this.showMoreMenu = true;
      this.currentSubMenu = "";
      this.isEditingProfile = false; // 确保退出编辑模式
    },

    // 返回主菜单
    backToMainMenu() {
      this.showMoreMenu = false;
      this.currentSubMenu = "";
    },

    // 返回账号菜单
    backToAccountMenu() {
      this.currentSubMenu = "account";
      this.resetPasswordForm();
    },

    // 显示账号安全菜单
    showAccountSecurity() {
      this.currentSubMenu = "account";
    },

    // 显示修改密码界面
    showChangePassword() {
      this.currentSubMenu = "changePassword";
      this.resetPasswordForm();
    },

    // 重置密码表单
    resetPasswordForm() {
      this.passwordForm = {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
      this.passwordError = "";
      this.passwordMismatch = false;
    },

    // 清除密码错误
    clearPasswordError() {
      this.passwordError = "";
      this.passwordMismatch = false;
    },

    // 显示成功提示 - 修正变量名冲突
    showSuccessToast(message) {
      this.successMessage = message;
      this.showSuccessMessage = true; // 使用新的变量名

      // 3秒后自动隐藏
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    },

    // 处理修改密码
    async handleChangePassword() {
      // 验证表单
      if (!this.isPasswordFormValid) {
        if (
          this.passwordForm.newPassword !== this.passwordForm.confirmPassword
        ) {
          this.passwordMismatch = true;
        }
        return;
      }

      this.changingPassword = true;
      this.passwordError = "";

      try {
        console.log("开始验证原密码...");

        // 1. 验证原密码
        const checkResponse = await this.checkCurrentPassword(
          this.userId,
          this.passwordForm.currentPassword
        );

        if (!checkResponse.success) {
          this.passwordError = checkResponse.message;
          return;
        }

        console.log("原密码验证成功，开始更新密码...");

        // 2. 更新密码
        const updateResponse = await this.updatePassword(
          this.userId,
          this.passwordForm.newPassword
        );

        if (updateResponse.success) {
          // 显示成功提示 - 现在可以正常调用了
          this.showSuccessToast("密码修改成功！");

          // 重置表单
          this.resetPasswordForm();

          // 延迟返回主菜单
          setTimeout(() => {
            this.backToMainMenu();
          }, 1500);
        } else {
          this.passwordError = updateResponse.message;
        }
      } catch (error) {
        console.error("修改密码失败:", error);
        this.passwordError = "修改密码失败，请稍后重试";
      } finally {
        this.changingPassword = false;
      }
    },

    // 验证原密码
    // 修改 checkCurrentPassword 方法
    async checkCurrentPassword(userId, currentPassword) {
      try {
        // 改为使用 store 方法
        const result = await this.userStore.checkUserPassword(
          userId,
          currentPassword
        );
        return result;
      } catch (error) {
        console.error("验证原密码失败:", error);
        return {
          success: false,
          message: "验证原密码失败，请检查网络连接",
        };
      }
    },

    // 修改 updatePassword 方法
    async updatePassword(userId, newPassword) {
      try {
        // 改为使用 store 方法
        const result = await this.userStore.updateUserPassword(
          userId,
          newPassword
        );
        return result;
      } catch (error) {
        console.error("更新密码失败:", error);
        return {
          success: false,
          message: "更新密码失败，请稍后重试",
        };
      }
    },
    // 占位方法（其他菜单项）
    showPrivacySettings() {
      alert("隐私设置功能开发中...");
    },

    showNotificationSettings() {
      alert("通知设置功能开发中...");
    },

    showLoginDevices() {
      alert("登录设备管理功能开发中...");
    },

    showTwoFactorAuth() {
      alert("双重验证功能开发中...");
    },
  },
};
</script>

<style scoped>
/* 引入外置CSS */
@import "@/assets/styles/homeview.css";
</style>