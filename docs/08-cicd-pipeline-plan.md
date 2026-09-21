# CI/CD 自动化流水线规划与部署规范

本文档为本项目（**Chrome Manifest V3 扩展**）的 CI/CD（持续集成与持续交付）架构方案与落地指南。

---

## 一、 建设背景与目标

### 1.1 现状与痛点
- **人工验证依赖度高**：此前单元测试（`npm test`）和构建检查（`npm run build`）全靠开发者本地手工执行，存在提 PR 或合并时漏测的风险。
- **环境一致性风险**：本地开发多基于单一操作系统与 Node 版本，缺少跨 Node 版本（如 Node 18 与 20）的自动化兼容性断言。
- **发版繁琐与打包边界**：本地环境受安全规约（`no-packaging.md`）限制严禁由 Agent 制作外发 zip/crx，急需通过中立、受控的云端 CI/CD 构建机自动完成 Release 归档与发布物生成。

### 1.2 核心目标
1. **零缺陷合入（CI 质量守门）**：任何分支向 `main` 提交 PR 或主干 Push 时，强制执行双环境矩阵单测与产物校验，测试不过严禁合入。
2. **零人工负担发版（CD 自动化交付）**：只要打版本 Tag 并推送至 GitHub（如 `git push origin v0.2.0`），GitHub Actions 自动构建、生成 `mqtt_dist_extension.zip` 并发布到 GitHub Release 页面供用户一键下载。

---

## 二、 流水线架构设计（双 Workflow）

```
                           【代码流动】
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
【CI：ci.yml】                                   【CD：release.yml】
- 触发：PR 到 main / Push 到 main                - 触发：Push Tag (v*.*.*)
- 矩阵：Node 18.x / 20.x                        - 环境：Node 20.x LTS
- 步骤：                                         - 步骤：
  1. npm ci 快速安装依赖                          1. 跑全量 npm test
  2. npm test 执行 28 项单测                      2. npm run build 编译输出 mqtt_dist_extension
  3. npm run build 产物结构校验                  3. zip 压缩 mqtt_dist_extension
                                                  4. 创建 GitHub Release 上传附件
```

---

## 三、 工作流定义与配置蓝图

### 3.1 持续集成工作流：`.github/workflows/ci.yml`

```yaml
name: CI Quality Gate

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Unit Tests
        run: npm test

      - name: Run Build & Verification
        run: npm run build
```

### 3.2 持续交付工作流：`.github/workflows/release.yml`

```yaml
name: CD Release Pipeline

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install & Test
        run: |
          npm ci
          npm test

      - name: Build Extension
        run: npm run build

      - name: Archive Extension Artifact
        run: |
          zip -r mqtt_dist_extension-${{ github.ref_name }}.zip mqtt_dist_extension/

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: mqtt_dist_extension-${{ github.ref_name }}.zip
          generate_release_notes: true
          draft: false
          prerelease: false
```

---

## 四、 安全边界与权责划分

1. **本地环境与 Agent 权限**：
   - 仍坚决遵守 [`.agents/rules/no-packaging.md`](file:///D:/googleExtension/websocketExtension/.agents/rules/no-packaging.md)：本地 Agent 仅执行 `npm run build` 生成未压缩的 `mqtt_dist_extension/` 目录供本地载入，**不得在本地生成 zip/crx 安装包或提交分发包到 Git**。
2. **云端 GitHub Actions 权限**：
   - 最终的分发包压缩（`zip -r`）与 GitHub Release 发版工作全部交由 GitHub 官方云端 Runner 自动化执行，产物直接挂载于 Release 页面，不污染 Git 版本库主树。

---

## 五、 未来演进方向（可选）

- **Chrome Web Store 自动提审**：未来可接入 `chrome-webstore-upload-cli`，在 GitHub Secrets 中配置 `CLIENT_ID`、`CLIENT_SECRET`、`REFRESH_TOKEN`，实现打 Tag 自动发布到谷歌应用商店。
- **Playwright E2E 扩展冒烟测试**：在无头浏览器中自动加载扩展并模拟真实 WebSocket / MQTT 连接验证。
