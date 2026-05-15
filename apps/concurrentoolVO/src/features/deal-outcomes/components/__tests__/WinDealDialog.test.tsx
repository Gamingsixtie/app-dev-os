/**
 * Phase 28 — Plan 05 (Wave 2) — WinDealDialog acceptance scaffold.
 *
 * RED until Plan 05 implements the Gewonnen-flow dialog.
 */
import { describe, test, expect } from 'vitest';

describe('Phase 28 — WinDealDialog (R2 Wave 0 scaffold)', () => {
  test.todo('R2.a: pessimistic submit creates deal_outcomes row with status="won"');
  test.todo('R2.b: cancel/escape discards form state without mutation');
  test.todo('R2.c: future decidedAt rejected with Dutch error message via zodResolver');

  test('SCAFFOLD: WinDealDialog module file must exist (Plan 05)', async () => {
    const path = '../WinDealDialog';
    await expect(import(/* @vite-ignore */ path)).resolves.toBeDefined();
  });
});
