# 代码架构与设计模式

## 架构概览

项目采用**原生 JavaScript + Chrome Extension API** 的架构模式，没有使用任何前端框架。整个应用封装在单个 HTML 页面中，通过模块化组织代码。

```
┌─────────────────────────────────────────────────────┐
│                   用户界面层                         │
│  (sidepanel.html + styles.css)                      │
│  • Tab Bar (标签页导航)                             │
│  • Session Toolbar (会话工具栏)                     │
│  • Topic Panels (主题管理面板)                      │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                   应用逻辑层                         │
│  (sidepanel.js)                                     │
│  ┌──────────┬──────────┬──────────┬──────────────┐ │
│  │ 状态管理 │ 连接管理 │ 消息处理 │ UI 渲染      │ │
│  └──────────┴──────────┴──────────┴──────────────┘ │
│  ┌──────────┬──────────┬──────────┬──────────────┐ │
│  │TopicMgr  │Router    │TabRendr  │Keyboard      │ │
│  └──────────┴──────────┴──────────┴──────────────┘ │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                   数据持久化层                       │
│  (chrome.storage.local)                             │
│  • topicConfigs                                     │
│  • activeTopicId                                    │
│  • topicOrder                                       │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                   网络通信层                         │
│  (WebSocket API / MQTT.js)                          │
└─────────────────────────────────────────────────────┘
```

## 核心模块分析

### 1. 状态管理 (State Management)

应用使用**全局变量**和 **Map 数据结构**管理状态。

```javascript
// 连接相关
let ws = null;              // WebSocket 实例
let mqttClient = null;      // MQTT 客户端实例
let mode = 'mqtt';          // 当前模式: 'ws' | 'mqtt'
let status = Status.Disconnected;  // 连接状态

// 多主题状态 ⭐ 新增
const topicSessions = new Map();  // TopicSession 对象集合
let activeTopicId = null;         // 当前活动主题 ID
let topicOrder = [];               // 标签页顺序

// UI 状态
let logs = [];              // 日志数组 (已废弃，使用 TopicSession.logs)
let scrollLocked = false;   // 滚动锁定状态
let theme = 'light';        // 当前主题

// 配置状态
let history = [];           // 消息历史
let historySize = 5;        // 历史记录最大数量
let idleSeconds = 0;        // 空闲超时秒数
```

**状态枚举：**
```javascript
const Status = {
  Connecting: 'connecting',
  Connected: 'connected',
  Disconnected: 'disconnected'
};
```

### 2. TopicSession 类 ⭐ 新增

每个主题订阅都有一个独立的 `TopicSession` 对象：

```javascript
class TopicSession {
  constructor(config) {
    this.id = config.id || this.generateId();
    this.topic = config.topic || '';
    this.displayName = config.displayName || config.topic || '';
    this.qos = config.qos || 0;
    this.color = config.color || this.assignColor();
    this.logs = [];                    // 该主题的日志数组
    this.isSubscribed = false;
    this.isPaused = false;
    this.isMuted = false;
    this.maxLogs = config.maxLogs || 1000;
    this.autoScroll = config.autoScroll !== undefined ? config.autoScroll : true;
    this.jsonFormat = config.jsonFormat !== undefined ? config.jsonFormat : true;
    this.filter = config.filter || '';
    this.unreadCount = 0;
    this.totalReceived = 0;
  }

  addLog(kind, message, topic = null) {
    // 添加日志并自动限制大小
  }

  clearLogs() {
    // 清空日志
  }

  getFilteredLogs() {
    // 返回过滤后的日志
  }
}
```

### 3. 主题匹配算法 ⭐ 新增

MQTT 通配符匹配实现：

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

### 4. 消息路由系统 ⭐ 新增

```javascript
function routeMessageToSessions(topic, payload) {
  const message = payload.toString();

  // 遍历所有主题会话，匹配并分发消息
  for (const [sessionId, session] of topicSessions) {
    if (session.isPaused) continue;

    if (matchTopic(session.topic, topic)) {
      session.addLog('rx', message, topic);

      // 如果不是活动会话，增加未读计数
      if (sessionId !== activeTopicId) {
        session.unreadCount++;
      }
    }
  }

  // 更新 UI
  renderLogs();
  renderTabs();
}
```

### 5. DOM 引用管理

使用**集中式 DOM 缓存**模式：

```javascript
// 主界面 DOM
const dom = {
  urlInput: document.getElementById('urlInput'),
  connectBtn: document.getElementById('connectBtn'),
  logContainer: document.getElementById('logContainer'),
  tabBar: document.getElementById('tabBar'),
  tabList: document.getElementById('tabList'),
  addTopicBtn: document.getElementById('addTopicBtn'),
  // ...
};

// 配置面板 DOM
const cfgDom = {
  panel: document.getElementById('settingsPanel'),
  mode: document.getElementById('cfgMode'),
  host: document.getElementById('cfgHost'),
  // ...
};
```

### 6. 存储管理 (Storage)

**新增存储键：**

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

### 7. 标签页渲染 ⭐ 新增

```javascript
const renderTabs = () => {
  if (!dom.tabList) return;
  dom.tabList.innerHTML = '';

  topicOrder.forEach((sessionId, index) => {
    const session = topicSessions.get(sessionId);
    if (!session) return;

    const tab = document.createElement('div');
    tab.className = `tab ${sessionId === activeTopicId ? 'active' : ''}`;

    // ARIA 属性
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', sessionId === activeTopicId ? 'true' : 'false');
    tab.setAttribute('aria-controls', 'logContainer');
    tab.setAttribute('tabindex', sessionId === activeTopicId ? '0' : '-1');

    // 标签内容（名称、状态、未读计数）
    // ...

    // 点击切换
    tab.addEventListener('click', () => switchTopicSession(sessionId));

    // 键盘导航（方向键、Home/End、Delete）
    tab.addEventListener('keydown', handleTabKeydown);

    dom.tabList.appendChild(tab);
  });
};
```

### 8. 会话切换 ⭐ 新增

```javascript
function switchTopicSession(sessionId) {
  const session = topicSessions.get(sessionId);
  if (!session) return;

  activeTopicId = sessionId;

  // 清除未读计数
  session.unreadCount = 0;

  // 更新 UI
  renderLogs();
  renderTabs();
  updateSessionToolbar();

  // 保存状态
  saveTopicConfigs();
}

function getActiveSession() {
  return activeTopicId ? topicSessions.get(activeTopicId) : null;
}
```

### 9. 键盘快捷键 ⭐ 新增

```javascript
document.addEventListener('keydown', (e) => {
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

### 10. 会话工具栏 ⭐ 新增

每个会话都有独立的工具栏功能：

```javascript
// 清空当前会话日志
const clearSessionLogs = () => {
  const session = getActiveSession();
  if (session) {
    session.clearLogs();
    renderLogs();
    renderTabs();
  }
};

// 导出当前会话日志
const exportSessionLogs = () => {
  const session = getActiveSession();
  if (!session) return;

  const data = JSON.stringify({
    topic: session.topic,
    displayName: session.displayName,
    exportedAt: new Date().toISOString(),
    messages: session.getFilteredLogs()
  }, null, 2);

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.displayName || session.topic}_logs_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 暂停/恢复消息接收
const toggleSessionPause = () => {
  const session = getActiveSession();
  if (session) {
    session.isPaused = !session.isPaused;
    updateSessionToolbar();
    renderTabs();
  }
};

// 应用消息过滤
const applySessionFilter = (filterText) => {
  const session = getActiveSession();
  if (session) {
    session.filter = filterText;
    renderLogs();
  }
};
```

## 设计模式总结

| 模式 | 应用 | 位置 |
|------|------|------|
| **单例模式** | 全局状态管理 | `ws`, `mqttClient`, `status` |
| **缓存模式** | DOM 引用缓存 | `dom`, `cfgDom` |
| **观察者模式** | 事件监听 | `initEvents()` |
| **策略模式** | 双协议支持 | `mode` 判断 |
| **工厂模式** | 日志条目创建 | `pushLog()` |
| **持久化模式** | 状态保存 | `persistState()` |
| **会话模式** | 多主题管理 | `TopicSession` 类 ⭐ |
| **路由模式** | 消息分发 | `routeMessageToSessions()` ⭐ |
| **命令模式** | 键盘快捷键 | 键盘事件处理 ⭐ |

## 模块依赖关系

```
┌─────────────────────────────────────────────────────┐
│                   TopicSession                      │
│  (会话数据模型)                                      │
└─────────────────────────────────────────────────────┘
         ↑                    ↓                    ↑
         │                    │                    │
┌────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ TopicManager   │   │ TopicRouter     │   │ TabRenderer     │
│ (创建/删除会话) │   │ (消息分发)      │   │ (标签页渲染)    │
└────────────────┘   └─────────────────┘   └─────────────────┘
         ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────┐
│                   MQTT Client                       │
│              (订阅/发布消息)                         │
└─────────────────────────────────────────────────────┘
```

## 性能优化

### 1. 日志大小限制

每个会话自动限制日志数量，防止内存溢出：

```javascript
addLog(kind, message, topic = null) {
  this.logs.push(entry);
  this.totalReceived++;

  // 自动修剪
  if (this.logs.length > this.maxLogs) {
    this.logs = this.logs.slice(-this.maxLogs);
  }
}
```

### 2. DocumentFragment 批量渲染

使用 `DocumentFragment` 减少 DOM 重排：

```javascript
const renderLogs = () => {
  dom.logContainer.innerHTML = '';
  const frag = document.createDocumentFragment();

  session.getFilteredLogs().forEach((log) => {
    const row = createLogRow(log);
    frag.appendChild(row);
  });

  dom.logContainer.appendChild(frag);
};
```

### 3. 条件渲染

只渲染活动会话的日志：

```javascript
const renderLogs = () => {
  const session = getActiveSession();
  if (!session) return;

  // 只渲染当前会话
  session.getFilteredLogs().forEach(/* ... */);
};
```

## 扩展性考虑

### 添加新协议
1. 在 `mode` 枚举添加新值
2. 创建 `connectXxx()` 函数
3. 在 `connect()` 中添加分支
4. 实现虚拟主题支持（WebSocket 模式）

### 添加新日志类型
1. 在 `TopicSession.addLog()` 的 `kind` 参数添加新类型
2. 在 `styles.css` 添加对应样式

### 添加新会话配置
1. 在 `TopicSession` 构造函数添加新属性
2. 更新 `toConfig()` 方法
3. 在主题配置面板添加 UI 控件
