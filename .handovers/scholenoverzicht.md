# Handover: scholenoverzicht

**Date:** 2026-05-15
**Branch:** scholenoverzicht → main
**Commits:** 99

## Wat is er gebeurd

Deze branch bundelt drie grote Phase-cycli voor `apps/concurrentoolVO`: **Phase 26** (Cito Prijzen + Concurrentie-editor, startscherm met twee entry-cards, AI Excel-import, multi-format prijslijst-exports), **Phase 27** (Wizard-optimalisatie — klant-type + schoolsoort + groei-trajectorie + currentToolUsage per niveau, plus de hele Stichting-feature met overview/detail/bulk-link smart-suggestion), en **Phase 28** (Win/Loss-tracking foundation — types/Zod-schemas, DB-migraties voor `deal_outcomes`/`deal_discounts`/`deal_audit_log` met RLS, `deal_cohort_stats` materialized view, en `dealDiscounts` engine-overlay voor per-deal price-recalc). Daarnaast is `apps/Klantreis/` losgekoppeld naar een eigen repo en zit het volledige .planning-corpus voor 26/27/28 (SPEC, CONTEXT, RESEARCH, UI-SPEC, PLAN's, SUMMARY's, ROADMAP, STATE) op de branch. De laatste sessie (2026-05-15) voegde drie kleine commits toe: UI-rename **Schooloverzicht → Scholenoverzicht** in de school-overview page + startscherm-card + matching test, dev-server-port van 3000 → 3001 met `strictPort: true`, fix voor 3 pre-existing TypeScript errors (Json-cast in `db/types.ts` mapDealAuditInsert + import-pad voor `comparisonSnapshotSchema`), en `chunkSizeWarningLimit: 1600` in `vite.config.ts` om de react-pdf bundle-warning af te dekken.

**Build-status na laatste sessie:** `tsc -b` clean, `vite build` slaagt in 2.27s.

## Commits

- 9f5974f chore(concurrentoolVO): bump vite chunkSizeWarningLimit to 1600 kB
- 4555477 fix(concurrentoolVO): resolve 3 TS errors blocking production build
- f6cd0c8 chore(concurrentoolVO): rename Schooloverzicht -> Scholenoverzicht + dev port 3001
- c1ad306 roadmap en state
- 9126194 docs(28-03): complete cohort-AI matview plan
- 0c8d0f0 feat(28-03): add deal_cohort_stats view type + mapper
- 5040db8 feat(28-03): cohort-stats materialized view + refresh trigger
- 18a5073 docs(28-04): complete dealDiscounts engine overlay plan
- f7a8f68 test(28-04): R3 dealDiscounts overlay tests (10 cases, backward-compat verified)
- 207ab74 feat(28-04): dealDiscounts overlay for per-deal price recalc (R3)
- a9e5248 docs(28-02): complete deal-outcomes DB foundation plan
- ce6852a feat(28-02): regenerate supabase types + add row-shape mappers for deal-outcomes
- b315ceb feat(28-02): add deal_outcomes + deal_discounts + deal_audit_log tables with RLS
- 52dbc3a feat(28-02): add onderwijsvisie cohort-feature column to schools
- 0b90d57 docs(28-01): complete deal-outcome foundation plan
- 2da6461 test(28-01): scaffold 14 failing tests for R1-R5 acceptance criteria
- 64df776 chore(28-01): types + Zod schemas + Dutch labels for deal-outcomes feature
- df4d2e1 docs(27-05): complete WizardStep2 R5 currentToolUsage + stichting mix-aggregation plan
- acf95bb feat(27-05): CurrentToolPerLevel UI + WizardStep2 integratie + Zod schema + tests
- 91ad8d3 feat(27-05): currentToolUsage per-niveau data-laag + stichting mix-aggregatie
- 4d52810 refactor(26): move sub-categorisatie van Cito tab → Concurrentie tab
- 5aa26d2 docs(27-03): complete WizardStep1 klant-type + schoolsoort/groei plan
- 65b4197 docs(27-07): complete Stichting bulk-link smart-suggestion plan
- 4e1d641 feat(27-03): WizardStep1 R3 klant-type + R4 schoolsoort/groei + tests
- bc17faa docs(27-06): complete WizardStep3 Basisvaardigheden vs Extra Modules plan
- c8a1a02 feat(27-07): bulk-link UI + bulkLinkSchools operation + smart-suggestion dialog (Task 2)
- 07082d1 plan(28-06): revision iter 2 fix — correct EngineDealDiscount import path
- 1d05e33 test(27-06): add Basisvaardigheden / Extra Modules section assertions (R7)
- 9ac109b feat(27-03): data-laag voor klant-type, schoolsoort en groei-trajectorie
- ffaf6a4 feat(27-07): inline Levenshtein + stichtingMatcher smart-suggestion (Task 1)
- 59ba5dd feat(27-06): restructure WizardStep3 into Basisvaardigheden + Extra Modules sections (R7)
- fdf7b52 plan(28): revision iter 2 - serialize DealOutcomesTab.tsx writes (05b W5, 08 W6, 09 W7)
- d345e65 docs(28): update ROADMAP for revision iter 2 - 10 plans + new waves (28-05b added, 07-08-09 demoted)
- 5423455 plan(28-06): revision iter 2 - fix F6 (concretize useUpdateDiscount hook body)
- bedc777 plan(28-09): revision iter 2 - fix B2 (PipelineKanbanView LostDealDialog cleanup + redirect-to-Uitkomst)
- 8fc506f plan(28-08): revision iter 2 - fix B4 (wave 5, depends on 06)
- cd679b9 plan(28-07): revision iter 2 - fix B3 (wave 4) + B6 (get_deal_stats RPC) + F2 (grouping toggle) + F8 (global-N=0 detection)
- b95191a feat(27-02): Stichting UI — overview + detail + routes + React Query hooks
- 43077eb plan(28-05b): revision iter 2 - add F11 plan (DealDetailsForm + StickyDirtyBar inline edit)
- f0e8c1c docs(27-04): complete Wave 1 R6 plan — SUMMARY + STATE + ROADMAP
- 22de140 plan(28-05): revision iter 2 - fix B5 (concretize snapshot.ts helper) + F9 (Heropen deal button)
- 013c87d feat(27-02): Stichting data-laag — model + migratie 014 + Dexie v3 + CRUD
- 9ba4bd6 test(27-04): convert R6 it.todo scaffold to real assertions + dependent test updates
- af48543 feat(27-04): add burgerschap + digitale-geletterdheid modules (Cito-only)
- 0dbaa9d plan(28-04): revision iter 2 - fix B1 (rewrite against real price-comparison engine API)
- e3acb61 chore(git): ignore .worktrees/ for parallel-phase nested working trees
- cb49c8c docs(27-01): complete Wave 0 plan — SUMMARY + STATE + ROADMAP
- dec5fb6 test(27-01): add 11 Phase 27 test scaffolds (R1, R2, R6, R9, R10, R11)
- 3b39b11 docs(28): finalize ROADMAP entry — 9 plans, requirements R1-R5, goal locked
- 85a80a5 docs(28): plan 09 — LostDealDialog cleanup + pipeline tooltip + Playwright e2e + UAT gate
- f090d9c docs(28): plan 08 — CohortPredictionCard + useCohortPrediction + onderwijsvisie field
- 8d1b5ef docs(28): plan 07 — /dashboard route + KPIs + TrendChart + CompetitorBreakdown + filters
- 10edb65 docs(28): plan 06 — DiscountEditor + AuditLogAccordion + comparison-tab recalc
- 5f6f07f docs(28): plan 05 — Uitkomst-tab + DealAfsluitenDialog + WinDeal/LostDeal forms
- 781eb28 docs(28): plan 04 — engine extension dealDiscounts overlay (R3, pure function)
- 6d6785d docs(28): plan 03 — migration 018 deal_cohort_stats matview + refresh trigger
- e7ccfea docs(28): plan 02 — migrations 016 (onderwijsvisie) + 017 (deal_outcomes/discounts/audit-log + RLS)
- 6ff4413 docs(28): plan 01 — Wave 0 types + schemas + 14 test scaffolds
- 57b1475 refactor(27-01): relocate time-savings types out of migration.ts
- df57d4f fix(26): restore cito-module-grouping sub-categorieën (lost via parallel stash)
- e4da3a2 refactor(26): split Cito Basisvaardigheden into 4 sub-categorieën
- ff600f3 plan(phase-27): revise plans per gsd-plan-checker feedback (12→16)
- e4f91ab docs(phase-28): research phase domain for win-loss tracking + dashboard
- fc21866 docs(26-05): add SUMMARY.md for Phase 26 e2e verification capstone
- 6231c36 docs(26-05): add Phase 26 verification checklist
- d3a55b1 test(26-05): add PrijzenPage integration test + PriceImportDiffView unit tests
- c2e5d37 docs(26-04): add SUMMARY.md for AI Excel-import flow
- 05650a4 feat(26-04): wire AI Excel-import flow into /prijzen page
- 3a0c7e4 plan(phase-27): add 12 PLAN.md files across 9 waves
- 3b5573b feat(26-04): add Vercel function api/ai-price-import.ts
- 2488b9d feat(26-04): add Excel parser + pure price-diff helpers + tests
- e31f096 docs(phase-28): UI design contract for Win/loss-tracking & Marktdashboard
- fa8b8f2 docs(26-03): add SUMMARY.md for multi-format export
- 867aa81 feat(26-03): add PriceListExportButton dropdown + wire into PrijzenPage
- 84d5319 fix(26-03): swap html-docx-js for docx — Vite 8 incompatibility
- 49337dd chore(klantreis): exclude apps/Klantreis/ from app-dev-os tracking
- 583e52f docs(28): capture phase context
- 3b77e05 feat(26-03): add @react-pdf/renderer PriceListPdf document template
- 27e74cc feat(26-03): add Word renderer via lazy html-docx-js (~50KB)
- 566f977 feat(26-03): add price-list snapshot builder + TXT + HTML renderers
- 051abe8 docs(26-02): add SUMMARY.md for Wave 1 tab restructure
- 009c2aa feat(26-02): compose PrijzenPage with 3 hoofdtabs + concurrentie sub-flow
- b8e3ea7 feat(26-02): add CitoBasisvaardigheidenTab + CitoModulesTab edit forms
- 0acd308 feat(26-02): add PrijzenTabs + ConcurrentieSubTabs controlled components
- b031662 feat(26-02): add usePrijzenSearch hook + prijzenRoute validateSearch (D-02)
- a020c91 docs(phase-27): add RESEARCH.md (1011 lines, HIGH confidence)
- 275ef7d feat(26-02): add Cito module grouping constants for prijzen tabs
- 516821f chore: detach apps/Klantreis to its own repo (https://github.com/Gamingsixtie/klantreis)
- 0eace89 feat(26-01): add VITE_SKIP_AUTH dev-bypass for PrijzenPage manager gate
- 391f119 docs(26-01): add SUMMARY.md for Wave 0 foundation
- 1f229c4 docs(klantreis): create roadmap (7 phases, 87 requirements 100% coverage)
- 7610b23 docs(state): record phase 27 SPEC + CONTEXT progress
- 6c8b2b8 feat(26-01): wire routes — index renders StartschermPage, add /prijzen, redirect /admin
- 09c44ce docs(phase-27): restore SPEC + add CONTEXT + DISCUSSION-LOG
- 3134d30 feat(26-01): add PrijzenPage placeholder with manager-only gate
- 01e4f68 feat(26-01): add StartschermPage with two entry cards + shared pricing types
- 42b9c0c docs(klantreis): restore PROJECT + config + research onto current branch
- 4af893c docs(klantreis): define v1 requirements (73 reqs across 12 categories)
- 82af0cc docs(phase-26): add SPEC, CONTEXT, and 5 plans for Cito Prijzen + Concurrentie Editor

## Bestandswijzigingen

`202 files changed, 33758 insertions(+), 220 deletions(-)`

Volledig `git diff --stat main...HEAD` is groot (203 regels). Hoofdgroepen:

- **`.planning/phases/26-*`** (~12 files) — Phase 26 SPEC/CONTEXT/PLAN's/SUMMARY's
- **`.planning/phases/27-*`** (~25 files) — Phase 27 RESEARCH (1011 r) + 16 PLAN's + SUMMARY's + CONTEXT + DISCUSSION-LOG + deferred-items
- **`.planning/phases/28-*`** (~22 files) — Phase 28 RESEARCH (950 r) + UI-SPEC (631 r) + 10 PLAN's + SUMMARY's + CONTEXT + DISCUSSION-LOG
- **`apps/Klantreis/.planning/*`** (~11 files) — Klantreis project-scaffold (PROJECT, REQUIREMENTS, ROADMAP, STATE, research/), nu losgekoppeld via 516821f
- **`apps/concurrentoolVO/src/features/pricing/**`** (~25 files) — PrijzenPage + tabs + import/export/diff + PDF/Word/HTML/TXT renderers + tests
- **`apps/concurrentoolVO/src/features/stichtingen/**`** (~13 files) — Overview/Detail pages + components + hooks + schema + tests
- **`apps/concurrentoolVO/src/features/deal-outcomes/**`** (~15 files) — Types + 3 Zod-schemas + labels + 8 test scaffolds
- **`apps/concurrentoolVO/src/features/school-profile/**`** (~15 files) — Wizard Step1/2/3 uitbreidingen + componenten + schemas + tests
- **`apps/concurrentoolVO/src/features/startscherm/**`** (2 files) — Landing-page + test (incl. Scholenoverzicht rename)
- **`apps/concurrentoolVO/src/features/dashboard/**`** (3 files) — Test-scaffolds voor Phase 28 dashboard
- **`apps/concurrentoolVO/src/db/**`** (5 files) — types.ts + operations.ts + 3 test-suites uitgebreid voor deal-outcomes/stichting/migration-v3
- **`apps/concurrentoolVO/src/lib/**`** (8 files) — stichtingMatcher + stringSimilarity + supabase types + tests
- **`apps/concurrentoolVO/src/models/**`** (5 files) — school.ts + stichting.ts + time-savings.ts + modules.ts updates
- **`apps/concurrentoolVO/supabase/migrations/014-019`** (6 files) — stichtingen, sales-context, current-tool-usage, onderwijsvisie, deal_outcomes (RLS), cohort_stats view
- **`apps/concurrentoolVO/api/ai-price-import.ts`** — Vercel serverless function (179 r)
- **`apps/concurrentoolVO/e2e/*`** (2 files) — Playwright specs voor Stichting CRUD + Wizard Phase 27
- **`apps/concurrentoolVO/vite.config.ts`** — port 3001 strictPort + chunkSizeWarningLimit 1600
- **`apps/concurrentoolVO/src/router/routes.ts`** — nieuwe routes voor /stichtingen, /prijzen, /dashboard
- **`apps/concurrentoolVO/src/features/school-overview/SchoolOverviewPage.tsx`** — header rename (Scholenoverzicht)

## Lokale state (niet in git)

- **Dev server draait** op http://localhost:3001/ (background-task `bdqpqtyww` in deze sessie gestart, of een ander terminal-proces — beide draaien op poort 3001 met `strictPort: true`).
- **`apps/concurrentoolVO/.env.local`** is aanwezig (954 B, gekopieerd uit `C:\Users\pdebu\Projects VS code\App-Dev OS\app-dev-os\apps\concurrentoolVO\.env.local`). Gitignored — niet gecommit. Bevat `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/`VITE_ANTHROPIC_API_KEY`/`VITE_SKIP_AUTH` o.b.v. dev-Supabase project.
- **Pre-existing TS errors** uit Phase-28 werk zijn gefixt in commit 4555477 — branch bouwt nu schoon.

## Volgende stappen / open items

- Merge naar `main` — `main` ligt 1 commit voor op `scholenoverzicht` en deze branch ligt 99 voor; conflict-resolutie nodig of fast-forward na rebase (afhankelijk van wat die ene main-commit doet).
- Phase 28 implementatie-waves (Plans 05-09) staan klaar in `.planning/` maar nog niet geëxecuteerd in code — alleen Wave 0-4 (types, DB, matview, dealDiscounts overlay) zijn af.
- Bestaande dev-server-instantie op poort 3001 (PID ~82772 verlaten of nieuw na restart) — als die later opnieuw conflicten geeft, eerst stoppen voor `npm run dev`.
