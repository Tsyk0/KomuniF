<!-- App.vue -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 使用Vue 3的组合式API
</script>

<style>
/* 全局样式重置 */

/* 只导入日间基础样式，夜间样式通过动态加载 */
@import "@/assets/styles/base.css";
@import "@/assets/styles/homeview.css";
@import "@/assets/styles/profile-edit.css";
@import "@/assets/styles/more-options.css";
@import "@/assets/styles/change-password.css";
@import "@/assets/styles/loginview.css";
@import "@/assets/styles/loginform.css";
@import "@/assets/styles/chat-container.css";
@import "@/assets/styles/conversation-list.css";
@import "@/assets/styles/conversation-item.css";
@import "@/assets/styles/friend-list.css";
@import "@/assets/styles/friend-info.css";
@import "@/assets/styles/friend-group.css";
@import "@/assets/styles/friend-item.css";

/* ================== 统一的滚动条样式 ================== */
/* 原则：透明轨道、无箭头、Thumb 仅悬停/拖拽时显示，全局宽度一致 6px */
:root {
  --scrollbar-width: 6px;
  --scrollbar-thumb-visible: rgba(128, 128, 128, 0.5);
}

/* 0. 全局兜底：所有可滚动区域统一宽度与高度、彻底无箭头（含 #app 自身） */
#app::-webkit-scrollbar,
#app *::-webkit-scrollbar {
  width: var(--scrollbar-width) !important;
  height: var(--scrollbar-width) !important;
}
#app::-webkit-scrollbar-button,
#app::-webkit-scrollbar-button:vertical:decrement,
#app::-webkit-scrollbar-button:vertical:increment,
#app::-webkit-scrollbar-button:horizontal:decrement,
#app::-webkit-scrollbar-button:horizontal:increment,
#app *::-webkit-scrollbar-button,
#app *::-webkit-scrollbar-button:vertical:decrement,
#app *::-webkit-scrollbar-button:vertical:increment,
#app *::-webkit-scrollbar-button:horizontal:decrement,
#app *::-webkit-scrollbar-button:horizontal:increment {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  overflow: hidden !important;
  background: none !important;
  border: none !important;
}
/* 拇指共用样式：默认透明，仅鼠标在可滚动容器内时显示（全局一处控制透明度） */
#app *::-webkit-scrollbar-thumb,
#app *::-webkit-scrollbar-thumb:hover,
#app *::-webkit-scrollbar-thumb:active {
  background: transparent !important;
  border-radius: 3px;
  border: 2px solid transparent;
  background-clip: content-box;
}

/* 1. 各区域滚动条宽度（与全局一致） */
.profile-edit .form-content::-webkit-scrollbar,
.profile-edit .edit-content::-webkit-scrollbar,
.homeview .conversation-list::-webkit-scrollbar,
.homeview .conversation-list .conversations-container::-webkit-scrollbar,
.conversation-list .conversations-container::-webkit-scrollbar,
.homeview .chat-area-label::-webkit-scrollbar,
.more-options .more-options-content::-webkit-scrollbar,
.change-password-form::-webkit-scrollbar,
.chat-container .messages-container::-webkit-scrollbar,
.chat-container .message-input::-webkit-scrollbar,
.message-input-container .message-input::-webkit-scrollbar,
.loginview .form-content::-webkit-scrollbar,
.friend-detail .friend-detail-content::-webkit-scrollbar,
.friend-list .friends-groups::-webkit-scrollbar,
.friend-list .friend-list-container::-webkit-scrollbar,
.friend-list .sidebar-content::-webkit-scrollbar,
.friend-list .chat-list-container::-webkit-scrollbar,
.friend-default .friend-default-content::-webkit-scrollbar,
.friend-group .friend-group-content::-webkit-scrollbar,
.friend-group .friend-group-items::-webkit-scrollbar,
.register-form .form-container::-webkit-scrollbar,
.register-form::-webkit-scrollbar {
  width: var(--scrollbar-width) !important;
  height: var(--scrollbar-width) !important;
}

.profile-edit .form-content::-webkit-scrollbar-button,
.profile-edit .edit-content::-webkit-scrollbar-button,
.homeview .conversation-list::-webkit-scrollbar-button,
.homeview .conversation-list .conversations-container::-webkit-scrollbar-button,
.conversation-list .conversations-container::-webkit-scrollbar-button,
.homeview .chat-area-label::-webkit-scrollbar-button,
.more-options .more-options-content::-webkit-scrollbar-button,
.change-password-form::-webkit-scrollbar-button,
.chat-container .messages-container::-webkit-scrollbar-button,
.chat-container .message-input::-webkit-scrollbar-button,
.message-input-container .message-input::-webkit-scrollbar-button,
.loginview .form-content::-webkit-scrollbar-button,
.friend-detail .friend-detail-content::-webkit-scrollbar-button,
.friend-list .friends-groups::-webkit-scrollbar-button,
.friend-list .friend-list-container::-webkit-scrollbar-button,
.friend-list .sidebar-content::-webkit-scrollbar-button,
.friend-list .chat-list-container::-webkit-scrollbar-button,
.friend-default .friend-default-content::-webkit-scrollbar-button,
.friend-group .friend-group-content::-webkit-scrollbar-button,
.friend-group .friend-group-items::-webkit-scrollbar-button,
.register-form .form-container::-webkit-scrollbar-button,
.register-form::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  overflow: hidden !important;
  background: none !important;
  border: none !important;
}

/* 3. 滚动条轨道 - 透明，继承父元素背景 */
.profile-edit .form-content::-webkit-scrollbar-track,
.profile-edit .edit-content::-webkit-scrollbar-track,
.homeview .conversation-list::-webkit-scrollbar-track,
.homeview .conversation-list .conversations-container::-webkit-scrollbar-track,
.conversation-list .conversations-container::-webkit-scrollbar-track,
.homeview .chat-area-label::-webkit-scrollbar-track,
.more-options .more-options-content::-webkit-scrollbar-track,
.change-password-form::-webkit-scrollbar-track,
.chat-container .messages-container::-webkit-scrollbar-track,
.chat-container .message-input::-webkit-scrollbar-track,
.message-input-container .message-input::-webkit-scrollbar-track,
/* 登录界面滚动条轨道 */
.loginview .form-content::-webkit-scrollbar-track,
/* 好友功能新增的滚动条轨道 */
.friend-detail .friend-detail-content::-webkit-scrollbar-track,
.friend-list .friends-groups::-webkit-scrollbar-track,
.friend-list .friend-list-container::-webkit-scrollbar-track,
.friend-list .sidebar-content::-webkit-scrollbar-track,
.friend-list .chat-list-container::-webkit-scrollbar-track,
.friend-default .friend-default-content::-webkit-scrollbar-track,
.friend-group .friend-group-content::-webkit-scrollbar-track,
.friend-group .friend-group-items::-webkit-scrollbar-track,
/* 注册表单滚动条轨道 */
.register-form .form-container::-webkit-scrollbar-track,
.register-form::-webkit-scrollbar-track {
  background: transparent;
}

/* 4. 滚动条滑块 - 默认透明，鼠标移出容器时隐藏 */
.profile-edit .form-content::-webkit-scrollbar-thumb,
.profile-edit .edit-content::-webkit-scrollbar-thumb,
.homeview .conversation-list::-webkit-scrollbar-thumb,
.homeview .conversation-list .conversations-container::-webkit-scrollbar-thumb,
.conversation-list .conversations-container::-webkit-scrollbar-thumb,
.homeview .chat-area-label::-webkit-scrollbar-thumb,
.more-options .more-options-content::-webkit-scrollbar-thumb,
.change-password-form::-webkit-scrollbar-thumb,
.chat-container .messages-container::-webkit-scrollbar-thumb,
.chat-container .message-input::-webkit-scrollbar-thumb,
.message-input-container .message-input::-webkit-scrollbar-thumb,
.loginview .form-content::-webkit-scrollbar-thumb,
.friend-detail .friend-detail-content::-webkit-scrollbar-thumb,
.friend-list .friends-groups::-webkit-scrollbar-thumb,
.friend-list .friend-list-container::-webkit-scrollbar-thumb,
.friend-list .sidebar-content::-webkit-scrollbar-thumb,
.friend-list .chat-list-container::-webkit-scrollbar-thumb,
.friend-default .friend-default-content::-webkit-scrollbar-thumb,
.friend-group .friend-group-content::-webkit-scrollbar-thumb,
.friend-group .friend-group-items::-webkit-scrollbar-thumb,
.register-form .form-container::-webkit-scrollbar-thumb,
.register-form::-webkit-scrollbar-thumb {
  background: transparent !important;
  border-radius: 3px;
  border: 2px solid transparent;
  background-clip: content-box;
}

/* 5. 鼠标在可滚动容器区域内时显示拇指，显示/悬停拇指/拖拽时共用同一透明度（无变化） */
.profile-edit .form-content:hover::-webkit-scrollbar-thumb,
.profile-edit .form-content:hover::-webkit-scrollbar-thumb:hover,
.profile-edit .form-content:hover::-webkit-scrollbar-thumb:active,
.profile-edit .edit-content:hover::-webkit-scrollbar-thumb,
.profile-edit .edit-content:hover::-webkit-scrollbar-thumb:hover,
.profile-edit .edit-content:hover::-webkit-scrollbar-thumb:active,
.homeview .conversation-list:hover::-webkit-scrollbar-thumb,
.homeview .conversation-list:hover::-webkit-scrollbar-thumb:hover,
.homeview .conversation-list:hover::-webkit-scrollbar-thumb:active,
.homeview
  .conversation-list
  .conversations-container:hover::-webkit-scrollbar-thumb,
.homeview
  .conversation-list
  .conversations-container:hover::-webkit-scrollbar-thumb:hover,
.homeview
  .conversation-list
  .conversations-container:hover::-webkit-scrollbar-thumb:active,
.conversation-list .conversations-container:hover::-webkit-scrollbar-thumb,
.conversation-list
  .conversations-container:hover::-webkit-scrollbar-thumb:hover,
.conversation-list
  .conversations-container:hover::-webkit-scrollbar-thumb:active,
.homeview .chat-area-label:hover::-webkit-scrollbar-thumb,
.homeview .chat-area-label:hover::-webkit-scrollbar-thumb:hover,
.homeview .chat-area-label:hover::-webkit-scrollbar-thumb:active,
.more-options .more-options-content:hover::-webkit-scrollbar-thumb,
.more-options .more-options-content:hover::-webkit-scrollbar-thumb:hover,
.more-options .more-options-content:hover::-webkit-scrollbar-thumb:active,
.change-password-form:hover::-webkit-scrollbar-thumb,
.change-password-form:hover::-webkit-scrollbar-thumb:hover,
.change-password-form:hover::-webkit-scrollbar-thumb:active,
.chat-container .messages-container:hover::-webkit-scrollbar-thumb,
.chat-container .messages-container:hover::-webkit-scrollbar-thumb:hover,
.chat-container .messages-container:hover::-webkit-scrollbar-thumb:active,
.chat-container .message-input:hover::-webkit-scrollbar-thumb,
.chat-container .message-input:hover::-webkit-scrollbar-thumb:hover,
.chat-container .message-input:hover::-webkit-scrollbar-thumb:active,
.message-input-container .message-input:hover::-webkit-scrollbar-thumb,
.message-input-container .message-input:hover::-webkit-scrollbar-thumb:hover,
.message-input-container .message-input:hover::-webkit-scrollbar-thumb:active,
.loginview .form-content:hover::-webkit-scrollbar-thumb,
.loginview .form-content:hover::-webkit-scrollbar-thumb:hover,
.loginview .form-content:hover::-webkit-scrollbar-thumb:active,
.friend-detail .friend-detail-content:hover::-webkit-scrollbar-thumb,
.friend-detail .friend-detail-content:hover::-webkit-scrollbar-thumb:hover,
.friend-detail .friend-detail-content:hover::-webkit-scrollbar-thumb:active,
.friend-list .friends-groups:hover::-webkit-scrollbar-thumb,
.friend-list .friends-groups:hover::-webkit-scrollbar-thumb:hover,
.friend-list .friends-groups:hover::-webkit-scrollbar-thumb:active,
.friend-list .friend-list-container:hover::-webkit-scrollbar-thumb,
.friend-list .friend-list-container:hover::-webkit-scrollbar-thumb:hover,
.friend-list .friend-list-container:hover::-webkit-scrollbar-thumb:active,
.friend-list .sidebar-content:hover::-webkit-scrollbar-thumb,
.friend-list .sidebar-content:hover::-webkit-scrollbar-thumb:hover,
.friend-list .sidebar-content:hover::-webkit-scrollbar-thumb:active,
.friend-list .chat-list-container:hover::-webkit-scrollbar-thumb,
.friend-list .chat-list-container:hover::-webkit-scrollbar-thumb:hover,
.friend-list .chat-list-container:hover::-webkit-scrollbar-thumb:active,
.friend-default .friend-default-content:hover::-webkit-scrollbar-thumb,
.friend-default .friend-default-content:hover::-webkit-scrollbar-thumb:hover,
.friend-default .friend-default-content:hover::-webkit-scrollbar-thumb:active,
.friend-group .friend-group-content:hover::-webkit-scrollbar-thumb,
.friend-group .friend-group-content:hover::-webkit-scrollbar-thumb:hover,
.friend-group .friend-group-content:hover::-webkit-scrollbar-thumb:active,
.friend-group .friend-group-items:hover::-webkit-scrollbar-thumb,
.friend-group .friend-group-items:hover::-webkit-scrollbar-thumb:hover,
.friend-group .friend-group-items:hover::-webkit-scrollbar-thumb:active,
.register-form .form-container:hover::-webkit-scrollbar-thumb,
.register-form .form-container:hover::-webkit-scrollbar-thumb:hover,
.register-form .form-container:hover::-webkit-scrollbar-thumb:active,
.register-form:hover::-webkit-scrollbar-thumb,
.register-form:hover::-webkit-scrollbar-thumb:hover,
.register-form:hover::-webkit-scrollbar-thumb:active {
  background: var(--scrollbar-thumb-visible) !important;
  border-radius: 3px;
  border: 2px solid transparent;
  background-clip: content-box;
}

/* 7. Firefox 兼容性（Firefox 无法实现悬停显隐，使用较淡的滑块） */
.friend-detail .friend-detail-content,
.friend-list .friends-groups,
.friend-list .friend-list-container,
.friend-list .sidebar-content,
.friend-list .chat-list-container,
.friend-default .friend-default-content,
.friend-group .friend-group-content,
.friend-group .friend-group-items,
.profile-edit .form-content,
.profile-edit .edit-content,
.homeview .conversation-list,
.homeview .conversation-list .conversations-container,
.conversation-list .conversations-container,
.homeview .chat-area-label,
.more-options .more-options-content,
.change-password-form,
.loginview .form-content,
.chat-container .messages-container,
.chat-container .message-input,
.message-input-container .message-input,
.register-form .form-container,
.register-form {
  scrollbar-color: var(--scrollbar-thumb-visible) transparent;
  scrollbar-width: thin;
}

/* 8. 强制隐藏箭头按钮（最高优先级，覆盖任何后续样式） */
html #app::-webkit-scrollbar-button,
html #app *::-webkit-scrollbar-button,
html body #app::-webkit-scrollbar-button,
html body #app *::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: 0 !important;
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  visibility: hidden !important;
  background: none !important;
  border: none !important;
}
</style>