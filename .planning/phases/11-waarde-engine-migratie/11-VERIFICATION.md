---
phase: 11-waarde-engine-migratie
verified: 2026-03-23T10:00:00Z
status: human_needed
score: 16/16 must-haves verified
re_verification: false
human_verification:
  - test: "Open a school profile with at least 2 modules selected and one module with a competitor set in wizard step 4. Click the 'Waarde' tab (6th tab after Gesprekken). Verify: hero card shows combined annual value with 3 sub-values (Prijsverschil, Tijdwinst, Migratie-effect). Edit hours for a time-saving task — EUR/jaar recalculates. Edit uurtarief — totals update. Enter overstapkosten — break-even month appears. Verify all values persist after page refresh."
    expected: "Hero card shows currency totals. Inline edits update computed values reactively. Break-even shows 'Direct terugverdiend' for 0 costs, 'Terugverdiend in N maanden' for positive costs, 'Geen terugverdientijd' when annual value <= 0. All values survive page refresh (persisted to Supabase)."
    why_human: "Recharts bar chart rendering, real-time reactive updates, Supabase persistence round-trip, and tablet touch-target usability cannot be verified programmatically."
  - test: "On the same school profile dashboard (Overzicht tab), verify UpsellCard appears below the smart actions section. Verify signal dots are green or yellow per module. Verify 'Bekijk vergelijking' link navigates to the Vergelijking tab."
    expected: "UpsellCard lists per-module opportunities with signal color dots. 'Vul de huidige situatie in' shown if no moduleSetups filled. 'Geen upsell-kansen gevonden' shown if all modules are Cito/geen/overig."
    why_human: "Signal color rendering, empty-state transitions, and link navigation require visual inspection."
  - test: "On the school overview page, verify UpsellBadge ('X kansen') appears next to PipelineBadge on school cards that have upsell opportunities. Verify no badge for schools with 0 opportunities."
    expected: "Green badge for schools with green-signal opportunities, yellow badge for yellow-only. No badge when count = 0."
    why_human: "Badge color variants and conditional rendering across multiple school cards require visual inspection."
---

# Phase 11: Waarde Engine & Migratie Verification Report

**Phase Goal:** Build the waarde (value) engine with migration cost analysis, upsell detection, and value proposition UI for school profiles.
**Verified:** 2026-03-23T10:00:00Z
**Status:** human_needed (all automated checks passed; visual/UX verification pending)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | calculateMigration with switchingCosts returns breakEvenMonth | VERIFIED | `src/engine/migration.ts` line 52-56: `computeBreakEvenMonth` with `Math.ceil((switchingCosts / totalAnnualValue) * 12)`; 4+ test cases in `describe('breakEvenMonth')` block at line 128 |
| 2 | calculateMigration with switchingCosts=0 returns breakEvenMonth=0 | VERIFIED | `computeBreakEvenMonth`: `if (switchingCosts <= 0) return 0`; test at migration.test.ts line 145 |
| 3 | calculateMigration with totalAnnualValue<=0 returns breakEvenMonth=null | VERIFIED | `computeBreakEvenMonth`: `if (totalAnnualValue <= 0) return null`; test at migration.test.ts line 158 |
| 4 | calculateUpsell returns opportunities for competitor modules where Cito is cheaper or has differentiators | VERIFIED | `src/engine/upsell.ts` line 77-84: isCheaper and hasDifferentiators logic; 11 test cases in upsell.test.ts |
| 5 | calculateUpsell excludes red signals (duurder + geen differentiators) | VERIFIED | `upsell.ts` line 82: `if (!isCheaper && !hasDifferentiators) continue` |
| 6 | SchoolRecord has switchingCosts field defaulting to 0 | VERIFIED | `src/db/types.ts` line 107: `switchingCosts: number`; `mapSchoolRow` line 50: `switchingCosts: row.switching_costs ?? 0` |
| 7 | User sees 'Waarde' as 6th tab in school profile navigation | VERIFIED | `TabNavigation.tsx` line 16: `{ label: 'Waarde', path: \`${base}/waarde\` }` as 6th array entry |
| 8 | User sees hero card with total annual value combining price difference + time savings + migration effect | VERIFIED | `ValueHeroCard.tsx`: computes `(priceDifference ?? 0) + timeSavingsValue + migrationDifference`; renders "Totale jaarlijkse waarde van de overstap" |
| 9 | User sees time savings table with 5 tasks, editable hours per task, and euro/year computed from hourly rate | VERIFIED | `TimeSavingsSection.tsx`: renders table from `timeSavings` array; `EditableField` per row; `formatCurrency(task.valuePerYear)` |
| 10 | User can edit hourly rate per school and changes persist after refresh | VERIFIED | `WaardeTab.tsx` line 104-109: `handleHourlyRateChange` calls `updateSchoolData(activeSchoolId, { migrationHourlyRate: rate })` |
| 11 | User sees migration table with per-module old vs new price and difference | VERIFIED | `MigrationSection.tsx`: table with Module/Huidig/Nieuw/Verschil columns; color-coded difference |
| 12 | User sees warning banner about indicative migration prices | VERIFIED | `MigrationSection.tsx` line 28-55: `role="alert"` amber banner with "Migratieprijzen zijn indicatief" |
| 13 | User sees multi-year bar chart with 1/3/5 year cumulative savings | VERIFIED | `MultiYearSection.tsx`: Recharts `BarChart` with `ResponsiveContainer`; data mapped from projection |
| 14 | User can edit switching costs and sees break-even month | VERIFIED | `MultiYearSection.tsx` line 95-113: `EditableField` for overstapkosten + three break-even display variants |
| 15 | School dashboard shows UpsellCard with opportunities when moduleSetups have competitor modules | VERIFIED | `DashboardTab.tsx` line 373: `<UpsellCard opportunities={upsellOpportunities} ...>` rendered after smart actions |
| 16 | School cards in overview show 'X kansen' badge when upsell count > 0 | VERIFIED | `SchoolCard.tsx` line 129: `<UpsellBadge count={upsellData.count} hasGreenSignals={upsellData.hasGreenSignals} />` |

**Score:** 16/16 truths verified

---

### Required Artifacts

| Artifact | Status | Evidence |
|----------|--------|---------|
| `src/engine/migration.ts` | VERIFIED | Exports `calculateMigration`, `MigrationResult`; contains `breakEvenMonth: number \| null`; `switchingCosts: number = 0` 6th param; `computeBreakEvenMonth` private function |
| `src/engine/upsell.ts` | VERIFIED | Exports `calculateUpsell`, `UpsellOpportunity`, `UpsellSignalStrength`; 101 lines; full signal logic |
| `src/engine/__tests__/migration.test.ts` | VERIFIED | Contains `describe('breakEvenMonth')` at line 128; 4+ test cases |
| `src/engine/__tests__/upsell.test.ts` | VERIFIED | 11 test cases; imports and calls `calculateUpsell` |
| `src/db/types.ts` | VERIFIED | `SchoolRecord.switchingCosts: number` at line 107 |
| `src/db/operations.ts` | VERIFIED | `mapSchoolRow`: `switchingCosts: row.switching_costs ?? 0`; `mapSchoolUpdateToSnakeCase`: `switchingCosts: 'switching_costs'` |
| `src/lib/supabase/types.ts` | VERIFIED | `switching_costs: number` in Row (line 80); `switching_costs?: number` in Insert (line 106) and Update (line 132) |
| `src/features/school-profile/tabs/WaardeTab.tsx` | VERIFIED | 159 lines; imports all 4 section components; imports `calculateMigration`, `calculateComparison`; calls `updateSchoolData` for all 3 editable fields |
| `src/features/school-profile/components/ValueHeroCard.tsx` | VERIFIED | Contains "Totale jaarlijkse waarde van de overstap"; "Vul eerst de vergelijking in op het tabblad Vergelijking" |
| `src/features/school-profile/components/TimeSavingsSection.tsx` | VERIFIED | Contains "Tijdwinst nieuw platform"; "Uurtarief"; uses `EditableField` per task row |
| `src/features/school-profile/components/MigrationSection.tsx` | VERIFIED | Contains "Migratieprijzen zijn indicatief"; `role="alert"` on warning banner |
| `src/features/school-profile/components/MultiYearSection.tsx` | VERIFIED | Contains "Meerjarenprojectie"; "Terugverdiend in"; "Geen terugverdientijd"; "Direct terugverdiend"; Recharts BarChart |
| `src/features/school-profile/components/EditableField.tsx` | VERIFIED | Exports `EditableField`; `min-h-[44px]`; `role="button"`, `tabIndex={0}`, keyboard handlers |
| `src/router/routes.ts` | VERIFIED | `export const waardeRoute` at line 123; `component: WaardeTab`; added to `routeTree` children at line 143 |
| `src/features/school-profile/components/UpsellCard.tsx` | VERIFIED | Contains "Upsell-kansen"; "Vul de huidige situatie in bij stap 4"; "Geen upsell-kansen gevonden"; "Bekijk vergelijking" |
| `src/components/ui/UpsellBadge.tsx` | VERIFIED | Exports `UpsellBadge`; `return null` when `count === 0`; `title` attribute with "upsell-kansen"; "kansen" text |
| `src/features/school-profile/tabs/DashboardTab.tsx` | VERIFIED | Imports `calculateUpsell`, `UpsellCard`; renders `<UpsellCard>` at line 373 |
| `src/features/school-overview/SchoolCard.tsx` | VERIFIED | Imports `UpsellBadge`, `calculateUpsell`, `calculateComparison`; renders `<UpsellBadge>` at line 129 |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `src/engine/migration.ts` | `src/models/migration.ts` | `TIME_SAVING_TASKS` import | WIRED | Line 3: `import { TIME_SAVING_TASKS } from '../models/migration'` |
| `src/engine/upsell.ts` | `src/data/differentiators.ts` | `MODULE_DIFFERENTIATORS` import | WIRED | Line 3: `import { MODULE_DIFFERENTIATORS } from '@/data/differentiators'` |
| `src/db/operations.ts` | `src/db/types.ts` | `mapSchoolRow` reads `switchingCosts` | WIRED | Line 50: `switchingCosts: row.switching_costs ?? 0`; line 142: `switchingCosts: 'switching_costs'` |
| `src/features/school-profile/tabs/WaardeTab.tsx` | `src/engine/migration.ts` | `calculateMigration` import | WIRED | Line 7: `import { calculateMigration } from '@/engine/migration'`; used at line 87 |
| `src/features/school-profile/tabs/WaardeTab.tsx` | `src/engine/price-comparison.ts` | `calculateComparison` import | WIRED | Line 8: `import { calculateComparison } from '@/engine/price-comparison'`; used at line 62 |
| `src/features/school-profile/components/TabNavigation.tsx` | WaardeTab route | Waarde tab entry | WIRED | Line 16: `{ label: 'Waarde', path: \`${base}/waarde\` }` |
| `src/router/routes.ts` | `src/features/school-profile/tabs/WaardeTab.tsx` | `waardeRoute` component | WIRED | Line 18: `import WaardeTab`; line 127: `component: WaardeTab` |
| `src/features/school-profile/components/UpsellCard.tsx` | `src/engine/upsell.ts` | `calculateUpsell` import | WIRED | Line 2: `import type { UpsellOpportunity } from '@/engine/upsell'`; UpsellOpportunity type used |
| `src/features/school-profile/tabs/DashboardTab.tsx` | `src/features/school-profile/components/UpsellCard.tsx` | `<UpsellCard>` render | WIRED | Line 17: `import UpsellCard`; line 373: `<UpsellCard ...>` |
| `src/features/school-overview/SchoolCard.tsx` | `src/components/ui/UpsellBadge.tsx` | `<UpsellBadge>` render | WIRED | Line 9: `import { UpsellBadge }`; line 129: `<UpsellBadge ...>` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| WAARDE-01 | 11-01, 11-02 | Gebruiker ziet per taak de concrete uren bespaard met bewerkbare aannames | SATISFIED | `TimeSavingsSection.tsx`: 5 tasks from `TIME_SAVING_TASKS`, each with `EditableField` for hours |
| WAARDE-02 | 11-01, 11-02 | Gebruiker kan uurtarief instellen en ziet tijdsbesparing omgerekend naar euro's | SATISFIED | `TimeSavingsSection.tsx`: editable uurtarief via `EditableField`; `valuePerYear = hoursPerYear * hourlyRate` |
| WAARDE-03 | 11-01, 11-02 | Gebruiker ziet totale waarde: financieel verschil + tijdsbesparing | SATISFIED | `ValueHeroCard.tsx`: `totalAnnualValue = (priceDifference ?? 0) + timeSavingsValue + migrationDifference` |
| WAARDE-04 | 11-01, 11-02 | Gebruiker ziet meerjarenprojectie over 1, 3 en 5 jaar met break-even | SATISFIED | `MultiYearSection.tsx`: Recharts bar chart + table for years 1/3/5; break-even display |
| MIGR-01 | 11-01, 11-02 | Gebruiker ziet financieel verschil huidig vs nieuw Cito-platform per module en totaal | SATISFIED | `MigrationSection.tsx`: per-module table with Huidig/Nieuw/Verschil; total row |
| MIGR-02 | 11-01, 11-02 | Migratie-engine verwerkt gewijzigd prijsmodel correct | SATISFIED | `calculateMigration`: processes `CITO_MIGRATION_PRICES` with `oldPricePerStudent`/`newPricePerStudent` per module |
| MIGR-03 | 11-01, 11-02, 11-03 | Gebruiker ziet gecombineerde business case: prijsverschil + tijdwinst + meerjarenprojectie | SATISFIED | `WaardeTab.tsx`: orchestrates ValueHeroCard + TimeSavingsSection + MigrationSection + MultiYearSection |
| SCHOOL-07 | 11-01, 11-03 | Systeem detecteert upsell-kansen: modules waar school concurrent gebruikt en overstap voordelig is | SATISFIED | `upsell.ts`: `calculateUpsell` filters by isCheaper/hasDifferentiators; `UpsellCard` on dashboard; `UpsellBadge` on school cards |

All 8 requirement IDs declared across plans are satisfied. No orphaned requirements found — REQUIREMENTS.md traceability table maps all 8 to Phase 11 with status "Complete".

---

### Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|-----------|
| None | — | — | No stubs, placeholders, TODO comments, empty returns, or hardcoded empty data found in any Phase 11 artifact |

Checked all 18 key files. No anti-patterns detected. All state variables are populated by real engine computations (`calculateMigration`, `calculateComparison`, `calculateUpsell`). All editable fields wire through to `updateSchoolData` (Supabase persistence).

---

### Human Verification Required

#### 1. Waarde Tab Full Interaction Flow

**Test:** Navigate to a school profile with 2+ selected modules and at least one module with a non-Cito/non-geen provider set in wizard step 4. Click the "Waarde" tab (6th tab). Verify:
- Hero card shows combined annual value in large font with 3 sub-values below
- Click a Uren/jaar value in the Tijdwinst table — input field appears, enter new value, press Enter — EUR/jaar column updates
- Click the Uurtarief value — change it — EUR/jaar column updates for all rows
- Enter a value in Overstapkosten — "Terugverdiend in N maanden" appears
- Refresh the page — verify all custom values persisted

**Expected:** All interactive edits update computed values immediately. Values survive page refresh (persisted to Supabase via `updateSchoolData`).

**Why human:** Recharts bar chart rendering, reactive Zustand state updates, Supabase round-trip persistence, and tablet touch-target sizing (min-h-[44px]) cannot be verified programmatically.

#### 2. Upsell Card on Dashboard

**Test:** On the same school's Overzicht (dashboard) tab, scroll to find the UpsellCard. Verify signal dots are the correct colors (green-500 or yellow-500). Click "Bekijk vergelijking" — should navigate to Vergelijking tab. Test with a school that has no moduleSetups filled — verify "Vul de huidige situatie in bij stap 4" hint is shown.

**Expected:** Color-coded opportunity rows; correct navigation; hint shown for unconfigured schools.

**Why human:** Signal color rendering and link navigation require browser execution.

#### 3. UpsellBadge on School Overview Cards

**Test:** On the school overview page (/scholen), find a school card that has modules with competitor setups. Verify the "X kansen" badge appears next to the pipeline badge. Verify green badge for green-signal schools, yellow for yellow-only. Verify no badge on schools with 0 opportunities.

**Expected:** Badges render with correct colors and counts. No badge when count is 0 (component returns null).

**Why human:** Badge color variants across multiple school cards require visual confirmation.

---

### Gaps Summary

No gaps found. All 16 must-have truths verified. All artifacts exist, are substantive (real implementations, not stubs), and are wired to their dependencies. All 8 requirement IDs satisfied. The only pending items are the 3 human verification tests above, which require browser-based visual and interaction testing that cannot be automated via static analysis.

---

_Verified: 2026-03-23T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
