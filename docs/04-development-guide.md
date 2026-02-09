# 开发与构建指南

## 环境要求

- **Node.js**: v16+ (推荐 v18 或 v20)
- **npm**: v8+ 或 yarn/pnpm
- **Chrome**: v114+ (支持 Side Panel API)

## 项目初始化

### 1. 安装依赖

```bash
cd /mnt/d/googleExtension/websocketExtension
npm install
```

### 2. 项目结构

```
websocketExtension/
├── src/                    # 源代码目录
│   ├── sidepanel.html      # 主页面
│   ├── sidepanel.js        # 应用逻辑
│   └── styles.css          # 样式表
├── public/                 # 静态资源
│   ├── manifest.json       # Chrome 扩展清单
│   └── icons/              # 图标文件
├── docs/                   # 项目文档
│   ├── 01-overview.md      # 项目概述
│   ├── 02-architecture.md  # 架构设计
│   ├── 03-ui-components.md # UI 组件
│   ├── 04-development-guide.md # 开发指南
│   ├── 05-multiple-topics-plan.md # 多主题实施计划
│   └── accessibility-specs.md # 无障碍规范
├── tests/                  # 测试文件 ⭐ 新增
│   ├── topic-matching-tests.html # 主题匹配单元测试
│   ├── performance-utils.js       # 性能测试工具
│   ├── performance-tests.html      # 性能测试界面
│   └── keyboard-shortcuts.js       # 键盘快捷键参考
├── dist/                   # 构建输出（自动生成）
├── node_modules/           # 依赖包
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── postcss.config.js       # PostCSS 配置
└── .gitignore              # Git 忽略规则
```

## 开发工作流

### 启动开发服务器

```bash
npm run dev
```

开发服务器启动后：
- 监听文件变化自动热重载
- 输出到内存（不生成 dist/ 目录）
- 访问地址: `http://localhost:5173/sidepanel.html`

### 生产构建

```bash
npm run build
```

构建完成后：
- 生成 `dist/` 目录
- 代码压缩和优化
- 文件名带 hash 值（用于缓存控制）

### 监听模式

```bash
npm run watch
```

持续监听文件变化并自动构建到 `dist/` 目录。

## 在 Chrome 中加载扩展

### 方法一：加载未打包的扩展

1. 运行 `npm run build` 或 `npm run watch`
2. 打开 Chrome 浏览器
3. 访问 `chrome://extensions/`
4. 启用右上角的「开发者模式」
5. 点击「加载已解压的扩展程序」
6. 选择项目的 `dist/` 目录

### 方法二：开发时实时预览

1. 运行 `npm run dev`
2. 在 Chrome 中加载 `dist/` 目录
3. 修改源代码后，Vite 会自动热重载
4. 点击扩展图标刷新 Side Panel

## 多主题功能开发指南 ⭐ 新增

### 数据结构

#### TopicSession 类

每个主题订阅由一个 `TopicSession` 对象管理：

```javascript
class TopicSession {
  constructor(config) {
    this.id = config.id || this.generateId();
    this.topic = config.topic || '';
    this.displayName = config.displayName || config.topic || '';
    this.qos = config.qos || 0;
    this.color = config.color || this.assignColor();
    this.logs = [];              // 该主题的日志
    this.isSubscribed = false;
    this.isPaused = false;
    this.maxLogs = config.maxLogs || 1000;
    this.autoScroll = config.autoScroll !== undefined ? config.autoScroll : true;
    this.jsonFormat = config.jsonFormat !== undefined ? config.jsonFormat : true;
    this.filter = config.filter || '';
    this.unreadCount = 0;
    this.totalReceived = 0;
  }
}
```

#### 全局状态

```javascript
// 多主题状态
const topicSessions = new Map();  // TopicSession 对象集合
let activeTopicId = null;         // 当前活动主题 ID
let topicOrder = [];               // 标签页顺序
```

#### 存储键

```javascript
const storageKeys = {
  // 原有键
  url: 'ws:url',
  idleSeconds: 'ws:idleSeconds',
  history: 'ws:history',
  historySize: 'ws:historySize',
  theme: 'ws:theme',
  connConfig: 'ws:connConfig',

  // 多主题键 ⭐ 新增
  topicConfigs: 'ws:topicConfigs',      // 主题配置数组
  activeTopicId: 'ws:activeTopicId',    // 当前活动主题 ID
  topicOrder: 'ws:topicOrder',          // 标签页顺序
  globalTopicSettings: 'ws:globalTopicSettings'
};
```

### 主题匹配算法

```javascript
function matchTopic(subscriptionPattern, messageTopic) {
  // 精确匹配
  if (subscriptionPattern === messageTopic) return true;

  // 全匹配
  if (subscriptionPattern === '#') return true;

  const subParts = subscriptionPattern.split('/');
  const msgParts = messageTopic.split('/');

  // 多级通配符 # (需要至少一级)
  if (subParts[subParts.length - 1] === '#') {
    if (msgParts.length <= subParts.length - 1) return false;
    for (let i = 0; i < subParts.length - 1; i++) {
      if (subParts[i] !== '+' && subParts[i] !== msgParts[i]) {
        return false;
      }
    }
    return true;
  }

  // 单级通配符 + 和精确匹配
  if (subParts.length !== msgParts.length) return false;
  for (let i = 0; i < subParts.length; i++) {
    if (subParts[i] !== '+' && subParts[i] !== msgParts[i]) {
      return false;
    }
  }
  return true;
}
```

### 消息路由

```javascript
function routeMessageToSessions(topic, payload) {
  const message = payload.toString();

  for (const [sessionId, session] of topicSessions) {
    if (session.isPaused) continue;

    if (matchTopic(session.topic, topic)) {
      session.addLog('rx', message, topic);

      // 非活动会话增加未读计数
      if (sessionId !== activeTopicId) {
        session.unreadCount++;
      }
    }
  }

  renderLogs();
  renderTabs();
}
```

### 键盘快捷键实现 ⭐ 新增

```javascript
document.addEventListener('keydown', (e) => {
  // 忽略输入框中的按键（特定快捷键除外）
  const tagName = e.target.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

  // Ctrl+Tab: 下一个标签
  if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    nextTab();
  }

  // Ctrl+Shift+Tab: 上一个标签
  if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
    e.preventDefault();
    previousTab();
  }

  // 跳过输入框内的其他快捷键
  if (isInput) return;

  // Ctrl+1-9: 切换到指定标签
  if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    switchToTab(parseInt(e.key));
  }

  // Ctrl+W: 关闭当前标签
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    closeCurrentTab();
  }

  // Ctrl+T: 添加新主题
  if (e.ctrlKey && e.key === 't') {
    e.preventDefault();
    showAddTopicDialog();
  }

  // Ctrl+,: 打开主题管理
  if (e.ctrlKey && e.key === ',') {
    e.preventDefault();
    openTopicManager();
  }
});
```

### 无障碍开发 ⭐ 新增

#### ARIA 属性

```html
<!-- Tab Bar -->
<nav role="tablist" aria-label="主题标签页">
  <div role="tab" aria-selected="true" aria-controls="logContainer">
    主题名称
  </div>
</nav>

<!-- Log Area -->
<main role="tabpanel" aria-live="polite" aria-atomic="false">
  <!-- 日志内容 -->
</main>

<!-- Session Toolbar -->
<div role="toolbar" aria-label="会话工具栏">
  <!-- 工具按钮 -->
</div>

<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <h3 id="modalTitle">标题</h3>
  <!-- 内容 -->
</div>
```

#### 焦点管理

```javascript
// 标签激活后移动焦点
function switchTopicSession(sessionId) {
  activeTopicId = sessionId;
  renderLogs();

  // 移动焦点到日志区域
  dom.logContainer.focus();
}
```

## Vite 配置详解

### vite.config.js

```javascript
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  root: 'src',              // 源代码目录
  base: './',               // 相对路径（扩展需要）
  publicDir: '../public',   // 静态资源目录
  build: {
    outDir: '../dist',      // 输出目录
    emptyOutDir: true,      // 构建前清空输出目录
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel.html')
      }
    }
  },
  plugins: [
    nodePolyfills({
      // MQTT.js 需要的 Node.js polyfills
      include: ['stream', 'buffer', 'process', 'util', 'events']
    })
  ]
});
```

### 关键配置说明

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `root` | `'src'` | 源代码所在目录 |
| `base` | `'./'` | 使用相对路径（扩展环境要求） |
| `publicDir` | `'../public'` | 静态资源（manifest.json, icons） |
| `outDir` | `'../dist'` | 构建输出到项目根目录的 dist/ |
| `emptyOutDir` | `true` | 每次构建清空输出目录 |

## 依赖说明

### 生产依赖

```json
{
  "@fortawesome/fontawesome-free": "^6.5.1",
  "mqtt": "^5.3.6"
}
```

- **@fortawesome/fontawesome-free**: Font Awesome 图标库
- **mqtt**: MQTT.js 库，用于 MQTT-over-WebSocket 连接

### 开发依赖

```json
{
  "vite": "^5.2.0",
  "vite-plugin-node-polyfills": "^0.24.0",
  "vite-plugin-static-copy": "^1.0.5",
  "tailwindcss": "^3.4.11",
  "autoprefixer": "^10.4.19",
  "postcss": "^8.4.38"
}
```

| 依赖 | 用途 |
|------|------|
| `vite` | 构建工具和开发服务器 |
| `vite-plugin-node-polyfills` | Node.js polyfills（MQTT 需要） |
| `vite-plugin-static-copy` | 复制静态文件到输出目录 |
| `tailwindcss` | CSS 工具类（已配置但项目使用自定义 CSS） |
| `autoprefixer` | CSS 自动添加浏览器前缀 |
| `postcss` | CSS 后处理器 |

## Chrome Extension 配置

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "WebSocket Side Panel Devtool",
  "version": "1.0.0",
  "description": "WebSocket 调试工具，基于 Side Panel，支持多主题标签页",
  "permissions": ["storage", "sidePanel"],
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_title": "Open WebSocket Panel",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

### 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 保存用户配置、历史记录、主题配置 |
| `sidePanel` | 启用侧边栏面板功能 |

## 测试 ⭐ 新增

### 运行单元测试

```bash
# 在浏览器中打开测试文件
file://path/to/tests/topic-matching-tests.html
```

### 运行性能测试

```bash
# 在浏览器中打开性能测试
file://path/to/tests/performance-tests.html
```

## 调试技巧

### 1. 查看 Side Panel 日志

1. 打开 Side Panel
2. 在 Side Panel 内右键点击
3. 选择「检查」
4. 在 DevTools 中查看 Console 和 Network

### 2. 调试多主题状态

```javascript
// 在 Console 中查看多主题状态
console.log('Topic Sessions:', topicSessions);
console.log('Active Topic:', activeTopicId);
console.log('Topic Order:', topicOrder);

// 查看特定会话
const session = topicSessions.get(activeTopicId);
console.log('Current Session:', session);
console.log('Session Logs:', session.logs);
```

### 3. 查看 Storage 数据

1. 在 Side Panel 的 DevTools 中
2. 切换到 Application 标签
3. 左侧 Storage → Local Storage → chrome-extension://...

### 4. 测试主题匹配

```javascript
// 测试通配符匹配
console.log(matchTopic('home/#', 'home/temp'));        // true
console.log(matchTopic('home/#', 'home'));              // false
console.log(matchTopic('home/+/temp', 'home/a/temp'));  // true
```

## 常见问题

### Q: MQTT 连接失败

**可能原因**:
1. 服务器不支持 WebSocket 协议
2. 端口或路径配置错误
3. CORS 限制
4. 认证信息错误

**解决方案**:
- 检查 `buildUrlFromConfig()` 生成的 URL
- 确认服务器使用 `ws://` 或 `wss://` 协议
- 验证用户名和密码

### Q: 构建后扩展无法加载

**检查清单**:
1. `dist/` 目录是否存在
2. `dist/manifest.json` 是否正确
3. 图标文件是否已复制到 `dist/icons/`

### Q: 热重载不工作

**解决方案**:
1. 确保运行的是 `npm run dev` 而非 `npm run build`
2. 刷新 Side Panel（Ctrl+R）
3. 检查 Vite 控制台是否有错误

### Q: MQTT 内存泄漏

**症状**: 长时间使用后浏览器变慢

**原因**: MQTT.js 内部定时器未清理

**解决方案**: 使用 `stopMqttClient()` 完整清理客户端

### Q: 多主题消息不显示 ⭐ 新增

**可能原因**:
1. 主题未正确订阅
2. 消息未匹配到任何会话
3. 会话被暂停

**调试方法**:
```javascript
// 检查订阅状态
console.log('Subscribed topics:', Array.from(topicSessions.values()).map(s => ({
  topic: s.topic,
  subscribed: s.isSubscribed,
  paused: s.isPaused
})));

// 检查消息匹配
topicSessions.forEach((session, id) => {
  console.log(`Session ${id}:`, matchTopic(session.topic, 'actual/topic'));
});
```

## 发布到 Chrome Web Store

### 1. 准备发布包

```bash
npm run build
cd dist
zip -r ../websocket-extension.zip .
```

### 2. 打包内容

- `dist/` 目录的所有文件
- 不包含 `node_modules/` 或源代码

### 3. 上传到 Chrome Web Store

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 创建新扩展或更新现有扩展
3. 上传 zip 文件
4. 填写商店信息（名称、描述、截图等）
5. 提交审核

## 开发建议

### 代码组织

- 将大函数拆分为小函数
- 使用常量定义魔法值
- 保持 DOM 操作集中化
- 使用类封装相关功能（如 `TopicSession`）

### 性能优化 ⭐ 更新

- 避免频繁的 DOM 操作
- 使用 DocumentFragment 批量插入
- 限制每个会话的日志数组大小（默认 1000 条）
- 只渲染活动会话的日志
- 使用 `requestAnimationFrame` 节流高频更新

### 安全考虑

- 验证用户输入的 URL
- 避免在日志中暴露敏感信息
- 使用 Content Security Policy（如有需要）

## 新功能开发指南 ⭐ 新增

### 添加新的主题配置

1. 在 `TopicSession` 构造函数添加新属性
2. 更新 `toConfig()` 方法
3. 在主题配置面板添加 UI 控件
4. 更新存储和加载逻辑

### 添加新的键盘快捷键

1. 在 `initEvents()` 的键盘事件监听器中添加新的 `if` 分支
2. 创建对应的处理函数
3. 更新文档（04-development-guide.md 和 accessibility-specs.md）

### 添加新的面板

1. 在 `sidepanel.html` 添加面板 HTML 结构
2. 在 `styles.css` 添加面板样式
3. 在 `sidepanel.js` 添加打开/关闭逻辑
4. 添加 ARIA 属性确保可访问性

## 资源链接

- [Chrome Extension Manifest V3 文档](https://developer.chrome.com/docs/extensions/mv3/)
- [Vite 文档](https://vitejs.dev/)
- [MQTT.js 文档](https://github.com/mqttjs/MQTT.js)
- [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [ARIA 最佳实践](https://www.w3.org/WAI/ARIA/apg/)
