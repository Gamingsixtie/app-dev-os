import type { SchoolLevel, Scenario, ModuleCurrentSetup, PipelineStatus, DMUPosition, PreferredChannel, AuthorityLevel, EngagementStatus, CustomerType, SchoolType, GrowthTrajectory, CurrentToolUsageMap } from '@/models/school';
import type { SchoolplanOpportunity, AlsoRelevantItem, OpportunityAnnotation } from '@/features/school-profile/schemas/schoolplan-analysis.schema';
import type { Database, Json } from '@/lib/supabase/types';
import type {
  DealOutcome,
  DealDiscount,
  DealAuditEntry,
  DealAuditAction,
  DealCompetitorProvider,
  ComparisonSnapshot,
  ReasonCategory,
  CohortStats,
} from '@/features/deal-outcomes/types';

export interface PriceOverride {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij' | 'saqi';
  amount: number;
}

export interface Contact {
  id: string;
  schoolId: string;
  name: string;
  dmuPosition: DMUPosition;
  jobTitle: string;
  email: string;
  phone: string;
  preferredChannel: PreferredChannel;
  authority: AuthorityLevel;
  lastContactDate: string | null;
  notes: string;
  isPrimary: boolean;
  engagementStatus: EngagementStatus;
  engagementStatusChangedAt: string | null;
  waitingForContactId: string | null;
  dropOffReason: string | null;
  createdBy?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  schoolId: string;
  date: string;
  contactId: string;
  content: string;
  tags: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemEvent {
  id: string;
  schoolId: string;
  timestamp: string;
  eventType: 'pipeline_changed' | 'comparison_created' | 'prices_updated' | 'school_created' | 'engagement_changed' | 'blokkade_registered' | 'demo_gegeven' | 'offerte_verstuurd' | 'beslissing_genomen' | 'contract_getekend' | 'implementatie_gestart' | 'evaluatie_gepland';
  description: string;
  metadata?: Record<string, string>;
  userId?: string;
}

export interface ActionItem {
  id: string;
  schoolId: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  conversationId: string | null;
  type: string | null;
  dueDate: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlannedTouchpointStatus = 'planned' | 'completed' | 'skipped';

export interface PlannedTouchpoint {
  id: string;
  schoolId: string;
  contactId: string;
  schoolYearStart: number;
  monthIndex: number; // 0=Sep, 11=Aug
  note: string;
  status: PlannedTouchpointStatus;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LostDealInfo {
  competitor: 'dia' | 'jij' | 'overig';
  competitorName?: string;
  reason?: string;
}

export interface SchoolPriceEntry {
  id: string;
  schoolId: string;
  moduleId: string;
  provider: string;
  amount: number;
  priceType: 'publication' | 'agreed';
  discountPercentage: number;
  source: string;
  verifiedAt: string | null;
  note: string;
  isActive: boolean;
  activationReason: string | null;
  activatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolRecord {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isComplete: boolean;
  completedSteps: number[];

  // Wizard data
  levels: SchoolLevel[];
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  selectedModules: string[];
  moduleSetups: ModuleCurrentSetup[];
  scenario: Scenario | null;

  // Price comparison data
  appliedOverrides: PriceOverride[];
  migrationHourlyRate: number | null;
  migrationTimeSavingOverrides: Record<string, number | null>;
  customTimeSavingTasks?: import('../models/migration').TimeSavingTask[];
  hiddenTimeSavingTaskIds?: string[];
  switchingCosts: number;

  // CRM-lite data
  contacts: Contact[];
  conversations: Conversation[];
  actions: ActionItem[];
  systemEvents: SystemEvent[];
  pipelineStatus: PipelineStatus;
  lostDealInfo?: LostDealInfo;
  region: string;
  tags: string[];
  viewPreference: 'compact' | 'extended';

  // Ownership & audit
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
  updatedBy?: string;

  // Phase 27 R1 — optional link to Stichting (bestuur). Null when school is
  // not linked to any Stichting yet. Plan 27-07 fills this via bulk-link UI.
  stichtingId?: string | null;

  // Phase 27 R3 — Customer type (Cito-klant onderscheid). Captured in WizardStep1
  // and drives Plan 10 (R10) Upsell-scenario visibility in Stap 5.
  customerType?: CustomerType | null;

  // Phase 27 R4 — Schoolsoort (regulier / dakpanklas / dalton / montessori /
  // vrije-school / overig). When `overig`, `customSchoolType` carries the free-text label.
  schoolType?: SchoolType | null;
  customSchoolType?: string | null;

  // Phase 27 R4 — Groei-trajectorie (groei / krimp / stabiel / loting). Sales-context
  // for stichting-rapportages.
  growthTrajectory?: GrowthTrajectory | null;

  // Phase 27 R5 — Huidig-gebruik per onderwijsniveau (WizardStep2). Optional:
  // missing keys mean "no choice yet". Aggregates at stichting-level via
  // `getStichtingUsageMix` into the 3-dot indicator on StichtingCard.
  currentToolUsage?: CurrentToolUsageMap;

  // Joined fields (not stored in DB)
  ownerName?: string;
}

/**
 * Dexie-row shape for the `stichtingen` table (Phase 27 Plan 02).
 * Mirrors `StichtingRecord` from `@/models/stichting` 1-on-1 — kept here
 * so the Dexie schema stays self-contained inside the db module.
 */
export interface StichtingDexieRow {
  id: string;
  teamId: string;
  name: string;
  region: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SchoolplanAnalysisRow {
  id: string;
  school_id: string;
  file_name: string;
  file_path: string;
  page_count: number | null;
  uploaded_at: string;
  summary: string;
  themes: string[];  // JSONB parsed
  opportunities: SchoolplanOpportunity[];  // JSONB parsed
  also_relevant: AlsoRelevantItem[];  // JSONB parsed
  opportunity_annotations: Record<string, OpportunityAnnotation>;  // JSONB parsed, keyed by opportunity index
  analysis_status: 'pending' | 'analyzing' | 'complete' | 'failed';
  error_message: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Phase 28 Plan 02 — deal-outcomes row-shape mappers ──────────────────────
//
// Convention: snake_case in DB ↔ camelCase in app (Phase 25 carry-forward).
// JSONB columns (`comparison_snapshot`, `before_value`, `after_value`) are
// re-typed at the boundary; the Zod schemas validate the shapes on read paths.

type DealOutcomeRow = Database['public']['Tables']['deal_outcomes']['Row'];
type DealDiscountRow = Database['public']['Tables']['deal_discounts']['Row'];
type DealAuditLogRow = Database['public']['Tables']['deal_audit_log']['Row'];
type DealOutcomeInsert = Database['public']['Tables']['deal_outcomes']['Insert'];
type DealDiscountInsert = Database['public']['Tables']['deal_discounts']['Insert'];
type DealAuditLogInsert = Database['public']['Tables']['deal_audit_log']['Insert'];

/**
 * Map a `deal_outcomes` row from Postgres to the domain {@link DealOutcome}.
 * Caller is responsible for validating `comparison_snapshot` via
 * `comparisonSnapshotSchema` if untrusted.
 */
export function mapDealOutcomeRow(row: DealOutcomeRow): DealOutcome {
  return {
    id: row.id,
    schoolId: row.school_id,
    teamId: row.team_id,
    status: row.status,
    competitorProvider: row.competitor_provider as DealCompetitorProvider,
    competitorName: row.competitor_name ?? undefined,
    reason: row.reason ?? undefined,
    reasonCategory: (row.reason_category as ReasonCategory | null) ?? undefined,
    contactId: row.contact_id ?? undefined,
    comparisonSnapshot: row.comparison_snapshot as unknown as ComparisonSnapshot,
    decidedAt: row.decided_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map a domain {@link DealOutcome} (or insert-shaped subset) to the
 * Postgres `Insert` row shape. `id` / `createdAt` / `updatedAt` are omitted —
 * the DB generates them.
 */
export function mapDealOutcomeInsert(
  domain: Omit<DealOutcome, 'id' | 'createdAt' | 'updatedAt'>,
): DealOutcomeInsert {
  return {
    school_id: domain.schoolId,
    team_id: domain.teamId,
    status: domain.status,
    competitor_provider: domain.competitorProvider,
    competitor_name: domain.competitorName ?? null,
    reason: domain.reason ?? null,
    reason_category: domain.reasonCategory ?? null,
    contact_id: domain.contactId ?? null,
    comparison_snapshot: domain.comparisonSnapshot as unknown as Database['public']['Tables']['deal_outcomes']['Insert']['comparison_snapshot'],
    decided_at: domain.decidedAt ?? null,
  };
}

/** Map a `deal_discounts` row to the domain {@link DealDiscount}. */
export function mapDealDiscountRow(row: DealDiscountRow): DealDiscount {
  return {
    id: row.id,
    dealOutcomeId: row.deal_outcome_id,
    moduleId: row.module_id,
    provider: row.provider as DealCompetitorProvider,
    discountPercentage: row.discount_percentage ?? undefined,
    discountAmount: row.discount_amount ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Map a domain {@link DealDiscount} to the `Insert` row shape. Caller must
 * ensure XOR (exactly one of percentage / amount) before invoking — DB
 * CHECK constraint will reject violators.
 */
export function mapDealDiscountInsert(
  domain: Omit<DealDiscount, 'id' | 'createdAt'>,
): DealDiscountInsert {
  return {
    deal_outcome_id: domain.dealOutcomeId,
    module_id: domain.moduleId,
    // DB CHECK rejects 'overig' on the discount side — `provider` is therefore
    // narrowed to the 4-provider catalog at the type level.
    provider: domain.provider as Exclude<DealCompetitorProvider, 'overig'>,
    discount_percentage: domain.discountPercentage ?? null,
    discount_amount: domain.discountAmount ?? null,
  };
}

/** Map a `deal_audit_log` row to the domain {@link DealAuditEntry}. */
export function mapDealAuditRow(row: DealAuditLogRow): DealAuditEntry {
  return {
    id: row.id,
    dealOutcomeId: row.deal_outcome_id,
    userId: row.user_id,
    action: row.action as DealAuditAction,
    beforeValue: (row.before_value as Record<string, unknown> | null) ?? null,
    afterValue: (row.after_value as Record<string, unknown> | null) ?? null,
    timestamp: row.timestamp,
  };
}

/**
 * Map a domain {@link DealAuditEntry} to the `Insert` row shape.
 * `user_id` is omitted — the DB DEFAULT is `auth.uid()` and the RLS policy
 * enforces `user_id = auth.uid()` on INSERT.
 */
export function mapDealAuditInsert(
  domain: Omit<DealAuditEntry, 'id' | 'timestamp' | 'userId'>,
): DealAuditLogInsert {
  return {
    deal_outcome_id: domain.dealOutcomeId,
    action: domain.action,
    before_value: domain.beforeValue as Json | null,
    after_value: domain.afterValue as Json | null,
  };
}

// ─── Phase 28 Plan 03 — deal_cohort_stats matview row-shape mapper ───────────
//
// The matview is read-only (Postgres) and TS-enforced read-only via
// `Insert: never; Update: never` in `src/lib/supabase/types.ts`. Only a Row
// mapper is needed.

type DealCohortStatsRow = Database['public']['Views']['deal_cohort_stats']['Row'];

/**
 * Map a `deal_cohort_stats` matview row to the domain {@link CohortStats}.
 *
 * - `winRate` is a 0-100 percent with one decimal (DB returns
 *   `ROUND(won/(won+lost), 1) * 100`). Undefined when the cohort has only
 *   open/in_negotiation deals (no won/lost denominator) — DB returns NULL,
 *   we map to `undefined` so consumers branch on `winRate !== undefined`.
 * - `topLostReason` is undefined when the cohort has no lost deals OR no
 *   lost deal carries a `reason_category`.
 *
 * The caller (Plan 08 `useCohortPrediction` hook) MUST filter the query by
 * `team_id` before invoking this mapper — matviews don't honour RLS.
 */
export function mapCohortStatsRow(row: DealCohortStatsRow): CohortStats {
  return {
    teamId: row.team_id,
    onderwijsvisie: row.onderwijsvisie,
    primaryLevel: row.primary_level,
    totalDeals: row.total_deals,
    wonDeals: row.won_deals,
    lostDeals: row.lost_deals,
    openDeals: row.open_deals,
    winRate: row.win_rate ?? undefined,
    topLostReason: row.top_lost_reason ?? undefined,
  };
}
