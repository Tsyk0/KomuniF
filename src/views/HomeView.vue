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
        <button class="nav-btn" @click="showSettings">
          <span class="nav-icon">⚙️</span>
        </button>
        <button class="nav-btn logout-btn" @click="handleLogout">
          <span class="nav-icon">🚪</span>
        </button>
      </div>
    </div>

    <!-- 主内容区域 - 两端留紫色渐变背景 -->
    <div class="main-content-wrapper">
      <!-- 左侧会话列表区域 -->
      <div class="conversation-sidebar">
        <div class="sidebar-header">
          <div class="user-profile">
            <div class="avatar-placeholder">
              {{ userNickname.charAt(0) }}
            </div>
            <div class="user-info">
              <div class="user-name">{{ userNickname }}</div>
              <div class="user-status online">在线</div>
            </div>
          </div>
          <div class="search-box">
            <input type="text" placeholder="搜索会话..." class="search-input" />
            <span class="search-icon">🔍</span>
          </div>
        </div>

        <div class="conversation-list">
          <div class="section-title">会话列表</div>
          <div class="empty-conversation">
            <div class="empty-icon">💬</div>
            <p class="empty-text">暂无会话</p>
            <p class="empty-hint">开始新的对话或等待好友消息</p>
          </div>
          <!-- 会话条区域 -->
          <div class="conversation-area-label">
            <div class="label-header">
              <span class="label-icon">📋</span>
              <span class="label-text">会话条区域</span>
            </div>
            <p class="label-description">
              这里将显示所有会话列表，每个会话包含：
            </p>
            <ul class="label-features">
              <li>• 好友头像和昵称</li>
              <li>• 最后一条消息预览</li>
              <li>• 未读消息数量</li>
              <li>• 最后消息时间</li>
            </ul>
          </div>
        </div>

        <div class="sidebar-footer">
          <button class="new-chat-btn" @click="startNewChat">
            <span class="btn-icon">+</span>
            <span class="btn-text">新建聊天</span>
          </button>
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div class="chat-main-area">
        <div class="chat-area-label">
          <div class="chat-label-header">
            <span class="chat-label-icon">💭</span>
            <span class="chat-label-text">聊天区域</span>
          </div>
          <div class="chat-label-content">
            <p class="chat-label-description">这里将显示选中的聊天会话：</p>
            <div class="chat-features">
              <div class="feature-item">
                <div class="feature-icon">👤</div>
                <div class="feature-desc">
                  <h4>聊天头部</h4>
                  <p>显示对方信息、在线状态和功能按钮</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">💬</div>
                <div class="feature-desc">
                  <h4>消息区域</h4>
                  <p>显示双方的聊天记录，支持文本、图片、文件</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">⌨️</div>
                <div class="feature-desc">
                  <h4>输入区域</h4>
                  <p>发送消息、表情、附件和语音消息</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- <div class="welcome-message">
          <div class="welcome-icon">👋</div>
          <h2 class="welcome-title">欢迎使用 Komuni</h2>
          <p class="welcome-text">选择一个会话开始聊天，或创建新的对话</p>
          <div class="quick-actions">
            <button class="action-btn" @click="startNewChat">
              <span class="action-icon">➕</span>
              <span>新建聊天</span>
            </button>
            <button class="action-btn" @click="showContacts">
              <span class="action-icon">👥</span>
              <span>查看联系人</span>
            </button>
          </div>
        </div> -->
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

export default {
  name: "HomeView",
  data() {
    return {
      userId: "",
      userNickname: "用户",
      lastLoginTime: "",
    };
  },
  mounted() {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userId = user.userId || "";
        this.userNickname = user.userNickname || "用户";
        this.lastLoginTime = user.lastLoginTime || "";
      } catch (e) {
        console.error("解析用户信息失败:", e);
      }
    }
  },
  methods: {
    handleLogout() {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      this.$router.push("/");
    },
    showSettings() {
      alert("设置功能开发中...");
    },
    startNewChat() {
      alert("新建聊天功能开发中...");
    },
    showContacts() {
      alert("联系人功能开发中...");
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

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  margin-bottom: 4px;
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

/* 欢迎消息 */
.welcome-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.welcome-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.welcome-title {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.welcome-text {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

.quick-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-btn {
  padding: 12px 24px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #f8f9fa;
  border-color: #007aff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 18px;
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
}
</style>