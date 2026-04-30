# Phase 25: Prijsintelligentie & Stakeholder Feedback Loop - Research

**Researched:** 2026-03-30
**Domain:** Database-driven pricing with review workflow, offline fallback, AI normalization, discount pattern detection
**Confidence:** HIGH

## Summary

Phase 25 transforms the pricing data layer from hardcoded TypeScript files to a Supabase-backed system with a stakeholder feedback workflow. The codebase already has strong foundations: provider configs in `src/data/providers/*.ts` with typed pricing strategies (PlatformModulePricing, PackageBundlePricing, TieredLicensePricing, FlatPricing), pure-function calculators with the `ProviderPriceCalculator` interface, school-specific price overrides in Supabase (`school_prices` table), React Query data fetching patterns, and Zustand stores with persist middleware. The existing `DEFAULT_PRICES` aggregator and `PROVIDER_CONFIGS` map are the two main integration points that need async alternatives.

The key architectural challenge is maintaining calculator purity while switching data sources. The CONTEXT.md decision D-03 (store-first loading) is the correct pattern: load all publication prices + pricing configs into a Zustand store at app start, then pass configs as parameters to calculators. This keeps engines synchronous and pure. The review workflow adds 3 new Supabase tables (`publication_prices`, `pricing_configs`, `price_proposals`) with RLS policies that leverage the existing `get_user_role()` and `get_user_team_id()` helper functions. The `/review` route for managers fits cleanly into the existing TanStack Router setup.

**Primary recommendation:** Build in 3 layers: (1) database schema + seed migration + data provider with fallback, (2) review workflow (proposals, queue, approval flow), (3) intelligence features (pattern detection, staleness alerts, market discount toggle, admin config editor).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Database-first met TS-fallback -- app leest prijzen, pricing configs en differentiators uit Supabase. Bij offline/fout: fallback naar huidige TS-bestanden als laatst-bekende-goede-staat.
- **D-02:** Automatische seed bij deploy -- bij eerste Supabase-migratie worden alle huidige TS-bestanden (`src/data/providers/*.ts`, `src/data/differentiators.ts`, `src/data/provider-module-content.ts`) automatisch omgezet naar database-records. Eenmalig, daarna leeft de data in de DB.
- **D-03:** Store-first loading -- bij app-start worden alle publication prices + configs uit Supabase geladen in een Zustand store. Calculators blijven synchroon en puur (pure functions) -- ze krijgen config als parameter i.p.v. directe TS-import. Minimale engine-wijziging.
- **D-04:** Offline cache via localStorage -- laatst opgehaalde prijsdata wordt gecached in localStorage. Bij offline: gebruik cache + banner "Prijsdata mogelijk niet actueel". Bij online: automatisch verversen.
- **D-05:** Iedereen (accountmanagers + managers) kan prijsvoorstellen indienen -- laagdrempelig, de kracht zit in het reviewproces.
- **D-06:** Managers (bestaande rol uit Phase 8 auth) keuren voorstellen goed of af. Geen nieuwe rollen nodig.
- **D-07:** Centrale review-pagina (`/review`) alleen voor managers -- alle openstaande voorstellen met filters op provider, module, status.
- **D-08:** Direct actief na goedkeuring + automatisch herberekenen -- goedgekeurde prijs wordt meteen de actieve publicatieprijs. Alle schoolvergelijkingen herberekend bij volgende view.
- **D-09:** In-app badge/teller -- badge op het review-menu-item die het aantal openstaande voorstellen toont. Geen externe notificaties.
- **D-10:** Admin-editor in de app -- managers krijgen een configuratie-editor voor bundels/tiers/pakketten.
- **D-11:** Structuurwijzigingen meerdere keren per jaar -- editor moet flexibel genoeg zijn voor alle pricing strategies.
- **D-12:** AI normaliseert en valideert alle input ongeacht kanaal. AI matcht op juiste module-ID, provider-key, bedrag in EUR.
- **D-13:** Automatische patroondetectie -- 3+ scholen vergelijkbare korting = signalering.
- **D-14:** Marktkorting als optioneel vergelijkingsscenario -- toggle in vergelijking.
- **D-15:** ops-competitor-intel skill scope = prijzen + features + differentiators.
- **D-16:** Skill als orchestrator -- hergebruikt document-upload parser en AI-extractie.

### Claude's Discretion
- Supabase tabelschema voor publication_prices, pricing_configs, price_proposals
- RLS policies voor de review-flow (manager vs accountmanager)
- Admin-editor component design en UX
- Exacte patroondetectie-algoritme (drempelwaarden, vergelijkingslogica)
- Staleness-detectie implementatie (6 maanden threshold)
- Store-architectuur voor de pricing config (nieuw store of extensie van bestaand)
- AI system prompt voor normalisatie en validatie
- Audittrail tabelstructuur

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.3 (latest: 2.101.0) | Database, auth, storage, RLS | Already used for all data operations |
| @tanstack/react-query | ^5.94.5 (latest: 5.95.2) | Server state management, caching, invalidation | Already used for all Supabase data fetching |
| zustand | ^5.0.12 | Client state with persist middleware | Already used for price-comparison, school-profile, wizard stores |
| zod | ^4.3.6 | Schema validation for forms and API responses | Already used for all schemas |
| react-hook-form | ^7.71.2 | Form state management | Already used with @hookform/resolvers for all forms |
| @tanstack/react-router | ^1.168.1 | File-based routing | Already used, new `/review` route follows existing pattern |
| @anthropic-ai/sdk | ^0.80.0 | AI normalization/validation | Already used for AI intake and document extraction |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | ^3.8.0 | Charts for discount pattern visualization | If pattern data needs visual representation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New Zustand store | Extend existing price-comparison store | New store is cleaner -- existing store already has 50+ fields. Separate concerns. |
| IndexedDB for offline cache | localStorage via Zustand persist | localStorage is simpler and consistent with existing stores. Data size is small (<100KB for all pricing configs). |
| Supabase Realtime for live updates | React Query refetchOnWindowFocus | Realtime adds complexity; refetch on focus is sufficient for this use case (prices change infrequently). |

**Installation:**
No new packages needed -- all dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   ├── review/                        # NEW: Review queue feature
│   │   ├── ReviewQueuePage.tsx        # Manager-only page
│   │   ├── ReviewQueueItem.tsx        # Single proposal row
│   │   ├── ReviewFilterBar.tsx        # Filter pills
│   │   ├── PriceProposalModal.tsx     # Submit proposal modal
│   │   └── __tests__/
│   ├── admin/                         # NEW: Admin config editor
│   │   ├── AdminConfigEditor.tsx      # Pricing strategy editor
│   │   └── __tests__/
│   └── price-comparison/
│       ├── MarktKortingToggle.tsx      # NEW: Market discount toggle
│       └── KortingsPatroonAlert.tsx    # NEW: Discount pattern alert
├── hooks/
│   ├── usePublicationPrices.ts        # NEW: Supabase publication prices
│   ├── usePricingConfigs.ts           # NEW: Supabase pricing configs
│   ├── usePriceProposals.ts           # NEW: Supabase price proposals CRUD
│   └── useDiscountPatterns.ts         # NEW: Cross-school discount analysis
├── stores/
│   └── pricing-data-store.ts          # NEW: Central pricing data store (Zustand + persist)
├── components/ui/
│   ├── ProposalBadge.tsx              # NEW
│   ├── ReviewBadgeCounter.tsx         # NEW
│   ├── PriceDiffDisplay.tsx           # NEW
│   └── OfflinePriceBanner.tsx         # NEW
├── db/
│   └── pricing-operations.ts          # NEW: CRUD for publication_prices, pricing_configs, price_proposals
└── engine/
    └── discount-patterns.ts           # NEW: Pure function pattern detection
```

### Pattern 1: Store-First Loading with Fallback (D-03, D-04)

**What:** At app start, load all pricing data from Supabase into a Zustand store. Calculators read from this store (passed as parameter). If Supabase fails, use cached data from localStorage. If no cache, fall back to static TS imports.

**When to use:** Always -- this is the core data flow change.

**Example:**
```typescript
// src/stores/pricing-data-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProviderConfig } from '@/data/providers/index';
import type { PriceRecord } from '@/models/pricing';
import { PROVIDER_CONFIGS as STATIC_CONFIGS } from '@/data/providers/index';
import { DEFAULT_PRICES as STATIC_PRICES } from '@/data/default-prices';

interface PricingDataState {
  providerConfigs: Record<string, ProviderConfig>;
  publicationPrices: PriceRecord[];
  lastSyncedAt: string | null;
  isLoading: boolean;
  isOffline: boolean;
  loadFromSupabase: () => Promise<void>;
}

export const usePricingDataStore = create<PricingDataState>()(
  persist(
    (set, get) => ({
      providerConfigs: STATIC_CONFIGS, // fallback default
      publicationPrices: STATIC_PRICES,
      lastSyncedAt: null,
      isLoading: false,
      isOffline: false,
      loadFromSupabase: async () => {
        set({ isLoading: true });
        try {
          const configs = await fetchProviderConfigs(); // Supabase call
          const prices = await fetchPublicationPrices(); // Supabase call
          set({
            providerConfigs: configs,
            publicationPrices: prices,
            lastSyncedAt: new Date().toISOString(),
            isLoading: false,
            isOffline: false,
          });
        } catch {
          // Keep cached data, set offline flag
          set({ isLoading: false, isOffline: true });
        }
      },
    }),
    {
      name: 'pricing-data-cache',
      partialize: (state) => ({
        providerConfigs: state.providerConfigs,
        publicationPrices: state.publicationPrices,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
```

### Pattern 2: Calculator Config Injection (D-03)

**What:** Modify `calculateComparison()` to accept provider configs as an optional parameter instead of importing `PROVIDER_CONFIGS` directly. Default to static import for backward compatibility.

**When to use:** Engine modification -- minimal change to preserve pure function architecture.

**Example:**
```typescript
// In price-comparison.ts -- add optional configs parameter
export function calculateComparison(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
  options: ComparisonOptions & {
    providerConfigs?: Record<ProviderKey, ProviderConfig>;
  } = {},
): ComparisonResult {
  const configs = options.providerConfigs ?? PROVIDER_CONFIGS; // fallback to static
  // ... rest of function uses configs instead of PROVIDER_CONFIGS
}
```

### Pattern 3: Review Queue with RLS (D-05, D-06, D-07)

**What:** Price proposals table with status workflow. RLS ensures accountmanagers can create proposals for team schools, managers can approve/reject.

**When to use:** The core review workflow.

**Example:**
```sql
-- price_proposals table
CREATE TABLE price_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  module_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  proposed_price NUMERIC NOT NULL,
  source TEXT NOT NULL,
  explanation TEXT NOT NULL,
  evidence_path TEXT,  -- Supabase Storage path
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_by UUID REFERENCES users(id) NOT NULL,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: all team members can view, all can create, only managers approve/reject
CREATE POLICY "Team members can view proposals"
  ON price_proposals FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can create proposals"
  ON price_proposals FOR INSERT
  WITH CHECK (
    team_id = get_user_team_id()
    AND submitted_by = auth.uid()
  );

CREATE POLICY "Managers can update proposals"
  ON price_proposals FOR UPDATE
  USING (
    team_id = get_user_team_id()
    AND get_user_role() = 'manager'
  );
```

### Pattern 4: Automatic Recalculation on Approval (D-08)

**What:** When a manager approves a proposal, update the `publication_prices` table and invalidate React Query cache. All components using pricing data will re-render with new values.

**When to use:** Approval flow.

**Example:**
```typescript
// In usePriceProposals.ts
export function useApproveProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ proposalId, ...data }) => {
      // 1. Update proposal status to 'approved'
      // 2. Upsert publication_prices with new price
      // 3. Create audit trail entry
    },
    onSuccess: () => {
      // Invalidate all pricing-related queries
      qc.invalidateQueries({ queryKey: ['publication-prices'] });
      qc.invalidateQueries({ queryKey: ['price-proposals'] });
      // Trigger pricing data store reload
      usePricingDataStore.getState().loadFromSupabase();
    },
  });
}
```

### Anti-Patterns to Avoid
- **Direct Supabase calls in calculators:** Engines MUST stay synchronous pure functions. Never add async operations to the calculator layer.
- **Mutating PROVIDER_CONFIGS at runtime:** The static configs serve as fallback. Never modify them. Store DB-loaded configs separately.
- **Building a custom notification system:** D-09 explicitly states in-app badge only, no email/push. Do not over-engineer.
- **Circular imports between stores:** The pricing data store must NOT import from the price-comparison store or vice versa. Use `getState()` at call sites.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Offline detection | Custom navigator.onLine listener | Existing `queueIfOffline` pattern from operations.ts | Already handles offline state consistently |
| File upload + storage | Custom file handling | Supabase Storage (existing `documents` bucket pattern) | RLS, CDN, already configured |
| Role-based UI gating | Custom role checks | Existing `get_user_role()` RLS function + `useAuth()` hook | Already used throughout the app |
| Price staleness detection | New staleness logic | Existing `isPriceStale()` + `getPriceStatus()` from `pricing.ts` | Already implements 6-month check |
| Price deviation warnings | New validation | Existing `checkPriceDeviation()` from `pricing.ts` | Already flags >50% deviations |
| Diff view for price changes | Custom comparison UI | Extend existing `DocumentExtractionPreview` pattern | Already shows old vs. new with approval flow |
| Toast notifications | Custom toast system | Project's existing toast pattern (if exists) or simple state-based feedback | Consistent UX |

**Key insight:** Phase 9 already built ~70% of the price management infrastructure (school-specific prices, document extraction, diff view, price status badges). This phase extends that foundation to publication prices with a team-wide review workflow.

## Common Pitfalls

### Pitfall 1: Breaking Calculator Purity
**What goes wrong:** Adding async Supabase calls inside `calculateComparison()` or individual calculators.
**Why it happens:** Natural instinct to "just fetch the data where it's needed."
**How to avoid:** D-03 mandates store-first loading. All pricing data must be in the Zustand store BEFORE any calculator runs. Pass `providerConfigs` as parameter.
**Warning signs:** Any `async` keyword in files under `src/engine/`.

### Pitfall 2: Seed Migration Data Drift
**What goes wrong:** The SQL seed migration generates pricing data that doesn't exactly match the TypeScript source files, causing subtle calculation differences.
**Why it happens:** Manual transcription errors, or failing to account for computed values (e.g., DIA volume discounts, Cito bundle prices).
**How to avoid:** Write a verification script that compares DB-seeded values against TS file values after migration. Run as part of CI.
**Warning signs:** Comparison results change after switching from TS to DB data source.

### Pitfall 3: RLS Policy Conflicts with Existing Policies
**What goes wrong:** New `price_proposals` RLS policies conflict with existing `school_prices` policies, or the `get_user_role()` function returns unexpected values.
**Why it happens:** The `price_proposals` table is team-scoped (not school-scoped like other tables). Different access pattern.
**How to avoid:** `price_proposals` uses `team_id` directly (not via school_id join). Test RLS policies with both accountmanager and manager roles.
**Warning signs:** 403 errors when accountmanagers try to create proposals, or when managers try to approve.

### Pitfall 4: Stale Zustand Persist Cache
**What goes wrong:** User sees outdated prices because the Zustand persist cache in localStorage contains old data and the Supabase fetch fails silently.
**Why it happens:** The offline fallback mechanism caches data indefinitely.
**How to avoid:** Always show `lastSyncedAt` date when using cached data. Display the `OfflinePriceBanner` when `isOffline` is true or `lastSyncedAt` is older than the session start.
**Warning signs:** No visible indicator that data might be stale.

### Pitfall 5: Admin Config Editor Validation Gaps
**What goes wrong:** Manager saves a pricing config that the calculator cannot process (e.g., tier with overlapping ranges, bundle with invalid module IDs).
**Why it happens:** The editor allows free-form editing without running the config through the calculator's validation.
**How to avoid:** Validate configs by instantiating the calculator with the proposed config and running a test calculation. If it throws, the config is invalid.
**Warning signs:** Runtime errors in the calculator after a config change.

### Pitfall 6: Pattern Detection False Positives
**What goes wrong:** The discount pattern detection flags patterns based on unreliable data (manually entered guesses, unverified prices).
**Why it happens:** Not all school prices have the same confidence level.
**How to avoid:** Only include school prices with `source` = 'document' or 'verified' in pattern detection. Require 3+ data points (D-13).
**Warning signs:** Alerts showing implausible discount percentages.

## Code Examples

### Database Schema: publication_prices Table

```sql
-- Stores publication (list) prices per module per provider
-- Replaces the defaultPrices arrays in src/data/providers/*.ts
CREATE TABLE publication_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  module_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount_per_student NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'seed',  -- 'seed', 'manual', 'proposal'
  source_label TEXT NOT NULL DEFAULT '',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_publication_price BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  -- Audit trail
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique constraint: one active price per module+provider+team
  UNIQUE(team_id, module_id, provider)
);
```

### Database Schema: pricing_configs Table

```sql
-- Stores pricing strategy configurations (bundles, tiers, packages)
-- Replaces pricingStrategy objects in src/data/providers/*.ts
CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  provider TEXT NOT NULL,
  config_type TEXT NOT NULL CHECK (config_type IN (
    'platform+module', 'package-bundle', 'tiered-license', 'flat'
  )),
  config_data JSONB NOT NULL,  -- Full PricingStrategy object
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Audit trail
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One active config per provider per team
  UNIQUE(team_id, provider) WHERE (is_active = true)
);
```

### Database Schema: price_audit_log Table

```sql
-- Immutable audit trail for all price changes
CREATE TABLE price_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('publication_price', 'pricing_config')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'approved', 'rejected')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  proposal_id UUID REFERENCES price_proposals(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Discount Pattern Detection (Pure Function)

```typescript
// src/engine/discount-patterns.ts
export interface DiscountPattern {
  provider: string;
  moduleId: string;
  averageDiscount: number;  // percentage
  schoolCount: number;
  minDiscount: number;
  maxDiscount: number;
}

/**
 * Detect discount patterns across schools for a given provider.
 * Only considers verified/document-sourced prices.
 * Requires 3+ schools with comparable discounts per D-13.
 */
export function detectDiscountPatterns(
  schoolPrices: Array<{
    schoolId: string;
    moduleId: string;
    provider: string;
    amount: number;
    source: string;
  }>,
  publicationPrices: Array<{
    moduleId: string;
    provider: string;
    amountPerStudent: number;
  }>,
): DiscountPattern[] {
  // Group school prices by provider+module
  // Calculate discount % vs publication price
  // Filter for 3+ schools with similar discounts
  // Return patterns
}
```

### Connecting Store to Calculators

```typescript
// In usePriceComparisonStore.recalculate() or wherever calculateComparison is called:
const pricingData = usePricingDataStore.getState();
const result = calculateComparison(selectedModules, studentCounts, {
  ...existingOptions,
  providerConfigs: pricingData.providerConfigs,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded TS pricing data | DB-driven with TS fallback | This phase | All pricing data becomes editable and auditable |
| Direct TS imports in calculators | Config injection via parameter | This phase | Calculators remain pure but accept dynamic data |
| No review workflow | Proposal -> review -> approval | This phase | Team-based price governance |
| Single pricing view | Publication vs market pricing toggle | This phase | More realistic comparisons |

**Deprecated/outdated after this phase:**
- `DEFAULT_PRICES` direct imports in business logic (keep as fallback seed only)
- `PROVIDER_CONFIGS` direct imports in calculators (keep as static fallback)
- Direct editing of `src/data/providers/*.ts` for price updates

## Open Questions

1. **Pricing config JSONB schema validation**
   - What we know: The `config_data` column stores full PricingStrategy objects as JSONB. TypeScript has discriminated union types for these.
   - What's unclear: Whether to validate JSONB against a JSON Schema in the database or rely purely on application-level Zod validation.
   - Recommendation: Application-level Zod validation only (simpler, already established pattern). Add a `validatePricingConfig()` function that instantiates a calculator as proof of validity.

2. **Seed migration scope**
   - What we know: D-02 says seed ALL data from TS files. This includes 4 provider configs, ~20 publication prices, differentiators for ~8 modules, and provider-module-content for all providers.
   - What's unclear: Whether differentiators and provider-module-content should be in separate tables or embedded in `pricing_configs` JSONB.
   - Recommendation: Separate tables (`module_differentiators`, `provider_module_content`) for queryability and independent updates. But keep scope manageable -- can be a single JSONB field on pricing_configs if time-constrained.

3. **Multi-team publication prices**
   - What we know: The `team_id` column scopes data per team. All current users are on one team.
   - What's unclear: Whether publication prices should be global (same for all teams, since they're public list prices) or team-scoped.
   - Recommendation: Team-scoped for now (consistent with all other tables). If needed later, a "global" team or shared view can be added.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-01 | Publication prices loaded from Supabase with fallback | unit | `npx vitest run src/stores/__tests__/pricing-data-store.test.ts -x` | Wave 0 |
| SC-02 | Calculators accept injected configs | unit | `npx vitest run src/engine/__tests__/price-comparison-config-injection.test.ts -x` | Wave 0 |
| SC-03 | Price proposal CRUD operations | unit | `npx vitest run src/hooks/__tests__/usePriceProposals.test.ts -x` | Wave 0 |
| SC-04 | Approval updates publication price + invalidates cache | integration | `npx vitest run src/features/review/__tests__/approval-flow.test.ts -x` | Wave 0 |
| SC-05 | Discount pattern detection (3+ schools threshold) | unit | `npx vitest run src/engine/__tests__/discount-patterns.test.ts -x` | Wave 0 |
| SC-06 | Seed migration produces correct data | unit | `npx vitest run supabase/__tests__/seed-verification.test.ts -x` | Wave 0 |
| SC-07 | RLS policies allow/deny correct operations | manual-only | Manual via Supabase dashboard | N/A |
| SC-08 | Offline fallback shows cached data + banner | unit | `npx vitest run src/stores/__tests__/pricing-data-offline.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/__tests__/pricing-data-store.test.ts` -- covers SC-01, SC-08
- [ ] `src/engine/__tests__/discount-patterns.test.ts` -- covers SC-05
- [ ] `src/engine/__tests__/price-comparison-config-injection.test.ts` -- covers SC-02

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (Nederlands) -- labels, tooltips, error messages
- Code comments and variable names in English
- NEVER change price data in `src/data/default-prices.ts` without user approval (but this phase specifically migrates data to DB)
- Forms: always react-hook-form + Zod schema
- State via Zustand + persist middleware -- no new React Context or prop drilling
- Tests required for engine changes -- `src/engine/__tests__/`
- Path alias `@` = `/src`
- After approved changes: auto-commit AND push. Build must pass first.
- Run `npm run build` before finishing -- must succeed
- Pure function engines -- no side effects, no state mutations

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/data/providers/index.ts`, `src/data/providers/cito.ts`, `src/data/providers/dia.ts` -- current pricing data structure
- Codebase analysis: `src/engine/price-comparison.ts`, `src/engine/calculators/types.ts` -- calculator architecture
- Codebase analysis: `src/hooks/useSchoolPrices.ts` -- existing Supabase price CRUD pattern
- Codebase analysis: `supabase/migrations/001_initial_schema.sql`, `002_rls_policies.sql` -- existing DB schema and RLS patterns
- Codebase analysis: `src/router/routes.ts` -- existing routing structure
- Codebase analysis: `src/features/price-comparison/store.ts` -- existing Zustand store pattern
- Codebase analysis: `src/models/pricing.ts` -- PricingStrategy discriminated union, staleness functions
- Phase context: `25-CONTEXT.md` -- all locked decisions D-01 through D-16
- Phase context: `25-UI-SPEC.md` -- component inventory, interaction patterns, layout specs

### Secondary (MEDIUM confidence)
- Supabase documentation: JSONB column patterns for dynamic config storage
- Zustand documentation: persist middleware with partialize for selective caching

### Tertiary (LOW confidence)
- Discount pattern detection algorithm design -- no prior art in codebase, approach is based on statistical grouping principles

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new dependencies needed
- Architecture: HIGH -- store-first loading with config injection is well-documented in CONTEXT.md and maps cleanly to existing patterns
- Database schema: MEDIUM -- schema design is discretionary per CONTEXT.md, based on existing table patterns
- Pitfalls: HIGH -- based on direct analysis of existing code patterns and integration points

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- no fast-moving dependencies)
