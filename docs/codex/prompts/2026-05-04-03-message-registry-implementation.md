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
- `scripts/setup.js` 已在后续代码质量复审中改为显式加载 `dotenv/config`；`src/config.js` 仍保持无 dotenv 顶层副作用。
- `scripts/setup.js` 捕获异常后只打印 `error.message`，不会输出 `client_secret`、`BPMT_API_APP_SECRET`、授权码、访问令牌或数据库密码。
- setup 命令只初始化 BPMT 动态表，不创建本地 MySQL 留言业务表，不实现 OAuth 登录、留言 CRUD 或页面。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 3 代码质量复审修复

### 复审问题

Task 3 初始提交后，代码质量审查指出以下问题需要修正：

- HTTP 错误消息只包含 method、path 和 status，`scripts/setup.js` 只打印该 message，无法看到 BPMT 返回的安全诊断字段。
- `test/bpmt-api.test.js` 未用 golden 签名锁住 `createDynamicTable(...)` 的 canonical path。
- 缺少 `syncDynamicTableDdl('DEMO_MESSAGE')` 的 URL、method 和签名 golden 测试。
- 缺少非 `409` HTTP 错误测试，未断言错误消息包含安全 payload 诊断且不包含 secret。
- `scripts/setup.js` 作为 CLI 入口应显式加载 `dotenv/config`，但 `src/config.js` 不能恢复 dotenv 顶层副作用。
- `scripts/setup.js` 脱敏配置输出需要中文前缀。

### 修复内容

- `test/bpmt-api.test.js` 新增 `X-BPMT-Signature` 精确断言，固定 `now=1777867200`、`nonce=nonce-1` 和测试假密钥 `api-secret`。
- `createDynamicTable(...)` 的签名 golden 固定为 `faf2c8c2dce79b8fac84a307c5db6efb505864e6d3b235486b1c449115f18cec`，用于锁住 canonical path `/api/v1/dynamic-tables`。
- 新增 `syncDynamicTableDdl('DEMO_MESSAGE')` 测试，断言 URL 为 `http://127.0.0.1/api/v1/dynamic-tables/DEMO_MESSAGE/ddl:sync`，method 为 `POST`，签名 golden 为 `c0e62d244495ce6aface2e0cad6af53e9dc94b0c569114d8fc03d45521719cfa`，用于锁住 canonical path `/api/v1/dynamic-tables/DEMO_MESSAGE/ddl:sync`。
- 新增非 `409` 错误测试，断言 `error.status`，并确认 `error.message` 包含 `code`、`error`、`message` 三个安全诊断字段，同时不包含测试假密钥。
- `src/bpmt/api.js` 新增安全诊断格式化，只从 payload 中提取 `code`、`error`、`message`，并对当前 app secret 做兜底脱敏。
- `scripts/setup.js` 顶部新增 `import 'dotenv/config';`，让 CLI 入口支持后续 `.env` 用户路径。
- `scripts/setup.js` 脱敏配置输出调整为 `BPMT API 配置：...`。

### 复审修复验证

RED 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# fail 1
# failing test: createDynamicTable includes safe BPMT diagnostics for non-conflict errors
# reason: error.message 缺少 INVALID_SIGNATURE
```

GREEN 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 4
# pass 4
```

最终验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 4
# pass 4

npm test
# tests 14
# pass 14
```

### 复审修复限制

- 本次修复仍不连接真实 BPMT 实例，HTTP 行为通过 fake fetch 单元测试验证。
- 本次修复不修改 Task 2 的 `src/bpmt/signature.js`。
- 测试中的 `api-secret` 是固定假值，不是真实 `BPMT_API_APP_SECRET`。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 3 二次代码质量复审修复

### 二次复审问题

Task 3 复审修复后，代码质量审查继续指出以下问题：

- 真实 BPMT ErrorEnvelope 可能是嵌套结构，例如 `{ error: { code, message, requestId, details } }`，此前诊断会输出 `error=[object Object]`。
- `error.payload` 此前保留原始 payload 且可枚举，未来如果调用 `console.error(error)` 或 `util.inspect(error)`，可能把 secret 带入日志。

### 二次修复内容

- `test/bpmt-api.test.js` 新增嵌套 ErrorEnvelope 测试，断言 `error.message` 包含 `INVALID_SIGNATURE`、`bad sign` 和 `requestId=req-123`，且不包含 `[object Object]`。
- `test/bpmt-api.test.js` 新增错误对象脱敏断言，确认 `JSON.stringify(error.payload)` 和 `util.inspect(error)` 都不包含测试假密钥 `api-secret`。
- `src/bpmt/api.js` 新增递归 `sanitizePayload(...)`，会把字符串中的当前 app secret 替换为 `<redacted>`，并按 key 名脱敏 `appSecret`、`clientSecret`、`password`、`secret`、`accessToken`、`refreshToken`、`token`。
- `src/bpmt/api.js` 保留 BPMT 错误码字段 `code`，不会因为字段名为 `code` 而脱敏 `INVALID_SIGNATURE`。
- `src/bpmt/api.js` 的 `error.payload` 现在挂载脱敏后的 payload，不再挂载原始 payload。
- `src/bpmt/api.js` 的安全诊断同时支持顶层 `{ code, error, message, error_description }` 和嵌套 `{ error: { code, message, requestId, details } }`。

### 二次修复验证

RED 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# fail 1
# failing test: createDynamicTable includes nested BPMT error envelope diagnostics without leaking secrets
# reason: error.message 输出 error=[object Object]，缺少 INVALID_SIGNATURE
```

GREEN 阶段验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 5
# pass 5
```

最终验证结果：

```text
npm test -- test/bpmt-api.test.js
# tests 5
# pass 5

npm test
# tests 15
# pass 15
```

### 二次修复限制

- 本次修复仍不连接真实 BPMT 实例，HTTP 行为通过 fake fetch 单元测试验证。
- 本次修复不修改 `scripts/setup.js`，也不修改 Task 2 的 `src/bpmt/signature.js`。
- 测试中的 `api-secret` 是固定假值，不是真实 `BPMT_API_APP_SECRET`。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 4 用户目标

实现 MariaDB 留言 SQL 构造和 Repository 封装，为后续留言业务规则提供参数化 SQL 访问层。Task 4 只构造 SQL、创建连接池工厂和 repository 包装，不连接真实 MariaDB，也不实现后续业务校验、路由或页面。

## Task 4 Codex 任务提示词

```text
你正在实现 Task 4: MariaDB 留言 SQL 和 Repository。

要求：
1. 只实现 Task 4，不实现后续任务。
2. 只写入 `src/db/pool.js`、`src/messages/sql.js`、`src/messages/repository.js`、`test/message-sql.test.js`，并更新本滚动归档。
3. 采用 TDD 顺序：先写 `test/message-sql.test.js`，运行 `npm test -- test/message-sql.test.js` 确认缺少 `src/messages/sql.js` 时失败。
4. SQL 必须使用参数占位符和 args 数组，不拼接用户输入。
5. `DEMO_MESSAGE` 支持按标题模糊筛选、按创建人筛选、分页、计数、按 id 查询、插入、更新、删除和表存在性检查。
6. 创建 `src/db/pool.js`，从 `loadConfig().db` 读取数据库配置并创建 mysql2 promise pool。
7. 创建 `src/messages/repository.js`，基于注入的 pool.execute 封装 tableExists、list、findById、insert、update、delete。
8. 不写入真实数据库凭据，不连接真实数据库。
9. 最终运行 `npm test -- test/message-sql.test.js` 和 `npm test`，并提交。
```

## Task 4 修改文件

- `src/db/pool.js`
- `src/messages/sql.js`
- `src/messages/repository.js`
- `test/message-sql.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 4 验证命令

Task 4 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/message-sql.test.js
npm test
git diff --name-only
git status --short --branch
```

RED 阶段验证结果：

```text
npm test -- test/message-sql.test.js
# fail 1
# reason: Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/messages/sql.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/message-sql.test.js
# tests 6
# pass 6
```

最终验证结果：

```text
npm test -- test/message-sql.test.js
# tests 6
# pass 6

npm test
# tests 21
# pass 21
```

## Task 4 结果摘要

- 已新增 `src/messages/sql.js`，集中构造 `DEMO_MESSAGE` 的参数化 SQL。
- 已实现列表查询筛选：`TITLE LIKE ?`、`CREATOR_USERID = ?`、`ORDER BY CREATE_TIME DESC`、`LIMIT ? OFFSET ?`。
- 已实现计数查询，并复用列表筛选逻辑但不带分页参数。
- 已实现按 id 查询、插入、更新、删除和当前数据库下表存在性检查。
- 已将分页默认值设为 `page=1`、`pageSize=20`，并将 `pageSize` 上限限制为 `100`。
- 已新增 `src/db/pool.js`，通过 `mysql2/promise` 和 `loadConfig().db` 创建 MariaDB 连接池。
- 已新增 `src/messages/repository.js`，基于注入的 pool 封装留言数据访问方法，并将数据库字段映射为 demo 内部字段名。
- 已确认任务给出的测试实际包含 6 个 test case，最终按实际数量报告 6 个通过。

## Task 4 已知限制

- Task 4 没有连接真实 MariaDB，也没有读取 `.codex/project-record.local.md`。
- `repository.js` 当前只封装数据库访问，不实现标题长度、内容必填、作者权限、登录态或业务错误处理；这些留给后续 Task。
- `insert(...)` 和 `update(...)` 执行写入后会调用 `findById(...)` 返回最新记录，调用方需要确保传入的 pool 是可用的服务端数据库连接。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 4 代码质量审查修复

### 审查问题

Task 4 初始提交后，代码质量审查指出以下问题需要修正：

- `normalizePage(...)` 和 `normalizePageSize(...)` 使用 `parseInt`，会把 `2abc` 解析成 `2`。
- `TITLE LIKE ?` 没有转义 `%`、`_`、`\`，无法保证普通子串搜索语义。
- `repository.insert(...)` 和 `repository.update(...)` 依赖 `this.findById(...)`，解构调用或回调传递时会丢失 `this`。
- 缺少 repository 行为测试，未覆盖 fake pool 下的查询顺序、行映射、写后回读和删除返回值。
- `mysql2` pool 未设置 `dateStrings: true`，未来 `Date` 对象直出到 EJS 时可能产生展示不一致。
- 列表排序只按 `CREATE_TIME DESC`，同秒数据分页顺序不稳定。
- `buildWhere(...)` 对非 string filter 值直接 `.trim()`，会抛出 `trim is not a function`。

### 修复内容

- `test/message-sql.test.js` 新增严格分页测试，确认 `page='2abc'` 和 `pageSize='30xyz'` 会回退到 `page=1`、`pageSize=20`。
- `test/message-sql.test.js` 新增 `pageSize='150'` 上限测试，确认最大分页大小为 `100`。
- `test/message-sql.test.js` 新增 `%`、`_`、`\` 的 LIKE 转义测试，确认 SQL 使用 `LIKE ? ESCAPE '\\'`，参数使用转义后的普通子串模式。
- `test/message-sql.test.js` 新增非 string filter 测试，确认不会调用非法 `.trim()`。
- `src/messages/sql.js` 新增严格正整数校验，字符串必须全量匹配数字且大于 0；内部数字参数仍要求正整数。
- `src/messages/sql.js` 新增 LIKE 转义逻辑，将 `\`、`%`、`_` 转义为字面量搜索字符，并在 SQL 中声明 escape 字符。
- `src/messages/sql.js` 将列表排序调整为 `ORDER BY CREATE_TIME DESC, ID DESC`，保证同秒稳定分页。
- `src/messages/repository.js` 将 repository 方法改为闭包函数，`insert(...)` 和 `update(...)` 直接调用闭包内的 `findById(...)`，不再依赖动态 `this`。
- `test/message-repository.test.js` 新增 fake pool 行为测试，覆盖 `tableExists()`、`list()`、`findById()`、`insert()`、`update()`、`delete()` 和解构调用场景。
- `src/db/pool.js` 增加 `dateStrings: true`，并在测试中确认 pool 配置不会把 MariaDB 日期列直接转为 JS `Date`。

### 修复验证

RED 阶段验证结果：

```text
npm test -- test/message-sql.test.js test/message-repository.test.js
# tests 16
# pass 9
# fail 7
# failing reasons:
# - ORDER BY 缺少 ID DESC
# - page='2abc' 被解析为 2
# - LIKE SQL 缺少 ESCAPE '\\'
# - 非 string title 调用 .trim() 抛错
# - insert/update 解构调用时 this.findById 为空
```

补充 `dateStrings` 测试后的 RED 阶段验证结果：

```text
npm test -- test/message-repository.test.js
# tests 7
# pass 3
# fail 4
# additional failing reason: pool.pool.config.connectionConfig.dateStrings 为 false
```

GREEN 阶段验证结果：

```text
npm test -- test/message-sql.test.js test/message-repository.test.js
# tests 17
# pass 17
```

最终验证结果：

```text
npm test -- test/message-sql.test.js test/message-repository.test.js
# tests 17
# pass 17

npm test
# tests 32
# pass 32
```

### 修复限制

- 本次修复没有连接真实 MariaDB，repository 行为通过 fake pool 验证。
- `createDbPool(...)` 测试只创建并关闭 mysql2 pool，不执行查询，不读取真实环境变量。
- 本次修复不实现留言业务规则、路由、页面或 OAuth 流程。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 5 用户目标

实现留言业务服务层，在不连接真实数据库、不实现 Express 路由和页面的前提下，封装留言列表、查询、创建、更新、删除和批量删除的业务规则。服务层必须使用 Task 4 的 repository 形状，并负责标题/内容校验、当前用户校验、创建人写入和创建人权限判断。

## Task 5 Codex 任务提示词

```text
你正在实现 Task 5: 留言业务服务。

要求：
1. 只实现 Task 5，不实现后续路由、页面或 OAuth 接入。
2. 写入范围只限于 `src/messages/service.js`、`test/message-service.test.js`，并更新本滚动归档。
3. 采用 TDD 顺序：先写 `test/message-service.test.js`，运行 `npm test -- test/message-service.test.js` 确认缺少 `src/messages/service.js` 时失败。
4. 创建 `src/messages/service.js`，导出 `createMessageService`、`ValidationError`、`PermissionError`、`NotFoundError`。
5. `ValidationError.status=400`，`PermissionError.status=403`，`NotFoundError.status=404`。
6. `create(...)` 必须要求 `currentUser.userid`，校验并 trim `title` 和 `content`，标题最大 200 字符，并由服务端写入 `creatorUserid=currentUser.userid`。
7. `update(...)` 和 `delete(...)` 必须先查找留言，只有创建人可以修改或删除。
8. `deleteMany(...)` 必须复用同一条删除权限路径，但不要依赖动态 `this`；解构调用也必须可用。
9. 不写入真实密钥、授权码、访问令牌或数据库凭据。
10. 最终运行 `npm test -- test/message-service.test.js` 和 `npm test`。
```

## Task 5 修改文件

- `src/messages/service.js`
- `test/message-service.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 5 验证命令

Task 5 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/message-service.test.js
npm test
git diff --name-only
git status --short --branch
```

RED 阶段验证结果：

```text
npm test -- test/message-service.test.js
# fail 1
# reason: Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/messages/service.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/message-service.test.js
# tests 7
# pass 7
```

最终验证结果：

```text
npm test -- test/message-service.test.js
# tests 7
# pass 7

npm test
# tests 39
# pass 39
```

## Task 5 结果摘要

- 已新增 `src/messages/service.js`，通过注入的 `repository`、`idFactory` 和 `clock` 封装留言业务规则。
- 已导出 `ValidationError`、`PermissionError`、`NotFoundError`，并分别设置 HTTP 语义状态码 `400`、`403`、`404`。
- 已实现 `isReady()`：repository 提供 `tableExists()` 时委托检查，否则返回 `true`。
- 已实现 `list(filters)` 和 `findById(id)`；`findById(id)` 对缺失记录抛出 `NotFoundError`。
- 已实现 `create(input, currentUser)`：要求当前用户 `userid`，校验并修剪标题和内容，限制标题最大 200 字符，并强制写入服务端拥有的 `creatorUserid`。
- 已实现 `update(id, input, currentUser)`：记录必须存在，且只有 `creatorUserid` 匹配当前用户时允许更新。
- 已实现 `delete(id, currentUser)`：记录必须存在，且只有创建人可以删除；删除结果异常时按未找到处理。
- 已实现 `deleteMany(ids, currentUser)`：按顺序调用闭包内的 `deleteMessage(...)`，复用同一条权限路径，不依赖动态 `this`。
- 已新增 `test/message-service.test.js`，覆盖 readiness、创建人写入、空标题/内容拒绝、非对象输入拒绝、更新权限、删除权限和 `deleteMany` 解构调用。

## Task 5 已知限制

- Task 5 只实现留言业务服务层，不连接真实 MariaDB，不读取 `.codex/project-record.local.md`。
- Task 5 没有实现 Express 路由、OAuth 登录接入、EJS 页面、浏览器验证或真实 BPMT API 调用。
- 单元测试使用内存 fake repository，不写入真实数据库。
- `deleteMany(ids, currentUser)` 当前返回每条删除操作的布尔结果数组；后续路由层如果需要展示删除数量，可在路由层统计。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 5 审查后小修复

Task 5 规格审查和代码质量审查均通过。质量审查提醒业务错误 `message` 可能在后续统一错误页直接展示，因此将服务层默认错误文案和校验错误文案统一改为中文，并补充状态码与中文安全文案断言。

补充验证命令：

```bash
npm test -- test/message-service.test.js
npm test
```

补充验证结果：

```text
npm test -- test/message-service.test.js
# tests 8
# pass 8

npm test
# tests 40
# pass 40
```

## Task 6 用户目标

实现 BPMT OAuth 授权码登录模块，只交付 OAuth URL 构造、state 校验、token 换取、userinfo 获取、本地 session 工具和认证路由；不实现后续 Express 应用入口、留言路由、EJS 页面或 Docker。

## Task 6 Codex 任务提示词

```text
你是 Task 6 的实现代理。请在隔离 worktree 中直接编辑文件、运行测试并提交。

要求：
1. 只实现 Task 6，不实现 Task 7/8 的 Express 应用、留言路由、EJS 页面或 Docker。
2. 遵守 AGENTS.md，文案和文档使用中文，不能写入真实 client_secret、BPMT_API_APP_SECRET、授权 code、access_token、密码或数据库凭据。
3. 使用 TDD：先写 `test/oauth.test.js` 并确认失败，再实现 `src/auth/oauth.js`、`src/auth/session.js`、`src/auth/routes.js`。
4. `buildAuthorizeUrl(config, state)` 使用 `config.bpmtBaseUrl` 构造 `/oauth/authorize`，参数包含 `response_type=code`、`client_id`、`redirect_uri`、`state`。
5. `verifyState(expectedState, actualState)` 对缺失或不匹配抛出 `status=400` 的中文安全错误：`OAuth state 校验失败，请重新登录`。
6. `exchangeCodeForToken({ config, code, fetchImpl = fetch })` 使用表单 POST `/oauth/token`，并校验响应至少包含 `access_token`。
7. `fetchUserInfo({ config, accessToken, fetchImpl = fetch })` 使用 Bearer token GET `/oauth/userinfo`，并校验响应至少包含 `userid`。
8. OAuth HTTP 错误必须抛出带 HTTP 状态码的中文安全错误，错误信息不能泄露密钥、授权码、访问令牌或响应原文中的敏感值。
9. `parseResponse` 先读取 `text()` 再 `JSON.parse`，不要先 `json()` 再 `text()`。
10. session 只能保存 `userid`、`name`、`group`、`role`，不能保存 BPMT `access_token`。
11. `createAuthRouter({ express, config })` 实现 `GET /login`、`GET /oauth/callback`、`POST /logout`。
12. 最终运行 `npm test -- test/oauth.test.js`、`npm test` 和 `git status --short --branch`。
```

## Task 6 修改文件

- `src/auth/oauth.js`
- `src/auth/session.js`
- `src/auth/routes.js`
- `test/oauth.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

## Task 6 验证命令

Task 6 按 TDD 顺序执行的关键验证命令：

```bash
npm test -- test/oauth.test.js
npm test
git status --short --branch
```

RED 阶段验证结果：

```text
npm test -- test/oauth.test.js
# fail 1
# reason: Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/auth/oauth.js'
```

GREEN 阶段验证结果：

```text
npm test -- test/oauth.test.js
# tests 9
# pass 9
```

最终验证结果：

```text
npm test
# tests 49
# pass 49
```

## Task 6 结果摘要

- 已新增 `src/auth/oauth.js`，实现 BPMT 授权地址构造、OAuth state 校验、授权码换 token 和 Bearer token 获取用户信息。
- 已将 OAuth 响应解析统一为先读取 `response.text()`，再按需 `JSON.parse`，避免 fake response 或真实响应兼容问题。
- 已对 OAuth HTTP 错误输出中文安全错误，只包含调用阶段和 HTTP 状态码，不拼接响应原文，避免泄露密钥、授权码或访问令牌。
- 已对 token 和 userinfo 响应做必要字段校验：token 至少需要 `access_token`，userinfo 至少需要 `userid`。
- 已新增 `src/auth/session.js`，实现 `currentUser`、`saveUserSession`、`clearUserSession`、`requireLogin`；本地 session 只保存 `userid`、`name`、`group`、`role`。
- 已新增 `src/auth/routes.js`，实现 `GET /login` 生成并保存 state 后跳转 BPMT，`GET /oauth/callback` 完成 state 校验、token 换取、userinfo 获取和本地登录态写入，`POST /logout` 清理本地 session。
- 已新增 `test/oauth.test.js`，覆盖授权 URL、state 成功和失败、token form body、userinfo bearer、HTTP 错误脱敏、必要字段校验、session 不保存 token、`requireLogin` 和 callback 成功路径。

## Task 6 已知限制

- Task 6 只实现认证模块和单元测试，没有实现 Express 应用入口、留言路由、EJS 页面、Docker 镜像或浏览器端 OAuth 联调。
- 单元测试使用 fake `fetch` 和测试 session，不访问真实 BPMT 实例，不读取 `.codex/project-record.local.md`。
- 测试中出现的 `client-secret`、`code-1`、`token-1` 均为占位测试值，不是真实 OAuth 密钥、授权码或访问令牌。
- 本归档不包含真实 client secret、BPMT API app secret、授权码、访问令牌、数据库密码或本机专用凭据。

## Task 6 审查后修复

代码质量审查发现 OAuth 登录成功后直接把匿名 session 升级为登录 session，未重新生成 session，存在 session fixation 风险。本次修复保持原 OAuth state 校验、token 换取和 userinfo 获取语义不变，在 userinfo 成功后、写入本地用户会话前调用 `req.session.regenerate(...)`。如果 state 校验、token 换取、userinfo 获取或 session regenerate 任一步失败，都不会写入已登录用户 session。

补充修改文件：

- `src/auth/routes.js`
- `test/oauth.test.js`
- `docs/codex/prompts/2026-05-04-03-message-registry-implementation.md`

补充验证命令：

```bash
npm test -- test/oauth.test.js
npm test
git status --short --branch
```

补充 TDD 验证结果：

```text
npm test -- test/oauth.test.js
# RED: callback 成功路径新增断言失败，regenerate 调用次数为 0

npm test -- test/oauth.test.js
# GREEN: tests 9
# pass 9

npm test
# tests 49
# pass 49
```

补充结果摘要：

- 已新增路由内 `regenerateSession(req)` Promise 包装，避免在 `saveUserSession(req, userInfo)` 前复用旧匿名 SID。
- 已补充 callback 成功路径测试，使用中间件包装 `req.session.regenerate`，断言登录成功时 regenerate 被调用 1 次，且 callback 完成后仍能读取本地用户 session。
- 已确认 `saveUserSession` 仍只保存 `userid`、`name`、`group`、`role`，不保存 BPMT `access_token`。
- 本次修复不包含真实密钥、授权码、访问令牌、密码或数据库凭据。
