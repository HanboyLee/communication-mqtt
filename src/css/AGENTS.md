# src/css/ — Agent 说明

本目录是扩展 UI 样式的 **唯一归属地**。新增或修改样式请写在这里，不要再使用或恢复 `src/styles.css` 根路径单文件。

## 当前文件

| 文件 | 职责 |
|------|------|
| `styles.css` | 主样式表：布局、组件、日志气泡、状态指示、设置分区、Popup shell 适配等 |

入口引用：

- `src/sidepanel.js`：`import './css/styles.css'`
- `src/sidepanel.html` / 生成的 `src/popup.html`：`href="css/styles.css"`（相对 `src/` 的 HTML 入口）

## 主题变量

- 默认亮色主题变量定义在 `:root`（如 `--bg-app`、`--text-primary`、`--accent-primary`、日志/状态色等）。
- 暗色主题通过 `[data-theme="dark"]` 覆盖同名 CSS 变量。
- 运行时主题由 HTML 上的 `data-theme` 控制；改颜色优先改变量，避免散落硬编码色值。

## UI Shell（`data-shell`）

| 选择器 | 约定 |
|--------|------|
| `html[data-shell="sidepanel"]` | 默认侧边栏；全高 `100vh`，主滚动在 `.logs-area` |
| `html[data-shell="popup"]` | 工具栏弹窗：min **360×480**；`.app-container` 无 max-width；**主滚动仍在 `.logs-area`**（`min-height: 0` + `overflow-y: auto`）；设置/主题抽屉内部自滚 |
| `.popup-shell-banner` | 默认隐藏；仅 `html[data-shell="popup"]` 显示寿命警告 +「改用侧边栏」CTA |

滚动所有权：header / topic tabs / session toolbar / footer 固定；消息区 `.logs-area` 滚动。

## 约定

1. **新样式放本目录**（可继续追加到 `styles.css`，或按需拆分文件并在入口统一引入）。
2. 与组件相关的类名保持与 `sidepanel.html` / 生成 `popup.html` / 模块渲染 DOM 一致。
3. 不引入完整 CSS 框架重写；现有 Tailwind/PostCSS 配置服务于构建链路，样式以本目录为准。
