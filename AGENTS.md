# AGENTS.md

本仓库是 **Chrome 扩展（Manifest V3）**，通过 Side Panel（默认）或工具栏 Popup 提供 WebSocket / MQTT-over-WebSocket 调试工具：连接、收发、日志、历史与主题切换等。

## 顶层目录职责

| 路径 | 职责 |
|------|------|
| `src/` | 应用源码入口：Side Panel UI（`sidepanel.html`）与主编排逻辑（`sidepanel.js`）；可选生成孪生 `popup.html`（`data-shell=popup`，构建产物） |
| `src/background.js` | MV3 service worker：按 `ws:uiShell` 有序配置 `sidePanel.setPanelBehavior` 与 `action.setPopup`；**禁止** import 业务/mqtt/modules |
| `src/modules/` | 多 Topic / 会话相关的模块化领域逻辑（状态、路由、持久化、Tab 渲染） |
| `src/css/` | 样式表集中管理（主题变量与 UI 样式）；**不要**再把样式写回单文件根路径 `src/styles.css` |
| `public/` | 扩展静态资源与 `manifest.json`（图标等）；`background.service_worker` → `background.js` |
| `docs/` | 给人看的架构 / 产品 / 开发文档（含 UI shell 设计 `docs/06-ui-shell-popup-vs-sidepanel.md`） |
| `tests/` | 测试（含 Node 与简易 HTML 用例；`ui-shell` normalize/产物断言） |
| `prototype/` | 早期 UI 原型，**仅作参考**，不是运行时依赖 |
| `assets/` | 截图等媒体资源 |
| `dist/` | Vite 构建产物（加载扩展时选此目录）；固定 `dist/background.js`，app 资源可 content-hash |
| `vite.config.js` / `package.json` / `tailwind.config.js` / `postcss.config.js` 等 | 构建与工具链配置（多入口：sidepanel HTML + background SW；polyfill 不污染 SW） |

更细的区域说明见：

- [`src/modules/AGENTS.md`](src/modules/AGENTS.md)
- [`src/css/AGENTS.md`](src/css/AGENTS.md)

## 构建与开发（简要）

```bash
npm run dev     # 开发构建 / 热更新
npm run build   # 生产构建 → dist/
npm run watch   # 监听变更并构建
```

加载扩展：`chrome://extensions/` → 开发者模式 →「加载已解压的扩展程序」→ 选择 **`dist/`**。

## Agent 约定

1. **Topic / 多会话相关功能**：优先改 `src/modules/` 下模块，避免把领域逻辑堆进 `sidepanel.js`。
2. **样式**：新增或修改样式放在 `src/css/`（当前主文件为 `src/css/styles.css`）。
3. **技术栈**：保持 **Vanilla JS + Chrome Extension APIs**；除非明确要求，不要引入框架重写。
4. **改动范围**：任务相关、最小 diff；不要无关重构或编造新功能。
5. **区域细节**：模块与 CSS 的更具体说明分别见对应目录下的 `AGENTS.md`。
6. **`src/` 变更必须同步分类 AGENTS.md**（按目录维护，勿把细节堆进根 `AGENTS.md`）：
   - 改动 `src/modules/` → 更新 [`src/modules/AGENTS.md`](src/modules/AGENTS.md)（高层模块地图 / 一行职责，保持简短）
   - 改动 `src/css/` 或新增 CSS 文件 → 更新 [`src/css/AGENTS.md`](src/css/AGENTS.md)
   - 在 `src/` 下新建分类目录（如 `src/utils/`）→ 为该目录创建 `AGENTS.md`，并在根 `AGENTS.md` 的顶层目录表与「更细的区域说明」中补充链接
   - 入口 / 横切改动（`sidepanel.js`、`sidepanel.html`）：仅当顶层结构职责变化时，在根 `AGENTS.md` 结构表作简短备注；工作落在子目录时优先改对应分类 `AGENTS.md`
   - 更新风格：**按分类**、简洁表格 / 一行说明，禁止长篇实现细节
   - 尽量与本次任务 / PR **一并完成**，勿事后补文档
7. **强制规则**：见 [`.agents/rules/`](.agents/rules/)（尤其是 [禁止打包](.agents/rules/no-packaging.md)——不得协助用户打包/制作分发包）。
