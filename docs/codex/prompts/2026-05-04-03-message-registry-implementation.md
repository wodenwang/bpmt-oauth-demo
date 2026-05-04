# 2026-05-04 03 留言登记表实现

## 用户目标

按留言登记表实现计划推进 Task 1，先建立 Node.js 项目骨架和配置校验能力，为后续 BPMT OAuth 登录、留言 CRUD、数据库初始化和页面实现提供基础。

本文件是实现阶段的滚动归档。后续任务继续在本文件追加对应实现、验证结果和限制。

## Codex 任务提示词

```text
你正在实现 Task 1: Node 项目骨架和配置校验。

要求：
1. 只实现 Task 1，不实现后续 OAuth、server、setup、页面或 CRUD 任务。
2. 采用 TDD 顺序：先写 `test/config.test.js`，运行测试确认缺少 `package.json` 或 `src/config.js` 时失败，再创建 Node 项目文件和配置加载逻辑。
3. 创建 `package.json`、`.env.example`、`src/config.js`、`test/config.test.js`，修改 `.gitignore`，安装依赖生成 `package-lock.json`。
4. 配置加载函数 `loadConfig(env = process.env)` 必须从传入 env 或默认 `process.env` 读取，不在模块加载时强制读取真实 `.env`。
5. 配置校验必须检查必要环境变量、端口范围、端口纯数字格式，并支持配置脱敏输出。
6. 不写入真实密钥；文档和示例中使用 `<BPMT_OAUTH_CLIENT_SECRET>`、`<BPMT_API_APP_SECRET>` 等占位符。
7. 最终运行 `npm test -- test/config.test.js` 并提交。
```

## 环境假设

- 工作目录：`/Users/wenzhewang/workspace/bpmt_project/bpmt-oauth-demo/.worktrees/message-registry`
- Git 分支：`feature/message-registry`
- BPMT 基础地址：`http://localhost`
- BPMT OAuth 回调地址：`http://localhost:81/oauth/callback`
- BPMT OpenAPI：`http://127.0.0.1/api/openapi.json`
- OAuth client id：`bpmt-oauth-demo`
- OAuth client secret：`<BPMT_OAUTH_CLIENT_SECRET>`
- BPMT API app key：`bpmt-api`
- BPMT API app secret：`<BPMT_API_APP_SECRET>`
- 数据库名：`bpmt`
- 本机密钥、数据库密码和真实本地凭据只允许保存在 `.codex/project-record.local.md`，不进入 Git 跟踪文件。

## 当前 Task 1 修改文件

- `package.json`
- `package-lock.json`
- `.env.example`
- `.gitignore`
- `src/config.js`
- `test/config.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## 验证命令

Task 1 执行和复审过程中使用的关键验证命令：

```bash
npm test -- test/config.test.js
npm install
git diff --name-only
git status --short --branch
```

当前最终验证命令：

```bash
npm test -- test/config.test.js
```

## Task 1 结果摘要

- 已创建 Node.js 项目骨架，使用 ESM 模块和 Node 20+。
- 已配置依赖：`dotenv`、`ejs`、`express`、`express-session`、`mysql2`、`supertest`。
- 已创建 `.env.example`，所有敏感项均使用占位符。
- 已实现 `loadConfig(env = process.env)`，用于解析端口、BPMT 基础地址、OAuth 客户端配置、BPMT API 签名配置和数据库配置。
- 已实现 `redactConfig(config)`，用于脱敏 `sessionSecret`、OAuth client secret、BPMT API app secret 和数据库密码。
- 已移除 `src/config.js` 的顶层 `dotenv/config` 副作用，后续启动入口负责显式加载 dotenv。
- 已严格校验 `PORT` 和 `DB_PORT` 必须为纯数字字符串，且范围为 `1..65535`。
- 已将 `BPMT_BASE_URL` 和 `BPMT_API_BASE_URL` 的尾部多个 `/` 统一去除。
- 已保留 `package.json` 中 Task 1 计划要求的 `start`、`dev`、`setup` 脚本中间态；这些入口文件会由后续任务实现。

## 已知限制

- Task 1 只完成项目骨架和配置校验，不启动 Web 服务。
- `src/server.js` 和 `scripts/setup.js` 尚未实现，因此 `npm start`、`npm run dev`、`npm run setup` 需要等待后续任务。
- OAuth 授权码登录、token 交换、用户信息读取、本地 session、数据库表初始化、留言 CRUD 和页面样式均未在 Task 1 实现。
- 本轮没有连接 BPMT 实例或 MariaDB，只验证配置解析逻辑。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。
