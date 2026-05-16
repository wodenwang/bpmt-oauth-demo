# 2026-05-16 01 BPMT OAuth Agent 初始化提示词套件

## 用户目标

为需要使用 BPMT OAuth 鉴权的第三方系统开发者编写一套规范提示词。使用场景是：开发者创建新的空白项目后，通过 Codex 或 Claude Code 初始化项目，并让工具生成或写入 `AGENTS.md` / `CLAUDE.md` / `AGENT.md`，后续开发时不再反复关注 BPMT 组织用户体系和登录细节。

## Codex 任务提示词

请编写一套面向第三方系统开发者的 BPMT OAuth 接入提示词。

背景：
- BPMT 已经配置了一个独立第三方系统。
- 关键配置包括 `client_id`、`client_secret` 和 `callback url`。
- 上游 OAuth 文档地址是 `https://github.com/wodenwang/bpmt-doc/tree/main/docs/11.OAuth%E7%AC%AC%E4%B8%89%E6%96%B9%E7%99%BB%E5%BD%95`。
- 提示词应帮助开发者在空白项目中生成 `AGENTS.md`、`CLAUDE.md` 或团队约定的 `AGENT.md`，并让后续 AI 编码遵守 BPMT OAuth 授权码流程。

要求：
- 文档使用中文。
- 技术标识、端点、参数名和 URL 保留原文。
- 真实密钥使用占位符，不进入 Git 跟踪文件。
- 不发明 OIDC、refresh token、密码模式、自定义 BPMT OAuth 端点或独立账号密码登录。
- 明确第三方系统应建立自己的本地 session，BPMT 用户信息来自 `/oauth/userinfo`。

## 环境假设

- 本仓库已有 `AGENTS.md`，要求文档默认中文、密钥不得进入 Git、提示词归档放在 `docs/codex/prompts/`。
- 上游 BPMT OAuth 文档说明的主流程是 `/oauth/authorize` -> `/oauth/token` -> `/oauth/userinfo`。
- 第三方系统只需要维护自己的业务 session 和业务数据，不应重新实现 BPMT 账号体系。

## 修改文件

- `README.md`
- `docs/codex/bpmt-oauth-agent-prompt-kit.md`
- `docs/codex/prompts/README.md`
- `docs/codex/prompts/2026-05-16-01-bpmt-oauth-agent-prompt-kit.md`

## 验证命令

```bash
git diff --check
rg -n "client_secret|access_token|BPMT_OAUTH_CLIENT_SECRET|<BPMT_OAUTH_CLIENT_SECRET>|<替换为|<client_id>|<callback" README.md docs/codex/bpmt-oauth-agent-prompt-kit.md docs/codex/prompts/README.md docs/codex/prompts/2026-05-16-01-bpmt-oauth-agent-prompt-kit.md
```

## 结果摘要

- 新增 `docs/codex/bpmt-oauth-agent-prompt-kit.md`，提供从空白项目初始化 `AGENTS.md` / `CLAUDE.md` 的完整提示词。
- 提示词套件覆盖项目骨架、OAuth 登录入口、callback、`/oauth/token`、`/oauth/userinfo`、本地 session、业务页面保护、退出和真实联调。
- README 和提示词归档 README 已增加入口链接。
- 文档只使用占位符描述 `client_secret`，没有写入真实密钥。

## 已知限制

- 本次只编写提示词和文档，不修改 demo 运行时代码。
- 真实联调仍需要第三方系统开发者在自己的未提交配置中填入真实 `client_secret`，并确保 `callback url` 与 BPMT 后台配置精确一致。
