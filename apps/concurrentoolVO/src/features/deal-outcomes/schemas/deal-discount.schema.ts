/**
 * Per-deal discount schema (Phase 28 §D-04).
 *
 * XOR-constraint: exactly one of `discountPercentage` / `discountAmount`
 * must be set. Enforced client-side via `.refine()` here, server-side via
 * `CHECK ((discount_percentage IS NOT NULL) <> (discount_amount IS NOT NULL))`
 * on the `deal_discounts` table (defense-in-depth, T-28-01).
 *
 * Provider enum mirrors the engine-level `PROVIDERS` list — a discount can
 * apply to any of the four catalog providers (cito, dia, jij, saqi). Note
 * this is broader than the competitor-side enum in `deal-outcome.schema.ts`
 * because we may also model Cito-side discounts on bundles.
 */
import { z } from 'zod';

/**
 * Discount-provider enum — matches `PROVIDERS` in `src/engine/price-comparison.ts`.
 * Locked to four catalog providers; `'overig'` is intentionally NOT allowed
 * here because we can only recompute totals for providers we have price data
 * for.
 */
export const dealDiscountProviderEnum = z.enum(['cito', 'dia', 'jij', 'saqi']);

export const dealDiscountSchema = z
  .object({
    moduleId: z.string().min(1),
    provider: dealDiscountProviderEnum,
    discountPercentage: z
      .number()
      .min(0.01, 'Korting moet tussen 0,01 en 100 procent liggen.')
      .max(100, 'Korting moet tussen 0,01 en 100 procent liggen.')
      .optional(),
    discountAmount: z
      .number()
      .min(0, 'Korting mag niet negatief zijn.')
      .optional(),
  })
  .refine(
    // XOR — exactly one of the two must be defined.
    (d) => (d.discountPercentage !== undefined) !== (d.discountAmount !== undefined),
    {
      message: 'Vul een korting in als percentage óf als bedrag — niet allebei.',
      path: ['discountPercentage'],
    },
  );

export type DealDiscountInput = z.input<typeof dealDiscountSchema>;
export type DealDiscountOutput = z.output<typeof dealDiscountSchema>;
