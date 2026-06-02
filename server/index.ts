import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import type { AMCProject, AgentType, EvaluationRecord, KnowledgeItem, MarketObject, ProjectFile, ProjectType } from '../src/types';
import type { StartAnalysisRequest } from '../src/hermes/types';
import { createAnalysisEventHub } from './analysis-event-hub';
import {
  addEvaluationRecord,
  appendAnalysisEvent,
  createAnalysisRecord,
  deleteKnowledgeAttachment,
  deleteKnowledgeItem,
  deleteMarketObject,
  generateAnalysisId,
  getKnowledgeItem,
  getAnalysisRecord,
  getLatestAnalysisRecord,
  getMarketObject,
  getProject,
  listKnowledgeAttachments,
  listKnowledgeItems,
  listKnowledgeWriteSuggestions,
  listMarketObjects,
  listProjects,
  listRecentAnalysisRecords,
  resetMarketObjects,
  searchKnowledgeItems,
  updateKnowledgeWriteSuggestionStatus,
  upsertKnowledgeAttachment,
  upsertKnowledgeItem,
  upsertMarketObject,
  upsertProject,
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
} from './minio-assets';
import {
  buildKnowledgeRetrievalPlan,
  formatKnowledgeContext,
  retrieveKnowledge,
} from './knowledge-orchestrator';
import { parseKnowledgeAttachmentFile } from './knowledge-attachment-parser';

const app = new Hono();
const hermesAvailable = process.env.HERMES_AGENT_DISABLED !== '1';
const port = Number(process.env.PORT || 3100);

const analysisEventHub = createAnalysisEventHub({
  getRecord: getAnalysisRecord,
  appendEvent: appendAnalysisEvent,
  streamRunEvents: (runId, signal) => streamHermesRunEvents(runId, signal),
  buildFailureEvent: async (error, runId) => buildHermesRunStreamFailureEvent(error, await readHermesRunFailureSnapshot(runId)),
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
    records: listRecentAnalysisRecords(Number.isFinite(limit) ? limit : 6).map(analysisResponse),
  });
});

app.get('/api/analysis/:id', (c) => {
  const record = getAnalysisRecord(c.req.param('id'));
  if (!record) return c.json({ message: '未找到该分析记录。' }, 404);
  return c.json(analysisResponse(record));
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

  const stream = new ReadableStream({
    start(controller) {
      unsubscribe = analysisEventHub.subscribe(analysisId, afterSequence, item => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(item)}\n\n`));
      });
      if (record.runId) analysisEventHub.ensureWatching(analysisId);
    },
    cancel() {
      unsubscribe?.();
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
  const body = await c.req.json<Partial<ProjectFile>>();
  const newFile: ProjectFile = {
    id: body.id || `file-${Date.now()}`,
    name: body.name || '未命名文档.txt',
    size: Number(body.size) || 2048,
    type: body.type || 'Other',
    uploadedAt: new Date().toISOString(),
    contentSnippet: body.contentSnippet || '此文件包含该资产标的或抵质押登记的权属信息、租约及流水核对数据。',
  };
  project.files = [...(project.files || []), newFile];
  project.status = project.status === 'Draft' ? 'DataCollected' : project.status;
  project.updatedAt = new Date().toISOString();
  upsertProject(project);
  return c.json(newFile, 201);
});

app.delete('/api/projects/:id/files/:fileId', (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  project.files = project.files.filter(file => file.id !== c.req.param('fileId'));
  project.updatedAt = new Date().toISOString();
  upsertProject(project);
  return c.json({ success: true });
});

app.post('/api/projects/:id/evaluate', async (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  if (!hermesAvailable) return c.json({ message: 'Hermes Agent API 暂不可用，评估任务未启动。' }, 503);

  const body = await c.req.json<{
    agentType?: AgentType;
    selectedSkills?: string[];
    orchestratorMode?: 'single' | 'chain' | 'discuss' | 'master-slave';
    userInstruction?: string;
  }>();
  const mode = body.orchestratorMode || 'single';
  const skills = body.selectedSkills || [];
  const analysisId = generateAnalysisId();
  const targetAgentKey = mode !== 'single' ? 'orchestrator' : (body.agentType || 'law_review');
  const knowledgePlan = buildKnowledgeRetrievalPlan(project, targetAgentKey, body.userInstruction || '');
  const knowledgeCitations = retrieveKnowledge(knowledgePlan, listKnowledgeItems());
  const knowledgeContext = formatKnowledgeContext(knowledgeCitations);
  const activeKbs = knowledgePlan.categories;
  const prompt: StartAnalysisRequest = {
    company: project.name,
    year: new Date().getFullYear(),
    reportType: 'amc_evaluation',
    request: body.userInstruction || `启动 ${project.name} 的 Hermes AMC 多Agent协作评估`,
  };

  let run;
  try {
    run = await createHermesRun({
      input: buildAmcRunInput(project, activeKbs, body.userInstruction, knowledgeContext),
      sessionId: `amc-analysis-${analysisId}`,
      instructions: buildAmcEvaluationRunInstructions(),
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
      project.updatedAt = new Date().toISOString();
      upsertProject(project);
      return c.json({ success: true, isHermes: true, record: foundEval, feedbackItem, tunedText });
    }
  }

  return c.json({ error: 'Evaluation record not found' }, 404);
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
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) return c.json({ error: 'Missing multipart file field named file' }, 400);
  const maxSize = Number(process.env.KNOWLEDGE_ATTACHMENT_MAX_BYTES || 10 * 1024 * 1024);
  if (file.size > maxSize) return c.json({ error: `File exceeds ${maxSize} byte limit` }, 413);

  const parsed = await parseKnowledgeAttachmentFile(file);
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

function analysisResponse(record: NonNullable<ReturnType<typeof getAnalysisRecord>>) {
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

function buildAmcRunInput(project: AMCProject, activeKbs: string[], userInstruction?: string, knowledgeContext?: string) {
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
    project.files?.length ? `附件摘要：\n${project.files.map(file => `- ${file.name}: ${file.contentSnippet}`).join('\n')}` : '',
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

function cleanHermesTunedText(value: string) {
  return value
    .replace(/^```(?:markdown|md|text)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^【?修订后段落】?[：:]\s*/i, '')
    .trim();
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

type HermesRunFailureSnapshot = { status: string; lastEvent?: string };

async function readHermesRunFailureSnapshot(runId: string): Promise<HermesRunFailureSnapshot | null> {
  try {
    const run = await getHermesRun(runId);
    return {
      status: run.status,
      lastEvent: typeof run.last_event === 'string' ? run.last_event : undefined,
    };
  } catch {
    return null;
  }
}

function buildHermesRunStreamFailureEvent(error: unknown, snapshot: HermesRunFailureSnapshot | null): HermesEvent {
  const errorMessage = error instanceof Error ? error.message : '未知错误';
  if (snapshot && /^(queued|running|in_progress|requires_action)$/i.test(snapshot.status) && /Hermes run event stream failed with 404/i.test(errorMessage)) {
    return {
      type: 'analysis.stream_interrupted',
      message: '分析进度连接暂时无法续订，当前过程已保留。可以稍后恢复或重新运行。',
    };
  }
  return {
    type: 'analysis.failed',
    message: '分析进度连接中断，Hermes Agent API 暂不可用。',
  };
}

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`AMC Agent API listening on ${server.url}`);
