# UI/UX 组件分析

## 设计理念

项目采用 **Glassmorphism（毛玻璃）** 设计风格，结合现代简约美学，创造出具有层次感、通透感的用户界面。

- **视觉语言**: 半透明背景 + 模糊效果 + 细腻边框
- **配色方案**: 蓝色系主色调 + 状态颜色（绿/黄/红）+ 主题颜色系统
- **字体选择**: Inter (UI 文本) + JetBrains Mono (代码/数据)
- **图标系统**: Font Awesome 6.5.1

## CSS 主题系统

### CSS 变量架构

主题通过 **CSS 自定义属性** 实现，定义在 `:root` 中，暗色主题通过 `[data-theme="dark"]` 选择器覆盖。

```css
:root {
  /* 基础颜色 - Light Theme */
  --bg-app: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --accent-primary: #3b82f6;
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(255, 255, 255, 0.5);
}

[data-theme="dark"] {
  --bg-app: #020617;
  --text-primary: #f1f5f9;
  --glass-bg: rgba(15, 23, 42, 0.7);
  --glass-border: rgba(51, 65, 85, 0.5);
}
```

### 主题颜色系统 ⭐ 新增

```javascript
const topicColors = [
  { name: 'blue', value: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { name: 'green', value: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { name: 'orange', value: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { name: 'purple', value: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { name: 'pink', value: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { name: 'cyan', value: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
  { name: 'red', value: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { name: 'yellow', value: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' }
];
```

### 状态颜色

```css
--status-connected: #10b981;    /* 绿色 */
--status-connecting: #f59e0b;   /* 橙色 */
--status-disconnected: #ef4444; /* 红色 */
```

## 组件层次结构

```
.app-container
 ├── .bg-gradient-1 (背景装饰)
 ├── .bg-gradient-2 (背景装饰)
 ├── .header (顶部工具栏)
 │    ├── .header-main
 │    └── .header-toolbar
 ├── .tab-bar (标签页导航) ⭐ 新增
 │    ├── .tab-list
 │    └── .tab-actions
 ├── .session-toolbar (会话工具栏) ⭐ 新增
 ├── .topic-panel (主题管理面板) ⭐ 新增
 ├── .topic-manager-panel (主题管理器) ⭐ 新增
 ├── .topic-config-panel (主题配置) ⭐ 新增
 ├── .add-topic-modal (添加主题对话框) ⭐ 新增
 ├── .settings-panel (设置抽屉)
 ├── .logs-area (日志区域)
 └── .footer (底部输入区)
      ├── .history-chips
      └── .input-area
```

## 核心组件详解

### 1. 标签页导航 (`.tab-bar`) ⭐ 新增

```html
<nav id="tabBar" class="tab-bar blur-glass" role="tablist" aria-label="主题标签页">
  <div class="tab-list" id="tabList">
    <div class="tab active" role="tab" aria-selected="true">
      <div class="tab-content">
        <span class="tab-label">home/temp</span>
        <div class="tab-meta">
          <span class="tab-status subscribed"></span>
        </div>
      </div>
      <button class="tab-close" aria-label="关闭 home/temp"></button>
    </div>
  </div>
  <div class="tab-actions">
    <button class="btn btn-icon btn-sm" aria-label="添加新主题">
      <i class="fa-solid fa-plus"></i>
    </button>
  </div>
</nav>
```

**样式特点**:
- 使用 Flexbox 布局
- 活动标签高亮显示
- 悬停显示关闭按钮
- 未读消息徽章
- 订阅状态指示灯

### 2. 会话工具栏 (`.session-toolbar`) ⭐ 新增

```html
<div id="sessionToolbar" class="session-toolbar blur-glass" role="toolbar">
  <div class="session-actions">
    <button id="sessionClearBtn" aria-label="清空日志">
      <i class="fa-solid fa-trash-can"></i>
    </button>
    <button id="sessionExportBtn" aria-label="导出日志">
      <i class="fa-solid fa-download"></i>
    </button>
    <button id="sessionPauseBtn" aria-label="暂停接收">
      <i class="fa-solid fa-pause"></i>
    </button>
    <div class="filter-group">
      <input type="text" placeholder="过滤消息...">
    </div>
  </div>
  <span class="session-stats">12 条消息</span>
</div>
```

**功能按钮**:
- 清空日志: 清除当前会话所有消息
- 导出日志: 下载 JSON 格式的日志文件
- 暂停/恢复: 暂停消息接收（保持订阅）
- 过滤: 正则表达式过滤消息

### 3. 主题管理面板 (`.topic-manager-panel`) ⭐ 新增

```html
<aside id="topicManagerPanel" class="topic-manager-panel blur-glass" role="dialog" aria-modal="true">
  <div class="panel-header">
    <h3>主题管理</h3>
    <button class="btn-close" aria-label="关闭"></button>
  </div>
  <div class="panel-content">
    <div class="topic-list-container">
      <!-- 主题列表项 -->
    </div>
    <button class="btn btn-full btn-secondary">
      <i class="fa-solid fa-plus"></i> 添加主题
    </button>
  </div>
</aside>
```

**功能**:
- 显示所有已订阅主题
- 编辑/删除主题
- 快速添加常用主题

### 4. 添加主题对话框 (`.modal-overlay`) ⭐ 新增

```html
<div id="addTopicModal" class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h3>添加主题</h3>
      <button class="btn-close"></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>主题名称</label>
        <input type="text" placeholder="home/sensors/#">
      </div>
      <div class="form-group">
        <label>显示名称（可选）</label>
        <input type="text" placeholder="所有传感器">
      </div>
      <div class="form-group">
        <span>QoS 等级</span>
        <div class="qos-options">
          <label><input type="radio" name="qos" value="0"> 0 - 最多一次</label>
          <label><input type="radio" name="qos" value="1"> 1 - 至少一次</label>
          <label><input type="radio" name="qos" value="2"> 2 - 恰好一次</label>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn">取消</button>
      <button class="btn btn-primary">添加</button>
    </div>
  </div>
</div>
```

### 5. 毛玻璃容器 (`.blur-glass`)

```css
.blur-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
}
```

**应用位置**: Header, Footer, Tab Bar, Session Toolbar, 各面板

### 6. 状态指示器 (`.status-indicator`)

```css
.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--status-disconnected);
  box-shadow: 0 0 0 2px var(--glass-border);
  transition: background-color 0.3s, box-shadow 0.3s;
}
```

**标签页状态指示器** ⭐ 新增:
```css
.tab-status.subscribed {
  background-color: var(--status-connected);
  box-shadow: 0 0 4px var(--status-connected);
}

.tab-status.paused {
  background-color: var(--status-connecting);
}

.tab-status.unsubscribed {
  background-color: var(--status-disconnected);
}
```

### 7. 输入框组件 (`.input-group`)

```css
input[type="text"], input[type="number"], select, textarea {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 0.75rem;
  padding: 0.6rem 1rem;
  color: var(--text-primary);
  transition: all 0.2s;
}

input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
```

### 8. 按钮系统

#### 主按钮 (`.btn-primary`)
```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--accent-text);
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

#### 图标按钮 (`.btn-icon`)
```css
.btn-icon {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-secondary);
}
```

### 9. 日志气泡 (`.log-bubble`)

```css
.log-bubble {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
```

**三种样式**:

| 类型 | 对齐 | 背景色 | 文本色 | 特征 |
|------|------|--------|--------|------|
| `rx` | 左对齐 | 绿色半透明 | 深绿 | 左下角直角 |
| `tx` | 右对齐 | 蓝色半透明 | 深蓝 | 右下角直角 |
| `sys` | 居中 | 灰色背景 | 灰色 | 圆角胶囊状 |

### 10. 未读消息徽章 (`.tab-badge`) ⭐ 新增

```css
.tab-badge {
  background: var(--accent-primary);
  color: white;
  font-size: 0.65rem;
  padding: 0.1rem 0.35rem;
  border-radius: 0.75rem;
  min-width: 18px;
  text-align: center;
}
```

### 11. 对话框动画 (`.modal-overlay`) ⭐ 新增

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 1000;
}

.modal-overlay.show {
  opacity: 1;
  pointer-events: auto;
}

.modal {
  background: var(--bg-app);
  border-radius: 1rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  transform: scale(0.95);
  transition: transform 0.2s;
}

.modal-overlay.show .modal {
  transform: scale(1);
}
```

## 动画效果

### 淡入动画 (`.slideIn`)
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.log-row {
  animation: slideIn 0.2s cubic-bezier(0.2, 0, 0.2, 1);
}
```

### 脉冲动画 (`.pulse`)
```css
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
```

## 键盘导航 ⭐ 新增

### 标签页键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `ArrowLeft` / `ArrowRight` | 焦点移动到上一个/下一个标签 |
| `Home` / `End` | 焦点移动到第一个/最后一个标签 |
| `Enter` / `Space` | 激活焦点所在的标签 |
| `Delete` / `Backspace` | 关闭焦点所在的标签 |
| `Ctrl+Tab` | 切换到下一个标签 |
| `Ctrl+Shift+Tab` | 切换到上一个标签 |
| `Ctrl+1-9` | 切换到指定编号的标签 |
| `Ctrl+W` | 关闭当前标签 |

### 焦点管理

```javascript
// 焦点切换到标签时
tab.addEventListener('focus', () => {
  // 更新焦点样式
});

// 标签激活后
function switchTopicSession(sessionId) {
  activeTopicId = sessionId;
  // 将焦点移到日志区域
  dom.logContainer.focus();
}
```

## 无障碍访问 ⭐ 新增

### ARIA 属性

| 元素 | 角色 | 关键属性 |
|------|------|----------|
| `.tab-bar` | `tablist` | `aria-label` |
| `.tab` | `tab` | `aria-selected`, `aria-controls`, `tabindex` |
| `.log-container` | `tabpanel` | `aria-live`, `aria-atomic` |
| `.session-toolbar` | `toolbar` | `aria-label` |
| `.topic-manager-panel` | `dialog` | `aria-modal`, `aria-labelledby` |

### 屏幕阅读器支持

```javascript
// 显示 Toast 消息
function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  container.appendChild(toast);
}
```

## 响应式设计

```css
@media (max-width: 450px) {
  .settings-panel, .topic-manager-panel, .topic-config-panel {
    right: -100%;
    width: 100%;
  }

  .tab-bar {
    flex-direction: column;
  }
}
```

## 设计总结

| 方面 | 实现方式 |
|------|----------|
| **主题切换** | CSS 变量 + data 属性 |
| **毛玻璃效果** | backdrop-filter: blur(12px) |
| **状态反馈** | 颜色编码 + 动画 |
| **多主题支持** | 主题颜色系统 + 标签页导航 |
| **键盘导航** | 全键盘访问 + 快捷键 |
| **响应式** | Flexbox + Grid + Media Queries |
| **无障碍** | ARIA 属性 + 语义化 HTML |
| **性能** | CSS transform 过渡 + 硬件加速 |
