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
@import "@/assets/styles/conversationlist.css";
@import "@/assets/styles/conversationitem.css";

/* ================== 统一的滚动条样式 ================== */
/* 原则：透明轨道 + 半透明滑块，继承父元素背景色，自适应白天/夜晚模式 */

/* 1. 8px宽度滚动条（用于大区域滚动） */
.profile-edit .form-content::-webkit-scrollbar,
.profile-edit .edit-content::-webkit-scrollbar,
.homeview .conversation-list::-webkit-scrollbar,
.homeview .chat-area-label::-webkit-scrollbar,
.more-options .more-options-content::-webkit-scrollbar,
.change-password-form::-webkit-scrollbar,
.chat-container .messages-container::-webkit-scrollbar {
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
.message-input-container .message-input::-webkit-scrollbar-track {
  background: transparent;
}

/* 4. 滚动条滑块 - 基础状态：半透明 */
.profile-edit .form-content::-webkit-scrollbar-thumb,
.profile-edit .edit-content::-webkit-scrollbar-thumb,
.homeview .conversation-list::-webkit-scrollbar-thumb,
.homeview .chat-area-label::-webkit-scrollbar-thumb,
.more-options .more-options-content::-webkit-scrollbar-thumb,
.change-password-form::-webkit-scrollbar-thumb,
.chat-container .messages-container::-webkit-scrollbar-thumb,
.chat-container .message-input::-webkit-scrollbar-thumb,
.message-input-container .message-input::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3); /* 基础透明度30% */
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

/* 5. 滚动条滑块 - hover状态：提高对比度（减小透明度） */
.profile-edit .form-content::-webkit-scrollbar-thumb:hover,
.profile-edit .edit-content::-webkit-scrollbar-thumb:hover,
.homeview .conversation-list::-webkit-scrollbar-thumb:hover,
.homeview .chat-area-label::-webkit-scrollbar-thumb:hover,
.more-options .more-options-content::-webkit-scrollbar-thumb:hover,
.change-password-form::-webkit-scrollbar-thumb:hover,
.chat-container .messages-container::-webkit-scrollbar-thumb:hover,
.chat-container .message-input::-webkit-scrollbar-thumb:hover,
.message-input-container .message-input::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.5); /* hover时50%透明度 */
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
.message-input-container .message-input::-webkit-scrollbar-thumb:active {
  background: rgba(128, 128, 128, 0.5); /* 与hover相同 */
}

/* 7. Firefox兼容性设置 */
.profile-edit .form-content,
.profile-edit .edit-content,
.homeview .conversation-list,
.homeview .chat-area-label,
.more-options .more-options-content,
.change-password-form,
.chat-container .messages-container,
.chat-container .message-input,
.message-input-container .message-input {
  scrollbar-color: rgba(128, 128, 128, 0.3) transparent; /* 滑块颜色 + 透明轨道 */
}

/* 8. Firefox hover状态（通过JavaScript或CSS变量实现，这里用通用选择器） */
/* 注意：Firefox不支持::-webkit-scrollbar伪元素，所以只能设置基础颜色 */
/* 但我们可以通过CSS变量或父元素hover来改变，这里保持简单统一 */
</style>