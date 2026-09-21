# WebSocket & MQTT Side Panel Devtool

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/HanboyLee/communication-mqtt)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome--extension-manifest%20v3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![CI](https://img.shields.io/badge/CI-Passing-brightgreen.svg)](.github/workflows/ci.yml)

## 📌 项目简介

**WebSocket & MQTT Side Panel Devtool** 是一款专为 Google Chrome 打造的现代高性能 WebSocket 与 MQTT-over-WebSocket 实时调试工具。

采用 **Vanilla JS + Chrome Extension Manifest V3 + Vite + MQTT.js** 构建，具备极高的运行速度与纯粹的轻量架构。扩展全面支持 **Side Panel 侧边栏** 与 **独立浮动窗口（Floating Window）** 双 UI Shell 运行形态，支持多主题多会话分流、通配符路由匹配、交互式 JSON 树形图以及增量日志无损渲染，是 IoT 设备开发、前后端联调及实时消息测试的理想工具。

---

## ✨ 核心特性

- 🔌 **双模式连接支持**：
  - **原生 WebSocket**（`ws://` 与 `wss://`）
  - **MQTT-over-WebSocket**（支持认证、ClientID 自定义、Clean Session、自动重连等）
- 🪟 **双 UI Shell 形态**：
  - **Side Panel 侧边栏模式**：内嵌于浏览器右侧，无需切屏即可对照页面联调。
  - **独立浮动窗口模式**：通过专用快捷键或上下文菜单独立唤起，生命周期独立，防止切换 Tab 影响调试。
- 📑 **多主题独立会话（Topic Sessions）**：
  - 动态添加多个 MQTT 订阅主题，每个主题拥有独立 Tab 标签页。
  - 具备独立消息计数、未读指示、独立暂停/继续（Pause/Resume）、清屏控制。
  - **通配符路由匹配**：原生支持 MQTT 单层通配符（`+`）与多层通配符（`#`）智能分发。
- 🌳 **交互式 JSON 树形渲染（v0.2.0 新增）**：
  - **智能识别**：自动解析 TX/RX 中的 JSON 报文（自动识别并剥离前缀标签）。
  - **逐层折叠/展开**：支持 Object 与 Array 树形节点逐级展开与折叠，带有结构大小标注。
  - **语法高亮**：对 Key、String、Number、Boolean、Null 进行现代化配色渲染。
  - **增量追加渲染机制**：新数据流进入时采用 DOM 局部追加，**绝不重刷或折叠用户已展开的树节点**。
  - **快捷操作**：提供一键复制格式化 JSON 与复制原始报文。
- 💾 **本地状态与持久化**：
  - 自动记忆上次连接参数、认证信息、主题订阅与输入历史记录（`chrome.storage.local`）。
  - 输入框支持历史记录回填与 `Ctrl+Enter` 快速发送。
- 🌓 **现代化视觉设计**：
  - 完美适配浅色（Light）与深色（Dark）主题模式。
  - 滚动锁定与智能贴底滚动能力。
- 🚀 **自动化 CI/CD 流水线**：
  - GitHub Actions 跨平台（Node 18/20）自动化测试与构建门禁。
  - 语义化版本 Tag 自动触发产物打包并发布 GitHub Release。

---

## 📸 界面预览

> *侧边栏与独立窗口双模态调试界面*

![主界面预览](screenshot.png)

**功能区域概览**：
1. **顶部连接栏**：协议切换（WS/MQTT）、服务器地址、连接/断开控制、主题配置与独立窗口开关。
2. **多主题标签栏**：显示已订阅主题、未读角标、快速切换与关闭。
3. **日志展示区域**：气泡式消息流，直观标示发送（TX）、接收（RX）与系统日志（SYS），支持 JSON 树交互。
4. **会话控制栏**：暂停/恢复流、清空日志、自动滚动锁定。
5. **底部输入区**：快捷历史标签、多行输入与一键发送。

---

## 🛠️ 安装与使用

### 普通用户安装（从 Release 安装）

1. 前往本仓库 [Releases 页面](https://github.com/HanboyLee/communication-mqtt/releases) 下载最新发行版压缩包（如 `websocket-mqtt-devtool-v0.2.0.zip`）。
2. 解压压缩包到本地目录。
3. 打开 Google Chrome 或 Edge 浏览器，访问 `chrome://extensions/`。
4. 打开右上角的 **「开发者模式（Developer mode）」** 开关。
5. 点击左上角 **「加载已解压的扩展程序（Load unpacked）」** 按钮。
6. 选择解压出的扩展目录（包含 `manifest.json` 的目录）。
7. 点击浏览器工具栏中的拼图图标，将插件固定在工具栏，即可立即开始使用！

### 开发者安装与本地调试

#### 1. 前置依赖
- [Node.js](https://nodejs.org/)（推荐 18.x 或 20.x）
- npm（随 Node.js 一同提供）

#### 2. 克隆与安装
```bash
git clone https://github.com/HanboyLee/communication-mqtt.git
cd communication-mqtt
npm install
```

#### 3. 构建与打包
```bash
# 执行完整构建（包含 UI 模板校验与构建产物断言）
npm run build
```
> **注意**：构建输出目录为 `mqtt_dist_extension/`。

#### 4. 在 Chrome 中加载调试
1. 打开 Chrome 访问 `chrome://extensions/`。
2. 开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择项目根目录下的 **`mqtt_dist_extension`** 文件夹。
4. 本地修改代码后，重新执行 `npm run build`，并在扩展管理界面点击该扩展的「刷新」图标即可。

---

## ⌨️ 常用快捷键

| 操作 | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **打开独立浮动窗口** | `Ctrl + Shift + U` | `Command + Shift + U` |
| **发送消息** | `Ctrl + Enter` | `Command + Enter` |

---

## 💻 核心脚本命令

```bash
# 启动本地开发服务（热更新）
npm run dev

# 执行生产环境构建，生成 mqtt_dist_extension/
npm run build

# 监听模式构建（用于持续开发调试）
npm run watch

# 运行完整自动化测试套件（多主题匹配、UI Shell 孪生、JSON 树形渲染）
npm test

# 基于 sidepanel.html 重新生成 window.html 模板
npm run generate:window
```

---

## 📁 项目结构

```
communication-mqtt/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD 流水线配置
│       ├── ci.yml              # 持续集成门禁（Node 18/20 构建与测试）
│       └── release.yml         # 自动发版流水线（Tag 驱动打包 GitHub Release）
├── public/
│   ├── manifest.json           # Chrome Extension MV3 清单配置
│   └── icons/                  # 扩展各尺寸应用图标
├── src/
│   ├── sidepanel.html          # UI 源文件（DOM 结构源定义）
│   ├── sidepanel.js            # UI Shell 入口与事件调度编排
│   ├── window.html             # 独立浮动窗口孪生文件（由脚本自动生成，严禁手改）
│   ├── background.js           # MV3 Service Worker（轻量调度与窗口拉起）
│   ├── css/
│   │   ├── AGENTS.md           # 样式规范指引
│   │   └── styles.css          # 全局样式与暗黑/明亮主题定义
│   └── modules/                # 业务领域模块（高内聚、纯逻辑）
│       ├── AGENTS.md           # 模块设计硬约束规范
│       ├── TopicManager.js     # 多主题会话状态与生命周期
│       ├── TopicRouter.js      # MQTT 通配符（+/ #）多路路由分发器
│       ├── TopicStorage.js     # 本地持久化储存封装
│       ├── TabRenderer.js      # 多主题标签栏渲染器
│       ├── JsonTreeRenderer.js # 交互式 JSON 树形渲染器
│       └── index.js            # 模块导出入口
├── tests/                      # 自动化测试套件
│   ├── topic-matching.node.test.js  # MQTT 主题与通配符匹配测试
│   ├── ui-shell.node.test.js        # 双 UI Shell 契约测试
│   ├── json-tree.node.test.js       # JSON 解析与树节点 DOM 构建测试
│   └── check-dist-ui-shell.mjs      # 构建产物校验脚本
├── scripts/
│   └── generate-window-html.mjs# window.html 自动生成脚本
├── docs/                       # 架构设计与文档资产库
│   ├── 00-requirements.md      # 已完成需求台账（已对齐至 v0.2.0）
│   ├── 01-overview.md          # 产品概览与快捷键指南
│   ├── 02-architecture.md      # 总体架构设计与消息数据流
│   ├── 03-ui-components.md      # UI 组件库规范与视觉要求
│   ├── 04-development-guide.md # 本地开发与 Chrome 扩展调试排错指南
│   ├── 05-multiple-topics-plan.md # 多主题会话与通配符技术方案
│   ├── 06-ui-shell-popup-vs-sidepanel.md # 双 UI Shell 架构设计与演进
│   ├── 08-cicd-pipeline-plan.md # CI/CD 自动化流水线实施规划
│   └── TODO.md                 # 后续待办与演进路线图
├── mqtt_dist_extension/        # 本地生产构建输出目录（由 npm run build 生成，受 git 忽略）
├── package.json
└── vite.config.js
```

---

## 📚 详细文档路由

项目架构与设计细节收录在 `docs/` 目录下，可根据需要按需查阅：

| 文档 | 说明 |
| :--- | :--- |
| [**需求完成台账** (`docs/00-requirements.md`)](docs/00-requirements.md) | 全量功能特性履约清单与验证记录 |
| [**待办规划池** (`docs/TODO.md`)](docs/TODO.md) | 下一步功能演进路线与待办清单 |
| [**系统架构设计** (`docs/02-architecture.md`)](docs/02-architecture.md) | MV3 消息流向、Topic 路由与模块边界设计 |
| [**CI/CD 流水线规划** (`docs/08-cicd-pipeline-plan.md`)](docs/08-cicd-pipeline-plan.md) | GitHub Actions 双工作流配置标准与发版规范 |
| [**多主题会话设计** (`docs/05-multiple-topics-plan.md`)](docs/05-multiple-topics-plan.md) | MQTT 通配符匹配算法与 Tab 会话管理机制 |
| [**UI Shell 双模态设计** (`docs/06-ui-shell-popup-vs-sidepanel.md`)](docs/06-ui-shell-popup-vs-sidepanel.md) | Sidepanel 与 Window 孪生机制及历史抉择 |

---

## 🧪 质量与测试

本项目采用原生 Node.js 内置测试断言进行轻量无依赖的自动化测试，执行命令：
```bash
npm test
```
**包含以下关键测试用例**：
1. **MQTT 通配符匹配测试**：覆盖单层通配符（`+`）、多层通配符（`#`）、普通精确匹配及非法通配符场景。
2. **UI Shell 孪生一致性测试**：确保 `src/sidepanel.html` 与 `src/window.html` 的结构关键属性保持同步。
3. **JSON 树形渲染与解析测试**：验证 JSON 解析鲁棒性（支持前缀标签剔除、松散对象解析）、节点 DOM 渲染与折叠状态机制。

---

## 🤝 贡献与规范

欢迎提交 Issue 或 Pull Request！在贡献代码时请遵循以下约定：

1. **Vanilla JS 约束**：坚持无前端框架依赖（No React/Vue），保持纯粹原生 DOM 操作与现代 ES 语法。
2. **UI 孪生原则**：所有 UI 结构的修改必须在 `src/sidepanel.html` 中进行，严禁直接手改 `src/window.html`；修改后请运行 `npm run generate:window`。
3. **轻量后台**：`src/background.js` 严禁引入重度业务模块或 MQTT 库，仅负责生命周期与调度。
4. **提交信息格式**：遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范（如 `feat: xxx`、`fix: xxx`、`docs: xxx`）。

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 协议开源。
