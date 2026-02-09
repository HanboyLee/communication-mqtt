# WebSocket Side Panel Devtool

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/websocket-extension)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome--extension-manifest%20v3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)

## 项目简介

WebSocket Side Panel Devtool 是一款专为 Chrome 浏览器打造的 WebSocket 和 MQTT 调试工具。通过 Chrome Side Panel API，该扩展为开发者提供了便捷的侧边栏调试环境，支持实时消息收发、日志记录、主题管理等强大功能。

无需离开当前标签页即可调试 WebSocket 连接，是前后端开发、IoT 设备调试、实时通信测试的理想工具。

## 核心功能

- 🔌 **双模式连接**：支持原生 WebSocket 和 MQTT-over-WebSocket 两种连接模式
- 📑 **多主题管理**：同时订阅多个 MQTT 主题，独立管理每个主题的消息日志
- 📝 **实时消息日志**：气泡式消息展示，区分发送（TX）、接收（RX）和系统（SYS）消息
- 💾 **消息历史记录**：自动保存发送历史，一键快速重发
- ⏱️ **自动断开**：可配置空闲超时自动断开连接，节省资源
- 🌙 **主题切换**：支持亮色/暗色双主题，护眼又美观
- ⏸️ **会话控制**：每主题独立暂停/恢复、JSON 格式化、自动滚动
- 🔧 **灵活配置**：支持手动输入 URL 或通过设置面板构建连接参数
- 📊 **状态指示**：实时显示连接状态和消息统计

## 截图

> *主界面 - 侧边栏调试面板*

![主界面](screenshot.png)

主要界面区域：
- 左上角：连接状态指示器
- 顶部栏：URL 输入、连接控制、主题切换
- 主题标签栏：多主题切换和管理
- 日志区域：气泡式消息展示
- 会话工具栏：暂停、清空、JSON格式化等控制
- 底部输入区：消息发送和历史记录快捷按钮

## 安装说明

### 前置要求

- **浏览器**：Google Chrome（版本 114+）或 Microsoft Edge（版本 114+），需支持 Side Panel API
- **开发环境**：
  - [Node.js](https://nodejs.org/) 版本 18.x 或更高
  - npm（随 Node.js 一起安装）

### 普通用户安装

1. 下载最新版本的扩展压缩包
2. 解压缩找到 `dist/` 文件夹
3. 打开 Chrome 浏览器，导航至 `chrome://extensions/`
4. 启用右上角的「开发者模式」
5. 点击「加载已解压的扩展程序」按钮
6. 选择解压后的 `dist/` 文件夹
7. 扩展安装完成，可以使用了！

### 开发者安装

1. **克隆项目仓库**：
   ```bash
   git clone https://github.com/yourusername/websocket-extension.git
   cd websocket-extension
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **构建扩展**：
   ```bash
   # 开发模式（热重载）
   npm run dev

   # 生产构建
   npm run build

   # 监听模式（自动重新构建）
   npm run watch
   ```

4. **在 Chrome 中加载**：
   - 打开 `chrome://extensions/`
   - 启用「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择 `dist/` 文件夹

## 快速开始

### 打开侧边栏

1. 点击浏览器工具栏中的扩展图标
2. 从上下文菜单中选择「打开侧边栏」
3. WebSocket/MQTT 调试工具将显示在侧边栏中

### 连接服务器

**WebSocket 模式**：
1. 输入 WebSocket URL（如 `wss://echo.websocket.org`）
2. 点击「连接」按钮
3. 连接成功后状态指示器将变为绿色

**MQTT 模式**：
1. 点击模式切换开关切换到 MQTT
2. 输入 MQTT-over-WebSocket URL（如 `wss://test.mosquitto.org:8081/mqtt`）
3. 可选：在设置面板中配置认证（用户名/密码）
4. 点击「连接」按钮

### 订阅 MQTT 主题

1. 在 MQTT 模式下，在主题输入字段中输入主题名称（如 `sensors/temperature`）
2. 连接后扩展会自动订阅该主题
3. 接收的消息将带有时间戳和负载显示在日志区域

### 管理多主题标签页

扩展支持通过标签页界面同时管理多个 MQTT 主题：

1. **创建新主题标签**：
   - 点击现有标签旁边的「+」按钮
   - 在对话框中输入主题名称（如 `sensors/humidity`）
   - 为该特定主题创建一个新标签

2. **切换主题**：
   - 点击任意标签切换到该主题的视图
   - 日志区域仅显示所选主题的消息
   - 每个主题维护自己的消息历史

3. **向主题发送消息**：
   - 选择所需主题的标签
   - 在输入字段中输入消息负载
   - 按 `Ctrl+Enter` 或点击发送

4. **管理主题标签**：
   - 每个标签显示主题名称
   - 活动标签会高亮显示
   - 消息按主题过滤，清晰明了

## 使用指南

### 发送消息

1. 确保已连接到服务器
2. 对于 MQTT：选择所需的主题标签
3. 在底部输入字段中输入消息
4. 按 `Ctrl+Enter` 或点击「发送」按钮
5. 发送的消息在日志中显示为蓝色 `tx` 标记

### 其他功能

- **设置面板**：点击齿轮图标配置高级选项（认证、自动重连、空闲超时）
- **消息历史**：以前的消息作为标签显示在输入字段上方，便于快速重用
- **主题切换**：使用太阳/月亮图标在亮色和暗色主题之间切换
- **自动滚动**：切换滚动锁定以在新消息到达时暂停自动滚动

## 配置选项

### 连接设置

访问设置面板（齿轮图标）以配置：

| 选项 | 说明 | 默认值 |
|------|------|--------|
| 连接模式 | WebSocket 或 MQTT | `mqtt` |
| 客户端 ID | MQTT 客户端标识 | 自动生成 |
| 协议 | `ws` 或 `wss` | `ws` |
| 主机 | 服务器地址 | `192.168.10.190` |
| 端口 | 服务器端口 | `8884` |
| 路径 | MQTT 路径 | `/mqtt` |
| SSL/TLS | 启用加密连接 | 关闭 |
| 用户名 | 认证用户名 | - |
| 密码 | 认证密码 | - |
| 自动重连 | 断开后自动重连 | 关闭 |
| 发布主题 | MQTT 发布消息的主题 | - |
| 空闲超时 | 无操作自动断开时间（秒） | `0`（禁用） |
| 历史记录数 | 保存的历史消息数量 | `5` |

### 存储键值

扩展使用 `chrome.storage.local` 进行持久化：

| 键 | 描述 |
|-----|------|
| `ws:url` | 最后使用的连接 URL |
| `ws:idleSeconds` | 空闲超时设置 |
| `ws:history` | 消息历史数组 |
| `ws:historySize` | 最大历史大小（1-50） |
| `ws:theme` | 当前主题（`light` 或 `dark`） |
| `ws:connConfig` | 连接配置对象 |
| `ws:topicConfigs` | 多主题会话配置 |
| `ws:activeTopicId` | 当前活动主题会话 |
| `ws:topicOrder` | 主题会话的标签顺序 |

## 技术栈

### 核心依赖

- **[mqtt](https://github.com/mqttjs/MQTT.js)** (v5.3.6) – MQTT over WebSocket 客户端库
- **[vite-plugin-node-polyfills](https://github.com/nickcrawford/vite-plugin-node-polyfills)** – 浏览器兼容的 Node.js polyfills

### 开发工具

- **[Vite](https://vitejs.dev/)** (v5.2.0) – 快速构建工具和开发服务器
- **[PostCSS + Autoprefixer](https://postcss.org/)** – CSS 处理和供应商前缀
- **[Tailwind CSS](https://tailwindcss.com/)** – 实用优先的 CSS 框架

### UI 资源

- **[Font Awesome](https://fontawesome.com/)** – 图标集（通过 CDN 加载）
- **[Inter](https://rsms.me/inter/)** – 主要 UI 字体
- **[JetBrains Mono](https://www.jetbrains.com/lp/mono/)** – 代码等宽字体

## 项目结构

```
websocketExtension/
├── src/
│   ├── sidepanel.html          # 主 HTML 结构
│   ├── sidepanel.js            # 核心应用逻辑
│   ├── styles.css              # 使用 CSS 变量的样式
│   ├── modules/                # 多主题管理系统
│   │   ├── topicManager.js     # 会话生命周期和主题匹配
│   │   ├── topicRouter.js      # 消息路由到会话
│   │   ├── topicStorage.js     # Chrome 存储持久化
│   │   ├── tabRenderer.js      # 标签栏 UI 渲染
│   │   └── index.js            # 模块导出
│   └── tests/                  # 模块单元测试
├── public/
│   ├── manifest.json           # Chrome 扩展清单（V3）
│   └── icons/                  # 扩展图标
├── docs/                       # 项目文档
├── dist/                       # 构建输出（生成）
├── vite.config.js              # Vite 配置
└── package.json                # 依赖和脚本
```

## 架构设计

应用遵循模块化架构，关注点分离清晰：

```
┌─────────────────────────────────────────────────────────────┐
│                      sidepanel.js (主程序)                   │
│  - WebSocket/MQTT 连接管理                                    │
│  - UI 事件处理器                                              │
│  - 模块编排                                                   │
└─────────────┬───────────────────────────────────────────────┘
              │
    ┌─────────┴─────────────────────────────┐
    │                                       │
    ▼                                       ▼
┌─────────────────┐                 ┌─────────────────┐
│  TopicManager   │◄────────────────│  TopicRouter    │
│  - 会话管理      │                 │  - 消息接收     │
│  - 活动状态      │                 │  - 消息发送     │
│  - 主题匹配      │                 │  - 系统消息     │
└────────┬────────┘                 └─────────────────┘
         │                                   │
    ┌────┴────────┐                   ┌──────┴───────┐
    │             │                   │              │
    ▼             ▼                   ▼              ▼
┌─────────┐ ┌──────────┐      ┌──────────┐  ┌────────────┐
│TabRender│ │TopicStore│      │   MQTT   │  │   Storage  │
│   UI    │ │  配置     │      │  客户端  │  │chrome.local│
└─────────┘ └──────────┘      └──────────┘  └────────────┘
```

### 模块说明

**TopicManager**：所有主题会话的中央状态管理器。处理会话生命周期、MQTT 通配符主题匹配和活动会话跟踪。

**TopicRouter**：根据 MQTT 通配符规则（`+` 单级，`#` 多级）将传入的 MQTT 消息路由到匹配的 TopicSession 实例。

**TopicStorage**：使用 Chrome 的 `chrome.storage.local` API 的持久化层。更改时自动保存会话配置。

**TabRenderer**：渲染标签栏 UI 并处理标签交互。观察 TopicManager 状态变化并自动重新渲染。

## 开发指南

### 构建命令

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 生产构建
npm run build

# 监听变化并构建
npm run watch
```

### 测试

本项目使用带有原生 JavaScript 的自定义测试工具：

```bash
# 运行 Node.js 测试
node tests/topic-matching.node.test.js

# 在浏览器中打开测试（直接在浏览器中）
open tests/topic-matching.test.html
```

### 重要说明

- 构建输出到 `dist/` 目录
- 构建后通过 `chrome://extensions/` 加载扩展
- MQTT 客户端清理至关重要——使用 `stopMqttClient()` 防止内存泄漏
- 底部输入区域使用 `Ctrl+Enter` 发送消息

## 贡献指南

我们欢迎各种形式的贡献！这是一个无框架依赖的原生 JavaScript 项目。

### 代码风格

- **原生 JavaScript**：无框架——使用直接 DOM 操作的纯 JavaScript
- **现代 ES2022+**：使用 Chrome 扩展支持的现代 JavaScript 特性
- **CSS**：样式在 `src/styles.css` 中定义，使用 CSS 自定义属性进行主题化
- **格式化**：与现有代码库保持一致的缩进（JS/HTML 使用 2 个空格）

### 提交信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>
```

**类型**：`feat`、`fix`、`chore`、`docs`、`refactor`、`test`、`perf`

**示例**：
```
feat(mqtt): 添加对保留消息的支持
fix: 处理网络变化时的重连
chore: 更新 Vite 到 v5.2
docs: 向 README 添加故障排除部分
```

### Pull Request 流程

1. Fork 并创建一个描述性分支（如 `feat/add-mqtt-v5`）
2. 测试您的更改并根据需要添加新测试
3. 使用 `npm run build` 验证生产构建
4. 包含清晰的更改描述
5. 在 PR 描述中引用相关问题

## 许可证

```
MIT License

Copyright (c) 2025 WebSocket/MQTT Chrome Extension Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 致谢

本项目使用以下开源工具和库构建：

- **[mqtt](https://github.com/mqttjs/MQTT.js)** – MQTT over WebSocket 客户端库
- **[Vite](https://vitejs.dev/)** – 快速构建工具和开发服务器
- **[Font Awesome](https://fontawesome.com/)** – 图标集
- **[Inter](https://rsms.me/inter/)** – 主要 UI 字体
- **[JetBrains Mono](https://www.jetbrains.com/lp/mono/)** – 等宽字体

特别感谢 Chrome 扩展社区和 MQTT.js 维护者提供的优秀文档和工具。
