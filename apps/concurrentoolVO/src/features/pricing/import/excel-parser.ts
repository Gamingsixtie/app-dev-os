/**
 * Excel parser for AI Excel-import (Phase 26-04, Task 2).
 *
 * Pure wrapper around the `xlsx` library. Two responsibilities:
 *   1. `validateExcelInput(file)` — quick client-side sanity check before reading.
 *   2. `parseExcelToRows(buffer)` — read the first sheet as a matrix of stringified
 *      cells (row 0 = headers). Returns clean string[][] so the AI receives a stable
 *      shape regardless of the underlying cell types.
 *
 * Defensive choices (per threat-model T-26-04-01):
 *   - 5MB file-size cap.
 *   - Only `.xlsx` extension accepted (not `.xls`, `.csv`, `.ods`).
 *   - All errors are surfaced as Dutch user-facing messages — no stack traces leak.
 *
 * No DOM, no React, no Node — runtime-agnostic so the pure functions are testable.
 */

import * as XLSX from 'xlsx';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_EXT = '.xlsx';

export interface ExcelValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Quick pre-read validation: extension + size. Does NOT read the file.
 * Returns a Dutch error message on failure (no stack traces).
 */
export function validateExcelInput(file: File | null | undefined): ExcelValidationResult {
  if (!file) {
    return { valid: false, error: 'Geen bestand geselecteerd' };
  }
  if (!file.name.toLowerCase().endsWith(ACCEPTED_EXT)) {
    return {
      valid: false,
      error: `Alleen .xlsx-bestanden worden ondersteund (kreeg "${file.name}")`,
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { valid: false, error: 'Bestand is te groot (maximum 5MB)' };
  }
  return { valid: true };
}

/**
 * Read the first sheet of an .xlsx workbook into a matrix of stringified cells.
 * Row 0 is the header row (always).
 *
 * Throws Dutch user-facing errors:
 *   - parse failure (corrupt/incompatible file)
 *   - no sheets
 *   - empty sheet
 */
export function parseExcelToRows(buffer: ArrayBuffer): string[][] {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'array' });
  } catch {
    throw new Error('Excel-bestand kon niet worden gelezen — is het wel een geldig .xlsx-bestand?');
  }

  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel-bestand bevat geen tabbladen');
  }

  const sheet = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  }) as unknown[][];

  if (rows.length === 0) {
    throw new Error('Tabblad is leeg');
  }

  const stringified = rows.map((row) => row.map((cell) => (cell == null ? '' : String(cell))));

  // Reject sheets that contain only empty cells. xlsx is permissive: an empty
  // or corrupt buffer parses into a synthesized "Sheet1" with one empty row.
  // Without this guard, the AI would receive an essentially empty matrix.
  const hasAnyContent = stringified.some((row) => row.some((cell) => cell.trim().length > 0));
  if (!hasAnyContent) {
    throw new Error('Tabblad is leeg — geen cellen met inhoud gevonden');
  }

  return stringified;
}
