<!-- src/components/ConversationList.vue -->
<template>
  <div class="conversation-list">
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索会话..."
          class="search-input"
          @input="handleSearch"
        />
        <button
          v-if="searchKeyword"
          class="clear-search"
          @click="clearSearch"
          title="清除搜索"
        >
          <span class="clear-icon">×</span>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载会话中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <span>{{ error }}</span>
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>

    <!-- 搜索无结果 -->
    <div
      v-else-if="searchKeyword && filteredConversations.length === 0"
      class="no-results"
    >
      <div class="no-results-icon">🔍</div>
      <p class="no-results-text">未找到匹配的会话</p>
      <p class="no-results-hint">尝试其他搜索关键词</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="conversations.length === 0" class="empty-conversation">
      <div class="empty-icon">💬</div>
      <p class="empty-text">暂无会话</p>
      <p class="empty-hint">开始新的对话或等待好友消息</p>
    </div>

    <!-- 会话列表 -->
    <div v-else class="conversations-container">
      <ConversationItem
        v-for="conversation in filteredConversations"
        :key="conversation.convId"
        :conv-id="conversation.convId"
        :display-name="conversation.displayName"
        :avatar="conversation.avatar"
        :last-message="conversation.lastMessage"
        :last-message-time="conversation.lastMessageTime"
        :unread-count="conversation.unreadCount"
        :is-active="currentConversationId === conversation.convId"
        @click="handleConversationClick"
      />
    </div>
  </div>
</template>

<script>
import { useConversationStore } from "@/stores/chat/show-conversation";
import ConversationItem from "./ConversationItem.vue";

export default {
  name: "ConversationList",

  components: {
    ConversationItem,
  },

  props: {
    currentConversationId: {
      type: Number,
      default: null,
    },
  },

  emits: ["conversation-click", "retry-load"],

  setup(props, { emit }) {
    const conversationStore = useConversationStore();

    return {
      conversationStore,
      emit,
    };
  },

  data() {
    return {
      searchKeyword: "",
      searchTimeout: null,
    };
  },

  computed: {
    // 从 store 获取数据
    conversations() {
      return this.conversationStore.conversationList || [];
    },

    isLoading() {
      return this.conversationStore.isLoading || false;
    },

    error() {
      return this.conversationStore.error || "";
    },

    // 过滤后的会话列表
    filteredConversations() {
      if (!this.searchKeyword.trim()) {
        return this.conversations;
      }

      const keyword = this.searchKeyword.toLowerCase();
      return this.conversations.filter((conversation) => {
        // 搜索会话显示名称
        if (conversation.displayName?.toLowerCase().includes(keyword)) {
          return true;
        }

        // 搜索最后消息内容
        if (conversation.lastMessage?.toLowerCase().includes(keyword)) {
          return true;
        }

        // 搜索会话ID
        if (conversation.convId.toString().includes(keyword)) {
          return true;
        }

        return false;
      });
    },
  },

  mounted() {
    this.loadConversations();
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },

  methods: {
    // 加载会话列表
    async loadConversations() {
      try {
        const userStr = sessionStorage.getItem("user");
        if (!userStr) {
          console.warn("用户未登录，跳过加载会话列表");
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.userId;

        if (!userId) {
          console.warn("用户ID不存在，跳过加载会话列表");
          return;
        }

        console.log("ConversationList: 开始加载会话列表，userId:", userId);
        await this.conversationStore.fetchUserConversations(userId);
        console.log(
          "ConversationList: 会话列表加载完成，数量:",
          this.conversations.length
        );

        // 调试：输出数据
        console.log("ConversationList 中的 conversations:", this.conversations);
        if (this.conversations.length > 0) {
          console.log("第一个会话:", this.conversations[0]);
        }
      } catch (error) {
        console.error("ConversationList: 加载会话列表失败:", error);
      }
    },

    // 重试加载
    retryLoad() {
      this.conversationStore.clearError();
      this.loadConversations();
      this.emit("retry-load");
    },

    // 处理会话点击
    handleConversationClick(convId) {
      console.log("ConversationList: 点击会话，convId:", convId);
      this.emit("conversation-click", convId);
    },

    // 处理搜索输入
    handleSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        console.log("执行搜索，关键词:", this.searchKeyword);
      }, 300);
    },

    // 清除搜索
    clearSearch() {
      this.searchKeyword = "";
    },
  },
};
</script>

<style scoped>
@import "@/assets/styles/conversationlist.css";
</style>