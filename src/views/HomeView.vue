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
        <button class="nav-btn" @click="handleLogout">
          <span class="nav-icon">🚪</span> 退出
        </button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content-wrapper">
      <!-- 左侧会话列表区域 -->
      <div class="conversation-sidebar">
        <div class="sidebar-header">
          <!-- 可点击的用户资料区域 -->
          <div class="user-profile" @click="enterEditMode">
            <div class="avatar-placeholder">
              {{ userNickname.charAt(0) }}
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
            <button class="back-btn" @click="exitEditMode">
              <span>←</span> 返回
            </button>
            <h2>编辑个人资料</h2>
            <button class="save-btn" @click="saveProfile" :disabled="saving">
              {{ saving ? "保存中..." : "保存" }}
            </button>
          </div>

          <div class="edit-content">
            <!-- 基本信息表单 -->
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

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="cancel-btn" @click="resetForm">
                <span class="btn-icon">↺</span>
                重置
              </button>
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
  </div>
</template>

<script>
import { useRouter } from "vue-router";
import { useUpdateStore } from "@/stores/update";
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
      // 编辑表单数据
      editForm: {
        userId: "",
        userNickname: "",
        userGender: 0,
        userBirthday: "",
        userLocation: "",
        userSignature: "",
        userPhone: "",
        userEmail: "",
      },
      // 原始数据备份（用于重置）
      originalUserData: null,
    };
  },
  mounted() {
    this.loadUserData();
  },
  setup() {
    const updateStore = useUpdateStore();
    const authStore = useAuthStore();
    const router = useRouter();
    return { updateStore, authStore, router };
  },
  methods: {
    loadUserData() {
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.userId = user.userId || "";
          this.userNickname = user.userNickname || "用户";
          this.lastLoginTime = user.lastLoginTime || "";

          // 初始化编辑表单
          this.editForm = {
            userId: user.userId || "",
            userNickname: user.userNickname || "",
            userGender: user.userGender || 0,
            userBirthday: this.formatDateForInput(user.userBirthday),
            userLocation: user.userLocation || "",
            userSignature: user.userSignature || "",
            userPhone: user.userPhone || "",
            userEmail: user.userEmail || "",
          };

          // 保存原始数据用于重置
          this.originalUserData = JSON.parse(JSON.stringify(this.editForm));
        } catch (e) {
          console.error("解析用户信息失败:", e);
        }
      }
    },

    formatDateForInput(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    },

    // 验证表单
    validateForm() {
      // 昵称验证
      if (!this.editForm.userNickname?.trim()) {
        alert("昵称不能为空");
        return false;
      }

      // 手机号验证（如果填写了）
      if (
        this.editForm.userPhone &&
        !/^1[3-9]\d{9}$/.test(this.editForm.userPhone)
      ) {
        alert("请输入有效的手机号");
        return false;
      }

      // 邮箱验证（如果填写了）
      if (
        this.editForm.userEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editForm.userEmail)
      ) {
        alert("请输入有效的邮箱地址");
        return false;
      }

      return true;
    },

    async saveProfile() {
      if (!this.validateForm()) {
        return;
      }

      this.saving = true;

      try {
        // 准备用户信息更新数据
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

        console.log("📤 提交用户数据:", userUpdateData);

        // 1. 先更新用户基本信息
        const userResult = await this.updateStore.updateUser(userUpdateData);

        if (!userResult.success) {
          alert("更新用户信息失败: " + userResult.message);
          return;
        }

        // 3. 更新本地存储的用户信息
        const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, ...userUpdateData };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));

        // 4. 更新显示的数据
        this.userNickname = updatedUser.userNickname;
        this.loadUserData(); // 重新加载数据

        this.exitEditMode();
      } catch (error) {
        console.error("保存资料失败:", error);
        alert("保存失败，请稍后重试");
      } finally {
        this.saving = false;
      }
    },

    // 进入编辑模式
    enterEditMode() {
      this.isEditingProfile = true;
      this.loadUserData();
    },

    // 退出编辑模式
    exitEditMode() {
      this.isEditingProfile = false;
    },

    // 重置表单
    resetForm() {
      if (confirm("确定要重置所有修改吗？")) {
        this.editForm = JSON.parse(JSON.stringify(this.originalUserData));
        // 清空密码字段
        this.editForm.currentPassword = "";
        this.editForm.newPassword = "";
        this.editForm.confirmPassword = "";
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
  },
};
</script>



<style scoped>
/* 整体容器 */
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.top-navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-title {
  color: #007aff;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-user {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.status-indicator {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(76, 217, 100, 0.1);
  color: #4cd964;
}

.status-indicator.online {
  background: rgba(76, 217, 100, 0.1);
  color: #4cd964;
}

.nav-right {
  display: flex;
  gap: 10px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-btn:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.nav-icon {
  font-size: 18px;
}

.logout-btn {
  background: #ffebee;
}

.logout-btn:hover {
  background: #ffcdd2;
}

/* 主内容区域 */
.main-content-wrapper {
  flex: 1;
  margin-left: 200px;
  margin-right: 200px;
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

/* 左侧会话列表 */
.conversation-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

/* 用户资料区域 - 可点击样式 */
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.user-profile:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.08),
    rgba(0, 122, 255, 0.12)
  );
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.1);
}

.user-profile:hover .avatar-placeholder {
  transform: scale(1.05);
}

.user-profile:hover .user-name {
  color: #007aff;
}

.user-profile:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.1);
}

.user-profile::after {
  content: "✏️";
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 14px;
}

.user-profile:hover::after {
  opacity: 1;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  transition: transform 0.3s ease;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.user-status {
  font-size: 12px;
  color: #666;
}

.user-status.online {
  color: #4cd964;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  background: #f8f9fa;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #007aff;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.empty-conversation {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-weight: 600;
  margin-bottom: 8px;
  color: #666;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

/* 会话条区域标注 */
.conversation-area-label {
  background: linear-gradient(135deg, #f8f9fa, #f1f3f5);
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.label-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.label-icon {
  font-size: 20px;
  color: #007aff;
}

.label-text {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.label-description {
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
  line-height: 1.5;
}

.label-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.label-features li {
  color: #666;
  font-size: 13px;
  padding: 4px 0;
  padding-left: 20px;
  position: relative;
}

.label-features li:before {
  content: "•";
  position: absolute;
  left: 8px;
  color: #007aff;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.new-chat-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
}

.new-chat-btn:hover {
  background: linear-gradient(135deg, #0056cc, #004099);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.btn-icon {
  font-size: 20px;
  font-weight: 600;
}

/* 右侧聊天区域 */
.chat-main-area {
  flex: 1;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 聊天区域标注 */
.chat-area-label {
  max-width: 500px;
  text-align: center;
  padding: 40px;
}

.chat-label-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
}

.chat-label-icon {
  font-size: 36px;
  color: #007aff;
}

.chat-label-text {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.chat-label-description {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

.chat-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.feature-item:hover {
  transform: translateY(-2px);
}

.feature-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #007aff, #0056cc);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.feature-desc h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  text-align: left;
}

.feature-desc p {
  margin: 0;
  color: #666;
  font-size: 14px;
  text-align: left;
}

/* 底部信息栏 */
.bottom-info-bar {
  background: rgba(0, 0, 0, 0.2);
  color: white;
  padding: 12px 20px;
  text-align: center;
  font-size: 12px;
  backdrop-filter: blur(10px);
}

.bottom-info-bar p {
  margin: 0;
  opacity: 0.8;
}

/* 用户资料编辑界面样式 */
.profile-edit-container {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
}

.edit-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f8f9fa, #f1f3f5);
}

.edit-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.back-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.back-btn:hover {
  background: #f8f9fa;
  border-color: #007aff;
  color: #007aff;
}

.save-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056cc, #004099);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.avatar-edit-section {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar-placeholder-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.avatar-img-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  padding: 10px 20px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.upload-btn:hover {
  background: #e9ecef;
  border-color: #007aff;
  color: #007aff;
}

.avatar-hint {
  font-size: 12px;
  color: #95a5a6;
  margin: 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 500px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.el-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.el-input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.el-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.3s;
}

.el-textarea:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.char-count {
  font-size: 12px;
  color: #95a5a6;
  text-align: right;
}

.hint {
  font-size: 12px;
  color: #95a5a6;
}

.gender-options {
  display: flex;
  gap: 15px;
}

.gender-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.gender-option:hover {
  border-color: #007aff;
  background: rgba(0, 122, 255, 0.05);
}

.gender-option.active {
  border-color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.gender-icon {
  font-size: 18px;
}

.password-edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn,
.logout-btn {
  flex: 1;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.cancel-btn {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  color: #666;
}

.cancel-btn:hover {
  background: #e9ecef;
  border-color: #ff3b30;
  color: #ff3b30;
}

.logout-btn {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  color: #ff3b30;
}

.logout-btn:hover {
  background: #ffcdd2;
  border-color: #ff3b30;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
}

.btn-icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content-wrapper {
    margin: 10px;
  }

  .conversation-sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .main-content-wrapper {
    flex-direction: column;
  }

  .conversation-sidebar {
    width: 100%;
    height: 40vh;
  }

  .chat-main-area {
    height: 60vh;
  }

  .edit-content {
    padding: 20px;
  }

  .avatar-edit-section {
    flex-direction: column;
    text-align: center;
  }

  .gender-options {
    flex-wrap: wrap;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>