/**
 * Phase 27 Wave 0 scaffold — R2 Stichting CSV export.
 *
 * Skeleton placeholders for the per-stichting CSV export that aggregates
 * all linked schools into a single sheet. Implementation lands in
 * Plan 27-04.
 */
import { describe, it } from 'vitest';

describe('Stichting CSV export (R2)', () => {
  it.todo('emits a header row with the canonical column order');

  it.todo('emits one row per linked school with computed totals');

  it.todo('escapes commas and quotes in school names via xlsx.utils.sheet_to_csv');

  it.todo('produces output that round-trips cleanly through papaparse');

  it.todo('includes stichting metadata (naam, regio) in the header section');
});
