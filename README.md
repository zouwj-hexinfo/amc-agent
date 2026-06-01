# AMC Agent

AMC 多 Agent 协作评估工作台，前端使用 React + Vite，后端使用 Bun + Hono。主流程通过 Hermes Agent API 创建真实异步 run，并通过 SSE 回放分析事件、生成报告和写入项目成果目录。

## Run Locally

**Prerequisites:** Bun 1.x

1. 安装依赖：
   `bun install`
2. 配置 Hermes Agent API：
   `HERMES_AGENT_API_URL`、`HERMES_AGENT_API_KEY`、`HERMES_AGENT_MODEL=deepseek-v4-flash`
3. 启动开发环境：
   `bun run dev`

默认 API 端口为 `3100`，Vite 前端会将 `/api` 代理到 `http://localhost:3100`。
