import type { AgentDomain, AgentRole, AgentType, AgentWorkItem, AMCProject, InstructionIntentResult, OrchestratorMode } from '../src/types';

type IntentPromptInput = {
  project: AMCProject;
  userInstruction: string;
  mode: OrchestratorMode;
  domain?: AgentDomain | null;
  role?: AgentRole | null;
  workItem?: AgentWorkItem | null;
  candidateRoles?: AgentRole[];
  candidateWorkItems?: AgentWorkItem[];
  clarificationContext?: InstructionClarificationContext | null;
};

export type InstructionClarificationContext = {
  eventId?: string;
  originalInstruction?: string;
  assistantQuestion?: string;
  previousSummary?: string;
};

const allowedDecisions = new Set(['start_evaluation', 'ask_clarification', 'reply_only']);
const allowedAgentTypes = new Set(['law_review', 'risk_review', 'evaluation', 'industry', 'orchestrator']);
const allowedModes = new Set(['single', 'chain', 'discuss', 'master-slave']);

export function buildInstructionIntentPrompt(input: IntentPromptInput) {
  const businessFields = input.project.businessFields
    ? Object.entries(input.project.businessFields).map(([key, value]) => `${key}: ${String(value)}`).join('\n')
    : '无';
  const roleById = new Map((input.candidateRoles || []).map(role => [role.id, role]));
  const candidateWorkItems = (input.candidateWorkItems || []).map(item => {
    const role = roleById.get(item.roleId);
    return [
      `- 工作项ID：${item.id}`,
      `  名称：${item.name}`,
      `  岗位专家ID：${item.roleId}`,
      role ? `  岗位专家：${role.name}（${role.agentType}）` : '',
      item.description ? `  说明：${item.description}` : '',
      item.definition?.workSteps?.length ? `  工作定义：${item.definition.workSteps.join('；')}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n');

  return [
    '你是 AMC 工作台的智能规划前置助手。你的任务是先理解用户指令，再决定是否启动正式评估。',
    '只输出一个 JSON 对象，不要输出 Markdown、代码块、解释或寒暄。',
    '',
    '可选 decision：',
    '- start_evaluation：用户意图是启动/继续一项 AMC 评估，且信息足够。',
    '- ask_clarification：用户意图可能是评估，但缺少会影响任务方向的关键信息，需要先反问。',
    '- reply_only：用户只是在咨询、解释、闲聊、要求说明功能，或明显不是要创建评估报告。',
    '',
    'JSON 字段要求：',
    '{',
    '  "decision": "start_evaluation | ask_clarification | reply_only",',
    '  "summary": "一句话概括你理解的意图",',
    '  "normalizedInstruction": "如果启动评估，应传给正式评估 Agent 的完整指令；否则可为空字符串",',
    '  "reply": "给用户看的简短回复；启动评估时说明将如何调度",',
    '  "clarificationQuestion": "仅 ask_clarification 时填写一个明确问题",',
    '  "rationale": "简短说明判断依据",',
    '  "confidence": 0.0,',
    '  "missingInfo": ["缺失信息1"],',
    '  "recommendedMode": "discuss",',
    '  "recommendedAgentType": "orchestrator",',
    '  "recommendedRoleId": "start_evaluation 时必须填写候选岗位专家ID",',
    '  "recommendedWorkItemId": "start_evaluation 时必须填写候选工作项ID"',
    '}',
    '',
    '约束：',
    '- 当前只在“智能规划”模式调用你；recommendedMode 默认保持 discuss。',
    '- start_evaluation 时必须从候选工作项中选择一个最匹配的 recommendedWorkItemId，并填写对应 recommendedRoleId。',
    '- 如果无法从候选工作项中明确选择一个工作项，应 ask_clarification，询问用户审查重点或工作项方向。',
    '- 不要替用户编造项目事实；缺失事实影响判断时应 ask_clarification。',
    '- 如果用户问“这个按钮怎么用”“解释一下报告”等咨询问题，应 reply_only。',
    '- 如果用户指令为空或只有泛泛的“看看/分析一下”，但无法明确匹配工作项，应 ask_clarification。',
    '',
    '【当前项目】',
    `项目名称：${input.project.name}`,
    `客户名称：${input.project.customerName}`,
    `项目类型：${input.project.projectType}`,
    `债务主体：${input.project.debtorName}`,
    `债权金额：${input.project.totalDebt} 万元`,
    `抵质押物：${input.project.collateralType}`,
    `抵押物估值：${input.project.collateralEstValue} 万元`,
    `项目说明：${input.project.description}`,
    `业务字段：\n${businessFields}`,
    `资料数量：${input.project.files?.length || 0}`,
    '',
    '【当前规划上下文】',
    `规划机制：${input.mode}`,
    input.domain ? `产品领域：${input.domain.label}（${input.domain.code}）` : '产品领域：未指定',
    input.role ? `当前岗位专家：${input.role.name}；${input.role.role}` : '当前岗位专家：未指定',
    input.workItem ? `当前工作项：${input.workItem.name}${input.workItem.description ? `；${input.workItem.description}` : ''}` : '当前工作项：未指定',
    input.clarificationContext?.originalInstruction ? `上一轮原始指令：${input.clarificationContext.originalInstruction}` : '',
    input.clarificationContext?.assistantQuestion ? `上一轮反问：${input.clarificationContext.assistantQuestion}` : '',
    input.clarificationContext?.previousSummary ? `上一轮理解摘要：${input.clarificationContext.previousSummary}` : '',
    '',
    '【候选岗位专家】',
    (input.candidateRoles || []).length
      ? (input.candidateRoles || []).map(role => `- 岗位专家ID：${role.id}；名称：${role.name}；类型：${role.agentType}；职责：${role.role}`).join('\n')
      : '无可用岗位专家',
    '',
    '【候选工作项】',
    candidateWorkItems || '无可用工作项',
    '',
    '【用户本次输入】',
    input.userInstruction || '（用户未输入专项指令）',
  ].filter(Boolean).join('\n');
}

export function normalizeInstructionIntentWorkItemSelection(
  intent: InstructionIntentResult,
  input: { domain?: AgentDomain | null; roles: AgentRole[]; workItems: AgentWorkItem[] },
): InstructionIntentResult {
  if (intent.decision !== 'start_evaluation') return intent;

  const activeRoles = input.roles.filter(role => role.status !== 'inactive' && (!input.domain || role.domainId === input.domain.id));
  const activeWorkItems = input.workItems.filter(item => item.status !== 'inactive' && (!input.domain || item.domainId === input.domain.id));
  const roleById = new Map(activeRoles.map(role => [role.id, role]));
  const workItem = intent.recommendedWorkItemId
    ? activeWorkItems.find(item => item.id === intent.recommendedWorkItemId)
    : undefined;
  const role = intent.recommendedRoleId
    ? roleById.get(intent.recommendedRoleId)
    : workItem ? roleById.get(workItem.roleId) : undefined;

  if (!workItem || !role || workItem.roleId !== role.id) {
    return {
      ...intent,
      decision: 'ask_clarification',
      normalizedInstruction: '',
      reply: '请补充本次希望执行的审查重点或工作项方向，我会据此选择对应专家工作项后再启动评估。',
      clarificationQuestion: '本次希望重点执行哪个工作项方向？例如法务合规审查、估值测算复核、风险等级评定或行业周期研判。',
      rationale: [
        intent.rationale,
        !intent.recommendedWorkItemId ? 'Hermes 未返回明确推荐工作项。' : '',
        intent.recommendedWorkItemId && !workItem ? `推荐工作项 ${intent.recommendedWorkItemId} 不可用或不属于当前领域。` : '',
        intent.recommendedRoleId && !role ? `推荐岗位专家 ${intent.recommendedRoleId} 不可用或不属于当前领域。` : '',
        workItem && role && workItem.roleId !== role.id ? '推荐工作项与推荐岗位专家不匹配。' : '',
      ].filter(Boolean).join(' '),
      confidence: Math.min(intent.confidence, 0.6),
      missingInfo: Array.from(new Set([...intent.missingInfo, '明确工作项'])),
      recommendedRoleId: role?.id,
      recommendedWorkItemId: workItem?.id,
    };
  }

  return {
    ...intent,
    recommendedRoleId: role.id,
    recommendedWorkItemId: workItem.id,
    recommendedAgentType: role.agentType,
  };
}

export function parseInstructionIntentResponse(value: string): InstructionIntentResult {
  const jsonText = extractJsonObjectText(value);
  if (!jsonText) throw new Error('Hermes 意图解析未返回 JSON 对象');

  let payload: unknown;
  try {
    payload = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Hermes 意图解析 JSON 无效：${error instanceof Error ? error.message : String(error)}`);
  }

  if (!isRecord(payload)) throw new Error('Hermes 意图解析结果不是对象');
  const decision = stringValue(payload.decision);
  if (!decision || !allowedDecisions.has(decision)) throw new Error('Hermes 意图解析 decision 无效');

  const confidence = clampNumber(numberValue(payload.confidence, 0.65), 0, 1);
  const clarificationQuestion = stringValue(payload.clarificationQuestion) || undefined;
  const missingInfo = arrayStringValue(payload.missingInfo);
  const normalizedInstruction = stringValue(payload.normalizedInstruction) || '';
  const reply = stringValue(payload.reply) || defaultReplyForDecision(decision, clarificationQuestion);

  if (decision === 'ask_clarification' && !clarificationQuestion) {
    throw new Error('Hermes 意图解析缺少 clarificationQuestion');
  }
  if (decision === 'start_evaluation' && !normalizedInstruction.trim()) {
    throw new Error('Hermes 意图解析缺少 normalizedInstruction');
  }

  const recommendedMode = stringValue(payload.recommendedMode);
  const recommendedAgentType = stringValue(payload.recommendedAgentType);

  return {
    decision: decision as InstructionIntentResult['decision'],
    summary: stringValue(payload.summary) || '已完成指令意图理解。',
    normalizedInstruction,
    reply,
    clarificationQuestion,
    rationale: stringValue(payload.rationale) || '根据用户输入与项目上下文判断。',
    confidence,
    missingInfo,
    recommendedMode: recommendedMode && allowedModes.has(recommendedMode) ? recommendedMode as OrchestratorMode : 'discuss',
    recommendedAgentType: recommendedAgentType && allowedAgentTypes.has(recommendedAgentType) ? recommendedAgentType as AgentType : 'orchestrator',
    recommendedRoleId: stringValue(payload.recommendedRoleId) || undefined,
    recommendedWorkItemId: stringValue(payload.recommendedWorkItemId) || undefined,
  };
}

export function buildPlanningMechanismInstructions(
  mode: OrchestratorMode,
  intent?: InstructionIntentResult,
  runtime?: { role?: AgentRole | null; workItem?: AgentWorkItem | null },
) {
  const intentBlock = intent ? [
    '【前置意图理解】',
    `决策：${intent.decision}`,
    `理解摘要：${intent.summary}`,
    intent.normalizedInstruction ? `规范化指令：${intent.normalizedInstruction}` : '',
    `判断依据：${intent.rationale}`,
    `置信度：${intent.confidence}`,
    intent.recommendedRoleId ? `推荐岗位专家ID：${intent.recommendedRoleId}` : '',
    intent.recommendedWorkItemId ? `推荐工作项ID：${intent.recommendedWorkItemId}` : '',
  ].filter(Boolean).join('\n') : '';

  const modeBlock = (() => {
    if (mode === 'single') {
      return [
        '【规划机制：指定专家】',
        '用户已人工指定岗位专家和工作项；必须尊重该选择，不得自行改派为多专家会商。',
        runtime?.role ? `主责岗位专家：${runtime.role.name}` : '',
        runtime?.workItem ? `主责工作项：${runtime.workItem.name}` : '',
      ].filter(Boolean).join('\n');
    }
    if (mode === 'chain') {
      return [
        '【规划机制：顺序执行】',
        '必须按固定流程串行推进：法务合规审查 -> 项目评估/估值测算 -> 风险评估 -> 综合汇总。',
        '每一阶段应基于上一阶段结论继续，不要一开始并行启动全部角色。',
      ].join('\n');
    }
    if (mode === 'master-slave') {
      return [
        '【规划机制：中枢统括】',
        '由中枢编排器统筹任务，按必要性派发子任务，最终由中枢汇总关键结论。',
      ].join('\n');
    }
    return [
      '【规划机制：智能规划】',
      '必须基于前置意图理解结果自主选择必要专家和执行顺序；不要机械启动所有专家。',
      '如果用户指令聚焦法律、估值、风险或行业中的某一类，应优先调度相关专家，并说明调度理由。',
      runtime?.role ? `智能规划已确认主责岗位专家：${runtime.role.name}` : '',
      runtime?.workItem ? `智能规划已确认主责工作项：${runtime.workItem.name}` : '',
    ].join('\n');
  })();

  return [modeBlock, intentBlock].filter(Boolean).join('\n\n');
}

function extractJsonObjectText(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  if (candidate.startsWith('{') && candidate.endsWith('}')) return candidate;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) return candidate.slice(start, end + 1);
  return '';
}

function defaultReplyForDecision(decision: string, question?: string) {
  if (decision === 'ask_clarification') return question || '还需要补充一个关键信息。';
  if (decision === 'reply_only') return '我先回应这个问题，本次不启动正式评估。';
  return '已理解指令，将启动智能规划评估。';
}

function arrayStringValue(value: unknown) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean) : [];
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
