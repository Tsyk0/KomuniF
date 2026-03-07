# 后端需求说明：会话信息与好友信息相关接口

本文档说明前端已对接或预留的接口，需要后端实现或保证行为一致。

---

## 一、会话详情接口：单聊返回对方用户 ID

**接口**：`GET /conversationDetail/getConversationDetailsViaToken`（或你方实际路径）

**需求**：  
在会话列表/详情中，当会话类型为**单聊**（`convType === 1`）时，请在该条会话对象中**增加并返回字段 `targetUserId`**，表示“对方用户 ID”（即好友的 userId）。

- **字段名**：`targetUserId`
- **类型**：`number`
- **含义**：单聊中除当前登录用户外的另一方的用户 ID（好友 userId）
- **仅当** `convType === 1` 时需要返回；群聊可不必返回或可为 null

**前端用途**：  
前端在单聊中点击聊天头部（chat-info）会打开“好友信息”面板，并调用 `friendInfo/getFriendInfoByUserIdAndFriendId` 拉取该好友详情。若会话详情中直接返回 `targetUserId`，则无需依赖消息列表推断对方 ID，体验更稳定。

**示例**（单聊一条）：

```json
{
  "convId": 101,
  "convType": 1,
  "convName": "张三",
  "convAvatar": "/uploads/avatars/2_xxx.jpg",
  "targetUserId": 2,
  ...
}
```

---

## 二、更新好友备注与分组接口（预留，需实现）

**接口**：`POST /friendInfo/updateRemarkAndGroup`  
（若你方路由规范不同，可改为例如 `PUT /friendRelation/updateRemarkAndGroup`，前端可配合修改 URL）

**请求**：

- **Content-Type**：`application/json`
- **需要鉴权**：是（与现有接口一致，如 Header 中 Authorization）
- **Body**：

```json
{
  "friendId": 2,
  "remarkName": "老张",
  "friendGroup": "同事"
}
```

| 字段         | 类型   | 必填 | 说明                         |
|--------------|--------|------|------------------------------|
| friendId     | number | 是   | 好友用户 ID                  |
| remarkName   | string | 否   | 备注名；传空字符串可清空备注 |
| friendGroup  | string | 否   | 分组名；传空字符串可清空分组 |

- 只传需要更新的字段即可（例如只改备注则只传 `friendId` + `remarkName`）。
- 后端应校验：当前登录用户与该 `friendId` 存在好友关系，且仅有关系双方可修改备注/分组。

**响应**：

- 成功：HTTP 200，Body 与现有统一响应格式一致，例如：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": "ok",
  "timestamp": 1772867038990
}
```

- 失败：如 400/401/403，以及 `code !== 200` 时的 `message` 用于前端 toast 提示。

**前端用途**：  
在单聊的“好友信息”面板（ConversationInfo）中，用户可编辑**备注**和**分组**，点击“应用”后前端会调用本接口提交；成功后前端会重新请求 `getFriendInfoByUserIdAndFriendId` 刷新展示。若你方实际 URL 或请求/响应格式不同，请告知前端以便对齐。

---

