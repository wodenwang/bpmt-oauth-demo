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

## Task 2 用户目标

实现 BPMT OpenAPI 请求签名工具和 `DEMO_MESSAGE` 动态表定义，为后续 setup 脚本调用 BPMT API 创建留言登记表提供基础。Task 2 只提供可复用的签名函数、canonical string 构造、query 归一化和表结构常量，不实际调用 BPMT API，也不连接数据库。

## Task 2 Codex 任务提示词

```text
你正在实现 Task 2: BPMT API 签名和 DEMO_MESSAGE 表定义。

要求：
1. 只实现 Task 2，不实现后续 BPMT OpenAPI 调用、数据库初始化、OAuth 登录或留言 CRUD。
2. 采用 TDD 顺序：先写 `test/bpmt-signature.test.js` 和 `test/table-definition.test.js`，运行测试确认缺少模块时失败，再创建实现文件。
3. 创建 `src/bpmt/signature.js`，实现 `normalizeQuery`、`buildCanonicalString`、`signBpmtRequest`。
4. 创建 `src/setup/tableDefinition.js`，导出 `DEMO_MESSAGE_TABLE` 表定义。
5. canonical string 必须按 BPMT OpenAPI 说明使用 `METHOD`、`PATH`、`NORMALIZED_QUERY`、`TIMESTAMP`、`NONCE`、`SHA256_HEX(BODY)` 逐行拼接。
6. query 排序必须使用确定性的 Java `String.compareTo` 等价顺序：先比较 name，再比较 value。
7. query 编码必须对齐 BPMT Java 服务端 `URLEncoder.encode(...).replace("+", "%20")` 风格：空格编码为 `%20`，`~!'()` 编码为大写 percent hex，`*` 保持不编码。
8. 不写入真实密钥；测试中只能使用固定假值。
9. 最终运行 `npm test -- test/bpmt-signature.test.js test/table-definition.test.js` 和 `npm test`。
```

## Task 2 修改文件

初始实现修改文件：

- `src/bpmt/signature.js`
- `src/setup/tableDefinition.js`
- `test/bpmt-signature.test.js`
- `test/table-definition.test.js`

代码质量复审修正文件：

- `src/bpmt/signature.js`
- `test/bpmt-signature.test.js`
- `test/table-definition.test.js`

本归档补记文件：

- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 2 验证命令

Task 2 初始实现和复审修正过程中使用的关键验证命令：

```bash
npm test -- test/bpmt-signature.test.js test/table-definition.test.js
npm test
git diff --name-only
git status --short --branch
```

当前最终验证命令：

```bash
npm test -- test/bpmt-signature.test.js test/table-definition.test.js
```

## Task 2 结果摘要

- 已实现 `normalizeQuery(query = '')`，支持去除开头 `?`、解析重复参数、按解码后的 name/value 排序，并重新编码为 BPMT 签名需要的 query string。
- 已将 query 排序对齐 Java `String.compareTo` 语义，使用确定性的 UTF-16/code-unit 字符串比较，避免 `localeCompare` 受 locale 或 ICU 行为影响。
- 已将 query 编码对齐 BPMT Java 服务端：空格输出 `%20`，`~!'()` 输出 `%7E%21%27%28%29`，`*` 保持不编码。
- 已实现 `buildCanonicalString(...)`，按 `METHOD`、`PATH`、`NORMALIZED_QUERY`、`TIMESTAMP`、`NONCE`、`SHA256_HEX(BODY)` 用换行连接。
- 已实现 `signBpmtRequest(...)`，使用 `HMAC-SHA256` 和服务端保存的 app secret 生成 `X-BPMT-Signature`，并返回 BPMT 所需的 `X-BPMT-App-Key`、`X-BPMT-Timestamp`、`X-BPMT-Nonce`、`X-BPMT-Signature` 请求头。
- 已创建 `DEMO_MESSAGE_TABLE`，表名为 `DEMO_MESSAGE`，包含 `ID`、`TITLE`、`CONTENT`、`CREATOR_USERID`、`CREATE_TIME`、`UPDATE_TIME` 六个字段；`ID` 为主键，`CONTENT` 为 `Clob`。
- 已补充 signature golden 断言，覆盖固定输入下的签名值。
- 已补充混合大小写、特殊字符、重复参数的 `normalizeQuery` 测试。
- 已增强 `DEMO_MESSAGE_TABLE` 测试，全量断言字段 `type`、`totalSize`、`required`、`primaryKey` 等结构。

## Task 2 已知限制

- Task 2 只实现签名函数和动态表定义，不调用 BPMT `/api/v1/dynamic-tables`。
- Task 2 不读取 `.env`，也不读取 `.codex/project-record.local.md`；真实 `BPMT_API_APP_SECRET` 仍只允许保存在本机未跟踪文件中。
- Task 2 没有连接本机 BPMT 实例、MariaDB 或 OpenAPI 文档，只通过单元测试验证 canonical string、签名头和表定义结构。
- `signBpmtRequest(...)` 由调用方传入 `timestamp`、`nonce`、`appKey` 和 `appSecret`；后续 Task 需要负责生成 nonce、读取配置、发起 HTTP 请求和处理 BPMT 返回值。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 3 用户目标

实现一次性 `npm run setup` 基础命令，用服务端环境变量中的 BPMT API 签名配置调用 BPMT OpenAPI，创建 demo 所需的 `DEMO_MESSAGE` 动态表；如果表已存在，则将 `409 Conflict` 视为已初始化并继续执行 DDL 同步。Task 3 不实现真实留言 CRUD、OAuth 页面或数据库业务逻辑。

## Task 3 Codex 任务提示词

```text
你正在实现 Task 3: 一次性 setup 命令。

要求：
1. 只实现 Task 3，不实现后续任务。
2. 只写入 `src/bpmt/api.js`、`scripts/setup.js`、`test/bpmt-api.test.js`，并更新本滚动归档。
3. 采用 TDD 顺序：先写 `test/bpmt-api.test.js`，运行 `npm test -- test/bpmt-api.test.js` 确认缺少 `src/bpmt/api.js` 时失败。
4. 创建 `src/bpmt/api.js`，实现 `createBpmtApiClient(...)`、`createDynamicTable(...)` 和 `syncDynamicTableDdl(...)`。
5. BPMT 签名 canonical path 必须使用 public URI，例如 `/api/v1/dynamic-tables`，不能只使用 `/v1/dynamic-tables`。
6. 创建 `scripts/setup.js`，读取 `loadConfig()`，脱敏输出 BPMT API 配置，创建 `DEMO_MESSAGE` 表，已存在时执行 DDL 同步。
7. 不写入真实密钥；测试只能使用固定假值。
8. 最终运行 `npm test -- test/bpmt-api.test.js` 和 `npm test`。
```

## Task 3 修改文件

- `src/bpmt/api.js`
- `scripts/setup.js`
- `test/bpmt-api.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 3 验证命令

Task 3 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/bpmt-api.test.js
npm test
git diff --name-only
git status --short --branch
```

RED 阶段验证结果：

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/bpmt/api.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 2
# pass 2

npm test
# tests 12
# pass 12
```

## Task 3 结果摘要

- 已新增 `createBpmtApiClient(...)`，支持注入 `fetchImpl`、`now` 和 `nonce`，便于单元测试固定 HTTP 请求和签名输入。
- 已实现 `createDynamicTable(tableDefinition)`，向 `${baseUrl}/v1/dynamic-tables` 发起 `POST`，请求体为 `DEMO_MESSAGE_TABLE` 的 JSON。
- 已实现 `syncDynamicTableDdl(tableName)`，向 `${baseUrl}/v1/dynamic-tables/{tableName}/ddl:sync` 发起 `POST`。
- 已确认签名调用使用 public canonical path：`/api${publicPath}`，例如 `/api/v1/dynamic-tables`；实际请求 URL 继续使用配置中的 `BPMT_API_BASE_URL` 加 public path，例如 `http://127.0.0.1/api/v1/dynamic-tables`。
- 已实现响应解析：优先读取 `response.text()` 后解析 JSON；非 JSON 响应以 `{ raw }` 返回，避免错误信息丢失。
- 已将 `409 Conflict` 处理为 `{ alreadyExists: true, payload }`，用于 setup 命令幂等运行。
- 已新增 `scripts/setup.js`，通过 `loadConfig()` 读取运行环境变量，通过 `redactConfig(config).bpmtApi` 打印脱敏配置，并输出中文初始化进度。

## Task 3 已知限制

- Task 3 单元测试使用 fake fetch，没有连接本机 BPMT 实例，也没有真实创建或同步 `DEMO_MESSAGE` 表。
- `scripts/setup.js` 不自动加载 `.env`；当前只依赖调用进程已经提供的环境变量。
- `scripts/setup.js` 捕获异常后只打印 `error.message`，不会输出 `client_secret`、`BPMT_API_APP_SECRET`、授权码、访问令牌或数据库密码。
- setup 命令只初始化 BPMT 动态表，不创建本地 MySQL 留言业务表，不实现 OAuth 登录、留言 CRUD 或页面。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。
