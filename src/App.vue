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
/* 原则：透明轨道 + 半透明滑块，继承父元素背景色，使用CSS变量适应白天/夜晚模式 */

/* 1. 8px宽度滚动条（用于大区域滚动） */
.profile-edit .form-content::-webkit-scrollbar,
.profile-edit .edit-content::-webkit-scrollbar,
.homeview .conversation-list::-webkit-scrollbar,
.homeview .chat-area-label::-webkit-scrollbar,
.more-options .more-options-content::-webkit-scrollbar,
.change-password-form::-webkit-scrollbar,
.chat-container .messages-container::-webkit-scrollbar,
/* 好友功能新增的滚动条区域 */
.friend-detail .friend-detail-content::-webkit-scrollbar,
.friend-list .friends-groups::-webkit-scrollbar,
.friend-list .friend-list-container::-webkit-scrollbar,
.friend-list .sidebar-content::-webkit-scrollbar,
.friend-list .chat-list-container::-webkit-scrollbar,
.friend-default .friend-default-content::-webkit-scrollbar,
.friend-group .friend-group-content::-webkit-scrollbar,
.friend-group .friend-group-items::-webkit-scrollbar {
  width: 20px !important;
}

/* 2. 4px宽度滚动条（用于输入框等小区域） */
.chat-container .message-input::-webkit-scrollbar,
.message-input-container .message-input::-webkit-scrollbar {
  width: 4px;
}

/* 3. 滚动条轨道 - 透明，继承父元素背景 */
.profile-edit .form-content::-webkit-scrollbar-track,
.profile-edit .edit-content::-webkit-scrollbar-track,
.homeview .conversation-list::-webkit-scrollbar-track,
.homeview .chat-area-label::-webkit-scrollbar-track,
.more-options .more-options-content::-webkit-scrollbar-track,
.change-password-form::-webkit-scrollbar-track,
.chat-container .messages-container::-webkit-scrollbar-track,
.chat-container .message-input::-webkit-scrollbar-track,
.message-input-container .message-input::-webkit-scrollbar-track,
/* 好友功能新增的滚动条轨道 */
.friend-detail .friend-detail-content::-webkit-scrollbar-track,
.friend-list .friends-groups::-webkit-scrollbar-track,
.friend-list .friend-list-container::-webkit-scrollbar-track,
.friend-list .sidebar-content::-webkit-scrollbar-track,
.friend-list .chat-list-container::-webkit-scrollbar-track,
.friend-default .friend-default-content::-webkit-scrollbar-track,
.friend-group .friend-group-content::-webkit-scrollbar-track,
.friend-group .friend-group-items::-webkit-scrollbar-track {
  background: transparent;
}

/* 4. 滚动条滑块 - 使用CSS变量适应白天/夜晚模式 */
.profile-edit .form-content::-webkit-scrollbar-thumb,
.profile-edit .edit-content::-webkit-scrollbar-thumb,
.homeview .conversation-list::-webkit-scrollbar-thumb,
.homeview .chat-area-label::-webkit-scrollbar-thumb,
.more-options .more-options-content::-webkit-scrollbar-thumb,
.change-password-form::-webkit-scrollbar-thumb,
.chat-container .messages-container::-webkit-scrollbar-thumb,
.chat-container .message-input::-webkit-scrollbar-thumb,
.message-input-container .message-input::-webkit-scrollbar-thumb,
/* 好友功能新增的滚动条滑块 */
.friend-detail .friend-detail-content::-webkit-scrollbar-thumb,
.friend-list .friends-groups::-webkit-scrollbar-thumb,
.friend-list .friend-list-container::-webkit-scrollbar-thumb,
.friend-list .sidebar-content::-webkit-scrollbar-thumb,
.friend-list .chat-list-container::-webkit-scrollbar-thumb,
.friend-default .friend-default-content::-webkit-scrollbar-thumb,
.friend-group .friend-group-content::-webkit-scrollbar-thumb,
.friend-group .friend-group-items::-webkit-scrollbar-thumb {
  background: var(--scrollbar-color, rgba(128, 128, 128, 0.3));
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

/* 5. 滚动条滑块 - hover状态：提高对比度 */
.profile-edit .form-content::-webkit-scrollbar-thumb:hover,
.profile-edit .edit-content::-webkit-scrollbar-thumb:hover,
.homeview .conversation-list::-webkit-scrollbar-thumb:hover,
.homeview .chat-area-label::-webkit-scrollbar-thumb:hover,
.more-options .more-options-content::-webkit-scrollbar-thumb:hover,
.change-password-form::-webkit-scrollbar-thumb:hover,
.chat-container .messages-container::-webkit-scrollbar-thumb:hover,
.chat-container .message-input::-webkit-scrollbar-thumb:hover,
.message-input-container .message-input::-webkit-scrollbar-thumb:hover,
/* 好友功能新增的滚动条滑块hover状态 */
.friend-detail .friend-detail-content::-webkit-scrollbar-thumb:hover,
.friend-list .friends-groups::-webkit-scrollbar-thumb:hover,
.friend-list .friend-list-container::-webkit-scrollbar-thumb:hover,
.friend-list .sidebar-content::-webkit-scrollbar-thumb:hover,
.friend-list .chat-list-container::-webkit-scrollbar-thumb:hover,
.friend-default .friend-default-content::-webkit-scrollbar-thumb:hover,
.friend-group .friend-group-content::-webkit-scrollbar-thumb:hover,
.friend-group .friend-group-items::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-hover-color, rgba(128, 128, 128, 0.5));
}

/* 6. 滚动条滑块 - active状态（正在拖拽） */
.profile-edit .form-content::-webkit-scrollbar-thumb:active,
.profile-edit .edit-content::-webkit-scrollbar-thumb:active,
.homeview .conversation-list::-webkit-scrollbar-thumb:active,
.homeview .chat-area-label::-webkit-scrollbar-thumb:active,
.more-options .more-options-content::-webkit-scrollbar-thumb:active,
.change-password-form::-webkit-scrollbar-thumb:active,
.chat-container .messages-container::-webkit-scrollbar-thumb:active,
.chat-container .message-input::-webkit-scrollbar-thumb:active,
.message-input-container .message-input::-webkit-scrollbar-thumb:active,
/* 好友功能新增的滚动条滑块active状态 */
.friend-detail .friend-detail-content::-webkit-scrollbar-thumb:active,
.friend-list .friends-groups::-webkit-scrollbar-thumb:active,
.friend-list .friend-list-container::-webkit-scrollbar-thumb:active,
.friend-list .sidebar-content::-webkit-scrollbar-thumb:active,
.friend-list .chat-list-container::-webkit-scrollbar-thumb:active,
.friend-default .friend-default-content::-webkit-scrollbar-thumb:active,
.friend-group .friend-group-content::-webkit-scrollbar-thumb:active,
.friend-group .friend-group-items::-webkit-scrollbar-thumb:active {
  background: var(--scrollbar-hover-color, rgba(128, 128, 128, 0.5));
}

/* 7. Firefox兼容性设置 - 使用CSS变量 */
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
.homeview .chat-area-label,
.more-options .more-options-content,
.change-password-form,
.chat-container .messages-container,
.chat-container .message-input,
.message-input-container .message-input {
  scrollbar-color: var(--scrollbar-color, rgba(128, 128, 128, 0.3)) transparent;
  scrollbar-width: thin;
}

/* 8. 为输入框滚动条设置单独的CSS变量（保持更细的样式） */
.chat-container .message-input,
.message-input-container .message-input {
  --scrollbar-color: rgba(128, 128, 128, 0.2);
  --scrollbar-hover-color: rgba(128, 128, 128, 0.4);
}
</style>