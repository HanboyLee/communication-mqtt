# src/css/AGENTS.md

## Scope

适用于 `src/css/**`，并继承仓库根 `AGENTS.md`。

## Boundaries

- 本目录是扩展 UI 样式的唯一归属地，禁止恢复或使用根路径 `src/styles.css`。
- **变量体系**：默认亮色主题变量定义在 `:root`；暗色主题通过 `[data-theme="dark"]` 覆盖变量；优先复用变量，避免硬编码颜色。
- **UI Shell 适配**：
  - `html[data-shell="sidepanel"]`：侧边栏视图，主滚动位于 `.logs-area`。
  - `html[data-shell="window"]`：独立浮动窗口视图，header / footer / session toolbar 固定可见，主滚动位于 `.logs-area`。
- **滚动不变量**：`.logs-area` 作为 flex 子项必须保留 `min-height: 0`，否则会随内容无限撑高导致内部滚动失效。
- **类名一致性**：类名变动必须同步核对 `sidepanel.html`、`src/window.html`（经脚本生成）及 `TabRenderer.js`。
- **技术约束**：不引入复杂 CSS 框架重写现有样式体系。

## Verification

- 样式修改后必须运行 `npm run build`。
- 可行时分别检查 Side Panel 与独立 Window 两种形态下的长日志滚动、暗色模式及抽屉显示效果。

仅当样式体系、Shell 约定或核心不变量发生变化时才更新本文件。
