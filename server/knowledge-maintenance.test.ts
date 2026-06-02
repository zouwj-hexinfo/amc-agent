import { describe, expect, test } from 'bun:test';
import * as XLSX from 'xlsx';
import type { KnowledgeAttachment, KnowledgeWriteSuggestionReview, MarketObject } from '../src/types';
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
