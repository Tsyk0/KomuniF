# Komunif WebSocket 前后端联调指南（改造后）

本文档描述当前版本的统一约定：

- `sendMessage` 是唯一消息入库入口（文本/图片/视频/文件/混合内容都走它）
- `/MIO/file/upload/complete` 只负责文件落盘并返回 `fileId`
- `messageSent` 保留，作为发送成功回执
- `newMessage` 广播给会话所有订阅者（包含发送者自己）

## 1. 统一链路与状态机

### 1.1 建连与订阅

1. 前端建立 WS 连接
2. 后端回 `connected`
3. 前端进入会话发送 `subscribe`
4. 后端回 `subscribed`

### 1.2 发送消息（统一入口）

1. 前端先本地插入临时消息（`messageStatus=0`）
2. 前端发送 `sendMessage`（必须带 `clientMessageId`）
3. 后端入库成功后：
   - 单播给发送者 `messageSent`
   - 广播给会话订阅者 `newMessage`（含发送者）
4. 前端处理规则：
   - `messageSent` 只做 ACK 对账，不新增消息
   - `newMessage` 作为最终渲染源，按 `messageId` 去重/upsert

### 1.3 文件上传 + 消息发送（两阶段）

1. 前端调用 `/MIO/file/upload/init` 和 `/MIO/file/upload/complete`
2. `complete` 返回 `fileId`（或秒传时在 `init` 返回 `fileId`）
3. 前端组装 `messageContent`（可带文件 + 文本）并发送 `sendMessage`
4. 后端不会在上传链路自动写 `message`，避免双写

### 1.4 文件类消息待发队列（前端）

1. 用户选择文件后仅执行上传，拿到 `fileId` 后进入输入框上方“待发送附件”队列
2. 不在选中文件时立即发送 `sendMessage`
3. 用户按回车时，统一发送本次批次（文本 + 待发附件）
4. 该机制为后续“混合内容消息”提供前端交互基础

## 2. 上行消息（前端 -> 后端）

## 2.1 `ping`

- 用途：心跳保活
- 负载：纯文本 `"ping"`

## 2.2 `sendMessage`

- 用途：统一发送入口（文本/图片/视频/文件/混合）
- 必填字段：
  - `action: "sendMessage"`
  - `convId`
  - `messageType`
  - `messageContent`
  - `clientMessageId`
- 可选字段：
  - `replyToMessageId`
  - `atUserIds`

前端要求：

1. 每次发送生成唯一 `clientMessageId`
2. 重试同一条消息时复用原 `clientMessageId`
3. 仅使用 `clientMessageId`，不再使用 `localMessageId`

## 2.3 `readMessage`

- 用途：上报已读游标
- 必填：`action`、`convId`、`messageId`

## 2.4 `recallMessage`

- 用途：撤回消息
- 必填：`action`、`convId`、`messageId`

## 2.5 `typing`

- 用途：输入态广播
- 必填：`action`、`convId`、`isTyping`

## 2.6 `subscribe` / `unsubscribe`

- 用途：订阅/退订会话实时流
- 必填：`action`、`convId`

## 3. 下行消息（后端 -> 前端）

## 3.1 `connected`

- 连接建立成功

## 3.2 `messageSent`

- 发送成功回执（仅发送者收到）
- 关键字段：`clientMessageId`、`messageId`、`success`
- 前端处理：只做临时消息对账与状态更新，不新增消息行

## 3.3 `newMessage`

- 新消息广播（会话订阅者都收到，包含发送者）
- 前端处理：按 `messageId` 去重并 upsert 到消息列表

## 3.4 `messageRead`

- 已读游标同步

## 3.5 `messageRecalled` / `messageRecallSuccess`

- 撤回广播与撤回成功回执

## 3.6 `userTyping`

- 输入态通知

## 3.7 `subscribed` / `unsubscribed`

- 订阅动作确认

## 3.8 `conversationPresence`

- 在线人数更新

## 3.9 `newSystemNotification`

- 系统通知推送

## 3.10 `newRequestHandle`

- 申请处理类推送

## 3.11 `groupConvMemberManage`

- 群成员管理推送（踢出/禁言/解禁）

## 3.12 `error`

- 统一错误反馈

## 3.13 `speechToTextCompleted`（预留）

- 预留事件，当前未启用

## 4. 防重复策略（本次改造重点）

## 4.1 后端策略

1. 上传链路不写 `message`，只返回 `fileId`
2. 消息只在 `sendMessage` 入库
3. `newMessage` 广播给所有订阅者（含发送者）
4. `messageSent` 保留并仅单播给发送者

## 4.2 前端策略

1. `messageSent` 仅用于 ACK 对账
2. `newMessage` 作为最终渲染源
3. 消息列表按 `messageId` 去重（必要时再按 `clientMessageId` 辅助对账）
4. 文件消息流程中，禁止在 `complete` 后触发额外 HTTP 发消息入口

## 5. 联调验收清单（改造后）

1. 文本发送：每条只入库一次，发送者收到 `messageSent + newMessage`
2. 新文件上传后发送：只入库一次，不再出现同 `fileId` 双消息
3. 秒传文件发送：只入库一次，流程与非秒传一致
4. `messageSent` 全部可按 `clientMessageId` 命中临时消息
5. `newMessage` 到达后列表无重复行（`messageId` 去重有效）
6. 选择多个附件后，回车可一次性触发统一发送；发送前可逐个移除待发附件

## 6. 推荐日志字段（最小集）

- 上行：`action`、`convId`、`messageType`、`clientMessageId`
- 上传：`uploadId`、`fileId`、`instantUpload`
- 下行：`action`、`convId`、`messageId`、`clientMessageId`、`senderId`
- 前端状态：`tempMessageId`、ACK 命中结果、`newMessage` 去重结果
