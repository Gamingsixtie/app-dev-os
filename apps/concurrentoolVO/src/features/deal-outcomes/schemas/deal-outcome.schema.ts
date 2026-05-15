/**
 * Zod schemas for deal-outcome forms (Phase 28).
 *
 * Three RHF-facing schemas:
 *   - `dealOutcomeFormSchema` — inline edit-strip on the Uitkomst/Deal tab
 *   - `winDealFormSchema`     — Gewonnen-flow (WinDealDialog)
 *   - `lostDealFormSchema`    — Verloren-flow (LostDealForm)
 *
 * Plus the shared enums that types.ts re-exports as string unions.
 */
import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const dealStatusEnum = z.enum([
  'open',
  'in_negotiation',
  'won',
  'lost',
  'archived',
]);

export const reasonCategoryEnum = z.enum([
  'prijs',
  'functionaliteit',
  'voorkeur',
  'anders',
]);

export const onderwijsvisieEnum = z.enum([
  'dalton',
  'montessori',
  'regulier',
  'lyceum',
]);

/**
 * Provider key as captured on a competitor-side deal outcome.
 *
 * Intentionally NOT the same as the engine-level `PROVIDERS` array — Cito is
 * the home team and never appears on the competitor-provider field. `'overig'`
 * means a non-catalog competitor; the form then requires `competitorName`.
 */
export const dealCompetitorProviderEnum = z.enum(['dia', 'jij', 'saqi', 'overig']);

// ─── Form schemas ────────────────────────────────────────────────────────────

/**
 * Edit-strip schema on the Uitkomst/Deal tab. All status transitions go
 * through this schema; specific dialog forms below extend it implicitly.
 */
export const dealOutcomeFormSchema = z.object({
  status: dealStatusEnum,
  competitorProvider: dealCompetitorProviderEnum,
  competitorName: z.string().optional(),
  reason: z.string().optional(),
  reasonCategory: reasonCategoryEnum.optional(),
  contactId: z.string().uuid().optional(),
});

/**
 * Gewonnen-flow form schema (WinDealDialog).
 *
 * - `decidedAt` is coerced from the date picker's `string | Date` value and
 *   blocked from future dates (sales typo guard).
 * - `contactId` is optional (sometimes the win is logged before the contact
 *   record is created).
 * - `reason` is optional — winning rarely needs a justification.
 */
export const winDealFormSchema = z.object({
  decidedAt: z.coerce
    .date()
    .max(new Date(), 'De afsluitdatum kan niet in de toekomst liggen.'),
  contactId: z.string().uuid().optional(),
  reason: z.string().optional(),
});

/**
 * Verloren-flow form schema (LostDealForm).
 *
 * - `reason` REQUIRED — capturing the why is the primary value of registering
 *   a loss (drives later dashboard insights).
 * - `reasonCategory` REQUIRED — needed for aggregation.
 * - `.refine()` enforces that `competitorName` is filled when provider
 *   `'overig'` is picked. The error is mapped to the `competitorName` path
 *   so RHF shows it under the right input.
 */
export const lostDealFormSchema = z
  .object({
    competitorProvider: dealCompetitorProviderEnum,
    competitorName: z.string().optional(),
    reason: z
      .string()
      .min(1, 'Geef een reden op — dit helpt bij toekomstig marktinzicht.'),
    reasonCategory: reasonCategoryEnum,
    contactId: z.string().uuid().optional(),
  })
  .refine(
    (d) =>
      d.competitorProvider !== 'overig' ||
      (d.competitorName !== undefined && d.competitorName.trim().length > 0),
    {
      message: 'Vul de naam van de concurrent in.',
      path: ['competitorName'],
    },
  );

// ─── Inferred form-input types (z.input — for RHF resolver compatibility) ────

export type DealOutcomeFormInput = z.input<typeof dealOutcomeFormSchema>;
export type WinDealFormInput = z.input<typeof winDealFormSchema>;
export type LostDealFormInput = z.input<typeof lostDealFormSchema>;
