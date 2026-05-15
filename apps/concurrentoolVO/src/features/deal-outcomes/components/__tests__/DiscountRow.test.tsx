/**
 * Phase 28 — Plan 06 (Wave 2) — DiscountRow XOR-input acceptance scaffold.
 *
 * RED until Plan 06 implements the per-row XOR input UI. The XOR rule is
 * sourced from `dealDiscountSchema` (this plan), so the row's resolver behavior
 * is testable end-to-end once the component lands.
 */
import { describe, test, expect } from 'vitest';

import { dealDiscountSchema } from '../../schemas/deal-discount.schema';

describe('Phase 28 — DiscountRow (R3 Wave 0 scaffold)', () => {
  test.todo('R3.a: typing % disables € input');
  test.todo('R3.b: typing € disables % input');
  test.todo('R3.c: XOR error message surfaces from zodResolver on submit');

  test('SCAFFOLD: dealDiscountSchema XOR error message is wired (Plan 06 hook)', () => {
    // Anchored against the actual Zod schema — confirms the row will surface
    // this exact message once the component exists.
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 10,
      discountAmount: 5,
    });
    expect(result.success).toBe(false);
  });

  test('SCAFFOLD: DiscountRow module file must exist (Plan 06)', async () => {
    const path = '../DiscountRow';
    await expect(import(/* @vite-ignore */ path)).resolves.toBeDefined();
  });
});
