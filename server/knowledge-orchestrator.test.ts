import { describe, expect, test } from 'bun:test';
import type { AMCProject, KnowledgeItem } from '../src/types';
import {
  buildKnowledgeRetrievalPlan,
  buildKnowledgeRetrievalPlanFromRequest,
  buildKnowledgeSearchResponse,
  formatKnowledgeContext,
  parseHermesKnowledgeProtocol,
  retrieveKnowledge,
} from './knowledge-orchestrator';

const project: AMCProject = {
  id: 'proj-test',
  name: '上海商办抵押不良资产评估',
  customerName: '测试资管',
  projectType: 'NPA_ACQUISITION',
  debtorName: '上海测试实业有限公司',
  totalDebt: 12000,
  collateralType: '空置写字楼底商',
  collateralEstValue: 9000,
  status: 'Active',
  description: '存在轮候查封、司法拍卖折扣和空置去化风险。',
  createdAt: '2026-06-02T00:00:00.000Z',
  updatedAt: '2026-06-02T00:00:00.000Z',
  files: [
    {
      id: 'file-test',
      name: '尽调摘要.txt',
      size: 100,
      type: 'DD_Report',
      uploadedAt: '2026-06-02T00:00:00.000Z',
      contentSnippet: '抵押权顺位待核验，租金流水已经断缴。',
    },
  ],
  evaluations: {},
};

const knowledgeItems: KnowledgeItem[] = [
  {
    id: 'kn-legal',
    category: 'legal',
    title: '轮候查封与抵押权顺位核验',
    content: '轮候查封会影响抵押权实现路径，应结合首封法院和工程款优先权核验。',
    tags: ['轮候查封', '抵押权', '顺位'],
    source: '法律知识库',
  },
  {
    id: 'kn-market',
    category: 'market',
    title: '空置商办司法拍卖折扣',
    content: '空置商办资产在司法拍卖中通常需要考虑租金断缴、去化周期和处置折扣。',
    tags: ['空置', '司法拍卖', '折扣'],
    source: '市场数据库',
  },
  {
    id: 'kn-industry',
    category: 'industry',
    title: '制造行业周期研究',
    content: '制造行业设备折旧与环保政策会影响工业资产流动性。',
    tags: ['制造', '周期'],
    source: '行业知识库',
  },
];

describe('buildKnowledgeRetrievalPlan', () => {
  test('uses canonical defaults and keyword-triggered categories', () => {
    const plan = buildKnowledgeRetrievalPlan(project, 'law_review', '核验诉讼和查封风险');

    expect(plan.source).toBe('pre_run');
    expect(plan.categories).toContain('policies');
    expect(plan.categories).toContain('legal');
    expect(plan.categories).toContain('methodology');
    expect(plan.categories).toContain('internal_policies');
    expect(plan.categories).toContain('market');
    expect(plan.categories).toContain('cases');
    expect(plan.categories).not.toContain('legal_knowledge');
  });

  test('adds agent-specific categories', () => {
    expect(buildKnowledgeRetrievalPlan(project, 'evaluation', '').categories).toContain('market');
    expect(buildKnowledgeRetrievalPlan(project, 'industry', '').categories).toContain('industry');
    expect(buildKnowledgeRetrievalPlan(project, 'risk_review', '').categories).toContain('cases');
  });
});

describe('retrieveKnowledge', () => {
  test('scores title and tag matches ahead of weaker matches', () => {
    const plan = buildKnowledgeRetrievalPlanFromRequest({
      type: 'knowledge_search',
      query: '轮候查封 抵押权 顺位',
      categories: ['legal', 'cases'],
      limit: 5,
      reason: '核验顺位判断',
    });

    const citations = retrieveKnowledge(plan, knowledgeItems);

    expect(citations[0].id).toBe('kn-legal');
    expect(citations[0].score).toBeGreaterThan(citations[1]?.score || 0);
    expect(citations).toHaveLength(1);
  });

  test('enforces limit and returns empty results for no match', () => {
    const empty = retrieveKnowledge({
      categories: ['industry'],
      keywords: ['完全不存在的关键词'],
      limit: 2,
      reason: '测试',
      source: 'hermes_protocol_request',
    }, knowledgeItems);

    expect(empty).toHaveLength(0);

    const limited = retrieveKnowledge({
      categories: ['legal', 'market', 'industry'],
      keywords: ['司法拍卖', '制造', '轮候查封'],
      limit: 2,
      reason: '测试',
      source: 'hermes_protocol_request',
    }, knowledgeItems);

    expect(limited).toHaveLength(2);
  });
});

describe('formatKnowledgeContext', () => {
  test('preserves citation ids and empty-result note', () => {
    const citations = retrieveKnowledge({
      categories: ['legal'],
      keywords: ['轮候查封'],
      limit: 5,
      reason: '测试',
      source: 'pre_run',
    }, knowledgeItems);

    expect(formatKnowledgeContext(citations)).toContain('[kn-legal]');
    expect(formatKnowledgeContext([])).toContain('本次未检索到本地知识依据');
  });

  test('formats search response with citation ids', () => {
    const citations = retrieveKnowledge({
      categories: ['market'],
      keywords: ['司法拍卖'],
      limit: 5,
      reason: '测试',
      source: 'hermes_protocol_request',
    }, knowledgeItems);

    expect(buildKnowledgeSearchResponse(citations)).toContain('[kn-market]');
  });
});

describe('parseHermesKnowledgeProtocol', () => {
  test('parses valid search and write suggestion blocks', () => {
    const text = [
      '```json',
      '{"type":"knowledge_search","query":"轮候查封 抵押权","categories":["legal","cases"],"limit":5,"reason":"核验"}',
      '```',
      '```json',
      '{"type":"knowledge_write_suggestion","category":"feedback","title":"空置折扣经验","content":"空置率会影响司法拍卖折扣。","tags":["空置","折扣"],"reason":"复用"}',
      '```',
    ].join('\n');

    const results = parseHermesKnowledgeProtocol(text);

    expect(results).toHaveLength(2);
    expect(results[0].kind).toBe('search');
    expect(results[1].kind).toBe('write_suggestion');
  });

  test('returns errors for malformed JSON and invalid categories', () => {
    const malformed = parseHermesKnowledgeProtocol('```json\n{"type":"knowledge_search",\n```');
    const invalid = parseHermesKnowledgeProtocol('```json\n{"type":"knowledge_search","query":"x","categories":["legal_knowledge"]}\n```');

    expect(malformed[0].kind).toBe('error');
    expect(invalid[0].kind).toBe('error');
  });

  test('extracts protocol text from event-like objects', () => {
    const results = parseHermesKnowledgeProtocol({
      type: 'hermes.output.delta',
      text: '```json\n{"type":"knowledge_search","query":"司法拍卖","categories":["market"],"limit":3}\n```',
    });

    expect(results[0].kind).toBe('search');
  });
});
