# Phase 28: Win/loss-tracking & Marktpositie + Korting-verrijking — Research

**Researched:** 2026-05-14
**Domain:** Multi-tier Sales-CRM uitbreiding op bestaande Supabase + Vite SPA — DB-schema-uitbreiding, materialized view-aggregatie, pure-function engine-extensie, Recharts-dashboard, react-hook-form dialogs, TanStack Router search-params filters
**Confidence:** HIGH (alle decisions in CONTEXT zijn locked; alleen 1 onopgelost veld-naam-mismatch tussen SPEC en Phase 27 codebase)

## Summary

Phase 28 voegt vier mechanisch onafhankelijke maar dataflow-gekoppelde features toe aan de bestaande concurrentoolVO app: een aparte Uitkomst/Deal-tab (vervangt LostDealDialog), een /dashboard route met cross-school KPI's en trend-grafiek, een per-deal korting-laag die de bestaande pure-function vergelijkings-engine reactief herberekent voor de geopende deal, en een statistische cohort-AI op `(schoolType, levels)` voor win-kans-voorspelling. Drie nieuwe Supabase-tabellen (`deal_outcomes`, `deal_discounts`, `deal_audit_log`) + één materialized view (`deal_cohort_stats`) vormen het datafundament. Alle UI-componenten zijn handrolled volgens app-conventie (geen shadcn, geen externe dialog-lib), alle forms gebruiken `react-hook-form` + `zodResolver` (CLAUDE.md hard rule), alle filter-state op `/dashboard` leeft in TanStack Router search-params (Phase 26 D-02 patroon), alle Supabase-data leeft achter team-scoped RLS (Phase 8 patroon).

Het werk is afhankelijk van Phase 27 plan 03 voor de school-velden `schoolType` (regulier/dakpanklas/dalton/montessori/vrije-school/overig) en bestaande `levels` (SchoolLevel array) waarop het cohort wordt gegroepeerd. **De SPEC noemt deze velden "onderwijsvisie" + "schoolniveau" maar in code zijn ze `schoolType` + `levels`** — research-assumption die de planner moet bevestigen tijdens task-shaping.

**Primary recommendation:** Splits de fase in 8 plans: (1) Wave 0 test-stubs + types, (2) migratie 014/015/016/017 (deal_outcomes + discounts + audit-log + cohort-view), (3) engine extensie `applyDealDiscounts` pure function, (4) Uitkomst-tab MVP + DealAfsluitenDialog/Win/LostForm, (5) DiscountEditor + audit-log integratie, (6) Dashboard route + KPI's + filters + Recharts, (7) CohortPredictionCard + lookup-query, (8) LostDealDialog cleanup + verificatie. Materialized view-refresh via `AFTER INSERT/UPDATE/DELETE` trigger met `REFRESH MATERIALIZED VIEW CONCURRENTLY` als primair, pg_cron-nightly als fallback.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Uitkomst-record CRUD | Supabase Postgres (RLS) | Frontend Server (TanStack Query hooks) | Persistente sales-data, team-scoped, audit-tracked — hoort thuis in DB met server-bound RLS. Frontend hooks bieden cache + mutation-orchestratie. |
| Per-deal korting-recalc | Browser (pure engine functie) | — | Engine is pure TypeScript, real-time recalc op gebruikersinput, geen server roundtrip. Bestaand `calculateComparison()` patroon. |
| Audit-log writes | Supabase Postgres (trigger of client) | — | DB-trigger maakt audit-records bij `deal_discounts` insert/update/delete — kan ook client-side via `pricing-operations.ts` patroon van Phase 25. Beslissen: trigger > client (atomic, geen overslaan). |
| Cohort-aggregatie | Supabase Postgres (materialized view) | Browser (lookup-query via hook) | Server-side pre-aggregatie schaalt naar 500+ deals; frontend doet alleen lookup `WHERE schoolType=? AND level=?`. |
| Dashboard KPI's + trend | Supabase Postgres (query) | Browser (Recharts render) | Aggregaten via SQL (count/avg/group-by); chart-render in browser. Filters via TanStack Router URL search-params. |
| LostDealDialog vervanging | Browser (component swap) | — | Pure UI-refactor: bestaande `LostDealDialog.tsx` weg, nieuwe `LostDealForm.tsx` in dialog-flow. Geen data-migratie nodig (testdata, schone start per SPEC). |
| Cohort-features lookup | Browser (TanStack Query) | Supabase materialized view | Read-only cached fetch op `schoolType` + `levels[0]` van de current school. |
| Pipeline-status sync | (NONE — bewust geen sync) | — | Per D-14 + SPEC Deviation R2: pipeline-status en deal-uitkomst zijn onafhankelijke concepten. Geen sync-laag. |

## Standard Stack

### Core (al in package.json — verified versions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.99.3 | Postgres client + auth + RLS [VERIFIED: package.json] | App-wide standaard sinds Phase 8 |
| `@tanstack/react-query` | ^5.94.5 | Server-state cache + mutations [VERIFIED: package.json] | App-wide standaard sinds Phase 8 |
| `@tanstack/react-router` | ^1.168.1 | Routing + search-params + lazy [VERIFIED: package.json] | Centrale router, Phase 26 D-02 patroon voor filter-state |
| `react-hook-form` | ^7.71.2 | Form state + validation [VERIFIED: package.json] | CLAUDE.md hard rule — alle forms |
| `@hookform/resolvers` | ^5.2.2 | Zod adapter voor RHF [VERIFIED: package.json] | Bind Zod schema aan RHF |
| `zod` | ^4.3.6 | Schema validation [VERIFIED: package.json, npm latest 4.4.3] | App-wide standaard. **Zod 4** — let op `.refine()` API en `discriminatedUnion` syntax (gewijzigd t.o.v. v3) |
| `recharts` | ^3.8.0 | Charts (al gebruikt in ComparisonChart) [VERIFIED: package.json — latest 3.8.0] | App-wide chart-library |
| `dexie` | ^4.3.0 | IndexedDB offline-mirror [VERIFIED: package.json] | Offline-fallback voor schools (Phase 12 patroon) |
| `dexie-react-hooks` | ^4.2.0 | `useLiveQuery` voor reactive Dexie [VERIFIED: package.json] | Niet noodzakelijk voor Phase 28 — TanStack Query is primair |
| `zustand` | ^5.0.12 | Client-state (persist middleware) [VERIFIED: package.json] | Bestaande stores blijven; Phase 28 gebruikt GEEN nieuwe Zustand store (filter-state via TanStack search-params, deal-state via TanStack Query cache) |

### Supporting (niet nodig — vermijden)

| Library | Reden om NIET te gebruiken |
|---------|----------------------------|
| `@radix-ui/react-dialog` | App gebruikt handrolled overlay-pattern uit `LostDealDialog.tsx` (`fixed inset-0 z-50 + rgba(0,0,0,0.3)`). Geen Radix dep toevoegen. |
| `date-fns` / `dayjs` | Voor datum-formatting gebruikt app `Intl.DateTimeFormat('nl-NL')`. Geen externe lib nodig voor Phase 28. |
| `react-table` / TanStack Table | DiscountEditor + AuditLogAccordion zijn klein genoeg voor handrolled `<table>` markup. Geen extra dep. |
| Focus-trap library | UI-SPEC noemt inline implementation. Recharts/RHF zijn de enige nieuwe runtime deps. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Materialized view | Live SQL query met aggregatie op `deal_outcomes` | Bij <100 deals werkt live query prima (<50ms). Materialized view vereist refresh-strategie (complexiteit) maar schaalt naar 1000+ deals + multi-tenant. CONTEXT D-09 LOCKED → materialized view. |
| Zod `discriminatedUnion` voor XOR | Zod `.refine()` op object schema | discriminatedUnion vereist discriminator-key (bv `mode: 'percentage' \| 'amount'`). XOR via `.refine()` is bondiger voor 2-field exclusiviteit. **Aanbevolen: `.refine()`** — zie Code Examples. |
| DB-trigger voor audit-log | Client-side insert in `pricing-operations.ts` patroon | Phase 25 koos client-side. Phase 28 D-03 zegt "aparte deal_audit_log tabel" maar zegt niet expliciet trigger vs client. **Aanbevolen: client-side** (consistentie met Phase 25, makkelijker te testen, kan rollback bij failure). |
| Zustand store voor dashboard filters | TanStack Router search-params | CONTEXT D-06 LOCKED → search-params (deeplink + refresh-safe). |

**Version verification (run-time):** Alle stack-versies zijn vandaag (2026-05-14) gecheckt tegen `package.json` van de app. Recharts 3.8.0 is de huidige major; geen breaking changes verwacht. Zod is op v4 (al ingezet in Phase 25/26/27); de planner moet `discriminatedUnion` patterns testen omdat Zod 4 een andere foutmelding-shape heeft dan v3.

## Architecture Patterns

### System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                            BROWSER (Vite SPA)                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────┐   ┌─────────────────────────────────────┐  │
│  │  /dashboard route         │   │  /scholen/$slug/uitkomst (new tab)  │  │
│  │  ────────────────────     │   │  ─────────────────────────────────  │  │
│  │  DashboardPage            │   │  DealOutcomesTab                    │  │
│  │   ├ DashboardFilterBar    │   │   ├ DealStatusBadge                 │  │
│  │   │  (URL search-params)  │   │   ├ CohortPredictionCard            │  │
│  │   ├ ReliabilityBanner     │   │   │  (lookup deal_cohort_stats)     │  │
│  │   ├ KpiCard × 4           │   │   ├ DealSnapshotView (read-only)    │  │
│  │   │  (useDealStats)       │   │   ├ DiscountEditor                  │  │
│  │   ├ TrendChart            │   │   │  ├ DiscountRow × N (RHF + Zod)  │  │
│  │   │  (useDealTrend)       │   │   ├ Deal-detail form (RHF)          │  │
│  │   └ CompetitorBreakdown × 2   │   ├ AuditLogAccordion               │  │
│  │     (useCompetitorBreakdown)  │   └ DealAfsluitenDialog ─→ Win/Lost │  │
│  └────────────┬─────────────┘   └──────────────┬──────────────────────┘  │
│               │                                  │                         │
│               │ TanStack Query                  │ TanStack Query           │
│               ▼                                  ▼                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │              hooks/* — useDealOutcome, useDealDiscounts,           │  │
│  │              useDealStats, useCohortPrediction, useDealMutation    │  │
│  └────────────┬───────────────────────────────────┬───────────────────┘  │
│               │                                    │                       │
│               │ Pure-function recalc               │ supabase.from(...)    │
│               ▼                                    ▼                       │
│  ┌──────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │  src/engine/price-comparison.ts  │  │   src/lib/supabase/client    │  │
│  │  + applyDealDiscounts() helper   │  │   + RLS team-scoping          │  │
│  └──────────────────────────────────┘  └────────────────┬────────────┘  │
│                                                          │                 │
└──────────────────────────────────────────────────────────┼────────────────┘
                                                           │
                                                           │ HTTPS + JWT
                                                           ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE POSTGRES                                  │
├───────────────────────────────────────────────────────────────────────────┤
│  Tables (new):                                                             │
│    deal_outcomes      — 1-active-per-school (partial-unique index)         │
│    deal_discounts     — FK → deal_outcomes, XOR % vs € via CHECK           │
│    deal_audit_log     — FK → deal_outcomes, JSONB before/after             │
│                                                                            │
│  Materialized view:                                                        │
│    deal_cohort_stats  — group by (schoolType, level), total/won/lost/rate  │
│      └ unique index on (schoolType, level) for CONCURRENTLY refresh        │
│                                                                            │
│  Trigger:                                                                  │
│    refresh_cohort_stats   AFTER INSERT/UPDATE/DELETE ON deal_outcomes      │
│      → REFRESH MATERIALIZED VIEW CONCURRENTLY deal_cohort_stats            │
│      (SECURITY DEFINER + fallback pg_cron nightly)                         │
│                                                                            │
│  RLS:                                                                      │
│    All three tables: team_id = get_user_team_id()                          │
│    deal_cohort_stats: inherit from deal_outcomes via SELECT-only           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── features/
│   ├── deal-outcomes/           # NEW — feature folder per D-21
│   │   ├── components/
│   │   │   ├── DealOutcomesTab.tsx          # Container, route component
│   │   │   ├── DealStatusBadge.tsx          # Status pill, 5 states
│   │   │   ├── DealAfsluitenDialog.tsx      # Radiogroup entry dialog
│   │   │   ├── WinDealDialog.tsx            # Won-flow form (RHF + Zod)
│   │   │   ├── LostDealForm.tsx             # Lost-flow form (RHF + Zod)
│   │   │   ├── DiscountEditor.tsx           # Table of DiscountRow
│   │   │   ├── DiscountRow.tsx              # XOR % vs € invoer
│   │   │   ├── CohortPredictionCard.tsx     # <details> collapsible
│   │   │   ├── DealSnapshotView.tsx         # Frozen comparison read-only
│   │   │   └── AuditLogAccordion.tsx        # <details> changelog
│   │   ├── hooks/
│   │   │   ├── useDealOutcome.ts            # Query single deal per school
│   │   │   ├── useDealOutcomeMutation.ts    # Create/update/archive
│   │   │   ├── useDealDiscounts.ts          # List + mutate per-deal kortingen
│   │   │   ├── useCohortPrediction.ts       # Lookup deal_cohort_stats
│   │   │   └── useDealAuditLog.ts           # Read-only audit history
│   │   ├── schemas/
│   │   │   ├── deal-outcome.schema.ts       # Status + form-fields
│   │   │   ├── deal-discount.schema.ts      # XOR % vs € via .refine()
│   │   │   └── comparison-snapshot.schema.ts # JSONB shape
│   │   ├── labels.ts                        # DEAL_STATUS_LABELS, REASON_CATEGORY_LABELS (Dutch)
│   │   └── types.ts                         # DealOutcome, DealDiscount, etc.
│   ├── dashboard/               # NEW — feature folder per D-22
│   │   ├── DashboardPage.tsx                # Route component
│   │   ├── components/
│   │   │   ├── DashboardFilterBar.tsx
│   │   │   ├── ReliabilityBanner.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── TrendChart.tsx               # LineChart/BarChart with toggle
│   │   │   ├── CompetitorBreakdownCard.tsx  # Donut (PieChart innerRadius)
│   │   │   └── DashboardEmptyState.tsx
│   │   ├── hooks/
│   │   │   ├── useDealStats.ts              # 4 KPI aggregates
│   │   │   ├── useDealTrend.ts              # Time-series for chart
│   │   │   └── useCompetitorBreakdown.ts    # Per-competitor donut data
│   │   └── types.ts                         # DashboardFilter type
│   └── school-profile/
│       └── components/
│           ├── LostDealDialog.tsx           # DELETED in Plan 8
│           └── ProfileHeader.tsx            # +1 tab (uitkomst) in nav
├── engine/
│   └── price-comparison.ts                  # +dealDiscounts option (pure)
├── router/
│   └── routes.ts                            # +dashboardRoute, +uitkomst tab
├── db/
│   ├── types.ts                             # +DealOutcome, +DealDiscount, +DealAuditEntry
│   └── deal-outcomes-operations.ts          # NEW — CRUD ops (parallel to pricing-operations.ts)
└── lib/supabase/types.ts                    # +Database types (auto-generated regen)

supabase/migrations/
├── 014_deal_outcomes.sql                    # NEW
├── 015_deal_discounts.sql                   # NEW (CHECK constraint XOR)
├── 016_deal_audit_log.sql                   # NEW
└── 017_deal_cohort_stats_view.sql           # NEW (matview + trigger + pg_cron)
```

> ⚠ **Migratie-nummer-conflict risk:** Phase 27 plan 03 reserveert `015_school_sales_context.sql` voor schoolType. Als Phase 28 vóór Phase 27 plan 03 wordt uitgevoerd, gebruik `014_deal_outcomes.sql` → `017`. Als Phase 27 al gemerged is, gebruik `016_deal_outcomes.sql` → `019`. **Planner moet checken** `ls supabase/migrations/` op execute-tijd en hernummeren.

### Pattern 1: Pure-function engine extensie met optional override-laag

**What:** Bestaande `calculateComparison(selectedModules, studentCounts, options)` krijgt extra optie `dealDiscounts?: DealDiscount[]`. Engine blijft pure (geen side effects, geen DB-call, geen async). Discount-applicatie gebeurt als post-processing op `providerResults` map vóór de finale `ProviderCost` constructie — zelfde pattern als de bestaande Scenario C `oldPlatformPrice` override.

**When to use:** Wanneer een aanroeper (vergelijking-tab + Uitkomst-tab) een specifieke deal-context wil tonen met die deal's kortingen toegepast.

**Example:**
```typescript
// src/engine/price-comparison.ts
export interface ComparisonOptions {
  // ... existing fields
  /** Phase 28: per-deal kortingen die de vergelijking voor deze deal herberekenen */
  dealDiscounts?: DealDiscount[];
}

export interface DealDiscount {
  moduleId: string;
  provider: ProviderKey;
  // XOR: exactly one of these two is set (validated by Zod + DB CHECK)
  discountPercentage?: number;  // 0-100
  discountAmount?: number;      // EUR per leerling
}

export function calculateComparison(
  selectedModules: string[],
  studentCounts: ...,
  options: ComparisonOptions = {},
): ComparisonResult {
  // ... existing calculator-loop produces providerResults Map

  // NEW — Phase 28: per-deal discount overlay (pure, deterministic)
  if (options.dealDiscounts && options.dealDiscounts.length > 0) {
    for (const discount of options.dealDiscounts) {
      const result = providerResults.get(discount.provider)?.get(discount.moduleId);
      if (!result) continue;
      const basePerStudent = result.pricePerStudent;
      const adjustedPerStudent = discount.discountPercentage !== undefined
        ? basePerStudent * (1 - discount.discountPercentage / 100)
        : basePerStudent - (discount.discountAmount ?? 0);
      providerResults.get(discount.provider)!.set(discount.moduleId, {
        ...result,
        pricePerStudent: adjustedPerStudent,
        totalCost: adjustedPerStudent * totalStudents,
        // Note: breakdown intentionally kept original — discount visualization is UI-side
      });
    }
  }

  // ... rest of function (module comparison construction, totals, differences)
}
```
[CITED: src/engine/price-comparison.ts:140-159 — existing Scenario C override pattern]

### Pattern 2: Materialized view + trigger + concurrent refresh

**What:** Een Postgres materialized view aggregeert deal_outcomes per cohort (`schoolType`, primary `level`). Een AFTER-trigger op `deal_outcomes` INSERT/UPDATE/DELETE refresht de view CONCURRENTLY. Een pg_cron nightly job is fallback voor consistentie bij trigger-falures.

**When to use:** Wanneer aggregaat-queries (count/avg/group-by) frequent worden uitgevoerd op een dataset die langzaam muteert (deal-records muteren ~enkele per dag) en lees-latentie matters (cohort-card laadt bij elke tab-open).

**Example:**
```sql
-- 017_deal_cohort_stats_view.sql
CREATE MATERIALIZED VIEW deal_cohort_stats AS
SELECT
  s.school_type,
  -- Take first level as cohort key (vmbo-b/k/gt collapsed to vmbo if needed in app)
  COALESCE(s.levels[1], 'unknown') AS primary_level,
  s.team_id,
  COUNT(d.id) AS total_deals,
  COUNT(*) FILTER (WHERE d.status = 'won') AS won_deals,
  COUNT(*) FILTER (WHERE d.status = 'lost') AS lost_deals,
  CASE
    WHEN COUNT(*) FILTER (WHERE d.status IN ('won','lost')) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE d.status = 'won')::numeric /
      COUNT(*) FILTER (WHERE d.status IN ('won','lost'))::numeric * 100, 1)
    ELSE NULL
  END AS win_rate,
  MODE() WITHIN GROUP (ORDER BY d.reason_category) FILTER (WHERE d.status = 'lost') AS top_lost_reason
FROM deal_outcomes d
JOIN schools s ON s.id = d.school_id
WHERE s.school_type IS NOT NULL
  AND array_length(s.levels, 1) > 0
GROUP BY s.school_type, s.levels[1], s.team_id;

-- REQUIRED for REFRESH CONCURRENTLY [VERIFIED: postgresql.org/docs/current/sql-refreshmaterializedview.html]
CREATE UNIQUE INDEX deal_cohort_stats_pk
  ON deal_cohort_stats (team_id, school_type, primary_level);

-- Trigger function
CREATE OR REPLACE FUNCTION refresh_deal_cohort_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- needed to own the matview [VERIFIED: github.com/supabase/supabase issues/13779]
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY deal_cohort_stats;
  RETURN NULL;
END;
$$;

CREATE TRIGGER deal_outcomes_refresh_cohort
  AFTER INSERT OR UPDATE OR DELETE ON deal_outcomes
  FOR EACH STATEMENT  -- statement-level: 1 refresh per transaction, not per row
  EXECUTE FUNCTION refresh_deal_cohort_stats();

-- Fallback: pg_cron nightly refresh (consistency safety net)
SELECT cron.schedule(
  'deal-cohort-stats-nightly',
  '0 3 * * *',  -- 03:00 UTC daily
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY deal_cohort_stats $$
);

-- RLS: materialized views don't support RLS directly; team-scoping happens
-- via the included team_id column + a security-definer view on top OR
-- by querying with explicit team_id filter (preferred — simpler).
-- App-side: hook always filters `.eq('team_id', currentTeamId)`.
GRANT SELECT ON deal_cohort_stats TO authenticated;
```
[CITED: postgresql.org/docs/current/sql-refreshmaterializedview.html, supabase.com/docs/guides/cron]

> ⚠ **CONCURRENTLY requirement:** Materialized view MUST have a unique index on a column-set to support `CONCURRENTLY` refresh. The composite unique index `(team_id, school_type, primary_level)` above satisfies this.

> ⚠ **Trigger overhead:** Statement-level trigger fires once per transaction, not per row. Refresh is `O(view-size)` = small for the cohort aggregation. For 500 deals × ~20 cohorts the refresh is ~10ms. Acceptable for real-time UX.

> ⚠ **RLS limitation:** Matview heeft geen RLS-policies. Twee opties: (a) include `team_id` in matview + filter app-side (simpler), of (b) wrap in security-definer regular view. **Aanbevolen: (a)** — past binnen het Phase 25 patroon van expliciete team_id-checks in hooks.

### Pattern 3: TanStack Router validateSearch met Zod (Phase 26 D-02 carry-forward)

**What:** Dashboard route definieert `validateSearch` als runtime guard die ongeldige URL-params naar defaults reset. Filter-state leeft volledig in de URL, geen Zustand store.

**Example:**
```typescript
// src/router/routes.ts (extension)
import { z } from 'zod';

const dashboardSearchSchema = z.object({
  period: z.enum(['30d', '90d', '365d', 'custom']).default('90d'),
  level: z.enum(['vmbo-b', 'vmbo-k', 'vmbo-gt', 'havo', 'vwo', 'alle']).default('alle'),
  trendMetric: z.enum(['count', 'win-rate']).default('count'),
  trendGrouping: z.enum(['week', 'month', 'quarter']).default('month'),
  // Custom date range (only when period='custom')
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export type DashboardSearch = z.input<typeof dashboardSearchSchema>;

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    const result = dashboardSearchSchema.safeParse(search);
    return result.success ? result.data : dashboardSearchSchema.parse({}); // fall back to defaults
  },
  component: lazyRouteComponent(
    () => import('@/features/dashboard/DashboardPage'),
    'DashboardPage',
  ),
});
```
[CITED: tanstack.com/router validate-search-params, existing apps/concurrentoolVO/src/router/routes.ts:56-75 prijzenRoute]

**Hook for consumers:**
```typescript
// src/features/dashboard/hooks/useDashboardFilter.ts
import { useNavigate, useSearch } from '@tanstack/react-router';

export function useDashboardFilter() {
  const search = useSearch({ strict: false }) as DashboardSearch;
  const navigate = useNavigate();
  const set = (next: Partial<DashboardSearch>) =>
    navigate({ to: '/dashboard', search: (prev) => ({ ...prev, ...next }) });
  return { ...search, set };
}
```
[CITED: src/features/pricing/hooks/usePrijzenSearch.ts — established pattern]

### Pattern 4: Zod XOR via `.refine()` (preferred over discriminatedUnion for 2-field)

**What:** `deal_discounts` heeft mutually-exclusive `discountPercentage` of `discountAmount` — exactly one. Database enforces via CHECK constraint (`(a IS NOT NULL) <> (b IS NOT NULL)`). Form layer enforces via `.refine()` op object schema (Zod v4 syntax).

**Example:**
```typescript
// src/features/deal-outcomes/schemas/deal-discount.schema.ts
import { z } from 'zod';

export const dealDiscountSchema = z.object({
  moduleId: z.string().min(1),
  provider: z.enum(['cito', 'dia', 'jij', 'saqi']),
  discountPercentage: z.number().min(0.01, 'Korting moet > 0 zijn').max(100, 'Maximaal 100%').optional(),
  discountAmount: z.number().min(0, 'Korting mag niet negatief zijn').optional(),
}).refine(
  (data) => {
    const hasPct = data.discountPercentage !== undefined && data.discountPercentage !== null;
    const hasAmt = data.discountAmount !== undefined && data.discountAmount !== null;
    return hasPct !== hasAmt; // XOR
  },
  {
    message: 'Vul een korting in als percentage óf als bedrag — niet allebei.',
    path: ['discountPercentage'], // attach error to a field for RHF to surface
  },
);

export type DealDiscountInput = z.input<typeof dealDiscountSchema>;
```

**Why `.refine()` over `discriminatedUnion`:** Discriminated unions require a `type: 'percentage' | 'amount'` discriminator field, which adds a visible UI choice (radio/toggle). For "type one of two inputs, the other auto-disables" UX (UI-SPEC Interaction Patterns), `.refine()` on a flat object is the bondiger pattern and aligns with the UI-SPEC's "typing into the % field disables the € field" behavior.
[CITED: zod.dev/api, dev.to dynamic-forms-with-discriminatedunion-and-react-hook-form]

### Pattern 5: Optimistic vs pessimistic update strategy

**What:** UI-SPEC D-14 stelt expliciet **pessimistic** voor deal-outcome + discount mutations (audit-tracked, conflict-relevant). Filter changes blijven optimistic (URL-state).

**Implementation:**
```typescript
// useDealOutcomeMutation.ts — pessimistic
export function useDealOutcomeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DealOutcomeFormInput) => {
      // Insert audit-log entry IN SAME transaction? Use rpc() or sequential.
      // Approach: sequential client-side write (consistent with Phase 25 pattern)
      const { data, error } = await supabase.from('deal_outcomes').upsert(...).select().single();
      if (error) throw error;
      await supabase.from('deal_audit_log').insert({ ...auditEntry });
      return data;
    },
    // NO optimistic update — wait for server confirm before mutating cache
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['deal-outcome', data.school_id] });
      qc.invalidateQueries({ queryKey: ['deal-stats'] });
      qc.invalidateQueries({ queryKey: ['cohort-prediction'] });
    },
  });
}
```

### Anti-Patterns to Avoid

- **Sync pipeline-status ↔ deal-status:** Per D-14 + SPEC Deviation R2: ABSOLUUT VERBODEN. Deze twee zijn losgekoppeld. Geen auto-set, geen "Pipeline → klant opent WinDealDialog" trigger zoals oorspronkelijke SPEC suggereerde.
- **Inline materialized view refresh in client mutation:** `REFRESH MATERIALIZED VIEW` is een server-side admin-op. NIET aanroepen vanuit Supabase JS client.
- **Mega-component voor DealOutcomesTab:** Phase 27 D-17 patroon enforced — splits in sub-components per logisch blok.
- **Zustand store voor deal-form state:** RHF beheert form-state. Geen extra layer.
- **Eager-load `/dashboard` route:** Bevat Recharts code-split overhead. Gebruik `lazyRouteComponent()` zoals bestaande routes.
- **`useLiveQuery` (dexie-react-hooks) voor deal_outcomes:** TanStack Query is de primaire data-laag voor Supabase-data. Dexie-mirror is alleen offline-fallback, niet de view-bron.
- **`recharts` PieChart zonder `<Cell>` per segment:** Zonder Cell-elementen krijg je default kleuren. Voor de win/lost donut explicit Cell-mapping nodig (zie Code Examples).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Discount XOR-validation | Custom `if-else` on form blur | Zod `.refine()` + RHF `errors` | Single source of truth + auto error-display via RHF |
| Filter state on URL | `useState` + manual URL sync via `window.history` | TanStack Router `validateSearch` + `useSearch` | Type-safe, refresh-safe, deep-link-safe, validation built-in |
| Materialized view refresh queue | Custom Node cron via Vercel function | Postgres `pg_cron` extension | Already enabled in Supabase, no infra, transactional consistency |
| Audit-trail writes | Manual logging in 5 places | DB trigger OR centralized `recordAudit()` helper in operations.ts | Centralize or DB-enforce — never sprinkle. **Recommendation:** centralize in `deal-outcomes-operations.ts` (consistency with Phase 25 pattern) |
| Cohort win-rate calc client-side | Aggregate in JavaScript on full deals fetch | Materialized view in Postgres | Scales to 1000s of deals, single round-trip per page-load |
| Dialog focus-trap | Manual `tabindex` + key handlers | Use `<dialog>` native element OR inline focus-trap (UI-SPEC accepts both) | UI-SPEC line 451-452: "recommend small inline implementation" |
| Currency formatting | Manual `Math.round` + string concat | `Intl.NumberFormat('nl-NL', ...)` | Already used app-wide (UI-SPEC line 210) |
| Snake_case ↔ camelCase mapping for new tables | Manual property-by-property | Mapping functions like `mapPriceRow()` (Phase 25 patroon) — DON'T avoid this, it's the standard | Existing convention, type-safe, testable |

**Key insight:** Het bestaande patroon-DNA van de codebase is "pure-function engines + RHF+Zod forms + TanStack Query hooks + handrolled UI". Phase 28 voegt geen nieuwe categorieën libraries toe — alleen nieuwe instanties van bestaande patterns. Het enige nieuwe DB-mechanisme (materialized view + trigger) is een Postgres-feature, geen npm-dep.

## Common Pitfalls

### Pitfall 1: Veld-naam-mismatch tussen SPEC en codebase ("onderwijsvisie" vs "schoolType")

**What goes wrong:** SPEC en CONTEXT gebruiken consequent het label "onderwijsvisie" voor cohort-feature, maar Phase 27 plan 03 voegt het veld toe als `schoolType` (interfaces line 91: `schoolTypeEnum = z.enum(['regulier', 'dakpanklas', 'dalton', 'montessori', 'vrije-school', 'overig'])`). Plus: SPEC noemt "schoolniveau (vmbo/havo/vwo + sub-types)" maar in code is dat `levels: SchoolLevel[]` met values `vmbo-b | vmbo-k | vmbo-gt | havo | vwo`.

**Why it happens:** SPEC werd geschreven vóór Phase 27 plans bestonden. Discussie-Round 5 (zie SPEC Interview Log) noemde "onderwijsvisie" als sales-term zonder code-binding.

**How to avoid:** Tijdens task-shaping: planner moet expliciet beslissen of (a) Phase 28 cohort gebruikt `schoolType` veld (eenvoudig — match Phase 27), of (b) een nieuwe `onderwijsvisie` kolom toevoegen los van `schoolType` (extra werk + redundancy). **Aanbeveling: (a)** — Dutch UI-label blijft "Onderwijsvisie" maar code-veld is `schoolType`. Map in `labels.ts`.

**Warning signs:** Plan-tasks die migrations `015_school_sales_context.sql` (Phase 27) overlappen met een nieuwe `onderwijsvisie` kolom. Cohort-lookup queries die naar `s.onderwijsvisie` verwijzen i.p.v. `s.school_type`.

### Pitfall 2: Migration-nummer-conflicten met Phase 27 in-flight work

**What goes wrong:** Phase 27 plan 03 reserveert `015_school_sales_context.sql`. Als Phase 27 nog niet gemerged is wanneer Phase 28 start, en Phase 28 schrijft `015_deal_outcomes.sql`, ontstaat een nummer-conflict bij merge.

**Why it happens:** Twee parallelle phases die migrations toevoegen aan dezelfde folder.

**How to avoid:** Phase 28 begint sequentieel **na** Phase 27 (per ROADMAP: "Depends on: Phase 27"). Plan-tasks lezen FIRST de huidige migration-folder en kiezen het volgende beschikbare nummer. Aanbevolen: planner schrijft `ls supabase/migrations/` als pre-flight check in Plan 02.

**Warning signs:** Conflicting migration-files in git status na merge.

### Pitfall 3: Materialized view ownership / SECURITY DEFINER

**What goes wrong:** In Supabase ontstaat regelmatig "must be owner of materialized view" foutmelding bij REFRESH commando's vanuit applicatie- of trigger-context. De matview wordt aangemaakt door de migration-runner (postgres user) maar de trigger draait als de calling user (anon/authenticated).

**Why it happens:** Materialized view REFRESH vereist owner-rechten. Triggers draaien standaard als de calling user, niet de matview-eigenaar.

**How to avoid:** Trigger-functie expliciet markeren als `SECURITY DEFINER` + `SET search_path = public`. Idem voor de pg_cron job (cron jobs draaien als de schedulende user — zorg dat dat postgres is). [VERIFIED: github.com/supabase/supabase issues/13779, supabase Discussion #16946]

**Warning signs:** Foutmelding "must be owner of materialized view deal_cohort_stats" bij eerste deal-mutation, of geluidloos uitblijven van refresh (cohort-stats blijven stale).

### Pitfall 4: REFRESH CONCURRENTLY zonder unique index

**What goes wrong:** Eerste deal-write faalt met `cannot refresh materialized view "deal_cohort_stats" concurrently` als de matview geen unique index heeft.

**Why it happens:** PostgreSQL vereist dat een matview een unique index heeft om `CONCURRENTLY` te ondersteunen — anders zou de "swap-in atomically" niet werken.

**How to avoid:** ALTIJD `CREATE UNIQUE INDEX` direct na `CREATE MATERIALIZED VIEW`. Test-case: maak de matview, refresh CONCURRENTLY zonder index → faal — voeg index toe → slaag. [VERIFIED: postgresql.org/docs/current/sql-refreshmaterializedview.html]

**Warning signs:** Trigger errors in Supabase logs, deal-outcome write die "succeeds" maar cohort-card toont stale data.

### Pitfall 5: Test-data race condities bij cohort N=0 / N=1-4 / N≥5

**What goes wrong:** UI-SPEC vereist drie verschillende UI-states voor N=0 (fallback-tekst), N=1-4 (lage betrouwbaarheid disclaimer), N≥5 (full prediction). Tests moeten alle drie covereren maar met de matview-refresh-delay kunnen tests racing zijn.

**Why it happens:** Trigger refresh is na de write maar matview-query kan oude data zien als async-resolved te snel.

**How to avoid:** In tests gebruik `await supabase.rpc('refresh_deal_cohort_stats')` (expose als RPC) of poll de matview tot expected state, of test pure-function `formatCohortPrediction(stats)` los van DB.

**Warning signs:** Tests die soms slagen, soms falen op cohort-card content.

### Pitfall 6: Recharts ResponsiveContainer height = 0

**What goes wrong:** `<ResponsiveContainer>` zonder explicit height op de parent renders nothing.

**Why it happens:** ResponsiveContainer measure parent height; als parent is `display:block` zonder height, het wordt 0.

**How to avoid:** Parent altijd `h-64` / `min-h-[300px]` of explicit `height` prop op ResponsiveContainer (zie bestaande `ComparisonChart.tsx` lijn 221: `height={isMobile ? 280 : 340}`).

**Warning signs:** Chart-canvas leeg, geen errors in console.

### Pitfall 7: Vergelijking-tab UI weet niet welke deal "open" is

**What goes wrong:** R3 acceptance vereist dat vergelijking-tab herberekende totalen toont **wanneer de geopende deal kortingen heeft**. Maar de vergelijking-tab heeft geen ingebouwd concept van "current open deal".

**Why it happens:** Phase 28 voegt een dwarsdoorsnijdend concept toe (per-deal context) aan een bestaande tab die alleen de school-store leest.

**How to avoid:** Twee opties: (a) Vergelijking-tab leest `useDealOutcome(schoolId)` direct, vindt eerste open/in_negotiation deal, passes `dealDiscounts` aan `calculateComparison()`; (b) Voeg toggle "Toon met deal-kortingen" toe in vergelijking-tab. **Aanbeveling: (a)** — past bij D-03 "real-time recalc" zonder extra UI-toggle. Tonen badge "Inclusief deal-kortingen" wanneer actief.

**Warning signs:** Reviewer vraagt "hoe weet de vergelijking-tab welke deal?".

## Runtime State Inventory

Dit is geen rename/refactor-phase — maar wel een phase die een bestaand component (`LostDealDialog.tsx`) verwijdert en data-types muteert (`LostDealInfo` wordt sub-type van `DealOutcome`). Deze sectie inventariseert runtime state om regressies te voorkomen.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `schools.lost_deal_info JSONB` kolom in Supabase (zie 001_initial_schema.sql:46). Bevat oude testdata, geen productie-records (per SPEC: "alle bestaande data is testdata, schone start"). | **Geen migratie nodig.** Kolom mag blijven bestaan (backward compat) of expliciet droppen in 014. Aanbeveling: laten staan + ignore, drop in toekomstige cleanup-phase. |
| Live service config | Vercel project env vars (Supabase URL, anon key) — niet aangeroerd door Phase 28. | None |
| OS-registered state | Geen — geen cron-jobs, geen taakplanner-items, geen pm2-processen op deze app. | None |
| Secrets/env vars | `VITE_ANTHROPIC_API_KEY` — niet gebruikt door Phase 28 (cohort-AI is statistisch, geen LLM-call per CONTEXT). | None |
| Build artifacts / installed packages | Vite-cache + dist/ worden ververst bij elke build. Geen long-lived artifacts. | None |
| Type-imports van LostDealInfo | `src/db/types.ts` exporteert `LostDealInfo`; importeurs: `LostDealDialog.tsx` (deleted), mogelijk ook `operations.ts` mapper (`lost_deal_info: row.lost_deal_info ?? undefined`) en `mapSchoolUpdateToSnakeCase`. | **Code edit:** behoud `LostDealInfo` als legacy-type maar verwijder als referentie elders. ProfileHeader pipeline-dropdown verwijst er mogelijk naar. Plan-task moet grep doen op `LostDealInfo` na Plan 8. |
| Dexie schema | `database.ts` heeft version(2). Phase 27 plan 03 verhoogt naar version(3). Phase 28 voegt geen Dexie-fields toe als deal_outcomes NIET wordt gespiegeld in Dexie. **Beslissing nodig:** mirror deal_outcomes in Dexie voor offline-view of niet? | Aanbeveling: **GEEN Dexie-mirror voor Phase 28 tabellen.** Deal-records zijn altijd online-only (sales-context); offline schools mirror is voor wizard-functionaliteit. Bespaart een upgrade-version + complexiteit. |
| LostDealDialog import sites | Een grep is nodig — kan in `ProfileHeader.tsx`, een pipeline-status-handler component, en/of `school-overview` zijn. | **Plan-task:** grep `LostDealDialog` voor Plan 8 cleanup, verwijder alle imports + rendering. |

**Nothing found in category:** Cron-jobs (none — only updated_at trigger functions); Persistent client-side state (Zustand stores van Phase 28 = none, alleen RHF in-component state).

## Code Examples

### Currency formatting + percentage formatting (UI-SPEC carry-forward)

```typescript
// Reuse Intl.NumberFormat (geen externe lib)
export const formatCurrencyCompact = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format;

export const formatPercent = new Intl.NumberFormat('nl-NL', {
  style: 'percent',
  maximumFractionDigits: 0,
}).format;
```
[CITED: existing src/lib/format.ts pattern]

### Recharts Donut for Cito vs DIA win-rate

```tsx
// src/features/dashboard/components/CompetitorBreakdownCard.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  won: '#16a34a',
  lost: '#dc2626',
  open: '#ea580c',
};

interface CompetitorBreakdownData {
  won: number;
  lost: number;
  open: number;
}

export function CompetitorBreakdownCard({
  competitor,
  data,
}: {
  competitor: 'dia' | 'jij';
  data: CompetitorBreakdownData;
}) {
  const total = data.won + data.lost + data.open;
  const winRate = total > 0 ? (data.won / (data.won + data.lost || 1)) * 100 : 0;
  const pieData = [
    { name: 'Gewonnen', value: data.won, key: 'won' },
    { name: 'Verloren', value: data.lost, key: 'lost' },
    { name: 'Open', value: data.open, key: 'open' },
  ];

  return (
    <article className="bg-white rounded-lg p-6">
      <h2 className="text-[20px] font-semibold text-cito-primary mb-2">
        Cito vs {competitor === 'dia' ? 'DIA' : 'JIJ'}
      </h2>
      <p className="text-[28px] font-semibold text-cito-primary tabular-nums">
        {formatPercent(winRate / 100)}
      </p>
      <p className="text-[12px] text-neutral-500 mb-4">Win-rate · N={total}</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
          >
            {pieData.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </article>
  );
}
```
[CITED: Recharts docs api/PieChart, existing ComparisonChart.tsx Tooltip pattern]

### Recharts TrendChart with toggle Y-axis

```tsx
// src/features/dashboard/components/TrendChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPercent, formatCurrencyCompact } from '@/lib/format';

interface TrendPoint {
  period: string;       // e.g. "2026-W18" or "2026-04"
  count: number;
  winRate: number;       // 0-1
}

export function TrendChart({ data, metric }: { data: TrendPoint[]; metric: 'count' | 'win-rate' }) {
  const dataKey = metric === 'count' ? 'count' : 'winRate';
  const yFormatter = metric === 'count'
    ? (v: number) => v.toString()
    : (v: number) => formatPercent(v);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="period" />
        <YAxis tickFormatter={yFormatter} />
        <Tooltip formatter={yFormatter} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#003082"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### RHF + Zod XOR form (DiscountRow)

```tsx
// src/features/deal-outcomes/components/DiscountRow.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dealDiscountSchema, type DealDiscountInput } from '../schemas/deal-discount.schema';

export function DiscountRow({ initial, onSave }: { initial?: DealDiscountInput; onSave: (data: DealDiscountInput) => void }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<DealDiscountInput>({
    resolver: zodResolver(dealDiscountSchema),
    mode: 'onBlur',
    defaultValues: initial,
  });

  const pct = watch('discountPercentage');
  const amt = watch('discountAmount');
  const pctDisabled = amt !== undefined && amt !== null && !Number.isNaN(amt);
  const amtDisabled = pct !== undefined && pct !== null && !Number.isNaN(pct);

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex items-center gap-3 h-11">
      <input
        type="number"
        step="0.01"
        {...register('discountPercentage', { valueAsNumber: true })}
        disabled={pctDisabled}
        placeholder="Korting %"
        aria-invalid={!!errors.discountPercentage}
      />
      <span className="text-[12px] text-neutral-500">of</span>
      <input
        type="number"
        step="0.01"
        {...register('discountAmount', { valueAsNumber: true })}
        disabled={amtDisabled}
        placeholder="Korting €"
        aria-invalid={!!errors.discountAmount}
      />
      <button type="submit" disabled={isSubmitting}>Opslaan</button>
      {errors.discountPercentage && (
        <span role="alert" className="text-red-600 text-[12px]">{errors.discountPercentage.message}</span>
      )}
    </form>
  );
}
```
[CITED: RHF + Zod v4 + zodResolver pattern from existing schemas/]

### Cohort-prediction lookup hook

```typescript
// src/features/deal-outcomes/hooks/useCohortPrediction.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useCohortPrediction(schoolType: string | null, primaryLevel: string | null, teamId: string | null) {
  return useQuery({
    queryKey: ['cohort-prediction', schoolType, primaryLevel, teamId],
    queryFn: async () => {
      if (!schoolType || !primaryLevel || !teamId) return null;
      const { data, error } = await supabase
        .from('deal_cohort_stats')
        .select('total_deals, won_deals, lost_deals, win_rate, top_lost_reason')
        .eq('team_id', teamId)
        .eq('school_type', schoolType)
        .eq('primary_level', primaryLevel)
        .maybeSingle();
      if (error) throw error;
      return data; // null if no row → cohort N=0 fallback
    },
    enabled: !!(schoolType && primaryLevel && teamId),
    staleTime: 5 * 60 * 1000, // 5min — matview refreshes on every deal write anyway
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LostDealDialog as inline pipeline-status-handler | Dedicated Uitkomst-tab with full deal-lifecycle | Phase 28 (this) | Replaces a single-purpose dialog with a stateful tab. LostDealDialog deletion is part of Plan 8. |
| Discount via market-aggregate (MarktKortingToggle, KortingsPatroonAlert) | Market-aggregate + per-deal kortingen as separate layers | Phase 28 (this) | Market layer untouched (Phase 25). Per-deal is a new dimension. |
| Pipeline-status as deal-outcome proxy | Pipeline = procesfase, Uitkomst = eindstand, GEEN sync | Phase 28 (this) | Decouples sales pipeline from deal-result tracking. Both visible separately. |
| Filter-state in Zustand store | Filter-state in TanStack Router search-params | Phase 26 D-02 carry-forward | Deeplinkable, refresh-safe URLs. |
| Pure-function engine with fixed signature | Pure-function engine + optional `dealDiscounts` overlay parameter | Phase 28 (this) | Backward-compatible extension. Existing call sites pass `options` without `dealDiscounts`. |

**Deprecated/outdated:**
- `LostDealDialog.tsx` — vervangen door `LostDealForm.tsx` binnen DealAfsluitenDialog (Plan 4 + 8)
- `schools.lost_deal_info JSONB` kolom — niet meer geschreven (data leeft in deal_outcomes), kolom blijft bestaan voor backward compat tot toekomstige cleanup-phase

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 28 cohort-feature `onderwijsvisie` mapt op Phase 27's `schoolType` veld in code | Pitfall 1, Architecture Patterns | HOOG — als de planner een aparte `onderwijsvisie` kolom toevoegt, ontstaat redundante data en niet-gespecificeerd Phase 27/28 schema-conflict. **Vereist user-confirmatie tijdens task-shaping.** |
| A2 | Phase 28 cohort-feature `schoolniveau` mapt op de eerste entry van `schools.levels: SchoolLevel[]` | Architecture Patterns matview SQL | MIDDEL — `levels` is array (multi-level scholen kunnen vmbo+havo+vwo bevatten). `levels[1]` (1-indexed in Postgres) als primaire cohort-bin is een keuze. Alternatieven: meest-leerlingen-niveau, of "alle niveaus apart als rij". Planner moet beslissen. |
| A3 | Audit-log writes gebeuren client-side via `deal-outcomes-operations.ts` (consistent met Phase 25 patroon), niet via DB-trigger | Pattern 5, Don't Hand-Roll table | LAAG — beide werken. DB-trigger is robuuster, client-side is consistenter met bestaand code-DNA. CONTEXT D-03 is dubbelzinnig ("dedicated tabel" — niet specifiek over wie schrijft). |
| A4 | Matview-refresh via trigger statement-level + pg_cron fallback is acceptabel, geen Edge Function nodig | Pattern 2 | LAAG — Supabase ondersteunt beide volledig. Trigger fires ~paar keer per dag (lage volume), refresh is goedkoop. |
| A5 | TanStack Query staleTime 5min op cohort-prediction is acceptabel UX | useCohortPrediction code example | LAAG — als matview refresht na elke deal-write, cache wordt invalidated bij elke deal-mutation door dezelfde gebruiker. Cross-user cache-staleness max 5min. UI-SPEC vereist geen real-time. |
| A6 | Dexie-mirror voor deal_outcomes is NIET nodig (online-only feature) | Runtime State Inventory | LAAG — sales-context is altijd in een gesprek/online. Offline-fallback voor school-data blijft via bestaande Dexie. |
| A7 | Migration-nummers `014_deal_outcomes.sql` → `017_deal_cohort_stats_view.sql` zijn beschikbaar (afhankelijk van Phase 27 plan 03 status) | Project Structure | MIDDEL — Phase 27 plan 03 reserveert 015. Planner moet bij execute-tijd hernummeren als 014/015/016/017 collision met Phase 27 014/015. |
| A8 | Comparison-tab leest `useDealOutcome(schoolId)` direct en past `dealDiscounts` automatisch toe als open deal heeft kortingen (geen toggle) | Pitfall 7 | MIDDEL — UI-keuze. Alternatief: expliciete "Toon deal-kortingen" toggle. UI-SPEC suggereert real-time recalc maar specificeert niet de vergelijking-tab UX-flow. |
| A9 | Phase 28 voegt geen nieuwe Zustand store toe; alle state via RHF (forms) + TanStack Query (server-data) + URL search-params (filters) | Architecture Patterns | LAAG — past in app-wide pattern. CONTEXT D-06 LOCKED search-params voor filters. |
| A10 | RLS-pattern voor `deal_cohort_stats` matview: include `team_id` kolom + filter app-side i.p.v. wrapper security-definer view | Pattern 2 RLS note | LAAG — beide acceptabel. Include-team_id is simpler. |
| A11 | Audit-log includes user-id + timestamp + before/after JSONB; geen apart `discount_id` veld omdat `entity_id` deal_outcome_id is en in `before_value`/`after_value` zit de discount-row | D-03 interpretatie | MIDDEL — CONTEXT D-03 zegt "audit-log dedicated tabel" maar specificeert geen kolom-shape exact. Aanbeveling: include `entity_type` ('deal_outcome' \| 'deal_discount') + `entity_id` (de specifieke row) zodat audit-log fine-grained is. |

**Action voor planner:** Tijdens task-shaping in Plan 01 (Wave 0), MUST verify A1 (onderwijsvisie ↔ schoolType mapping) en A7 (migration nummering) expliciet met user — anders bouwt phase op verkeerde fundament. Andere assumptions kunnen achteraf gecorrigeerd worden binnen Claude's discretion.

## Open Questions

1. **Welke `level` is "primary level" voor multi-level scholen?**
   - What we know: `schools.levels: SchoolLevel[]` kan meerdere niveaus bevatten (vmbo-b + vmbo-k + havo etc.).
   - What's unclear: Cohort-aggregatie kan niet 1-op-1 op array. Welke entry is "het" niveau?
   - Recommendation: Plan 02 of 07 task voor user-confirmatie. Default: `levels[0]` als primary; alternatief: meest-leerlingen niveau op basis van `student_counts`. **Document beslissing in code-comment in 017 migration.**

2. **Wat als school zowel vmbo-b én vmbo-k heeft? Worden die samengevoegd tot "vmbo"?**
   - What we know: SPEC noemt "vmbo/havo/vwo + sub-types" als filter-niveau.
   - What's unclear: Cohort-bin granulariteit. Sub-types of niveau-rollup?
   - Recommendation: Sub-type granulariteit (vmbo-b, vmbo-k, vmbo-gt apart) — meer specifiek = betere cohort-match wanneer N stijgt. Dashboard filter-UI kan "alle vmbo" optie tonen die client-side `IN ('vmbo-b','vmbo-k','vmbo-gt')` filtert.

3. **Custom date-range filter — hoe valideren in TanStack search-params?**
   - What we know: UI-SPEC noemt period: `30d / 90d / 365d / custom`. Custom betekent `from` + `to` datums.
   - What's unclear: Zod validation voor cross-field constraint (`from < to`).
   - Recommendation: `.refine()` op het search-schema. Of: hou period=custom als signal en `from`/`to` als optional, valideer in component. **Aanbeveling: refine in schema.**

4. **Discount-effect-display: hoe toont DiscountRow de € impact?**
   - What we know: UI-SPEC noemt "Effect" kolom in DiscountEditor.
   - What's unclear: Real-time recalc moet effect tonen ("besparing € X per leerling"). Komt dit van engine of inline berekening?
   - Recommendation: Inline berekening in component (base × discount). Engine wordt aangeroepen voor totaal-impact maar niet per-row.

5. **WinDealDialog "Heropen deal" flow (UI-SPEC line 295)**
   - What we know: UI-SPEC noemt heropen-confirmation modal voor won/lost deals.
   - What's unclear: Wat gebeurt er met de geheropende deal? Status terug naar `open` of nieuwe `deal_outcomes` row?
   - Recommendation: D-01 zegt "Bij nieuwe deal-cyclus: oude record `status='archived'` zetten, nieuwe op `open`". Heropen = archiveer huidige + maak nieuwe op `open`. Confirmeer in plan.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase Postgres | All persistence | ✓ | (cloud) | None — required |
| `pg_cron` extension | Matview fallback refresh (nightly) | ✓ | bundled in Supabase | If pg_cron disabled, trigger-only refresh suffices for MVP |
| `recharts` | Dashboard charts | ✓ | 3.8.0 in package.json | None — already installed |
| `react-hook-form` | All forms | ✓ | 7.71.2 | None |
| `zod` v4 | All schemas | ✓ | 4.3.6 | None |
| TanStack Router | Routes + search-params | ✓ | 1.168.1 | None |
| TanStack Query | Data hooks | ✓ | 5.94.5 | None |
| Dexie | Offline-mirror | ✓ | 4.3.0 | Not used by Phase 28 (online-only feature) |
| `npm run build` | Type-check + bundle | ✓ | Vite 8 | None |
| `npx vitest run` | Unit tests | ✓ | Vitest 4 | None |
| `npx playwright test` | E2E tests | ✓ | 1.58.2 | None — opt-in for happy-path |

**Missing dependencies with no fallback:** None — all required tooling already installed.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + Playwright 1.58.2 (e2e) |
| Config file | `apps/concurrentoolVO/vitest.config.ts` |
| Quick run command | `cd apps/concurrentoolVO && npx vitest run --reporter=verbose -t <pattern>` |
| Full suite command | `cd apps/concurrentoolVO && npm run build && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R1 (Uitkomst-tab) | Status-mutation + form-save + edit-existing | component | `npx vitest run src/features/deal-outcomes/components/__tests__/DealOutcomesTab.test.tsx` | ❌ Wave 0 |
| R2 (WinDealDialog) | Pessimistic create + confirm → `deal_outcomes` row | component | `npx vitest run src/features/deal-outcomes/components/__tests__/WinDealDialog.test.tsx` | ❌ Wave 0 |
| R3 (Per-deal korting recalc) | Engine extension: dealDiscounts overlay → correct totals | unit (engine) | `npx vitest run src/engine/__tests__/price-comparison.test.ts -t "dealDiscounts"` | ❌ Wave 0 — extend existing |
| R3 (Audit-log write) | Each discount mutation appends audit-row | unit (operations) | `npx vitest run src/db/__tests__/deal-outcomes-operations.test.ts -t "audit"` | ❌ Wave 0 |
| R3 (XOR % vs €) | Zod schema rejects both/neither | unit (schema) | `npx vitest run src/features/deal-outcomes/schemas/__tests__/deal-discount.schema.test.ts` | ❌ Wave 0 |
| R3 (XOR DB constraint) | INSERT both columns fails | integration (DB) | manual via supabase CLI seed test OR rpc test | ❌ Wave 0 — manual |
| R4 (Dashboard filters) | URL search-params type-safe + invalid → defaults | unit (router) | `npx vitest run src/router/__tests__/routes.test.ts -t "dashboard validateSearch"` | ❌ Wave 0 |
| R4 (KPI aggregates) | useDealStats returns expected counts for filtered set | hook (mock supabase) | `npx vitest run src/features/dashboard/hooks/__tests__/useDealStats.test.ts` | ❌ Wave 0 |
| R4 (Empty-state, N=0) | Dashboard renders empty-state when no deals | component | `npx vitest run src/features/dashboard/__tests__/DashboardPage.test.tsx -t "empty"` | ❌ Wave 0 |
| R4 (Reliability banner) | N < 10 → banner shows | component | (same as above with N=5 fixture) | ❌ Wave 0 |
| R5 (Cohort N=0) | `useCohortPrediction` returns null → fallback text | hook + component | `npx vitest run src/features/deal-outcomes/components/__tests__/CohortPredictionCard.test.tsx -t "N=0"` | ❌ Wave 0 |
| R5 (Cohort N=1-4) | "lage betrouwbaarheid" disclaimer rendered | component | (same as above with cohort fixture) | ❌ Wave 0 |
| R5 (Cohort N≥5) | Full prediction + top-lost-reason | component | (same as above) | ❌ Wave 0 |
| R5 (Missing schoolType) | Card shows "Onvoldoende schoolgegevens" + CTA | component | (same as above) | ❌ Wave 0 |
| R1+R3 (LostDealDialog removal) | Grep finds no import of `LostDealDialog` after Plan 8 | grep gate | `grep -r "LostDealDialog" apps/concurrentoolVO/src \| grep -v __tests__` | ❌ Plan 8 |
| All 21 ACs | Happy-path: open school → register deal → see dashboard | e2e | `npx playwright test deal-outcome-flow.spec.ts` | ❌ Plan 8 — final |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose -t <task-pattern>` (15-30s)
- **Per wave merge:** `npm run build && npx vitest run` (~90s)
- **Phase gate:** Full suite green + Playwright happy-path green + manual UAT on `/dashboard` + Uitkomst-tab

### Wave 0 Gaps

- [ ] `src/engine/__tests__/price-comparison.test.ts` — extend with `dealDiscounts` describe block (R3 engine)
- [ ] `src/features/deal-outcomes/schemas/__tests__/deal-discount.schema.test.ts` — XOR validation (R3 schema)
- [ ] `src/features/deal-outcomes/schemas/__tests__/deal-outcome.schema.test.ts` — status enum + form-fields (R1)
- [ ] `src/features/deal-outcomes/components/__tests__/DealOutcomesTab.test.tsx` — container behavior (R1)
- [ ] `src/features/deal-outcomes/components/__tests__/DealAfsluitenDialog.test.tsx` — radiogroup dispatch (R1)
- [ ] `src/features/deal-outcomes/components/__tests__/WinDealDialog.test.tsx` — pessimistic submit (R2)
- [ ] `src/features/deal-outcomes/components/__tests__/LostDealForm.test.tsx` — form validation + submit (R1+R2)
- [ ] `src/features/deal-outcomes/components/__tests__/DiscountEditor.test.tsx` — table CRUD + XOR UX (R3)
- [ ] `src/features/deal-outcomes/components/__tests__/CohortPredictionCard.test.tsx` — N=0/1-4/≥5 + missing features (R5)
- [ ] `src/features/dashboard/__tests__/DashboardPage.test.tsx` — empty + populated + filter-state (R4)
- [ ] `src/features/dashboard/hooks/__tests__/useDealStats.test.ts` — aggregate logic (R4)
- [ ] `src/features/dashboard/hooks/__tests__/useDealTrend.test.ts` — time-series grouping (R4)
- [ ] `src/db/__tests__/deal-outcomes-operations.test.ts` — CRUD + audit-log writes (R1+R3)
- [ ] `e2e/deal-outcome-flow.spec.ts` — Playwright happy-path (Plan 8 gate)
- [ ] No framework install needed — Vitest + Playwright already configured

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (carry-forward Phase 8) — no Phase 28 changes |
| V3 Session Management | yes | Supabase JWT session — no Phase 28 changes |
| V4 Access Control | yes | RLS per `team_id` on all three new tables + matview (column-filtered) |
| V5 Input Validation | yes | Zod schemas on every form (RHF + zodResolver) — DealAfsluiten, WinDeal, LostDeal, DiscountRow + URL search-params |
| V6 Cryptography | no | No new secrets, no new cryptographic operations |
| V8 Data Protection | yes | RLS team-scoping; audit-log records user-id + timestamp for traceability (AUTH-03 requirement) |
| V9 Communications | yes | HTTPS-only (Vercel default); Supabase client uses TLS |
| V12 Files and Resources | no | No new file uploads in Phase 28 |
| V13 API and Web Service | yes | All mutations go via supabase-js client (no custom REST endpoints) |

### Known Threat Patterns for Vite SPA + Supabase + Postgres stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection in dynamic queries | Tampering | Supabase JS client parameterizes all inputs — no string concat. New SQL only in migration files (controlled). |
| Cross-team data leakage (e.g. seeing other team's deals) | Information Disclosure | RLS `team_id = get_user_team_id()` on all three tables + explicit `.eq('team_id', currentTeamId)` filter on matview reads |
| Audit-log tampering by user | Repudiation | `user_id` set server-side from `auth.uid()`; RLS allows INSERT only with `auth.uid() = user_id`; UPDATE/DELETE denied for non-managers |
| Cohort-stats data inference (small-cohort identifiability) | Information Disclosure | UI shows N-badge; for N=1-4 disclaimer. No further mitigation needed — same team_id scope already prevents cross-team inference. |
| Discount-bypass via direct DB write | Tampering | DB CHECK constraint enforces XOR; client validation in Zod; both layers required (defense-in-depth) |
| Filter param injection (e.g. `?period=<script>`) | Tampering / XSS | TanStack Router `validateSearch` rejects invalid → defaults. React DOM escapes all text rendering. |
| Stale matview leaking removed deal data | Information Disclosure | Matview refresh on every deal-write via trigger; if deal is deleted, refresh ensures it's gone from cohort-stats |

**Compliance note:** Phase 28 introduceert geen PII die niet al door Phase 8 RLS gedekt is. Audit-log voldoet aan AUTH-03 ("Elke wijziging toont wie/wanneer"). No GDPR/AVG-specifieke acties nodig — schooldata is bedrijfsgegevens, geen persoonsgegevens.

## Sources

### Primary (HIGH confidence)

- **postgresql.org/docs/current/sql-refreshmaterializedview.html** — REFRESH MATERIALIZED VIEW CONCURRENTLY requirements, unique index, atomic swap
- **supabase.com/docs/guides/cron** — pg_cron job scheduling syntax, refresh patterns
- **tanstack.com/router/latest/docs/how-to/validate-search-params** — validateSearch + Zod adapter (v4 standard schema) + manual function pattern
- **zod.dev/api** — discriminatedUnion + refine + XOR semantics in Zod v4
- **dev.to/csar_zoleko_e6c3bb497f0d/dynamic-forms-with-discriminatedunion-and-react-hook-form** — RHF + zod discriminated-union pattern
- **github.com/supabase/supabase issues/13779 + Discussion #16946** — SECURITY DEFINER requirement for matview ownership
- **apps/concurrentoolVO/src/engine/price-comparison.ts** — existing Scenario C override pattern as template
- **apps/concurrentoolVO/src/features/pricing/hooks/usePrijzenSearch.ts** — existing TanStack Router search-params hook pattern
- **apps/concurrentoolVO/src/features/school-profile/components/LostDealDialog.tsx** — existing dialog overlay pattern
- **apps/concurrentoolVO/supabase/migrations/011_price_proposals.sql + 012_price_audit_log.sql** — existing audit-log + RLS pattern
- **apps/concurrentoolVO/.planning/phases/28-*/28-SPEC.md + 28-CONTEXT.md + 28-UI-SPEC.md** — locked requirements + decisions

### Secondary (MEDIUM confidence)

- **medium.com Muhammad Ikram pg_cron materialized view refresh** — cross-verified with PostgreSQL docs
- **GeeksforGeeks Recharts Donut innerRadius** — basic API pattern, verified against existing ComparisonChart.tsx
- **Phase 26 + 27 CONTEXT.md** — search-params + sub-component composition patterns carried forward

### Tertiary (LOW confidence)

- npm view for recharts/zod/tanstack-router versions — registry unreachable in current env; fell back to `package.json` lockfile values (verified against project)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libs in package.json, no upgrade required
- Architecture: HIGH — CONTEXT decisions locked, mirrors existing app patterns
- Pitfalls: HIGH — sourced from PostgreSQL/Supabase docs + cross-phase analysis
- Cohort-feature naming (onderwijsvisie↔schoolType): MEDIUM — explicit assumption requiring user confirmation
- Trigger vs client-side audit-log: MEDIUM — CONTEXT D-03 dubbelzinnig

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (Recharts/Zod/TanStack Router are stable; matview-trigger pattern is unchanged for years)
