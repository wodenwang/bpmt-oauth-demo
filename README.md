# bpmt-oauth-demo

`bpmt-oauth-demo` 是一个通过 Codex 构建的 `bpmt-lite` OAuth 第三方登录示例项目。它的重点不只是交付一个可运行 demo，也要保留完整、结构化的提示词过程，让读者能照着创建自己的 BPMT OAuth 集成工程。

本项目严格遵照 BPMT OAuth 授权码流程：

1. demo 把浏览器跳转到 BPMT `/oauth/authorize`。
2. BPMT 完成登录、校验 `client_id`、精确匹配 `redirect_uri` 并检查第三方系统权限。
3. BPMT 携带一次性 `code` 回跳 demo `/oauth/callback`。
4. demo 服务端调用 `/oauth/token` 换取 `access_token` 和 `userid`。
5. demo 服务端调用 `/oauth/userinfo` 读取 BPMT 用户信息。
6. demo 建立自己的本地 session，并展示登录后的留言登记页面。

当前登记回调地址必须精确保持为：

```text
http://localhost:81/oauth/callback
```

## Quick Start：Docker Compose 运行

这条路径适合读者最快体验本 demo。Compose 只运行 `bpmt-oauth-demo` 应用本身，不启动 BPMT 或 MariaDB；你需要已有可访问的 BPMT 环境和 `bpmt` 数据库。

前置条件：

- BPMT 已在本机或局域网运行，浏览器可访问 `http://localhost`。
- BPMT 后台已登记第三方系统，`client_id` 为 `bpmt-oauth-demo`。
- BPMT 后台登记的回调地址精确为 `http://localhost:81/oauth/callback`。
- 当前用户或角色已被分配第三方系统权限。
- 已准备 BPMT API app key/secret，用于 `npm run setup` 初始化 `DEMO_MESSAGE` 动态表。
- Docker 和 Docker Compose 可用。

本项目 `v1.0.0` 的正式部署入口是 `docker-compose.yml`。所有运行配置都集中在该文件中，不需要复制 `.env` 或 `compose.env.example`。

编辑 `docker-compose.yml`，至少替换这些占位符：

```yaml
SESSION_SECRET: "<DEMO_SESSION_SECRET>"
BPMT_OAUTH_CLIENT_SECRET: "<BPMT_OAUTH_CLIENT_SECRET>"
BPMT_API_APP_SECRET: "<BPMT_API_APP_SECRET>"
DB_USER: "<DB_USER>"
DB_PASSWORD: "<DB_PASSWORD>"
```

如果 BPMT、OpenAPI 和 MariaDB 都运行在宿主机，通常保持以下值：

```yaml
BPMT_BASE_URL: "http://localhost"
BPMT_SERVER_BASE_URL: "http://host.docker.internal"
BPMT_API_BASE_URL: "http://host.docker.internal/api"
DB_HOST: "host.docker.internal"
ports:
  - "81:81"
```

应用容器内部端口使用镜像默认值；Compose 只负责把宿主机 `81` 映射到容器 `81`。

先初始化 demo 需要的 BPMT 动态表：

```bash
docker compose run --rm setup
```

启动应用：

```bash
docker compose up -d app
```

打开 demo：

```text
http://localhost:81
```

停止应用：

```bash
docker compose down
```

如果你的 BPMT 或 MariaDB 不在宿主机，请直接在 `docker-compose.yml` 中调整：

| 配置 | 说明 |
| --- | --- |
| `BPMT_BASE_URL` | 浏览器访问 BPMT 的外部地址，用于生成 `/oauth/authorize` 跳转地址。 |
| `BPMT_SERVER_BASE_URL` | demo 容器内访问 BPMT `/oauth/token` 和 `/oauth/userinfo` 的地址。 |
| `BPMT_API_BASE_URL` | demo 容器内访问 BPMT OpenAPI 的地址，默认形如 `http://host.docker.internal/api`。 |
| `DB_HOST` | demo 容器内访问 MariaDB 的主机名。 |
| `ports: "81:81"` | 宿主机暴露端口。正式回调地址固定使用 `81`，除非你也同步修改 BPMT 后台登记的回调地址。 |

发布镜像为多架构镜像，支持 x86 和 ARM：

```text
ghcr.io/wodenwang/bpmt-oauth-demo:v1.0.0
ghcr.io/wodenwang/bpmt-oauth-demo:latest
```

Compose 会自动按运行主机拉取匹配架构，当前发布目标是 `linux/amd64` 和 `linux/arm64`。

如果拉取镜像时出现 `unauthorized`，请先在 GitHub Packages 中把 `bpmt-oauth-demo` container package 的 visibility 设置为 Public。

## 用 Codex 复刻本项目

读者创建自己的 BPMT OAuth 集成工程时，建议先把提示词写清楚，再让 Codex 分阶段实现。每一轮提示词都应包含：

- **目标**：这一轮只完成什么，不做什么。
- **依据**：优先查阅本仓库 `AGENTS.md`、上游 OAuth 文档、运行中的 BPMT 和已有实现。
- **边界**：只使用 OAuth2 Authorization Code，不引入 OIDC、`id_token`、refresh token 或单点登出。
- **环境**：BPMT 地址、回调地址、数据库名、端口、OpenAPI 地址和必要占位符。
- **交付物**：明确要新增或修改的文件。
- **验证命令**：写清每轮必须运行的测试、构建或浏览器验证。
- **安全规则**：真实密钥只放本机 `.env` 或未跟踪文件，Git 文档只写占位符。
- **归档要求**：每次有意义的实现或验证，都在 `docs/codex/prompts/` 新增记录。

可复用提示词模板：

```text
你正在为 bpmt-lite 创建一个 OAuth 第三方登录 demo。

目标：
1. 本轮只完成 <阶段名称>。
2. 严格遵守 BPMT OAuth 授权码流程：/oauth/authorize -> /oauth/token -> /oauth/userinfo。
3. 不实现 OIDC、id_token、refresh token、密码模式或跨系统单点登出。

环境：
- BPMT 基础地址：http://localhost
- demo 回调地址：http://localhost:81/oauth/callback
- OAuth client_id：bpmt-oauth-demo
- OAuth client_secret：<BPMT_OAUTH_CLIENT_SECRET>
- BPMT API app key：bpmt-api
- BPMT API app secret：<BPMT_API_APP_SECRET>
- 数据库：bpmt

交付：
- 新增或修改：<文件列表>
- 测试或验证：<命令列表>
- 提示词归档：docs/codex/prompts/YYYY-MM-DD-NN-<name>.md

安全：
- 不把 client_secret、BPMT_API_APP_SECRET、授权 code、access_token、密码或数据库凭据写入浏览器代码、公开文档、Git 提交或日志。
- 文档中统一使用占位符。
```

建议按这个顺序向 Codex 提交提示词：

| 顺序 | 阶段 | 本轮提示词重点 | 典型验证 |
| --- | --- | --- | --- |
| 1 | 项目初始化 | 创建 `AGENTS.md`、提示词归档目录、基础 README，写明 OAuth 边界和安全规则。 | `git status --short --branch` |
| 2 | 方案设计 | 让 Codex 阅读上游 OAuth 文档，输出只基于授权码流程的实现计划。 | 人工确认文档不含 OIDC/refresh token |
| 3 | Node 项目骨架 | 建立 `package.json`、配置加载、`.env.example` 和配置单元测试。 | `npm test -- test/config.test.js` |
| 4 | BPMT API 签名 | 实现 BPMT OpenAPI 签名、canonical string 和动态表定义。 | `npm test -- test/bpmt-signature.test.js test/table-definition.test.js` |
| 5 | setup 初始化 | 实现 `npm run setup`，创建或同步 `DEMO_MESSAGE` 动态表。 | `npm test -- test/bpmt-api.test.js`，真实环境可跑 `npm run setup` |
| 6 | 数据访问 | 实现留言 repository/service，创建人以服务端 OAuth `userid` 为准。 | `npm test -- test/message-*.test.js` |
| 7 | OAuth 登录 | 实现授权跳转、state 校验、callback、token 换取、userinfo 和本地 session。 | `npm test -- test/oauth.test.js` |
| 8 | 页面和路由 | 实现 EJS 页面、留言 CRUD、错误页和基础样式。 | `npm test`，浏览器打开 `http://localhost:81` |
| 9 | Docker 封装 | 新增 Dockerfile、Compose、Compose 参数示例和 Quick Start。 | `docker compose --profile setup config`，`docker build -t bpmt-oauth-demo:local .` |
| 10 | 真实联调 | 用本机 BPMT 完整走登录、留言新增、查看、编辑、删除和退出。 | 浏览器验证，必要时检查 BPMT/MariaDB 日志 |
| 11 | 提交收口 | 更新 README 和 `docs/codex/prompts/`，确认无敏感信息后提交。 | `npm test`，敏感信息扫描，`git diff --check` |

每一轮提示词归档建议使用下面结构：

```markdown
# YYYY-MM-DD NN 阶段名称

## 用户目标

## Codex 任务提示词

## 环境假设

## 修改文件

## 验证命令

## 结果摘要

## 已知限制
```

本仓库已经把这些历史记录保存在 `docs/codex/prompts/`，其中 `2026-05-04-03-message-registry-implementation.md` 是滚动实现记录，适合当作更完整的复刻样例。

## 功能

- BPMT OAuth 授权码登录入口和回调处理。
- demo 本地 session，不把 BPMT `access_token` 当作永久会话。
- 登录后展示 BPMT 返回的 `userid`、姓名、组织和角色基础信息。
- 留言登记列表、查询、新增、查看、编辑、删除和批量删除。
- 新增留言的创建人由服务端写入当前 BPMT `userid`，浏览器提交的创建人字段不会作为可信来源。
- 修改和删除只允许留言创建人执行。
- `npm run setup` 初始化 BPMT 动态表 `DEMO_MESSAGE` 并执行 DDL 同步。

## 不包含的能力

- 系统不维护 BPMT 用户密码，也不提供独立用户密码登录。
- 退出按钮只退出 demo 本地 session，不承诺退出 BPMT 登录态。
- 不实现 OIDC、`id_token`、refresh token 或跨系统单点登出。
- 不自定义 BPMT OAuth 端点，不扩展官方流程之外的授权模式。

## 环境变量

本地 Node 运行可从 `.env.example` 开始。`v1.0.0` 正式 Docker Compose 部署以 `docker-compose.yml` 为唯一配置入口。密钥请只写入本机运行配置，不要提交到 Git。

```bash
cp .env.example .env
```

| 变量 | 说明 |
| --- | --- |
| `NODE_ENV` | 运行环境，本地开发通常为 `development`，Docker Compose 默认 `production`。 |
| `PORT` | demo 容器内监听端口，本地 Node 运行默认 `81`；正式 Compose 部署使用镜像默认值，不需要配置该变量。 |
| `SESSION_SECRET` | demo 本地 session 签名密钥，使用本机私有值。 |
| `BPMT_BASE_URL` | 浏览器访问 BPMT 的外部基础地址，本机默认 `http://localhost`。 |
| `BPMT_SERVER_BASE_URL` | 可选，demo 服务端访问 BPMT token/userinfo 的内部地址；不填时默认等于 `BPMT_BASE_URL`。 |
| `BPMT_OAUTH_CLIENT_ID` | BPMT 登记的 OAuth 客户端标识，默认 `bpmt-oauth-demo`。 |
| `BPMT_OAUTH_CLIENT_SECRET` | BPMT 生成的 OAuth 客户端密钥，使用 `<BPMT_OAUTH_CLIENT_SECRET>` 占位符替换。 |
| `BPMT_OAUTH_REDIRECT_URI` | 必须与 BPMT 后台登记值精确一致，默认 `http://localhost:81/oauth/callback`。 |
| `BPMT_API_BASE_URL` | BPMT OpenAPI 基础地址，本机 Node 运行默认 `http://127.0.0.1/api`，Compose 常用 `http://host.docker.internal/api`。 |
| `BPMT_API_APP_KEY` | BPMT API app key，默认 `bpmt-api`。 |
| `BPMT_API_APP_SECRET` | BPMT API app secret，使用 `<BPMT_API_APP_SECRET>` 占位符替换。 |
| `DB_HOST` | MariaDB 主机，本机 Node 运行通常为 `localhost`，Compose 常用 `host.docker.internal`。 |
| `DB_PORT` | MariaDB 端口，默认 `3306`。 |
| `DB_USER` | MariaDB 用户。 |
| `DB_PASSWORD` | MariaDB 密码，使用本机私有值。 |
| `DB_NAME` | MariaDB 数据库名，默认 `bpmt`。 |

`.env.example`、`compose.env.example` 和公开文档只包含占位符，不包含真实 `client_secret`、`BPMT_API_APP_SECRET`、授权码、访问令牌、密码或数据库凭据。

## 初始化表结构

初始化命令会读取服务端环境变量，使用 BPMT API 签名调用 OpenAPI 创建 `DEMO_MESSAGE` 动态表。如果表已存在，脚本会读取当前动态表定义；定义一致时直接执行 DDL 同步，定义不一致时先通过 BPMT API 更新动态表定义，再执行 DDL 同步。

本地 Node 运行：

```bash
npm run setup
```

Docker Compose 运行：

```bash
docker compose run --rm setup
```

初始化前请确认：

- BPMT 服务可访问。
- `BPMT_API_APP_KEY` 和 `BPMT_API_APP_SECRET` 已配置。
- MariaDB 中可访问 `bpmt` 数据库。
- OAuth 客户端已在 BPMT 后台登记，回调地址精确为 `http://localhost:81/oauth/callback`。

`DEMO_MESSAGE` 字段命名统一使用 `DEMO_` 前缀：

| 字段 | 说明 |
| --- | --- |
| `DEMO_ID` | 主键，服务端生成 UUID。 |
| `DEMO_TITLE` | 留言标题。 |
| `DEMO_CONTENT` | 留言内容。 |
| `DEMO_CREATOR_USERID` | 创建人，取当前 BPMT OAuth 登录态的 `userid`。 |
| `DEMO_CREATE_TIME` | 创建时间。 |
| `DEMO_UPDATE_TIME` | 更新时间。 |

## 本地 Node 运行

安装依赖：

```bash
npm install
```

复制并填写本机配置：

```bash
cp .env.example .env
```

初始化表结构：

```bash
npm run setup
```

启动应用：

```bash
npm start
```

打开：

```text
http://localhost:81
```

开发时可使用：

```bash
npm run dev
```

## Docker 镜像

正式发布镜像：

```text
ghcr.io/wodenwang/bpmt-oauth-demo:v1.0.0
ghcr.io/wodenwang/bpmt-oauth-demo:latest
```

镜像支持：

- `linux/amd64`
- `linux/arm64`

GHCR package visibility 由维护者在 GitHub Packages 页面设置为 Public；设置完成后可未登录拉取。

本地单架构构建镜像：

```bash
docker build -t bpmt-oauth-demo:local .
```

使用 `.env` 直接运行容器：

```bash
docker run --rm --name bpmt-oauth-demo \
  --env-file .env \
  -p 81:81 \
  bpmt-oauth-demo:local
```

Docker Compose 是推荐运行方式，因为 `docker-compose.yml` 已经把容器访问宿主机服务的默认值配置为 `host.docker.internal`，并提供了一次性 `setup` profile。

## 安全提醒

- 不要把 `client_secret`、`BPMT_API_APP_SECRET`、授权 `code`、`access_token`、密码或数据库凭据写入前端代码、公开文档、Git 提交或日志。
- `client_secret`、`BPMT_API_APP_SECRET` 和数据库密码只能放在服务端环境变量中。
- BPMT OAuth 授权码只能一次性使用，不要刷新旧回调页反复提交。
- demo 只保存自己的本地 session，session 中不保存 BPMT `access_token`。
- 日志中的配置输出必须保持脱敏。

## 验证

运行自动化测试：

```bash
npm test
```

检查 Compose 配置：

```bash
docker compose --profile setup config
```

构建 Docker 镜像：

```bash
docker build -t bpmt-oauth-demo:local .
```

检查发布镜像多架构 manifest：

```bash
docker buildx imagetools inspect ghcr.io/wodenwang/bpmt-oauth-demo:v1.0.0
```

检查工作区：

```bash
git status --short --branch
```
