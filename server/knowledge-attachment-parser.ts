import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

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
