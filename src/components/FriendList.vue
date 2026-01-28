<!-- src/components/FriendList.vue -->
<template>
  <div class="friend-list-container">
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索好友"
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          ×
        </button>
      </div>
    </div>

    <!-- 好友分组 -->
    <div class="friend-groups">
      <!-- 特别关心 -->
      <FriendGroup
        :title="'特别关心'"
        :count="1"
        :total="1"
        :is-collapsed="collapsedGroups['specialCare']"
        @toggle="() => toggleGroup('specialCare')"
      >
        <FriendItem
          v-for="friend in filteredFriends.specialCare"
          :key="friend.id"
          :friend="friend"
          @click="handleFriendClick(friend)"
        />
      </FriendGroup>

      <!-- 我的好友 -->
      <FriendGroup
        :title="'我的好友'"
        :count="0"
        :total="5"
        :is-collapsed="collapsedGroups['myFriends']"
        @toggle="() => toggleGroup('myFriends')"
      >
        <div v-if="filteredFriends.myFriends.length === 0" class="empty-group">
          <p>暂无好友</p>
        </div>
        <FriendItem
          v-for="friend in filteredFriends.myFriends"
          :key="friend.id"
          :friend="friend"
          @click="handleFriendClick(friend)"
        />
      </FriendGroup>

      <!-- 朋友 -->
      <FriendGroup
        :title="'朋友'"
        :count="0"
        :total="0"
        :is-collapsed="collapsedGroups['friends']"
        @toggle="() => toggleGroup('friends')"
      >
        <div class="empty-group">
          <p>暂无好友</p>
        </div>
      </FriendGroup>

      <!-- 家人 -->
      <FriendGroup
        :title="'家人'"
        :count="0"
        :total="0"
        :is-collapsed="collapsedGroups['family']"
        @toggle="() => toggleGroup('family')"
      >
        <div class="empty-group">
          <p>暂无好友</p>
        </div>
      </FriendGroup>

      <!-- 同学 -->
      <FriendGroup
        :title="'同学'"
        :count="20"
        :total="24"
        :is-collapsed="collapsedGroups['classmates']"
        @toggle="() => toggleGroup('classmates')"
      >
        <FriendItem
          v-for="friend in filteredFriends.classmates"
          :key="friend.id"
          :friend="friend"
          @click="handleFriendClick(friend)"
        />
      </FriendGroup>
    </div>

    <!-- 底部操作栏 -->
    <div class="friend-actions">
      <button class="action-btn" @click="handleAddFriend">
        <span class="action-icon">➕</span>
        <span class="action-text">添加好友</span>
      </button>
      <button class="action-btn" @click="handleFriendRequests">
        <span class="action-icon">👤</span>
        <span class="action-text">好友通知</span>
        <span v-if="friendRequestCount > 0" class="badge">
          {{ friendRequestCount }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import FriendGroup from "./FriendGroup.vue";
import FriendItem from "./FriendItem.vue";

// 类型定义
interface Friend {
  id: number;
  nickname: string;
  remarkName?: string;
  avatar?: string;
  group: string;
  signature?: string;
  onlineStatus: "online" | "offline" | "away";
  lastSeen?: string;
  unreadCount?: number;
}

// 响应式数据
const searchKeyword = ref("");

// 分组折叠状态
const collapsedGroups = reactive({
  myDevices: false,
  robots: false,
  specialCare: false,
  myFriends: false,
  friends: false,
  family: false,
  classmates: false,
});

// 模拟好友数据（后续替换为API调用）
const allFriends = ref<Friend[]>([
  // 特别关心
  {
    id: 1001,
    nickname: "张三",
    remarkName: "三哥",
    avatar: "",
    group: "specialCare",
    signature: "努力工作，快乐生活",
    onlineStatus: "online",
    unreadCount: 3,
  },

  // 我的好友（暂无）

  // 同学分组
  {
    id: 2001,
    nickname: "李四",
    remarkName: "四哥",
    avatar: "",
    group: "classmates",
    signature: "好好学习，天天向上",
    onlineStatus: "online",
    lastSeen: "刚刚",
  },
  {
    id: 2002,
    nickname: "王五",
    avatar: "",
    group: "classmates",
    signature: "",
    onlineStatus: "offline",
    lastSeen: "2小时前",
  },
  {
    id: 2003,
    nickname: "赵六",
    remarkName: "六哥",
    avatar: "",
    group: "classmates",
    signature: "前端开发工程师",
    onlineStatus: "away",
    lastSeen: "30分钟前",
  },
  {
    id: 2004,
    nickname: "孙七",
    avatar: "",
    group: "classmates",
    signature: "",
    onlineStatus: "offline",
    lastSeen: "昨天",
  },
  {
    id: 2005,
    nickname: "周八",
    avatar: "",
    group: "classmates",
    signature: "后端开发工程师",
    onlineStatus: "online",
  },
]);

// 好友请求数量
const friendRequestCount = ref(2);

// 计算属性：过滤后的好友数据
const filteredFriends = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim();

  if (!keyword) {
    // 没有搜索关键词，按原分组返回
    return {
      specialCare: allFriends.value.filter((f) => f.group === "specialCare"),
      myFriends: allFriends.value.filter((f) => f.group === "myFriends"),
      classmates: allFriends.value.filter((f) => f.group === "classmates"),
    };
  }

  // 有搜索关键词，在所有好友中搜索
  const filtered = allFriends.value.filter((friend) => {
    const searchIn = [friend.nickname, friend.remarkName, friend.signature]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchIn.includes(keyword);
  });

  // 搜索时不分组
  return {
    specialCare: filtered,
    myFriends: [],
    classmates: filtered,
  };
});

// 方法
const handleSearch = () => {
  console.log("搜索关键词:", searchKeyword.value);
};

const clearSearch = () => {
  searchKeyword.value = "";
};

const toggleGroup = (groupName: string) => {
  collapsedGroups[groupName] = !collapsedGroups[groupName];
};

const handleFriendClick = (friend: Friend) => {
  console.log("点击好友:", friend);
  // TODO: 跳转到与好友的聊天页面
  // emit('select-friend', friend)
};

const handleAddFriend = () => {
  console.log("添加好友");
  // TODO: 弹出添加好友对话框
};

const handleFriendRequests = () => {
  console.log("查看好友请求");
  // TODO: 跳转到好友请求页面
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/friend-list.css";
</style>