/**
 * Phase 28 — Plan 08 (Wave 3) — CohortPredictionCard acceptance scaffold.
 *
 * RED until Plan 08 implements the cohort-AI card.
 */
import { describe, test, expect } from 'vitest';

describe('Phase 28 — CohortPredictionCard (R5 Wave 0 scaffold)', () => {
  test.todo('R5.a: cohort N=0 shows "Eerste in zijn cohort" fallback');
  test.todo('R5.b: cohort 1..4 shows "lage betrouwbaarheid" disclaimer');
  test.todo('R5.c: cohort N>=5 shows full prediction with onderwijsvisie + niveau in copy');
  test.todo('R5.d: missing onderwijsvisie shows "Onvoldoende schoolgegevens" + CTA');
  test.todo('R5.e: card is hidden for deal status in {won, lost, archived}');

  test('SCAFFOLD: CohortPredictionCard module file must exist (Plan 08)', async () => {
    const path = '../CohortPredictionCard';
    await expect(import(/* @vite-ignore */ path)).resolves.toBeDefined();
  });
});
