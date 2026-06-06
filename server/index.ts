import { Hono } from 'hono';
import type { HonoRequest } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import type { AgentDomain, AgentRole, AgentWorkGroup, AgentWorkItem, AgentWorkItemDefinition, AMCProject, AgentType, EvaluationRecord, InstructionIntentResult, KnowledgeAttachmentPreview, KnowledgeItem, MarketObject, OrchestratorMode, ProjectFile, ProjectType, ReportRevision } from '../src/types';
import type { StartAnalysisRequest } from '../src/hermes/types';
import { createAnalysisEventHub } from './analysis-event-hub';
import {
  addEvaluationRecord,
  appendAnalysisEvent,
  createAnalysisRecord,
  deleteAgentDomain,
  deleteAgentRole,
  deleteAgentWorkGroup,
  deleteAgentWorkItem,
  deleteKnowledgeAttachment,
  deleteKnowledgeItem,
  deleteMarketObject,
  deleteProjectFile,
  deleteReportRevision,
  generateAnalysisId,
  getAgentConfigBundle,
  getAgentDomain,
  getAgentDomainByCode,
  getAgentRole,
  getAgentWorkGroup,
  getAgentWorkItem,
  getKnowledgeItem,
  getAnalysisRecord,
  getLatestAnalysisRecord,
  getMarketObject,
  getProject,
  listKnowledgeAttachments,
  listAgentDomains,
  listAgentRoles,
  listAgentWorkGroups,
  listAgentWorkItems,
  listKnowledgeItems,
  listKnowledgeWriteSuggestions,
  listMarketObjects,
  listProjects,
  listRecentAnalysisRecords,
  listReportRevisions,
  resetMarketObjects,
  searchKnowledgeItems,
  updateKnowledgeWriteSuggestionStatus,
  upsertKnowledgeAttachment,
  upsertAgentDomain,
  upsertAgentRole,
  upsertAgentWorkGroup,
  upsertAgentWorkItem,
  upsertKnowledgeItem,
  upsertMarketObject,
  upsertProjectFile,
  upsertProject,
  upsertReportRevision,
  type HermesEvent,
} from './store';
import { qccDatabase, stockDatabase } from './seed-data';
import {
  approveHermesRunAction,
  askHermes,
  buildAmcEvaluationRunInstructions,
  createHermesRun,
  getHermesRun,
  hermesBaseUrl,
  hermesModel,
  stopHermesRun,
  streamHermesRunEvents,
} from './hermes';
import {
  createMinioImageAssetResponse,
  createMinioReportAssetResponse,
  parseMinioImagePath,
  parseMinioReportPath,
  uploadMinioProjectMarkdown,
} from './minio-assets';
import {
  buildKnowledgeRetrievalPlan,
  formatKnowledgeContext,
  retrieveKnowledge,
} from './knowledge-orchestrator';
import {
  buildInstructionIntentPrompt,
  buildPlanningMechanismInstructions,
  parseInstructionIntentResponse,
  type InstructionClarificationContext,
} from './instruction-intent';
import { mergeHermesKnowledgeAttachmentPreview, parseKnowledgeAttachmentFile, previewKnowledgeAttachmentFiles } from './knowledge-attachment-parser';

const app = new Hono();
const hermesAvailable = process.env.HERMES_AGENT_DISABLED !== '1';
const port = Number(process.env.PORT || 3100);
const serverIdleTimeout = Math.max(10, Number(process.env.API_IDLE_TIMEOUT_SECONDS || 120));

const analysisEventHub = createAnalysisEventHub({
  getRecord: getAnalysisRecord,
  appendEvent: appendAnalysisEvent,
  streamRunEvents: (runId, signal) => streamHermesRunEvents(runId, signal),
  buildFailureEvent: async (error, runId) => buildHermesRunStreamFailureEvent(error, await readHermesRunFailureSnapshot(runId)),
  getRunSnapshot: readHermesRunFailureSnapshot,
});

app.use('*', cors());

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'amc-agent-api',
    runtime: 'bun+hono',
    hermesAvailable,
    hermesBaseUrl: hermesBaseUrl(),
    hermesModel: hermesModel(),
    sqlitePath: process.env.XFAS_ANALYSIS_DB_PATH || 'data/xfas.db',
  });
});

app.post('/api/analysis/start', async (c) => {
  if (!hermesAvailable) return c.json({ message: 'Hermes Agent API 暂不可用。' }, 503);

  const body = await c.req.json<Partial<StartAnalysisRequest> & { projectId?: string }>();
  const request = typeof body.request === 'string' ? body.request.trim() : '';
  if (!request) return c.json({ message: '请输入要分析的AMC评估请求。' }, 400);

  const prompt: StartAnalysisRequest = {
    company: body.company || 'AMC项目',
    year: Number(body.year) || new Date().getFullYear(),
    reportType: body.reportType || 'detailed_analysis',
    request,
    uploads: Array.isArray(body.uploads) ? body.uploads : undefined,
  };

  try {
    const analysisId = generateAnalysisId();
    const run = await createHermesRun({
      input: request,
      sessionId: `amc-analysis-${analysisId}`,
      instructions: buildAmcEvaluationRunInstructions(),
    });
    createAnalysisRecord({
      analysisId,
      prompt,
      projectId: body.projectId,
      runId: run.run_id,
      runStatus: run.status,
    });
    analysisEventHub.ensureWatching(analysisId);

    return c.json({
      analysisId,
      runId: run.run_id,
      runStatus: run.status,
      eventCount: 0,
      eventsUrl: `/api/analysis/${encodeURIComponent(analysisId)}/events`,
      request,
    }, 201);
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Hermes Agent API 启动失败，请检查服务地址、API key 或网络。' }, 502);
  }
});

app.get('/api/analysis/latest', (c) => {
  const record = getLatestAnalysisRecord();
  if (!record) return c.json({ analysis: null });
  return c.json(analysisResponse(record));
});

app.get('/api/analysis/recent', (c) => {
  const limit = Number(c.req.query('limit') ?? 6);
  return c.json({
    records: listRecentAnalysisRecords(Number.isFinite(limit) ? limit : 6).map(record => analysisResponse(record)),
  });
});

app.get('/api/analysis/:id', (c) => {
  const record = getAnalysisRecord(c.req.param('id'));
  if (!record) return c.json({ message: '未找到该分析记录。' }, 404);
  return c.json(analysisResponse(record, { includeEvents: true }));
});

app.post('/api/analysis/:id/events', async (c) => {
  const analysisId = c.req.param('id');
  if (!getAnalysisRecord(analysisId)) return c.json({ message: '未找到该分析记录。' }, 404);
  const event = await c.req.json<HermesEvent>();
  const record = appendHermesEventWithCompletion(analysisId, event);
  if (!record) return c.json({ message: '事件写入失败。' }, 500);
  return c.json({ sequence: record.events.length, event }, 201);
});

app.get('/api/analysis/:id/events', (c) => {
  const analysisId = c.req.param('id');
  const record = getAnalysisRecord(analysisId);
  if (!record) return c.json({ message: '未找到该分析记录。' }, 404);

  const afterSequence = Math.max(0, Math.floor(Number(c.req.query('after') ?? 0) || 0));
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          unsubscribe?.();
          if (heartbeat) clearInterval(heartbeat);
        }
      };
      unsubscribe = analysisEventHub.subscribe(analysisId, afterSequence, item => {
        send(`data: ${JSON.stringify(item)}\n\n`);
      });
      heartbeat = setInterval(() => {
        send(`: heartbeat ${new Date().toISOString()}\n\n`);
      }, 15000);
      if (record.runId) analysisEventHub.ensureWatching(analysisId);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
});

app.get('/api/analysis/:id/report', (c) => {
  const record = getAnalysisRecord(c.req.param('id'));
  if (!record) return c.json({ message: '未找到该分析记录。' }, 404);
  if (!record.report) return c.json({ message: '报告尚未生成。' }, 404);
  return c.json({
    format: c.req.query('format') || record.report.format,
    content: record.report.content,
    generatedAt: record.report.generatedAt,
  });
});

app.post('/api/analysis/:id/approve', async (c) => {
  if (!hermesAvailable) return c.json({ message: 'Hermes Agent API 暂不可用。' }, 503);
  const record = getAnalysisRecord(c.req.param('id'));
  if (!record?.runId) return c.json({ message: '未找到可继续的Hermes运行。' }, 404);
  const body = await c.req.json<{ reason?: string }>().catch(() => ({} as { reason?: string }));

  try {
    const run = await approveHermesRunAction(record.runId, body.reason);
    appendAnalysisEvent(record.analysisId, { type: 'hermes.run.started', runId: run.run_id, status: run.status, input: '用户已授权继续Hermes AMC评估' });
    analysisEventHub.ensureWatching(record.analysisId);
    return c.json({ analysis: analysisResponse(getAnalysisRecord(record.analysisId)!), run });
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Hermes 授权继续失败。' }, 502);
  }
});

app.post('/api/analysis/:id/stop', async (c) => {
  const record = getAnalysisRecord(c.req.param('id'));
  if (!record) return c.json({ message: '未找到该分析记录。' }, 404);
  analysisEventHub.stop(record.analysisId);

  if (record.runId && hermesAvailable) {
    try {
      await stopHermesRun(record.runId);
    } catch (error) {
      console.error(error);
    }
  }

  const next = appendAnalysisEvent(record.analysisId, { type: 'analysis.failed', message: '用户已停止Hermes AMC评估。' });
  return c.json({ success: true, analysis: next ? analysisResponse(next) : analysisResponse(record) });
});

app.post('/api/hermes/chat', async (c) => {
  if (!hermesAvailable) return c.json({ message: 'Hermes Agent API 暂不可用。' }, 503);
  const body = await c.req.json<{ prompt?: string; sessionId?: string; conversationTitle?: string }>();
  if (!body.prompt?.trim()) return c.json({ message: '请输入要追问的问题。' }, 400);

  try {
    const reply = await askHermes({ prompt: body.prompt, sessionId: body.sessionId, conversationTitle: body.conversationTitle });
    return c.json({ reply });
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Hermes 智能助手调用失败。' }, 502);
  }
});

app.get('/api/assets/minio/images/:rptId/:imageId', async (c) => {
  const asset = parseMinioImagePath(c.req.param('rptId'), c.req.param('imageId'));
  if (!asset) return c.json({ message: '图片资源地址无效。' }, 400);
  return await createMinioImageAssetResponse(asset);
});

app.get('/api/assets/minio/reports/:rptId/:reportId', async (c) => {
  const asset = parseMinioReportPath(c.req.param('rptId'), c.req.param('reportId'));
  if (!asset) return c.json({ message: '报告资源地址无效。' }, 400);
  return await createMinioReportAssetResponse(asset);
});

app.get('/api/agent-config', (c) => c.json(getAgentConfigBundle(true)));

app.get('/api/agent-config/domains', (c) => c.json(listAgentDomains(true)));

app.post('/api/agent-config/domains', async (c) => {
  const domain = normalizeAgentDomain(await c.req.json<Partial<AgentDomain>>());
  if (!domain) return c.json({ error: 'Invalid domain payload' }, 400);
  return c.json(upsertAgentDomain(domain), 201);
});

app.put('/api/agent-config/domains/:id', async (c) => {
  const current = getAgentDomain(c.req.param('id'));
  if (!current) return c.json({ error: 'Domain not found' }, 404);
  const domain = normalizeAgentDomain({ ...current, ...await c.req.json<Partial<AgentDomain>>(), id: current.id });
  if (!domain) return c.json({ error: 'Invalid domain payload' }, 400);
  return c.json(upsertAgentDomain(domain));
});

app.delete('/api/agent-config/domains/:id', (c) => {
  const domain = deleteAgentDomain(c.req.param('id'));
  if (!domain) return c.json({ error: 'Domain not found' }, 404);
  return c.json(domain);
});

app.get('/api/agent-config/roles', (c) => c.json(listAgentRoles({
  domainId: c.req.query('domainId') || undefined,
  includeInactive: false,
})));

app.post('/api/agent-config/roles', async (c) => {
  const role = normalizeAgentRole(await c.req.json<Partial<AgentRole>>());
  if (!role) return c.json({ error: 'Invalid role payload' }, 400);
  return c.json(upsertAgentRole(role), 201);
});

app.put('/api/agent-config/roles/:id', async (c) => {
  const current = getAgentRole(c.req.param('id'));
  if (!current) return c.json({ error: 'Role not found' }, 404);
  const role = normalizeAgentRole({ ...current, ...await c.req.json<Partial<AgentRole>>(), id: current.id });
  if (!role) return c.json({ error: 'Invalid role payload' }, 400);
  return c.json(upsertAgentRole(role));
});

app.delete('/api/agent-config/roles/:id', (c) => {
  const role = deleteAgentRole(c.req.param('id'));
  if (!role) return c.json({ error: 'Role not found' }, 404);
  return c.json(role);
});

app.get('/api/agent-config/work-groups', (c) => c.json(listAgentWorkGroups({
  domainId: c.req.query('domainId') || undefined,
  roleId: c.req.query('roleId') || undefined,
  includeInactive: false,
})));

app.post('/api/agent-config/work-groups', async (c) => {
  const group = normalizeAgentWorkGroup(await c.req.json<Partial<AgentWorkGroup>>());
  if (!group) return c.json({ error: 'Invalid work group payload' }, 400);
  return c.json(upsertAgentWorkGroup(group), 201);
});

app.put('/api/agent-config/work-groups/:id', async (c) => {
  const current = getAgentWorkGroup(c.req.param('id'));
  if (!current) return c.json({ error: 'Work group not found' }, 404);
  const group = normalizeAgentWorkGroup({ ...current, ...await c.req.json<Partial<AgentWorkGroup>>(), id: current.id });
  if (!group) return c.json({ error: 'Invalid work group payload' }, 400);
  return c.json(upsertAgentWorkGroup(group));
});

app.delete('/api/agent-config/work-groups/:id', (c) => {
  const group = deleteAgentWorkGroup(c.req.param('id'));
  if (!group) return c.json({ error: 'Work group not found' }, 404);
  return c.json(group);
});

app.get('/api/agent-config/work-items', (c) => c.json(listAgentWorkItems({
  domainId: c.req.query('domainId') || undefined,
  roleId: c.req.query('roleId') || undefined,
  groupId: c.req.query('groupId') || undefined,
  includeInactive: false,
})));

app.post('/api/agent-config/work-items', async (c) => {
  const item = normalizeAgentWorkItem(await c.req.json<Partial<AgentWorkItem>>());
  if (!item) return c.json({ error: 'Invalid work item payload' }, 400);
  return c.json(upsertAgentWorkItem(item), 201);
});

app.put('/api/agent-config/work-items/:id', async (c) => {
  const current = getAgentWorkItem(c.req.param('id'));
  if (!current) return c.json({ error: 'Work item not found' }, 404);
  const item = normalizeAgentWorkItem({ ...current, ...await c.req.json<Partial<AgentWorkItem>>(), id: current.id });
  if (!item) return c.json({ error: 'Invalid work item payload' }, 400);
  return c.json(upsertAgentWorkItem(item));
});

app.delete('/api/agent-config/work-items/:id', (c) => {
  const item = deleteAgentWorkItem(c.req.param('id'));
  if (!item) return c.json({ error: 'Work item not found' }, 404);
  return c.json(item);
});

app.post('/api/agent-config/work-items/:id/generate-definition', async (c) => {
  if (!hermesAvailable) return c.json({ message: 'Hermes Agent API 暂不可用，无法生成智能体定义。' }, 503);
  const item = getAgentWorkItem(c.req.param('id'));
  if (!item) return c.json({ error: 'Work item not found' }, 404);
  const role = getAgentRole(item.roleId);
  const domain = getAgentDomain(item.domainId);
  if (!role || !domain) return c.json({ error: 'Work item parent config missing' }, 400);
  const knowledgeItems = item.definition.knowledgeItemIds
    .map(id => getKnowledgeItem(id))
    .filter(Boolean) as KnowledgeItem[];

  try {
    const reply = await askHermes({
      prompt: buildAgentDefinitionGenerationPrompt(domain, role, item, knowledgeItems),
      sessionId: `agent-definition-${item.id}-${Date.now()}`,
      conversationTitle: `生成${item.name}智能体定义`,
    });
    return c.json({
      workItemId: item.id,
      definition: parseAgentDefinitionPreview(reply, item.definition),
      raw: reply,
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Hermes 智能体定义生成失败。' }, 502);
  }
});

app.get('/api/projects', (c) => c.json(listProjects()));

app.post('/api/projects', async (c) => {
  const body = await c.req.json<Partial<AMCProject>>();
  if (!body.name || !body.customerName) return c.json({ error: 'Missing required fields' }, 400);

  const businessFields = body.businessFields || {};
  const project: AMCProject = {
    id: body.id || `proj-${Date.now()}`,
    name: body.name,
    customerName: body.customerName,
    projectType: (body.projectType || 'NPA_ACQUISITION') as ProjectType,
    debtorName: stringFromFields(body, businessFields, ['debtorName'], '综合债务主体'),
    totalDebt: numberFromFields(body, businessFields, ['totalDebt', 'originalDebt', 'subscriptionAmount', 'restructuringInvestment', 'restructuringCapital', 'transferFloorPrice']),
    collateralType: stringFromFields(body, businessFields, ['collateralType', 'investmentTarget', 'listingExchange', 'revitalizationScheme'], '无特定单体抵押'),
    collateralEstValue: numberFromFields(body, businessFields, ['collateralEstValue', 'priorityDebts', 'associatedFinancing']),
    status: body.files?.length ? 'DataCollected' : 'Draft',
    description: body.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: body.files || [],
    evaluations: body.evaluations || {},
    businessFields,
  };

  return c.json(upsertProject(project), 201);
});

app.post('/api/projects/:id/files', async (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  const uploadId = `project-file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  logFileUploadDebug('project.request', {
    uploadId,
    projectId: project.id,
    contentType: c.req.header('Content-Type') || c.req.header('content-type') || '',
    existingFileCount: project.files?.length || 0,
  });
  let newFile: ProjectFile;
  try {
    newFile = await readProjectFileUpload(c.req, { uploadId, projectId: project.id });
  } catch (error) {
    logFileUploadDebug('project.failed', {
      uploadId,
      projectId: project.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: error instanceof Error ? error.message : 'File upload failed' }, 400);
  }
  project.files = [...(project.files || []), newFile];
  project.status = project.status === 'Draft' ? 'DataCollected' : project.status;
  project.updatedAt = new Date().toISOString();
  upsertProjectFile(project.id, newFile);
  upsertProject(project);
  logFileUploadDebug('project.stored', {
    uploadId,
    projectId: project.id,
    storedFile: summarizeProjectFileForLog(newFile),
    nextFileCount: project.files.length,
  });
  return c.json(newFile, 201);
});

app.delete('/api/projects/:id/files/:fileId', (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  project.files = project.files.filter(file => file.id !== c.req.param('fileId'));
  project.updatedAt = new Date().toISOString();
  deleteProjectFile(project.id, c.req.param('fileId'));
  upsertProject(project);
  return c.json({ success: true });
});

app.post('/api/projects/:id/instruction-intent', async (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  if (!hermesAvailable) return c.json({ message: 'Hermes Agent API 暂不可用，无法完成智能规划。' }, 503);

  const body = await c.req.json<{
    userInstruction?: string;
    orchestratorMode?: OrchestratorMode;
    domainId?: string;
    roleId?: string;
    workItemId?: string;
    clarificationContext?: InstructionClarificationContext;
  }>();

  const mode = body.orchestratorMode || 'discuss';
  if (mode !== 'discuss') {
    return c.json({ message: '只有智能规划模式需要前置意图解析。' }, 400);
  }

  const selectedDomain = body.domainId ? getAgentDomain(body.domainId) : getAgentDomainByCode(project.projectType);
  const selectedRole = body.roleId ? getAgentRole(body.roleId) : null;
  const selectedWorkItem = body.workItemId ? getAgentWorkItem(body.workItemId) : null;
  const userInstruction = typeof body.userInstruction === 'string' ? body.userInstruction.trim() : '';

  try {
    const reply = await askHermes({
      prompt: buildInstructionIntentPrompt({
        project,
        userInstruction,
        mode,
        domain: selectedDomain,
        role: selectedRole,
        workItem: selectedWorkItem,
        clarificationContext: body.clarificationContext,
      }),
      sessionId: `amc-intent-${project.id}`,
      conversationTitle: `${project.name} 智能规划意图理解`,
    });
    const intent = parseInstructionIntentResponse(reply);
    return c.json({ success: true, intent });
  } catch (error) {
    console.error('Hermes instruction intent failed:', error);
    return c.json({ message: error instanceof Error ? error.message : 'Hermes 智能规划意图解析失败。' }, 502);
  }
});

app.post('/api/projects/:id/evaluate', async (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  if (!hermesAvailable) return c.json({ message: 'Hermes Agent API 暂不可用，评估任务未启动。' }, 503);

  const body = await c.req.json<{
    agentType?: AgentType;
    selectedSkills?: string[];
    orchestratorMode?: OrchestratorMode;
    userInstruction?: string;
    domainId?: string;
    roleId?: string;
    workItemId?: string;
    instructionIntent?: InstructionIntentResult;
  }>();
  const mode = body.orchestratorMode || 'single';
  const analysisId = generateAnalysisId();
  const targetAgentKey = mode !== 'single' ? 'orchestrator' : (body.agentType || 'law_review');
  const selectedDomain = body.domainId ? getAgentDomain(body.domainId) : getAgentDomainByCode(project.projectType);
  const selectedRole = body.roleId ? getAgentRole(body.roleId) : null;
  const selectedWorkItem = body.workItemId ? getAgentWorkItem(body.workItemId) : null;
  const selectedDefinition = selectedWorkItem?.definition;
  const skills = body.selectedSkills?.length
    ? body.selectedSkills
    : selectedDefinition?.skills || [];
  const effectiveInstruction = body.instructionIntent?.normalizedInstruction?.trim()
    || body.userInstruction?.trim()
    || '';
  const knowledgePlan = buildKnowledgeRetrievalPlan(project, targetAgentKey, effectiveInstruction);
  const knowledgeCitations = retrieveKnowledge(knowledgePlan, listKnowledgeItems());
  const knowledgeContext = formatKnowledgeContext(knowledgeCitations);
  const activeKbs = knowledgePlan.categories;
  const prompt: StartAnalysisRequest = {
    company: project.name,
    year: new Date().getFullYear(),
    reportType: 'amc_evaluation',
    request: effectiveInstruction || `启动 ${project.name} 的 Hermes AMC 多Agent协作评估`,
  };

  let run;
  try {
    run = await createHermesRun({
      input: buildAmcRunInput(project, activeKbs, effectiveInstruction, knowledgeContext, {
        domain: selectedDomain || undefined,
        role: selectedRole || undefined,
        workItem: selectedWorkItem || undefined,
        instructionIntent: body.instructionIntent,
      }),
      sessionId: `amc-analysis-${analysisId}`,
      instructions: [
        buildAmcEvaluationRunInstructions(),
        buildPlanningMechanismInstructions(mode, body.instructionIntent, {
          role: selectedRole,
          workItem: selectedWorkItem,
        }),
        buildAgentRuntimeInstructions(selectedDomain || undefined, selectedRole || undefined, selectedWorkItem || undefined),
      ].filter(Boolean).join('\n\n'),
    });
  } catch (error) {
    console.error('Hermes Agent API run creation failed:', error);
    return c.json({ message: 'Hermes Agent API 启动失败，评估任务未生成本地模拟报告。' }, 502);
  }

  createAnalysisRecord({
    analysisId,
    prompt,
    projectId: project.id,
    runId: run.run_id,
    runStatus: run.status,
    metadata: {
      targetAgentKey,
      orchestrationMode: mode,
      selectedSkills: skills,
      knowledgeBases: activeKbs,
      knowledgePlan,
      knowledgeCitations,
      agentDomainId: selectedDomain?.id,
      agentRoleId: selectedRole?.id,
      agentWorkItemId: selectedWorkItem?.id,
      agentWorkItemDefinition: selectedDefinition,
      instructionIntent: body.instructionIntent,
      sensitiveWordsFlagged: findSensitiveWords(project),
    },
  });
  const analysisRecord = getAnalysisRecord(analysisId)!;
  analysisEventHub.ensureWatching(analysisId);

  const evaluationRecord: EvaluationRecord = {
    id: `eval-pending-${analysisId}`,
    projectId: project.id,
    agentType: targetAgentKey,
    version: Math.max(1, ...(project.evaluations[targetAgentKey] || []).map(item => item.version + 1)),
    orchestrationMode: mode,
    analysisId,
    hermesEventCount: 0,
    runStatus: 'running',
    content: 'Hermes Agent 正在生成报告，完成后将自动写入成果目录。',
    sensitiveWordsFlagged: findSensitiveWords(project),
    createdAt: new Date().toISOString(),
    status: 'Draft',
    usedSkills: skills,
    usedKnowledgeBases: activeKbs,
    reflection: {
      score: 0,
      completeness: 0,
      compliance: 0,
      depth: 0,
      professionalism: 0,
      pros: ['Hermes真实事件流已启动'],
      cons: ['报告尚未完成'],
      suggestions: '请等待Hermes Agent事件流完成。',
    },
  };

  return c.json({
    success: true,
    isLiveLlm: false,
    isHermes: true,
    analysisId,
    runId: run.run_id,
    runStatus: run.status,
    eventsUrl: `/api/analysis/${encodeURIComponent(analysisId)}/events`,
    events: analysisRecord.events.map((event, index) => ({ sequence: index + 1, event })),
    record: evaluationRecord,
  }, 201);
});

app.put('/api/projects/:id/evaluations/:evalId/status', async (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  const body = await c.req.json<Partial<EvaluationRecord>>();
  const evalId = c.req.param('evalId');
  let updated: EvaluationRecord | null = null;

  for (const key of Object.keys(project.evaluations || {})) {
    project.evaluations[key] = project.evaluations[key].map(record => {
      if (record.id !== evalId) return record;
      updated = { ...record, ...body, status: body.status || record.status };
      return updated;
    });
  }

  if (!updated) return c.json({ error: 'Evaluation record not found' }, 404);
  project.updatedAt = new Date().toISOString();
  upsertProject(project);
  return c.json({ success: true, record: updated });
});

app.get('/api/revisions', (c) => {
  return c.json(listReportRevisions({
    projectId: c.req.query('projectId'),
    recordId: c.req.query('recordId'),
  }));
});

app.post('/api/revisions', async (c) => {
  const body = await c.req.json<Partial<ReportRevision>>();
  if (!body.projectId || !body.recordId || !body.originalText || !body.tunedText || !body.instruction || !body.category) {
    return c.json({ error: 'Missing required revision fields' }, 400);
  }
  const revision: ReportRevision = {
    id: body.id || `rev-${Date.now()}`,
    projectId: body.projectId,
    recordId: body.recordId,
    originalText: body.originalText,
    tunedText: body.tunedText,
    instruction: body.instruction,
    createdAt: body.createdAt || new Date().toISOString(),
    category: body.category,
    originalContentSnapshot: body.originalContentSnapshot,
  };
  return c.json(upsertReportRevision(revision), 201);
});

app.delete('/api/revisions/:id', (c) => {
  if (!deleteReportRevision(c.req.param('id'))) return c.json({ error: 'Revision not found' }, 404);
  return c.json({ success: true });
});

app.post('/api/projects/:id/evaluations/:evalId/tune', async (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  if (!hermesAvailable) return c.json({ error: 'Hermes Agent API 暂不可用，段落微调未执行。' }, 503);
  const { selectedText, instruction } = await c.req.json<{ selectedText?: string; instruction?: string }>();
  if (!selectedText || !instruction) return c.json({ error: 'Missing selectedText or instruction' }, 400);

  const evalId = c.req.param('evalId');
  let foundEval: EvaluationRecord | null = null;
  for (const key of Object.keys(project.evaluations || {})) {
    const list = project.evaluations[key];
    const index = list.findIndex(record => record.id === evalId);
    if (index >= 0) {
      foundEval = { ...list[index] };
      const originalContentSnapshot = foundEval.content;
      let tunedText: string;
      try {
        tunedText = await tuneParagraphWithHermes(project, foundEval, selectedText, instruction);
      } catch (error) {
        console.error('Hermes paragraph tuning failed:', error);
        return c.json({ error: 'Hermes Agent API 段落微调失败，请稍后重试。' }, 502);
      }
      foundEval.content = replaceSelectedText(foundEval.content, selectedText, tunedText, instruction);
      list[index] = foundEval;

      const feedbackItem: KnowledgeItem = {
        id: `kn-feed-${Date.now()}`,
        category: 'feedback',
        title: `段落微调反馈: 修订响应 - ${project.name}`,
        content: `【修订项目】: ${project.name}\n【原报告段落】:\n${selectedText}\n\n【调整微调指令】:\n${instruction}\n\n【调整后优质段落】:\n${tunedText}`,
        tags: ['微调反馈', '段落修订', project.projectType || 'General'],
        source: '用户选中微调反馈',
      };
      upsertKnowledgeItem(feedbackItem);
      const revision = upsertReportRevision({
        id: `rev-${Date.now()}`,
        projectId: project.id,
        recordId: foundEval.id,
        originalText: selectedText,
        tunedText,
        instruction,
        createdAt: new Date().toISOString(),
        category: foundEval.agentType,
        originalContentSnapshot,
      });
      project.updatedAt = new Date().toISOString();
      upsertProject(project);
      return c.json({ success: true, isHermes: true, record: foundEval, feedbackItem, tunedText, revision });
    }
  }

  return c.json({ error: 'Evaluation record not found' }, 404);
});

app.post('/api/projects/:id/evaluations/:evalId/tune-suggestions', async (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  if (!hermesAvailable) return c.json({ error: 'Hermes Agent API 暂不可用，无法生成微调推荐词。' }, 503);
  const { selectedText, count } = await c.req.json<{ selectedText?: string; count?: number }>();
  if (!selectedText?.trim()) return c.json({ error: 'Missing selectedText' }, 400);

  const evalId = c.req.param('evalId');
  const records = Object.values(project.evaluations || {}).flat();
  const record = records.find(item => item.id === evalId);
  if (!record) return c.json({ error: 'Evaluation record not found' }, 404);

  try {
    const suggestions = await generateTuningSuggestionsWithHermes(project, record, selectedText, count);
    return c.json({ suggestions });
  } catch (error) {
    console.error('Hermes paragraph tuning suggestions failed:', error);
    return c.json({ error: 'Hermes Agent API 微调推荐词生成失败，请稍后重试。' }, 502);
  }
});

app.get('/api/knowledge', (c) => {
  return c.json(searchKnowledgeItems({
    category: c.req.query('category'),
    q: c.req.query('q'),
  }));
});

app.post('/api/knowledge', async (c) => {
  const body = await c.req.json<Omit<KnowledgeItem, 'id'> & { id?: string }>();
  const item = normalizeKnowledgeItem(body);
  if (!item) return c.json({ error: 'Missing required fields' }, 400);
  return c.json(upsertKnowledgeItem(item), 201);
});

app.post('/api/knowledge/attachments/preview', async (c) => {
  const uploadId = `knowledge-preview-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  logFileUploadDebug('knowledge-preview.request', {
    uploadId,
    contentType: c.req.header('Content-Type') || c.req.header('content-type') || '',
  });
  const body = await c.req.parseBody({ all: true });
  const rawFiles = body.files ?? body.file;
  const files = (Array.isArray(rawFiles) ? rawFiles : rawFiles ? [rawFiles] : []).filter(isUploadedFile);
  if (!files.length) {
    logFileUploadDebug('knowledge-preview.failed', { uploadId, error: 'Missing multipart file fields named files or file' });
    return c.json({ error: 'Missing multipart file fields named files or file' }, 400);
  }
  const maxSize = Number(process.env.KNOWLEDGE_ATTACHMENT_MAX_BYTES || 10 * 1024 * 1024);
  const oversized = files.find(file => file.size > maxSize);
  logFileUploadDebug('knowledge-preview.received', {
    uploadId,
    maxSize,
    files: files.map(summarizeUploadedFileForLog),
  });
  if (oversized) {
    logFileUploadDebug('knowledge-preview.failed', {
      uploadId,
      error: `File ${oversized.name} exceeds ${maxSize} byte limit`,
      file: summarizeUploadedFileForLog(oversized),
    });
    return c.json({ error: `File ${oversized.name} exceeds ${maxSize} byte limit` }, 413);
  }
  const fallbackPreview = await previewKnowledgeAttachmentFiles(files);
  logFileUploadDebug('knowledge-preview.parsed', {
    uploadId,
    files: fallbackPreview.files,
    title: fallbackPreview.title,
    contentLength: fallbackPreview.content?.length || 0,
  });
  const sessionId = `knowledge-preview-${Date.now()}`;
  logKnowledgePreviewHermesDebug('fallback-ready', sessionId, {
    files: summarizeKnowledgePreviewFiles(fallbackPreview),
    fallback: summarizeKnowledgePreviewFields(fallbackPreview),
  });
  if (!hermesAvailable) {
    logKnowledgePreviewHermesDebug('skipped', sessionId, { reason: 'Hermes Agent API disabled' });
    return c.json(fallbackPreview);
  }
  try {
    const prompt = buildKnowledgeAttachmentPreviewPrompt(fallbackPreview);
    const startedAt = Date.now();
    logKnowledgePreviewHermesDebug('request', sessionId, {
      endpoint: `${hermesBaseUrl()}/v1/chat/completions`,
      model: hermesModel(),
      promptLength: prompt.length,
      promptExcerpt: excerptForLog(prompt, knowledgePreviewDebugFullTextEnabled() ? 4000 : 700),
    });
    const hermesText = await askHermes({
      prompt,
      sessionId,
      conversationTitle: '知识库附件字段预解析',
    });
    logKnowledgePreviewHermesDebug('response', sessionId, {
      elapsedMs: Date.now() - startedAt,
      outputLength: hermesText.length,
      outputExcerpt: excerptForLog(hermesText, knowledgePreviewDebugFullTextEnabled() ? 4000 : 1200),
    });
    const mergedPreview = mergeHermesKnowledgeAttachmentPreview(fallbackPreview, hermesText);
    logKnowledgePreviewHermesDebug('merged', sessionId, {
      merged: summarizeKnowledgePreviewFields(mergedPreview),
    });
    return c.json(mergedPreview);
  } catch (error) {
    logKnowledgePreviewHermesDebug('failed', sessionId, {
      error: error instanceof Error ? error.message : String(error),
      fallback: summarizeKnowledgePreviewFields(fallbackPreview),
    });
    console.error('Hermes knowledge attachment preview failed:', error);
    return c.json(fallbackPreview);
  }
});

app.put('/api/knowledge/:id', async (c) => {
  const existing = getKnowledgeItem(c.req.param('id'));
  if (!existing) return c.json({ error: 'Knowledge item not found' }, 404);
  const body = await c.req.json<Partial<KnowledgeItem>>();
  const item = normalizeKnowledgeItem({ ...existing, ...body, id: existing.id });
  if (!item) return c.json({ error: 'Missing required fields' }, 400);
  return c.json(upsertKnowledgeItem(item));
});

app.delete('/api/knowledge/:id', (c) => {
  if (!deleteKnowledgeItem(c.req.param('id'))) return c.json({ error: 'Knowledge item not found' }, 404);
  return c.json({ success: true });
});

app.get('/api/knowledge/:id/attachments', (c) => {
  if (!getKnowledgeItem(c.req.param('id'))) return c.json({ error: 'Knowledge item not found' }, 404);
  return c.json(listKnowledgeAttachments(c.req.param('id')));
});

app.post('/api/knowledge/:id/attachments', async (c) => {
  const item = getKnowledgeItem(c.req.param('id'));
  if (!item) return c.json({ error: 'Knowledge item not found' }, 404);
  const uploadId = `knowledge-attachment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  logFileUploadDebug('knowledge-attachment.request', {
    uploadId,
    knowledgeId: item.id,
    contentType: c.req.header('Content-Type') || c.req.header('content-type') || '',
  });
  const body = await c.req.parseBody();
  const file = body.file;
  if (!isUploadedFile(file)) {
    logFileUploadDebug('knowledge-attachment.failed', { uploadId, knowledgeId: item.id, error: 'Missing multipart file field named file' });
    return c.json({ error: 'Missing multipart file field named file' }, 400);
  }
  const maxSize = Number(process.env.KNOWLEDGE_ATTACHMENT_MAX_BYTES || 10 * 1024 * 1024);
  logFileUploadDebug('knowledge-attachment.received', {
    uploadId,
    knowledgeId: item.id,
    maxSize,
    file: summarizeUploadedFileForLog(file),
  });
  if (file.size > maxSize) {
    logFileUploadDebug('knowledge-attachment.failed', {
      uploadId,
      knowledgeId: item.id,
      error: `File exceeds ${maxSize} byte limit`,
      file: summarizeUploadedFileForLog(file),
    });
    return c.json({ error: `File exceeds ${maxSize} byte limit` }, 413);
  }

  const parsed = await parseKnowledgeAttachmentFile(file);
  logFileUploadDebug('knowledge-attachment.parsed', {
    uploadId,
    knowledgeId: item.id,
    parseStatus: parsed.parseStatus,
    parsedTextLength: parsed.parsedText?.length || 0,
    parseError: parsed.parseError,
  });
  const attachment = upsertKnowledgeAttachment({
    id: `katt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    knowledgeId: item.id,
    fileName: file.name || '未命名附件',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    parseStatus: parsed.parseStatus,
    parsedText: parsed.parsedText,
    parseError: parsed.parseError,
    uploadedAt: new Date().toISOString(),
  });
  logFileUploadDebug('knowledge-attachment.stored', {
    uploadId,
    knowledgeId: item.id,
    attachmentId: attachment.id,
    parseStatus: attachment.parseStatus,
    parsedTextLength: attachment.parsedText?.length || 0,
  });
  return c.json(attachment, 201);
});

app.delete('/api/knowledge/:id/attachments/:attachmentId', (c) => {
  if (!deleteKnowledgeAttachment(c.req.param('id'), c.req.param('attachmentId'))) return c.json({ error: 'Attachment not found' }, 404);
  return c.json({ success: true });
});

app.get('/api/knowledge/market-objects', (c) => c.json(listMarketObjects()));

app.post('/api/knowledge/market-objects', async (c) => {
  const body = await c.req.json<Partial<MarketObject>>();
  const object = normalizeMarketObject(body);
  if (!object) return c.json({ error: 'Invalid market object' }, 400);
  return c.json(upsertMarketObject(object), 201);
});

app.put('/api/knowledge/market-objects/:id', async (c) => {
  if (!getMarketObject(c.req.param('id'))) return c.json({ error: 'Market object not found' }, 404);
  const body = await c.req.json<Partial<MarketObject>>();
  const object = normalizeMarketObject({ ...body, id: c.req.param('id') });
  if (!object) return c.json({ error: 'Invalid market object' }, 400);
  return c.json(upsertMarketObject(object));
});

app.delete('/api/knowledge/market-objects/:id', (c) => {
  if (listMarketObjects().length <= 1) return c.json({ error: 'At least one market object is required' }, 400);
  if (!deleteMarketObject(c.req.param('id'))) return c.json({ error: 'Market object not found' }, 404);
  return c.json({ success: true });
});

app.post('/api/knowledge/market-objects/reset', (c) => c.json(resetMarketObjects()));

app.get('/api/knowledge/suggestions', (c) => c.json(listKnowledgeWriteSuggestions()));

app.post('/api/knowledge/suggestions/:id/approve', (c) => {
  const current = listKnowledgeWriteSuggestions().find(item => item.id === c.req.param('id'));
  if (!current) return c.json({ error: 'Suggestion not found' }, 404);
  if (!current.title || !current.content || current.status === 'invalid') return c.json({ error: 'Suggestion is invalid' }, 400);
  const suggestion = updateKnowledgeWriteSuggestionStatus(c.req.param('id'), 'approved');
  if (!suggestion) return c.json({ error: 'Suggestion not found' }, 404);
  const item = upsertKnowledgeItem({
    id: `kn-sugg-${Date.now()}`,
    category: current.category,
    title: current.title,
    content: current.content,
    tags: current.tags || [],
    source: current.source || 'Hermes Agent 建议入库',
  });
  return c.json({ success: true, suggestion, item });
});

app.post('/api/knowledge/suggestions/:id/reject', (c) => {
  const suggestion = updateKnowledgeWriteSuggestionStatus(c.req.param('id'), 'rejected');
  if (!suggestion) return c.json({ error: 'Suggestion not found' }, 404);
  return c.json({ success: true, suggestion });
});

app.get('/api/qcc', (c) => {
  const query = c.req.query('query')?.trim();
  if (!query) return c.json({ error: 'Empty query parameter' });
  const matched = qccDatabase[query];
  if (matched) return c.json(matched);
  return c.json({
    companyName: query,
    legalPerson: '模拟法人',
    regStatus: '存续',
    regCapital: '10000.00 万元人民币',
    establishDate: '2016年08月18日',
    address: '模拟工商登记地址',
    shareholders: [{ name: '主要股东A', ratio: '70.0%' }, { name: '主要股东B', ratio: '30.0%' }],
    risks: [{ title: '存在司法或经营风险待核验', type: 'MEDIUM', date: '2026-05-01', desc: '当前为本地模拟工商画像，请接入真实企查查后核验。' }],
  });
});

app.get('/api/stock', (c) => {
  const query = c.req.query('query')?.trim();
  if (!query) return c.json({ error: 'Empty query parameter' });
  const matched = stockDatabase[query];
  if (matched) return c.json(matched);
  return c.json({
    code: 'N/A',
    name: query,
    price: 3.12,
    change: 1.2,
    volume: '451,200 手',
    marketCap: '37.4 亿元',
    peRatio: 145.2,
  });
});

app.use('/assets/*', serveStatic({ root: './dist' }));
app.use('/favicon.ico', serveStatic({ root: './dist' }));
app.get('*', serveStatic({ path: './dist/index.html' }));

function analysisResponse(record: NonNullable<ReturnType<typeof getAnalysisRecord>>, options: { includeEvents?: boolean } = {}) {
  return {
    analysisId: record.analysisId,
    prompt: record.prompt,
    analysis: record.state,
    state: record.state,
    projectId: record.projectId,
    runId: record.runId,
    runStatus: record.runStatus,
    eventCount: record.events.length,
    metadata: record.metadata,
    updatedAt: record.updatedAt,
    report: record.report,
    ...(options.includeEvents
      ? { events: record.events.map((event, index) => ({ sequence: index + 1, event })) }
      : {}),
  };
}

function appendHermesEventWithCompletion(analysisId: string, event: HermesEvent) {
  const record = appendAnalysisEvent(analysisId, event);
  if (!record) return null;
  if (event.type !== 'hermes.run.completed') return record;

  const content = event.output?.trim();
  let latest = record;
  if (content) {
    latest = appendAnalysisEvent(analysisId, {
      type: 'amc.report.generated',
      reportFormat: 'markdown',
      reportContent: content,
    }) || latest;
  }
  latest = appendAnalysisEvent(analysisId, { type: 'analysis.completed' }) || latest;
  return latest;
}

function buildAmcRunInput(
  project: AMCProject,
  activeKbs: string[],
  userInstruction?: string,
  knowledgeContext?: string,
  agentRuntime?: { domain?: AgentDomain; role?: AgentRole; workItem?: AgentWorkItem; instructionIntent?: InstructionIntentResult },
) {
  return [
    `项目名称：${project.name}`,
    `客户名称：${project.customerName}`,
    `债务主体：${project.debtorName}`,
    `项目类型：${project.projectType}`,
    `债权金额：${project.totalDebt} 万元`,
    `抵质押物：${project.collateralType}`,
    `抵押物估值：${project.collateralEstValue} 万元`,
    `项目说明：${project.description}`,
    `启用知识库：${activeKbs.join('、')}`,
    userInstruction ? `用户专项指令：${userInstruction}` : '',
    agentRuntime?.instructionIntent ? buildInstructionIntentInputBlock(agentRuntime.instructionIntent) : '',
    agentRuntime ? buildAgentRuntimeInputBlock(agentRuntime.domain, agentRuntime.role, agentRuntime.workItem) : '',
    project.files?.length ? buildProjectFilesPromptBlock(project.files) : '',
    knowledgeContext,
    [
      '【知识引用规则】',
      '1. 上方本地知识库仅作为应用主数据模型检索结果使用。',
      '2. 若报告实质采用某条本地知识，请在相关段落或参考知识清单中保留知识ID。',
      '3. 如需更多本地知识，请输出 fenced JSON knowledge_search 协议块。',
      '4. 如形成可复用经验，只能输出 knowledge_write_suggestion 协议块，不能声称已写入正式知识库。',
    ].join('\n'),
  ].filter(Boolean).join('\n');
}

function buildInstructionIntentInputBlock(intent: InstructionIntentResult) {
  return [
    '【智能规划前置理解】',
    `决策：${intent.decision}`,
    `理解摘要：${intent.summary}`,
    `回复用户：${intent.reply}`,
    intent.missingInfo.length ? `缺失信息：${intent.missingInfo.join('、')}` : '',
    `调度理由：${intent.rationale}`,
  ].filter(Boolean).join('\n');
}

function buildAgentRuntimeInputBlock(domain?: AgentDomain, role?: AgentRole, workItem?: AgentWorkItem) {
  if (!domain && !role && !workItem) return '';
  const definition = workItem?.definition;
  return [
    '【本次专家工作项配置】',
    domain ? `产品领域：${domain.label}（${domain.code}）` : '',
    role ? `岗位专家：${role.name}；岗位职责：${role.role}；默认温度：${role.defaultTemperature}` : '',
    workItem ? `工作项：${workItem.name}${workItem.description ? `；说明：${workItem.description}` : ''}` : '',
    definition?.workSteps?.length ? `工作定义：\n${definition.workSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}` : '',
    definition?.knowledgeItemIds?.length ? `关联知识资产ID：${definition.knowledgeItemIds.join('、')}` : '',
    definition?.tools?.length ? `依赖工具：${definition.tools.join('、')}` : '',
    definition?.skills?.length ? `依赖 skills：${definition.skills.join('、')}` : '',
    definition?.outputTemplate ? `成果模板：\n${definition.outputTemplate}` : '',
  ].filter(Boolean).join('\n');
}

function buildAgentRuntimeInstructions(domain?: AgentDomain, role?: AgentRole, workItem?: AgentWorkItem) {
  if (!role && !workItem) return '';
  const definition = workItem?.definition;
  return [
    '【专家配置执行约束】',
    domain ? `本次运行必须适配产品领域：${domain.label}。` : '',
    role ? `本次运行的主责岗位专家为：${role.name}。${role.role}` : '',
    definition?.systemPrompt ? `岗位系统提示词：\n${definition.systemPrompt}` : '',
    definition?.userPrompt ? `工作项用户提示词：\n${definition.userPrompt}` : '',
    definition?.outputTemplate ? '最终输出应尽量遵循工作项成果模板。' : '',
  ].filter(Boolean).join('\n');
}

function buildProjectFilesPromptBlock(files: ProjectFile[]) {
  return [
    '【项目资料文件】',
    '以下资料已在上传时转换为 Markdown 并归档到 MinIO。Hermes Agent 可优先读取 Markdown资料URI；当前 Markdown 仅包含文件中可解析的文本和表格内容，图片内容后续处理。',
    ...files.map(file => [
      `- 文件：${file.name}`,
      `  - 类型：${file.type}`,
      `  - 解析状态：${file.parseStatus || 'unknown'}`,
      file.markdownS3Uri ? `  - Markdown资料URI：${file.markdownS3Uri}` : `  - Markdown资料URI：未上传${file.markdownUploadError ? `（${file.markdownUploadError}）` : ''}`,
      `  - 摘要：${(file.contentSnippet || '').slice(0, 800)}`,
    ].join('\n')),
  ].join('\n');
}

function normalizeAgentDomain(body: Partial<AgentDomain>): AgentDomain | null {
  const code = body.code?.trim();
  const label = body.label?.trim();
  if (!code || !label) return null;
  const now = new Date().toISOString();
  return {
    id: body.id || `domain-${slugId(code)}`,
    code,
    label,
    description: body.description?.trim() || '',
    themeColor: body.themeColor?.trim() || 'indigo',
    fields: Array.isArray(body.fields) ? body.fields.map(field => ({
      key: field.key?.trim() || '',
      label: field.label?.trim() || '',
      placeholder: field.placeholder?.trim() || '',
      type: (field.type === 'number' || field.type === 'date' ? field.type : 'text') as 'text' | 'number' | 'date',
      required: Boolean(field.required),
    })).filter(field => field.key && field.label) : [],
    status: body.status === 'inactive' ? 'inactive' : 'active',
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
}

function normalizeAgentRole(body: Partial<AgentRole>): AgentRole | null {
  if (!body.domainId || !getAgentDomain(body.domainId)) return null;
  const name = body.name?.trim();
  const role = body.role?.trim();
  if (!name || !role) return null;
  const agentType = isAgentType(body.agentType) ? body.agentType : 'law_review';
  const now = new Date().toISOString();
  return {
    id: body.id || `role-${body.domainId}-${agentType}-${Date.now()}`,
    domainId: body.domainId,
    agentType,
    name,
    role,
    defaultTemperature: clampNumber(Number(body.defaultTemperature ?? 0.15), 0, 1),
    status: body.status === 'inactive' ? 'inactive' : 'active',
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
}

function normalizeAgentWorkGroup(body: Partial<AgentWorkGroup>): AgentWorkGroup | null {
  const role = body.roleId ? getAgentRole(body.roleId) : null;
  if (!role) return null;
  const name = body.name?.trim();
  if (!name) return null;
  const now = new Date().toISOString();
  return {
    id: body.id || `group-${body.roleId}-${Date.now()}`,
    domainId: body.domainId || role.domainId,
    roleId: role.id,
    name,
    description: body.description?.trim() || '',
    status: body.status === 'inactive' ? 'inactive' : 'active',
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
}

function normalizeAgentWorkItem(body: Partial<AgentWorkItem>): AgentWorkItem | null {
  const group = body.groupId ? getAgentWorkGroup(body.groupId) : null;
  const role = body.roleId ? getAgentRole(body.roleId) : group ? getAgentRole(group.roleId) : null;
  if (!group || !role) return null;
  const name = body.name?.trim();
  if (!name) return null;
  const now = new Date().toISOString();
  return {
    id: body.id || `workitem-${group.id}-${Date.now()}`,
    domainId: body.domainId || group.domainId,
    roleId: role.id,
    groupId: group.id,
    name,
    description: body.description?.trim() || '',
    definition: normalizeAgentWorkItemDefinition(body.definition, name),
    status: body.status === 'inactive' ? 'inactive' : 'active',
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
}

function normalizeAgentWorkItemDefinition(definition: Partial<AgentWorkItemDefinition> | undefined, fallbackName: string): AgentWorkItemDefinition {
  return {
    workSteps: normalizeStringList(definition?.workSteps).length ? normalizeStringList(definition?.workSteps) : ['检查资料完整性', '阅读资料', '识别专业问题', '形成报告'],
    knowledgeItemIds: normalizeStringList(definition?.knowledgeItemIds),
    outputTemplate: definition?.outputTemplate?.trim() || `# ${fallbackName}报告\n\n## 一、审查范围\n\n## 二、关键发现\n\n## 三、结论与建议\n`,
    systemPrompt: definition?.systemPrompt?.trim() || `你是 AMC ${fallbackName}智能体，请完成专业审查。`,
    userPrompt: definition?.userPrompt?.trim() || `请执行${fallbackName}并输出结构化结论。`,
    tools: normalizeStringList(definition?.tools),
    skills: normalizeStringList(definition?.skills).length ? normalizeStringList(definition?.skills) : [fallbackName],
  };
}

function buildAgentDefinitionGenerationPrompt(domain: AgentDomain, role: AgentRole, item: AgentWorkItem, knowledgeItems: KnowledgeItem[]) {
  return [
    '你是 AMC 智能体配置架构师。请根据产品领域、岗位专家、工作定义、知识资产和成果模板生成智能体定义。',
    '只输出 JSON 对象，不要输出解释、Markdown 或代码块。',
    'JSON 结构必须严格为：{"systemPrompt":"...","userPrompt":"...","tools":["..."],"skills":["..."]}',
    '',
    `产品领域：${domain.label}（${domain.code}）`,
    `岗位专家：${role.name}`,
    `岗位职责：${role.role}`,
    `工作项：${item.name}`,
    `工作项说明：${item.description || '无'}`,
    '',
    '工作定义：',
    item.definition.workSteps.map((step, index) => `${index + 1}. ${step}`).join('\n'),
    '',
    '知识资产：',
    knowledgeItems.length
      ? knowledgeItems.map(knowledge => `- [${knowledge.id}] ${knowledge.title}：${knowledge.content.slice(0, 300)}`).join('\n')
      : '未选择具体知识资产，请生成可检索本地知识库的通用定义。',
    '',
    '成果模板：',
    item.definition.outputTemplate.slice(0, 4000),
  ].join('\n');
}

function parseAgentDefinitionPreview(reply: string, fallback: AgentWorkItemDefinition): AgentWorkItemDefinition {
  const raw = reply.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(raw) as Partial<AgentWorkItemDefinition>;
    return {
      ...fallback,
      systemPrompt: parsed.systemPrompt?.trim() || fallback.systemPrompt,
      userPrompt: parsed.userPrompt?.trim() || fallback.userPrompt,
      tools: normalizeStringList(parsed.tools).length ? normalizeStringList(parsed.tools) : fallback.tools,
      skills: normalizeStringList(parsed.skills).length ? normalizeStringList(parsed.skills) : fallback.skills,
    };
  } catch {
    return {
      ...fallback,
      systemPrompt: reply.trim() || fallback.systemPrompt,
    };
  }
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean);
  return [];
}

function isAgentType(value: unknown): value is AgentType {
  return value === 'law_review' || value === 'risk_review' || value === 'evaluation' || value === 'industry' || value === 'orchestrator';
}

function slugId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || `${Date.now()}`;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeKnowledgeItem(body: Partial<KnowledgeItem> & { id?: string }): KnowledgeItem | null {
  if (!body.category || !body.title?.trim() || !body.content?.trim()) return null;
  const category = body.category;
  if (!['policies', 'legal', 'market', 'cases', 'methodology', 'internal_policies', 'industry', 'feedback'].includes(category)) return null;
  return {
    id: body.id || `kn-${Date.now()}`,
    category,
    title: body.title.trim(),
    content: body.content.trim(),
    tags: normalizeTags((body as { tags?: unknown }).tags),
    source: body.source?.trim() || undefined,
  };
}

function isUploadedFile(value: unknown): value is File {
  return Boolean(
    value
      && typeof value === 'object'
      && typeof (value as File).arrayBuffer === 'function'
      && typeof (value as File).name === 'string'
      && typeof (value as File).size === 'number',
  );
}

async function readProjectFileUpload(req: HonoRequest, context: { uploadId: string; projectId: string }): Promise<ProjectFile> {
  const uploadedAt = new Date().toISOString();
  const contentType = req.header('Content-Type') || req.header('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const body = await req.parseBody();
    const rawFile = body.file ?? body.files;
    const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;
    if (!isUploadedFile(file)) throw new Error('Missing multipart file field named file');
    const maxSize = Number(process.env.PROJECT_FILE_MAX_BYTES || 50 * 1024 * 1024);
    logFileUploadDebug('project.received', {
      uploadId: context.uploadId,
      projectId: context.projectId,
      maxSize,
      file: summarizeUploadedFileForLog(file),
      requestedType: String(body.type || 'Other'),
    });
    if (file.size > maxSize) throw new Error(`File ${file.name} exceeds ${maxSize} byte limit`);
    const type = String(body.type || 'Other');
    const parsed = await parseKnowledgeAttachmentFile(file);
    const parsedText = parsed.parsedText || '';
    const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    logFileUploadDebug('project.parsed', {
      uploadId: context.uploadId,
      projectId: context.projectId,
      fileName: file.name || '未命名文档',
      type,
      parseStatus: parsed.parseStatus,
      parsedTextLength: parsed.parsedText?.length || 0,
      parsedTextExcerpt: parsed.parsedText ? excerptForLog(parsed.parsedText, fileUploadDebugFullTextEnabled() ? 1200 : 240) : undefined,
      parseError: parsed.parseError,
    });
    const projectFile: ProjectFile = {
      id: fileId,
      name: file.name || '未命名文档',
      size: file.size,
      type,
      uploadedAt,
      contentSnippet: parsedText
        ? parsedText.slice(0, 1200)
        : `项目资料附件[${file.name || '未命名文档'}]解析失败：${parsed.parseError || '未能解析出文本内容'}`,
      mimeType: file.type || 'application/octet-stream',
      parseStatus: parsed.parseStatus,
      parsedText: parsed.parsedText,
      parseError: parsed.parseError,
    };
    return await archiveProjectFileMarkdown(context, projectFile);
  }

  const body = await req.json<Partial<ProjectFile>>();
  logFileUploadDebug('project.legacy-json', {
    uploadId: context.uploadId,
    projectId: context.projectId,
    fileName: body.name || '未命名文档.txt',
    size: Number(body.size) || 2048,
    type: body.type || 'Other',
    contentSnippetLength: body.contentSnippet?.length || 0,
  });
  const projectFile: ProjectFile = {
    id: body.id || `file-${Date.now()}`,
    name: body.name || '未命名文档.txt',
    size: Number(body.size) || 2048,
    type: body.type || 'Other',
    uploadedAt,
    contentSnippet: body.contentSnippet || '此文件包含该资产标的或抵质押登记的权属信息、租约及流水核对数据。',
    mimeType: body.mimeType,
    parseStatus: body.parseStatus,
    parsedText: body.parsedText,
    parseError: body.parseError,
  };
  return await archiveProjectFileMarkdown(context, projectFile);
}

async function archiveProjectFileMarkdown(context: { uploadId: string; projectId: string }, file: ProjectFile): Promise<ProjectFile> {
  const markdown = buildProjectFileMarkdown(context.projectId, file);
  try {
    const result = await uploadMinioProjectMarkdown({
      projectId: context.projectId,
      fileId: file.id,
      markdown,
    });
    logFileUploadDebug('project.markdown-uploaded', {
      uploadId: context.uploadId,
      projectId: context.projectId,
      fileId: file.id,
      markdownS3Uri: result.uri,
      markdownSize: result.size,
      minioKey: result.key,
    });
    return {
      ...file,
      markdownS3Uri: result.uri,
      markdownUploadStatus: 'uploaded',
      markdownUploadError: undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logFileUploadDebug('project.markdown-upload-failed', {
      uploadId: context.uploadId,
      projectId: context.projectId,
      fileId: file.id,
      error: message,
    });
    return {
      ...file,
      markdownUploadStatus: 'failed',
      markdownUploadError: message,
    };
  }
}

function buildProjectFileMarkdown(projectId: string, file: ProjectFile) {
  const body = file.parsedText || file.contentSnippet || '';
  return [
    `# ${file.name}`,
    '',
    '> 当前 Markdown 由项目资料上传流程自动转换，仅包含文件中可解析的文本和表格内容；文件内图片内容后续处理。',
    '',
    '## 文件元数据',
    '',
    `- 项目ID：${projectId}`,
    `- 文件ID：${file.id}`,
    `- 文件类型：${file.type}`,
    `- MIME 类型：${file.mimeType || 'application/octet-stream'}`,
    `- 文件大小：${file.size} bytes`,
    `- 上传时间：${file.uploadedAt}`,
    `- 解析状态：${file.parseStatus || 'unknown'}`,
    file.parseError ? `- 解析错误：${file.parseError}` : '',
    '',
    '## 可读取内容',
    '',
    body.trim() || '未能解析出可读取文本或表格内容。',
    '',
  ].filter(line => line !== '').join('\n');
}

function logFileUploadDebug(stage: string, payload: Record<string, unknown>) {
  if (process.env.FILE_UPLOAD_DEBUG === '0') return;
  console.info(`[FileUpload:${stage}]`, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...payload,
  }, null, 2));
}

function fileUploadDebugFullTextEnabled() {
  return process.env.FILE_UPLOAD_DEBUG_FULL === '1';
}

function summarizeUploadedFileForLog(file: File) {
  return {
    fileName: file.name || '未命名文档',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    extension: file.name?.split('.').pop()?.toLowerCase() || '',
  };
}

function summarizeProjectFileForLog(file: ProjectFile) {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    size: file.size,
    mimeType: file.mimeType,
    parseStatus: file.parseStatus,
    parsedTextLength: file.parsedText?.length || 0,
    contentSnippetLength: file.contentSnippet?.length || 0,
    parseError: file.parseError,
    markdownS3Uri: file.markdownS3Uri,
    markdownUploadStatus: file.markdownUploadStatus,
    markdownUploadError: file.markdownUploadError,
  };
}

function buildKnowledgeAttachmentPreviewPrompt(preview: KnowledgeAttachmentPreview) {
  return [
    '你是 AMC 不良资产知识库入库助手。请根据附件解析文本，提取知识库维护表单的 4 个字段。',
    '只输出 JSON 对象，不要输出解释、寒暄、Markdown 或代码块。',
    'JSON 结构必须严格为：{"title":"...","tags":["..."],"source":"...","content":"..."}',
    '字段要求：',
    '1. title：文档、规章或案例标题，优先使用正式标题，避免把发文机关当标题。',
    '2. tags：3-8 个中文特征标签，聚焦 AMC 风控、法律、估值、市场、案例或内规关键词。',
    '3. source：颁布单位、发文单位、数据源或资料来源；无法确定则使用空字符串。',
    '4. content：备注信息，用 300-800 字总结可供 RAG 检索的核心规则、适用场景、风险点和评估口径。',
    '',
    '【附件解析概况】',
    preview.files.map(file => `- ${file.fileName}：${file.parseStatus}${file.parseError ? `，${file.parseError}` : ''}`).join('\n'),
    '',
    '【附件解析文本】',
    (preview.content || '').slice(0, 12000),
  ].join('\n');
}

function logKnowledgePreviewHermesDebug(stage: string, sessionId: string, payload: Record<string, unknown>) {
  if (process.env.HERMES_KNOWLEDGE_PREVIEW_DEBUG === '0') return;
  console.info(`[HermesKnowledgePreview:${stage}]`, JSON.stringify({
    timestamp: new Date().toISOString(),
    sessionId,
    ...payload,
  }, null, 2));
}

function summarizeKnowledgePreviewFiles(preview: KnowledgeAttachmentPreview) {
  return preview.files.map(file => ({
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.size,
    parseStatus: file.parseStatus,
    parseError: file.parseError,
    parsedTextExcerpt: file.parsedTextExcerpt ? excerptForLog(file.parsedTextExcerpt, 220) : undefined,
  }));
}

function summarizeKnowledgePreviewFields(preview: KnowledgeAttachmentPreview) {
  return {
    title: preview.title,
    category: preview.category,
    tags: preview.tags,
    source: preview.source,
    contentLength: preview.content.length,
    contentExcerpt: excerptForLog(preview.content, knowledgePreviewDebugFullTextEnabled() ? 4000 : 500),
  };
}

function knowledgePreviewDebugFullTextEnabled() {
  return process.env.HERMES_KNOWLEDGE_PREVIEW_DEBUG_FULL === '1';
}

function excerptForLog(value: string, limit: number) {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? `${clean.slice(0, limit)}...` : clean;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map(tag => tag.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[、,，\s]+/).map(tag => tag.trim()).filter(Boolean);
  return [];
}

function normalizeMarketObject(body: Partial<MarketObject>): MarketObject | null {
  if (!body.name?.trim()) return null;
  const fields = Array.isArray(body.fields)
    ? body.fields
        .filter(field => field?.key && field?.label && ['string', 'number', 'date'].includes(field.type))
        .map(field => ({
          key: String(field.key).replace(/[^a-zA-Z0-9_]/g, ''),
          label: String(field.label).trim(),
          type: field.type,
        }))
        .filter(field => field.key && field.label)
    : [];
  if (!fields.length) return null;
  return {
    id: body.id || `market-${Date.now()}`,
    name: body.name.trim(),
    description: body.description?.trim() || '',
    fields,
    rows: Array.isArray(body.rows) ? body.rows.map(row => normalizeMarketRow(row, fields)) : [],
  };
}

function normalizeMarketRow(row: Record<string, unknown>, fields: MarketObject['fields']) {
  const id = typeof row.id === 'string' && row.id.trim() ? row.id.trim() : `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const next: Record<string, unknown> = { id };
  fields.forEach(field => {
    const value = row[field.key];
    next[field.key] = field.type === 'number'
      ? Number(value) || 0
      : value === undefined || value === null
        ? ''
        : String(value);
  });
  return next;
}

function findSensitiveWords(project: AMCProject) {
  const flagged: string[] = [];
  ['贪腐', '倒闭潮', '行贿', '虚开增值税', '转移资产规避'].forEach(word => {
    if (project.description?.includes(word)) flagged.push(`项目简介包含敏感词 '${word}'`);
  });
  return flagged;
}

async function tuneParagraphWithHermes(project: AMCProject, record: EvaluationRecord, selectedText: string, instruction: string) {
  const prompt = [
    '你是 AMC 不良资产评估报告的 Hermes 段落精修 Agent。',
    '请根据用户指令改写选中段落，只输出修订后的段落正文，不要输出解释、前后缀、寒暄、代码块或标题。',
    '修订必须保持原报告的专业语气，保留必要的事实、金额、主体名称、法律/估值/风险口径；如果指令要求补充，请在原段落基础上补强，不要编造未给出的外部事实。',
    '',
    '【项目背景】',
    `项目名称：${project.name}`,
    `客户名称：${project.customerName}`,
    `项目类型：${project.projectType}`,
    `债务主体：${project.debtorName}`,
    `债权金额：${project.totalDebt} 万元`,
    `抵质押物：${project.collateralType}`,
    `抵押物估值：${project.collateralEstValue} 万元`,
    `当前报告版本：v${record.version}`,
    record.analysisId ? `关联 analysisId：${record.analysisId}` : '',
    '',
    '【用户微调指令】',
    instruction.trim(),
    '',
    '【选中原文】',
    selectedText.trim(),
    '',
    '【修订后段落】',
  ].filter(Boolean).join('\n');

  const reply = await askHermes({
    prompt,
    sessionId: `amc-tune-${project.id}-${record.id}`,
    conversationTitle: `AMC段落微调-${project.name}`,
  });
  const tunedText = cleanHermesTunedText(reply);
  if (!tunedText) throw new Error('Hermes tuning response was empty');
  return tunedText;
}

async function generateTuningSuggestionsWithHermes(project: AMCProject, record: EvaluationRecord, selectedText: string, count = 5) {
  const suggestionCount = Math.max(3, Math.min(7, Math.round(Number(count) || 5)));
  const prompt = [
    '你是 AMC 不良资产评估报告的 Hermes 段落精修推荐 Agent。',
    `请针对用户选中的报告片段，生成约 ${suggestionCount} 条可直接点击使用的段落微调推荐词。`,
    '推荐词必须贴合 AMC 尽调/法律合规/估值/风控语境，短、明确、可执行。',
    '只输出 JSON，不要输出解释、Markdown、代码块或寒暄。',
    '',
    'JSON 格式：',
    '[{"label":"不超过10字的按钮文案","text":"一条完整的微调指令"}]',
    '',
    '【项目背景】',
    `项目名称：${project.name}`,
    `客户名称：${project.customerName}`,
    `项目类型：${project.projectType}`,
    `债务主体：${project.debtorName}`,
    `债权金额：${project.totalDebt} 万元`,
    `抵质押物：${project.collateralType}`,
    `抵押物估值：${project.collateralEstValue} 万元`,
    `当前报告版本：v${record.version}`,
    '',
    '【选中原文】',
    selectedText.trim().slice(0, 3000),
  ].join('\n');

  const reply = await askHermes({
    prompt,
    sessionId: `amc-tune-suggestions-${project.id}-${record.id}-${Date.now()}`,
    conversationTitle: `AMC段落微调推荐-${project.name}`,
  });
  const suggestions = parseHermesTuningSuggestions(reply);
  if (!suggestions.length) throw new Error('Hermes tuning suggestions response was empty');
  return suggestions.slice(0, suggestionCount);
}

function cleanHermesTunedText(value: string) {
  return value
    .replace(/^```(?:markdown|md|text)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^【?修订后段落】?[：:]\s*/i, '')
    .trim();
}

function parseHermesTuningSuggestions(value: string) {
  const cleaned = value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const arrayText = cleaned.startsWith('[')
    ? cleaned
    : cleaned.slice(cleaned.indexOf('['), cleaned.lastIndexOf(']') + 1);
  const parsed = JSON.parse(arrayText);
  const rawItems = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
  return rawItems
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as { label?: unknown; text?: unknown };
      const label = typeof record.label === 'string' ? record.label.trim() : '';
      const text = typeof record.text === 'string' ? record.text.trim() : '';
      if (!label || !text) return null;
      return {
        label: label.slice(0, 20),
        text: text.slice(0, 300),
      };
    })
    .filter(Boolean) as Array<{ label: string; text: string }>;
}

function replaceSelectedText(originalContent: string, selectedText: string, tunedText: string, instruction: string) {
  if (originalContent.includes(selectedText)) return originalContent.replace(selectedText, tunedText);
  const cleanSelected = selectedText.trim();
  if (originalContent.includes(cleanSelected)) return originalContent.replace(cleanSelected, tunedText);
  const line = cleanSelected.split('\n').map(item => item.trim()).find(item => item.length > 15 && originalContent.includes(item));
  if (line) return originalContent.replace(line, `${line}\n\n**Hermes微调修订**：${tunedText}`);
  return `${originalContent}\n\n---\n\n### Hermes智能微调修订反馈响应\n> 针对原文片段：${selectedText.slice(0, 100)}...\n\n> 修订指令：${instruction}\n\n${tunedText}`;
}

function stringFromFields(body: Partial<AMCProject>, fields: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = fields[key] ?? (body as Record<string, unknown>)[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
}

function numberFromFields(body: Partial<AMCProject>, fields: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = fields[key] ?? (body as Record<string, unknown>)[key];
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

type HermesRunFailureSnapshot = { status: string; output?: unknown; lastEvent?: string };

async function readHermesRunFailureSnapshot(runId: string): Promise<HermesRunFailureSnapshot | null> {
  try {
    const run = await getHermesRun(runId);
    return {
      status: run.status,
      output: run.output,
      lastEvent: typeof run.last_event === 'string' ? run.last_event : undefined,
    };
  } catch {
    return null;
  }
}

function buildHermesRunStreamFailureEvent(error: unknown, snapshot: HermesRunFailureSnapshot | null): HermesEvent {
  const errorMessage = error instanceof Error ? error.message : '未知错误';
  if (snapshot && /^requires_action$/i.test(snapshot.status) && /Hermes run event stream failed with 404/i.test(errorMessage)) {
    return {
      type: 'analysis.requires_action',
      message: 'Hermes Agent 需要人工授权后继续。',
    };
  }
  if (snapshot && /^(queued|running|in_progress)$/i.test(snapshot.status) && /Hermes run event stream failed with 404/i.test(errorMessage)) {
    return {
      type: 'hermes.tool.progress',
      toolName: 'Hermes 事件流',
      label: '分析进度连接暂时无法续订，当前过程已保留并将继续尝试恢复。',
    };
  }
  return {
    type: 'analysis.failed',
    message: '分析进度连接中断，Hermes Agent API 暂不可用。',
  };
}

const server = Bun.serve({
  port,
  idleTimeout: serverIdleTimeout,
  fetch: app.fetch,
});

console.log(`AMC Agent API listening on ${server.url} (idleTimeout=${serverIdleTimeout}s)`);
