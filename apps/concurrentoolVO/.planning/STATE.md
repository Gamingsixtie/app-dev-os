---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Sales Intelligence Platform
status: Ready to execute
stopped_at: Completed 25-03-PLAN.md
last_updated: "2026-05-15T11:59:37.605Z"
progress:
  total_phases: 24
  completed_phases: 19
  total_plans: 79
  completed_plans: 74
  percent: 94
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Accountmanagers hebben tijdens elk schoolgesprek direct een onderbouwd, eerlijk en op de DMU afgestemd overzicht dat zowel financieel als in tijdsbesparing concreet maakt waarom Cito de beste keuze is.
**Current focus:** Phase 28 — win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-

## Current Position

Phase: 28 (win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-) — close-out (Plan 09 complete)
Plan: 9 of 9 (Phase 28 closed: LostDealDialog deleted + tooltip + e2e + UAT-CHECKLIST landed; user UAT pending)

Note: STATE.md on `main` reflects a different lineage than the feature branch
that holds the rest of Phase 28's plan artifacts. After the user merges the
phase-28 feature branches into main, this position block will reconcile with
the canonical phase-28 state from those branches.

## Performance Metrics

**Velocity:**

- Total plans completed: 1 (v2.0)
- Average duration: ~40min
- Total execution time: ~40min

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
- [Phase ?]: Phase 28-09 LostDealDialog physically deleted; tooltip + redirect-to-Uitkomst on dropdown verloren option and kanban drag-to-verloren; Playwright e2e and UAT-CHECKLIST committed

### Roadmap Evolution

- Phase 16 added: AI Wizard Verbetering & Prijsvergelijking Harmonisatie — eerlijke concurrentievergelijking via verbeterde wizard met concurrent-selectie, AI-advies en tabblad-synchronisatie

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

Last session: 2026-05-15T11:59:31.643Z
Stopped at: Completed 25-03-PLAN.md
Resume file: None
