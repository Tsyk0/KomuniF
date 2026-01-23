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

/* ✅ 关键：滚动条样式始终生效，不分昼夜模式 */
/* 滚动条基础样式（日间模式） */
.profile-edit .form-content::-webkit-scrollbar,
.profile-edit .edit-content::-webkit-scrollbar,
.homeview .conversation-list::-webkit-scrollbar,
.homeview .chat-area-label::-webkit-scrollbar,
.more-options .more-options-content::-webkit-scrollbar,
.change-password-form::-webkit-scrollbar {
  width: 8px;
}

.profile-edit .form-content::-webkit-scrollbar-track,
.profile-edit .edit-content::-webkit-scrollbar-track,
.homeview .conversation-list::-webkit-scrollbar-track,
.homeview .chat-area-label::-webkit-scrollbar-track,
.more-options .more-options-content::-webkit-scrollbar-track,
.change-password-form::-webkit-scrollbar-track {
  background: transparent !important;
}

.profile-edit .form-content::-webkit-scrollbar-thumb,
.profile-edit .edit-content::-webkit-scrollbar-thumb,
.homeview .conversation-list::-webkit-scrollbar-thumb,
.homeview .chat-area-label::-webkit-scrollbar-thumb,
.more-options .more-options-content::-webkit-scrollbar-thumb,
.change-password-form::-webkit-scrollbar-thumb {
  background: rgba(192, 192, 192, 0.15);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.profile-edit .form-content::-webkit-scrollbar-thumb:hover,
.profile-edit .edit-content::-webkit-scrollbar-thumb:hover,
.homeview .conversation-list::-webkit-scrollbar-thumb:hover,
.homeview .chat-area-label::-webkit-scrollbar-thumb:hover,
.more-options .more-options-content::-webkit-scrollbar-thumb:hover,
.change-password-form::-webkit-scrollbar-thumb:hover {
  background: rgba(192, 192, 192, 0.15);
}

.profile-edit .form-content::-webkit-scrollbar-thumb:active,
.profile-edit .edit-content::-webkit-scrollbar-thumb:active,
.homeview .conversation-list::-webkit-scrollbar-thumb:active,
.homeview .chat-area-label::-webkit-scrollbar-thumb:active,
.more-options .more-options-content::-webkit-scrollbar-thumb:active,
.change-password-form::-webkit-scrollbar-thumb:active {
  background: rgba(192, 192, 192, 0.15);
}

/* Firefox兼容 */
.profile-edit .form-content,
.profile-edit .edit-content,
.homeview .conversation-list,
.homeview .chat-area-label,
.more-options .more-options-content,
.change-password-form {
  scrollbar-width: thin;
  scrollbar-color: rgba(192, 192, 192, 0.15) transparent;
}
</style>