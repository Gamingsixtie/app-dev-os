# Phase 27: Wizard-optimalisatie + Stichting-laag — Research

**Researched:** 2026-05-14
**Domain:** Wizard refactor (4 stappen) + nieuwe Stichting-entiteit + AI/rule-based pijnpunt-matching + complete uitfasering `cito-oud` provider en migration/current-vs-proposed engines
**Confidence:** HIGH (alle claims geverifieerd via codebase-audit; alleen string-similarity library-keuze blijft Claude's discretie)

## Summary

Phase 27 is een **groot refactor-en-uitbreidings-pakket** dat 4 lagen tegelijk raakt:

1. **Data-laag** — Nieuwe Supabase tabel `stichtingen` + Dexie versie 3 + ALTER op `schools` met 7 nieuwe kolommen (`stichting_id`, `customer_type`, `school_type`, `custom_school_type`, `growth_trajectory`, `current_tool_usage`, `competitor_remarks`, `competitor_time_minutes`, `pain_point_match_feedback`). Idempotent migrations vereist. Bestaande Phase 6/7/8 pattern hergebruiken: `src/db/database.ts` `version(N).stores().upgrade()` + corresponderende `supabase/migrations/014_*.sql`.
2. **UI-laag** — Alle 5 WizardSteps krijgen veld-uitbreidingen of complete restructure. Stap 4 wordt het hoofd-stuk werk (summary-blok + opmerkingen + tijdscomponent + AI-match). Nieuwe `/stichtingen` route + sub-routes naast bestaand startscherm (Phase 26).
3. **AI-laag** — Mirror van `api/ai-intake.ts` patroon: nieuw `api/ai-match-pijnpunt.ts` met `claude-haiku-4-5`, structured output via Zod schema, server-side auth via Supabase JWT. Parallel rule-based fallback in `src/lib/painPointKeywordMap.ts` die `MODULE_DIFFERENTIATORS` als source-of-truth gebruikt.
4. **Engine-laag** — `src/engine/migration.ts` + `src/engine/current-vs-proposed.ts` worden **verwijderd**. `src/engine/price-comparison.ts` krijgt `bundle: 'basis' | 'plus'` parameter en nieuwe `calculateUpsell(basisBundle, plusBundle)` functie (let op: er bestaat al een `calculateUpsell()` in `src/engine/upsell.ts` voor competitor→Cito kansen — **naamcollisie, hernoem nieuwe naar `calculateBasisPlusUpsell`**).

**Primary recommendation:** Splits het execute-werk in 11-13 sequentiele plans, één per requirement (R1-R11) plus dedicated cleanup-plan voor cito-oud + dedicated test/UAT-plan. **Doe R10 cleanup als laatste** om R1-R9 testbaar te houden zonder massieve compileer-cascades. De LOCKED-files (`src/data/default-prices.ts`, `src/data/cito-migration-prices.ts`) raken we anders dan SPEC aanneemt — zie kritieke clarificatie hieronder.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stichting-entiteit CRUD | Database (Supabase + Dexie) | API/Backend (operations.ts) | Eerste-klas entity, niet view-state. Dexie spiegel voor offline (ARCH-05). |
| Stichting card-grid UI | Browser/Client | Frontend Server | Pure read-only render; geen SSR (Vite SPA). |
| Smart-suggestion match algoritme | Browser/Client | — | Pure functie, draait lokaal op cached schools. Geen API-call. |
| Stichting bulk-export CSV | Browser/Client | — | xlsx (al geïnstalleerd) genereert CSV in-browser; geen server-trip. |
| Stichting DMU-PDF aggregatie | Browser/Client | — | `@react-pdf/renderer` Phase 12 pattern blijft client-side. |
| Wizard form state | Browser/Client (Zustand) | Database (Dexie + Supabase sync) | Zustand+persist+`getState()` pattern is LOCKED (AGENTS.md). |
| AI pijnpunt-matching | API/Backend (Vercel Function) | Browser/Client (rule-based fallback) | `ANTHROPIC_API_KEY` server-only (AGENTS.md). Frontend roept aan; rule-based fallback runt in browser. |
| Rule-based keyword-lookup | Browser/Client | — | Pure functie, instant, geen netwerk-dependency. |
| Pain-point feedback (thumb up/down) | Database (Supabase) | Browser/Client (Zustand cache) | Persisteert in `schools.pain_point_match_feedback` JSONB. |
| Cito Basis/Plus/Upsell scenario engine | API/Backend? — NEE | Pure engine module | Pure-function invariant uit AGENTS.md geldt: blijft puur, in `src/engine/`. Geen tier-shift. |
| `cito-oud` cleanup | Database (data wipe) + Code (refactor) | — | D-07: demo-data wipe, geen migratie-flow. Code rename ScenarioType + delete migration/current-vs-proposed engines. |

## User Constraints (from CONTEXT.md)

### Locked Decisions

**SPEC.md requirements (R1-R11) zijn locked** — zie `27-SPEC.md` voor volledige Current/Target/Acceptance tabellen. Researcher heeft alle requirements 1-op-1 doorgenomen tegen codebase.

**CONTEXT.md D-01..D-21 zijn locked** — researcher mag **geen alternatieven voorstellen** op:

- **D-01:** Stichting = eigen Supabase tabel `stichtingen` + FK `stichting_id` (nullable) op `schools` + Dexie spiegel via nieuwe `StichtingRecord` in `src/models/stichting.ts`.
- **D-02:** Card-grid UI op `/stichtingen` route, patroon = `SchoolOverview` / `SchoolCard`.
- **D-03:** Smart-suggestion bulk-koppel via heuristieken (regio + naam-similarity ≥ 0.6 + adres). Pre-checked als score > 0.8.
- **D-04:** Delete-cascade verboden — eerst loskoppelen verplicht.
- **D-05:** Stichting-detail-view `/stichtingen/:id` met tabs Overzicht/Scholen/Export. Hergebruik bestaande `TabNavigation` component (Phase 7).
- **D-06:** Hard delete `cito-oud` in execute-phase. **LET OP — zie kritieke clarificatie sectie hieronder over welke files daadwerkelijk geraakt worden.**
- **D-07:** Geen data-migratie voor cito-oud — demo-data mag wipen.
- **D-08:** Volledige engine-cleanup: `migration.ts`, `current-vs-proposed.ts`, `MigrationWizard.tsx`, `MigrationPage.tsx`, `CurrentVsProposedPage.tsx`, hun tests, routes `/migratie` + `/huidig-vs-cito`, en `Scenario` type herziening.
- **D-09:** Geen UI-melding voor sales.
- **D-10:** Gestructureerd AI-response via Zod schema (zie CONTEXT.md voor exacte shape).
- **D-11:** Parallel rule-based + AI met AI-prioriteit (timeout 5s default).
- **D-12:** Custom AI-prompt template voor power-users (admin-veld, team-level).
- **D-13:** Expliciete trigger-knop "Vind Cito-voordelen". Geen onBlur/debounce.
- **D-14:** Feedback persisteert in `schools.pain_point_match_feedback` (JSONB array).
- **D-15:** Rule-based keyword-map in `src/lib/painPointKeywordMap.ts`, gemerged met `MODULE_DIFFERENTIATORS`.
- **D-16:** Kritische audit per WizardStep — alleen behouden wat strict nodig is, refactor de rest.
- **D-17:** Sub-componenten via composition (9 nieuwe components opgesomd in CONTEXT.md).
- **D-18:** Gedeelde Zod schemas met `.merge()`/`.extend()`. Locaties: `src/features/school-profile/schemas/` + nieuwe `src/features/stichtingen/schemas/`.
- **D-19:** `TimeSavingsSection` → `TimeInputSection` met `mode: 'cito-savings' | 'competitor-time'` prop.
- **D-20:** Read-only summary in WizardStep4 met 'Wijzig'-knop per blok → `setStep()` action.
- **D-21:** `TOTAL_STEPS = 5` blijft 5. Geen extra wizard-stap.

### Claude's Discretion

Researcher en planner mogen autonoom beslissen op:

- Exacte string-similarity library (vergelijk `string-similarity` ~5KB pkg vs inline Levenshtein ~50 LOC). **Recommendation: inline Levenshtein** (zie `## Standard Stack` rationale — past bij Phase 22 deps-policy).
- Confidence-threshold cutoff (default 0.8, planner mag bijstellen na testdata).
- `<PainPointPanel>` styling: cards vs lijst, confidence-percentage zichtbaar of niet.
- Aantal taak-types in `TimeInputSection mode='competitor-time'` (huidige cito-savings heeft 5; competitor mag 6 zijn met `rapporten-lezen`).
- AI-timeout (3-8s range; default 5s).
- Heuristieken-weight (regio vs naam-match).
- Of `cito-bundles.ts` ook aangepast moet worden voor R10 Upsell — **JA, planner moet hier expliciet over zijn**: `CITO_BUNDLES` array in `src/data/providers/cito.ts` definieert Basis (€23,93) + Plus (€34,93). De Upsell-engine consumeert deze waarden direct, geen splitsing nodig.
- Veldnaam `customerType` vs `citoCustomerStatus` — **recommendation: `customerType`** (kort, consistent met andere wizard-velden zoals `schoolType`).
- Aparte `team_settings` tabel vs uitbreiding bestaande — **recommendation: nieuwe `team_settings` tabel** (geen bestaande tabel heeft een logische home voor een AI-prompt-override; users tabel zou per-user impliceren wat D-12 expliciet afwijst).

### Deferred Ideas (OUT OF SCOPE)

- Bestuurs-niveau analytics dashboard
- AI-feedback-loop machine-learning (we slaan op, maar trainen niet)
- Multi-stichting-vergelijking
- AI custom-prompt per gebruiker (team-niveau is gekozen)
- Schoolsoort-specifieke prijslogica
- Concurrent-tijd benchmarking standalone feature
- Vierde provider

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R1 | Stichting-entiteit + CRUD | `src/db/database.ts` patterns + `src/db/operations.ts` patterns + Phase 8 Supabase migration patterns. Mirror `SchoolRecord` → `StichtingRecord`. |
| R2 | Stichting bulk-export (CSV + PDF-aggregatie) | `xlsx` library already installed (`XLSX.utils.sheet_to_csv()`); `@react-pdf/renderer` patterns in `src/features/export/pdf/`. Hergebruik `ReportDocument.tsx` met loop-over-scholen wrapper. |
| R3 | Klant-type vinkje | Nieuw veld + Zod schema `.extend(step1-schema)`; persist via store `setCustomerType()`. Driver voor R10 scenario-keuze. |
| R4 | Schoolsoort + groei-trajectorie | Nieuwe sub-components `SchoolTypeFields.tsx` + `GrowthTrajectoryRadio.tsx` (D-17). Zod schema `school-meta.schema.ts` (D-18). |
| R5 | Huidig-gebruik per niveau | Nieuw sub-component `CurrentToolPerLevel.tsx`. Per-level radio onder student-counts-matrix in `WizardStep2.tsx`. Drives stichting mix-aggregatie. |
| R6 | Burgerschap + Digitale geletterdheid modules | `MODULE_CATALOG` in `src/models/modules.ts` + `CITO_DEFAULT_PRICES` array in `src/data/providers/cito.ts`. SLO kerndoelen 2025-2026 (alle niveaus). |
| R7 | WizardStep3 herstructurering Basis vs Extra | Refactor `CATEGORY_ORDER` + sectie-headings. Bestaande presets (`LVS Basis/Compleet/Alles`) hermappen naar nieuwe categorieën. |
| R8 | WizardStep4 dubbel-check + opmerkingen + tijd | Drie nieuwe sub-components: `WizardSummaryBlock`, `PainPointPanel`, `TimeInputSection` (D-19 refactor van `TimeSavingsSection`). |
| R9 | AI pijnpunt-matching + rule-based fallback | Nieuw `api/ai-match-pijnpunt.ts` (mirror `api/ai-intake.ts`) + `src/lib/ai-match-pijnpunt.ts` client + `src/lib/painPointKeywordMap.ts` keyword-map. |
| R10 | Stap 5 Basis/Plus/Upsell + cito-oud cleanup | Engine-cleanup + scenario-renaming + nieuwe `calculateBasisPlusUpsell()` in `price-comparison.ts`. **Grootste plan; bevat 4 sub-plans.** |
| R11 | Bulk-migratie scholen naar stichting | Multi-select dialog (drempelvrij hergebruik `@dnd-kit/core` voor checkboxes, of native input). ALTER schools-tabel met `stichting_id`. |

## Standard Stack

### Core (al geïnstalleerd, hergebruik)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | `^0.92.0` | AI pijnpunt-matching (R9) | Bestaand voor `ai-intake.ts`, `ai-wizard-advice.ts` patterns. Server-side `messages.parse()` met Zod. |
| `zod` | `^4.3.6` | All form schemas + AI structured output | Project-wide pattern (D-18 `.merge()`/`.extend()`). |
| `react-hook-form` | `^7.71.2` | Form state in alle WizardSteps | Project-wide (AGENTS.md regel). |
| `@hookform/resolvers` | `^5.2.2` | `zodResolver()` bridge | Project-wide. |
| `zustand` | `^5.0.12` | `useSchoolProfileStore` extensions | LOCKED pattern: `getState()` cross-store reads. |
| `dexie` | `^4.3.0` | Offline IndexedDB voor Stichting | Bestaand Phase 8 pattern. `db.version(3).stores().upgrade()`. |
| `@supabase/supabase-js` | `^2.99.3` | Stichting CRUD + RLS | Bestaand Phase 8 pattern. |
| `@tanstack/react-router` | `^1.168.1` | `/stichtingen` + `/stichtingen/:id` nested routes | Bestaand `routes.ts` registratie-pattern (zie code excerpt onder). |
| `@tanstack/react-query` | `^5.94.5` | `useStichtingen()` + `useStichting(id)` data hooks | Bestaand Phase 8 pattern (mirror `useSchools` / `useSchool`). |
| `xlsx` | `^0.18.5` | CSV-export voor R2 (Stichting bulk-export) | Phase 22: HIGH vulnerability accepted for internal tool. Heeft al `XLSX.utils.sheet_to_csv()` + `sheet_to_json` patterns. **Geen papaparse nodig.** |
| `@react-pdf/renderer` | `^4.3.2` | DMU-PDF aggregatie R2 | Phase 12 pattern in `src/features/export/pdf/ReportDocument.tsx`. |

### Geen nieuwe dependencies — Claude's keuze (Levenshtein vs npm pkg)

| Library | Version | Decision | Rationale |
|---------|---------|----------|-----------|
| `string-similarity` | n/a | **NIET installeren** | Phase 22 deps-policy: liever inline ~50 LOC dan npm dep. Levenshtein-impl haalbaar; geen bundle-bloat. |

**Recommendation:** Inline Levenshtein-implementatie in `src/lib/stichtingMatcher.ts`:

```typescript
// Source: standard Wagner-Fischer algorithm, public domain
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  if (longer.length === 0) return 1;
  return (longer.length - levenshtein(a, b)) / longer.length;
}
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) matrix[i][j] = matrix[i-1][j-1];
      else matrix[i][j] = Math.min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1);
    }
  }
  return matrix[b.length][a.length];
}
```

**Version verification:** All packages above checked via `package.json` op disk (`apps/concurrentoolVO/package.json`). Geen `string-similarity` of `papaparse` in tree.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `xlsx` voor CSV-export | `papaparse` (~14KB) | xlsx is al binnen; geen extra dep nodig. xlsx kan ook valide CSV maken via `sheet_to_csv()`. |
| Inline Levenshtein | `string-similarity` npm pkg | npm pkg is ~5KB extra bundle. Inline ~50 LOC heeft geen externe afhankelijkheden, makkelijker te testen, past bij Phase 22 dep-policy. |
| Nieuwe `team_settings` tabel voor AI-prompt-override | Uitbreiden bestaande `teams` tabel met `pain_point_matcher_prompt` kolom | Bestaande `teams` tabel heeft alleen `id`, `name`, `created_at` — nu kolom toevoegen vs aparte tabel met user-context. **Aparte tabel is cleaner** voor uitbreiding (D-12 power-user prompts) maar planner mag ook kolom-op-`teams` kiezen voor MVP. |

## Architecture Patterns

### System Architecture Diagram

```
User invoer (wizard)
    │
    ▼
WizardStep{1..5}.tsx (react-hook-form + Zod)
    │ submit()
    ▼
useSchoolProfileStore (Zustand + persist)
    │ updateSchoolData()
    ▼
src/db/operations.ts ── INSERT/UPDATE ──▶ Supabase ──── RLS check ──▶ schools tabel
    │                                           ▲                       │
    │ Dexie spiegel (offline)                   │                       │
    ▼                                           │                       │
src/db/database.ts (IndexedDB)              syncBack                    │
                                                                        │
                                       ┌────────────────────────────────┘
                                       │ stichting_id FK
                                       ▼
                                    stichtingen tabel  ── RLS check ──▶ team-scoped
                                       │
        ┌──────────────────────────────┼─────────────────────────────┐
        ▼                              ▼                              ▼
   /stichtingen                  /stichtingen/:id              /scholen/:slug/wizard
   (card-grid)              (Overzicht|Scholen|Export)        (5-staps wizard)
                                       │                              │
                                       │                              │ Step 4
                                       ▼                              ▼
                              CSV + PDF-aggregatie      PainPointPanel
                              (xlsx + @react-pdf)              │
                                                               │ Trigger-knop
                                                               ▼
                                                       ┌──────┴──────┐
                                                       │             │
                                                  rule-based      AI parallel
                                                  (instant)            │
                                                       │       /api/ai-match-pijnpunt
                                                       │             │ claude-haiku-4-5
                                                       └──────┬──────┘ structured (Zod)
                                                              │
                                                              ▼
                                                       Matched advantages
                                                              │
                                                              ▼ thumb up/down
                                                       schools.pain_point_match_feedback (JSONB)
```

### Component Responsibilities (Phase 27 nieuw + gewijzigd)

| Component / File | Phase 27 responsibility |
|------------------|------------------------|
| `src/models/stichting.ts` (NEW) | `StichtingRecord` type, label maps, helper functies. |
| `src/db/types.ts` (EXTEND) | `Stichting` Dexie type, extend `SchoolRecord` met 9 nieuwe velden. |
| `src/db/database.ts` (EXTEND) | Add `version(3)` met `stichtingen` tabel + upgrade van `schools`. |
| `src/db/operations.ts` (EXTEND) | `createStichting`, `updateStichting`, `deleteStichting` (met cascade-guard D-04), `linkSchoolToStichting`, `unlinkSchoolFromStichting`, `bulkLinkSchools`. |
| `supabase/migrations/014_*.sql` (NEW) | Create `stichtingen` tabel + ALTER schools met 9 kolommen + RLS policies. |
| `supabase/migrations/015_*.sql` (NEW) | Create `team_settings` tabel (D-12) als planner die richting kiest. |
| `src/features/stichtingen/` (NEW dir) | Container voor Stichting feature (StichtingOverviewPage, StichtingDetailPage, StichtingCard, StichtingForm). |
| `src/features/stichtingen/schemas/` (NEW dir) | Zod schemas voor StichtingForm (D-18). |
| `src/lib/stichtingMatcher.ts` (NEW) | Smart-suggestion algoritme (Levenshtein + regio + adres weight). |
| `src/lib/painPointKeywordMap.ts` (NEW) | Rule-based fallback keyword → differentiator-IDs mapping. |
| `src/lib/ai-match-pijnpunt.ts` (NEW) | Frontend caller (mirror `ai-intake.ts` getAuthHeaders + parseExtractionFromText). |
| `api/ai-match-pijnpunt.ts` (NEW) | Vercel function (mirror `api/ai-intake.ts` skeleton). |
| `src/features/school-profile/components/SchoolTypeFields.tsx` (NEW, D-17) | R4 schoolsoort + customSchoolType. |
| `src/features/school-profile/components/GrowthTrajectoryRadio.tsx` (NEW, D-17) | R4 groei-trajectorie radio. |
| `src/features/school-profile/components/CustomerTypeRadio.tsx` (NEW, D-17) | R3 klant-type radio. |
| `src/features/school-profile/components/CurrentToolPerLevel.tsx` (NEW, D-17) | R5 huidig-gebruik per niveau. |
| `src/features/school-profile/components/WizardSummaryBlock.tsx` (NEW, D-17, D-20) | R8 read-only summary + 'Wijzig'-knop per blok. |
| `src/features/school-profile/components/PainPointPanel.tsx` (NEW, D-17) | R8/R9 opmerkingen + trigger-knop + matches + feedback. |
| `src/features/school-profile/components/TimeInputSection.tsx` (REFACTOR, D-19) | Hernaming + `mode` prop. Bestaand `TimeSavingsSection.tsx` wordt deze (of nieuwe file + verwijdering). |
| `src/features/school-profile/components/WizardStep{1..5}.tsx` (REFACTOR, D-16) | Per stap kritische audit. Stap 1+2+3+4 krijgen veld-uitbreidingen. Stap 5 wordt herstructureerd. |
| `src/components/wizard/ProgressBar.tsx` (TOUCH-LIGHT) | `STEP_LABELS` blijft 5 items maar labels mogen veranderen (`School` → `Schoolgegevens` etc., niet verplicht). |
| `src/engine/price-comparison.ts` (EXTEND) | Nieuwe `bundle: 'basis' \| 'plus'` parameter, nieuwe `calculateBasisPlusUpsell()` functie. **NAAMCOLLISIE waarschuwing:** `src/engine/upsell.ts` heeft al `calculateUpsell()` (Phase 11). Gebruik andere naam. |
| `src/engine/migration.ts` (DELETE) | R10. |
| `src/engine/current-vs-proposed.ts` (DELETE) | R10. |
| `src/features/migration/MigrationWizard.tsx` (DELETE) | R10. |
| `src/features/migration/CloudMigrationWizard.tsx` (KEEP) | **Niet verwijderen** — dit is de v1→v2 IndexedDB-naar-Supabase wizard, ongerelateerd aan scenario B. |
| `src/features/price-comparison/MigrationPage.tsx` (DELETE) | R10. |
| `src/features/price-comparison/CurrentVsProposedPage.tsx` (DELETE) | R10. |
| `src/router/routes.ts` (EDIT) | Verwijder `migratieRoute` + `huidigVsCitoRoute`. Add `stichtingenRoute`, `stichtingDetailRoute`. |

### Wizard Step Audit (D-16 — per stap wat blijft / wat verandert)

| Step | Current shape | Phase 27 deltas |
|------|---------------|------------------|
| **Step 1** (`WizardStep1.tsx`, 119 LOC) | `schoolName` input + `levels` checkboxes (5 niveaus). Zod schema `schoolTypeSchema` met min(1) levels. | **Add:** `<CustomerTypeRadio>` (R3), `<SchoolTypeFields>` met optional `customSchoolType` (R4), `<GrowthTrajectoryRadio>` (R4). Schema = `schoolTypeSchema.extend(schoolMetaSchema)` of `.merge()`. Store: `setCustomerType`, `setSchoolType`, `setCustomSchoolType`, `setGrowthTrajectory`. |
| **Step 2** (`WizardStep2.tsx`, 168 LOC) | Student-counts matrix per niveau × leerjaar + 3 preset-buttons (klein/midden/groot). | **Add onder matrix:** `<CurrentToolPerLevel>` (R5) — per gekozen level een mini-radio `cito / dia / jij / mix / geen`. Zod schema: `studentCountsSchema.extend({ currentToolUsage: z.record(z.string(), z.enum(...)) })`. Store: `setCurrentToolUsage`. |
| **Step 3** (`WizardStep3.tsx`, 300 LOC) | 2 categorieën (LVS: rekenwiskunde/nederlands/engels; Overig: 7 modules incl. MVT-subgroep). Quick-picks LVS Basis/Compleet/Alles. | **Refactor categorieën** (R7): "Basisvaardigheden" (RE/NL/EN) + "Extra Modules" (de rest, **incl. nieuwe Burgerschap + Digitale geletterdheid**, R6). MVT-subgroep blijft. Quick-picks hermappen. `MODULE_CATEGORIES` mapping in `src/models/modules.ts` wordt uitgebreid met `'extra-modules'`. |
| **Step 4** (`WizardStep4.tsx`, 315 LOC — **grootste stap**, "Wat is de huidige situatie?") | Per geselecteerde module: provider-dropdown (`cito-oud/cito-nieuw/dia/jij/saqi/overig/geen`) + price-input + custom-naam input + publicatieprijs-context + schijnvoordeel-warnings + `<DifferentiatorComparison>`. | **Volledige toevoeging** (R8): `<WizardSummaryBlock>` bovenaan (read-only school+levels+modules+klant-type, met 'Wijzig'-link per blok via `setCurrentStep()`) + `<PainPointPanel>` (textarea + trigger-knop + matches) + `<TimeInputSection mode="competitor-time">` (5-6 taken). **Verwijder `cito-oud` uit provider-dropdown** (R10 + D-08): `BASE_PROVIDER_OPTIONS` array `['cito-oud', ...]` → `['cito-nieuw', 'dia', 'jij', 'overig', 'geen']`. Schema `step4-schema.ts` enum aanpassen. |
| **Step 5** (`WizardStep5.tsx`, 135 LOC) | 3 scenario's A/B/C (allCitoOud-conditional). Bevat `<ScenarioPreview>` en `<DMUContextPanel>`. | **Volledige herstructurering** (R10): scenarios worden Basis/Plus/Upsell. Upsell alleen zichtbaar als `customerType !== 'nieuwe-prospect'`. `SCENARIO_LABELS` + `Scenario` type herzien (zie kritieke clarificatie). `scenarioSchema` enum aanpassen. |

### Pattern 1: TanStack Router nested routes (R1, D-05)

```typescript
// Source: src/router/routes.ts (existing pattern verified)
// Add deze 2 routes naast bestaande prijzenRoute (lines 49-56):

export const stichtingenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stichtingen',
  component: lazyRouteComponent(
    () => import('@/features/stichtingen/StichtingOverviewPage'),
    'StichtingOverviewPage',
  ),
});

export const stichtingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,  // Niet onder stichtingenRoute — flat, zoals schoolRoute
  path: '/stichtingen/$id',
  beforeLoad: async ({ params }) => {
    const stichting = await checkStichtingExists(params.id);
    if (!stichting) throw redirect({ to: '/stichtingen', search: { error: 'not-found' } });
    return { stichting };
  },
  component: lazyRouteComponent(
    () => import('@/features/stichtingen/StichtingDetailPage'),
    'StichtingDetailPage',
  ),
});

// In routeTree (line 185-205):
// Add stichtingenRoute, stichtingDetailRoute
// Remove migratieRoute, huidigVsCitoRoute, SCHOOL_TAB_ROUTES.migratie + .huidig-vs-cito
```

### Pattern 2: Dexie versioned migration (R1, R11)

```typescript
// Source: src/db/database.ts (existing pattern, lines 11-25)
// Pattern: db.version(N).stores(...).upgrade(tx => ...)
// Phase 27 voegt version(3) toe:

this.version(3).stores({
  schools: '++id, slug, name, updatedAt, pipelineStatus, stichtingId',  // + index op stichtingId
  stichtingen: 'id, name, region, updatedAt',                            // NEW table
}).upgrade(async tx => {
  // Zet defaults voor nieuwe schools-kolommen
  await tx.table('schools').toCollection().modify(school => {
    school.stichtingId = school.stichtingId ?? null;
    school.customerType = school.customerType ?? null;
    school.schoolType = school.schoolType ?? null;
    school.customSchoolType = school.customSchoolType ?? null;
    school.growthTrajectory = school.growthTrajectory ?? null;
    school.currentToolUsage = school.currentToolUsage ?? {};
    school.competitorRemarks = school.competitorRemarks ?? '';
    school.competitorTimeMinutes = school.competitorTimeMinutes ?? {};
    school.painPointMatchFeedback = school.painPointMatchFeedback ?? [];
  });
  // (D-07) Wipe cito-oud moduleSetups — demo data clean slate
  await tx.table('schools').toCollection().modify(school => {
    if (Array.isArray(school.moduleSetups)) {
      school.moduleSetups = school.moduleSetups.filter(
        (s: { currentProvider: string }) => s.currentProvider !== 'cito-oud',
      );
    }
  });
});
```

### Pattern 3: Supabase RLS migration (R1)

```sql
-- Source: supabase/migrations/008_planned_touchpoints.sql (existing RLS pattern)
-- Create supabase/migrations/014_stichtingen.sql

CREATE TABLE stichtingen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE schools
  ADD COLUMN stichting_id UUID REFERENCES stichtingen(id) ON DELETE SET NULL,
  ADD COLUMN customer_type TEXT,           -- 'huidige-cito' | 'nieuwe-prospect' | 'gedeeltelijk'
  ADD COLUMN school_type TEXT,             -- 'regulier' | 'dakpanklas' | 'dalton' | 'montessori' | 'vrije-school' | 'overig'
  ADD COLUMN custom_school_type TEXT,
  ADD COLUMN growth_trajectory TEXT,       -- 'groei' | 'krimp' | 'stabiel' | 'loting'
  ADD COLUMN current_tool_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN competitor_remarks TEXT NOT NULL DEFAULT '',
  ADD COLUMN competitor_time_minutes JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN pain_point_match_feedback JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX idx_schools_stichting_id ON schools(stichting_id) WHERE stichting_id IS NOT NULL;
CREATE INDEX idx_stichtingen_team_id ON stichtingen(team_id);

ALTER TABLE stichtingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view stichtingen"
  ON stichtingen FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can insert stichtingen"
  ON stichtingen FOR INSERT
  WITH CHECK (team_id = get_user_team_id());

CREATE POLICY "Team members can update stichtingen"
  ON stichtingen FOR UPDATE
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can delete stichtingen"
  ON stichtingen FOR DELETE
  USING (team_id = get_user_team_id());

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON stichtingen
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Cito-oud cleanup (D-07): wipe demo moduleSetups entries
-- Idempotent: filtert entries waar currentProvider = 'cito-oud'
UPDATE schools
SET module_setups = COALESCE(
  (
    SELECT jsonb_agg(setup)
    FROM jsonb_array_elements(module_setups) AS setup
    WHERE setup->>'currentProvider' != 'cito-oud'
  ),
  '[]'::jsonb
)
WHERE module_setups @> '[{"currentProvider": "cito-oud"}]'::jsonb;
```

### Pattern 4: Vercel Function AI proxy (R9, D-10)

```typescript
// Source: api/ai-intake.ts (line 199-209 streaming pattern)
// Create api/ai-match-pijnpunt.ts — mirror van ai-intake.ts skelet

// Belangrijke verschillen:
// - GEEN streaming nodig (single match-result, niet incremental UI). Use anthropic.messages.create() ipv .stream().
// - Structured output via system-prompt + JSON.parse (consistent met ai-intake)
//   OF anthropic.messages.parse() met Zod schema (modernere variant, lijkt nog niet gebruikt in deze repo — check Anthropic SDK 0.92.0 docs)
// - Auth: zelfde Supabase JWT pattern (lines 174-189 van ai-intake.ts)
// - System prompt: gestructureerd, bevat MODULE_DIFFERENTIATORS als context, force JSON-only output

// Response shape (Zod, D-10):
const matchResponseSchema = z.object({
  painPoints: z.array(z.string()).max(10),
  matches: z.array(z.object({
    moduleId: z.string(),
    advantage: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

// Frontend (src/lib/ai-match-pijnpunt.ts) mirror:
// - getAuthHeaders() helper (copy uit ai-intake.ts lines 194-209)
// - fetch('/api/ai-match-pijnpunt', { method: 'POST', body: JSON.stringify({ remarks, selectedModules, customerType }) })
// - Schema.parse() voor validatie
// - 5s timeout via AbortController
```

### Anti-Patterns to Avoid

- **Stale closures via hook-based Zustand reads** — voor cross-store reads gebruik `useSchoolProfileStore.getState()`, nooit een hook. LOCKED in AGENTS.md.
- **Side effects in engine-functies** — `calculateBasisPlusUpsell()` blijft puur, neemt school-profile als parameter, mag GEEN store/db touchen.
- **VITE_-prefix op ANTHROPIC_API_KEY** — moet server-side, geen `VITE_` (al gefixt in `fix/strip-vite-prefix-anthropic-key` branch — onze huidige branch).
- **Inline cito-oud-check op meerdere plaatsen** — na R10 cleanup MAG `cito-oud` als string nergens meer voorkomen. `git grep -i 'cito-oud' src/` moet 0 hits geven (huidig: **62 hits across 23 files**, zie audit hieronder).
- **Hard delete cascade voor Stichting** — D-04 verbiedt cascade. Loskoppel-flow eerst verplichten.
- **Wijzigen van `default-prices.ts`** — **NIET NODIG voor R10**. Zie kritieke clarificatie hieronder.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV genereren | Custom string-concat met escape-logica | `XLSX.utils.sheet_to_csv()` (xlsx pkg al installed) | Comma/quote/newline-escaping edge cases. xlsx werkt al in `school-list-store.ts` voor import — symmetrisch voor export. |
| PDF rendering | HTML→PDF in browser | `@react-pdf/renderer` met loop-over-scholen wrapper | Phase 12 ReportDocument.tsx is een complete DMU-template. Stichting-PDF is loop daarover plus aggregatie-tabel. |
| Form state | `useState` per veld | `react-hook-form` + Zod | Project-wide pattern (AGENTS.md regel). |
| Cross-component navigation in wizard | Router push uit child component | `useSchoolProfileStore.getState().setCurrentStep(n)` + parent navigate | Phase 16 pattern: WizardStep1Notes calls setStep(1) directly after extraction. Voor 'Wijzig'-knop in R8 D-20. |
| Multi-select dialog | Eigen state-management | Native `<input type="checkbox">` array of `@dnd-kit/core` (al installed) | Phase 7 gebruikt `@dnd-kit/core` voor kanban. Voor R11 bulk-koppel: native checkboxes voldoen — simpeler. |
| AI structured output validation | Regex op JSON | Zod `messages.parse()` of post-parse `schema.parse()` | Zod is project-wide. `ai-intake.ts` `parseExtractionFromText()` is template (lines 265-314). |
| Levenshtein string-similarity | npm `string-similarity` pkg | Inline Wagner-Fischer ~50 LOC | Phase 22 deps-policy. Zie code-snippet boven. |

**Key insight:** Veel "nieuwe" features in Phase 27 zijn variaties op bestaande patterns. De research-vraag is bijna altijd "welk bestaand pattern is mijn template" — zelden "welke nieuwe lib heb ik nodig". Enige Phase 27 toevoegingen die geen voorbeeld in repo hebben: stichting CRUD (mirror schools) en pijnpunt-AI (mirror ai-intake).

## Runtime State Inventory

> Required omdat R10 een **major rename + uitfasering** is — niet alleen code-edit.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | Supabase `schools.module_setups` JSONB kan rijen bevatten met `currentProvider: 'cito-oud'`. Supabase `schools.scenario` kan `'B'` of `'C'` bevatten. Dexie `schools` table identiek. | (1) SQL data-cleanup in migratie 014: UPDATE schools SET module_setups = filter(..., currentProvider != 'cito-oud'); (2) Dexie upgrade in version(3) doet hetzelfde via `tx.table('schools').toCollection().modify()`. (3) `scenario` column blijft TEXT, semantiek verandert (`A` blijft; `B`/`C` worden ongeldig na Phase 27 — planner moet beslissen: NULL-zetten of wipe via migratie). |
| **Live service config** | Geen — Vercel env-vars zijn ongerelateerd (`ANTHROPIC_API_KEY`, `SUPABASE_*`). | Geen actie. |
| **OS-registered state** | Geen — geen Windows Task Scheduler / launchd / pm2 in dit project. | Geen actie. |
| **Secrets and env vars** | Geen — geen env-var heet `CITO_OUD_*`. | Geen actie. |
| **Build artifacts / installed packages** | TS-compile produceert geen externe artefacten. PWA service-worker cacht oude `migration.ts` chunk — eerste deploy zal nieuwe bundle krijgen, service-worker update is reload-triggered. | Geen handmatige actie. Vercel build produceert nieuwe artifacts. |

**The canonical question:** *Na de cleanup heeft `git grep -i 'cito-oud' src/` 0 hits.* Validatie acceptance-criterium R10 dekt dit al.

## Cito-oud Cleanup Audit (R10, D-06, D-08)

Volledige inventaris gemaakt via `git grep` op disk. Dit lijstje moet de planner tot taken decomponeren.

### 1. `cito-oud` string occurrences (23 files, 62 hits)

| File | Hits | Treatment |
|------|------|-----------|
| `src/models/school.ts` | 3 | **Remove** `'cito-oud'` uit `CurrentProvider` union, `toPriceProvider()` switch, `CURRENT_PROVIDER_LABELS` map. |
| `src/features/school-profile/schemas/step4-schema.ts` | 1 | **Remove** `'cito-oud'` uit `currentProviderEnum` z.enum. |
| `src/features/school-profile/schemas/intake-extraction.schema.ts` | 1 | **Remove** uit Zod schema. |
| `src/features/school-profile/components/WizardStep4.tsx` | 3 | **Remove** uit `BASE_PROVIDER_OPTIONS`, `excluded providers in DifferentiatorComparison check`, label string. |
| `src/features/school-profile/components/WizardStep5.tsx` | 2 | **Remove** allCitoOud-check (scenarios `['A','B','C']` ternary, lines 18-22). Replace met nieuwe Basis/Plus/Upsell logic. |
| `src/features/school-profile/components/StructuredIntakeForm.tsx` | 1 | **Remove**. |
| `src/features/school-profile/components/ConversationForm.tsx` | 1 | **Remove** als provider-tag-suggestion list. |
| `src/features/school-profile/tabs/ComparisonTab.tsx` | 3 | **Remove** scenario routing (MigrationPage import + render). |
| `src/features/school-profile/components/__tests__/WizardStep4.test.tsx` | 1 | **Update** test data. |
| `src/features/school-profile/components/__tests__/WizardStep5.test.tsx` | 4 | **Update** of **delete** Scenario B/C tests; **add** Basis/Plus/Upsell tests. |
| `src/features/school-profile/__tests__/diff-view-logic.test.ts` | 1 | **Update**. |
| `src/features/price-comparison/wizard/scenario-detection.ts` | 2 | **Remove** cito-oud handling (mogelijk hele file deletable als alleen migration-logic doet — planner check). |
| `src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts` | 7 | **Update / delete**. |
| `src/features/price-comparison/wizard/ComparisonWizard.tsx` | 1 | **Update** (mogelijk delete als alleen Scenario B/C). |
| `src/lib/__tests__/ai-advice.test.ts` | 1 | **Update** test fixtures. |
| `src/engine/scenario-detection.ts` | 5 | **Rewrite**: COMPETITOR_PROVIDERS set blijft; migrationModuleIds detection vervalt; recommended scenario logic herzien voor Basis/Plus/Upsell. |
| `src/engine/__tests__/scenario-detection.test.ts` | 14 | **Heavy rewrite** — biggest test rewrite. |
| `src/engine/hybrid-scenario.ts` | 1 | **Update** COMPETITOR_PROVIDERS exclusion (mag blijven of weggehaald). |
| `src/engine/__tests__/hybrid-scenario.test.ts` | 2 | **Update**. |
| `src/engine/current-vs-proposed.ts` | 2 | **DELETE FILE** (D-08). |
| `src/engine/__tests__/current-vs-proposed.test.ts` | 2 | **DELETE FILE**. |
| `src/engine/upsell.ts` | 2 | **Update** `EXCLUDED_PROVIDERS` array (remove cito-oud) — semantically wordt deze nu `EXCLUDED = ['geen', 'cito-nieuw', 'overig']`. |
| `src/engine/__tests__/upsell.test.ts` | 2 | **Update** test data. |

### 2. Routes naar verwijderde pages

| Route | File | Action |
|-------|------|--------|
| `/scholen/$slug/migratie` | `src/router/routes.ts` line 107-114 (`migratieRoute`) | **DELETE** + remove uit `routeTree.addChildren()` (line 197) + remove uit `SCHOOL_TAB_ROUTES` (line 174). |
| `/scholen/$slug/huidig-vs-cito` | `src/router/routes.ts` line 97-104 (`huidigVsCitoRoute`) | **DELETE** + idem. |

### 3. Files referencing `MigrationPage` / `CurrentVsProposedPage` / `MigrationWizard`

| File | Treatment |
|------|-----------|
| `src/router/routes.ts` | Delete imports + routes (al bovengenoemd). |
| `src/components/routing/RootLayout.tsx` (line 6) | **DO NOT TOUCH** — `CloudMigrationWizard` is v1→v2 Dexie→Supabase, niet scenario B. |
| `src/features/school-overview/SchoolOverviewPage.tsx` (line 17) | **DO NOT TOUCH** — gebruikt `MigrationWizard` voor v1-data-detect (`detectV1Data()`). Apart concept. **WAARSCHUWING:** SPEC D-08 zegt "verwijderen `src/features/migration/MigrationWizard.tsx`" maar deze is óók v1→v2. **PLANNER MOET VERIFIËREN:** is `MigrationWizard.tsx` de scenario-B wizard of de v1→v2 wizard? Bij `Read` lijkt het op de scenario-B wizard. **Check expliciet bij plan-fase.** Mogelijk moet alleen `MigrationPage` weg en niet de Wizard. |
| `src/features/school-profile/tabs/ComparisonTab.tsx` | **REFACTOR** — verwijder MigrationPage + CurrentVsProposedPage imports en render-paths. ViewSwitcher (B↔C) verwijderen. |
| `src/features/migration/MigrationWizard.tsx` | **DELETE** (D-08) — alleen als geverifieerd dat dit niet de v1→v2 wizard is. |
| `src/features/migration/CloudMigrationWizard.tsx` | **KEEP** — v1→v2 Supabase migration. |
| `src/features/price-comparison/MigrationPage.tsx` | **DELETE** (D-08). |
| `src/features/price-comparison/CurrentVsProposedPage.tsx` | **DELETE** (D-08). |

### 4. Files referencing `cito-migration-prices` (7 files)

| File | Treatment |
|------|-----------|
| `src/data/cito-migration-prices.ts` | **DELETE FILE** (D-08). **LOCKED file — requires explicit user OK** (CONTEXT.md says expliciet). |
| `src/engine/migration.ts` | **DELETE FILE** (D-08). |
| `src/engine/price-comparison.ts` lines 12, 141-159 | **REMOVE** import `getOldPlatformPrice` + de hele `if (options.scenarioType === 'C')` block. |
| `src/features/export/ExportTab.tsx` lines 9-10, 67-79 | **REMOVE** import + `calculateMigration()` call + `migration` from ReportData. |
| `src/features/export/types.ts` lines 2, 19 | **REMOVE** `MigrationResult` import + `migration` field. |
| `src/features/price-comparison/MigrationPage.tsx` | DELETED (above). |
| `src/features/price-comparison/MeerwaardePanel.tsx` | **CHECK** — gebruikt mogelijk migration data. Refactor of remove. |
| `src/features/export/pdf/components/ValueReportSection.tsx` | **REFACTOR** — verwijder migration-mode varianten; behoud time-savings als gegeneraliseerd component (R8 D-19 TimeInputSection parallel). |
| `src/engine/__tests__/migration.test.ts` | **DELETE FILE**. |
| `src/engine/__tests__/scenario-detection.test.ts` line 1 | **UPDATE**. |

### 5. `default-prices.ts` impact — KRITIEKE CLARIFICATIE

**SPEC.md zegt:** "cito-oud provider verwijderd uit `default-prices.ts` (LOCKED file — vereist expliciete goedkeuring)."

**Realiteit (geverifieerd via file read):** `src/data/default-prices.ts` (19 LOC totaal) bevat **ALLEEN re-exports** van `src/data/providers/{cito,dia,jij,saqi}.ts`. Er staat **GEEN** `cito-oud` entry in `default-prices.ts` of in `providers/cito.ts`. **`cito-oud` is een `CurrentProvider`-waarde (in `models/school.ts`), GEEN provider in `PROVIDER_CONFIGS`.** De `ProviderKey` union is `'cito' | 'dia' | 'jij' | 'saqi'` (zie `src/engine/price-comparison.ts:14`).

**Wat WEL geraakt wordt:**
- `src/data/cito-migration-prices.ts` (LOCKED) — bevat de `oldPricePerStudent` data die `Scenario C` voedde. Volledige file weg. **User OK vereist.**
- `src/data/default-prices.ts` (LOCKED) — **GEEN code-wijziging nodig**. De cleanup raakt deze file niet. Planner hoeft hier geen user OK te vragen.

**Implicatie voor planner:** D-06 user-OK-step is alleen voor `cito-migration-prices.ts`, niet voor `default-prices.ts`. Dit scheelt één blocking interaction.

### 6. Scenario type herziening (R10)

Huidig:
```typescript
// src/models/school.ts:41
export type Scenario = 'A' | 'B' | 'C';
```

Nieuw (target):
```typescript
export type Scenario = 'basis' | 'plus' | 'upsell';
// OF — backward-compat met letters voor minder grep-damage:
// export type Scenario = 'A' | 'B' | 'C';  // A=basis, B=plus, C=upsell — minder readable
```

**Recommendation:** Volledige rename naar `'basis' | 'plus' | 'upsell'`. Single-shot mass-replace is overzichtelijker en zelfdocumenterend. Files die scenario-letters bevatten: `WizardShell.tsx:72-85`, `ScenarioPreview.tsx:66`, `engine/price-comparison.ts:141` (scenarioType === 'C'), `ComparisonTable.tsx:81,128`, `ComparisonTab.tsx`. Allemaal in scope van plans.

**Supabase column impact:** `schools.scenario` is `TEXT` (geen check-constraint). Migratie 014 doet:
```sql
UPDATE schools SET scenario = 'basis' WHERE scenario = 'A';
UPDATE schools SET scenario = 'plus' WHERE scenario IN ('B','C');  -- B/C waren beide oud-Cito-gerelateerd
-- of: UPDATE schools SET scenario = NULL WHERE scenario IN ('B','C');
```
Planner kiest: behouden+remap of NULL+force re-pick. **Recommendation:** NULL — demo-data, user picked B/C in oude flow; nieuwe flow heeft andere semantiek.

## Common Pitfalls

### Pitfall 1: TimeSavingsSection type-cascade na migration.ts delete

**What goes wrong:** `TimeSavingsSection.tsx` line 2 imports `TimeSavingResult` from `@/engine/migration`. Na delete: compile-error in 1 file maar consumeert ook `TIME_SAVING_TASKS` from `@/models/migration`.

**Why it happens:** Types waren historisch in migration-context, nu generiek nodig (D-19 mode-prop).

**How to avoid:** Verplaats types eerst:
1. Maak `src/models/time-savings.ts` (nieuw): kopieer `TimeSavingTask` + `TIME_SAVING_TASKS` uit `src/models/migration.ts`.
2. Maak `TimeSavingResult` type lokaal in `TimeInputSection.tsx` (was alleen `migration.ts` engine output).
3. Pas alle importers aan **voordat** `models/migration.ts` + `engine/migration.ts` weg gaan.

**Warning signs:** Build error "Cannot find module '@/engine/migration'" tijdens R10 plan.

### Pitfall 2: ProgressBar labels-drift

**What goes wrong:** `STEP_LABELS = ['School', 'Leerlingen', 'Modules', 'Situatie', 'Doel']` in `src/components/wizard/ProgressBar.tsx:7`. Phase 27 voegt geen step toe maar wel veel inhoud aan Stap 1 ("School" wordt nu "Schoolgegevens + klant-type + groei").

**Why it happens:** ProgressBar labels zijn frozen string array. Hernoeming raakt ARIA-labels.

**How to avoid:** Beslis bewust: labels onveranderd laten (Phase 27 D-21 zegt geen extra stap — labels mogen blijven), of update naar bijv. `['Profiel', 'Leerlingen', 'Modules', 'Situatie', 'Doel']`. Planner moet expliciet kiezen + bijhorende a11y-test updaten.

### Pitfall 3: Naamcollisie `calculateUpsell`

**What goes wrong:** `src/engine/upsell.ts` line 53 heeft al `calculateUpsell(moduleSetups, comparisonResult)` (Phase 11 — competitor→Cito kansen). R10 wil ook een Upsell-engine voor Basis→Plus. Identieke naam = import-conflict.

**Why it happens:** Beide concepten heten in business-taal "upsell" maar zijn technisch verschillend.

**How to avoid:** Nieuwe functie heet `calculateBasisPlusUpsell(school, basisBundle, plusBundle)` en woont in `src/engine/price-comparison.ts` (zoals SPEC R10 zegt). Bestaande `calculateUpsell` (in `upsell.ts`) blijft onveranderd — die voedt Dashboard UpsellBadges + SchoolCard upsell-count.

**Warning signs:** TS-error "Duplicate identifier" of "Cannot redeclare exported function".

### Pitfall 4: AI-prompt drift over context-window

**What goes wrong:** `api/ai-match-pijnpunt.ts` prompt bevat alle MODULE_DIFFERENTIATORS + alle selectedModules + customerType + 1000-char remarks. Bij 10 modules × 4 differentiators per provider × 50 chars = ~2000 tokens system + 1000 chars user = nog binnen Haiku 4.5 200K window.

**Why it happens:** Niet echt — Claude Haiku 4.5 200K context.

**How to avoid:** Filter differentiators op `selectedModules` voordat prompt geconstrueerd wordt (consistent met `ai-wizard-advice.ts` pattern).

**Warning signs:** Token-rate-limit errors of 4xx van Anthropic.

### Pitfall 5: Stichting smart-suggestion match-storm bij 50+ scholen

**What goes wrong:** Voor elke nieuwe Stichting draaien we Levenshtein over alle bestaande schools. Bij 50 scholen × 50 chars per naam = O(N×M^2) = ~125K operaties. Acceptable.

**Maar:** Triggered on every keystroke in stichting-naam-input zou onnodig zwaar zijn.

**How to avoid:** Run smart-suggestion alleen bij submit van het stichting-create-dialog, of debounce input 300ms (consistent met `SchoolSearchBar` pattern als die bestaat).

**Warning signs:** UI lag bij creëren stichting met veel scholen geladen.

### Pitfall 6: TanStack Router test wrapper na route-changes

**What goes wrong:** STATE.md Phase 22 logged: "TanStack Router test wrapper: components using Link must be rendered inside createRootRoute.component". Verwijderen van routes (`/migratie`, `/huidig-vs-cito`) en toevoegen (`/stichtingen`) raakt test-wrappers die hard-coded route IDs gebruiken.

**How to avoid:** Check alle `__tests__/` files voor `createMemoryHistory()` met paths `/migratie` of `/huidig-vs-cito` — moeten weg/herzien.

**Warning signs:** Test-failures "Route not found".

## Code Examples

### Example 1: Composing Zod schemas (D-18)

```typescript
// Source: existing pattern is .extend()/.merge() per Zod v4; verify in repo
// src/features/school-profile/schemas/school-meta.schema.ts (NEW)

import { z } from 'zod';

export const customerTypeSchema = z.enum(['huidige-cito', 'nieuwe-prospect', 'gedeeltelijk']);
export const schoolTypeEnum = z.enum(['regulier', 'dakpanklas', 'dalton', 'montessori', 'vrije-school', 'overig']);
export const growthTrajectorySchema = z.enum(['groei', 'krimp', 'stabiel', 'loting']);

export const schoolMetaSchema = z.object({
  customerType: customerTypeSchema,
  schoolType: schoolTypeEnum,
  customSchoolType: z.string().max(50).optional(),
  growthTrajectory: growthTrajectorySchema,
}).refine(
  (data) => data.schoolType !== 'overig' || (data.customSchoolType && data.customSchoolType.length > 0),
  { message: 'Vul de naam van het schooltype in', path: ['customSchoolType'] },
);

// src/features/school-profile/schemas/step1-schema.ts (EXTEND existing)
import { schoolMetaSchema } from './school-meta.schema';

export const schoolTypeSchema = z.object({
  schoolName: z.string().min(2).max(100),
  levels: z.array(z.enum(SCHOOL_LEVELS)).min(1),
}).merge(schoolMetaSchema);
```

### Example 2: Stichting smart-suggestion match (D-03)

```typescript
// src/lib/stichtingMatcher.ts (NEW)
// Pure function. Tested via vitest.

import { similarity } from './stringSimilarity';  // own impl (Levenshtein)
import type { SchoolRecord } from '@/db/types';
import type { StichtingRecord } from '@/models/stichting';

export interface MatchSuggestion {
  schoolId: string;
  schoolName: string;
  score: number;       // 0-1
  preChecked: boolean; // true if score > 0.8
  reasons: string[];   // ["regio-match", "naam-similarity 0.72"]
}

const REGIO_WEIGHT = 0.35;
const NAAM_WEIGHT = 0.65;

export function suggestSchoolsForStichting(
  stichting: Pick<StichtingRecord, 'name' | 'region'>,
  schools: SchoolRecord[],
): MatchSuggestion[] {
  return schools
    .filter((s) => s.stichtingId === null)  // alleen ongekoppelde scholen
    .map((s) => {
      const reasons: string[] = [];
      let score = 0;

      // Naam-similarity (Levenshtein)
      const nameSim = similarity(
        stichting.name.toLowerCase().trim(),
        s.name.toLowerCase().trim(),
      );
      score += nameSim * NAAM_WEIGHT;
      if (nameSim > 0.6) reasons.push(`naam-similarity ${nameSim.toFixed(2)}`);

      // Regio-match
      if (stichting.region && s.region && stichting.region.toLowerCase() === s.region.toLowerCase()) {
        score += REGIO_WEIGHT;
        reasons.push('regio-match');
      }

      return {
        schoolId: s.id,
        schoolName: s.name,
        score,
        preChecked: score > 0.8,
        reasons,
      };
    })
    .filter((m) => m.score >= 0.6)
    .sort((a, b) => b.score - a.score);
}
```

### Example 3: AI parallel + rule-based pattern (D-11, R9)

```typescript
// src/features/school-profile/components/PainPointPanel.tsx (NEW, simplified)
// Pattern: rule-based eerst (instant) + AI parallel (kan vervangen)

import { useState } from 'react';
import { extractPainPointsRuleBased } from '@/lib/painPointKeywordMap';
import { matchPijnpuntAi } from '@/lib/ai-match-pijnpunt';

interface Match { moduleId: string; advantage: string; confidence?: number; source: 'rule' | 'ai'; }

export function PainPointPanel({ remarks, selectedModules, onMatch }: { remarks: string; selectedModules: string[]; onMatch: (matches: Match[]) => void }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);

  const handleTrigger = async () => {
    // Stap 1: rule-based instant (D-11 "parallel beide + AI-prioriteit")
    const ruleMatches: Match[] = extractPainPointsRuleBased(remarks, selectedModules).map((m) => ({ ...m, source: 'rule' as const }));
    setMatches(ruleMatches);

    // Stap 2: AI parallel met timeout
    setAiLoading(true);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const aiResult = await matchPijnpuntAi({ remarks, selectedModules }, ctrl.signal);
      clearTimeout(timer);
      const aiMatches: Match[] = aiResult.matches.map((m) => ({ ...m, source: 'ai' as const }));
      setMatches(aiMatches);  // AI vervangt rule-based per D-11
      setAiAvailable(true);
    } catch {
      setAiAvailable(false);  // rule-based blijft zichtbaar met badge
    } finally {
      setAiLoading(false);
    }
    onMatch(matches);
  };

  return (
    <div>
      <button type="button" onClick={handleTrigger}>Vind Cito-voordelen</button>
      {/* render matches + thumb-up/down */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scenario A/B/C met cito-oud baseline | Basis/Plus/Upsell met nieuw Cito platform als baseline | Phase 27 (volgende schooljaar) | `cito-oud` provider verdwijnt uit alle code. Engine current-vs-proposed + migration verdwijnen. |
| Per-school PDF-export (Phase 12) | Per-school + per-Stichting aggregatie | Phase 27 R2 | DMU-PDF templates blijven gelijk; nieuwe wrapper loopt over schools. |
| 10 modules in 2 categorieën | 12 modules in herstructured 2 categorieën (Basisvaardigheden + Extra) | Phase 27 R6+R7 | SLO kerndoelen 2025-2026 implementatie. |
| Single-school architecture | Stichting groepering | Phase 27 R1 | Nieuwe entity-layer; bestaande school-flow ongewijzigd. |
| Geen pijnpunt-capture | AI + rule-based matching naar Cito-voordelen | Phase 27 R8+R9 | Nieuwe AI-pipeline endpoint. |

**Deprecated/outdated (in scope om weg te halen):**
- `src/engine/migration.ts` — vervangen door uitgebreide `price-comparison.ts`.
- `src/engine/current-vs-proposed.ts` — niet meer relevant (cito-oud weg).
- `src/data/cito-migration-prices.ts` — niet meer relevant.
- `src/features/price-comparison/MigrationPage.tsx` + `CurrentVsProposedPage.tsx`.
- Routes `/scholen/$slug/migratie` + `/scholen/$slug/huidig-vs-cito`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `MigrationWizard.tsx` (in `src/features/migration/`) is de **scenario-B** wizard (verwijderbaar) en niet de v1→v2 Dexie-migration wizard. | Cito-oud Cleanup Audit § 3 | Als A1 false: `MigrationWizard.tsx` mag NIET verwijderd worden (zou v1-data-migratie breken). Planner moet `Read` doen op deze file vóór delete. |
| A2 | SLO kerndoelen 2025-2026 voor Burgerschap + Digitale geletterdheid zijn van toepassing op **alle** VO-niveaus (vmbo-b/k/gt + havo + vwo). | R6 in Phase Requirements table | Bron is SPEC.md + CONTEXT.md "Web-research" — niet geverifieerd door researcher tegen SLO-website. Als A2 false (bijv. alleen havo/vwo): Cito-module provider-availability moet level-gefilterd worden, complex. **Aanbeveling:** Planner verifieert tijdens execute door SLO docs te checken (cited via canonical_refs in CONTEXT.md). |
| A3 | `team_settings` tabel (D-12) bestaat nog niet. | Standard Stack § alternatives | Verified — `supabase/migrations/` heeft `teams` + `users` tabellen maar geen `team_settings`. Lage risk. |
| A4 | Phase 26 is afgerond (StartschermPage live op `/`) op het moment dat Phase 27 begint. | Known Conflicts | Verified: `src/features/startscherm/StartschermPage.tsx` bestaat met twee cards, branch `fix/strip-vite-prefix-anthropic-key` (huidige werkbranch) heeft StartschermPage. Phase 26 lijkt geshipped of bijna-klaar. |
| A5 | Stichting kan NULL `region` hebben (string default `''`). Smart-suggestion handelt ontbrekende regio gracefully. | Code Example § stichtingMatcher | Recommendation impl handelt dit al via `if (stichting.region && s.region && ...)`. Risk: laag. |
| A6 | `cito-nieuw` als CurrentProvider blijft bestaan na cleanup. | Cito-oud Cleanup Audit | Verified: `cito-nieuw` heeft 30 hits across 16 files maar SPEC zegt alleen `cito-oud` weg. Cito-nieuw = "Cito (nieuw platform)" representeert klanten op nieuw Cito-platform. Blijft logische optie in WizardStep4 dropdown. |
| A7 | Burgerschap + Digitale geletterdheid initieel `availableFrom: ['cito']` (D-15 "schijnvoordeel" pattern). | R6 | SPEC zegt `cito: true, dia: false, jij: false`. Verified mapping. |

## Open Questions

1. **Welke labels in `STEP_LABELS` (ProgressBar) na Phase 27?**
   - What we know: TOTAL_STEPS = 5 blijft (D-21). Inhoud verandert significant in Stap 1, 3, 4, 5.
   - What's unclear: Mogen labels hernoemd worden ("School" → "Schoolgegevens")?
   - Recommendation: Vraag user tijdens plan-fase. **Conservatieve default: labels onveranderd.** Acceptance criteria R3-R8 noemen geen label-changes.

2. **`MigrationWizard.tsx` — scenario-B of v1→v2?**
   - Zie A1. Planner moet `Read` doen op deze file om risk weg te nemen.
   - Recommendation: Tijdens plan voor R10 cleanup, eerste task = "verify MigrationWizard.tsx scope" voordat delete.

3. **Scenario column data-cleanup strategy.**
   - Recommendation: NULL-zetten van B/C; demo-data heeft geen production-impact.
   - Risk: Als productie schools met scenario='B' bestaan: nieuwe semantiek breekt routing in ComparisonTab. Planner verifieert via SQL count.

4. **TimeInputSection mode='competitor-time' default taken — 5 of 6?**
   - Claude's discretion. Recommendation: hergebruik dezelfde 5 standaard taken (rechten/resetten/inloggen/planning/koppeling) + optioneel "rapporten-lezen" als 6e.

5. **AI-prompt prompt-override mechanism — runtime merge of template-substitution?**
   - Claude's discretion (D-12). Recommendation: server-side template-string-replacement (`SYSTEM_PROMPT.replace('{{focus}}', userOverride)`), niet runtime merge.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js runtime | Build + Vercel functions | ✓ | (Vite 8 = Node 20+) | — |
| `npm` | Install + build | ✓ | (project uses npm, not pnpm — AGENTS.md override) | — |
| Supabase CLI (`supabase`) | Apply migrations 014+ | Assumed ✓ (Phase 8 used it) | — | Migrations runnen via dashboard SQL editor als CLI niet beschikbaar. |
| `vercel` CLI | `vercel dev` voor local API-testing | Assumed ✓ | — | `npm run dev` voor frontend; API testen via deployed Vercel preview. |
| Anthropic API access | AI pijnpunt-matching (R9) | ✓ (key in Vercel env vars) | `claude-haiku-4-5` | Rule-based fallback (D-11) — feature werkt zonder AI. |
| Playwright browsers | e2e tests | ✓ (`@playwright/test` in package.json) | `^1.58.2` | — |

**Missing dependencies with no fallback:** Geen.

**Missing dependencies with fallback:** Geen kritiek. AI is graceful-degradable per D-11.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4 + Playwright e2e (`@playwright/test ^1.58.2`) |
| Config file | `vitest.config.ts` (root) + `playwright.config.ts` (root) |
| Quick run command | `npx vitest run` (alle tests) |
| Full suite command | `npm run build && npx vitest run && npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R1 | Stichting CRUD via Dexie + Supabase | unit + integration | `npx vitest run src/db/__tests__/stichting-operations.test.ts` | ❌ Wave 0 |
| R1 | Stichting CRUD UI flow | e2e | `npx playwright test e2e/stichting-crud.spec.ts` | ❌ Wave 0 |
| R2 | CSV-export valide | unit | `npx vitest run src/features/stichtingen/__tests__/csv-export.test.ts` | ❌ Wave 0 |
| R2 | PDF-aggregatie rendert | unit | `npx vitest run src/features/stichtingen/__tests__/pdf-aggregation.test.ts` | ❌ Wave 0 |
| R3 | customerType persisteert | unit | `npx vitest run src/features/school-profile/components/__tests__/WizardStep1.test.tsx` | ✓ (extend) |
| R4 | schoolType + growthTrajectory persist | unit | idem WizardStep1 | ✓ (extend) |
| R5 | currentToolUsage per niveau | unit | `npx vitest run src/features/school-profile/components/__tests__/WizardStep2.test.tsx` | Assumed ✓ |
| R6 | Burgerschap + Digi-gel in catalogus | unit | `npx vitest run src/data/__tests__/module-catalog.test.ts` | ❌ Wave 0 (toggle uitbreiding bestaande) |
| R7 | WizardStep3 categorie-render | snapshot | `npx vitest run src/features/school-profile/components/__tests__/WizardStep3.test.tsx` | Assumed ✓ |
| R8 | WizardStep4 summary + opmerkingen + tijd | unit | `npx vitest run src/features/school-profile/components/__tests__/WizardStep4.test.tsx` | ✓ (rewrite) |
| R9 | Rule-based keyword-lookup | unit | `npx vitest run src/lib/__tests__/painPointKeywordMap.test.ts` | ❌ Wave 0 |
| R9 | AI matching met mock | integration | `npx vitest run src/lib/__tests__/ai-match-pijnpunt.test.ts` | ❌ Wave 0 |
| R10 | calculateBasisPlusUpsell snapshot | unit | `npx vitest run src/engine/__tests__/price-comparison-upsell.test.ts` | ❌ Wave 0 |
| R10 | `git grep cito-oud src/` = 0 hits | smoke | bash check in CI/pre-merge | manual |
| R11 | Dexie migration v3 idempotent | unit | `npx vitest run src/db/__tests__/migration-v3.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --changed`
- **Per wave merge:** `npm run build && npx vitest run`
- **Phase gate:** Full suite green + `npx playwright test` + `git grep -i cito-oud src/` returns 0 + manual UAT per acceptance criteria.

### Wave 0 Gaps
- [ ] `src/db/__tests__/stichting-operations.test.ts` — covers R1 CRUD
- [ ] `src/db/__tests__/migration-v3.test.ts` — covers R11 Dexie migration
- [ ] `src/features/stichtingen/__tests__/csv-export.test.ts` — covers R2
- [ ] `src/features/stichtingen/__tests__/pdf-aggregation.test.ts` — covers R2
- [ ] `src/lib/__tests__/painPointKeywordMap.test.ts` — covers R9 rule-based
- [ ] `src/lib/__tests__/ai-match-pijnpunt.test.ts` — covers R9 AI (mocked)
- [ ] `src/lib/__tests__/stichtingMatcher.test.ts` — covers D-03 smart-suggestion
- [ ] `src/engine/__tests__/price-comparison-upsell.test.ts` — covers R10 new function
- [ ] `e2e/stichting-crud.spec.ts` — covers R1 e2e
- [ ] `e2e/wizard-phase-27.spec.ts` — covers R3-R10 happy path (end-to-end nieuwe wizard flow)

## Security Domain

`security_enforcement` niet expliciet `false` in `.planning/config.json` (config.json niet gecontroleerd in deze researcher-pass; assume enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (bestaand) — alle nieuwe endpoints `Bearer` JWT-verificatie. |
| V3 Session Management | no (inherited) | Supabase manages session cookies; geen Phase 27 changes. |
| V4 Access Control | yes | RLS policies op `stichtingen` tabel + nieuwe `schools` kolommen. Team-scoped via `get_user_team_id()` (bestaand helper). |
| V5 Input Validation | yes | Zod schemas op alle nieuwe form fields + AI response. Max-length op opmerkingen (1000 chars per R8). |
| V6 Cryptography | no | Geen nieuwe crypto. Supabase TLS + JWT handled platform-side. |

### Known Threat Patterns for stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-team data leak via Stichting RLS | Information Disclosure | RLS policy `team_id = get_user_team_id()` op alle SELECT/INSERT/UPDATE/DELETE. Pattern uit `008_planned_touchpoints.sql` direct kopieerbaar. |
| Pain-point remarks XSS-payload doorgegeven aan PDF | Tampering | `@react-pdf/renderer` rendered Text als plain string (geen HTML interpretation). Safe by default. |
| AI prompt injection via remarks (1000 chars) | Tampering | System prompt eindigt met "Antwoord UITSLUITEND in JSON-formaat". Frontend valideert via `schema.parse()`. Worst case: response faalt parsing, rule-based blijft zichtbaar. |
| Levenshtein DoS bij superlange school-namen | DoS | Truncate namen op 100 chars (bestaande schema-constraint) — Levenshtein O(N×M) op N≤100, M≤100 = ≤10K ops. Geen DoS-risk. |
| Stichting-naam in URL `/stichtingen/$id` exposes UUIDs | Information Disclosure | UUIDs zijn niet predictable. Combineren met RLS = safe. Identiek `/scholen/$slug` pattern. |
| Bulk-koppel race-condition (twee accountmanagers koppelen same school) | Tampering | Supabase laatste-schrijver-wint via `updated_at`. Voor MVP acceptable; D-04 cascade-protection scoort hoger. |

## Sources

### Primary (HIGH confidence)
- `apps/concurrentoolVO/.planning/phases/27-*/27-SPEC.md` — 11 locked requirements
- `apps/concurrentoolVO/.planning/phases/27-*/27-CONTEXT.md` — 21 locked decisions
- `apps/concurrentoolVO/AGENTS.md` — hard rules (LOCKED files, providers, pure engines, Zustand pattern)
- `apps/concurrentoolVO/CLAUDE.md` — architecture overview
- `apps/concurrentoolVO/.planning/STATE.md` — accumulated decisions Phase 6-25
- `apps/concurrentoolVO/.planning/REQUIREMENTS.md` — v2.0 requirements
- Codebase files read in researcher pass (40+ files including all 5 WizardSteps, store, schemas, engines, providers, models, db layer, AI handlers, router, supabase migrations 001/008/009/010/012/013, Phase 25 + 26 plans).

### Secondary (MEDIUM confidence)
- `apps/concurrentoolVO/package.json` — verified versions of installed deps
- Phase 26 `26-SPEC.md` lines 1-60 — voor startscherm-coordinatie check

### Tertiary (LOW confidence — needs validation in plan-fase)
- SLO kerndoelen 2025-2026 Burgerschap + Digi-geletterdheid — gebaseerd op CONTEXT.md cited URLs, niet zelf verified door researcher. Planner moet bevestigen tijdens execute via slo.nl.
- Phase 25 plan-state — `STATE.md` zegt EXECUTING op plan 6/12 maar 11 plans bestaan op disk (25-01..25-12) en allemaal hebben SUMMARY.md → mogelijk eigenlijk klaar. **Planner moet 25-status verifiëren** voordat Phase 27 begint.

## Project Constraints (from CLAUDE.md / AGENTS.md)

Deze directives uit `apps/concurrentoolVO/CLAUDE.md` en `AGENTS.md` zijn niet-onderhandelbaar voor Phase 27:

1. **LOCKED files** (vereist user-OK voor edits):
   - `src/data/default-prices.ts` — **GEEN edit nodig in Phase 27** (zie kritieke clarificatie sectie).
   - `src/data/cito-migration-prices.ts` — **WEL delete in Phase 27 R10**. Executor moet expliciet OK vragen.
2. **Alle UI-tekst Nederlands**, alle code (variabelen, comments, file names) Engels.
3. **`TOTAL_STEPS = 5`** — Stichting is GEEN extra wizard-stap (D-21).
4. **3 hardcoded providers** (`cito`, `dia`, `jij`, `saqi`) blijven. Geen 4e provider in scope.
5. **Pure-function engines** (`src/engine/*`) blijven puur. `calculateBasisPlusUpsell()` volgt zelfde pattern.
6. **Zustand `getState()` cross-store reads** — geen hooks-refactor.
7. **react-hook-form + zodResolver** verplicht voor alle wizard-forms.
8. **AI calls server-side** via Vercel Functions, `ANTHROPIC_API_KEY` zonder `VITE_`-prefix (al gefixt in huidige branch `fix/strip-vite-prefix-anthropic-key`).
9. **TanStack Router** voor routes — register in `src/router/routes.ts`.
10. **Zod schemas** in `src/features/*/schemas/`, composition via `.merge()`/`.extend()`.
11. **Dexie migration idempotent**.
12. **Single-branch workflow** (ADR-0007) — feature branch `feature/phase-27-stichting-wizard-refactor` squash-merge naar main, manual pre-merge tests (`npm run build` + `npx vitest run`), Vercel auto-deploys main → production.

## Coordination Risks (Phase 25 + 26 parallel)

| Phase | Status (per STATE.md) | Overlap met Phase 27 | Mitigation |
|-------|-----------------------|----------------------|------------|
| Phase 25 (prijsintelligentie) | EXECUTING plan 6/12 — maar **12 SUMMARY.md files op disk suggereren ALL plans klaar**. Planner moet status verifiëren. | (a) `usePricingDataStore` (Zustand) gebruikt door Phase 27 R10 voor differentiators-lookup. (b) `MODULE_DIFFERENTIATORS` may have moved to Supabase per Phase 25 D-01 — check `src/data/differentiators.ts` vs Supabase `differentiators` tabel. | Researcher heeft `differentiators.ts` op disk gelezen (113 LOC, gewoon TS-array). Phase 25 D-01 "database-first met TS-fallback" — TS-bestand blijft als fallback. **Phase 27 mag `MODULE_DIFFERENTIATORS` from `src/data/differentiators.ts` blijven importeren.** |
| Phase 26 (cito prijzen editor + startscherm) | 5 plans op disk, plan 01 heeft SUMMARY. Branch `feature/phase-26-prijs-editor` parallel volgens user. | (a) `StartschermPage` heeft 2 cards (Phase 26 shipped of bijna-klaar). Phase 27 R1 Stichting heeft **eigen `/stichtingen` route** — niet derde card op startscherm (D-02 zegt card-grid is op `/stichtingen`, niet op `/`). Geen merge-conflict. (b) `src/router/routes.ts` lines 31-39 (`indexRoute` + Phase 26 `prijzenRoute`) — Phase 27 voegt routes toe na deze lines: zero overlap. (c) `src/App.tsx` is 7 LOC `RouterProvider` — geen conflict. | Researcher heeft beide routes-files gelezen. **Phase 27 routes-edit (add stichtingen, remove migratie+huidig-vs-cito) raakt routes.ts lines 97-114 + 173-179 + 197-198** — distinct van Phase 26 changes (lines 31-56). **Merge-strategie:** Phase 27 base op latest main (na Phase 26 merge). |

**Recommendation:** Eerste task in Phase 27 plan-fase is "Verify Phase 25 + 26 status — list completed plans, list outstanding work, list any Phase 27 files already touched by uncommitted Phase 25/26 work."

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via package.json read.
- Architecture: HIGH — all patterns traced to existing code via Read tool.
- Pitfalls: HIGH — pitfalls 1-3 are direct compile-impact predictions based on actual imports; pitfalls 4-6 are architectural risk inferences.
- Cito-oud cleanup audit: HIGH — 23 files × 62 hits enumerated via grep. Cross-checked tegen 8 files met Migration/CurrentVsProposed references.
- LOCKED files clarification: HIGH — `default-prices.ts` file contents read; only 19 LOC of re-exports, geen `cito-oud` entry.
- Phase 26 coordination: HIGH — routes.ts read end-to-end, StartschermPage.tsx read in full, geen overlap met Phase 27 route-additions/removals.
- Phase 25 coordination: MEDIUM — STATE.md zegt EXECUTING maar disk heeft 12 SUMMARYs; planner moet finaliseren.
- SLO kerndoelen toepasbaarheid alle niveaus: MEDIUM — CONTEXT.md cites SLO research, researcher heeft niet verified.

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (30 days — stack is stable; recheck if Phase 25 of 26 status verandert).

## RESEARCH COMPLETE

**Phase:** 27 - Wizard-optimalisatie bestaande klant vs nieuwe klant + Stichting-laag
**Confidence:** HIGH

### Key Findings

1. **`cito-oud` is een CurrentProvider, GEEN provider in `PROVIDER_CONFIGS`** — daarom raakt R10 cleanup `src/models/school.ts` + 22 andere files, maar NIET `src/data/default-prices.ts`. LOCKED-file user-OK is alleen nodig voor `src/data/cito-migration-prices.ts` delete (D-08). Dit scheelt één blocking user-interaction in execute-fase.
2. **Bestaande `calculateUpsell()` in `src/engine/upsell.ts` (Phase 11) heeft naamcollisie met R10's nieuwe Upsell-engine** — gebruik `calculateBasisPlusUpsell()` als naam. Bestaande functie blijft (voedt SchoolCard badges).
3. **`xlsx` library is al installed en heeft `sheet_to_csv()` — geen `papaparse` nodig voor R2.** Levenshtein inline (~50 LOC) past beter dan `string-similarity` npm pkg (Phase 22 deps-policy).
4. **`MigrationWizard.tsx` in `src/features/migration/` heeft naam-collisie risk** met v1→v2 `CloudMigrationWizard.tsx`. Planner moet eerst `Read` doen vóór delete bevestigen (zie Assumption A1).
5. **Phase 26 (`/`) en Phase 27 (`/stichtingen`) routes hebben zero overlap** — Phase 27 add/remove sits op lines 97-114 + 173-179 + 197-198 van `routes.ts`; Phase 26 zit op lines 31-56. Merge na Phase 26 main is veilig.
6. **TimeSavingsSection refactor naar TimeInputSection (D-19) heeft type-cascade** door cleanup R10: `TimeSavingResult`/`TimeSavingTask` zitten in `engine/migration.ts` + `models/migration.ts`. Verplaats types eerst naar nieuw `src/models/time-savings.ts` voordat migration weg gaat.
7. **AI matching kan `messages.parse()` met Zod schema** (Anthropic SDK 0.92.0) of `messages.create()` + frontend Zod parse — bestaand `ai-intake.ts` patroon gebruikt streaming + JSON-string-parse; voor non-streaming match-flow is simpler `messages.create()` + Zod genoeg.

### File Created
`apps/concurrentoolVO/.planning/phases/27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti/27-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All packages verified against package.json on disk; geen onbekende deps. |
| Architecture | HIGH | All patterns traced to specific files + line numbers via Read tool. |
| Pitfalls | HIGH | Compile-impact predictions based on actual import chains. |
| Cito-oud cleanup | HIGH | Complete grep audit (23 files, 62 hits) enumerated + classified. |
| LOCKED files | HIGH | Both LOCKED files read; clarification on default-prices.ts impact. |
| Coordination Phase 25/26 | MEDIUM | Phase 25 status ambiguous (STATE.md vs disk); Phase 26 routes verified non-overlapping. |
| SLO kerndoelen | LOW-MEDIUM | Researcher did not directly verify slo.nl content; relies on CONTEXT.md citations. |

### Open Questions

1. ProgressBar `STEP_LABELS` — hernamen of behouden? Conservatieve default: behouden.
2. `MigrationWizard.tsx` — scenario-B of v1→v2 wizard? Planner verifieert vóór delete.
3. Supabase `schools.scenario` data-cleanup — NULL of remap B/C? Recommendation: NULL.
4. Phase 25 finaliseringsstatus — alle 12 plans done of plan 6 actief?
5. SLO kerndoelen niveau-toepasbaarheid — Burgerschap + Digi-gel echt alle niveaus?

### Ready for Planning

Research compleet. Planner kan PLAN.md files genereren — verwacht 11-13 plans (1 per requirement + cleanup + test/UAT). Aanbevolen volgorde:
- Wave 0: test infra (10 nieuwe test-files) + Dexie/Supabase migration scaffold + type-relocation (TimeSavingTask).
- Wave 1: R1 (Stichting CRUD) + R3 (klant-type) + R4 (schoolsoort+groei) — onafhankelijk.
- Wave 2: R5 + R6 + R7 + R11 (afhankelijk van Wave 1 Stichting bestaan voor R11).
- Wave 3: R8 + R9 (afhankelijk van Wave 1 voor klant-type-driven scenarios).
- Wave 4: R10 cleanup + scenario-rename (LAATST om compile-cascades te isoleren).
- Wave 5: R2 (Stichting export — afhankelijk van Wave 1 + R10 cleanup voor schoon ReportData type).
- Wave 6: E2E + UAT + handmatige Cito-oud grep-check.
