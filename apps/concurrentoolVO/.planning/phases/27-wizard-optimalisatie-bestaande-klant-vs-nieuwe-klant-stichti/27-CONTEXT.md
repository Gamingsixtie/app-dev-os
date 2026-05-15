# Phase 27: Wizard-optimalisatie bestaande klant vs nieuwe klant + Stichting-laag — Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Sales-driven uitbreiding van de Cito-intern-instrument app: Stichting-laag (bestuur groepeert N scholen) als eerste-klas entiteit op het startscherm; 5 wizard-stappen krijgen sales-context-velden (klant-type, schoolsoort, groei-trajectorie, huidig-gebruik per niveau, opmerkingen + tijdscomponent); module-catalogus krijgt Burgerschap + Digitale geletterdheid; Stap 5 herstructureert naar Cito Basis/Plus/Upsell scenario's met volledige uitfasering van `cito-oud` provider en bijbehorende `migration.ts` + `current-vs-proposed.ts` engines + routes.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**11 requirements zijn locked.** Zie `27-SPEC.md` voor de volledige requirements, boundaries en acceptance criteria.

Downstream agents (researcher, planner) MOETEN `27-SPEC.md` lezen vóór planning of implementatie. Requirements worden niet hier gedupliceerd.

**In scope (uit SPEC.md):**
- R1: Stichting-entiteit + CRUD op `/stichtingen` route
- R2: Stichting bulk-export (CSV + DMU-PDF-aggregatie)
- R3: Klant-type-vinkje (huidige-cito / nieuwe-prospect / gedeeltelijk) in WizardStep1
- R4: Schoolsoort + groei-trajectorie velden in WizardStep1
- R5: Huidig-gebruik per niveau in WizardStep2
- R6: Burgerschap + Digitale geletterdheid modules toevoegen (alle niveaus)
- R7: WizardStep3 herstructureren naar Basisvaardigheden vs Extra Modules
- R8: WizardStep4 dubbel-check summary + opmerkingen-veld + concurrent-tijd per taak-type
- R9: AI pijnpunt → Cito-voordeel matching met rule-based fallback + feedback-loop
- R10: WizardStep5 scenario-herstructurering naar Basis/Plus/Upsell, `cito-oud` provider + migration/current-vs-proposed engines verwijderen
- R11: Bulk-migratie bestaande scholen naar Stichting

**Out of scope (uit SPEC.md):**
- Nieuwe Cito Basis/Plus prijsdata correctheid (LOCKED file, owner-verantwoordelijkheid)
- Vierde provider (cito/dia/jij blijven hardcoded)
- Migratie-pad voor scholen die op cito-oud zitten (allemaal demo-data, mogen weg)
- Push-notificaties / collaborative editing
- Externe CRM-integratie
- Schoolsoort-specifieke prijslogica
- Roll-out training voor Cito-sales-team

</spec_lock>

<decisions>
## Implementation Decisions

### Stichting data-laag & UI
- **D-01:** **Eigen Supabase tabel** `stichtingen` (kolommen: `id` UUID, `name` text, `region` text, `created_at`, `updated_at`) + FK `stichting_id` (nullable) op bestaande `schools` tabel. Dexie-spiegel via nieuwe `StichtingRecord` model in `src/models/stichting.ts`. Consistent met multi-school architectuur (Phase 8 patroon), schaalt naar aggregatie-queries en respecteert offline-vereiste (ARCH-05).
- **D-02:** **Card-grid UI** op `/stichtingen` route — patroon spiegelt `SchoolOverview` (zelfde grid-layout, zelfde kaart-anatomie). Elke kaart toont: stichting-naam, aantal gekoppelde scholen, mix-indicator (3-dots cito-only / concurrent-only / mixed afgeleid van `usage_mix` per gekoppelde school). Klik op kaart → stichting-detail-view.
- **D-03:** **Smart-suggestion bulk-koppel** als primary path — bij het aanmaken/openen van een Stichting scant het systeem bestaande SchoolRecords en suggereert matches op basis van heuristieken: (a) `region` veld match, (b) naam-overeenkomst (string-similarity ≥ 0.6, bv. via `string-similarity` npm pkg of simple Levenshtein), (c) optionele adres-match indien aanwezig. UI toont: "Mogelijke matches: N scholen" met checkboxes (default checked als score > 0.8, anders unchecked). User bevestigt + kan handmatig extra scholen toevoegen via multi-select fallback. Geen drag-and-drop.
- **D-04:** **Delete-cascade verboden** — als stichting gekoppelde scholen heeft toont delete-button een dialog: "Eerst N scholen loskoppelen voordat stichting verwijderd kan worden." Hard gate, minder ongelukken, vereist expliciete handmatige unlink-flow.
- **D-05:** **Stichting-detail-view** (sub-route `/stichtingen/:id`) bevat tabs: Overzicht (basisgegevens + mix-aggregatie) | Scholen (table-view van gekoppelde scholen, met loskoppel-actie per rij) | Export (CSV + DMU-PDF). Hergebruikt `TabNavigation` component uit `src/features/school-profile/`.

### Cito-oud uitfaseren
- **D-06:** **Hard delete in execute-phase** — `cito-oud` provider-key wordt verwijderd uit `src/data/default-prices.ts`. Omdat dit een LOCKED file is (CLAUDE.md app-rule), vraagt de executor expliciet OK aan de user vóór de file aanraakt. Dezelfde behandeling voor `src/data/cito-migration-prices.ts` (volledige verwijdering).
- **D-07:** **Geen data-migratie nodig** — user heeft bevestigd: alle bestaande SchoolRecords zijn demo-data. Dexie kan een wipe-and-rebuild migratie doen voor cito-oud → niets, geen auto-converteer naar cito-basis. Migration script: detect `provider === 'cito-oud'` in moduleSetups → delete moduleSetup entry. Idempotent. Sales-team weet dat demo-data resets bij deze release.
- **D-08:** **Volledige engine-cleanup** — verwijderen in deze phase: (a) `src/engine/migration.ts`, (b) `src/engine/current-vs-proposed.ts`, (c) `src/features/migration/MigrationWizard.tsx` + tests, (d) `src/features/price-comparison/MigrationPage.tsx` + `CurrentVsProposedPage.tsx` + tests, (e) routes naar `/migration` en `/current-vs-proposed` in `src/router/routes.ts`, (f) bijbehorende store-slices en types in `src/models/school.ts` (Scenario type wordt herzien). `git grep -i cito-oud src/` en `git grep migration\\.ts src/engine/` moeten 0 hits opleveren na deze cleanup.
- **D-09:** **Geen UI-melding voor sales** — sales-team is via out-of-band kanalen op de hoogte. WizardStep5 toont gewoon de nieuwe scenario's. Minste UI-noise.

### AI pijnpunt-matching contract
- **D-10:** **Gestructureerd AI-response** via Zod schema:
  ```ts
  z.object({
    painPoints: z.array(z.string()).max(10),
    matches: z.array(z.object({
      moduleId: z.string(),
      advantage: z.string(),
      confidence: z.number().min(0).max(1),
    })),
  })
  ```
  Server-side Vercel function `api/ai-match-pijnpunt.ts` (patroon mirror van `api/ai-intake.ts`) → `claude-haiku-4-5` → `messages.parse()` met dit schema → response.
- **D-11:** **Parallel beide + AI-prioriteit** — rule-based keyword-lookup draait altijd lokaal (instant) + AI-call gaat parallel naar `/api/ai-match-pijnpunt`. UI toont eerst rule-based resultaat (sub-100ms), update naar AI-resultaat zodra binnen. Bij AI-timeout (>5s) of network-error blijft rule-based zichtbaar met badge "AI niet beschikbaar". Geen single-source mode.
- **D-12:** **Custom AI-prompt template voor power-users** (klein admin-veld) — settings/admin-pagina krijgt textarea `painPointMatcherPromptOverride` (default = ingebouwd template). Wordt server-side gemerged in `api/ai-match-pijnpunt.ts` voor user-context (bv. "focus op tijdsbesparing"). Persistent in Supabase `user_settings` of bestaande `team_settings` tabel.
- **D-13:** **Expliciete trigger-knop** "Vind Cito-voordelen" onder opmerkingen-textarea. Geen onBlur, geen debounce. Voorkomt excessive API-calls bij snelle edits. UI toont loading-state met spinner.
- **D-14:** **Feedback persistentie in SchoolRecord** (Supabase row) — array veld `painPointMatchFeedback: { painPoint, moduleId, advantage, vote: 'up'|'down', timestamp }[]`. Zustand-getState() pattern voor read. Migratie: ALTER TABLE schools ADD COLUMN pain_point_match_feedback JSONB DEFAULT '[]'::jsonb.
- **D-15:** **Rule-based keyword-map** woont in `src/lib/painPointKeywordMap.ts` — initiële map: `{ 'onduidelijk' → ['rapportage-helder', 'visualisatie'], 'traag' → ['snelheid'], 'duur' → ['kosten-transparant'], 'support' → ['nederlandse-helpdesk'], ... }`. Map wordt gemerged tegen bestaande `differentiators`-data per module om alleen Cito-voordelen op te leveren waarvoor de school dat module heeft geselecteerd.

### Wizard-componenten architectuur
- **D-16:** **Kritische audit per WizardStep** in execute-phase — voor elke WizardStep{1..5}.tsx kritisch beoordelen welke bestaande velden/code nog passen bij nieuwe eisen. Compact + to-the-core: alleen behouden wat strict nodig is, refactor de rest. Geen blind keep-of-all. Audit-output staat in de plan-tasks per stap.
- **D-17:** **Sub-componenten via composition** — nieuwe componenten worden gesplitst per logisch blok (niet inline in WizardStep{N}.tsx):
  - `SchoolTypeFields.tsx` — schoolsoort + customSchoolType (R4)
  - `GrowthTrajectoryRadio.tsx` — groei/krimp/stabiel/loting (R4)
  - `CustomerTypeRadio.tsx` — huidige-cito/nieuwe-prospect/gedeeltelijk (R3)
  - `CurrentToolPerLevel.tsx` — radio per niveau (R5)
  - `WizardSummaryBlock.tsx` — read-only summary in WizardStep4 (R8)
  - `PainPointPanel.tsx` — opmerkingen-textarea + matching-trigger + match-resultaten + feedback-thumbs (R8, R9)
  - `TimeInputSection.tsx` — refactored `TimeSavingsSection` met `mode` prop (zie D-19)
  - `StichtingCard.tsx`, `StichtingSuggestionList.tsx`, `StichtingDetailTabs.tsx` — voor stichting-feature
- **D-18:** **Gedeelde Zod schemas met composition** — locatie `src/features/school-profile/schemas/` uitgebreid met:
  - `school-meta.schema.ts` — schoolType + growthTrajectory + customerType (gedeeld tussen WizardStep1 en eventueel admin-tools)
  - `competitor-context.schema.ts` — remarks + competitorTimeMinutes (per taak-type) + painPointMatchFeedback
  - Bestaande `wizard-step1.schema.ts`, `wizard-step4.schema.ts` etc. componeren via Zod `.merge()` of `.extend()`. Voorkomt duplicatie.
- **D-19:** **TimeSavingsSection refactor naar `TimeInputSection`** met prop `mode: 'cito-savings' | 'competitor-time'`. Beide modes delen UI-layout + edit-state-management, alleen labels en doelvariabele verschillen. `cito-savings` schrijft naar bestaande `timeSavings` state, `competitor-time` schrijft naar nieuwe `competitorTimeMinutes` state. DRY, één test-suite met dual-mode.
- **D-20:** **Read-only summary met 'Wijzig'-link per blok** in WizardStep4 — `<WizardSummaryBlock>` toont: School-blok (naam, niveaus, schoolsoort, groei, klant-type), Leerlingen-blok (aantallen + huidig-gebruik per niveau), Modules-blok (selectie). Elk blok krijgt een `<button>Wijzig</button>` rechtsboven dat naar de betreffende stap navigeert (via Wizard `setStep()` action zoals Phase 16 patroon). Geen inline-edit — minimale UX-complexiteit.
- **D-21:** **TOTAL_STEPS blijft 5** — Stichting is GEEN extra wizard-stap. Klant-type-vinkje, schoolsoort, groei zitten in bestaande Stap 1. Geen ProgressBar-label aanpassen.

### Claude's Discretion
Beslissingen die researcher of planner mag maken zonder user te storen:
- Exacte string-similarity library voor smart-suggestion (vergelijk `string-similarity` ~5KB vs simple Levenshtein-implementation ~50 LOC).
- Confidence-threshold cutoff voor pre-checked suggestions (suggestie 0.8, maar planner mag aanpassen op basis van test-data).
- Exacte styling van `<PainPointPanel>` match-resultaten (cards vs lijst, met of zonder confidence-percentage zichtbaar).
- Aantal taak-types in `TimeInputSection mode='competitor-time'` (huidige Cito-savings heeft 5: rechten/resetten/inloggen/planning/koppeling; kan voor competitor uitgebreid worden met rapporten-lezen).
- Exact AI-timeout-threshold (default 5s, mag tussen 3-8s).
- Exacte heuristieken-mix voor smart-suggestion (regio-match weight vs naam-match weight) — planner kalibreert.
- Of `cito-bundles.ts` ook aangepast moet worden om Basis/Plus bundles te splitsen (waarschijnlijk ja gezien R10).
- Exact veldnaam voor klant-type-veld (`customerType` vs `citoCustomerStatus`).
- Aparte `team_settings` tabel vs uitbreiding bestaande tabel voor `painPointMatcherPromptOverride`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 27 specs & locked requirements
- `apps/concurrentoolVO/.planning/phases/27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti/27-SPEC.md` — **MUST READ** — 11 locked requirements, boundaries, acceptance criteria

### Project-level rules & architecture
- `apps/concurrentoolVO/AGENTS.md` — App-specific hard rules: Dutch UI, LOCKED files (`default-prices.ts`, `cito-migration-prices.ts`), 3 hardcoded providers, pure-function engines, Zustand getState() pattern, single-branch workflow (ADR-0007)
- `apps/concurrentoolVO/CLAUDE.md` — Architecture overview: views, Zustand stores, engines, AI-intake pattern, `TOTAL_STEPS = 5` invariant, wizard 5-stappen structuur
- `apps/concurrentoolVO/.planning/REQUIREMENTS.md` — v2.0 milestone requirements, esp. ARCH-01 t/m ARCH-05 (offline, IndexedDB), MODE-01 (Dutch formeel)

### SLO curriculum references (Burgerschap + Digitale geletterdheid)
- SLO kerndoelen Burgerschap VO: https://www.slo.nl (vanaf 2025-2026, wettelijk per 1-8-2027, alle niveaus VMBO/HAVO/VWO)
- SLO kerndoelen Digitale geletterdheid VO: https://www.digitalegeletterdheid.nl/digitale-geletterdheid-vo/ (3 domeinen, alle niveaus, AI-component nieuw)

### Existing code patterns to mirror or extend
**Wizard & school-profile:**
- `apps/concurrentoolVO/src/features/school-profile/components/WizardStep1.tsx` — refactor base voor R3, R4
- `apps/concurrentoolVO/src/features/school-profile/components/WizardStep2.tsx` — uitbreiden voor R5
- `apps/concurrentoolVO/src/features/school-profile/components/WizardStep3.tsx` — herstructureren voor R6, R7
- `apps/concurrentoolVO/src/features/school-profile/components/WizardStep4.tsx` — uitbreiden voor R8
- `apps/concurrentoolVO/src/features/school-profile/components/WizardStep5.tsx` — herstructureren voor R10
- `apps/concurrentoolVO/src/features/school-profile/components/WizardShell.tsx` — `TOTAL_STEPS = 5` invariant, ProgressBar
- `apps/concurrentoolVO/src/features/school-profile/store.ts` — Zustand store + persist + Dexie sync, breidt uit met nieuwe velden
- `apps/concurrentoolVO/src/features/school-profile/schemas/` — Zod schemas (extend pattern)
- `apps/concurrentoolVO/src/features/school-profile/components/TimeSavingsSection.tsx` — refactor naar `mode`-prop component (D-19)
- `apps/concurrentoolVO/src/features/school-profile/components/EditableField.tsx` — hergebruik voor summary-blok edits (D-20)

**School overview & navigatie:**
- `apps/concurrentoolVO/src/features/school-overview/SchoolOverview.tsx` — patroon-anker voor stichting card-grid (D-02)
- `apps/concurrentoolVO/src/features/school-overview/SchoolCard.tsx` — visual pattern voor StichtingCard
- `apps/concurrentoolVO/src/router/routes.ts` — TanStack Router; nieuwe `/stichtingen` + `/stichtingen/:id` toevoegen, oude `/migration` en `/current-vs-proposed` verwijderen

**AI-flow (mirror voor AI pijnpunt-matching):**
- `apps/concurrentoolVO/api/ai-intake.ts` — Vercel function patroon (server-side `ANTHROPIC_API_KEY`, `claude-haiku-4-5`, `messages.parse()` met Zod)
- `apps/concurrentoolVO/src/lib/ai-intake.ts` — Frontend → /api caller patroon
- `apps/concurrentoolVO/src/lib/ai-analysis.ts` — Streaming AI patroon (referentie, niet voor matching)

**Data-laag & supabase:**
- `apps/concurrentoolVO/src/models/school.ts` — SchoolRecord type, breidt uit met stichting_id (nullable FK), customerType, schoolType, growthTrajectory, currentToolUsage per level, competitorRemarks, competitorTimeMinutes, painPointMatchFeedback
- `apps/concurrentoolVO/src/db/` — Dexie schema + migrations (idempotent pattern, Phase 6 oorsprong)
- `apps/concurrentoolVO/src/db/operations.ts` — CRUD helpers, breid uit met stichting-operations
- `apps/concurrentoolVO/supabase/migrations/` — Supabase migration files; nieuwe migrations voor `stichtingen` tabel + alter `schools` voor nieuwe kolommen

**Module-catalogus:**
- `apps/concurrentoolVO/src/data/providers/cito.ts` — Cito module-definities, voeg Burgerschap + Digitale geletterdheid toe (R6)
- `apps/concurrentoolVO/src/data/providers/dia.ts`, `jij.ts`, `saqi.ts` — provider-availability voor nieuwe modules (initieel `false` — Cito-onderscheidend voordeel)
- `apps/concurrentoolVO/src/data/cito-bundles.ts` — bundle-definities (Basis vs Plus); waarschijnlijk uitbreiden voor R10

**Differentiators (input voor rule-based matching):**
- Zoek naar `differentiators` definities (waarschijnlijk in `src/data/` of `src/lib/`) — leveren voordelen-lijst per module/provider

**Export:**
- `apps/concurrentoolVO/src/features/export/pdf/` — react-pdf patroon, hergebruik voor stichting-DMU-PDF-aggregatie (R2)
- `apps/concurrentoolVO/src/features/export/components/PdfDownloadButton.tsx` — Lazy-loaded download patroon
- xlsx / papaparse (in package.json) — CSV-export voor R2

**Engines (te verwijderen):**
- `apps/concurrentoolVO/src/engine/migration.ts` — VERWIJDEREN (D-08)
- `apps/concurrentoolVO/src/engine/current-vs-proposed.ts` — VERWIJDEREN (D-08)
- `apps/concurrentoolVO/src/engine/price-comparison.ts` — UITBREIDEN met `bundle: 'basis' | 'plus'` parameter + `calculateUpsell()` functie (R10)

**Pages te verwijderen:**
- `apps/concurrentoolVO/src/features/price-comparison/MigrationPage.tsx` — VERWIJDEREN
- `apps/concurrentoolVO/src/features/price-comparison/CurrentVsProposedPage.tsx` — VERWIJDEREN
- `apps/concurrentoolVO/src/features/migration/MigrationWizard.tsx` — VERWIJDEREN

### LOCKED files (vereisen expliciete user OK bij wijziging)
- `apps/concurrentoolVO/src/data/default-prices.ts` — verwijder `cito-oud` entries (R10, D-06) — **executor vraagt OK**
- `apps/concurrentoolVO/src/data/cito-migration-prices.ts` — volledige file verwijderen (D-08) — **executor vraagt OK**

### Prior phase context (referentie)
- `apps/concurrentoolVO/.planning/phases/26-cito-prijzen-concurrentie-editor-startscherm-entry-naast-sch/26-CONTEXT.md` — startscherm-patroon (twee-card landing), prijs-editor route-conventies
- `apps/concurrentoolVO/.planning/phases/16-ai-wizard-verbetering-prijsvergelijking-harmonisatie/16-VERIFICATION.md` — AI wizard pattern, `setStep()` action voor navigatie tussen stappen
- `apps/concurrentoolVO/.planning/phases/17-huidig-cito-platform-vs-concurrent-prijsvergelijking/17-VERIFICATION.md` — Scenario C work die wordt verwijderd
- `apps/concurrentoolVO/.planning/phases/999.1-wizard-school-aanmaak-flow/999.1-VERIFICATION.md` — School-aanmaak entry-flow, wizard-redirect logic

### State
- `apps/concurrentoolVO/.planning/STATE.md` — Project state, accumulated decisions per phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`SchoolOverview` + `SchoolCard`**: Visual patroon-anker voor Stichting card-grid (D-02). Card-layout, hover-states, click-to-detail navigatie.
- **`AdminConfigEditor` manager-only gate**: pattern voor toegangscontrole — overweeg of stichting-overzicht ook manager-only is of toegankelijk voor alle ingelogde users.
- **`@dnd-kit/core`** (Phase 07): geïnstalleerd maar NIET gebruikt voor stichting (smart-suggestion ipv drag-and-drop, D-03). Wel beschikbaar als secundair patroon.
- **`TabNavigation` component**: hergebruikbaar voor Stichting-detail tabs (D-05).
- **`TimeSavingsSection`**: refactor-target voor `TimeInputSection` met `mode` prop (D-19).
- **`EditableField`** (Phase 11): potentieel voor inline-edits in summary-blok, maar D-20 kiest expliciet voor read-only met 'Wijzig'-link.
- **`ai-intake.ts` (frontend + api)**: directe mirror voor `ai-match-pijnpunt` (D-10, D-11).
- **`DiffView` (Phase 09)**: visueel patroon (niet code-copy) voor match-resultaten-display.
- **Bestaande `differentiators` data**: input voor rule-based keyword-lookup (D-15) en AI-context.
- **`xlsx` library**: hergebruik voor stichting-CSV-export (Phase 22 decision: HIGH vulnerability accepted for internal tool).
- **`@react-pdf/renderer`**: patroon hergebruik voor stichting-DMU-PDF-aggregatie (R2, D-05 export-tab).

### Established Patterns
- **Zustand `getState()` cross-store reads** — geen hooks-based refactor (LOCKED pattern uit AGENTS.md).
- **Pure-function engines** — alle engine-wijzigingen blijven puur (R10: `calculateUpsell()` volgt zelfde pattern).
- **Server-side AI via Vercel Functions** — `ANTHROPIC_API_KEY` server-only (geen `VITE_` prefix), `claude-haiku-4-5`, `messages.parse()` met Zod schema (D-10).
- **Dexie + Supabase sync** — Dexie als offline-spiegel, Supabase als authoritative (D-01, D-14).
- **TanStack Router voor route-state** — nieuwe routes via `routes.ts` registration.
- **Zod schemas met `.merge()` / `.extend()`** — composition pattern (D-18).
- **react-hook-form + zodResolver** — alle wizard-forms gebruiken dit (preserve in nieuwe sub-components).
- **Atomic commits per logical change** — geen big-bang refactors; commit per WizardStep, per nieuwe entity, per cleanup.

### Integration Points
- **`src/router/routes.ts`** — registreer `/stichtingen` + `/stichtingen/:id`; verwijder `/migration` + `/current-vs-proposed` (D-08).
- **`src/App.tsx`** — startscherm krijgt eventueel een Stichting-link/card (zie Phase 26 startscherm-design, mogelijke conflict).
- **`src/features/school-profile/store.ts`** — uitbreiden met nieuwe wizard-velden (R3-R8).
- **`src/db/operations.ts`** — toevoegen stichting CRUD operations.
- **`supabase/migrations/`** — nieuwe migration files: `stichtingen` tabel + alter schools.
- **`api/ai-match-pijnpunt.ts`** — nieuwe serverless function (D-10).
- **`src/data/providers/cito.ts`** — Burgerschap + Digitale geletterdheid module-defs (R6).
- **`src/lib/painPointKeywordMap.ts`** — nieuwe file voor rule-based fallback (D-15).
- **`src/engine/price-comparison.ts`** — uitbreiden met `bundle` parameter + `calculateUpsell()` (R10).

### Known Conflicts / Coordination
- **Phase 26 (parallel)**: voegt startscherm landing-page toe met twee cards (Schooloverzicht + Cito Prijzen). Phase 27 moet beslissen of Stichting een derde card wordt op datzelfde startscherm, of een navigatie-element op de Schooloverzicht-pagina. Coordinatie nodig — Phase 26 status checken vóór WizardShell-aanpassingen.
- **Phase 25 (parallel, EXECUTING)**: prijsintelligentie-stakeholder-feedback-loop. Mogelijk effect op `differentiators` data of pricing-config-shape. Researcher moet Phase 25 latest state checken.
- **LOCKED files**: R10 raakt `default-prices.ts` — executor MOET expliciet OK vragen vóór wijziging.

</code_context>

<specifics>
## Specific Ideas

- **Smart-suggestion voor Stichting**: gebruiker wil dat het systeem "herkent" als je eerst scholen aanmaakt en later een Stichting — heuristieken op naam-overeenkomst + regio + adres. Pre-checked checkboxes voor hoge-confidence matches (D-03).
- **AI custom-prompt voor power-users**: gebruiker wil "een prompter" kunnen geven aan de AI om matching te sturen (bv. "focus op tijdsbesparing") — D-12 vangt dit op met admin-veld.
- **Kritische audit per WizardStep**: gebruiker wil dat we tijdens execute kritisch beoordelen welke bestaande code nog past — compact + to-the-core (D-16). Geen blind keep-of-all.
- **Demo-data clean slate**: alle bestaande SchoolRecords zijn demo, mogen wipen bij `cito-oud` cleanup (D-07).
- **"Volgend schooljaar"-narrative**: huidige prijzen zijn niet meer van toepassing per volgend schooljaar; Cito Basis/Plus zijn de nieuwe contractstructuur. Stuurt de scope-keuze om alles in deze phase (geen splitsing).
- **Card-grid voor Stichting**: spiegel SchoolOverview-look (D-02).
- **Read-only summary met 'Wijzig'-link**: geen inline-edit in summary-blok, navigeer terug voor wijzigingen (D-20).

</specifics>

<deferred>
## Deferred Ideas

- **Bestuurs-niveau analytics dashboard** — Stichting-aggregatie voor Cito-management (hoeveel scholen migreren naar Basis vs Plus per bestuur). Niet in Phase 27.
- **AI-feedback-loop machine-learning** — de thumb-up/down data wordt nu alleen opgeslagen, niet gebruikt om matching te verbeteren. Toekomstige phase: train of fine-tune op feedback.
- **Multi-stichting-vergelijking** — vergelijking tussen besturen onderling (bv. "bestuur A is op Plus, bestuur B op Basis"). Niet in Phase 27.
- **AI custom-prompt per gebruiker (ipv per team)** — D-12 kiest team-niveau. Per-user prompts is potentiële uitbreiding.
- **Schoolsoort-specifieke prijslogica** — Dakpanklas/Dalton/etc. krijgen aparte prijsstructuur. Out of scope per SPEC.
- **Concurrent-tijd benchmarking aggregatie** — SPEC noemt het in-scope; CONTEXT verschuift naar "afgeleid van R2 stichting-export". Standalone benchmark-feature is deferred.
- **Vierde provider toevoegen** (bv. nieuwe markt-entrant) — out of scope per SPEC.

</deferred>

---

*Phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti*
*Context gathered: 2026-05-14*
