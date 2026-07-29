# src/css/ — Agent 说明

本目录是扩展 UI 样式的 **唯一归属地**。新增或修改样式请写在这里，不要再使用或恢复 `src/styles.css` 根路径单文件。

## 当前文件

| 文件 | 职责 |
|------|------|
| `styles.css` | 主样式表：布局、组件、日志气泡、状态指示、设置分区（`.section-label` / `.form-section`）等 |

入口引用：

- `src/sidepanel.js`：`import './css/styles.css'`
- `src/sidepanel.html`：`href="css/styles.css"`（相对 `src/` 的 HTML 入口）

## 主题变量

- 默认亮色主题变量定义在 `:root`（如 `--bg-app`、`--text-primary`、`--accent-primary`、日志/状态色等）。
- 暗色主题通过 `[data-theme="dark"]` 覆盖同名 CSS 变量。
- 运行时主题由 HTML 上的 `data-theme` 控制；改颜色优先改变量，避免散落硬编码色值。

## 约定

1. **新样式放本目录**（可继续追加到 `styles.css`，或按需拆分文件并在入口统一引入）。
2. 与组件相关的类名保持与 `sidepanel.html` / 模块渲染 DOM 一致。
3. 不引入完整 CSS 框架重写；现有 Tailwind/PostCSS 配置服务于构建链路，样式以本目录为准。
