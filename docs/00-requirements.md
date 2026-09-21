# 需求管理与已完成需求台账

本文档是本项目**已完成需求**的记录与归档台账。所有已开发、测试并合并的需求均在此记录，并通过复选框 `- [x]` 进行勾选标记。

> 📌 **注意**：
> - **未完成的需求与待办事项**记录在 [`docs/TODO.md`](file:///D:/googleExtension/websocketExtension/docs/TODO.md)。
> - 每次使用 Agent CLI / 开始工作时，**第一件事必须先检查 [`docs/TODO.md`](file:///D:/googleExtension/websocketExtension/docs/TODO.md)** 中是否有未完成的待办事项。
> - 当某个待办需求开发完成并验证后，从 [`docs/TODO.md`](file:///D:/googleExtension/websocketExtension/docs/TODO.md) 迁移至本文档，打勾 `- [x]` 归档。

---

## 需求生命周期与流转规则

```
[新需求提出] ──> 登记到 docs/TODO.md (- [ ]) ──> 开发与测试 (进行中) ──> 验证通过 ──> 迁移至 docs/00-requirements.md (- [x]) 归档
```

1. **未完成需求**：统一收录于 [`docs/TODO.md`](file:///D:/googleExtension/websocketExtension/docs/TODO.md)，使用 `- [ ]`。
2. **已完成需求**：统一收录于本文档，使用 `- [x]`，并记录需求编号、完成范围、关键实现及关联文档。

---

## 已完成需求清单 (Completed Requirements)

- [x] **REQ-001**: WebSocket 基础连接与收发调试
- [x] **REQ-002**: MQTT-over-WebSocket 协议支持与参数配置
- [x] **REQ-003**: MQTT 多主题（Topic）分 Tab 独立会话系统
- [x] **REQ-004**: 主题通配符匹配与消息路由引擎
- [x] **REQ-005**: Topic 会话状态与持久化恢复（chrome.storage）
- [x] **REQ-006**: 双 UI Shell 形态切换（Side Panel 侧边栏 vs 独立浮动窗口）
- [x] **REQ-007**: 独立浮动窗口生命周期保障与孪生渲染（`window.html`）
- [x] **REQ-008**: 消息日志自动触底滚动与滚动锁定（Scroll Lock）优化
- [x] **REQ-009**: 消息历史记录与快捷填充芯片（Chips）
- [x] **REQ-010**: 现代化毛玻璃（Glassmorphism）与 Light/Dark 双主题系统
- [x] **REQ-011**: 消息日志 JSON 交互式树形结构展开与折叠 (Tree View)

---

## 已完成需求详细记录

### REQ-001: WebSocket 基础连接与收发调试
- **需求状态**：- [x] 已完成
- **分类**：核心协议 / 连接管理
- **需求描述**：提供基于 Chrome MV3 的原生 WebSocket 调试能力，支持 `ws://` 与 `wss://` 连接、状态指示灯、文本消息即时收发与断开。
- **关键代码/文件**：
  - 入口与连接编排：[`src/sidepanel.js`](file:///D:/googleExtension/websocketExtension/src/sidepanel.js)
  - 界面骨架：[`src/sidepanel.html`](file:///D:/googleExtension/websocketExtension/src/sidepanel.html)
- **关联文档**：[`docs/01-overview.md`](file:///D:/googleExtension/websocketExtension/docs/01-overview.md), [`docs/04-development-guide.md`](file:///D:/googleExtension/websocketExtension/docs/04-development-guide.md)

---

### REQ-002: MQTT-over-WebSocket 协议支持与参数配置
- **需求状态**：- [x] 已完成
- **分类**：核心协议 / 配置管理
- **需求描述**：引入 MQTT.js 库支持 MQTT v3.1.1 协议，支持 Client ID 随机生成与自定义、用户名/密码认证、Keepalive 与 Clean Session 配置。
- **关键代码/文件**：
  - MQTT 连接与客户端逻辑：[`src/sidepanel.js`](file:///D:/googleExtension/websocketExtension/src/sidepanel.js)
- **关联文档**：[`docs/01-overview.md`](file:///D:/googleExtension/websocketExtension/docs/01-overview.md)

---

### REQ-003: MQTT 多主题（Topic）分 Tab 独立会话系统
- **需求状态**：- [x] 已完成
- **分类**：业务特性 / UI 交互
- **需求描述**：解决单一日志区域混乱问题，允许同时订阅多个 MQTT 主题，并通过顶部 Tab 栏在不同主题会话之间自由切换，各会话具备独立的日志视图。
- **关键代码/文件**：
  - 状态管理：[`src/modules/TopicManager.js`](file:///D:/googleExtension/websocketExtension/src/modules/TopicManager.js)
  - Tab 渲染：[`src/modules/TabRenderer.js`](file:///D:/googleExtension/websocketExtension/src/modules/TabRenderer.js)
- **关联文档**：[`docs/05-multiple-topics-plan.md`](file:///D:/googleExtension/websocketExtension/docs/05-multiple-topics-plan.md), [`src/modules/AGENTS.md`](file:///D:/googleExtension/websocketExtension/src/modules/AGENTS.md)

---

### REQ-004: 主题通配符匹配与消息路由引擎
- **需求状态**：- [x] 已完成
- **分类**：核心算法 / 消息路由
- **需求描述**：支持 MQTT 单级通配符（`+`）与多级通配符（`#`），入站消息能够精准匹配订阅规则并路由至对应的会话 Tab。
- **关键代码/文件**：
  - 路由引擎：[`src/modules/TopicRouter.js`](file:///D:/googleExtension/websocketExtension/src/modules/TopicRouter.js)
  - 单元测试：[`tests/topic-matching.node.test.js`](file:///D:/googleExtension/websocketExtension/tests/topic-matching.node.test.js)

---

### REQ-005: Topic 会话状态与持久化恢复
- **需求状态**：- [x] 已完成
- **分类**：存储持久化
- **需求描述**：基于 `chrome.storage.local` 持久化订阅的主题列表、当前激活会话以及会话显示配置（`autoScroll`, `jsonFormat` 等），页面重开后无缝恢复。
- **关键代码/文件**：
  - 存储适配器：[`src/modules/TopicStorage.js`](file:///D:/googleExtension/websocketExtension/src/modules/TopicStorage.js)

---

### REQ-006: 双 UI Shell 形态切换（Side Panel vs 独立浮动窗口）
- **需求状态**：- [x] 已完成
- **分类**：架构 / 扩展形态
- **需求描述**：允许用户在偏好设置中选择使用 Chrome 侧边栏（Side Panel）或独立可拖拽浮动窗口（Floating Window）。彻底规避传统 Action Popup 失去焦点自动销毁导致断连的问题。
- **关键代码/文件**：
  - Service Worker 调度：[`src/background.js`](file:///D:/googleExtension/websocketExtension/src/background.js)
  - UI 模式与配置同步：[`src/sidepanel.js`](file:///D:/googleExtension/websocketExtension/src/sidepanel.js)
  - 规范化测试：[`tests/ui-shell.node.test.js`](file:///D:/googleExtension/websocketExtension/tests/ui-shell.node.test.js)
- **关联文档**：[`docs/06-ui-shell-popup-vs-sidepanel.md`](file:///D:/googleExtension/websocketExtension/docs/06-ui-shell-popup-vs-sidepanel.md)

---

### REQ-007: 独立浮动窗口生命周期保障与孪生渲染
- **需求状态**：- [x] 已完成
- **分类**：工程化 / 构建工具
- **需求描述**：构建期通过自动化脚本从 `sidepanel.html` 衍生生成 `window.html`（`data-shell=window`），保证两套形态 DOM 与功能完全一致；Service Worker 单例聚焦管理防止重复开窗。
- **关键代码/文件**：
  - 孪生生成脚本：[`scripts/generate-window-html.mjs`](file:///D:/googleExtension/websocketExtension/scripts/generate-window-html.mjs)
  - 窗口模式样式适配：[`src/css/styles.css`](file:///D:/googleExtension/websocketExtension/src/css/styles.css)
  - 产物校验：[`tests/check-dist-ui-shell.mjs`](file:///D:/googleExtension/websocketExtension/tests/check-dist-ui-shell.mjs)

---

### REQ-008: 消息日志自动触底滚动与滚动锁定（Scroll Lock）优化
- **需求状态**：- [x] 已完成
- **分类**：用户体验 / 细节打磨
- **需求描述**：修复会话消息面板触底自动滚动的误判问题，提供顺畅的人工查看与锁定机制；移除头部多余的锁定控件与冗余的浮动窗口生命周期提示横幅。
- **关键代码/文件**：
  - 交互修复：[`src/sidepanel.js`](file:///D:/googleExtension/websocketExtension/src/sidepanel.js)

---

### REQ-009: 消息历史记录与快捷填充芯片（Chips）
- **需求状态**：- [x] 已完成
- **分类**：交互体验
- **需求描述**：记录最近发送的消息历史（上限可配置），并在输入框下方提供快捷点击填充的 Chip 按钮，支持快速重新发送。
- **关键代码/文件**：
  - 历史处理逻辑：[`src/sidepanel.js`](file:///D:/googleExtension/websocketExtension/src/sidepanel.js)

---

### REQ-010: 现代化毛玻璃与 Light/Dark 双主题系统
- **需求状态**：- [x] 已完成
- **分类**：视觉美学 / 设计系统
- **需求描述**：符合高标准视觉审美，提供深色与浅色双模式平滑切换，采用 Glassmorphism 毛玻璃质感、定制滚动条与细微微交互动画。
- **关键代码/文件**：
  - 样式表：[`src/css/styles.css`](file:///D:/googleExtension/websocketExtension/src/css/styles.css)

---

### REQ-011: 消息日志 JSON 交互式树形结构展开与折叠 (Tree View)
- **需求状态**：- [x] 已完成
- **分类**：UI/UX 交互 / 数据呈现
- **需求描述**：提供交互式 JSON Tree View，支持分级折叠/展开、节点元素数量摘要、全量展开/折叠控制栏、语法高亮（key/string/number/bool/null）、一键复制原始 JSON；同时保持非合法 JSON 平滑回退普通纯文本。
- **关键代码/文件**：
  - 领域模块：[`src/modules/JsonTreeRenderer.js`](file:///D:/googleExtension/websocketExtension/src/modules/JsonTreeRenderer.js)
  - 模块导出：[`src/modules/index.js`](file:///D:/googleExtension/websocketExtension/src/modules/index.js)
  - 样式定义：[`src/css/styles.css`](file:///D:/googleExtension/websocketExtension/src/css/styles.css)
  - 页面集成：[`src/sidepanel.js`](file:///D:/googleExtension/websocketExtension/src/sidepanel.js)
  - 单元测试：[`tests/json-tree.node.test.js`](file:///D:/googleExtension/websocketExtension/tests/json-tree.node.test.js)

