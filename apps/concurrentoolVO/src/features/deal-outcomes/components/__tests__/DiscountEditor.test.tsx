/**
 * Phase 28 — Plan 06 (Wave 2) — DiscountEditor acceptance scaffold.
 *
 * RED until Plan 06 implements the per-(module, provider) discount editor.
 */
import { describe, test, expect } from 'vitest';

describe('Phase 28 — DiscountEditor (R3 Wave 0 scaffold)', () => {
  test.todo('R3.a: "Korting toevoegen" knop opens edit-mode row');
  test.todo('R3.b: saved row shows discount + edit/remove icons');
  test.todo('R3.c: removing row triggers deal_audit_log write with action=discount_deleted');
  test.todo('R3.d: empty state copy is "Nog geen kortingen vastgelegd"');

  test('SCAFFOLD: DiscountEditor module file must exist (Plan 06)', async () => {
    const path = '../DiscountEditor';
    await expect(import(/* @vite-ignore */ path)).resolves.toBeDefined();
  });
});
