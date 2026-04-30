import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies before importing the module
const mockGetText = vi.fn();
const mockDestroy = vi.fn();
vi.mock('pdf-parse', () => {
  const MockPDFParse = vi.fn(function (this: Record<string, unknown>) {
    this.getText = mockGetText;
    this.destroy = mockDestroy;
  }) as unknown;
  return { PDFParse: MockPDFParse };
});

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
  extractRawText: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = function (this: Record<string, unknown>) {
    this.messages = { create: vi.fn() };
  } as unknown as new (...args: unknown[]) => unknown;
  return { default: MockAnthropic };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        download: vi.fn(),
      }),
    },
  }),
}));

// Set environment variables before importing module
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

import {
  extractTextFromFile,
  buildSummarizePrompt,
  buildMatchingPrompt,
  POST,
} from '../analyze-schoolplan';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

describe('extractTextFromFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns text for PDF buffer', async () => {
    mockGetText.mockResolvedValue({ text: 'PDF text content', total: 5, pages: [] });
    mockDestroy.mockResolvedValue(undefined);

    const buffer = Buffer.from('fake pdf');
    const result = await extractTextFromFile(buffer, 'schoolplan.pdf');

    expect(result.text).toBe('PDF text content');
    expect(result.pageCount).toBe(5);
    expect(PDFParse).toHaveBeenCalledWith({ data: buffer });
  });

  it('returns text for DOCX buffer', async () => {
    // Dynamic import resolves the module namespace — mock the named export
    const mammothModule = await import('mammoth');
    const mockExtract = vi.mocked(mammothModule.extractRawText);
    mockExtract.mockResolvedValue({ value: 'DOCX text content', messages: [] });

    const buffer = Buffer.from('fake docx');
    const result = await extractTextFromFile(buffer, 'schoolplan.docx');

    expect(result.text).toBe('DOCX text content');
    expect(result.pageCount).toBeNull();
    expect(mockExtract).toHaveBeenCalledWith({ buffer });
  });

  it('returns text for TXT buffer', async () => {
    const buffer = Buffer.from('Plain text content');
    const result = await extractTextFromFile(buffer, 'schoolplan.txt');

    expect(result.text).toBe('Plain text content');
    expect(result.pageCount).toBeNull();
  });

  it('throws for unsupported extensions (xlsx, csv)', async () => {
    const buffer = Buffer.from('data');

    await expect(extractTextFromFile(buffer, 'data.xlsx')).rejects.toThrow(
      'Niet-ondersteund bestandsformaat',
    );
    await expect(extractTextFromFile(buffer, 'data.csv')).rejects.toThrow(
      'Niet-ondersteund bestandsformaat',
    );
  });
});

describe('buildSummarizePrompt', () => {
  it('includes instruction to classify whether document is a school document', () => {
    const prompt = buildSummarizePrompt();

    expect(prompt).toContain('schooldocument');
    expect(prompt).toContain('isSchoolplan');
    expect(prompt).toContain('Schoolgids');
    // Should instruct to detect non-relevant documents
    expect(prompt.toLowerCase()).toMatch(/niet relevant|false/);
  });
});

describe('buildMatchingPrompt', () => {
  it('includes MODULE_CATALOG module names and MODULE_DIFFERENTIATORS data', () => {
    const prompt = buildMatchingPrompt('Summary text', ['thema 1', 'thema 2']);

    // Should include module names from MODULE_CATALOG dynamically
    expect(prompt).toContain('Reken-Wiskunde');
    expect(prompt).toContain('Nederlands');
    expect(prompt).toContain('Engels');
    expect(prompt).toContain('Cognitieve capaciteitentoets');

    // Should include differentiator data
    expect(prompt).toContain('Remediering');
    expect(prompt).toContain('dia');
    expect(prompt).toContain('jij');
  });

  it('includes school context (levels, selectedModules) when provided', () => {
    const prompt = buildMatchingPrompt(
      'Summary text',
      ['thema 1'],
      {
        levels: ['havo', 'vwo'],
        selectedModules: ['rekenwiskunde', 'nederlands'],
      },
    );

    expect(prompt).toContain('havo');
    expect(prompt).toContain('vwo');
    expect(prompt).toContain('rekenwiskunde');
    expect(prompt).toContain('nederlands');
  });
});

describe('POST handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SKIP_AUTH;
    delete process.env.VERCEL_ENV;
  });

  it('returns 401 without auth header when SKIP_AUTH is not true', async () => {
    process.env.SKIP_AUTH = 'false';

    const request = new Request('http://localhost/api/analyze-schoolplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storagePath: 'test/path', fileName: 'test.pdf' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('skips auth when SKIP_AUTH is true (even if VERCEL_ENV is production)', async () => {
    process.env.SKIP_AUTH = 'true';
    process.env.VERCEL_ENV = 'production';

    const request = new Request('http://localhost/api/analyze-schoolplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storagePath: 'test/path', fileName: 'test.pdf' }),
    });

    const response = await POST(request);
    // Auth is skipped — request proceeds past auth check.
    // It will fail downstream (storage download returns no data), yielding 500.
    expect(response.status).not.toBe(401);
  });

  it('returns 400 when storagePath is missing', async () => {
    process.env.SKIP_AUTH = 'true';

    const request = new Request('http://localhost/api/analyze-schoolplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName: 'test.pdf' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
