import { describe, expect, test } from 'bun:test';
import { extractReportMarkdownS3Uri } from './hermes';
import {
  buildMinioProjectUploadMarkdownUri,
  buildMinioImageAssetPath,
  parseMinioImagePath,
  parseMinioImageS3Uri,
  parseMinioReportPath,
  parseMinioReportS3Uri,
  uploadMinioProjectMarkdown,
} from './minio-assets';

process.env.MINIO_BUCKET = 'xfas';
process.env.MINIO_ENDPOINT = 'http://minio.local:9000';
process.env.MINIO_ACCESS_KEY = 'test-access-key';
process.env.MINIO_SECRET_KEY = 'test-secret-key';

describe('MinIO report and image URI helpers', () => {
  test('accepts current AMC image and report paths from Hermes output', () => {
    const image = parseMinioImageS3Uri('s3://xfas/amc-images/rpt-123/risk.png');
    expect(image?.rptId).toBe('rpt-123');
    expect(image?.imageId).toBe('risk.png');
    expect(image?.key).toBe('amc-images/rpt-123/risk.png');

    const report = parseMinioReportS3Uri('s3://xfas/amc-reports/rpt-123/opinion.md');
    expect(report?.rptId).toBe('rpt-123');
    expect(report?.reportId).toBe('opinion.md');
    expect(report?.key).toBe('amc-reports/rpt-123/opinion.md');
  });

  test('keeps backward compatibility with earlier xfas images and reports paths', () => {
    expect(parseMinioImageS3Uri('s3://xfas/xfas/images/rpt-123/status.png')?.imageId).toBe('status.png');
    expect(parseMinioReportS3Uri('s3://xfas/xfas/reports/rpt-123/opinion.md')?.reportId).toBe('opinion.md');
  });

  test('builds local proxy paths for browser rendering', () => {
    expect(buildMinioImageAssetPath('s3://xfas/amc-images/rpt-123/risk.png'))
      .toBe('/api/assets/minio/images/rpt-123/risk.png');
    expect(parseMinioImagePath('rpt-123', 'risk.png')?.key).toBe('amc-images/rpt-123/risk.png');
    expect(parseMinioReportPath('rpt-123', 'opinion.md')?.key).toBe('amc-reports/rpt-123/opinion.md');
  });

  test('extracts current AMC report URI from completed Hermes output', () => {
    const output = [
      '报告已生成。',
      '![风险等级](s3://xfas/amc-images/rpt-123/risk.png)',
      '文档：s3://xfas/amc-reports/rpt-123/opinion.md',
    ].join('\n');

    expect(extractReportMarkdownS3Uri(output)).toBe('s3://xfas/amc-reports/rpt-123/opinion.md');
  });

  test('uploads converted project markdown to amc-upload path', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedInit = init;
      return new Response('', { status: 200 });
    };

    expect(buildMinioProjectUploadMarkdownUri('proj-123', 'file-456')).toBe('s3://xfas/amc-upload/proj-123/file-456.md');

    const result = await uploadMinioProjectMarkdown({
      projectId: 'proj-123',
      fileId: 'file-456',
      markdown: '# 项目资料\n\n表格内容',
      fetcher,
    });

    expect(result.uri).toBe('s3://xfas/amc-upload/proj-123/file-456.md');
    expect(result.key).toBe('amc-upload/proj-123/file-456.md');
    expect(capturedUrl).toBe('http://minio.local:9000/xfas/amc-upload/proj-123/file-456.md');
    expect(capturedInit?.method).toBe('PUT');
    expect(capturedInit?.headers).toHaveProperty('Authorization');
    expect(capturedInit?.headers).toHaveProperty('Content-Type', 'text/markdown;charset=utf-8');
  });
});
