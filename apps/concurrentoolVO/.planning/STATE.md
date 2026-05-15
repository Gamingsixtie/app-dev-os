---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Sales Intelligence Platform
status: EXECUTING
stopped_at: "Phase 28 foundation merged (Plans 01-04) + Plan 09 close-out done; mid-waves 05-08 pending implementation"
last_updated: "2026-05-15T12:30:00.000Z"
progress:
  total_phases: 27
  completed_phases: 20
  total_plans: 110
  completed_plans: 91
  percent: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Accountmanagers hebben tijdens elk schoolgesprek direct een onderbouwd, eerlijk en op de DMU afgestemd overzicht dat zowel financieel als in tijdsbesparing concreet maakt waarom Cito de beste keuze is.
**Current focus:** Phase 28 — win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-

## Current Position

Phase: 28 (win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-) — partial
Plan: Foundation (01-04) + close-out (09) complete; mid-waves (05-08) pending implementation.
LostDealDialog deleted, dropdown-tooltip + redirect-to-Uitkomst landed via 28-09. Cohort-AI matview, dealDiscounts overlay, DB foundation, types/Zod scaffolds landed via 28-01..04.

## Performance Metrics

**Velocity:**

- Total plans completed: 8 (v2.0)
- Average duration: ~27min
- Total execution time: ~248min
- Phase 27-01: ~35min (2 atomic commits, 15 files, 257 LOC added)
- Phase 27-04: ~20min (2 atomic commits, 8 files, ~200 LOC added — R6 catalog extension)
- Phase 27-02: ~45min (2 atomic commits, 18 files, ~1,500 LOC added — R1 Stichting entity + CRUD + UI)
- Phase 27-06: ~8min (2 atomic commits, 3 files, ~190 LOC added — R7 WizardStep3 Basisvaardigheden vs Extra Modules)
- Phase 27-07: ~35min (2 atomic commits, 11 files, ~870 LOC added — R11 inline Levenshtein + Stichting bulk-link smart-suggestion dialog)
- Phase 27-03: ~50min (2 atomic commits, 14 files, ~735 LOC added — R3 customerType + R4 schoolType/growthTrajectory wired end-to-end in WizardStep1)
- Phase 27-05: ~20min (2 atomic commits, 13 files, ~315 LOC added — R5 WizardStep2 currentToolUsage per niveau + getStichtingUsageMix real aggregation classification)
- Phase 28-02: ~6.5min (3 atomic commits, 4 files, ~530 LOC added — DB foundation: 2 migrations (017 onderwijsvisie + 018 deal_outcomes/discounts/audit-log + RLS) + Supabase types extension + 6 row-shape mappers)
- Phase 28-04: ~3min (2 atomic commits, 2 files, +75/+161 LOC — engine extension: ComparisonOptions.dealDiscounts overlay applied between modules-build and totals/differences seam, EngineDealDiscount type + applyDealDiscountToProviderCost helper + 10 R3 acceptance tests; 0 engine regressions, 1060 pass + 80 todo + 11 baseline-fail = no new regressions)
- Phase 28-03: ~4min (2 atomic commits, 4 files, ~283 LOC added — cohort-AI matview: migration 019 with deal_cohort_stats matview + UNIQUE INDEX + SECURITY DEFINER refresh trigger FOR EACH STATEMENT + pg_cron nightly fallback (graceful-skip) + refresh RPC; Supabase Views['deal_cohort_stats'] Row shape (Insert/Update never) + mapCohortStatsRow mapper + CohortStats harmonization (winRate optional 0-100 percent, primaryLevel SchoolLevel union, openDeals added); migration renumbered 018→019 per executor critical-deviation note; baseline preserved 1060 pass + 80 todo + 11 baseline-fail)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.0]: Stack is React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Recharts 3
- [v1.0]: Calculation engine as pure TypeScript functions, separate from React UI
- [v2.0]: AI intake via Claude Haiku 4.5 for real-time conversation capture
- [v2.0]: School profiles stored locally via Dexie/IndexedDB, not external CRM
- [v2.0]: DMU-targeted exports as core feature via @react-pdf/renderer
- [v2.0]: Reuse existing v1 code iteratively — refactor for multi-school, not rewrite
- [v2.0]: Multi-school persistence (Dexie/IndexedDB) is Phase 6 — everything depends on it
- [Phase 07]: Embedded arrays in SchoolRecord for CRM data (contacts, conversations, actions) - sufficient for 50-200 schools scale
- [Phase 07]: Use z.input<typeof schema> for CRUD function params to support optional Zod default fields
- [Phase 07]: Use z.input<typeof schema> for form types with react-hook-form zodResolver (Zod v4 input vs output type pattern)
- [Phase 07]: DMUBadge as reusable component in src/components/ui/ for cross-feature usage
- [Phase 07]: ComparisonTab wraps existing pages without duplicating logic - scenario routing determines which page renders
- [Phase 07]: Context-smart CTA maps pipeline status to recommended next action and target tab
- [Phase 07]: localStorage for view/card mode persistence - simple, no DB overhead
- [Phase 07]: @dnd-kit/core for kanban drag-and-drop with validation guard pattern
- [Phase 08]: AuthProvider uses React Context (not Zustand) for auth state - session-scoped, not persisted
- [Phase 08]: Dutch error messages mapped from Supabase AuthApiError via mapAuthError helper
- [Phase 08]: Throw on missing env vars for fail-fast; preserved existing operations.test.ts real tests
- [Phase 08]: CRM data moved from embedded arrays to separate Supabase tables with dedicated React Query hooks
- [Phase 08]: SchoolRecord.id changed from optional number to required string UUID
- [Phase 08]: DexieSchoolRecord inline type for parallel safety with Plan 08-03
- [Phase 08]: Contact ID mapping by insertion order for migration FK resolution
- [Phase 09]: Use .default([]) on V2 schema arrays for backward compatibility with v1 data
- [Phase 09]: Zod v4 uses 'error' instead of 'required_error' for custom number error messages
- [Phase 09]: Mutual exclusion activation via two sequential Supabase queries (deactivate all, then activate one)
- [Phase 09]: Replaced usePriceComparisonStore appliedOverrides with useSchoolPrices for ProductsTab price display
- [Phase 09]: Reset-to-publication deactivates all school prices via direct Supabase update in PriceManager
- [Phase 09]: DiffView maintains mutable extraction copy for inline editing before confirm
- [Phase 09]: Confirm uses Supabase mutations (operations.ts), not Zustand store for data persistence
- [Phase 09]: Inline getAuthHeaders in document-parser.ts to avoid circular import with ai-intake.ts
- [Phase 09]: Return empty array (not error) when Claude cannot extract prices from document text
- [Phase 10]: DIA package selection compares all qualifying packages by total cost and picks cheapest
- [Phase 10]: Break-even returns null when Cito is already more expensive
- [Phase 10]: Sales signals use only Cito differentiators count to determine signal type
- [Phase 10]: Added CurrentProvider and ModuleCurrentSetup types to src/models/school.ts
- [Phase 10]: isInternalMode defaults to true; activeCompetitor via alphabetical moduleId sort; sensitivity computed unconditionally
- [Phase 10]: DiaPackageManager UI deferred — user approved Phase 10 visual verification and moved to Vercel deployment
- [Phase 10]: DIA package price override store slice (diaPackageOverrides) deferred with DiaPackageManager component
- [Phase 11]: computeBreakEvenMonth as module-private function for clean encapsulation
- [Phase 11]: UpsellSignalStrength limited to green/yellow; red signals excluded from results entirely
- [Phase 11]: overig provider excluded from upsell (no comparison data for custom providers)
- [Phase 11]: switchingCosts loaded from school record via useSchool hook (react-query cached) rather than Zustand store
- [Phase 11]: EditableField extracted as shared component with a11y enhancements for tablet usability
- [Phase 14]: Inline getAuthHeaders in schoolplan-analyzer.ts to avoid circular imports (same pattern as document-parser.ts)
- [Phase 14]: SSE event protocol: step/result/error types for streaming AI analysis progress
- [Phase 14]: JSONB merge pattern for opportunity_annotations: read current, spread new, write back
- [Phase 14]: Reused exact auth/Supabase pattern from extract-document.ts for API consistency
- [Phase 14]: Exported pure functions (extractTextFromFile, buildSummarizePrompt, buildMatchingPrompt) for testability
- [Phase 14]: KansCard compact variant maps AlsoRelevantItem to SchoolplanOpportunity shape for component reuse
- [Phase 10.1]: import() type references in PricingStrategy to avoid circular imports
- [Phase 10.1]: aliases field on ModuleDefinition for AI intake fuzzy matching
- [Phase 10.1]: Provider configs as typed objects with key, label, pricingStrategy, defaultPrices fields
- [Phase 10.1]: Re-export wrappers preserve all original import paths for zero consumer changes
- [Phase 10.2]: Overloaded calculateComparison signature: PriceRecord[] routes to legacy, options object routes to new calculators
- [Phase 10.2]: calculateComparisonLegacy kept as deprecated for parity testing and backward compat during store migration
- [Phase 10.2]: Override source tracking in engine: priceRecord.source = manual when overridePrices Map contains the module:provider key
- [Phase 10.2]: Snapshot-based regression tests replace parity tests after legacy function removal
- [Phase 10.3]: Provider color map as constant in WizardStep3; visibleProviders always includes cito first with min 2 providers
- [Phase 10.3]: visibleProviders from store replaces hard-coded PROVIDERS for dynamic column rendering
- [Phase 10.3]: Prijsopbouw section replaces Berekeningsformule with step-by-step breakdown per provider
- [Phase 12]: Pure calculateBarLayout function extracted from PdfBarChart for unit testing without react-pdf renderer
- [Phase 12]: Schoolplan section placed last in all DMU reorder arrays as supplementary context
- [Phase 12]: View wrap on content container for multi-page overflow instead of fixed page breaks
- [Phase 12]: OfflineBanner in RootLayout instead of App.tsx (App only renders RouterProvider)
- [Phase 12]: Server-wins conflict strategy for offline mutation sync (compare mutation.timestamp vs server updated_at)
- [Phase 12]: queueIfOffline helper pattern for offline-safe mutations in operations.ts
- [Phase 12]: Native ClipboardItem API with writeText fallback for clipboard copy
- [Phase 12]: HTML + plain text dual format for rich paste in email/Teams
- [Phase 13]: OfflineQueueTable union type at entry point; type assertion for dynamic sync calls
- [Phase 13]: VERCEL_ENV guard on SKIP_AUTH: preserves local dev convenience while guaranteeing auth in production
- [Phase 13]: Storage path includes teamId as first segment for RLS path-based enforcement
- [Phase 16]: Persist only essential wizard state via partialize -- streaming/advice state regenerated each time
- [Phase 16]: applyToTable uses adjustedSelections when available, falls back to variantSelections
- [Phase 16]: parseAdviceFromText returns fallback instead of throwing on invalid JSON
- [Phase 16]: Step 1 internal navigation: WizardStep1Notes calls setStep(1) directly after extraction
- [Phase 16]: Editable matching uses simple dropdown selects per module (not full card grid from step 2)
- [Phase 16]: adjustedSelections initialized from variantSelections when advice first generated
- [Phase 17]: forRetentionComparison as optional options param keeps backward compat while enabling Scenario C
- [Phase 17]: Post-process cito providerResults for Scenario C instead of modifying calculator internals
- [Phase 17]: Migration callback sets school scenario to B directly (ComparisonTab picks up change reactively)
- [Phase 17]: Scenario C routing placed before B/A checks in ComparisonTab for correct priority
- [Phase 17]: Retention prompt uses three explicit categories (prijs/bezwaar/meerwaarde) matching same JSON output structure as acquisition prompt
- [Phase 17]: buildAdvicePayload exported for reuse by buildRetentionAdvicePayload (explicit architectural choice)
- [Phase 18]: DMU_POSITION_ORDER as constant for hierarchy display sorting; blokkades stored as system_events; view toggle via localStorage
- [Phase 999.1]: SchoolNameDialog follows SchoolPickerDialog visual pattern for UI consistency
- [Phase 999.1]: DashboardTab uses early return for incomplete school CTA instead of conditional section
- [Phase 999.1]: WizardPage detects fresh school via completedSteps.length === 0
- [Phase 19]: IntakeModeToggle hidden per D-05 (code kept, never rendered)
- [Phase 19]: ConfirmDialog as reusable component with configurable cancel labels
- [Phase 19]: Always-visible inline input replaces toggle-based add form in kanban
- [Phase 21]: Keyword stem betrouwba for Dutch inflection matching in DMU tag filter
- [Phase 21]: Text fallback for Cito logo on cover page; IntroSection renders first assumption introText; ProductInfoSection before disclaimer; generiek skips DMU filtering
- [Phase 22]: Coverage thresholds at baseline (25/17/22/26) -- raise after coverage expansion in plans 03/04
- [Phase 22]: 44 todo-only tests deleted -- critical paths already covered by 604 real tests
- [Phase 22]: Sentry replay maskAllText: false for internal tool; source map upload conditional on SENTRY_AUTH_TOKEN; CSP allows sentry.io + supabase.co + anthropic.com
- [Phase 17]: No code changes needed for 17-04 -- all functionality already implemented in plan 17-03
- [Phase 22]: TanStack Router test wrapper: components using Link must be rendered inside createRootRoute.component, not as RouterProvider children
- [Phase 22]: Coverage thresholds at baseline 27/18/25/27 -- raise after further test expansion
- [Phase 22]: xlsx HIGH vulnerability accepted -- internal tool, no untrusted file uploads
- [Phase 22]: 10MB client-side file size limit on DocumentDropzone for defense-in-depth
- [Phase 24]: Lifted analysis summary state via onAnalysisComplete callback prop instead of shared store
- [Phase 25]: ops-competitor-intel routes to existing infrastructure (PriceProposalModal, document upload, admin editor) rather than building new UI
- [Phase 25]: getState() call pattern for loadFromSupabase consistent with existing store access (no re-renders)
- [Phase 25]: useMarketPricing as local useState rather than store state -- view-layer toggle only
- [Phase 25]: Look up DB config ID via usePricingConfigs React Query hook for AdminConfigEditor mutation pattern
- [Phase 25]: Allow amountPerStudent >= 0 in price provider tests (some providers have zero-price placeholder modules)
- [Phase 25]: ProposalBadge uses statusConfig Record map pattern matching PriceBadge convention
- [Phase 25]: useOpenProposalCount polls every 60s via refetchInterval for badge freshness
- [Phase 27-01]: Time-savings types relocated to src/models/time-savings.ts as canonical home; src/models/migration.ts + src/engine/migration.ts keep backward-compat re-export shims until Plan 27-10 cleanup
- [Phase 27-01]: Test scaffolds use it.todo() (not it.skip) so vitest reports pending coverage as todo count rather than as false-positive greens
- [Phase 27-01]: Plan listed ValueReportSection.tsx but file only imports MigrationResult (not the 3 relocated symbols) — left untouched; transitive typing intact via engine re-export
- [Phase 27-04]: ModuleDefinition stays niveau-onafhankelijk (no `levels` field) — modules are naturally available on all VO niveaus because WizardStep3 applies no level-filter; "alle 5 niveaus" is verified indirectly via shape inspection
- [Phase 27-04]: New 'extra-modules' ModuleCategory introduced in MODULE_CATALOG + CATEGORY_LABELS — minimal CATEGORY_ORDER hook added to WizardStep3 (third section after Leerlingvolgsysteem/Overige) so R6 acceptance "beide modules zichtbaar" is satisfied without pre-empting Plan 27-06 R7 Basisvaardigheden/Extra restructuring
- [Phase 27-04]: Cito Burgerschap + Digitale geletterdheid prijzen ingevoerd als €0,00 placeholder (SPEC R6 out-of-scope: data-correctheid is owner-verantwoordelijkheid); forces handmatige invoer via prijs-editor voor publicatie
- [Phase 27-04]: cito-module-grouping `'overige'` catch-all subcategory by design (per existing comment "future-proofing") — burgerschap + digi-gel land here until Plan 27-06 promotes a dedicated `/prijzen` UI subcategory; test invariant softened to allow this
- [Phase 27-02]: StichtingCascadeError as a domain-specific Error subclass — UI matches on `instanceof StichtingCascadeError` instead of parsing a localized error message. Dutch plural fix ("scholen" not "schoolen") was caught pre-commit by the test assertion.
- [Phase 27-02]: getStichtingUsageMix() returns 'unknown' unconditionally in Plan 27-02; Plan 27-05 flips this on a one-line change once `currentToolUsage` per niveau lands on SchoolRecord. Helper signature + Tailwind colour map are stable.
- [Phase 27-02]: StichtingCard.schoolCount is hardcoded to 0 on the overview grid because per-card linked-count fetching would be N+1 over Supabase. Plan 27-07 introduces the smart-suggestion join which can also feed an aggregated count back. Card anatomy verified, live count deferred.
- [Phase 27-02]: Supabase TypeScript types in src/lib/supabase/types.ts are hand-maintained (no codegen pipeline) — added stichtingen block + stichting_id on schools by hand. Future improvement: wire Supabase CLI codegen.
- [Phase 27-02]: OfflineQueueTable union extended with 'stichtingen' so updateStichting queues consistently. createStichting + deleteStichting intentionally do NOT queue offline (need server-side UUID generation + cascade-guard count — both online-only operations).
- [Phase 27-06]: WizardStep3 section-split via WizardStep3-local `BASICS_MODULE_IDS` constant — NIET via MODULE_CATALOG categorie-rename. Plan-text vroeg `'lvs'` → `'basisvaardigheden'` rename maar actual category-keys zijn `'leerlingvolgsysteem'`/`'overige-instrumenten'` met diep verweven gebruik in price-comparison engine + ComparisonTable + 6 engine-test files. Section-grouping is een view-concern, geen data-concern.
- [Phase 27-06]: Basisvaardigheden = 4 modules (rekenwiskunde + nederlands + engels + taalverzorging). User-prompt overrode plan-interfaces (die 3 modules zei). LVS Compleet preset hermapt naar deze 4-module set; LVS Basis preset behoudt 3-module setup voor backward-compat sales-flow.
- [Phase 27-07]: Inline Wagner–Fischer Levenshtein in `src/lib/stringSimilarity.ts` (~70 LOC, zero npm deps) — Phase 22 deps-policy honored. Case-sensitive primitive (caller lowercases) zodat dezelfde functie ook bruikbaar is voor case-preserving comparison.
- [Phase 27-07]: Suggestion sort = descending by score met `localeCompare(name, 'nl')` tie-break — deterministisch voor tests én voor sales (geen flicker tussen renders). Weights (NAAM_WEIGHT 0.65, REGIO_WEIGHT 0.35, MIN_SCORE_SUGGESTED 0.6, PRE_CHECKED_THRESHOLD 0.8) zijn named-export constants zodat tests tegen source-of-truth asserten.
- [Phase 27-07]: `useUnlinkedSchools` filtert `getAllSchools()` client-side i.p.v. `.is('stichting_id', null)` Supabase query — RLS is al team-bounded; extra query zou cache fragmenteren zonder netto winst.
- [Phase 27-07]: `BulkLinkSchoolsDialog` seedt `selectedIds` van preChecked suggestions on mount + re-seedt via `seedSnapshot` guard wanneer stichting-id verandert — defensief tegen dialog-instance reuse over verschillende Stichtingen heen (huidige callers mount/unmount per Stichting, maar guard kost niets).
- [Phase 27-07]: Confidence-percentage zichtbaar in suggestion-UI (D-03 "Claude's discretion") — sales transparantie weegt zwaarder dan ondoorzichtigheid. "Sterke match" badge geeft visuele cue zonder dat sales het percentage hoeft te interpreteren.
- [Phase 27-07]: `bulkUnlinkSchools` toegevoegd voor symmetrie ondanks geen huidige UI-caller — voorkomt N HTTP round-trips voor toekomstige "verplaats meerdere scholen" of "leeg een stichting" flows (Rule 2 auto-add).
- [Phase 27-03]: `schoolMetaShape` geëxporteerd als plain JS-object (NIET ZodObject) — caller-schemas spreaden via `...schoolMetaShape` binnen hun eigen `z.object({...})`. Plan-interfaces stelden `.merge(schoolMetaSchema)` voor maar Zod 4's `.refine()`-wrapped schema is een ZodEffects die niet `.merge()`-baar is. Spread + her-applied refine is dichterbij de plan-intent én typecheckt correct met `z.infer`.
- [Phase 27-03]: `customSchoolType` wordt geforceerd `null` in submit-handler als `schoolType !== 'overig'` (i.p.v. de raw form-value door te schrijven). Voorkomt 'orphan' free-text na back-and-forth en houdt downstream reporting (CSV/PDF export Plan 27-11) consistent.
- [Phase 27-03]: 3 sub-componenten (`CustomerTypeRadio` / `SchoolTypeFields` / `GrowthTrajectoryRadio`) zijn stateless presentational — `register`-spread + `value` + `error` props i.p.v. interne `useFormContext()`. Testbaar zonder full form-context provider; herbruikbaar in WizardStep4 summary-block (Plan 27-08 R8).
- [Phase 27-03]: Dexie v3 upgrade-callback krijgt 4 idempotente `?? null` defaults voor `customerType` + `schoolType` + `customSchoolType` + `growthTrajectory` — geen v4 bump. Plan 27-02 schreef v3 voor Stichting; toevoegen in dezelfde callback houdt migratie-pad atomic voor v1/v2 → v3 users.
- [Phase 27-03]: Plan `<files>` block listed alleen `WizardStep1.test.tsx` maar 3 andere test-files (`step1.test.tsx`, `wizard-navigation.test.tsx`, `WizardShell.test.tsx`) rendeerden Step 1 via integration paths en breekten op de nieuwe required Zod-fields. 7 testcases extended om de 3 nieuwe required fields in te vullen (Rule 1 — bug introduced by my change, fix in scope).
- [Phase 27-05]: `z.partialRecord(z.enum(K), z.enum(V))` ipv `z.record(...)` voor de currentToolUsage schema — Zod 4 maakt van `z.record` met enum-keys een strict (exhaustive) `Record<K,V>`. Voor een per-niveau-optionele map is `partialRecord` de canonieke Zod-4 idiom.
- [Phase 27-05]: `'geen'` (nieuwe markt) wordt in `getStichtingUsageMix` met de concurrent-side gegroepeerd — niet als aparte 'unknown'. Reden: Sales' intent voor de 3-dots indicator is "kunnen we hier nog winnen?"; 'geen' is non-Cito. Een lege/ontbrekende map blijft echter wel `'unknown'`.
- [Phase 27-05]: Per-niveau `'mix'` short-circuits direct naar `'mixed'` in de aggregatie — een school met 'mix' op één niveau IS al multi-aanbieder ongeacht andere niveaus.
- [Phase 27-05]: Dexie v3 upgrade-callback uitgebreid met vijfde idempotent default (`currentToolUsage ?? {}`) in dezelfde callback als Plan 02/03 — atomic migratie-window voor v1/v2 → v3 users, geen v4 bump.
- [Phase 27-05]: Write-through dual-source state: per-radio onChange schrijft direct naar Zustand store (live cross-step UX) ÉN naar react-hook-form via setValue; submit-handler mirror't form-final terug naar store (defense-in-depth). Past binnen Phase 27-03 dual-source patroon.
- [Phase 27-05]: Bestaande WizardStep2 tests in 2 test-files braken op `getByText('HAVO')` doordat de R5 sectie via `<legend>` dezelfde tekst dupliceert in de DOM. Rule 1 fix: scoping via `within(screen.getByRole('table'))`. Algemeen patroon zodra meerdere secties dezelfde labels reuse'n.
- [Phase 28-02]: Pre-flight migration-number bump: PLAN.md expected 016+017, but 016 was already taken by Phase 27-05. Bumped to 017 (onderwijsvisie) + 018 (deal_outcomes). All downstream Phase 28 plans need a +1 bump (28-03 → 019, 28-07 → 020). Migration-number drift is the rule, not the exception, in multi-phase parallel pipelines.
- [Phase 28-02]: DB CHECK constraints aligned with Phase 28 Plan 01 schemas (4-provider catalog incl. `saqi`) rather than with PLAN.md's interfaces block (3-provider). Defense-in-depth at the boundary requires DB and Zod to agree — and Plan 01 had already locked saqi as canonical.
- [Phase 28-02]: `update_updated_at_column()` trigger function was missing from all prior migrations (grep returned 0). One-time installed at top of migration 018 with `CREATE OR REPLACE` so future back-fill is idempotent. Reusable for any subsequent table needing updated_at maintenance.
- [Phase 28-02]: Defense-in-depth append-only audit log: no UPDATE/DELETE RLS policies + TS `Update: Record<string, never>` (not `never`, because the `UpdateTables<>` helper relies on the index shape). DB-side gate + type-level gate combined.
- [Phase 28-02]: RLS via FK-EXISTS pattern (`deal_discounts` and `deal_audit_log` scope through `deal_outcomes.team_id`) — child tables without their own `team_id` can still be team-scoped via the parent's team_id. Established pattern for future child tables in this codebase.
- [Phase 28-02]: `WITH CHECK` clause added to `deal_discounts_team_all` FOR ALL policy — PLAN.md showed only `USING`. Postgres-RLS treats `FOR ALL` with only USING as covering filtering but NOT INSERT predicate; must add `WITH CHECK` mirror to prevent cross-team writes (T-28-09 mitigation gap).
- [Phase 28-04]: Engine overlay seam = constructed `modules` array (post-Scenario-C, pre-totals), NOT the internal `providerResults` Map. Mutating after `selectedModules.map(...)` keeps the providerResults internal contract untouched, only walks user-selected modules (no orphan discounts), and lets the existing totals/hasAnyModule loops pick up the change for free.
- [Phase 28-04]: EngineDealDiscount declared engine-internal (no id/dealOutcomeId/createdAt) — keeps `src/engine/` independent from `src/features/deal-outcomes/` and avoids a circular import. Plan 06 owns the `toEngineDiscount(DealDiscount)` mapper in operations.ts.
- [Phase 28-04]: Math.max(0, ...) clamp on BOTH percentage and amount paths — defense layer 3 (Zod refine + DB CHECK + engine clamp). Mitigates T-28-15/16 at the engine boundary. T-28-17 satisfied intrinsically (engine is pure, no logging).
- [Phase 28-04]: Order locked: Calculators → Scenario C oldPlatform override → modules build → Phase 28 dealDiscounts overlay → totals → hasAnyModule → differences → diaPackageResult. diaPackageResult intentionally NOT recomputed for dealDiscounts — package selection operates on per-config publication prices and the kortingen apply POST-package per D-01.
- [Phase 28-04]: Wave 0 scaffold's R3 block (4 it.todo + 1 SCAFFOLD invariant) REPLACED — not appended — by 10 real R3 acceptance tests. SCAFFOLD's only assertion (empty dealDiscounts == no option) is now redundant with the new 'backward-compat: empty array' test.
- [Phase 28-04]: Added 11th breakdown-step assertion test beyond plan's 10-case list (Rule 2 auto-add) — plan's behavior spec explicitly required appended PriceBreakdownStep with negative delta, but the test list lacked an assertion for it. Without the test, a future refactor could silently drop the breakdown step and break the UI Prijsopbouw section.
- [Phase 28-03]: Third migration-number bump in the Phase 27/28 wave: PLAN expected 018, but 018 was taken by Plan 28-02. Created as 019. Pattern is now firmly established as "migration-number drift is the rule, not the exception" — every Wave-1+ plan should `ls supabase/migrations/` before assuming its number is free.
- [Phase 28-03]: First materialized view in this codebase. UNIQUE INDEX on the cohort key is REQUIRED for `REFRESH … CONCURRENTLY` — pre-condition documented inline. Reusable pattern for future server-side aggregations.
- [Phase 28-03]: SECURITY DEFINER on the refresh trigger function is required because matview-owner privilege is needed to refresh (Supabase issue #13779). `SET search_path = public` defends against search-path injection (Supabase RPC-hardening guidance). EXCEPTION OTHERS handler ensures refresh failure does NOT roll back the original deal_outcomes write (T-28-14 mitigation: stale stats acceptable, lost writes not).
- [Phase 28-03]: Statement-level trigger (FOR EACH STATEMENT) chosen over row-level — 1 refresh per transaction regardless of row count. Plan-09 e2e tests use the SECURITY DEFINER RPC `refresh_deal_cohort_stats_rpc()` to force-refresh between INSERT and query (the trigger fires on COMMIT, not statement-end inside a test transaction).
- [Phase 28-03]: Matviews do NOT honour RLS in Postgres — team-scoping is app-side via `.eq('team_id', currentTeamId)` in the Plan 08 hook. The `team_id` column is therefore part of the cohort GROUP BY tuple, not just a filter target. Documented in matview COMMENT for downstream agents.
- [Phase 28-03]: Type-layer read-only matview: `Insert: never; Update: never` on `Database['public']['Views']['deal_cohort_stats']`. Safe because Views are never indexed by InsertTables/UpdateTables helpers (which walk only `Tables`). Different from Plan 28-02's `deal_audit_log` which used `Record<string, never>` because audit-log Update IS indexed by the helper — choice depends on helper usage.
- [Phase 28-03]: pg_cron nightly fallback wrapped in DO-block with EXCEPTION OTHERS handler — migration succeeds on Supabase plans without pg_cron pre-installed (RAISE NOTICE on skip). Trigger refresh remains primary; cron is the T-28-14 safety net for silent trigger failure.
- [Phase 28-03]: CohortStats domain type harmonized vs. Plan 01 stub: winRate is now optional `number?` (0-100 percent, one decimal — matches matview `ROUND(...,1) * 100` output), not 'Fraction in [0, 1]'. primaryLevel narrowed from `string` to SchoolLevel union (vmbo-b/k/gt/havo/vwo). openDeals added because matview exposes it and downstream UX needs the "X open + Y decided" breakdown.
- [Phase 28-09]: LostDealDialog physically deleted; tooltip + redirect-to-Uitkomst on dropdown verloren option and kanban drag-to-verloren; Playwright e2e and UAT-CHECKLIST committed

### Roadmap Evolution

- Phase 16 added: AI Wizard Verbetering & Prijsvergelijking Harmonisatie — eerlijke concurrentievergelijking via verbeterde wizard met concurrent-selectie, AI-advies en tabblad-synchronisatie
- Phase 26 added (2026-05-14): Cito Prijzen + Concurrentie Editor — startscherm-entry naast Schooloverzicht met dedicated prijs-editor (tabs Basisvaardigheden/Modules/Concurrentie), multi-format export en AI-Excel-import met diff-preview. SPEC.md gegenereerd via --auto modus, ambiguity 0.18 (gate passed). Phase 25 blijft in EXECUTING staat — Phase 26 wacht tot Phase 25 afgerond is (of user expliciet switcht).
- Phase 27 added (2026-05-14): Wizard-optimalisatie bestaande klant vs nieuwe klant + Stichting-laag — pre-stap Stichting (bestuur met N scholen + gebruik-mix per school), Stap 1 schoolsoort-varianten (Dakpanklas, Daltonschool) + groei-trajectorie (groei/krimp/loting), Stap 2 huidig-gebruik per niveau, Stap 3 herstructurering Basisvaardigheden vs Extra Modules (+ Burgerschap, Digitale geletterdheid), Stap 4 dubbel-check + opmerkingen-veld (pijnpunten) + tijdscomponent, Stap 5 dubbel-check + Upsell-scenario Cito Basis vs Plus. Sales-driven: onderscheid bestaande klant vs nieuwe klant + concurrent-pijnpunt → Cito-voordeel matching. Wacht achter Phase 25 (EXECUTING) en Phase 26 (queued).
  - Phase 27 SPEC.md gegenereerd (2026-05-14): 11 requirements locked, ambiguity 0.16 (gate ≤ 0.20 passed na 4 rounds). Key beslissingen: Cito-oud volledig uitfaseren (R10) — scenarios herstructureren naar Cito Basis vs concurrent / Cito Plus vs concurrent / Upsell Basis→Plus. LOCKED file `default-prices.ts` wijziging vereist expliciete user OK bij execute.
  - Phase 27 CONTEXT.md gegenereerd (2026-05-14): 21 implementation decisions (D-01..D-21). Stichting = eigen Supabase tabel + Dexie spiegel, card-grid UI met smart-suggestion bulk-koppel via heuristieken (regio + naam-similarity + adres), delete-cascade verboden. AI pijnpunt-matching = parallel rule-based + AI met custom prompt-template voor power-users, expliciete knop trigger, feedback in SchoolRecord. WizardStep audit per stap (lean refactor), sub-components via composition, gedeelde Zod schemas met `.merge()`. TimeSavingsSection refactor naar `TimeInputSection` met `mode` prop.
- Phase 28 added (2026-05-14): Win/loss-tracking & Marktpositie + Korting-verrijking Vergelijking — Aparte 'Uitkomst/Deal'-tab per school waar accountmanager elke prijsvergelijking-uitkomst registreert (gewonnen/verloren/in onderhandeling, prijsverschil, reden, contactpersoon), cross-school marktpositie-dashboard met telstanden (win-rate, gemiddelde marge t.o.v. concurrent, top verlies-redenen), en korting-verrijking in vergelijking-tab zodat actuele kortingen meegenomen worden in de uiteindelijke prijs. Sales-inzicht-driven: registreren of we de deal winnen/verliezen + waarom, en daaruit market-positioning afleiden. Brief: projects/briefs/phase-28-winloss-tracking/brief.md. Wacht achter Phase 25 (EXECUTING), Phase 26 + 27 (queued). Depends on Phase 27, 25, 15, 7.
- Phase 25 CLOSED – INCOMPLETE (2026-05-14): User besloot Phase 25 niet meer af te maken. 11/12 plans uitgevoerd; 25-07 (UI-integration: "Klopt niet" triggers + staleness indicators + AI normalization endpoint) blijft deferred. DB-driven prijsdata, review-queue, discount-engine, admin-editor en ops-competitor-intel skill zijn live en zelfstandig functioneel — alleen de "Klopt niet"-feedback-loop UI ontbreekt. Reden: focus verschuift naar Phase 26 (Cito Prijzen + Concurrentie Editor) en Phase 27 (Wizard-optimalisatie). Restscope (25-07) kan later opnieuw als losse phase worden ingepland indien feedback-loop alsnog nodig.

### Pending Todos

- [10-03 deferred] DiaPackageManager UI: create `DiaPackageManager.tsx`, add `diaPackageOverrides`/`setDiaPackageOverride` to store.ts, wire ModeToggle + SensitivitySection + DiaPackageManager into PriceComparisonPage.tsx — deferred to post-Vercel deployment
- [10-02/10-03 pending] Verify PriceComparisonPage.tsx integration (ModeToggle, PeriodToggle, SensitivitySection) is applied in main branch — worktree commits may not be merged

### Blockers/Concerns

- Competitor product catalog needs correction: DIA prijzen waren 35% overschat in v1
- JIJ! publiceert geen prijzen — offerte nodig bij Bureau ICE
- Prijsmodel nieuw Cito-platform data nog niet volledig beschikbaar
- CAO VO 2025-2026 salary scale reference needed for default hourly rate
- [Phase 11]: Research needed for @react-pdf/renderer + Recharts SVG embedding before building DMU templates
- [Phase 6]: Safari private browsing IndexedDB limitation — define fallback behavior during planning

## Session Continuity

Last session: 2026-05-15T12:30:00Z (merge scholenoverzicht → main)
Stopped at: scholenoverzicht foundation merged; Phase 28 mid-waves (05-08) next
Resume file: .planning/phases/28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-/28-05-PLAN.md
