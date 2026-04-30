# Phase 11: Waarde-engine & Migratie - Research

**Researched:** 2026-03-23
**Domain:** Value engine (time savings + migration business case + multi-year projection + upsell detection), Supabase schema extension, Recharts charting, React tab UI
**Confidence:** HIGH

## Summary

Phase 11 extends the existing pure engine pattern with a waarde-engine that combines three data sources: (1) price comparison results from Phase 10, (2) time savings from the existing migration engine, and (3) migration financial differences. The new "Waarde" tab in the school profile presents a hero summary card plus three sections (time savings, migration, multi-year projection), and adds upsell detection to the school dashboard and overview cards.

The existing codebase already contains 80% of the building blocks. The `calculateMigration()` engine already computes time savings, financial difference, and multi-year projections. The `determineSalesSignal()` function provides the pattern for upsell signal logic. The `MigrationPage.tsx` contains a working Recharts bar chart (`MultiYearChart`) and inline editable fields (`EditableField`) that can be reused directly. The main work is: (a) extending the migration engine with switching costs and break-even calculation, (b) creating a new upsell detection engine, (c) building the Waarde tab UI with its three sections and hero card, (d) adding two new Supabase columns (`switching_costs`, possibly others), (e) wiring upsell badges into SchoolCard and DashboardTab.

**Primary recommendation:** Extend `calculateMigration()` with `switchingCosts` parameter and break-even month calculation. Create new `calculateUpsell()` pure engine function. Build WaardeTab as the 6th school profile tab reusing existing chart/editable patterns. Add `switching_costs` column to Supabase `schools` table.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Nieuwe 6e tab "Waarde" in het schoolprofiel, naast Dashboard/Vergelijking/Producten/Contacten/Gesprekken. Past bij het bestaande tab-patroon uit Phase 7.
- **D-02:** Hero-kaart bovenaan met totale jaarlijkse waarde: prijsverschil (uit Phase 10 vergelijking) + tijdwinst + migratie-effect gecombineerd in één bedrag.
- **D-03:** Drie secties onder de hero: (1) Tijdwinst nieuw platform, (2) Migratie huidig naar nieuw, (3) Meerjarenprojectie.
- **D-04:** Tabel met inline editing voor de 5 TIME_SAVING_TASKS. Kolommen: Taak | Oud | Nieuw | Uren/jaar (bewerkbaar) | euro/jaar. Totaalrij onderaan.
- **D-05:** Uurtarief per school instelbaar, opgeslagen bij het schoolprofiel. Default euro 50 (CAO VO).
- **D-06:** Uren per taak per school bewerkbaar en persistent opgeslagen. Defaults uit TIME_SAVING_TASKS.
- **D-07:** Tijdwinst-tabel altijd zichtbaar — ook in externe modus. Tijdwinst is een sterk verkoopargument, niet sales-sensitief.
- **D-08:** Migratie-sectie altijd tonen, ook met placeholder-prijzen. Duidelijke waarschuwingsbanner: "Migratieprijzen zijn indicatief — vul werkelijke tarieven in." Prijzen inline bewerkbaar met asterisk-markering bij placeholders.
- **D-09:** Per-module tabel: Module | Huidig | Nieuw | Verschil. Totaalrij onderaan.
- **D-10:** Recharts staafdiagram met 3 staven (1/3/5 jaar) voor cumulatieve besparing. Consistent met Phase 10 staafdiagram-patroon.
- **D-11:** Compacte tabel onder het diagram met exacte bedragen per jaar.
- **D-12:** Break-even punt t.o.v. bewerkbare overstapkosten. Default euro 0. Toon in welke maand de cumulatieve besparing de overstapkosten terugverdient.
- **D-13:** Overstapkosten per school opslaan in het schoolprofiel. Persistent.
- **D-14:** Upsell-kans criterium: school gebruikt concurrent voor module EN (Cito is goedkoper OF Cito heeft differentiators). Combineert prijs + waarde.
- **D-15:** Signaal-sterkte: groen (goedkoper + differentiators), geel (goedkoper OF differentiators), rood (duurder + geen differentiators = geen kans, niet tonen).
- **D-16:** Dashboard-kaart op het school-dashboard: "X upsell-kansen" met per module de besparing per leerling en link naar Vergelijking-tab.
- **D-17:** Badge "X kansen" op schoolkaarten in het schooloverzicht (lijst en kanban). Accountmanager ziet in één oogopslag welke scholen upsell-potentieel hebben.

### Claude's Discretion
- Exacte Supabase schema-uitbreiding voor per-school uurtarief, uren-overrides en overstapkosten
- Styling van de hero-kaart (kleuren, grootte, iconen)
- Responsive gedrag van de Waarde-tab op tablet
- Animaties bij inline editing en herberekening
- Exacte berekening van break-even maand (lineaire interpolatie)
- Hoe de upsell-engine de Phase 10 comparison data en Phase 7 productgebruik combineert
- Loading states bij het ophalen van prijsdata voor de hero-samenvatting

### Deferred Ideas (OUT OF SCOPE)
- DMU-gerichte PDF-exports met waarde-data (coordinator/MT/finance perspectief) — Phase 12
- AI-gestuurde suggestie voor uurtarief op basis van schooltype/regio — FUTURE
- Scenario-vergelijking: meerdere overstap-scenario's naast elkaar — FUTURE
- Upsell-kansen als notificatie/alert bij nieuw vastgelegde prijzen — FUTURE
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WAARDE-01 | Gebruiker ziet per taak (rechten, resetten, inloggen, planning, koppeling) de concrete uren bespaard met bewerkbare aannames | Existing `TIME_SAVING_TASKS` (5 tasks) + `calculateMigration()` time savings. MigrationPage already has EditableField pattern for inline editing. Per-school overrides stored in `migrationTimeSavingOverrides` (already in Supabase schema) |
| WAARDE-02 | Gebruiker kan uurtarief instellen en ziet tijdsbesparing omgerekend naar euro's per jaar | `migrationHourlyRate` already exists on SchoolRecord and in Supabase `schools.migration_hourly_rate`. Default 50. EditableField pattern from MigrationPage |
| WAARDE-03 | Gebruiker ziet de totale waarde van de overstap: financieel verschil + tijdsbesparing in euro's | Hero card combines: Phase 10 comparison `differences` (price diff) + migration engine `totalTimeSavingsValue` + `financialDifference`. Pure engine aggregation |
| WAARDE-04 | Gebruiker ziet meerjarenprojectie over 1, 3 en 5 jaar met cumulatieve besparing en break-even punt | Existing `multiYearProjection` in migration engine. Extend with `switchingCosts` parameter for break-even calculation. MultiYearChart component in MigrationPage as reference |
| MIGR-01 | Gebruiker ziet financieel verschil tussen huidig en nieuw Cito-platform per module en als totaal | Already implemented in `calculateMigration()`. Waarde tab re-renders migration module table (D-09) |
| MIGR-02 | Migratie-engine verwerkt het gewijzigde prijsmodel van het nieuwe Cito-platform correct | `CITO_MIGRATION_PRICES` data structure handles old vs new price per student. Placeholder warning banner (D-08) communicates data quality |
| MIGR-03 | Gebruiker ziet gecombineerde business case: prijsverschil + tijdwinst + meerjarenprojectie | Hero card (D-02) + three sections (D-03) present the combined business case. Engine extends `MigrationResult` with combined total |
| SCHOOL-07 | Systeem detecteert upsell-kansen: modules waar school een concurrent gebruikt en overstap naar Cito voordelig is | New `calculateUpsell()` engine using `moduleSetups` (current provider per module from Phase 7), comparison results (Phase 10), and `MODULE_DIFFERENTIATORS`. Signal strength per D-14/D-15 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI framework | Already in project |
| TypeScript | 5.x | Type safety | Already in project |
| Recharts | 3.x | Bar charts for multi-year projection | Already used in MigrationPage and ComparisonChart |
| Zustand | 5.x | State management (price-comparison store) | Already used for per-school migration data |
| @tanstack/react-query | 5.x | Supabase data fetching | Already used for school prices |
| @tanstack/react-router | Latest | Tab routing | Already used for all school profile routes |
| Supabase JS | 2.x | Database persistence | Already used for school data |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.x | Styling | All UI components |
| Vitest | Latest | Engine unit tests | All pure engine functions |

No new libraries needed. Phase 11 is built entirely on the existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── engine/
│   ├── migration.ts         # EXTEND: add switchingCosts, breakEvenMonth to MigrationResult
│   ├── upsell.ts            # NEW: calculateUpsell() pure function
│   └── __tests__/
│       ├── migration.test.ts  # EXTEND: new break-even tests
│       └── upsell.test.ts     # NEW: upsell detection tests
├── features/
│   ├── school-profile/
│   │   ├── tabs/
│   │   │   └── WaardeTab.tsx   # NEW: 6th tab with hero + 3 sections
│   │   └── components/
│   │       ├── TabNavigation.tsx  # MODIFY: add 6th tab "Waarde"
│   │       ├── ValueHeroCard.tsx  # NEW: hero summary card
│   │       ├── TimeSavingsSection.tsx  # NEW: time savings table with inline edit
│   │       ├── MigrationSection.tsx   # NEW: migration financial table
│   │       ├── MultiYearSection.tsx   # NEW: chart + table + break-even
│   │       └── UpsellCard.tsx         # NEW: dashboard upsell summary card
│   ├── school-overview/
│   │   └── SchoolCard.tsx    # MODIFY: add upsell badge
│   └── price-comparison/
│       └── store.ts          # MODIFY: add switchingCosts state
├── router/
│   └── routes.ts            # MODIFY: add waarde route
└── db/
    ├── types.ts             # MODIFY: add switchingCosts to SchoolRecord
    └── operations.ts        # MODIFY: map switchingCosts
```

### Pattern 1: Pure Engine Extension
**What:** Extend `calculateMigration()` with `switchingCosts` parameter, add `breakEvenMonth` to `MigrationResult`
**When to use:** For break-even calculation (D-12)
**Example:**
```typescript
// Extend existing MigrationResult interface
export interface MigrationResult {
  // ... existing fields ...
  switchingCosts: number;
  breakEvenMonth: number | null; // null if totalAnnualValue <= 0
}

// Break-even: linear interpolation
// If totalAnnualValue > 0 and switchingCosts > 0:
//   breakEvenMonth = Math.ceil((switchingCosts / totalAnnualValue) * 12)
// If switchingCosts <= 0: breakEvenMonth = 0 (immediate)
// If totalAnnualValue <= 0: breakEvenMonth = null (never breaks even)
```

### Pattern 2: New Upsell Engine
**What:** Pure function that takes school data and returns upsell opportunities per module
**When to use:** For SCHOOL-07, D-14 through D-17
**Example:**
```typescript
// src/engine/upsell.ts
export type UpsellSignalStrength = 'green' | 'yellow'; // red = no opportunity, don't include

export interface UpsellOpportunity {
  moduleId: string;
  moduleName: string;
  currentProvider: ProviderKey;
  citoCostPerStudent: number | null;
  competitorCostPerStudent: number | null;
  savingsPerStudent: number | null;
  hasDifferentiators: boolean;
  signalStrength: UpsellSignalStrength;
}

export function calculateUpsell(
  moduleSetups: ModuleCurrentSetup[],
  comparisonResult: ComparisonResult,
  differentiators: ModuleDifferentiators[],
): UpsellOpportunity[]
```

### Pattern 3: Tab Addition (Established)
**What:** Add 6th tab to TabNavigation + new route in routes.ts
**When to use:** Following existing tab pattern exactly
**Example:**
```typescript
// TabNavigation.tsx getTabs() — add one entry:
{ label: 'Waarde', path: `${base}/waarde` },

// routes.ts — add route:
export const waardeRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/waarde',
  component: WaardeTab,
});
// Add to routeTree schoolRoute.addChildren([...existing, waardeRoute])
```

### Pattern 4: Per-School Persistent Data (Established)
**What:** Store switchingCosts in Supabase `schools` table alongside existing `migration_hourly_rate`
**When to use:** Per-school settings that persist across sessions
**Details:**
- `migrationHourlyRate` and `migrationTimeSavingOverrides` already follow this pattern
- Add `switchingCosts` (default 0) to the same pattern
- SchoolRecord type, Supabase schema, mapSchoolRow, mapSchoolUpdateToSnakeCase all need updating
- Store state in `usePriceComparisonStore` alongside existing migration fields

### Anti-Patterns to Avoid
- **Duplicating MigrationPage logic:** WaardeTab sections should call `calculateMigration()` directly, not copy-paste from MigrationPage.tsx
- **New React Context:** Use existing Zustand stores. SchoolProfileStore for school identity, PriceComparisonStore for calculation settings.
- **Side effects in engine functions:** All engine functions must remain pure. No store reads, no API calls.
- **Hardcoding provider lists in upsell engine:** Use `moduleSetups` from school profile to determine which modules have competitors, not a hardcoded list.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Inline editable numbers | Custom input logic | Reuse `EditableField` from MigrationPage.tsx (extract to shared component) | Already handles editing, draft state, commit, escape, blur |
| Bar chart | Canvas/SVG drawing | Recharts `BarChart` with existing `MultiYearChart` pattern | Already in project, consistent styling |
| Sales signal logic | Custom condition tree | Extend pattern from `determineSalesSignal()` in sales-signals.ts | Same domain, same logic structure |
| Price formatting | `toFixed()` / manual | `formatCurrency()` from `src/lib/format.ts` | Consistent euro formatting with dutch locale |
| Supabase CRUD | Direct fetch calls | `updateSchoolData()` from `src/db/operations.ts` | Handles snake_case mapping, auth, updated_by |

**Key insight:** This phase is primarily an assembly task. Most building blocks exist. The risk is in duplication rather than missing capabilities.

## Common Pitfalls

### Pitfall 1: Stale Comparison Data for Hero Card
**What goes wrong:** Hero card reads Phase 10 comparison results but these may not be computed yet (no scenario set, no modules selected)
**Why it happens:** WaardeTab renders before ComparisonTab has ever been visited
**How to avoid:** Guard hero card with null checks on comparison data. Show "Vul eerst de vergelijking in" state when comparison result is unavailable. The engine must handle null/empty inputs gracefully.
**Warning signs:** Hero shows EUR 0 or NaN when school has no comparison data

### Pitfall 2: Break-Even with Zero or Negative Annual Value
**What goes wrong:** Division by zero or meaningless break-even when totalAnnualValue <= 0
**Why it happens:** Migration prices are all placeholders (old = new = same price), or new platform is more expensive
**How to avoid:** `breakEvenMonth = null` when `totalAnnualValue <= 0`. UI shows "Geen terugverdientijd" instead of a number. When switchingCosts = 0, show "Direct terugverdiend" (breakEvenMonth = 0).
**Warning signs:** Break-even shows "0 maanden" when there are actual switching costs, or shows infinity

### Pitfall 3: Upsell Detection Without Current Provider Data
**What goes wrong:** Upsell engine returns 0 opportunities even when school uses competitors
**Why it happens:** `moduleSetups` may not be filled in (all providers = 'geen'), or school hasn't set up current situation in wizard step 4
**How to avoid:** Only show upsell card when moduleSetups has at least one module with `currentProvider !== 'geen'`. Show "Vul huidige situatie in" hint on DashboardTab.
**Warning signs:** Upsell badge shows "0 kansen" on all school cards

### Pitfall 4: Supabase Schema Drift
**What goes wrong:** New `switching_costs` column not added to Supabase, causing runtime errors
**Why it happens:** Supabase schema changes require manual SQL migration, not automated
**How to avoid:** Add SQL migration as first task. Default value (0) in Supabase so existing records don't break. Update `src/lib/supabase/types.ts` to match.
**Warning signs:** `null` values for switchingCosts in mapSchoolRow

### Pitfall 5: MigrationPage and WaardeTab Showing Same Data
**What goes wrong:** User confused by seeing migration data in both ComparisonTab (via MigrationPage) and WaardeTab
**Why it happens:** MigrationPage already shows financial overview + time savings + multi-year chart
**How to avoid:** WaardeTab is the new home for the full business case. ComparisonTab/MigrationPage remains for the detailed module-level price comparison. WaardeTab adds the hero aggregation, upsell, and break-even that MigrationPage doesn't have. Consider whether ComparisonTab still renders MigrationPage for scenario B, or defers to WaardeTab.
**Warning signs:** User asks "Why is the same information in two places?"

### Pitfall 6: Placeholder Migration Prices Not Obvious
**What goes wrong:** Accountmanager presents business case with placeholder data (old = new price for all modules), resulting in EUR 0 financial difference
**Why it happens:** `cito-migration-prices.ts` has all prices set to equal values
**How to avoid:** Per D-08: show warning banner "Migratieprijzen zijn indicatief". Mark placeholder prices with asterisk. Detect placeholders by checking if `oldPricePerStudent === newPricePerStudent` for all modules.
**Warning signs:** Financial difference is exactly EUR 0 for all modules

## Code Examples

### Break-Even Calculation (extend migration engine)
```typescript
// In calculateMigration(), after computing totalAnnualValue:
function computeBreakEvenMonth(
  totalAnnualValue: number,
  switchingCosts: number,
): number | null {
  if (switchingCosts <= 0) return 0; // No costs = immediate
  if (totalAnnualValue <= 0) return null; // Never breaks even
  return Math.ceil((switchingCosts / totalAnnualValue) * 12);
}
```

### Upsell Detection Engine
```typescript
// src/engine/upsell.ts
import type { ModuleCurrentSetup } from '../models/school';
import type { ComparisonResult, ProviderKey } from './price-comparison';
import type { ModuleDifferentiators } from '../data/differentiators';
import { MODULE_DIFFERENTIATORS } from '../data/differentiators';

export function calculateUpsell(
  moduleSetups: ModuleCurrentSetup[],
  comparisonResult: ComparisonResult,
): UpsellOpportunity[] {
  return moduleSetups
    .filter((setup) => setup.currentProvider !== 'geen' && setup.currentProvider !== 'cito')
    .map((setup) => {
      const moduleComp = comparisonResult.modules.find((m) => m.moduleId === setup.moduleId);
      if (!moduleComp) return null;

      const citoCost = moduleComp.providers.cito;
      const competitorCost = moduleComp.providers[setup.currentProvider as ProviderKey];
      const diffData = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === setup.moduleId);
      const hasDifferentiators = (diffData?.cito?.length ?? 0) > 0;

      const isCheaper = citoCost && competitorCost && citoCost.pricePerStudent <= competitorCost.pricePerStudent;

      // D-15: red = duurder + geen differentiators = niet tonen
      if (!isCheaper && !hasDifferentiators) return null;

      const signalStrength: UpsellSignalStrength =
        isCheaper && hasDifferentiators ? 'green' : 'yellow';

      return {
        moduleId: setup.moduleId,
        moduleName: moduleComp.moduleName,
        currentProvider: setup.currentProvider as ProviderKey,
        citoCostPerStudent: citoCost?.pricePerStudent ?? null,
        competitorCostPerStudent: competitorCost?.pricePerStudent ?? null,
        savingsPerStudent: citoCost && competitorCost
          ? competitorCost.pricePerStudent - citoCost.pricePerStudent
          : null,
        hasDifferentiators,
        signalStrength,
      };
    })
    .filter((o): o is UpsellOpportunity => o !== null);
}
```

### Supabase Schema Migration SQL
```sql
-- Add switching_costs column to schools table
ALTER TABLE schools ADD COLUMN switching_costs numeric NOT NULL DEFAULT 0;
```

### Hero Card Component Pattern
```typescript
// ValueHeroCard.tsx — aggregates all three value sources
interface ValueHeroProps {
  priceDifference: number | null; // From Phase 10 comparison (Cito total vs competitor total)
  timeSavingsValue: number;       // From migration engine
  migrationDifference: number;    // Financial diff old vs new Cito platform
}

// totalAnnualValue = (priceDifference ?? 0) + timeSavingsValue + migrationDifference
// Display in prominent card with cito-primary background
```

### Adding Tab Route
```typescript
// routes.ts
import WaardeTab from '@/features/school-profile/tabs/WaardeTab';

export const waardeRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/waarde',
  component: WaardeTab,
});

// In routeTree:
schoolRoute.addChildren([
  schoolDashboardRoute,
  wizardStepRoute,
  vergelijkingRoute,
  huidigVsCitoRoute,
  migratieRoute,
  schoolProductsRoute,
  schoolContactsRoute,
  schoolConversationsRoute,
  waardeRoute, // NEW
]),
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MigrationPage as standalone page | WaardeTab as integrated tab | Phase 11 | MigrationPage still accessible via route, but WaardeTab is the primary business case view |
| Time savings only in MigrationPage | Time savings prominently in WaardeTab hero | Phase 11 | Headline number for every sales conversation |
| No upsell detection | Automated upsell engine | Phase 11 | Accountmanager sees opportunities at a glance |
| No break-even calculation | Break-even month with switching costs | Phase 11 | Finance DMU gets concrete payback period |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest) |
| Config file | `vitest.config.ts` (already exists) |
| Quick run command | `npx vitest run src/engine/__tests__/migration.test.ts src/engine/__tests__/upsell.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WAARDE-01 | Time savings per task with editable hours | unit | `npx vitest run src/engine/__tests__/migration.test.ts -x` | Exists (extend) |
| WAARDE-02 | Hourly rate applied to time savings | unit | `npx vitest run src/engine/__tests__/migration.test.ts -x` | Exists (extend) |
| WAARDE-03 | Total value = price diff + time savings | unit | `npx vitest run src/engine/__tests__/migration.test.ts -x` | Exists (extend) |
| WAARDE-04 | Multi-year projection with break-even | unit | `npx vitest run src/engine/__tests__/migration.test.ts -x` | Exists (extend) |
| MIGR-01 | Financial difference per module | unit | `npx vitest run src/engine/__tests__/migration.test.ts -x` | Exists |
| MIGR-02 | New pricing model processing | unit | `npx vitest run src/engine/__tests__/migration.test.ts -x` | Exists |
| MIGR-03 | Combined business case | unit | `npx vitest run src/engine/__tests__/migration.test.ts -x` | Exists (extend) |
| SCHOOL-07 | Upsell detection | unit | `npx vitest run src/engine/__tests__/upsell.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/engine/__tests__/migration.test.ts src/engine/__tests__/upsell.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/engine/__tests__/upsell.test.ts` -- covers SCHOOL-07 (upsell detection engine tests)
- [ ] Extend `src/engine/__tests__/migration.test.ts` -- covers WAARDE-04 (break-even with switching costs)

## Open Questions

1. **MigrationPage overlap with WaardeTab**
   - What we know: MigrationPage already shows financial overview + time savings + multi-year chart (identical to WaardeTab sections 1-3)
   - What's unclear: Should ComparisonTab still render MigrationPage for scenario B, or should it redirect to WaardeTab?
   - Recommendation: Keep both. MigrationPage is the detailed view within ComparisonTab (module-level focus). WaardeTab is the aggregated business case (hero + combined value + upsell). They serve different purposes. No code change to ComparisonTab.

2. **Price comparison data access in WaardeTab**
   - What we know: WaardeTab hero needs Phase 10 comparison `totals` and `differences` to show price differential
   - What's unclear: How to get comparison result in WaardeTab without re-running the engine
   - Recommendation: Call `calculateComparison()` directly in WaardeTab (it's a pure function, cheap to compute). Read `selectedModules`, `studentCounts` from SchoolProfileStore and prices from `useSchoolPrices` hook. Same pattern as ComparisonTab.

3. **Upsell badge data flow for SchoolCard in overview**
   - What we know: SchoolCard receives a `SchoolRecord` and needs to show upsell count
   - What's unclear: Computing upsell requires comparison result which needs price data — expensive to compute per card
   - Recommendation: Compute upsell count at the SchoolOverviewPage level, passing it as a prop to SchoolCard. Or compute lazily per card (acceptable for 50-200 schools). Alternative: store computed upsell count in SchoolRecord/Supabase as a denormalized field (more complex, probably overkill).

## Sources

### Primary (HIGH confidence)
- **Existing codebase** - Direct file reading of all referenced source files
  - `src/engine/migration.ts` — existing pure engine with types and implementation
  - `src/models/migration.ts` — TIME_SAVING_TASKS with 5 tasks and defaults
  - `src/data/cito-migration-prices.ts` — placeholder price data structure
  - `src/engine/sales-signals.ts` — signal detection pattern
  - `src/data/differentiators.ts` — MODULE_DIFFERENTIATORS data
  - `src/features/price-comparison/MigrationPage.tsx` — existing Recharts chart and EditableField
  - `src/features/school-profile/components/TabNavigation.tsx` — tab structure
  - `src/router/routes.ts` — routing pattern
  - `src/db/types.ts` — SchoolRecord with migrationHourlyRate, migrationTimeSavingOverrides
  - `src/db/operations.ts` — mapSchoolRow and mapSchoolUpdateToSnakeCase patterns
  - `src/lib/supabase/types.ts` — Supabase schema with schools table columns

### Secondary (MEDIUM confidence)
- **CONTEXT.md decisions** — user-confirmed implementation decisions from discussion phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, everything exists in project
- Architecture: HIGH - Extension of established patterns (pure engine, Zustand store, Supabase persistence, tab routing)
- Pitfalls: HIGH - Based on direct code analysis of existing implementations
- Upsell engine: MEDIUM - New engine but pattern mirrors existing sales-signals.ts

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable project, no external dependency changes)
