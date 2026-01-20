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
@import "@/assets/styles/scrollbar.css";
@import "@/assets/styles/chat-container.css";
@import "@/assets/styles/conversationlist.css";
@import "@/assets/styles/conversationitem.css";
/* ✅ 关键：不要在这里导入夜间样式，使用动态加载 */
</style>