/**
 * Phase 28 — Plan 05 (Wave 2) — DealOutcomesTab acceptance scaffold.
 *
 * RED until Plan 05 implements `src/features/deal-outcomes/components/DealOutcomesTab.tsx`.
 * Nyquist anchor: the dynamic-import below fails today because the file doesn't exist.
 */
import { describe, test, expect } from 'vitest';

describe('Phase 28 — DealOutcomesTab (R1 Wave 0 scaffold)', () => {
  test.todo('R1.a: status badge renders all 5 lifecycle values (parameterized)');
  test.todo('R1.b: empty state shown when no deal_outcomes row exists');
  test.todo('R1.c: existing record is editable inline (status, reden, contactpersoon)');
  test.todo('R1.d: "Deal afsluiten" CTA opens DealAfsluitenDialog');

  test('SCAFFOLD: DealOutcomesTab module file must exist (Plan 05)', async () => {
    // Opaque path keeps Vite's import-analysis from failing the whole file at
    // transform time, so test.todo counts above still register. Plan 05 makes
    // this resolve.
    const path = '../DealOutcomesTab';
    await expect(import(/* @vite-ignore */ path)).resolves.toBeDefined();
  });
});
