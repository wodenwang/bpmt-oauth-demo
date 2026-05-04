# 2026-05-04 01 初始化 Codex 项目

## 用户目标

将本仓库初始化为 Codex 管理的 demo 项目，用于验证 `bpmt-lite` OAuth 第三方登录能力。

## Codex 任务提示词

```text
初始化codex项目：
本项目作为对接bpmt-lite的demo项目，主要验证bpmt-lite的oauth第三方鉴权登录的能力。
本项目完全遵照bpmt-lite的oauth集成流程，通过codex来实现。本demo最终需要保留完整、规范的codex提示词，以供后续用户查阅参考。

本项目的线上仓库是：https://github.com/wodenwang/bpmt-oauth-demo
参考的bpmt-lite第三方登录部分的文档：https://github.com/wodenwang/bpmt-doc/blob/main/docs/11.OAuth%E7%AC%AC%E4%B8%89%E6%96%B9%E7%99%BB%E5%BD%95/README.md
本机测试环境的bpmt实例是：http://localhost
本机mariadb数据库端口3306，用户名密码使用本机记录，dbname是bpmt；本项目可以直接使用此db。
本项目绑定的bpmt第三方应用信息是：
client id：bpmt-oauth-demo
client secret：<BPMT_OAUTH_CLIENT_SECRET>
配置的回调地址是http://localhost:81/oauth/callback

以上均为重要内容，请先初始化codex项目并写入项目永久记录。
```

## 环境假设

- 本地工作目录：`/Users/wenzhewang/workspace/bpmt_project/bpmt-oauth-demo`
- 线上仓库：`https://github.com/wodenwang/bpmt-oauth-demo`
- BPMT 基础地址：`http://localhost`
- 本地 BPMT OpenAPI 文档：`http://127.0.0.1/api/openapi.json`
- 本 demo 的 BPMT 回调地址：`http://localhost:81/oauth/callback`
- OAuth client id：`bpmt-oauth-demo`
- 本机密钥和数据库凭据保存在 `.codex/project-record.local.md`，不写入 Git 跟踪文件。
- BPMT API 签名配置：`BPMT_API_APP_KEY=bpmt-api`、`BPMT_API_APP_SECRET=<BPMT_API_APP_SECRET>`、`BPMT_API_ACT_AS=admin`。

## 上游 OAuth 流程摘要

本 demo 必须遵循 `bpmt-lite v1.5.0+` 的授权码登录流程：

1. 浏览器跳转到 BPMT `/oauth/authorize`。
2. 在 `/oauth/callback` 接收授权 `code`。
3. 通过 `POST /oauth/token` 使用 `code` 换取 token。
4. 通过 `GET /oauth/userinfo` 读取用户基础信息。
5. demo 应用建立自己的本地登录会话。

## 修改文件

- `AGENTS.md`
- `.gitignore`
- `.codex/project-record.local.md`
- `docs/codex/prompts/README.md`
- `docs/codex/prompts/2026-05-04-01-initialize-codex-project.md`

## 验证

执行：

```bash
git status --short --branch
rg -n "bpmt-oauth-demo|oauth/callback|project-record.local|提示词归档" AGENTS.md docs/codex/prompts
```

## 结果

仓库已具备 Codex 项目约定、被 Git 跟踪的提示词归档目录，以及保存密钥和本机测试凭据的本地专用记录。

## 2026-05-04 补充：BPMT API 调用信息

用户补充了本机 BPMT 接口文档和 API 签名信息：

```text
补充接口调用信息：
这是本地bpmt接口文档：http://127.0.0.1/api/openapi.json
API签名信息如下：
BPMT_API_APP_KEY=bpmt-api
BPMT_API_APP_SECRET=<BPMT_API_APP_SECRET>
BPMT_API_ACT_AS=admin

请补充合并到环境文档和提示词文档里面去。
```

处理规则：

- 被 Git 跟踪的文档记录 OpenAPI 地址、`BPMT_API_APP_KEY` 和 `BPMT_API_ACT_AS`。
- `BPMT_API_APP_SECRET` 在被 Git 跟踪的文档中使用占位符。
- 本机精确签名值保存在 `.codex/project-record.local.md`。
