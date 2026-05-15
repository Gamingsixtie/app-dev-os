/**
 * Phase 28 — Plan 07 (Wave 3) — useDealStats hook acceptance scaffold.
 *
 * RED until Plan 07 implements the dashboard aggregate hook.
 */
import { describe, test, expect } from 'vitest';

describe('Phase 28 — useDealStats (R4 Wave 0 scaffold)', () => {
  test.todo('R4.a: returns correct totals for a filtered period');
  test.todo('R4.b: filters by niveau correctly (vmbo / havo / vwo + sub-types)');
  test.todo('R4.c: N=0 returns all-zero KPIs (no NaN, no division-by-zero)');

  test('SCAFFOLD: useDealStats module file must exist (Plan 07)', async () => {
    const path = '../useDealStats';
    await expect(import(/* @vite-ignore */ path)).resolves.toBeDefined();
  });
});
