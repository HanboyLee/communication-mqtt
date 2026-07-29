# src/css/ — Agent 说明

本目录是扩展 UI 样式的 **唯一归属地**。新增或修改样式请写在这里，不要再使用或恢复 `src/styles.css` 根路径单文件。

## 当前文件

| 文件 | 职责 |
|------|------|
| `styles.css` | 主样式表：布局、组件、日志气泡、状态指示、设置分区、浮动独立窗口 shell 适配等 |

入口引用：

- `src/sidepanel.js`：`import './css/styles.css'`
- `src/sidepanel.html` / 生成的 `src/window.html`：`href="css/styles.css"`（相对 `src/` 的 HTML 入口）

## 主题变量

- 默认亮色主题变量定义在 `:root`（如 `--bg-app`、`--text-primary`、`--accent-primary`、日志/状态色等）。
- 暗色主题通过 `[data-theme="dark"]` 覆盖同名 CSS 变量。
- 运行时主题由 HTML 上的 `data-theme` 控制；改颜色优先改变量，避免散落硬编码色值。

## UI Shell（`data-shell`）

| 选择器 | 约定 |
|--------|------|
| `html[data-shell="sidepanel"]` | 默认侧边栏；全高 `100vh`，主滚动在 `.logs-area` |
| `html[data-shell="window"]` | 独立浮动窗口（`chrome.windows.create`，非 action popup）：填满窗口视口；**主滚动在 `.logs-area`**（`min-height: 0` + `overflow-y: auto`）；header/footer 固定可见；设置/主题抽屉内部自滚 |

滚动所有权：header / topic tabs / session toolbar / footer 固定；消息区 `.logs-area` 滚动。窗口寿命警告仅在设置「界面」hint / confirm 中说明，无壳内 banner。

## 约定

1. **新样式放本目录**（可继续追加到 `styles.css`，或按需拆分文件并在入口统一引入）。
2. 与组件相关的类名保持与 `sidepanel.html` / 生成 `window.html` / 模块渲染 DOM 一致。
3. 不引入完整 CSS 框架重写；现有 Tailwind/PostCSS 配置服务于构建链路，样式以本目录为准。
