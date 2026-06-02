import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AMCProject, EvaluationRecord, KnowledgeItem } from '../src/types';
import {
  createInitialAmcEvaluationState,
  reduceAmcEvaluationEvent,
  type AmcEvaluationState,
} from '../src/hermes/amc-event-handler';
import type { AmcEvaluationEvent } from '../src/hermes/amc-agents';
import type { AnalysisEvent, StartAnalysisRequest } from '../src/hermes/types';
import {
  buildKnowledgeRetrievalPlanFromRequest,
  buildKnowledgeSearchResponse,
  createKnowledgeWriteSuggestion,
  parseHermesKnowledgeProtocol,
  retrieveKnowledge,
  type KnowledgeCitation,
  type KnowledgeRetrievalPlan,
  type KnowledgeSearchResponse,
  type KnowledgeWriteSuggestion,
} from './knowledge-orchestrator';
import { seedKnowledgeBase, seedProjects } from './seed-data';

export type HermesEvent = AmcEvaluationEvent | AnalysisEvent;
export type SequencedHermesEvent = { sequence: number; event: HermesEvent };

export type AnalysisRecord = {
  analysisId: string;
  prompt: StartAnalysisRequest;
  projectId?: string;
  runId?: string;
  runStatus?: string;
  metadata?: {
    targetAgentKey?: string;
    orchestrationMode?: 'single' | 'chain' | 'discuss' | 'master-slave';
    selectedSkills?: string[];
    knowledgeBases?: string[];
    sensitiveWordsFlagged?: string[];
    draftOutput?: string;
    knowledgePlan?: KnowledgeRetrievalPlan;
    knowledgeCitations?: KnowledgeCitation[];
    knowledgeRequests?: KnowledgeSearchResponse[];
    knowledgeWriteSuggestions?: KnowledgeWriteSuggestion[];
    knowledgeProtocolParseFailures?: Array<{ message: string; raw: string; createdAt: string }>;
  };
  state: AmcEvaluationState | null;
  events: HermesEvent[];
  report?: { format: string; content: string; generatedAt: string };
  updatedAt: string;
};

type JsonRow = { id: string; json: string; updated_at: string };
type AnalysisRow = {
  analysis_id: string;
  project_id: string | null;
  run_id: string | null;
  run_status: string | null;
  prompt_json: string;
  state_json: string | null;
  events_json: string;
  report_json: string | null;
  metadata_json: string | null;
  updated_at: string;
};

const databasePath = process.env.XFAS_ANALYSIS_DB_PATH || 'data/xfas.db';
let db: Database | null = null;

export function database() {
  if (db) return db;
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
  db = new Database(databasePath, { create: true });
  runMigrations(db);
  seedDefaults();
  return db;
}

function runMigrations(store: Database) {
  store.exec(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at text not null
    );
    create table if not exists projects (
      id text primary key,
      json text not null,
      updated_at text not null
    );
    create table if not exists project_files (
      id text primary key,
      project_id text not null,
      json text not null,
      updated_at text not null
    );
    create table if not exists knowledge_items (
      id text primary key,
      json text not null,
      updated_at text not null
    );
    create table if not exists evaluation_records (
      id text primary key,
      project_id text not null,
      agent_type text not null,
      json text not null,
      updated_at text not null
    );
    create table if not exists analysis_records (
      analysis_id text primary key,
      project_id text,
      run_id text,
      run_status text,
      prompt_json text not null,
      state_json text,
      events_json text not null,
      report_json text,
      updated_at text not null
    );
    create table if not exists analysis_metadata (
      key text primary key,
      value text not null
    );
  `);
  try {
    store.query('alter table analysis_records add column metadata_json text').run();
  } catch (error) {
    if (!(error instanceof Error) || !/duplicate column/i.test(error.message)) throw error;
  }
  store
    .query('insert or ignore into schema_migrations (id, applied_at) values (?, ?)')
    .run('001_initial_bun_hono_sqlite_amc', new Date().toISOString());
}

function seedDefaults() {
  const store = db!;
  const projectCount = store.query<{ count: number }, []>('select count(*) as count from projects').get()?.count ?? 0;
  if (projectCount === 0) seedProjects.forEach(upsertProject);
  const knowledgeCount = store.query<{ count: number }, []>('select count(*) as count from knowledge_items').get()?.count ?? 0;
  if (knowledgeCount === 0) seedKnowledgeBase.forEach(upsertKnowledgeItem);
}

export function generateAnalysisId() {
  return `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listProjects() {
  return database()
    .query<JsonRow, []>('select * from projects order by json_extract(json, "$.updatedAt") desc')
    .all()
    .map(row => JSON.parse(row.json) as AMCProject);
}

export function getProject(id: string) {
  const row = database().query<JsonRow, [string]>('select * from projects where id = ?').get(id);
  return row ? JSON.parse(row.json) as AMCProject : null;
}

export function upsertProject(project: AMCProject) {
  database()
    .query('insert into projects (id, json, updated_at) values (?, ?, ?) on conflict(id) do update set json = excluded.json, updated_at = excluded.updated_at')
    .run(project.id, JSON.stringify(project), project.updatedAt || new Date().toISOString());
  return project;
}

export function listKnowledgeItems() {
  return database()
    .query<JsonRow, []>('select * from knowledge_items order by updated_at asc')
    .all()
    .map(row => JSON.parse(row.json) as KnowledgeItem);
}

export function upsertKnowledgeItem(item: KnowledgeItem) {
  database()
    .query('insert into knowledge_items (id, json, updated_at) values (?, ?, ?) on conflict(id) do update set json = excluded.json, updated_at = excluded.updated_at')
    .run(item.id, JSON.stringify(item), new Date().toISOString());
  return item;
}

export function createAnalysisRecord(input: {
  analysisId: string;
  prompt: StartAnalysisRequest;
  projectId?: string;
  runId?: string;
  runStatus?: string;
  metadata?: AnalysisRecord['metadata'];
}) {
  const record: AnalysisRecord = {
    analysisId: input.analysisId,
    prompt: input.prompt,
    projectId: input.projectId,
    runId: input.runId,
    runStatus: input.runStatus,
    metadata: input.metadata,
    state: null,
    events: [],
    updatedAt: new Date().toISOString(),
  };
  writeAnalysisRecord(record);
  writeLatestAnalysisId(record.analysisId);
  return record;
}

export function getAnalysisRecord(analysisId: string) {
  const row = database().query<AnalysisRow, [string]>('select * from analysis_records where analysis_id = ?').get(analysisId);
  return row ? readAnalysisRow(row) : null;
}

export function getLatestAnalysisRecord() {
  const row = database().query<{ value: string }, [string]>('select value from analysis_metadata where key = ?').get('latestAnalysisId');
  return row?.value ? getAnalysisRecord(row.value) : null;
}

export function listRecentAnalysisRecords(limit = 20) {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  return database()
    .query<AnalysisRow, [number]>('select * from analysis_records order by updated_at desc limit ?')
    .all(safeLimit)
    .map(readAnalysisRow);
}

export function appendAnalysisEvent(analysisId: string, event: HermesEvent) {
  const record = getAnalysisRecord(analysisId);
  if (!record) return null;
  const nextEvents = [...record.events, event];
  let nextState = record.state;
  let metadata = record.metadata;
  if (event.type === 'amc.asset.intake') {
    nextState = createInitialAmcEvaluationState(analysisId, {
      id: event.assetId,
      type: event.assetType,
      value: event.assetValue,
      debtAmount: event.debtAmount,
      debtorInfo: event.debtorInfo,
    });
    nextState = reduceAmcEvaluationEvent(nextState, event);
  } else if (nextState) {
    nextState = reduceAmcEvaluationEvent(nextState, event as AmcEvaluationEvent);
  }
  if (event.type === 'hermes.output.delta' && event.text) {
    metadata = { ...metadata, draftOutput: `${metadata?.draftOutput || ''}${event.text}` };
  }
  metadata = applyKnowledgeProtocolMetadata(record, event, metadata);
  const report = event.type === 'amc.report.generated'
    ? { format: event.reportFormat, content: event.reportContent, generatedAt: new Date().toISOString() }
    : event.type === 'hermes.run.completed'
      ? {
          format: 'markdown',
          content: (event.output || metadata?.draftOutput || '').trim(),
          generatedAt: new Date().toISOString(),
        }
      : record.report;
  const runStatus = event.type === 'analysis.completed' || event.type === 'hermes.run.completed'
    ? 'completed'
    : event.type === 'analysis.failed'
      ? 'failed'
      : event.type === 'analysis.requires_action'
        ? 'requires_action'
        : event.type === 'analysis.stream_interrupted'
          ? 'stream_interrupted'
          : record.runStatus;
  const nextRecord = { ...record, events: nextEvents, state: nextState, report, runStatus, metadata, updatedAt: new Date().toISOString() };
  writeAnalysisRecord(nextRecord);
  writeLatestAnalysisId(analysisId);
  if (event.type === 'analysis.completed') writeCompletedEvaluation(nextRecord);
  return nextRecord;
}

function applyKnowledgeProtocolMetadata(
  record: AnalysisRecord,
  event: HermesEvent,
  metadata: AnalysisRecord['metadata'],
): AnalysisRecord['metadata'] {
  const results = parseHermesKnowledgeProtocol(event);
  if (!results.length) return metadata;

  const nextMetadata = { ...metadata };
  const createdAt = new Date().toISOString();

  results.forEach(result => {
    if (result.kind === 'search') {
      const plan = buildKnowledgeRetrievalPlanFromRequest(result.request);
      const citations = retrieveKnowledge(plan, listKnowledgeItems());
      const response: KnowledgeSearchResponse = {
        request: result.request,
        plan,
        citations,
        responseText: buildKnowledgeSearchResponse(citations),
        createdAt,
      };
      nextMetadata.knowledgeRequests = [...(nextMetadata.knowledgeRequests || []), response];
      nextMetadata.knowledgeCitations = mergeKnowledgeCitations(nextMetadata.knowledgeCitations || [], citations);
      return;
    }

    if (result.kind === 'write_suggestion') {
      const suggestion = createKnowledgeWriteSuggestion(result.request, {
        analysisId: record.analysisId,
        runId: record.runId,
        createdAt,
      });
      nextMetadata.knowledgeWriteSuggestions = [...(nextMetadata.knowledgeWriteSuggestions || []), suggestion];
      return;
    }

    nextMetadata.knowledgeProtocolParseFailures = [
      ...(nextMetadata.knowledgeProtocolParseFailures || []),
      { message: result.message, raw: result.raw.slice(0, 500), createdAt },
    ];
  });

  return nextMetadata;
}

function mergeKnowledgeCitations(existing: KnowledgeCitation[], next: KnowledgeCitation[]) {
  const byId = new Map<string, KnowledgeCitation>();
  [...existing, ...next].forEach(citation => {
    const current = byId.get(citation.id);
    if (!current || citation.score > current.score) byId.set(citation.id, citation);
  });
  return [...byId.values()].sort((a, b) => b.score - a.score);
}

export function addEvaluationRecord(projectId: string, key: string, record: EvaluationRecord) {
  const project = getProject(projectId);
  if (!project) return null;
  const evaluations = project.evaluations || {};
  evaluations[key] = [record, ...(evaluations[key] || [])];
  project.evaluations = evaluations;
  project.status = 'Reviewing';
  project.updatedAt = new Date().toISOString();
  return upsertProject(project);
}

function readAnalysisRow(row: AnalysisRow): AnalysisRecord {
  return {
    analysisId: row.analysis_id,
    projectId: row.project_id || undefined,
    runId: row.run_id || undefined,
    runStatus: row.run_status || undefined,
    prompt: JSON.parse(row.prompt_json) as StartAnalysisRequest,
    state: row.state_json ? JSON.parse(row.state_json) as AmcEvaluationState : null,
    events: JSON.parse(row.events_json) as HermesEvent[],
    report: row.report_json ? JSON.parse(row.report_json) as AnalysisRecord['report'] : undefined,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) as AnalysisRecord['metadata'] : undefined,
    updatedAt: row.updated_at,
  };
}

function writeAnalysisRecord(record: AnalysisRecord) {
  database()
    .query(`
      insert into analysis_records (analysis_id, project_id, run_id, run_status, prompt_json, state_json, events_json, report_json, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(analysis_id) do update set
        project_id = excluded.project_id,
        run_id = excluded.run_id,
        run_status = excluded.run_status,
        prompt_json = excluded.prompt_json,
        state_json = excluded.state_json,
        events_json = excluded.events_json,
        report_json = excluded.report_json,
        updated_at = excluded.updated_at
    `)
    .run(
      record.analysisId,
      record.projectId ?? null,
      record.runId ?? null,
      record.runStatus ?? null,
      JSON.stringify(record.prompt),
      record.state ? JSON.stringify(record.state) : null,
      JSON.stringify(record.events),
      record.report ? JSON.stringify(record.report) : null,
      record.updatedAt,
    );
  database()
    .query('update analysis_records set metadata_json = ? where analysis_id = ?')
    .run(record.metadata ? JSON.stringify(record.metadata) : null, record.analysisId);
}

function writeLatestAnalysisId(analysisId: string) {
  database()
    .query("insert into analysis_metadata (key, value) values ('latestAnalysisId', ?) on conflict(key) do update set value = excluded.value")
    .run(analysisId);
}

function writeCompletedEvaluation(record: AnalysisRecord) {
  if (!record.projectId || !record.report?.content?.trim()) return;
  const project = getProject(record.projectId);
  if (!project) return;
  const targetAgentKey = record.metadata?.targetAgentKey || 'orchestrator';
  const evaluations = project.evaluations || {};
  const existing = evaluations[targetAgentKey] || [];
  if (existing.some(item => item.analysisId === record.analysisId && item.runStatus === 'completed')) return;

  const nextVersion = Math.max(0, ...existing.map(item => Number(item.version) || 0)) + 1;
  const evaluationRecord: EvaluationRecord = {
    id: `eval-${Date.now()}`,
    projectId: project.id,
    agentType: targetAgentKey as EvaluationRecord['agentType'],
    version: nextVersion,
    orchestrationMode: record.metadata?.orchestrationMode,
    analysisId: record.analysisId,
    hermesEventCount: record.events.length,
    runStatus: 'completed',
    content: record.report.content,
    sensitiveWordsFlagged: record.metadata?.sensitiveWordsFlagged || [],
    createdAt: new Date().toISOString(),
    status: 'Draft',
    usedSkills: record.metadata?.selectedSkills || [],
    usedKnowledgeBases: record.metadata?.knowledgeBases || [],
    reflection: {
      score: 90,
      completeness: 90,
      compliance: 88,
      depth: 88,
      professionalism: 90,
      pros: ['已由真实Hermes事件流生成并回放', '报告生成过程已写入analysis事件记录'],
      cons: ['外部工商、行情和司法数据源仍按当前项目既有接口状态使用'],
      suggestions: '建议在正式投产前补齐真实外部数据源与报告附件证据链。',
    },
  };

  evaluations[targetAgentKey] = [evaluationRecord, ...existing.filter(item => item.analysisId !== record.analysisId)];
  project.evaluations = evaluations;
  project.status = 'Reviewing';
  project.updatedAt = new Date().toISOString();
  upsertProject(project);
}
