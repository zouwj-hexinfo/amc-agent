import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import type { KnowledgeAttachmentPreview, KnowledgeItem } from '../src/types';

export type ParsedKnowledgeAttachment = {
  parseStatus: 'parsed' | 'failed';
  parsedText?: string;
  parseError?: string;
};

const textExtensions = new Set(['txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'log']);
const maxTextLength = 200_000;

export async function parseKnowledgeAttachmentFile(file: File): Promise<ParsedKnowledgeAttachment> {
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type.toLowerCase();

    if (textExtensions.has(extension) || mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('csv')) {
      return parsed(new TextDecoder('utf-8', { fatal: false }).decode(bytes));
    }

    if (extension === 'docx' || mimeType.includes('wordprocessingml.document')) {
      const result = await mammoth.extractRawText({ buffer: bytes });
      return parsed(result.value);
    }

    if (extension === 'xlsx' || extension === 'xls' || mimeType.includes('spreadsheetml') || mimeType.includes('excel')) {
      const workbook = XLSX.read(bytes, { type: 'buffer' });
      const text = workbook.SheetNames.map(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        return [`# ${sheetName}`, XLSX.utils.sheet_to_csv(sheet)].join('\n');
      }).join('\n\n');
      return parsed(text);
    }

    if (extension === 'pdf' || mimeType.includes('pdf')) {
      const pdfParse = await import('pdf-parse');
      const parse = (pdfParse.default || pdfParse) as unknown as (input: Buffer) => Promise<{ text?: string }>;
      const result = await parse(bytes);
      return parsed(result.text || '');
    }

    return failed(`暂不支持的附件格式：${extension || mimeType || 'unknown'}`);
  } catch (error) {
    return failed(error instanceof Error ? error.message : '附件解析失败');
  }
}

export async function previewKnowledgeAttachmentFiles(files: File[]): Promise<KnowledgeAttachmentPreview> {
  const parsedFiles = await Promise.all(files.map(async file => {
    const parsed = await parseKnowledgeAttachmentFile(file);
    return {
      file,
      parsed,
      text: parsed.parsedText || '',
    };
  }));
  const parsedText = parsedFiles.map(item => item.text).filter(Boolean).join('\n\n');
  const title = inferTitle(parsedFiles[0]?.file.name || '', parsedText);
  const tags = inferTags(`${title}\n${parsedText}`);
  const source = inferSource(parsedText);
  const category = inferCategory(`${title}\n${tags.join(' ')}\n${parsedText}`);
  const content = buildPreviewContent(parsedFiles);

  return {
    title,
    category,
    tags,
    source,
    content,
    files: parsedFiles.map(({ file, parsed, text }) => ({
      fileName: file.name || '未命名附件',
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      parseStatus: parsed.parseStatus,
      parseError: parsed.parseError,
      parsedTextExcerpt: text ? excerpt(text, 280) : undefined,
    })),
  };
}

export function mergeHermesKnowledgeAttachmentPreview(
  fallback: KnowledgeAttachmentPreview,
  hermesText: string,
): KnowledgeAttachmentPreview {
  const parsed = parseHermesPreviewJson(hermesText);
  if (!parsed) return fallback;
  return {
    ...fallback,
    title: cleanField(parsed.title) || fallback.title,
    tags: normalizeHermesTags(parsed.tags).length ? normalizeHermesTags(parsed.tags) : fallback.tags,
    source: cleanField(parsed.source) || fallback.source,
    content: cleanField(parsed.content) || fallback.content,
  };
}

function parsed(value: string): ParsedKnowledgeAttachment {
  const text = value.replace(/\u0000/g, '').trim();
  if (!text) return failed('未能从附件中解析出文本内容');
  return {
    parseStatus: 'parsed',
    parsedText: text.length > maxTextLength ? `${text.slice(0, maxTextLength)}\n...[内容已截断]` : text,
  };
}

function failed(message: string): ParsedKnowledgeAttachment {
  return {
    parseStatus: 'failed',
    parseError: message,
  };
}

function inferTitle(fileName: string, text: string) {
  const heading = text
    .split(/\r?\n/)
    .map(line => line.replace(/^#+\s*/, '').trim())
    .find(line => line.length >= 4 && line.length <= 80 && !/^[,，;；\d\s]+$/.test(line) && !isAgencyLine(line) && !/^(颁布单位|发布单位|发文单位|数据源|来源)[：:]/.test(line));
  if (heading) return heading;
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || '未命名知识文档';
}

function isAgencyLine(line: string) {
  return Boolean(inferSource(line) && line.length <= 30);
}

function inferSource(text: string) {
  const explicit = text.match(/(?:颁布单位|发布单位|发文单位|数据源|来源)[：:\s]+([^\n\r]{2,40})/);
  if (explicit?.[1]) return explicit[1].trim();
  const agencies = [
    '最高人民法院',
    '国家金融监督管理总局',
    '中国银保监会',
    '中国证监会',
    '财政部',
    '国家发展改革委',
    '自然资源部',
    '住房和城乡建设部',
    '上海金融监督管理局',
    '上海市地方金融管理局',
  ];
  return agencies.find(agency => text.includes(agency));
}

function inferCategory(text: string): KnowledgeItem['category'] {
  if (/反馈|修订|微调|纠正/.test(text)) return 'feedback';
  if (/行业|产业|制造|机械|设备|周期/.test(text)) return 'industry';
  if (/估值|评估|收益法|折现|测算|公式|LTV/i.test(text)) return 'methodology';
  if (/市场|价格|行情|折扣|司法拍卖|空置|去化/.test(text)) return 'market';
  if (/案例|重组案|处置案例|经验/.test(text)) return 'cases';
  if (/内规|制度|准入|限额|敞口|审批/.test(text)) return 'internal_policies';
  if (/法律|民法典|抵押权|查封|诉讼|顺位|担保/.test(text)) return 'legal';
  return 'policies';
}

function inferTags(text: string) {
  const rules = [
    '政策法规',
    '抵押权',
    '轮候查封',
    '司法拍卖',
    '顺位',
    'LTV',
    '估值',
    '折扣',
    '空置',
    '风险准入',
    '行业周期',
    '重组案例',
    '内控制度',
    '工程款优先权',
    '债权转让',
  ];
  const matches = rules.filter(tag => text.toLowerCase().includes(tag.toLowerCase()));
  if (matches.length) return matches.slice(0, 8);
  return text
    .replace(/[，。、“”‘’；：！？（）【】《》]/g, ' ')
    .split(/\s+/)
    .map(item => item.trim())
    .filter(item => item.length >= 2 && item.length <= 12)
    .slice(0, 6);
}

function buildPreviewContent(parsedFiles: Array<{ file: File; parsed: ParsedKnowledgeAttachment; text: string }>) {
  return parsedFiles.map(({ file, parsed, text }) => {
    if (parsed.parseStatus === 'failed') return `【附件 ${file.name}】\n解析失败：${parsed.parseError || '未知错误'}`;
    return `【附件 ${file.name}】\n${excerpt(text, 1200)}`;
  }).join('\n\n');
}

function excerpt(text: string, limit: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? `${clean.slice(0, limit)}...` : clean;
}

function parseHermesPreviewJson(value: string) {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]) as unknown;
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function cleanField(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeHermesTags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map(tag => tag.trim()).filter(Boolean).slice(0, 10);
  if (typeof value === 'string') return value.split(/[、,，\s]+/).map(tag => tag.trim()).filter(Boolean).slice(0, 10);
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
