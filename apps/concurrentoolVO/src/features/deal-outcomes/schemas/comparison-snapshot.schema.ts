/**
 * JSONB shape of the `deal_outcomes.comparison_snapshot` column (Phase 28 §D-02).
 *
 * Snapshot is BEVROREN at deal-decision-time — independent of future price
 * data changes. No FK to `pricing_configs`. Stored as raw JSONB on the row.
 *
 * `capturedAt` is an ISO-8601 datetime string for portability across
 * Supabase / Dexie / JSONB serialization boundaries.
 */
import { z } from 'zod';

/**
 * Competitor-side provider on the snapshot. Matches `dealCompetitorProviderEnum`
 * in deal-outcome.schema.ts but redefined here to keep this schema standalone-
 * importable (no cyclic deps between schemas).
 */
const snapshotCompetitorProviderEnum = z.enum(['dia', 'jij', 'saqi', 'overig']);

export const comparisonSnapshotSchema = z.object({
  citoTotal: z.number(),
  competitorProvider: snapshotCompetitorProviderEnum,
  competitorTotal: z.number(),
  /** `citoTotal - competitorTotal` — negative means Cito is more expensive. */
  difference: z.number(),
  perModuleBreakdown: z.array(
    z.object({
      moduleId: z.string(),
      moduleLabel: z.string(),
      citoPricePerStudent: z.number(),
      competitorPricePerStudent: z.number(),
    }),
  ),
  /** Provider keys included in the original comparison (e.g. ['cito','dia','jij']). */
  providersInScope: z.array(z.string()),
  capturedAt: z.string().datetime(),
});

export type ComparisonSnapshotInput = z.input<typeof comparisonSnapshotSchema>;
export type ComparisonSnapshotOutput = z.output<typeof comparisonSnapshotSchema>;
