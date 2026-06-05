import { describe, expect, test } from 'bun:test';
import * as XLSX from 'xlsx';
import type { AgentDomain, AgentRole, AgentWorkGroup, AgentWorkItem, KnowledgeAttachment, KnowledgeWriteSuggestionReview, MarketObject, ProjectFile, ReportRevision } from '../src/types';
import { mergeHermesKnowledgeAttachmentPreview, parseKnowledgeAttachmentFile, previewKnowledgeAttachmentFiles } from './knowledge-attachment-parser';

process.env.XFAS_ANALYSIS_DB_PATH = ':memory:';

const store = await import('./store');

describe('knowledge item maintenance store helpers', () => {
  test('creates, updates, lists, and deletes knowledge items with attachments', () => {
    const item = store.upsertKnowledgeItem({
      id: 'kn-test-maintenance',
      category: 'legal',
      title: '测试知识条目',
      content: '抵押权顺位测试内容',
      tags: ['抵押权'],
      source: '测试',
    });

    expect(item.id).toBe('kn-test-maintenance');
    expect(store.getKnowledgeItem(item.id)?.title).toBe('测试知识条目');

    const attachment: KnowledgeAttachment = {
      id: 'att-test-maintenance',
      knowledgeId: item.id,
      fileName: '顺位说明.txt',
      mimeType: 'text/plain',
      size: 12,
      parseStatus: 'parsed',
      parsedText: '附件中的轮候查封知识',
      uploadedAt: '2026-06-02T00:00:00.000Z',
    };
    store.upsertKnowledgeAttachment(attachment);

    const withAttachment = store.getKnowledgeItem(item.id);
    expect(withAttachment?.attachments?.[0].parsedText).toContain('轮候查封');
    expect(store.searchKnowledgeItems({ q: '轮候查封' }).some(result => result.id === item.id)).toBe(true);

    expect(store.deleteKnowledgeAttachment(item.id, attachment.id)).toBe(true);
    expect(store.getKnowledgeItem(item.id)?.attachments).toHaveLength(0);
    expect(store.deleteKnowledgeItem(item.id)).toBe(true);
    expect(store.getKnowledgeItem(item.id)).toBeNull();
  });
});

describe('project file and report revision store helpers', () => {
  test('persists parsed project files and report revisions', () => {
    const project = store.upsertProject({
      id: 'proj-test-files',
      name: '测试文件项目',
      customerName: '测试客户',
      projectType: 'NPA_ACQUISITION',
      debtorName: '测试债务人',
      totalDebt: 1000,
      collateralType: '抵押物',
      collateralEstValue: 800,
      status: 'Draft',
      description: '测试',
      createdAt: '2026-06-02T00:00:00.000Z',
      updatedAt: '2026-06-02T00:00:00.000Z',
      files: [],
      evaluations: {},
    });

    const file: ProjectFile = {
      id: 'file-test-parsed',
      name: '尽调.txt',
      size: 12,
      type: 'initial',
      uploadedAt: '2026-06-02T00:00:00.000Z',
      contentSnippet: '真实解析文本',
      mimeType: 'text/plain',
      parseStatus: 'parsed',
      parsedText: '真实解析文本全文',
    };
    store.upsertProjectFile(project.id, file);
    expect(store.listProjectFiles(project.id)[0].parsedText).toContain('全文');
    expect(store.deleteProjectFile(project.id, file.id)).toBe(true);

    const revision: ReportRevision = {
      id: 'rev-test-maintenance',
      projectId: project.id,
      recordId: 'eval-test',
      originalText: '原文',
      tunedText: '修订后',
      instruction: '优化',
      createdAt: '2026-06-02T00:00:00.000Z',
      category: 'orchestrator',
      originalContentSnapshot: '原始报告',
    };
    store.upsertReportRevision(revision);
    expect(store.listReportRevisions({ projectId: project.id })).toHaveLength(1);
    expect(store.deleteReportRevision(revision.id)).toBe(true);
    expect(store.listReportRevisions({ projectId: project.id })).toHaveLength(0);
  });
});

describe('market object store helpers', () => {
  test('upserts, deletes, and resets market objects', () => {
    const object: MarketObject = {
      id: 'market-test-maintenance',
      name: '测试市场对象',
      description: '测试结构化对象',
      fields: [{ key: 'name', label: '名称', type: 'string' }],
      rows: [{ id: 'row-test', name: '测试行' }],
    };

    store.upsertMarketObject(object);
    expect(store.getMarketObject(object.id)?.rows).toHaveLength(1);
    expect(store.deleteMarketObject(object.id)).toBe(true);
    expect(store.getMarketObject(object.id)).toBeNull();

    const reset = store.resetMarketObjects();
    expect(reset.length).toBeGreaterThan(0);
    expect(reset[0].rows.length).toBeGreaterThan(0);
  });
});

describe('agent configuration store helpers', () => {
  test('seeds domains, roles, work groups, and work items', () => {
    const bundle = store.getAgentConfigBundle();
    expect(bundle.domains.some(item => item.code === 'NPA_ACQUISITION')).toBe(true);
    expect(bundle.roles.some(item => item.agentType === 'industry')).toBe(true);
    expect(bundle.workGroups.some(item => item.name === '合规审查')).toBe(true);
    expect(bundle.workItems.some(item => item.name === '新业务合规审查')).toBe(true);
  });

  test('upserts and soft-deletes agent config records', () => {
    const now = '2026-06-04T00:00:00.000Z';
    const domain: AgentDomain = {
      id: 'domain-test-agent-config',
      code: 'TEST_AGENT_CONFIG',
      label: '测试领域',
      themeColor: 'indigo',
      fields: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    store.upsertAgentDomain(domain);
    expect(store.getAgentDomain(domain.id)?.label).toBe('测试领域');

    const role: AgentRole = {
      id: 'role-test-agent-config',
      domainId: domain.id,
      agentType: 'law_review',
      name: '测试法务专家',
      role: '测试职责',
      defaultTemperature: 0.1,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    store.upsertAgentRole(role);

    const group: AgentWorkGroup = {
      id: 'group-test-agent-config',
      domainId: domain.id,
      roleId: role.id,
      name: '测试工作组',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    store.upsertAgentWorkGroup(group);

    const item: AgentWorkItem = {
      id: 'workitem-test-agent-config',
      domainId: domain.id,
      roleId: role.id,
      groupId: group.id,
      name: '测试工作项',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      definition: {
        workSteps: ['检查资料完整性'],
        knowledgeItemIds: ['kn-1'],
        outputTemplate: '# 测试模板',
        systemPrompt: '系统提示词',
        userPrompt: '用户提示词',
        tools: ['knowledge_search'],
        skills: ['测试技能'],
      },
    };
    store.upsertAgentWorkItem(item);
    expect(store.getAgentWorkItem(item.id)?.definition.knowledgeItemIds).toContain('kn-1');

    expect(store.deleteAgentWorkItem(item.id)?.id).toBe(item.id);
    expect(store.getAgentWorkItem(item.id)).toBeNull();
    expect(store.deleteAgentWorkGroup(group.id)?.status).toBe('inactive');
    expect(store.deleteAgentRole(role.id)?.status).toBe('inactive');
    expect(store.deleteAgentDomain(domain.id)?.status).toBe('inactive');
  });
});

describe('knowledge write suggestion review store helpers', () => {
  test('lists and updates Hermes suggestions from analysis metadata', () => {
    const suggestion: KnowledgeWriteSuggestionReview = {
      id: 'sugg-test-maintenance',
      analysisId: 'analysis-test-maintenance',
      runId: 'run-test-maintenance',
      category: 'feedback',
      title: '测试建议',
      content: '建议沉淀内容',
      tags: ['建议'],
      status: 'pending',
      createdAt: '2026-06-02T00:00:00.000Z',
    };

    store.createAnalysisRecord({
      analysisId: 'analysis-test-maintenance',
      prompt: { company: '测试', year: 2026, reportType: 'test', request: 'test' },
      runId: 'run-test-maintenance',
      metadata: { knowledgeWriteSuggestions: [suggestion] },
    });

    expect(store.listKnowledgeWriteSuggestions().some(item => item.id === suggestion.id)).toBe(true);
    expect(store.updateKnowledgeWriteSuggestionStatus(suggestion.id, 'rejected')?.status).toBe('rejected');
  });
});

describe('knowledge attachment parser', () => {
  test('parses text files', async () => {
    const file = new File(['轮候查封与抵押权顺位'], 'legal.txt', { type: 'text/plain' });
    const result = await parseKnowledgeAttachmentFile(file);
    expect(result.parseStatus).toBe('parsed');
    expect(result.parsedText).toContain('轮候查封');
  });

  test('parses xlsx files', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['城市', '折扣'], ['上海', 45]]), '市场');
    const data = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const file = new File([data], 'market.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const result = await parseKnowledgeAttachmentFile(file);
    expect(result.parseStatus).toBe('parsed');
    expect(result.parsedText).toContain('上海');
  });

  test('marks unsupported files as failed', async () => {
    const file = new File(['binary'], 'image.bin', { type: 'application/octet-stream' });
    const result = await parseKnowledgeAttachmentFile(file);
    expect(result.parseStatus).toBe('failed');
  });

  test('previews files and infers form fields', async () => {
    const file = new File(['最高人民法院\n轮候查封与抵押权顺位规则\n司法拍卖折扣说明'], '抵押顺位规则.txt', { type: 'text/plain' });
    const preview = await previewKnowledgeAttachmentFiles([file]);

    expect(preview.title).toContain('轮候查封');
    expect(preview.source).toBe('最高人民法院');
    expect(preview.tags).toContain('抵押权');
    expect(preview.content).toContain('司法拍卖折扣说明');
    expect(preview.files[0].parseStatus).toBe('parsed');
  });

  test('merges Hermes extracted preview fields', async () => {
    const fallback = await previewKnowledgeAttachmentFiles([
      new File(['附件原始文本'], 'fallback.txt', { type: 'text/plain' }),
    ]);
    const merged = mergeHermesKnowledgeAttachmentPreview(fallback, JSON.stringify({
      title: 'Hermes 提取标题',
      tags: ['司法拍卖', '抵押权'],
      source: 'Hermes 数据源',
      content: 'Hermes 提取的备注信息',
    }));

    expect(merged.title).toBe('Hermes 提取标题');
    expect(merged.tags).toEqual(['司法拍卖', '抵押权']);
    expect(merged.source).toBe('Hermes 数据源');
    expect(merged.content).toBe('Hermes 提取的备注信息');
  });
});
