# AMC Agent 项目协作规范

## 技术栈与运行
- 前端使用 React 19 + Vite 6 + Tailwind CSS v4 + Lucide React。
- 后端使用 Bun + Hono，API 默认端口 `3100`，Vite 通过 `/api` 代理到后端。
- 主流程以 Hermes Agent API 为真实分析来源；不要重新引入 Gemini，也不要为主流程恢复本地模拟报告 fallback。

## 交互与 UI 规范
- 禁止使用浏览器原生 `alert()`、`confirm()`、`prompt()` 作为业务交互。
- 删除、恢复、重置、停用等需要确认的操作，统一使用页面元素模拟的确认模态框，当前复用 `src/components/ConfirmDialog.tsx`。
- 确认模态应包含明确标题、影响说明、取消按钮和动作按钮；危险操作使用红色动作按钮。
- AMC 智能体配置主数据的新增、编辑操作统一在右侧抽屉完成，不使用弹窗输入框或浏览器 prompt。
- 产品领域、岗位专家、工作组、工作项的操作按钮风格保持一致：小尺寸图标按钮，编辑用 `Edit3`，新增用 `PlusCircle`，删除用 `Trash2`。

## 数据与主流程
- 智能体配置主数据包括产品领域、岗位专家、工作组、工作项和智能体定义，应通过 `/api/agent-config/*` 持久化到 SQLite。
- 下达分析指令时，应把相关领域、岗位、工作项和 skills 传入后端，并由后端拼入 Hermes run input/instructions。
- `analysis` 事件流是主流程状态来源；完成报告应通过 `analysis.completed` 写入项目成果目录。
- 段落微调调用 Hermes Agent API，不使用本地规则化修订器。

## 实现约定
- 新增或修改前端交互后，至少运行 `bun run lint`；涉及打包路径或后端入口时运行 `bun run build`。
- 保持当前界面操作逻辑稳定，除非用户明确要求重做布局。
