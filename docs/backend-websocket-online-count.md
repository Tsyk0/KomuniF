# 后端：会话在线人数（仅当前会话）实现说明

前端已按「只更新当前所在会话的在线人数」实现，避免其他会话人数变化时频繁推送。请后端按以下约定实现。

---

## 一、设计原则

- **只维护并推送「当前所在会话」的在线人数**：每个连接只关心用户**当前正在看的那个会话**的在线人数。
- **人数更新仅发生在两种时机**：  
  1. **切换会话时**：客户端发送 `subscribe(convId)`，后端回传该会话的当前在线人数。  
  2. **当前会话人数变化时**：该会话的订阅连接数发生变化时，仅向「当前正在看该会话」的连接推送更新，不向正在看其他会话的连接推送。

这样其他会话人数变化时不会触发推送，减少无效更新。

---

## 二、后端需维护的状态

- 每个 WebSocket 连接对应一个**当前所在会话**：`currentConvId`（该连接当前正在查看的会话 ID）。
- 每个会话对应一个**订阅该会话的连接集合**（session 集合），用于统计该会话在线人数，并在人数变化时决定向谁推送。

**约定**：

- 连接建立后，`currentConvId` 由客户端通过 `subscribe(convId)` 上报，后端只在此处更新。
- 当且仅当某会话的 session 集合发生变化（有人进入/离开该会话）时，向**当前所在会话正是该会话**（`currentConvId === 该会话 ID`）的连接推送该会话的最新在线人数，不向其他连接推送。

---

## 三、消息约定

### 3.1 客户端 → 服务端：订阅/切换当前会话

客户端在以下两种时机发送（JSON）：

```json
{
  "action": "subscribe",
  "convId": 123
}
```

- **连接建立后**：前端会在收到服务端 `connected` 后发送一条 `subscribe(当前打开的会话ID)`，用于拉取首屏「X人在线」并告知后端当前所在会话。
- **用户切换会话时**：前端会再发一条 `subscribe(新会话ID)`。

**后端处理**：

1. 将该连接的 `currentConvId` 更新为报文中的 `convId`。
2. 计算该会话当前在线人数（即该会话对应的 session 集合大小，或现有 `getConversationOnlineCount(convId)` 的语义）。
3. **立即**向该连接推送一条该会话的在线人数（格式见 3.2），使前端能显示「X人在线」。

---

### 3.2 服务端 → 客户端：当前会话在线人数

**格式**（JSON）：

```json
{
  "action": "conversationPresence",
  "convId": 123,
  "onlineCount": 4
}
```

**发送时机**：

1. **收到 `subscribe(convId)` 时**：向该连接发送一条 `conversationPresence(convId, 当前人数)`。
2. **某会话的 session 集合发生变化时**：仅向满足「该连接的 `currentConvId === 该会话 ID`」的连接发送一条 `conversationPresence(该会话ID, 新人数)`，不向当前在看其他会话的连接发送。

这样每个连接只会收到「自己当前所在会话」的人数更新，避免其他会话变化导致频繁刷新。

---

### 3.3 连接成功（可选）

连接建立后，服务端可下发一条 `connected`，例如：

```json
{
  "action": "connected",
  "userId": 10001
}
```

若在 `connected` 中附带当前会话在线人数（需服务端已知该连接当前会话，否则可省略），可选用其一：

- `conversationOnlineCount`
- `onlineCount`

前端会解析并展示；若未带，前端会通过 3.1 的 `subscribe` 拉取，二者取一即可。

---

## 四、流程小结

| 时机           | 客户端行为                    | 后端行为                                                                 |
|----------------|-------------------------------|--------------------------------------------------------------------------|
| 连接建立       | 收到 `connected` 后发 `subscribe(convId)` | 可选：在 `connected` 中带该会话人数；收到 `subscribe` 后更新 `currentConvId` 并回 `conversationPresence` |
| 用户切换会话   | 发 `subscribe(新convId)`      | 更新该连接的 `currentConvId`，并回 `conversationPresence(新convId, 人数)` |
| 某会话人数变化 | 无                            | 仅向 `currentConvId === 该会话ID` 的连接推送 `conversationPresence(convId, 新人数)` |

---

## 五、检查清单

- [ ] 为每个连接维护 `currentConvId`，且仅通过客户端 `subscribe(convId)` 更新。
- [ ] 收到 `subscribe(convId)` 时：更新 `currentConvId`，并立即回传 `conversationPresence(convId, onlineCount)`。
- [ ] 某会话的 session 集合变化时：只向「`currentConvId` 等于该会话 ID」的连接推送 `conversationPresence`，不向其他连接推送。
- [ ] `conversationPresence` 格式固定为：`action`、`convId`、`onlineCount`（非负整数）。
