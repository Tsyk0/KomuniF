# Interactions 使用说明

本文档说明 `src/interactions` 下每个文件负责什么，以及组件里如何使用它们。

## 设计规则

- `normalize`：只负责 API 请求与数据转换（DTO 处理、数据兜底、字段规范化）。
- `interactions`：只负责界面交互（输入框、滚动、点击联动、本地校验、列表拼接等）。
- 组件：只负责展示和触发，不写复杂的业务细节。

---

## 1) ChatContainer

- 文件：`src/interactions/chatContainer/ChatContainerInteraction.ts`
- 组件：`src/components/ChatContainer.vue`

### 负责的方法

- `resetMessageComposerView`：发送后清空输入框并重置高度。
- `resizeMessageComposer`：输入框按内容自动增高。
- `isContainerNearBottom`：判断消息区是否贴底。
- `scrollContainerToBottom`：滚动到底部。
- `runSearchAnchorJumpFlow`：搜索结果点击后定位到消息锚点。
- `runScrollPaginationStateMachine`：顶部/底部分页触发、防重复、防连触发。
- `loadConversationMessagesAndSyncRealtime`：切换会话时加载消息并同步 WS 订阅。
- `bindWindowWebSocketListeners`：绑定 websocket:newMessage / error 事件。

### 组件内怎么用

- 在 `ChatContainer.vue` 顶部通过 `import { ... } from "@/interactions/chatContainer/ChatContainerInteraction"` 引入。
- 发送消息、滚动、分页、跳锚点、WS 事件绑定均改为调用上述方法。

---

## 2) ConversationList

- 文件：`src/interactions/conversationList/ConversationListInteraction.ts`
- 组件：`src/components/ConversationList.vue`

### 负责的方法

- `searchConversationMatchedIdsByMessages`：根据关键词从 IndexedDB 消息里反查会话 ID。
- `openConversationByClick`：处理点击会话后的连续动作（选中、清空旧消息、加载消息、标记已读、上抛事件）。

### 组件内怎么用

- 搜索时调用 `searchConversationMatchedIdsByMessages` 更新命中集合。
- 点击会话时调用 `openConversationByClick`，组件不再手写整段流程。

---

## 3) ChatSearchPanel

- 文件：`src/interactions/chatSearchPanel/ChatSearchPanelInteraction.ts`
- 组件：`src/components/ChatSearchPanel.vue`

### 负责的方法

- `mapSearchSummaryToDisplayMessage`：把搜索返回 DTO 转成可直接渲染的消息对象。
- `runChatMessageSearch`：统一处理“本地优先 -> 远端回退 -> 加载更多 -> 请求竞态保护”。
- `buildChatSearchEmptyState`：生成清空搜索词后的默认状态。
- `mapChatSearchErrorMessage`：统一提取搜索异常文案。

### 组件内怎么用

- 在 `runSearch` 中调用 `runChatMessageSearch`，用返回结果更新 `results/total/page/searchSource`。

---

## 4) SystemNotificationContainer

- 文件：`src/interactions/systemNotification/SystemNotificationContainerInteraction.ts`
- 组件：`src/components/SystemNotificationContainer.vue`

### 负责的方法

- `canToggleNotificationActions`：该通知是否可展开操作按钮。
- `shouldShowNotificationActionButtons`：是否显示“通过/拒绝/拉黑”按钮。
- `resolveNotificationAccentVariant`：根据处理状态返回行强调样式。
- `shouldShowNotificationUnreadMeta`：是否显示未读角标。
- `resolveNotificationRelatedLabel`：根据 relatedUserId 解析好友展示名。
- `resolveNotificationOpenedActionId`：计算点击后按钮展开状态。
- `handleNotificationActionFlow`：执行通知处理并返回收口结果。

### 组件内怎么用

- 原本组件内的行规则函数已改为直接调用 interaction 方法。

---

## 13) FriendInfo

- 文件：`src/interactions/friendInfo/FriendInfoInteraction.ts`
- 组件：`src/components/FriendInfo.vue`

### 负责的方法

- `resolveFriendDisplayName`：生成好友展示名。
- `resolveFriendDisplayInitial`：生成头像占位首字母。
- `resolveNormalizedOnlineStatus`：规范化在线状态数值。
- `resolveOnlineStatusText`：生成在线状态文案。
- `resolveOnlineStatusClass`：生成在线状态样式类名。
- `resolveFriendGenderText`：生成性别文案。
- `loadFriendInfoFlow`：执行好友详情加载流程。

### 组件内怎么用

- `FriendInfo.vue` 已通过 interaction 处理显示文案和详情加载触发。

---

## 5) FriendPickSidebar

- 文件：`src/interactions/friendPickSidebar/FriendPickSidebarInteraction.ts`
- 组件：`src/components/FriendPickSidebar.vue`

### 负责的方法

- `resolveFriendDisplayName`：生成好友显示名兜底文案。
- `resolveFriendAvatarUrl`：生成可用头像 URL。
- `filterSelectableFriends`：过滤可选好友（排除本人）。

### 组件内怎么用

- `FriendPickSidebar.vue` 用这些方法替代组件内同名小函数。

---

## 6) UserSearch

- 文件：`src/interactions/userSearch/UserSearchInteraction.ts`
- 组件：`src/components/UserSearch.vue`

### 负责的方法

- `resolveSelfUserId`：计算当前登录用户 ID。
- `buildSyncHint`：生成“数据同步中”提示文案。
- `canLoadMoreUsers`：判断是否还能加载更多。
- `resolveDetailNickname / resolveDetailInitial / resolveDetailGender`：详情区显示文案。
- `isSelfUser`：判断是否本人。
- `mergeUsersWithoutDuplicate`：分页结果拼接并去重。
- `mapUserSearchErrorMessage`：搜索错误文案统一提取。
- `mapFriendRequestErrorMessage`：好友申请错误文案统一提取。
- `shouldClearUserDetailOnPaneClick`：判断点击左侧空白时是否收起详情。
- `executeUserSearchFlow`：执行一次搜索并返回状态更新结果。
- `executeFriendRequestFlow`：执行好友申请并返回统一结果。

### 组件内怎么用

- `UserSearch.vue` 里对应逻辑已改为调用 interaction 方法，组件只保留触发流程。

---

## 7) ConversationInfo

- 文件：`src/interactions/conversationInfo/ConversationInfoInteraction.ts`
- 组件：`src/components/ConversationInfo.vue`

### 负责的方法

- `resolveMemberDisplayName`：成员显示名规则。
- `resolveFriendGenderText`：好友性别文案。
- `resolveConversationStatusText`：会话状态文案。
- `syncConversationEditableFields / syncFriendEditableFields`：编辑区回填。
- `hasConversationEditableChanges / hasFriendEditableChanges`：改动检测。
- `validateFriendRemarkInputs`：备注/分组输入校验。
- `buildFriendRemarkUpdatePayload`：好友备注更新参数生成。
- `buildConversationUpdatePayload`：会话资料更新参数生成。
- `compressImageToBase64`：头像压缩。
- `loadFriendInfoFlow`：加载好友资料流程。
- `loadConversationInfoFlow`：加载会话资料流程。
- `refreshConversationAfterUpdateFlow`：保存后刷新详情流程。

### 组件内怎么用

- `ConversationInfo.vue` 已改为调用这些方法处理显示、校验、payload 组装与头像压缩。

---

## 8) UserProfileEdit

- 文件：`src/interactions/userProfileEdit/UserProfileEditInteraction.ts`
- 组件：`src/components/UserProfileEdit.vue`

### 负责的方法

- `formatDateForInput`：日期输入格式化。
- `buildProfileFormData`：初始化编辑表单数据。
- `compressImageToBase64`：头像压缩。
- `validateUserProfileForm`：昵称/手机/邮箱校验。
- `buildUserProfileUpdatePayload`：更新 payload 生成。
- `mapUserProfileSaveError / mapAvatarUploadError`：错误文案映射。
- `shouldResetProfileForm`：重置前确认。

### 组件内怎么用

- `UserProfileEdit.vue` 已用 interaction 方法替代原组件内同类逻辑。

---

## 9) ConvCreatePanel

- 文件：`src/interactions/convCreatePanel/ConvCreatePanelInteraction.ts`
- 组件：`src/components/ConvCreatePanel.vue`

### 负责的方法

- `canSubmitConvCreate`：判断创建按钮是否可用。
- `validateConvCreateDraft`：校验群名和成员数量。
- `normalizeSelectedMemberIds`：清洗并规范化成员 ID。
- `mapConvCreateErrorMessage`：统一提取创建失败文案。

### 组件内怎么用

- `ConvCreatePanel.vue` 调用 interaction 处理校验、ID 清洗、异常映射。

---

## 10) LoginForm

- 文件：`src/interactions/loginForm/LoginFormInteraction.ts`
- 组件：`src/components/LoginForm.vue`

### 负责的方法

- `resolveRememberedAccountState`：解析记住我缓存并给出 UI 状态。
- `resolveUserIdChangeState`：用户 ID 改动后计算免密提示状态。
- `validateLoginForm`：登录必填项校验。
- `mapLoginErrorMessage`：登录异常文案映射。

### 组件内怎么用

- `LoginForm.vue` 使用 interaction 处理记住我逻辑、输入变化逻辑和登录前校验。

---

## 11) RegisterForm

- 文件：`src/interactions/registerForm/RegisterFormInteraction.ts`
- 组件：`src/components/RegisterForm.vue`

### 负责的方法

- `createRegisterErrors`：创建空错误对象。
- `validateRegisterForm`：执行注册表单完整校验。
- `buildRegisterSuccessNotice`：生成注册成功提示文案。
- `mapRegisterExceptionMessage`：注册异常文案映射。

### 组件内怎么用

- `RegisterForm.vue` 调用 interaction 完成表单校验与异常处理，组件只保留提交触发。

---

## 12) ChangePassword

- 文件：`src/interactions/changePassword/ChangePasswordInteraction.ts`
- 组件：`src/components/ChangePassword.vue`

### 负责的方法

- `isChangePasswordFormSubmittable`：判断提交按钮是否可点。
- `validateNewPasswordInput`：校验新密码规则。
- `createEmptyChangePasswordForm`：创建空表单数据。
- `createEmptyChangePasswordErrors`：创建空错误对象。

### 组件内怎么用

- `ChangePassword.vue` 调用 interaction 完成校验、错误重置与表单重置。

---

## 新增 interaction 的写法约定

- 文件名：`组件名 + Interaction.ts`（示例：`ChatContainerInteraction.ts`）。
- 顶部必须有“方法目录（方法：功能）”。
- 每个导出方法必须有注释，写清“做什么”。
- 组件内只保留：渲染、事件绑定、最少量状态。复杂过程都下沉到 interaction。
