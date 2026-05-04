# 2026-05-04 04 README、提示词顺序和 Docker Compose Quick Start

## 用户目标

本项目的重点在于提示词。需要把完整的提示词撰写和提交顺序整理到 README 中，方便读者快速模拟本 demo 创建自己的 `bpmt-lite` OAuth 集成工程。

同时，需要封装 Docker 镜像运行方式，并通过 Docker Compose 参数快速运行单独的 demo 应用来对接已有 BPMT 环境，在 README 中补齐 Quick Start。

## Codex 任务提示词

```text
你正在收口 bpmt-oauth-demo 的 README、Docker Compose 和提示词复刻说明。

要求：
1. 优先遵守本仓库 AGENTS.md 和上游 bpmt-doc OAuth 第三方登录文档。
2. 不新增 OAuth 变体，不引入 OIDC、id_token、refresh token 或单点登出。
3. README 必须把 Docker Compose Quick Start 放到足够靠前的位置，让读者能复制环境文件、填参数、初始化表结构、启动应用并访问 http://localhost:81。
4. Docker Compose 只运行本 demo 应用和一次性 setup 命令，不内置 BPMT 或 MariaDB；BPMT 和 MariaDB 仍使用用户已有环境。
5. Compose 参数必须区分浏览器访问 BPMT 的 BPMT_BASE_URL 和容器内访问 BPMT 的 BPMT_SERVER_BASE_URL。
6. README 必须整理 Codex 提示词撰写原则和按阶段提交顺序，让读者能照着创建自己的 BPMT OAuth 集成工程。
7. 新增本次 docs/codex/prompts 归档，不写入真实 client_secret、BPMT_API_APP_SECRET、授权 code、access_token、数据库密码或本机专用凭据。
8. 最终运行 npm test、docker compose config 和 docker build 验证。
9. 完成后提交本地 Git 变更。
```

## 环境假设

- 工作目录：`/Users/wenzhewang/workspace/bpmt_project/bpmt-oauth-demo`
- 默认分支：`main`
- BPMT 浏览器基础地址：`http://localhost`
- demo 回调地址：`http://localhost:81/oauth/callback`
- Docker 容器访问宿主机 BPMT/API/MariaDB 的默认地址：`host.docker.internal`
- OAuth client id：`bpmt-oauth-demo`
- OAuth client secret：`<BPMT_OAUTH_CLIENT_SECRET>`
- BPMT API app key：`bpmt-api`
- BPMT API app secret：`<BPMT_API_APP_SECRET>`
- 数据库名：`bpmt`

## 修改文件

- `docker-compose.yml`
- `compose.env.example`
- `README.md`
- `docs/superpowers/plans/2026-05-04-readme-docker-compose.md`
- `docs/codex/prompts/2026-05-04-04-readme-docker-compose-quickstart.md`

## 验证命令

```bash
npm test
docker compose --env-file compose.env.example --profile setup config
docker build -t bpmt-oauth-demo:local .
rg -n '(^|[[:space:]])(client_secret|BPMT_API_APP_SECRET|BPMT_OAUTH_CLIENT_SECRET|access_token|授权码|密码|DB_PASSWORD)\s*[:=]\s*[^<\$\s]' README.md docker-compose.yml compose.env.example docs/codex/prompts/2026-05-04-04-readme-docker-compose-quickstart.md
git status --short --branch
```

## 结果摘要

- 已新增 `docker-compose.yml`，提供 `app` 服务和 `setup` profile。
- 已新增 `compose.env.example`，给 Docker Compose 用户提供更直接的参数模板。
- README Quick Start 以 Docker Compose 为推荐路径，强调回调地址必须精确匹配 `http://localhost:81/oauth/callback`。
- README 已补充 Codex 提示词撰写原则、统一提示词模板和建议提交顺序。
- Compose 运行方式只对接已有 BPMT 和 MariaDB，不在本仓库内启动 BPMT 或数据库。
- `npm test` 通过：65 个测试全部通过。
- `docker compose --env-file compose.env.example --profile setup config` 通过，并确认包含 `app`、`setup` 两个服务。
- `docker build -t bpmt-oauth-demo:local .` 通过。
- 敏感信息扫描未发现真实密钥或明文敏感值。

## 已知限制

- Docker Compose Quick Start 仍需要用户在 BPMT 后台预先登记 OAuth 客户端和第三方系统权限。
- `npm run setup` 需要 BPMT API 签名配置和 MariaDB 可访问；没有真实密钥时只能做配置或镜像构建验证。
- 本归档不包含真实密钥、授权码、访问令牌、数据库密码或本机专用凭据。
