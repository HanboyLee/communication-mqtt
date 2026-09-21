# src/modules/AGENTS.md

## Scope

适用于 `src/modules/**`，并继承仓库根 `AGENTS.md`。

## Boundaries

- 本目录负责 Topic 会话状态、主题匹配、消息路由、持久化和 Tab 渲染。
- **领域状态与生命周期**：由 `TopicManager.js` 统一管理（含 `autoScroll`/`jsonFormat` 等会话配置）。
- **消息路由与通配符匹配**：由 `TopicRouter.js` 负责。
- **会话持久化**：基于 `chrome.storage.local` 的读写由 `TopicStorage.js` 负责。
- **DOM 创建与 Tab 更新**：由 `TabRenderer.js` 负责。
- **JSON 树形渲染与高亮**：由 `JsonTreeRenderer.js` 负责交互式折叠展开与语法高亮。
- **公共导出**：对外公共接口统一从 `index.js` 导出；避免模块间循环依赖。
- **与入口解耦**：`sidepanel.js` 仅做连接层与 UI 编排，不复制或承载本目录的领域逻辑。

## Verification

- 修改主题匹配、会话状态或路由逻辑时，运行 `npm test`。
- 修改公共导出或与应用入口的集成时，运行 `npm test` 和 `npm run build`。

仅当上述架构边界或验证方式发生变化时才更新本文件。
