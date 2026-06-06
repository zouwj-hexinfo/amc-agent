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


## 实现约定
- 保持当前界面操作逻辑稳定，除非用户明确要求重做布局。
