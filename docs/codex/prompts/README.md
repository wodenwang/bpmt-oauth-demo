# Codex 提示词归档

本目录用于保存构建 `bpmt-oauth-demo` 项目过程中使用过的提示词和执行记录。

本项目的目标不只是交付一个可运行的 demo，也要沉淀一份清晰的参考资料，方便后续用户理解如何将第三方应用接入 `bpmt-lite` OAuth 登录。

## 规则

- 每份提示词记录都应自包含。
- 明确写出任务目标和相关环境假设。
- 记录验证步骤和验证结果。
- 密钥统一使用占位符。
- 不要提交 `client_secret`、`BPMT_API_APP_SECRET`、access token、授权码、密码或数据库凭据。
- 本项目文档默认使用中文；技术标识、命令、URL、端点、参数名和代码片段可以保留英文原文。

## 建议文件命名

使用按时间排序的文件名：

- `YYYY-MM-DD-01-initialize-codex-project.md`
- `YYYY-MM-DD-02-scaffold-demo-app.md`
- `YYYY-MM-DD-03-oauth-login-flow.md`
- `YYYY-MM-DD-04-local-verification.md`

## 可复用提示词套件

- [BPMT OAuth Agent 初始化提示词套件](../bpmt-oauth-agent-prompt-kit.md)：面向第三方系统开发者，用于在空白项目中生成 `AGENTS.md`、`CLAUDE.md` 或团队约定的 `AGENT.md`，并约束后续开发只使用 BPMT OAuth 授权码流程。
