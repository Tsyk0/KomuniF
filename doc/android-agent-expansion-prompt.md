# Komunif 前端扩展到 Android 端执行 Prompt（模块化）

## 0. 文档定位与使用方式

你是 Android 端实现 Agent。你的目标不是“重做一套新 IM”，而是严格按当前 Web 前端已经验证过的后端协议和交互，完成 Android 客户端落地。

实现原则：

1. API 协议优先：字段名、大小写、可选项必须与现有后端保持一致。
2. WS 协议优先：`action` 取值大小写敏感；消息去重与 ACK 对账逻辑不能简化。
3. 架构优先：采用 `MVVM + Repository`，并将 HTTP/WS 分层封装，避免 ViewModel 直接拼协议。
4. UI 风格优先：尽量对齐 Telegram 的交互习惯（信息密度、层级、反馈节奏），但不照搬视觉素材。
5. 可维护优先：领域模型、DTO、UI State 分离；核心流程有状态机和错误分层。

---

## 1. 推荐模块划分（按业务域 + 横切能力）

1. 基础架构与横切约定模块
2. 认证与账号模块（登录/注册/会话校验）
3. 用户资料与个人设置模块
4. 会话列表与会话创建模块
5. 消息收发与历史消息模块（核心）
6. 文件与多媒体消息模块
7. 好友关系与搜索模块
8. 群与成员管理模块
9. 通知与请求处理模块

说明：优先实现主链路 `2 + 4 + 5 + WS 基础能力`，即可跑通登录后实时聊天；其余模块并行补齐。

---

## 2. 基础架构与横切约定模块

### 2.1 统一响应格式（HTTP）

baseUrl为：http://localhost:8081，接口示例：http://localhost:8081/auth/sessions

后端响应基础结构：

- `code: number`
- `message: string`
- `data: T`
- `timestamp?: number`

Android 建议：

- `ApiEnvelope<T>`：仅对应后端响应，不直接给 UI。
- `DomainResult<T>`：仓储层输出给 UseCase（Success / BizError / NetworkError / Unauthorized）。
- `UiState<T>`：ViewModel 暴露给界面层（Loading / Content / Empty / Error）。

### 2.2 鉴权策略

当前前端同时存在 Cookie 与 Token 场景，Android 必须支持：

1. 请求拦截器自动携带 Access Token（若后端要求）。
2. 兼容 `withCredentials` 语义相关接口（如果网关策略仍依赖 Cookie）。
3. 启动阶段调用会话校验接口，决定是否进入主界面。

### 2.3 错误分层（必须）

- 网络层：超时、断网、DNS、TLS。
- 协议层：JSON 解析错误、字段缺失、类型不匹配。
- 业务层：`code != 200`（或后端成功码约定外）。
- 权限层：401/会话失效，触发统一登出流程。

### 2.4 MVVM + Repository 分层模板

每个业务模块统一结构：

- `data/remote/api/*Api.kt`：Retrofit 接口。
- `data/remote/ws/*WsClient.kt`：WS 连接与收发。
- `data/repository/*RepositoryImpl.kt`
- `domain/repository/*Repository.kt`
- `domain/usecase/*UseCase.kt`
- `presentation/*/viewmodel/*ViewModel.kt`
- `presentation/*/state/*UiState.kt`

约束：

1. ViewModel 不直接持有 Retrofit/OkHttp。
2. WS 消息不直接写 UI，必须先入 Repository 统一流。
3. DTO 与 UI Model 分离，避免后端字段变更直接冲击界面层。

---

## 3. 认证与账号模块

### 3.1 接口清单

1. 登录
   `POST /auth/sessions`

请求示例：

```json
{
  "userId": "10001",
  "userPwd": "password123",
  "rememberMe": true
}
```

响应要点：

- `data.userId: number`
- `data.user: User`
- `data.token?: string`
- `data.tokenInfo?: { expiration, issuedAt, expiresInSeconds }`

2. 会话校验
   `GET /auth/sessions/current`

响应要点：

- `data.valid: boolean`
- `data.userId: string`
- `data.user?: User`
- `data.token?: string`
- `data.refreshed?: boolean`

3. 注册
   `POST /registrations`

请求示例（精简）：

```json
{
  "userNickname": "Alice",
  "userPassword": "password123",
  "userEmail": "alice@example.com"
}
```

### 3.2 界面原型叙述（Telegram 风格）

- 登录页：极简垂直布局，顶部 Logo + 标题，中部账号密码，底部主按钮，辅助入口（注册/忘记密码）弱化。
- 输入反馈：错误即时提示但不弹窗轰炸，优先字段级提示。
- 成功后：进入会话页并预加载会话摘要，避免空白切页。

### 3.3 Android 架构建议

- `AuthRepository`: `login`, `checkSession`, `register`, `logout`.
- `AuthViewModel`: `loginState`, `sessionBootstrapState`.
- `SessionManager`: 单例持有 token/user 基础态，提供过期清理。

---

## 4. 用户资料与个人设置模块

### 4.1 接口清单

1. 更新用户资料
   `POST /user/updateAllAttri`

2. 获取用户信息
   `GET /user/{userId}`

3. 修改密码
   `POST /user/updatePwdWithOldPwd`

请求：

```json
{
  "oldPwd": "old123",
  "newPwd": "new123"
}
```

### 4.2 界面原型叙述

- 个人页：头像、昵称、签名、地区等分组展示，信息密度中等。
- 编辑页：单字段编辑优先，保存后局部刷新；失败显示可恢复文案。
- 安全页：修改密码单独入口，二次确认，成功后可提示重新登录。

### 4.3 Android 设计建议

- `ProfileRepository` 管理资料读写。
- `SettingsViewModel` 只管状态，不管字段映射细节。
- DTO 到 Domain 做字段兜底（null -> 空串 / 默认值）。

---

## 5. 会话列表与会话创建模块

### 5.1 接口清单

1. 会话摘要列表
   `GET /conversations/summary`

可选参数：

- `convId?: number`（用于单会话局部刷新）

关键字段（`ConversationSummaryDTO`）：

- `convId`, `convType`, `convName`, `convAvatar`
- `currentMemberCount`, `maxMemberCount`, `convStatus`
- `displayStatus`（0 置顶，1 默认，2 隐藏）
- `privateDisplayName`, `unreadCount`, `lastReadMessageId?`
- `targetUserId?`, `peer?`, `lastMessage`, `updateTime`, `memberStatus?`

2. 创建/复用会话
   `POST /conversations/create`

请求：

```json
{
  "single": true,
  "memberUserIds": [10002]
}
```

群聊请求示例：

```json
{
  "single": false,
  "memberUserIds": [10002, 10003, 10004],
  "convName": "项目讨论组"
}
```

响应（核心）：

- `data.success: boolean`
- `data.convId: number`
- `data.message: string`

### 5.2 界面原型叙述（Telegram 风格）

- 首页使用会话列表作为主入口：头像 + 标题 + 最后一条消息 + 时间 + 未读角标。
- 列表支持置顶分组（`displayStatus=0`），其余按更新时间排序。
- 浮动按钮用于“新建聊天/新建群”，进入联系人选择页。

### 5.3 Android 设计建议

- `ConversationRepository` 持有会话流（Flow/StateFlow）。
- 本地缓存 + 远端刷新混合策略：先本地后远端，提升冷启动体验。
- 会话点击后触发 WS `subscribe`（见 WS 模块）。

---

## 6. 消息收发与历史消息模块（核心）

### 6.1 HTTP 接口清单

1. 会话消息摘要分页
   `GET /messages/summary`
   参数：`convId, page?, pageSize?`

2. 按边界加载更旧消息
   `GET /messages/loadMore`
   参数：`convId, beforeMessageId?, pageSize?`

3. 锚点上下文
   `GET /messages/{messageId}/around`
   参数：`windowSize?`

4. 锚点前后分页
   `GET /messages/{boundaryMessageId}/before`
   `GET /messages/{boundaryMessageId}/after`

5. 撤回消息（HTTP 路径）
   `POST /conversations/{convId}/messages/{messageId}/recall`

6. 已读游标上报
   `POST /conversations/{convId}/mark-read`
   Body: `{ "messageId": 12345 }`

7. 最新已读回执
   `GET /message/latest/read-receipt`
   参数：`convId, limit?, offset?`

8. 消息搜索
   `GET /message-search/search`
   参数：`keyword?, convId?, senderId?, fromTime?, toTime?, page?, pageSize?`

### 6.2 消息数据关键字段（MessageSummaryDTO）

- `messageId`, `convId`, `senderId`, `messageType`, `messageContent`
- `messageStatus`, `isRecalled`, `sendTime`
- `displayName`, `senderAvatar`, `convType`, `isSentByMe`
- 引用：`replyToMessageId`, `replyToSenderDisplayName`, `replyToContentSnippet`
- `atUserIds`
- 文件扩展：`fileId`, `fileName`, `fileSize`, `fileMimeType`, `thumbnailUrl`, `downloadUrl`

### 6.3 界面原型叙述（Telegram 风格）

- 聊天页顶部：返回、标题、在线状态/成员数、更多菜单。
- 中间消息流：气泡简洁，时间弱化，连续消息合并间距。
- 底部输入区：文本输入 + 附件按钮 + 发送按钮；输入态与发送态及时反馈。
- 长按菜单：复制、回复、撤回（按权限展示）。
- 搜索结果可跳锚点，进入“上下文窗口”浏览。

### 6.4 Android 设计建议（强制）

- `MessageRepository` 统一聚合 HTTP 历史消息 + WS 实时消息。
- 消息列表采用单一数据源（例如 Room + Flow），UI 只订阅本地持久层。
- 发送采用“本地临时消息 -> ACK 对账 -> newMessage 最终落库”。
- 去重策略优先 `messageId`，辅助 `clientMessageId` 对账。

---

## 7. 文件与多媒体消息模块

### 7.1 接口清单

1. 初始化上传
   `POST /MIO/file/upload/init`

请求：

```json
{
  "convId": 20001,
  "fileName": "demo.png",
  "fileSize": 123456,
  "totalChunks": 8,
  "fileHash": "sha256...",
  "mimeType": "image/png"
}
```

响应：

- `uploadId: string | null`
- `instantUpload: boolean`
- `fileId: string | null`
- `uploadedIndexes: number[]`

2. 上传分片
   `POST /MIO/file/upload/chunk`（multipart/form-data）
   字段：`uploadId`, `index`, `file`

3. 查询上传进度
   `GET /MIO/file/upload/progress?uploadId=...`

4. 完成上传
   `POST /MIO/file/upload/complete`

请求：

```json
{
  "uploadId": "xxx",
  "fileHash": "sha256..."
}
```

响应：`data` 为 `fileId` 字符串。

### 7.2 关键链路（必须遵守）

1. 上传接口只产出 `fileId`，不直接写消息。
2. 最终必须调用 WS `sendMessage` 才会入库消息。
3. 禁止在上传完成后再走额外 HTTP 发消息入口，避免双消息。

### 7.3 界面原型叙述

- 附件面板：图片/视频/文件分类入口清晰，操作一步到达。
- 上传中：展示进度、可取消、失败可重试。
- 消息中展示缩略图/文件卡片，点击打开预览。

### 7.4 Android 设计建议

- `FileUploadRepository` 独立于 `MessageRepository`，通过 UseCase 组合。
- 分片上传支持断点续传（根据 progress 的 `uploadedIndexes` 补传）。
- 上传任务建议使用 WorkManager 管控后台与重试。

---

## 8. 好友关系与搜索模块

### 8.1 接口清单

1. 好友列表
   `GET /friends`

2. 好友详情
   `GET /friends/{friendId}/profile`

3. 更新备注与分组
   `PATCH /friends/{friendId}/remark`

请求：

```json
{
  "remarkName": "前端同学",
  "friendGroup": "工作"
}
```

4. 删除好友
   `DELETE /friends/{friendId}`

5. 发送好友申请
   `POST /friends/{userId}/friend-request`

6. 用户搜索
   `GET /user-search/search`

7. 会话搜索
   `GET /conversation-search/search`

### 8.2 界面原型叙述（Telegram 风格）

- 联系人页：按首字母/分组展示，顶部搜索。
- 用户详情页：头像、昵称、备注、操作按钮（发消息/加好友）。
- 添加好友流程：搜索 -> 查看资料 -> 发送申请 -> 等待处理。

### 8.3 Android 设计建议

- `FriendRepository` 与 `SearchRepository` 分开，避免职责膨胀。
- 好友关系状态（0/1/2/3）映射为可读枚举，UI 不直接用魔法值。

---

## 9. 群与成员管理模块

### 9.1 接口清单

1. 获取会话成员
   `GET /conversations/{convId}/members`

2. 更新会话信息
   `PATCH /conversations/{convId}`（multipart/form-data）
   字段可能包括：`convAvatarFile`, `convName`, `convDescription`, `enableReadReceipt`, `convType`, `convAvatar`

3. 更新当前用户群内名称
   `PATCH /conversations/{convId}/members/me/names`

4. 退出群
   `DELETE /conversations/{convId}/members/me`

5. 踢成员
   `DELETE /conversations/{convId}/members/{targetUserId}`

6. 禁言成员
   `POST /conversations/{convId}/members/{targetUserId}/mute`

7. 解除禁言
   `DELETE /conversations/{convId}/members/{targetUserId}/mute`

### 9.2 界面原型叙述

- 群详情页：群头像、群名、群公告、成员入口、群管理操作。
- 成员列表页：角色标识（群主/管理员/成员）、状态（正常/禁言）。
- 管理动作交互：关键操作二次确认，结果即时反馈。

### 9.3 Android 设计建议

- `GroupRepository` 与 `ConversationRepository` 可分离实现，防止会话模块过重。
- 管理类接口结果成功后，先本地乐观更新，再等 WS 同步校准。

---

## 10. 通知与请求处理模块

### 10.1 接口清单

1. 收件箱
   `GET /notifications/inbox`（分页）
   返回 `noti` 与 `rah` 两块数据。

2. 读取游标获取
   `GET /notifications/cursor`

3. 更新读取游标
   `POST /notifications/cursor`

请求：

```json
{
  "notificationLastReadId": 123456
}
```

4. 未读汇总
   `GET /notifications/unread-summary`

5. 发起入群申请
   `POST /request-handles/{convId}/join-requests`

6. 处理请求
   `POST /request-handles/handle`

请求：

```json
{
  "rahId": 20001,
  "handleAction": "accept",
  "rahFeedback": "同意加入"
}
```

`handleAction` 枚举：`accept | reject | ignore | dismiss | block`

### 10.2 界面原型叙述

- 通知中心分 Tab：系统通知 / 待处理请求。
- 列表项应可见状态（pending/accepted/rejected 等）与操作按钮。
- 全局角标与会话页提示保持一致，减少“已读但角标未清”错觉。

### 10.3 Android 设计建议

- `NotificationRepository` 管理 inbox、cursor、unreadSummary 一致性。
- 请求处理成功后，本地状态立即切换，再以 WS 推送校准最终态。

---

## 11. WebSocket 首次接入（重点详细版）

### 11.1 连接与订阅基础流程

标准流程：

1. 建立 WS 连接。
2. 收到下行 `connected`。
3. 进入某会话时发送上行 `subscribe`（携带 `convId`）。
4. 收到下行 `subscribed`。
5. 离开会话时发送 `unsubscribe`，收到 `unsubscribed`。

心跳：

- 上行纯文本：`ping`
- 下行纯文本：`pong`
- 注意：心跳不是 JSON 帧。

### 11.2 上行 action（客户端 -> 服务端）

1. `sendMessage`

必填字段：

- `action: "sendMessage"`
- `convId: number`
- `messageType: "text" | "image" | "file" | "audio" | "video" | "location" | "emoji" | "system"`
- `messageContent: string`
- `clientMessageId: string`（强烈建议必传）

可选字段：

- `replyToMessageId?: number | null`
- `mentionedUserIds?: number[] | null`
- `atUserIds?: number[] | null`（兼容旧字段）

重要约定：

- `messageType="text"` 时，`messageContent` 是普通文本。
- 非 text 时，`messageContent` 必须是 JSON 对象字符串。
- 非文本可附带文案字段：`textByTheWay`（兼容 `textbtw`）。

2. `readMessage`

- 字段：`action, convId, messageId`
- 用途：上报已读游标推进。

3. `recallMessage`

- 字段：`action, convId, messageId`
- 用途：撤回消息。

4. `typing`

- 字段：`action, convId, isTyping`（或历史兼容 `isCancel`）
- 用途：输入态广播。

5. `subscribe` / `unsubscribe`

- 字段：`action, convId`
- 用途：会话流订阅管理。

### 11.3 下行 action（服务端 -> 客户端）

1. `connected`：连接建立成功。

2. `messageSent`（仅发送者收到）

- 关键字段：`clientMessageId`, `messageId`, `success`
- 处理原则：仅做 ACK 对账，不新增消息行。

3. `newMessage`（会话订阅者都收到，含发送者）

- 处理原则：作为最终渲染源，按 `messageId` 去重并 upsert。

4. `messageRead`：已读同步。

5. `messageRecalled` / `messageRecallSuccess`：撤回广播/回执。

6. `userTyping`：对端输入态。

7. `subscribed` / `unsubscribed`：订阅确认。

8. `conversationPresence`：在线人数更新。

9. `newSystemNotification`：系统通知推送。

10. `newRequestHandle`：请求处理类推送。

11. `groupConvMemberManage`：群成员管理推送（踢出/禁言/解禁）。

12. `error`：统一错误反馈。

13. `speechToTextCompleted`：预留事件（当前可忽略但保留兼容）。

### 11.4 消息一致性策略（必须严格实现）

1. 本地发送时先插入临时消息（`messageStatus=0`）。
2. 必须生成唯一 `clientMessageId`；重试同一条消息复用原值。
3. 收到 `messageSent`：只更新临时消息状态与服务端 `messageId` 映射。
4. 收到 `newMessage`：按 `messageId` 去重/upsert，作为最终展示。
5. 不允许因 `messageSent` + `newMessage` 双路径导致重复渲染。

### 11.5 重连与补偿策略

1. WS 断开后进入重连状态（指数退避：1s/2s/4s...上限）。
2. 重连成功后重新订阅当前会话。
3. 调用历史消息接口拉增量，修复断线期间缺失消息。
4. 临时消息超过超时阈值未 ACK，标记发送失败并允许手动重试。

### 11.6 WS 在 Android 的推荐分层

- `WsConnectionManager`：连接生命周期、心跳、重连。
- `WsMessageCodec`：序列化/反序列化与 action 路由。
- `WsEventBus`（Flow）：向 Repository 广播标准化事件。
- `MessageRepository`：消费 WS 事件并落地本地数据库。
- `MessageViewModel`：仅订阅 UI 所需消息流，不解析原始 JSON。

---

## 12. Telegram 风格 UI 总体设计规范（跨模块）

1. 视觉层次：列表主导、边框弱化、留白紧凑、信息优先。
2. 交互节奏：高频操作一步可达，低频操作放二级菜单。
3. 反馈策略：状态变化优先轻提示（toast/snackbar/inline），少打断。
4. 列表性能：会话列表与消息流都必须支持增量更新与分页。
5. 深色模式：首版即支持，保证夜间聊天可用性。

---

## 13. 推荐实施顺序（给 Android Agent）

第 1 期（主链路）：

1. 认证模块
2. 会话列表模块
3. WS 基础连接 + 订阅
4. 消息模块（文本）
5. 文件上传 + 文件消息

第 2 期（增强）：

1. 已读回执与输入态
2. 消息搜索与锚点跳转
3. 好友与通知模块
4. 群管理模块

第 3 期（优化）：

1. 断线补偿与性能优化
2. 可观测性（日志、埋点、错误聚合）
3. UI 细节对齐与动画微调

---

## 14. 验收清单（关键）

1. 文本发送：每条消息仅展示一次，发送者收到 `messageSent + newMessage` 但无重复。
2. 文件发送：上传完成后通过 `sendMessage` 入库，仅一条消息。
3. 重连后：自动恢复订阅并补齐丢失消息。
4. 会话未读：进入/退出会话后已读游标正确推进。
5. 通知角标：通知中心已读与全局角标一致。
6. 群管理：踢人/禁言等动作可通过 WS 及时反映。

---

## 15. 对 Android Agent 的执行要求（硬性）

1. 先生成模块级任务分解（每模块输出类图/文件清单）。
2. 每实现一个模块，附“接口映射表 + 状态流转图 + 测试点”。
3. 每次提交不得绕过 Repository 直接在 ViewModel 写网络逻辑。
4. WS 相关提交必须包含去重与 ACK 对账单元测试/集成测试说明。
5. 发现后端字段歧义时，先兼容（双字段）再上报，不得阻塞主链路。

以上要求用于确保 Android 端实现与当前 Web 已上线行为一致，并具备长期可维护性。
