/**
 * Deal-outcome feature — shared TypeScript types (Phase 28 Wave 0).
 *
 * Naming convention (per AGENTS.md): English identifiers in code, Dutch labels
 * live in `labels.ts`. Database columns are snake_case; this layer uses
 * camelCase and mirrors the JSONB / row shapes defined in CONTEXT.md §D-01..D-04.
 */
import type { z } from 'zod';

import type {
  dealOutcomeFormSchema,
  lostDealFormSchema,
  winDealFormSchema,
} from './schemas/deal-outcome.schema';
import type { comparisonSnapshotSchema } from './schemas/comparison-snapshot.schema';

// ─── Enum-style string unions (single source of truth = Zod schemas) ─────────

/**
 * Lifecycle status of a deal outcome record.
 *
 * - `open`            — record exists, no decision yet (default)
 * - `in_negotiation`  — actively negotiating with the school
 * - `won`             — deal closed in Cito's favor
 * - `lost`            — deal lost to a competitor
 * - `archived`        — superseded by a newer record for the same school
 */
export type DealStatus = 'open' | 'in_negotiation' | 'won' | 'lost' | 'archived';

/**
 * High-level reason category for a lost deal — drives dashboard breakdowns.
 */
export type ReasonCategory = 'prijs' | 'functionaliteit' | 'voorkeur' | 'anders';

/**
 * Onderwijsvisie of the school — NEW column added in Phase 28 (decision A1).
 * This is intentionally NOT the same as Phase 27's school-type enum and lives
 * in a separate column on the schools table.
 */
export type Onderwijsvisie = 'dalton' | 'montessori' | 'regulier' | 'lyceum';

/**
 * Re-export of the engine-level provider key so the deal-outcome layer never
 * drifts from the canonical `PROVIDERS` list in `src/engine/price-comparison.ts`.
 */
export type { ProviderKey } from '../../engine/price-comparison';

/**
 * Competitor provider as captured on a deal outcome.
 *
 * Mirrors the Zod schema `dealCompetitorProviderEnum` in deal-outcome.schema.ts.
 * `'overig'` means a non-catalog competitor — `competitorName` is then required.
 */
export type DealCompetitorProvider = 'dia' | 'jij' | 'saqi' | 'overig';

/**
 * Discrete audit-log action types. Single source of truth for what may be
 * written to `deal_audit_log.action`.
 */
export type DealAuditAction =
  | 'outcome_created'
  | 'outcome_updated'
  | 'status_changed'
  | 'discount_added'
  | 'discount_updated'
  | 'discount_deleted';

// ─── Row-shape interfaces (camelCase mirrors of Postgres rows) ───────────────

/**
 * Per-deal outcome record. Mirrors `deal_outcomes` row + JSONB
 * `comparison_snapshot` (typed via {@link ComparisonSnapshot}).
 */
export interface DealOutcome {
  id: string;
  schoolId: string;
  teamId: string;
  status: DealStatus;
  competitorProvider: DealCompetitorProvider;
  /** Free-text competitor name; required when `competitorProvider === 'overig'`. */
  competitorName?: string;
  /** Free-text reason — optional for win, required for loss (enforced via Zod). */
  reason?: string;
  /** Aggregated reason category for dashboard rollups. */
  reasonCategory?: ReasonCategory;
  /** FK to `contacts.id`. */
  contactId?: string;
  comparisonSnapshot: ComparisonSnapshot;
  /** ISO-8601 timestamp when the deal was decided (win/loss). */
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Per-(deal, module, provider) discount. XOR-constraint: exactly one of
 * `discountPercentage` / `discountAmount` is set (enforced via Zod + DB CHECK).
 */
export interface DealDiscount {
  id: string;
  dealOutcomeId: string;
  moduleId: string;
  provider: DealCompetitorProvider;
  /** 0.01–100 inclusive when set. */
  discountPercentage?: number;
  /** Non-negative euro amount when set. */
  discountAmount?: number;
  createdAt: string;
}

/**
 * Audit-trail entry. `beforeValue` / `afterValue` are open-shape JSONB blobs
 * sized to the action — schema is intentionally loose at the type level.
 */
export interface DealAuditEntry {
  id: string;
  dealOutcomeId: string;
  userId: string;
  action: DealAuditAction;
  beforeValue: Record<string, unknown> | null;
  afterValue: Record<string, unknown> | null;
  timestamp: string;
}

/**
 * Materialized-view output (`deal_cohort_stats`). One row per cohort key.
 * `primaryLevel` is the school level (vmbo-b / vmbo-k / vmbo-gt / havo / vwo)
 * — vmbo sub-types are kept apart per Phase 28 §D-12 user-confirmed decision
 * (no rollup to a generic "vmbo").
 *
 * Phase 28 Plan 03 harmonization (vs. the Plan-01 stub): `winRate` is now a
 * 0-100 percent with one decimal (DB returns `ROUND(..., 1) * 100`) — NOT a
 * 0-1 fraction. `winRate` and `topLostReason` are optional because the matview
 * column can be NULL when a cohort has only `open`/`in_negotiation` deals
 * (no won/lost denominator) or when no lost deals carry a reason category.
 * `openDeals` is included so the UI can show "N total = X open + Y decided".
 */
export interface CohortStats {
  teamId: string;
  onderwijsvisie: Onderwijsvisie;
  primaryLevel: 'vmbo-b' | 'vmbo-k' | 'vmbo-gt' | 'havo' | 'vwo';
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  /**
   * Win-rate as percent (0-100, one decimal). Undefined when the cohort has
   * only open/in_negotiation deals (no won/lost denominator).
   */
  winRate?: number;
  /** Most common `reasonCategory` for lost deals in the cohort. */
  topLostReason?: ReasonCategory;
}

// ─── Inferred-from-Zod input/output types (RHF + JSONB) ──────────────────────

/**
 * RHF input type for the inline edit-strip on the Uitkomst/Deal tab.
 * Uses `z.input` because optional fields with `.default()` show up as required
 * on `z.output`.
 */
export type DealOutcomeFormInput = z.input<typeof dealOutcomeFormSchema>;

/** RHF input type for the WinDealDialog form. */
export type WinDealFormInput = z.input<typeof winDealFormSchema>;

/** RHF input type for the LostDealForm. */
export type LostDealFormInput = z.input<typeof lostDealFormSchema>;

/**
 * Persisted JSONB shape of `deal_outcomes.comparison_snapshot`.
 * Use `z.output` here — fields are required once written.
 */
export type ComparisonSnapshot = z.output<typeof comparisonSnapshotSchema>;
