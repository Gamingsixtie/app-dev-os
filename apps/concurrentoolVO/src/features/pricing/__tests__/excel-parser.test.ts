import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcelToRows, validateExcelInput } from '../import/excel-parser';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Build a real .xlsx ArrayBuffer in-memory from a 2D matrix using the xlsx library. */
function buildXlsxArrayBuffer(matrix: (string | number)[][]): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer | Uint8Array;
  return out instanceof Uint8Array ? out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) : out;
}

describe('validateExcelInput', () => {
  it('verwerpt null/undefined input met NL foutmelding', () => {
    expect(validateExcelInput(undefined as unknown as File)).toEqual({
      valid: false,
      error: 'Geen bestand geselecteerd',
    });
    expect(validateExcelInput(null as unknown as File)).toEqual({
      valid: false,
      error: 'Geen bestand geselecteerd',
    });
  });

  it('accepteert een geldig .xlsx-bestand', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'prijzen.xlsx', { type: XLSX_MIME });
    expect(validateExcelInput(file)).toEqual({ valid: true });
  });

  it('verwerpt verkeerde extensie met NL foutmelding die ".xlsx" noemt', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'foo.pdf', { type: 'application/pdf' });
    const result = validateExcelInput(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/\.xlsx/);
  });

  it('verwerpt bestanden groter dan 5MB met NL foutmelding', () => {
    // Build a 6MB buffer
    const sixMb = new Uint8Array(6 * 1024 * 1024);
    const file = new File([sixMb], 'big.xlsx', { type: XLSX_MIME });
    const result = validateExcelInput(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/groot|5MB/);
  });
});

describe('parseExcelToRows', () => {
  it('werpt NL foutmelding bij leeg buffer (xlsx synthesizes an empty sheet)', () => {
    const empty = new ArrayBuffer(0);
    // xlsx is permissive: empty buffer → workbook with one empty row.
    // Parser guard catches "no content" and throws a Dutch error.
    expect(() => parseExcelToRows(empty)).toThrow(/leeg/i);
  });

  it('werpt NL foutmelding wanneer alle cellen leeg zijn (whitespace-only telt als leeg)', () => {
    // Build an .xlsx with just whitespace cells — should be rejected.
    const matrix = [['  ', '\t', '   ']];
    const buf = buildXlsxArrayBuffer(matrix);
    expect(() => parseExcelToRows(buf)).toThrow(/leeg/i);
  });

  it('leest een echte .xlsx ArrayBuffer met headers + rijen correct', () => {
    const matrix = [
      ['Module', 'Prijs'],
      ['rekenwiskunde', 8.5],
      ['nederlands', 7.98],
    ];
    const buf = buildXlsxArrayBuffer(matrix);
    const rows = parseExcelToRows(buf);
    expect(rows.length).toBe(3);
    expect(rows[0]).toEqual(['Module', 'Prijs']);
    expect(rows[1][0]).toBe('rekenwiskunde');
    // Numeric cells stringified — that is the documented contract.
    expect(rows[1][1]).toBe('8.5');
    expect(rows[2][0]).toBe('nederlands');
    expect(rows[2][1]).toBe('7.98');
  });

  it('stringificeert alle cellen — getallen worden strings, lege cellen worden ""', () => {
    const matrix = [
      ['A', 'B', 'C'],
      ['x', 1, ''],
    ];
    const buf = buildXlsxArrayBuffer(matrix);
    const rows = parseExcelToRows(buf);
    expect(rows[1][0]).toBe('x');
    expect(rows[1][1]).toBe('1');
    expect(rows[1][2]).toBe('');
  });
});
