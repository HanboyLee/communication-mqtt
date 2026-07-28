# src/modules/ — Agent 说明

本目录存放 **多 Topic / 会话** 相关的模块化逻辑，与 MQTT 订阅主题、会话生命周期、消息分发和 Tab UI 对应。入口应用 `src/sidepanel.js` 负责整体编排（连接、全局 UI、模式切换等），需要多主题能力时从此处导入并调用。

## 模块一览

| 文件 | 职责（一行） |
|------|----------------|
| `TopicManager.js` | Topic 会话状态与生命周期管理 |
| `TopicRouter.js` | 将入站消息路由到对应会话 |
| `TopicStorage.js` | 基于 `chrome.storage` 的会话持久化 |
| `TabRenderer.js` | Topic Tab / 面板 UI 渲染 |
| `index.js` | 统一 barrel 导出 |

## 与 sidepanel.js 的关系

- `sidepanel.js`：应用入口与编排器（连接、日志、设置、全局状态）。
- `src/modules/*`：可复用的领域模块；改 Topic 行为时优先动这里，再在 `sidepanel.js` 做薄接入。

保持模块边界清晰；新增 Topic 能力优先落在本目录，而不是把逻辑写回单体入口文件。
