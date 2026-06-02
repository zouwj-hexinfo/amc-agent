import type { AMCProject, AgentType, KnowledgeItem } from '../src/types';

export type KnowledgeCategory = KnowledgeItem['category'];

export type KnowledgeRetrievalPlan = {
  categories: KnowledgeCategory[];
  keywords: string[];
  limit: number;
  reason: string;
  source: 'pre_run' | 'hermes_protocol_request';
};

export type KnowledgeCitation = {
  id: string;
  category: KnowledgeCategory;
  title: string;
  source?: string;
  tags: string[];
  snippet: string;
  score: number;
};

export type KnowledgeWriteSuggestion = {
  id: string;
  analysisId?: string;
  runId?: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'invalid';
  createdAt: string;
};

export type KnowledgeSearchRequest = {
  type: 'knowledge_search';
  query: string;
  categories: KnowledgeCategory[];
  limit: number;
  reason?: string;
};

export type KnowledgeWriteSuggestionRequest = {
  type: 'knowledge_write_suggestion';
  category: KnowledgeCategory;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  reason?: string;
};

export type KnowledgeProtocolParseResult =
  | { kind: 'search'; request: KnowledgeSearchRequest; raw: string }
  | { kind: 'write_suggestion'; request: KnowledgeWriteSuggestionRequest; raw: string }
  | { kind: 'error'; message: string; raw: string };

export type KnowledgeSearchResponse = {
  request: KnowledgeSearchRequest;
  plan: KnowledgeRetrievalPlan;
  citations: KnowledgeCitation[];
  responseText: string;
  createdAt: string;
};

const canonicalCategories = [
  'policies',
  'legal',
  'market',
  'cases',
  'methodology',
  'internal_policies',
  'industry',
  'feedback',
] as const satisfies KnowledgeCategory[];

const defaultCategories: KnowledgeCategory[] = ['policies', 'legal', 'methodology', 'internal_policies'];

const keywordRules: Array<{ category: KnowledgeCategory; pattern: RegExp }> = [
  { category: 'policies', pattern: /政策|法规|合规|规章|准入|国资|竞价|融资|平台|条例|监管|红线/i },
  { category: 'legal', pattern: /法律|民法典|担保|抵押|权属|纠纷|诉讼|保全|查封|轮候|顺位|工程款/i },
  { category: 'market', pattern: /市场|价格|行情|折扣|商办|写字楼|底商|空置|重置|变现|清偿|拍卖|ltv|估值|价值|回收/i },
  { category: 'cases', pattern: /案例|经验|借鉴|司法|重组案|整合|处置|风险|冻结/i },
  { category: 'methodology', pattern: /评估方法|收益法|折现|折现率|还原率|公式|计算|算法|测算|公允/i },
  { category: 'internal_policies', pattern: /公司内规|内规|内控制度|制度|敞口|极值|门槛|限额|额度|白名单/i },
  { category: 'industry', pattern: /行业|工业|制造|机械|机电|特种设备|环保|折旧|周期|去化|产业/i },
  { category: 'feedback', pattern: /反馈|修改|微调|修订|痕迹|纠正|人工作业/i },
];

const domainKeywords = [
  '轮候查封',
  '司法拍卖',
  '抵押权',
  '顺位',
  '工程款优先权',
  '空置',
  '折扣',
  '去化',
  '租金',
  'LTV',
  '估值',
  '收益法',
  '折现率',
  '风险',
  '准入',
  '内规',
  '国资',
  '债权转让',
  '重组',
  '制造',
  '行业',
];

export function isKnowledgeCategory(value: unknown): value is KnowledgeCategory {
  return typeof value === 'string' && (canonicalCategories as readonly string[]).includes(value);
}

export function buildKnowledgeRetrievalPlan(
  project: AMCProject,
  agentType: AgentType,
  instruction = '',
): KnowledgeRetrievalPlan {
  const text = textFields([
    project.name,
    project.customerName,
    project.debtorName,
    project.projectType,
    project.collateralType,
    project.description,
    instruction,
    ...(project.files || []).map(file => `${file.name} ${file.type} ${file.contentSnippet}`),
  ]);
  const categories = new Set<KnowledgeCategory>(defaultCategories);

  if (agentType === 'evaluation') categories.add('market');
  if (agentType === 'industry') categories.add('industry');
  if (agentType === 'risk_review') categories.add('cases');

  keywordRules.forEach(rule => {
    if (rule.pattern.test(text)) categories.add(rule.category);
  });

  const keywords = extractKeywords(text);
  return {
    categories: [...categories],
    keywords,
    limit: 8,
    reason: `根据项目资料、${agentType} Agent 与用户指令自动选择 ${[...categories].join('、')}。`,
    source: 'pre_run',
  };
}

export function buildKnowledgeRetrievalPlanFromRequest(request: KnowledgeSearchRequest): KnowledgeRetrievalPlan {
  return {
    categories: request.categories.length ? request.categories : [...defaultCategories],
    keywords: extractKeywords(request.query),
    limit: clampLimit(request.limit),
    reason: request.reason || `Hermes 请求补充检索：${request.query}`,
    source: 'hermes_protocol_request',
  };
}

export function retrieveKnowledge(plan: KnowledgeRetrievalPlan, items: KnowledgeItem[]): KnowledgeCitation[] {
  const keywords = plan.keywords.map(normalizeText).filter(Boolean);
  const categories = new Set(plan.categories);

  return items
    .map(item => {
      const score = scoreKnowledgeItem(item, keywords, categories);
      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, clampLimit(plan.limit))
    .map(({ item, score }) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      source: item.source,
      tags: normalizeTags(item.tags),
      snippet: buildSnippet(searchableKnowledgeText(item), plan.keywords),
      score,
    }));
}

export function formatKnowledgeContext(citations: KnowledgeCitation[]) {
  if (!citations.length) return [
    '【本地知识库检索】',
    '本次未检索到本地知识依据，请区分事实、推断和待核查事项。',
  ].join('\n');

  return [
    '【本地知识库检索】',
    '以下为后端从应用主知识库自动检索出的参考知识。若实质使用，请在报告相关段落或参考知识清单中标注知识ID。',
    ...citations.map((citation, index) => [
      `${index + 1}. [${citation.id}] ${citation.title}`,
      `   分类：${citation.category}`,
      citation.source ? `   来源：${citation.source}` : '',
      citation.tags.length ? `   标签：${citation.tags.join('、')}` : '',
      `   摘要：${citation.snippet}`,
    ].filter(Boolean).join('\n')),
  ].join('\n');
}

export function buildKnowledgeSearchResponse(citations: KnowledgeCitation[]) {
  if (!citations.length) return [
    '【知识补充响应】',
    '未检索到匹配的本地知识条目。请继续区分事实、推断和待核查事项。',
  ].join('\n');

  return [
    '【知识补充响应】',
    '以下为本地知识库补充检索结果。若使用，请保留知识ID。',
    ...citations.map(citation => `- [${citation.id}] ${citation.title}（${citation.category}${citation.source ? `，${citation.source}` : ''}）：${citation.snippet}`),
  ].join('\n');
}

export function parseHermesKnowledgeProtocol(textOrEvent: unknown): KnowledgeProtocolParseResult[] {
  const text = extractProtocolText(textOrEvent);
  if (!text) return [];
  return extractJsonBlocks(text).map(raw => parseProtocolBlock(raw));
}

export function createKnowledgeWriteSuggestion(
  request: KnowledgeWriteSuggestionRequest,
  input: { analysisId?: string; runId?: string; createdAt?: string } = {},
): KnowledgeWriteSuggestion {
  const valid = isKnowledgeCategory(request.category) && Boolean(request.title.trim()) && Boolean(request.content.trim());
  return {
    id: `kws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    analysisId: input.analysisId,
    runId: input.runId,
    category: request.category,
    title: request.title.trim(),
    content: request.content.trim(),
    tags: normalizeTags(request.tags),
    source: request.source || 'Hermes Agent 建议',
    reason: request.reason,
    status: valid ? 'pending' : 'invalid',
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function parseProtocolBlock(raw: string): KnowledgeProtocolParseResult {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return { kind: 'error', message: '知识协议 JSON 必须是对象。', raw };
    if (parsed.type === 'knowledge_search') return parseSearchRequest(parsed, raw);
    if (parsed.type === 'knowledge_write_suggestion') return parseWriteSuggestionRequest(parsed, raw);
    return { kind: 'error', message: '知识协议 type 不受支持。', raw };
  } catch (error) {
    return {
      kind: 'error',
      message: error instanceof Error ? `知识协议 JSON 解析失败：${error.message}` : '知识协议 JSON 解析失败。',
      raw,
    };
  }
}

function parseSearchRequest(payload: Record<string, unknown>, raw: string): KnowledgeProtocolParseResult {
  const query = stringValue(payload.query);
  if (!query) return { kind: 'error', message: 'knowledge_search 缺少 query。', raw };
  const categories = arrayValue(payload.categories).filter(isKnowledgeCategory);
  const invalidCategories = arrayValue(payload.categories).filter(item => !isKnowledgeCategory(item));
  if (invalidCategories.length) return { kind: 'error', message: `knowledge_search 包含非法分类：${invalidCategories.join('、')}。`, raw };
  return {
    kind: 'search',
    raw,
    request: {
      type: 'knowledge_search',
      query,
      categories,
      limit: clampLimit(numberValue(payload.limit) ?? 5),
      reason: stringValue(payload.reason),
    },
  };
}

function parseWriteSuggestionRequest(payload: Record<string, unknown>, raw: string): KnowledgeProtocolParseResult {
  const category = stringValue(payload.category);
  if (!isKnowledgeCategory(category)) return { kind: 'error', message: `knowledge_write_suggestion 包含非法分类：${category || '空' }。`, raw };
  return {
    kind: 'write_suggestion',
    raw,
    request: {
      type: 'knowledge_write_suggestion',
      category,
      title: stringValue(payload.title) || '',
      content: stringValue(payload.content) || '',
      tags: normalizeTags(arrayValue(payload.tags).map(String)),
      source: stringValue(payload.source),
      reason: stringValue(payload.reason),
    },
  };
}

function scoreKnowledgeItem(item: KnowledgeItem, keywords: string[], categories: Set<KnowledgeCategory>) {
  let matchScore = 0;
  const title = normalizeText(item.title);
  const content = normalizeText(searchableKnowledgeText(item));
  const source = normalizeText(item.source || '');
  const tags = normalizeTags(item.tags).map(normalizeText);

  keywords.forEach(keyword => {
    if (!keyword) return;
    if (title.includes(keyword)) matchScore += 12;
    if (tags.some(tag => tag.includes(keyword) || keyword.includes(tag))) matchScore += 9;
    if (source.includes(keyword)) matchScore += 4;
    if (content.includes(keyword)) matchScore += 3;
  });

  if (!keywords.length) return categories.has(item.category) ? 2 : 0;
  if (!matchScore) return 0;
  return matchScore + (categories.has(item.category) ? 6 : 0);
}

function searchableKnowledgeText(item: KnowledgeItem) {
  return [
    item.content,
    ...(item.attachments || [])
      .filter(attachment => attachment.parseStatus === 'parsed' && attachment.parsedText)
      .map(attachment => `【附件 ${attachment.fileName}】\n${attachment.parsedText}`),
  ].join('\n\n');
}

function buildSnippet(content: string, keywords: string[]) {
  const clean = content.replace(/\s+/g, ' ').trim();
  const normalized = normalizeText(clean);
  const match = keywords.map(normalizeText).filter(Boolean).find(keyword => normalized.includes(keyword));
  if (!match) return truncate(clean, 180);
  const index = normalized.indexOf(match);
  const start = Math.max(0, index - 60);
  return truncate(clean.slice(start), 180);
}

function extractKeywords(value: string) {
  const domainMatches = domainKeywords.filter(keyword => value.toLowerCase().includes(keyword.toLowerCase()));
  const compact = value
    .replace(/[，。、“”‘’；：！？（）【】《》]/g, ' ')
    .replace(/[^\p{Script=Han}A-Za-z0-9_\-\s]/gu, ' ')
    .split(/\s+/)
    .map(item => item.trim())
    .filter(item => item.length >= 2);
  return [...new Set([...domainMatches, ...compact])].slice(0, 24);
}

function extractProtocolText(textOrEvent: unknown): string {
  if (typeof textOrEvent === 'string') return textOrEvent;
  if (!isRecord(textOrEvent)) return '';
  return [
    stringValue(textOrEvent.text),
    stringValue(textOrEvent.output),
    stringValue(textOrEvent.message),
    stringValue(textOrEvent.snippet),
    stringValue(textOrEvent.action),
    stringValue(textOrEvent.reportContent),
  ].filter(Boolean).join('\n');
}

function extractJsonBlocks(text: string) {
  const blocks: string[] = [];
  const fenced = /```(?:json)?\s*([\s\S]*?)```/gi;
  for (const match of text.matchAll(fenced)) {
    const block = match[1]?.trim();
    if (block && block.includes('"type"') && block.includes('knowledge_')) blocks.push(block);
  }
  const trimmed = text.trim();
  if (!blocks.length && trimmed.startsWith('{') && trimmed.includes('"type"') && trimmed.includes('knowledge_')) blocks.push(trimmed);
  return blocks;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String).map(tag => tag.trim()).filter(Boolean);
  if (typeof tags === 'string') return tags.split(/[、,，\s]+/).map(tag => tag.trim()).filter(Boolean);
  return [];
}

function textFields(values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function clampLimit(value: number) {
  return Math.max(1, Math.min(20, Math.floor(Number.isFinite(value) ? value : 5)));
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
