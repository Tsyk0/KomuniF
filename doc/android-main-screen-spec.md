# Komuni Android 端 主界面（登录后首页）开发规范

> 本文档面向 Android 开发 Agent，定位为可直接照做的实施级规范。
> 与总览文档 `android-agent-expansion-prompt.md` 配套使用，本文件聚焦「登录后主界面」单一屏幕。
> 视觉与交互参考 Telegram，但所有数据/行为必须与 Web 端 `prepareMainConversationSidebarList` 与 `convStore` 已有逻辑保持一致。

---

## 1. 屏幕定位与边界

### 1.1 屏幕路由

- 路由名建议：`MainScreen` / `HomeScreen`
- 进入条件：`AuthRepository.checkSession()` 返回 `valid=true`。
- 退出条件：登出、Token 失效（401）。

### 1.2 整体结构（自上而下）

1. 顶部应用栏 `TopAppBar`（左侧 Logo 文本，右侧搜索按钮 + Plus 按钮）。
2. 主体内容区：会话列表（占绝大多数面积，可滚动）。
3. 底部导航栏 `BottomNavigation`：会话（左）、好友（中）、设置（右）。

明确不包含的元素：

- 不包含参考截图中“ 学习 / 游戏 / 资源频道”那一行标签筛选条。
- 不包含截图中“Turrit”一名，所有出现位置统一替换为 `Komuni`。

---

## 2. 顶部应用栏（TopAppBar）

### 2.1 元素清单

- 左侧：应用名 `Komuni`（文本 Logo，不放图片）。
- 右侧 1：搜索按钮（IconButton，图标使用 Material `Search`）。
- 右侧 2：Plus 按钮（IconButton，图标使用 `Add` 或 `AddCircle` 风格）。

### 2.2 行为定义

- 应用名 `Komuni`：不可点击，仅展示。
- 搜索按钮：跳转至「全局搜索页」（用户/会话/消息），对应后端：
  - 用户搜索：`GET /user-search/search`
  - 会话搜索：`GET /conversation-search/search`
  - 消息搜索：`GET /message-search/search`
- Plus 按钮：弹出 `PlusPanel` 浮层菜单，至少包含：
  - 发起单聊（跳转选择联系人）
  - 创建群聊（跳转多选联系人 + 设置群名）
  - 添加好友（跳转用户搜索）

### 2.3 视觉规范

- 高度：`56dp`。
- 标题文本：左对齐，约 `22sp`，加粗或半粗，主色调使用 Telegram 风格的强调蓝。
- 图标按钮：`24dp` 图标，`48dp` 触控区域，颜色与标题一致或主色调。
- 背景：浅色模式白底，深色模式深灰底，无明显投影；底部 `1dp` 极淡分割线（可选，需保证不干扰列表项）。
- AppBar 内不放置任何分类/标签筛选条。

---

## 3. 主体：会话列表

### 3.1 数据来源

- 接口：`GET /conversations/summary`
- 类型：`ConversationSummaryDTO[]`
- 关键字段（必须使用）：
  - `convId`、`convType`（1 单聊，2 群聊）
  - `convName`、`convAvatar`
  - `displayStatus`（0 置顶 / 1 默认 / 2 主列表隐藏）
  - `unreadCount`
  - `lastReadMessageId?`
  - `lastMessage`：`{ messageId, senderId, messageType, messageContent, senderDisplayName, senderAvatar, sendTime }`
  - `updateTime`
  - `peer?`：单聊对端信息
  - `memberStatus?`：群聊成员状态

### 3.2 排序与过滤（与 Web 端完全一致）

按以下顺序处理，不允许简化：

1. 过滤：剔除 `displayStatus === 2` 的会话（主列表隐藏）。
2. 一级排序：`displayStatus === 0`（置顶）整体排在前。
3. 二级排序：同组内按 `updateTime` 降序。
4. 三级排序：`updateTime` 相等时按 `unreadCount` 降序。

实现时建议在 Repository 暴露一个纯函数 `prepareMainConversationList`，与 Web 端 `prepareMainConversationSidebarList` 对齐。

### 3.3 列表项（ConversationItem）规范

整体布局：水平方向左中右三段。

左段（头像区）：

- 圆形头像，直径 `52dp`。
- 头像兜底：`convAvatar` 为空时使用 `convName` 首字（或英文首字母）+ 主题色背景。
- 单聊使用对端头像（`peer.peerAvatar` 优先），群聊使用群头像。

中段（信息区，占主要宽度）：

- 第一行：会话标题。
  - 群聊：`convName`
  - 单聊：优先级 `peer.peerRemarkName` > `peer.peerNickname` > `convName`
  - 标题文本 `16sp`，最大 1 行，超出省略。
  - 标题右侧紧跟「静音图标」（如果会话设置免打扰，预留位置；当前接口未提供时按未静音处理，但 UI 必须保留位置以便后续接入）。
- 第二行：最后消息预览。
  - 来源：`lastMessage`（无消息时显示「暂无消息」灰色占位）。
  - 群聊预览前缀：`${senderDisplayName}: ${preview}`。
  - 自己发送的预览前缀：`您: ${preview}`。
  - 类型映射：
    - `text`：直接渲染纯文本
    - `image`：`[图片]`
    - `video`：`[视频]`
    - `file`：`[文件]`
    - `audio`：`[语音]`
    - `location`：`[位置]`
    - `emoji`：直接渲染表情
    - `system`：以系统灰色样式渲染原文
  - 文本 `13sp`，灰色，最大 1 行，超出省略。

右段（状态区，垂直两行）：

- 第一行：时间，`12sp`，灰色。
  - 今日：`HH:mm`
  - 昨日：`昨天`
  - 本周内：`周一/周二/...`
  - 更早：`MM月dd日` 或 `yyyy-MM-dd`
- 第二行：状态指示，按优先级互斥渲染：
  1. 若 `unreadCount > 0`：显示未读角标（圆形背景 + 数字，`>=100` 显示 `99+`）。
  2. 否则若是自己最后发送的消息：显示已读双勾或单勾（数据来源由消息模块下发）。
  3. 否则若 `displayStatus === 0`：显示置顶图钉图标。
  4. 否则不显示。

整体规范：

- 项高度：`72dp`。
- 上下内边距：`8dp`，左右 `16dp`。
- 头像与中段间距：`12dp`。
- 列表项之间不画明显分割线，仅依靠间距与背景区隔（Telegram 风格）。

### 3.4 已归档对话（可选首期）

- 参考截图中顶部存在“已归档对话”聚合入口。
- 当前后端字段约定：`displayStatus === 2` 表示主列表隐藏。
- 第一期建议：将 `displayStatus === 2` 的会话聚合为「已归档对话」单条入口固定置顶，点击进入归档列表页。
- 若产品决策不上归档，则移除该入口，但 Repository 必须保留过滤逻辑。

### 3.5 空态与加载态

- 加载中：列表区显示骨架屏（头像圆 + 两行灰条）。
- 空态：居中插画 + 文案「还没有任何会话，点右上角 + 开始聊天吧」。
- 错误态：列表区显示错误占位 + 重试按钮，下次进入或下拉刷新时重新请求。

### 3.6 列表交互

- 单击列表项：进入会话详情页（`ChatScreen`），同时触发 WS `subscribe`（见第 5 节）。
- 长按列表项：弹出底部 Sheet 菜单，至少包含：
  - 置顶 / 取消置顶（切换 `displayStatus` 0 / 1）
  - 标记为已读（推进已读游标到当前最大）
  - 归档 / 取消归档（切换 `displayStatus` 2 / 1）
  - 删除会话（按当前后端语义可仅本地隐藏 + 离开群组，二次确认）
- 滑动手势（可选）：左滑暴露归档与更多操作。

### 3.7 下拉刷新与增量刷新

- 下拉刷新：调用 `GET /conversations/summary` 重新获取全量。
- 增量刷新：收到 WS `newMessage` 时，仅刷新对应 `convId` 的会话项；必要时调用 `GET /conversations/summary?convId=...` 局部刷新。
- 增量更新规则：
  1. 更新 `lastMessage`、`updateTime`。
  2. 若当前不在该会话页：`unreadCount += 1`。
  3. 若当前正在该会话页：不增加未读，并在退出会话时上报已读游标。
  4. 重新执行排序，可能引发置顶以下区域上移。

---

## 4. 底部导航栏（BottomNavigation）

### 4.1 三个 Tab

1. 会话 Tab（左）
   - 图标：聊天气泡
   - 文案：会话
   - 内容：本主界面（即第 3 节描述的会话列表）
   - 默认选中项
2. 好友 Tab（中）
   - 图标：人形
   - 文案：好友
   - 内容：好友页，至少包含：
     - 顶部：搜索栏（用户搜索）
     - 列表：好友数据来自 `GET /friends`
     - 列表项：头像 + 显示名（备注名优先）+ 在线状态
     - 长按或点击进入：好友资料页（`GET /friends/{friendId}/profile`）
     - 入口动作：点击好友项进入聊天（先 `POST /conversations/create` 单聊）
3. 设置 Tab（右）
   - 图标：齿轮
   - 文案：设置
   - 内容：个人设置页，至少包含：
     - 顶部：当前用户头像、昵称、签名（来自登录态）
     - 分组项：
       - 个人资料编辑（跳转编辑页，`POST /user/updateAllAttri`）
       - 修改密码（`POST /user/updatePwdWithOldPwd`）
       - 通知设置（预留）
       - 主题与外观（预留，含浅色/深色）
       - 关于 Komuni
       - 退出登录（清理本地态 + 跳转登录页）

### 4.2 导航行为

- 三个 Tab 之间互斥，状态切换不销毁页面（建议使用 `NavHost` + `BottomNavigation` 标准模式）。
- 每个 Tab 内部独立返回栈。
- 切换 Tab 时不触发会话列表请求；仅在「会话 Tab 首次进入」与「下拉刷新」时请求。
- 角标（红点 / 数字）：
  - 会话 Tab：所有 `displayStatus !== 2` 的会话 `unreadCount` 之和；超过 99 显示 `99+`。
  - 好友 Tab：是否有待处理好友申请（来自通知模块 `GET /notifications/unread-summary` + 类型过滤）。
  - 设置 Tab：默认无角标。

### 4.3 视觉规范

- 高度：`56dp`。
- 选中态：图标与文字使用强调色（与 AppBar 主色一致）。
- 未选中态：灰色（浅色模式），亮灰（深色模式）。
- 不使用底部强阴影，仅顶部 `1dp` 极淡分割线（可选）。
- 安全区域：底部预留系统手势区域，避免遮挡。

---

## 5. 与 WebSocket 的关系（主界面相关部分）

主界面在登录后立即启动，但 WS 只负责把全局事件喂到 Repository，不直接驱动 UI。具体职责：

1. 应用启动连接 WS（`WsConnectionManager.connect()`）。
2. 主界面不主动 `subscribe` 任意会话；只有进入具体 `ChatScreen` 时才订阅。
3. 主界面订阅 `MessageRepository.observeConversationSummaries()`（基于 Flow），数据由 Repository 整合：
   - HTTP：`GET /conversations/summary`
   - WS：`newMessage`、`messageRecalled`、`groupConvMemberManage` 等
4. 收到下行事件时的更新规则：
   - `newMessage`：更新对应 `convId` 的 `lastMessage`、`updateTime`、`unreadCount`，重新排序。
   - `messageRecalled` / `messageRecallSuccess`：若被撤回的消息是该会话最后一条消息，更新 `lastMessage` 预览为「消息已撤回」。
   - `messageRead`：如对端阅读了我发出的最新消息，更新该项的已读双勾态。
   - `groupConvMemberManage`：如自己被踢出，调用 `GET /conversations/summary` 局部刷新或本地移除该会话。
   - `newSystemNotification` / `newRequestHandle`：不直接修改会话列表，但需更新好友 Tab 的角标。

5. 心跳与重连：
   - WS `ping/pong` 是纯文本帧，不是 JSON。
   - 重连成功后：调用 `GET /conversations/summary` 全量同步，避免列表与服务端漂移。

---

## 6. MVVM + Repository 落地（主界面）

### 6.1 推荐文件结构

```text
presentation/main/
  MainScreen.kt
  MainViewModel.kt
  MainUiState.kt
  components/
    HomeTopAppBar.kt
    ConversationListItem.kt
    HomeBottomBar.kt

presentation/conversations/
  ConversationListScreen.kt
  ConversationListViewModel.kt

presentation/friends/
  FriendsScreen.kt
  FriendsViewModel.kt

presentation/settings/
  SettingsScreen.kt
  SettingsViewModel.kt

domain/
  model/Conversation.kt
  model/LastMessagePreview.kt
  repository/ConversationRepository.kt
  usecase/ObserveConversationListUseCase.kt
  usecase/RefreshConversationListUseCase.kt
  usecase/ToggleConversationPinUseCase.kt
  usecase/ArchiveConversationUseCase.kt

data/
  remote/api/ConversationApi.kt
  remote/dto/ConversationSummaryDto.kt
  remote/ws/WsEventBus.kt
  repository/ConversationRepositoryImpl.kt
  mapper/ConversationMapper.kt
  local/ConversationDao.kt
  local/ConversationEntity.kt
```

### 6.2 数据流（单向）

1. UI（`ConversationListScreen`）只订阅 `MainUiState`。
2. `MainViewModel` 调用 `ObserveConversationListUseCase` 得到 `Flow<List<Conversation>>`。
3. UseCase 内部组合：
   - `ConversationRepository.observeAll()`（本地 Room）
   - 触发 `ConversationRepository.refresh()` 拉取远端
4. `ConversationRepositoryImpl` 同时订阅 `WsEventBus`：
   - 收到 `newMessage` 等事件后更新本地 Room，UI 自动通过 Flow 收到变化。
5. 用户操作（置顶/归档/删除）→ ViewModel → UseCase → Repository → API + 本地更新。

### 6.3 UI State 建议

```kotlin
data class MainUiState(
    val isLoading: Boolean,
    val isRefreshing: Boolean,
    val items: List<ConversationUi>,
    val archivedEntry: ArchivedEntryUi?,
    val errorMessage: String?,
    val totalUnread: Int,
)

data class ConversationUi(
    val convId: Long,
    val title: String,
    val avatarUrl: String?,
    val avatarFallbackText: String,
    val previewText: String,
    val timeText: String,
    val unreadCount: Int,
    val isPinned: Boolean,
    val isMuted: Boolean,
    val showSentDoubleCheck: Boolean,
    val isGroup: Boolean,
)
```

### 6.4 强制约束

1. ViewModel 不允许直接持有 `Retrofit` 或 `OkHttpClient`。
2. WS 原始 JSON 不允许进入 ViewModel；必须由 `WsEventBus` 解析为强类型事件。
3. 列表排序逻辑只能位于 Repository 或 UseCase，不允许在 Composable 中排序。
4. 时间格式化逻辑统一封装在 `ConversationMapper`，UI 只读取 `timeText`。
5. 任何对会话的本地修改（置顶/归档）必须先乐观更新本地 Room，再调用接口，失败时回滚。

---

## 7. 视觉与样式（Telegram 风格落地细节）

### 7.1 颜色（建议 Token，不强制具体色值）

- `colorPrimary`：Telegram 蓝调（如 `#2AABEE`）。
- `colorSurface`：浅色 `#FFFFFF` / 深色 `#17212B`。
- `colorOnSurface`：浅 `#000000DE` / 深 `#FFFFFFDE`。
- `colorOnSurfaceVariant`（次级文本）：浅 `#7B848C` / 深 `#94A4B6`。
- `unreadBadge`：使用 `colorPrimary`，文本白色；静音状态可降为灰色。
- `pinIcon`：使用 `colorOnSurfaceVariant` 灰调，避免与未读色冲突。

### 7.2 字号

- 应用名 `Komuni`：`22sp`，半粗。
- 会话标题：`16sp`，常规。
- 消息预览：`13sp`，常规。
- 时间：`12sp`，常规。
- 角标数字：`11sp`，半粗，白色。

### 7.3 间距

- 列表项内边距：水平 `16dp`，垂直 `8dp`。
- 头像与文字：`12dp`。
- 文字两行行距：`2dp`。
- AppBar 与列表之间：无额外间距。
- 底部导航与列表之间：无额外间距。

### 7.4 深色模式

- 主界面必须在第一期支持深色模式。
- 不允许通过透明度堆叠模拟深色，统一定义两套 `Color`。

---

## 8. 验收清单（必须通过）

1. 应用名显示为 `Komuni`，不出现 `Turrit`。
2. 顶部不存在“bdsm/学习/游戏/资源频道”这类标签筛选条。
3. 顶栏右侧仅有「搜索」与「Plus」两个按钮，行为分别符合 2.2 节。
4. 会话列表排序与 Web 端 `prepareMainConversationSidebarList` 一致：
   - 置顶在前
   - 同组按 `updateTime` 降序
   - 时间相等按 `unreadCount` 降序
   - `displayStatus === 2` 不出现在主列表
5. 列表项左中右三段布局符合 3.3 节，时间格式按 3.3 节规则。
6. 收到 WS `newMessage` 后：
   - 当前不在该会话页：未读 +1，列表项上移到对应位置。
   - 当前在该会话页：不增加未读。
7. 收到 `messageRecalled` 后：若被撤回为最后一条，预览更新为「消息已撤回」。
8. 底部导航包含「会话 / 好友 / 设置」三项，不可少不可多。
9. 进入「设置」可看到当前用户基本信息，且能进入修改密码与个人资料编辑入口。
10. 进入「好友」能看到 `GET /friends` 返回的好友列表，并支持点击发起会话。
11. 横竖屏切换、深色模式、可达性（TalkBack）基本可用。
12. WS 断线重连后：会话列表通过 `GET /conversations/summary` 重新对齐，不出现“幽灵会话”或丢消息。

---

## 9. 给 Android Agent 的执行指引（硬性）

1. 在动手写代码前，先输出：
   - 屏幕组件树（顶栏 / 列表 / 底部导航）
   - Repository 与 UseCase 列表
   - Room 表设计（至少 `conversations`、`last_messages`）
2. 严禁在 Composable 内调用网络或 WS。
3. 严禁把 `ConversationSummaryDTO` 直接传给 UI；必须先 Mapper 转 `ConversationUi`。
4. 严禁简化排序与过滤逻辑；如果接口字段缺失需要兜底，必须在 Mapper 层处理并加注释说明。
5. 完成后必须提供：
   - 关键截图（明亮/暗黑两套）
   - 核心 UseCase 单测覆盖（排序、未读累计、撤回预览替换）
   - WS 集成自测脚本（手动步骤即可）

以上内容为「登录后主界面」的完整开发规范，Android Agent 应按此实施，不得擅自简化。
