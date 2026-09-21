# AGENTS.md

## Scope

本文件适用于整个仓库。
编辑存在局部 `AGENTS.md` 的目录前，先读取该目录最近的 `AGENTS.md`（局部文件仅收紧或补充本文件，不重复全局规则）。
委派子 Agent 时，必须显式提供适用的局部指令，或将其工作目录设置为对应目录。

## Project

本项目是 Chrome Manifest V3 扩展，提供 WebSocket / MQTT-over-WebSocket 调试能力，技术栈为 **Vanilla JS + Chrome Extension APIs + Vite + MQTT.js**。

运行时支持两种 UI Shell 形态：
- `sidepanel`：默认侧边栏。
- `window`：通过 `chrome.windows.create` 打开的独立浮动窗口（非 action popup）。

核心目录结构：
- `src/sidepanel.html`、`src/sidepanel.js`：UI 源文件与入口编排。
- `src/background.js`：MV3 Service Worker（轻量调度，严禁导入业务模块）。
- `src/modules/`：多 Topic、会话、路由及持久化领域逻辑。
- `src/css/`：运行时样式（禁止恢复单文件 `src/styles.css`）。
- `public/manifest.json`：扩展清单。
- `tests/`：Node 单元测试与构建产物断言。
- `docs/`：产品文档、架构方案与需求台账（详见下方文档路由）。

## Docs Routing (文档按需路由)

Agent 平时**无需全量通读**，但必须知晓以下文档资产的存在，**仅当任务涉及对应领域时按需查阅**：

| 文档路径 | 核心主题与定位 | 🎯 触发场景（何时按需查阅） |
| :--- | :--- | :--- |
| [`docs/TODO.md`](docs/TODO.md) | 未完成待办需求池与排期 | 用户明确提出新功能、挑选未完成任务或进行需求排期时 |
| [`docs/00-requirements.md`](docs/00-requirements.md) | 已完成需求台账与功能全貌 | 确认已有功能边界、避免重复开发、完成新需求验收归档时 |
| [`docs/01-overview.md`](docs/01-overview.md) | 产品总览与快捷键一览 | 了解产品整体定位、功能特性、全局快捷键绑定时 |
| [`docs/02-architecture.md`](docs/02-architecture.md) | 系统总体架构与数据流 | 涉及全局消息数据流、连接状态流转或核心架构重构时 |
| [`docs/03-ui-components.md`](docs/03-ui-components.md) | UI 组件设计与 DOM 规范 | 新增/修改界面控件、抽屉抽拉面板、气泡样式或对齐视觉规范时 |
| [`docs/04-development-guide.md`](docs/04-development-guide.md) | 开发调试与环境指南 | 遇到 Chrome 扩展 API 权限、本地环境调试困难时 |
| [`docs/05-multiple-topics-plan.md`](docs/05-multiple-topics-plan.md) | MQTT 多主题会话方案 | 修改或扩展 Topic 订阅管理、通配符路由匹配、Tab 交互时 |
| [`docs/06-ui-shell-popup-vs-sidepanel.md`](docs/06-ui-shell-popup-vs-sidepanel.md) | 双 UI Shell（侧边栏/浮动窗）方案 | 涉及独立窗口生命周期、弹窗行为优化、`window.html` 机制时 |

## Hard Constraints (硬性约束)

- **技术栈**：保持 Vanilla JS + Chrome Extension APIs，未经明确要求严禁引入前端框架。
- **UI 孪生**：`src/sidepanel.html` 为 UI DOM 源文件；`src/window.html` 由脚本生成，**严禁手改**。
- **后台纯粹性**：`src/background.js` 必须保持轻量，不得导入 MQTT.js、业务模块或 Side Panel 逻辑。
- **领域解耦**：Topic 与会话领域状态必须收敛在 `src/modules/`，`sidepanel.js` 仅做薄接入编排。
- **打包边界**：允许且推荐运行 `npm run build` 进行开发与验证；**严禁**生成或整理 zip、crx、release/package 目录等分发包。

## Working Rules (工作准则)

1. **最小 Diff**：仅修改当前任务必要的文件，不做无关重构。
2. **需求按需联动**：仅在用户明确提出或执行产品需求时，才读取和更新 `docs/TODO.md`；代码审查、架构诊断与日常答疑不修改需求台账。
3. **文档低频演进**：仅在架构职责变化、验证命令变更或新增全局硬约束时才更新 `AGENTS.md`，常规功能开发或修复**无需**同步更新本文件。
4. **生成同步**：修改 `src/sidepanel.html` 后，必须通过构建或 `scripts/generate-window-html.mjs` 刷新 `src/window.html`。
5. **多 Agent 协作**：`AGENTS.md`、`docs/TODO.md`、`package.json` 及构建配置默认由主协调者修改，子 Agent 仅在显式授权时修改目标文件。

## Verification & DoD (验证矩阵与完成定义)

改动完成后，必须根据修改范围执行对应的检查：

| 改动范围 | 必须执行的验证命令 |
| :--- | :--- |
| `src/modules/**`、主题匹配或会话逻辑 | `npm test` |
| `background.js`、manifest、Vite 配置、HTML、UI Shell | `npm test` 和 `npm run build` |
| `src/css/**` 样式或布局变动 | `npm run build`；检查滚动容器与 Shell 样式 |
| 生成脚本（`scripts/**`） | `node scripts/generate-window-html.mjs` + `npm run build` |
| 纯文档 Markdown 修改 | 检查链接与路径有效性，无需运行构建 |

**完成标准（Definition of Done）**：
- 行为符合用户请求，相关测试与构建全部通过（无未捕获异常或失败用例）。
- 没有手工修改生成文件（如 `src/window.html`）。
- 最终报告中明确列出修改的文件、执行的验证命令与结果。

## Local Guidance (局部指引)

- [`src/modules/AGENTS.md`](src/modules/AGENTS.md)
- [`src/css/AGENTS.md`](src/css/AGENTS.md)
