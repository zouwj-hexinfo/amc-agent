import type { AnalysisEvent } from '../src/hermes/types';
import { readMinioReportMarkdown } from './minio-assets';

type ChatRole = 'system' | 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type HermesChatInput = {
  prompt: string;
  sessionId?: string;
  conversationTitle?: string;
  conversationHistory?: Array<{ role: ChatRole; content: string }>;
};

export type HermesRunInput = {
  input: string;
  sessionId?: string;
  instructions?: string;
  conversationHistory?: Array<{ role: ChatRole; content: string }>;
  previousResponseId?: string;
};

type HermesChatResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

export type HermesRunStatus =
  | 'queued'
  | 'in_progress'
  | 'running'
  | 'requires_action'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | string;

export type HermesRun = {
  run_id: string;
  status: HermesRunStatus;
  output?: unknown;
  last_event?: unknown;
  [key: string]: unknown;
};

const defaultHermesBaseUrl = 'http://172.18.21.56:8642';
const defaultHermesModel = 'deepseek-v4-flash';
const supportedHermesModels = new Set(['deepseek-v4-pro', 'deepseek-v4-flash']);

export function hermesBaseUrl() {
  return (process.env.HERMES_AGENT_API_URL || defaultHermesBaseUrl).replace(/\/+$/, '');
}

export function hermesModel() {
  const configuredModel = process.env.HERMES_AGENT_MODEL?.trim();
  return configuredModel && supportedHermesModels.has(configuredModel)
    ? configuredModel
    : defaultHermesModel;
}

function hermesHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(process.env.HERMES_AGENT_API_KEY ? { Authorization: `Bearer ${process.env.HERMES_AGENT_API_KEY}` } : {}),
  };
}

export function hermesAutoApproveToolsEnabled() {
  return process.env.HERMES_AGENT_AUTO_APPROVE_TOOLS === '1';
}

export function buildAmcEvaluationRunInstructions() {
  return [
    '你正在驱动一个 AMC 不良资产多 Agent 协作评估工作台，请真实处理用户的评估请求。',
    '默认模型为 deepseek-v4-flash；如需更高质量可切换 deepseek-v4-pro，但不要在输出中暴露模型内部实现。',
    '请围绕法律审查、风险评估、估值审核、行业分析和综合编排五类角色组织过程。',
    '可以使用 Hermes delegate_task 拆分子任务，但不要机械并发；先完成资产收取和资料核验，再进入四维专家审查，最后由编排器生成报告。',
    '法律审查专家关注抵押登记、首封顺位、轮候查封、工程款优先权、债权转让通知和国资处置流程。',
    '估值审核专家关注市场法、收益法、清算折扣、空置损耗、司法处置周期、LTV 和预期回收率。',
    '风险评估专家关注债务人信用、保证担保可执行性、市场流动性、退出触发条件和风险缓释措施。',
    '行业分析专家关注底层行业周期、区域供需、资产流动性和可落地处置路径。',
    '最终输出应为中文 Markdown AMC 评估报告，包含项目概览、法律、风险、估值、行业、综合评级和处置建议。',
    '如果生成报告或图片上传到 MinIO，只在正文中使用 s3://xfas/reports/... 或 s3://xfas/images/...，不要暴露 endpoint、AccessKey、SecretKey 或临时下载链接。',
    '如果工具、外部资源或浏览器操作需要用户授权，请通过进度事件发出 requires_action/approval.required，而不是静默等待。',
  ].join('\n');
}

export async function askHermes(input: HermesChatInput) {
  const history = (input.conversationHistory ?? [])
    .filter(message => (message.role === 'user' || message.role === 'assistant') && message.content.trim())
    .slice(-12);

  const url = `${hermesBaseUrl()}/v1/chat/completions`;
  const payload = {
    model: hermesModel(),
    stream: false,
    ...(input.sessionId ? { session_id: input.sessionId } : {}),
    ...(input.conversationTitle ? { title: input.conversationTitle } : {}),
    messages: [
      {
        role: 'system',
        content: '你是 AMC 不良资产协作评估助手。回答保持专业、简洁，明确区分事实、推断和待核查事项。',
      },
      ...history,
      { role: 'user', content: input.prompt },
    ] satisfies ChatMessage[],
  };
  const startedAt = Date.now();
  logHermesDebug('request', {
    operation: 'chat',
    method: 'POST',
    url,
    model: payload.model,
    sessionId: input.sessionId,
    conversationTitle: input.conversationTitle,
    historyCount: history.length,
    promptLength: input.prompt.length,
    promptExcerpt: excerptForHermesLog(input.prompt, hermesDebugFullTextEnabled() ? 4000 : 700),
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: hermesHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await parseHermesResponse<HermesChatResponse>(response, 'Hermes chat');
    const content = data.choices?.[0]?.message?.content;
    logHermesDebug('response', {
      operation: 'chat',
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      choiceCount: data.choices?.length ?? 0,
      outputLength: typeof content === 'string' ? content.length : 0,
      outputExcerpt: typeof content === 'string'
        ? excerptForHermesLog(content, hermesDebugFullTextEnabled() ? 4000 : 1000)
        : undefined,
    });
    if (typeof content === 'string' && content.trim()) return content.trim();
    throw new Error('Hermes response did not include assistant text');
  } catch (error) {
    logHermesDebug('failed', {
      operation: 'chat',
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function createHermesRun(input: HermesRunInput) {
  const url = `${hermesBaseUrl()}/v1/runs`;
  const payload = withoutUndefined({
    model: hermesModel(),
    input: input.input,
    session_id: input.sessionId,
    instructions: input.instructions,
    conversation_history: input.conversationHistory,
    previous_response_id: input.previousResponseId,
  });
  const startedAt = Date.now();
  logHermesDebug('request', {
    operation: 'run.create',
    method: 'POST',
    url,
    model: payload.model,
    sessionId: input.sessionId,
    inputLength: input.input.length,
    inputExcerpt: excerptForHermesLog(input.input, hermesDebugFullTextEnabled() ? 4000 : 700),
    instructionsLength: input.instructions?.length ?? 0,
    instructionsExcerpt: input.instructions
      ? excerptForHermesLog(input.instructions, hermesDebugFullTextEnabled() ? 4000 : 500)
      : undefined,
    historyCount: input.conversationHistory?.length ?? 0,
    previousResponseId: input.previousResponseId,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: hermesHeaders(),
      body: JSON.stringify(payload),
    });

    const run = await parseHermesResponse<HermesRun>(response, 'Hermes run creation');
    logHermesDebug('response', {
      operation: 'run.create',
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      runId: run.run_id,
      runStatus: run.status,
      outputSummary: summarizeUnknownForHermesLog(run.output),
    });
    return run;
  } catch (error) {
    logHermesDebug('failed', {
      operation: 'run.create',
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getHermesRun(runId: string) {
  const url = `${hermesBaseUrl()}/v1/runs/${encodeURIComponent(runId)}`;
  return await hermesRunRequest('run.lookup', url, 'GET', runId);
}

export async function stopHermesRun(runId: string) {
  const url = `${hermesBaseUrl()}/v1/runs/${encodeURIComponent(runId)}/stop`;
  return await hermesRunRequest('run.stop', url, 'POST', runId);
}

export async function approveHermesRunAction(runId: string, reason?: string) {
  const endpoint = (process.env.HERMES_AGENT_APPROVAL_ENDPOINT || '/v1/runs/{runId}/approve')
    .replace('{runId}', encodeURIComponent(runId));
  const url = endpoint.startsWith('http') ? endpoint : `${hermesBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = process.env.HERMES_AGENT_APPROVAL_METHOD || 'POST';
  const payload = {
    approve: true,
    action: 'continue',
    reason: reason || '用户确认继续处理',
  };
  const startedAt = Date.now();
  logHermesDebug('request', {
    operation: 'run.approve',
    method,
    url,
    runId,
    reasonLength: payload.reason.length,
    reasonExcerpt: excerptForHermesLog(payload.reason, 240),
  });

  try {
    const response = await fetch(url, {
      method,
      headers: hermesHeaders(),
      body: JSON.stringify(payload),
    });
    const run = await parseHermesResponse<HermesRun>(response, 'Hermes run approval');
    logHermesDebug('response', {
      operation: 'run.approve',
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      runId: run.run_id,
      runStatus: run.status,
      outputSummary: summarizeUnknownForHermesLog(run.output),
    });
    return run;
  } catch (error) {
    logHermesDebug('failed', {
      operation: 'run.approve',
      runId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function* streamHermesRunEvents(runId: string, signal?: AbortSignal): AsyncGenerator<AnalysisEvent> {
  const url = `${hermesBaseUrl()}/v1/runs/${encodeURIComponent(runId)}/events`;
  const startedAt = Date.now();
  logHermesDebug('request', {
    operation: 'run.events',
    method: 'GET',
    url,
    runId,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: hermesHeaders(),
    signal,
  });

  if (!response.ok) {
    const detail = await safeHermesErrorDetail(response);
    logHermesDebug('failed', {
      operation: 'run.events',
      runId,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      error: detail || `HTTP ${response.status}`,
    });
    throw new Error(`Hermes run event stream failed with ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  if (!response.body) throw new Error('Hermes run event stream did not include a response body');
  logHermesDebug('response', {
    operation: 'run.events',
    runId,
    status: response.status,
    elapsedMs: Date.now() - startedAt,
    connected: true,
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventCount = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const records = buffer.split(/\r?\n\r?\n/);
    buffer = records.pop() ?? '';
    for (const record of records) {
      for (const event of parseHermesRunSsePayload(record)) {
        eventCount += 1;
        logHermesDebug('sse-event', summarizeHermesEventForLog(runId, eventCount, event));
        yield await enrichCompletedRunEvent(event);
      }
    }
  }

  buffer += decoder.decode();
  for (const event of parseHermesRunSsePayload(buffer)) {
    eventCount += 1;
    logHermesDebug('sse-event', summarizeHermesEventForLog(runId, eventCount, event));
    yield await enrichCompletedRunEvent(event);
  }
  logHermesDebug('stream-completed', {
    operation: 'run.events',
    runId,
    elapsedMs: Date.now() - startedAt,
    eventCount,
  });
}

export function parseHermesRunSsePayload(payload: string): AnalysisEvent[] {
  return payload
    .split(/\r?\n\r?\n/)
    .flatMap(record => {
      const eventName = record
        .split(/\r?\n/)
        .find(line => line.startsWith('event:'))
        ?.slice(6)
        .trim();
      const data = record
        .split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trimStart())
        .join('\n')
        .trim();

      if (!data || data === '[DONE]') return [];
      try {
        const payload = JSON.parse(data) as unknown;
        const event = normalizeHermesRunEvent(withSseEventName(payload, eventName));
        return event ? [event] : [];
      } catch {
        return [];
      }
    });
}

export function normalizeHermesRunEvent(payload: unknown): AnalysisEvent | null {
  if (!isRecord(payload)) return null;
  const type = stringValue(payload.type) ?? stringValue(payload.event);
  const status = stringValue(payload.status);
  if (status && /requires?_action|action_required|requires?_approval|approval_required/i.test(status)) {
    return normalizeRequiresAction(payload);
  }

  switch (type) {
    case 'plan.created':
    case 'run.plan':
    case 'run.planned':
      return {
        type: 'plan.created',
        plan: stringValue(payload.plan) ?? stringValue(payload.message) ?? 'AMC 多Agent评估计划已创建',
        agents: arrayValue(payload.agents).map(agent => isRecord(agent)
          ? {
              id: stringValue(agent.id) ?? 'orchestrator',
              name: stringValue(agent.name) ?? '评估编排器',
              role: stringValue(agent.role) ?? 'AMC协作评估',
            }
          : { id: 'orchestrator', name: '评估编排器', role: 'AMC协作评估' }),
      };
    case 'agent.started':
    case 'tool.started':
      return withoutUndefined({
        type: 'agent.started' as const,
        agentId: stringValue(payload.agentId) ?? stringValue(payload.agent_id) ?? inferAgentIdFromTool(stringValue(payload.tool) ?? stringValue(payload.name)),
        action: stringValue(payload.action) ?? stringValue(payload.message) ?? '开始执行',
        snippet: stringValue(payload.snippet),
      });
    case 'agent.progress':
      return withoutUndefined({
        type: 'agent.progress' as const,
        agentId: stringValue(payload.agentId) ?? stringValue(payload.agent_id) ?? 'orchestrator',
        action: stringValue(payload.action) ?? stringValue(payload.message) ?? '正在处理',
        progress: numberValue(payload.progress, 50),
        outputCount: numberValue(payload.outputCount ?? payload.output_count, 0),
        snippet: stringValue(payload.snippet),
      });
    case 'artifact.created':
      return {
        type: 'artifact.created',
        agentId: stringValue(payload.agentId) ?? stringValue(payload.agent_id),
        label: stringValue(payload.label) ?? stringValue(payload.name) ?? 'Hermes 工件',
      };
    case 'message.delta':
    case 'hermes.output.delta':
    case 'response.output_text.delta':
    case 'tool.output':
    case 'tool.delta':
    case 'tool.message':
    case 'function_call_output': {
      const text = textValue(payload.delta) ?? textValue(payload.text) ?? textValue(payload.output) ?? textValue(payload.message);
      return text ? withoutUndefined({
        type: 'hermes.output.delta' as const,
        agentId: stringValue(payload.agentId) ?? stringValue(payload.agent_id),
        text: userFacingHermesText(text),
      }) : null;
    }
    case 'tool.progress':
    case 'tool.completed':
      return {
        type: 'hermes.tool.progress',
        toolName: stringValue(payload.tool) ?? stringValue(payload.tool_name) ?? stringValue(payload.name) ?? 'Hermes Tool',
        label: stringValue(payload.label) ?? stringValue(payload.message) ?? '工具执行完成',
      };
    case 'run.requires_action':
    case 'thread.run.requires_action':
    case 'requires_action':
    case 'approval.required':
    case 'tool.requires_action':
    case 'tool.approval.required':
      return normalizeRequiresAction(payload);
    case 'run.completed':
    case 'hermes.run.completed':
    case 'analysis.completed':
      return {
        type: 'hermes.run.completed',
        output: userFacingHermesText(textValue(payload.output) ?? textValue(payload.message) ?? 'Hermes Agent 运行完成'),
      };
    case 'run.failed':
    case 'analysis.failed':
      return withoutUndefined({
        type: 'analysis.failed' as const,
        agentId: stringValue(payload.agentId) ?? stringValue(payload.agent_id),
        message: userFacingHermesText(stringValue(payload.message) ?? stringValue(payload.error) ?? '智能分析服务运行失败'),
      });
    default:
      return null;
  }
}

async function enrichCompletedRunEvent(event: AnalysisEvent): Promise<AnalysisEvent> {
  if (event.type !== 'hermes.run.completed') return event;
  const reportUri = extractReportMarkdownS3Uri(event.output);
  if (!reportUri) return event;
  const markdown = await readMinioReportMarkdown(reportUri);
  const cleanMarkdown = markdown?.trim();
  return cleanMarkdown ? { ...event, output: cleanMarkdown } : event;
}

export function extractReportMarkdownS3Uri(value: string) {
  return value.match(/s3:\/\/[^\s`，。；;、)）\]]+\/reports\/[^\s`，。；;、)）\]]+\.md/)?.[0]
    ?? value.match(/s3:\/\/[^\s`，。；;、)）\]]+\/xfas\/reports\/[^\s`，。；;、)）\]]+\.md/)?.[0];
}

async function hermesRunRequest(operation: string, url: string, method: 'GET' | 'POST', runId: string) {
  const startedAt = Date.now();
  logHermesDebug('request', {
    operation,
    method,
    url,
    runId,
  });

  try {
    const response = await fetch(url, {
      method,
      headers: hermesHeaders(),
    });
    const run = await parseHermesResponse<HermesRun>(response, `Hermes ${operation}`);
    logHermesDebug('response', {
      operation,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      runId: run.run_id,
      runStatus: run.status,
      outputSummary: summarizeUnknownForHermesLog(run.output),
      lastEventSummary: summarizeUnknownForHermesLog(run.last_event),
    });
    return run;
  } catch (error) {
    logHermesDebug('failed', {
      operation,
      runId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function parseHermesResponse<T>(response: Response, label: string) {
  if (!response.ok) {
    const detail = await safeHermesErrorDetail(response);
    throw new Error(`${label} failed with ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return await response.json() as T;
}

function logHermesDebug(stage: string, payload: Record<string, unknown>) {
  if (process.env.HERMES_AGENT_DEBUG === '0') return;
  console.info(`[HermesAgent:${stage}]`, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...payload,
  }, null, 2));
}

function hermesDebugFullTextEnabled() {
  return process.env.HERMES_AGENT_DEBUG_FULL === '1';
}

function excerptForHermesLog(value: string, limit: number) {
  const clean = userFacingHermesText(value).replace(/\s+/g, ' ').trim();
  return clean.length > limit ? `${clean.slice(0, limit)}...` : clean;
}

function summarizeUnknownForHermesLog(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return undefined;
  const text = textValue(value);
  if (text) {
    return {
      kind: typeof value,
      textLength: text.length,
      textExcerpt: excerptForHermesLog(text, hermesDebugFullTextEnabled() ? 4000 : 500),
    };
  }
  if (Array.isArray(value)) {
    return {
      kind: 'array',
      length: value.length,
    };
  }
  if (isRecord(value)) {
    return {
      kind: 'object',
      keys: Object.keys(value).slice(0, 12),
    };
  }
  return {
    kind: typeof value,
    value,
  };
}

function summarizeHermesEventForLog(runId: string, sequence: number, event: AnalysisEvent) {
  const base = {
    operation: 'run.events',
    runId,
    sequence,
    eventType: event.type,
  };
  switch (event.type) {
    case 'hermes.output.delta':
      return {
        ...base,
        agentId: event.agentId,
        textLength: event.text.length,
        textExcerpt: excerptForHermesLog(event.text, hermesDebugFullTextEnabled() ? 1200 : 180),
      };
    case 'hermes.run.completed':
      return {
        ...base,
        outputLength: event.output.length,
        outputExcerpt: excerptForHermesLog(event.output, hermesDebugFullTextEnabled() ? 2000 : 260),
      };
    case 'analysis.failed':
      return {
        ...base,
        agentId: event.agentId,
        message: excerptForHermesLog(event.message, 260),
      };
    case 'analysis.requires_action':
      return {
        ...base,
        agentId: event.agentId,
        toolName: event.toolName,
        message: excerptForHermesLog(event.message, 260),
      };
    case 'agent.started':
    case 'agent.progress':
      return {
        ...base,
        agentId: event.agentId,
        action: event.action,
        snippet: event.snippet ? excerptForHermesLog(event.snippet, 220) : undefined,
      };
    case 'hermes.tool.progress':
      return {
        ...base,
        toolName: event.toolName,
        label: event.label,
      };
    default:
      return base;
  }
}

async function safeHermesErrorDetail(response: Response) {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    await response.body?.cancel().catch(() => {});
    return '';
  }

  try {
    const payload = await response.json() as unknown;
    if (!isRecord(payload)) return '';
    const nestedError = isRecord(payload.error) ? payload.error : null;
    return truncate(
      stringValue(payload.message)
        ?? stringValue(payload.error)
        ?? stringValue(payload.detail)
        ?? stringValue(nestedError?.message)
        ?? stringValue(nestedError?.detail)
        ?? '',
      180,
    );
  } catch {
    return '';
  }
}

function normalizeRequiresAction(payload: Record<string, unknown>): AnalysisEvent {
  const toolName = stringValue(payload.tool) ?? stringValue(payload.tool_name) ?? stringValue(payload.name);
  const agentId = stringValue(payload.agentId) ?? stringValue(payload.agent_id) ?? inferAgentIdFromTool(toolName);
  const reason = stringValue(payload.message)
    ?? stringValue(payload.reason)
    ?? stringValue(payload.required_action)
    ?? stringValue(payload.action)
    ?? '当前步骤需要用户确认';
  const suffix = toolName ? `（工具：${toolName}）` : '';

  return {
    type: 'analysis.requires_action',
    agentId,
    toolName,
    message: `智能分析助手等待用户授权：${userFacingHermesText(reason)}${suffix}`,
  };
}

function withSseEventName(payload: unknown, eventName?: string) {
  if (!eventName || !isRecord(payload)) return payload;
  if (stringValue(payload.type) || stringValue(payload.event)) return payload;
  return { ...payload, event: eventName };
}

function inferAgentIdFromTool(toolName?: string) {
  const value = toolName?.toLowerCase() ?? '';
  if (/legal|law|case|court|法院|法律/.test(value)) return 'legal_reviewer';
  if (/risk|credit|风险|信用/.test(value)) return 'risk_assessor';
  if (/valuation|price|value|估值|评估/.test(value)) return 'valuation_auditor';
  if (/industry|market|行业|市场/.test(value)) return 'industry_analyst';
  return 'orchestrator';
}

function userFacingHermesText(value: string) {
  return value.replace(/\/(?:tmp|var|private|app|workspace)\/[^\s)）]+/g, '[内部路径已隐藏]');
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function textValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const text = value.map(textValue).filter(Boolean).join('\n').trim();
    return text || undefined;
  }
  if (isRecord(value)) {
    return textValue(value.markdown)
      ?? textValue(value.content)
      ?? textValue(value.text)
      ?? textValue(value.message)
      ?? textValue(value.output);
  }
  return undefined;
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}
