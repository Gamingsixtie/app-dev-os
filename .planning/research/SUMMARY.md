# Project Research Summary

**Project:** Rekentool VO v2.0 — Sales Intelligence Platform
**Domain:** B2B sales intelligence for Dutch education market (assessment/testing providers)
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

This project is a v2.0 evolution of an existing, working React SPA that helps Cito accountmanagers compare prices between Dutch VO assessment providers (Cito, DIA, JIJ). The v1 foundation is solid: three pure calculation engines, a 5-step wizard, Zustand stores, Zod validation, and basic AI intake via Claude Haiku 4.5. The upgrade path is clear — the v1 architecture must be systematically extended, not rewritten. The single most critical change is the shift from a single-school singleton store to a multi-school indexed data model backed by IndexedDB (Dexie.js). Every v2 feature depends on this foundation change being done first, done correctly, and with explicit data migration from v1 localStorage.

The recommended approach builds in four logical phases: (1) data layer refactor to establish multi-school persistence and navigation scaffolding, (2) school intelligence features that make the tool a genuine CRM-lite, (3) calculation enhancements (hybrid scenarios, value-beyond-price, multi-year projections), and (4) DMU-targeted PDF export documents. This order respects hard feature dependencies: school profiles must exist before conversation history can be linked; basic PDF export infrastructure must be proven before three DMU-specific templates are built; the value-beyond-price engine must produce numbers before those numbers can appear in MT/finance export documents.

The principal risks are architectural, not algorithmic. The single-school assumption is baked into both existing Zustand stores, the cross-store `getState()` coupling, and the view router. Failing to address this in Phase 1 will cause cascading bugs in every subsequent phase. Secondary risks include PDF generation failures with real-world Dutch content (solved by using `@react-pdf/renderer` over html2canvas), AI extraction producing plausible but semantically wrong numbers (solved by mandatory confirmation screen with semantic range validation), and silent data loss during store schema migration (solved by explicit Zustand `version` fields with tested migration fixtures before any schema change).

---

## Key Findings

### Recommended Stack

The v1 stack (React 19, TypeScript, Vite 8, Tailwind CSS 4, Zustand, Zod v4, Vitest, Recharts 3, Anthropic SDK, react-hook-form) is validated and unchanged. Three targeted production dependencies are added for v2.0:

**New production dependencies (3 packages total):**

```bash
npm install dexie@^4.3.0 dexie-react-hooks@^4.2.0 @react-pdf/renderer@^4.3.2
```

- **Dexie.js v4.3.0 + dexie-react-hooks v4.2.0:** IndexedDB abstraction for multi-school persistence. `useLiveQuery` provides reactive UI updates in the same pattern as Zustand, but for persistent relational data. Replaces localStorage for school profiles, conversation history, and price snapshots. 922K weekly downloads, TypeScript-first, handles schema migrations declaratively. Selected over RxDB (overkill sync/replication) and sql.js (1MB WASM, no React hooks).
- **@react-pdf/renderer v4.3.2:** JSX-based client-side PDF generation. Required for DMU-targeted exports that produce distinct documents per stakeholder persona (coordinator, MT, finance). React 19 compatible since v4.1.0. The v1 recommendation of `react-to-print` + print CSS remains valid for screen printing; this library handles purpose-built branded documents only.

**No new dependencies needed for:** AI conversation streaming (existing SDK supports `client.messages.stream()`), auto-price-update pipeline (existing SDK + Zod + new Dexie table), multi-turn conversation state (Zustand handles ephemeral message arrays).

**What not to add:** Vercel AI SDK (multi-provider overhead for a single-Claude tool), TanStack Query (no REST API — Dexie's `useLiveQuery` fills this pattern), jsPDF (manual coordinate layout, unmaintainable), RxDB (sync/replication overkill for local single-user tool), i18next (Dutch-only app), Firebase/Supabase (no backend required or wanted).

---

### Expected Features

**Must have for v2.0 (table stakes — the tool is not a sales platform without these):**
- School registry with persistence — create, list, select, delete school profiles. Absolute foundation; every other v2 feature requires knowing "which school"
- Enhanced conversation intake — extend existing AI intake to add to an existing profile rather than overwrite, capture deal-specific prices, append to conversation log per school
- Hybrid scenario calculations — engine refactor to calculate per-module savings where providers differ, surface "already Cito" modules vs switching opportunities
- Value-beyond-price engine — pure function quantifying five documented time savings in euros (rechten, resetten, inloggen, planning, koppeling)
- Basic PDF export — single comparison summary as downloadable PDF; prove `@react-pdf/renderer` infrastructure before building DMU variants
- School-level price overrides — enter deal-specific prices per school with source attribution

**Should have for v2.x (competitive differentiators):**
- DMU-targeted export variants — three templates (coordinator, MT, finance); the killer feature, but depends on all P1 items plus value engine and multi-year projection
- Pipeline status tracking — five-stage deal stage per school, portfolio dashboard view
- Multi-year cost projection — 3-5 year projection for finance/MT DMU export readiness
- Negotiation preparation card — pre-call composite view aggregating school profile, history, talking points
- Upsell opportunity detection — auto-identify modules where switching to Cito saves money

**Defer to v2.5+ (complexity outweighs value now):**
- Auto-price-update via document parsing (PDF upload + AI extraction)
- Auto-price-update via web/agent lookup
- School data export/import for colleague handoff
- Conversation full-text search

**Anti-features to reject regardless of how they are requested:** CRM integration (Salesforce/HubSpot), real-time voice transcription (AVG/GDPR blocker in NL), automated email sending, exhaustive competitor feature matrix, login/user accounts, dynamic discount suggestion, Scenario C as a separate engine (handle via hybrid scenario configuration instead).

---

### Architecture Approach

The v1 architecture is a clean three-layer SPA — pure engine functions, Zustand state layer, React UI layer — and this structure must be preserved. The v2.0 changes insert a fourth layer: an IndexedDB persistence layer via Dexie between the static data files and the Zustand stores. Engines remain pure functions that receive data as arguments and never touch stores or the database. This invariant makes all calculation logic testable in isolation.

**Major components and their responsibilities:**

1. **Dexie database (`src/db/`)** — persistent domain data: `schools`, `conversations`, `priceOverrides`, and `priceUpdates` tables. School-indexed. Handles one-time v1 localStorage migration on first load.
2. **useSchoolDBStore (NEW)** — thin Zustand orchestrator managing the active school ID, school list (names only for startup performance), and CRUD operations that delegate writes to Dexie.
3. **usePriceDataStore (NEW)** — mutable global price layer. Starts from `DEFAULT_PRICES` (unchanged static seed), overlays verified price updates from Dexie. Engines continue to receive `PriceRecord[]` as input — no engine changes required.
4. **useSchoolProfileStore (MODIFY)** — gains `schoolId` field. Loads/saves profile from Dexie on school switch. Zustand retains in-memory reactive state for the active school.
5. **usePriceComparisonStore (MODIFY)** — gains school-awareness. `initialize()` and `recalculate()` scoped to active school ID.
6. **export-renderer.ts (NEW engine)** — pure function transforming calculation results into three DMU-perspective export structures from the same input data.
7. **intake-pipeline.ts (NEW engine)** — multi-turn conversation orchestration: streaming via `client.messages.stream()`, merging extractions into existing school profile, persisting completed conversations to Dexie.
8. **View router (MODIFY App.tsx)** — expand `View` union type from 5 to ~9 views. Add `viewStack` array with `navigate()`/`goBack()` helpers for back-button behavior. No third-party router library needed for this internal tool.

**Key patterns to follow across all phases:** Zustand for ephemeral UI state; Dexie + `useLiveQuery` for persistent domain data; pure functions for all calculations with no side effects; batch all store updates in a single action function (never call multiple setters directly from components); pre-compute all export data as plain objects before entering the PDF generation pipeline (PDF components never read from stores).

---

### Critical Pitfalls

1. **Single-school store assumption baked into everything** — Both stores, `initialize()`, and all three engines implicitly assume exactly one school context. Must be the very first task in Phase 1. Prevention: introduce `schoolId` as primary key throughout; use school-indexed structures `Record<schoolId, T>` rather than a `currentSchoolId` selector pattern that doesn't actually isolate state.

2. **localStorage migration causing silent data loss** — v1 stores have no explicit `version` field (defaults to 0). Adding v2 schema without a migration function silently resets all saved overrides. Prevention: add `version: 1` + identity migration function before any schema change; increment to `version: 2` with a proper transform; test with an actual v1 localStorage fixture exported from production.

3. **AI intake trusting LLM output without semantic validation** — Zod validates structure, not business rules. Claude may return `studentCounts: {havo: 2000}` for a small school, or a DIA price of EUR 5.20 when the known range is EUR 3.00–4.00. Prevention: semantic validation layer after Zod parse (student count ranges 50–3000, price plausibility checks against known ranges); mandatory confirmation screen between extraction and wizard pre-fill — never auto-submit.

4. **Browser PDF generation breaking on real Dutch content** — html2canvas and html2pdf.js fail on Recharts SVG elements, Tailwind CSS custom properties, variable-length content, and Dutch special characters. Prevention: use `@react-pdf/renderer` exclusively for DMU documents; pre-render Recharts charts to SVG strings and embed via `<Svg>`; pre-format all numbers as strings before passing to PDF components (`Intl.NumberFormat('nl-NL')` does not execute inside the React-PDF rendering context); define fixed-page templates per DMU role.

5. **Routing explosion from flat `useState<View>`** — v2 adds ~4 views with contextual parameters (which school, which export format). Without navigation history, there is no back-button support. Prevention: implement `viewStack` array with `navigate()`/`goBack()` before building any new view; this decision must be made in Phase 1, not retrofitted later.

6. **API key exposed in browser bundle** — `VITE_ANTHROPIC_API_KEY` with `dangerouslyAllowBrowser: true` is acceptable for fewer than 20 known internal users with a spending cap. Each new AI feature multiplies the abuse surface. Prevention: set a monthly spending cap in the Anthropic dashboard immediately; disable source maps in production (`build.sourcemap: false` in vite.config); document a proxy migration path for when user count grows beyond the safe threshold.

---

## Implications for Roadmap

Based on combined research, the natural phase structure follows hard feature dependencies and risk-front-loading principles.

### Phase 1: Data Layer and Architecture Foundation

**Rationale:** The single-school store assumption is the root cause of every potential v2 architectural bug. Eliminating it first — before any new feature is built on top of it — is the only safe path. Doing this in Phase 2 or 3 would require reworking every feature built before it. The routing scaffolding decision must also be made here: retrofitting navigation history after views are built costs significantly more than getting it right first.

**Delivers:** Multi-school data model with Dexie; v1 localStorage migration (one-time, transparent to users); `schools`, `conversations`, `priceOverrides`, `priceUpdates` Dexie tables; `useSchoolDBStore` and `usePriceDataStore` new stores; `schoolId`-aware modifications to both existing stores; `viewStack` navigation with back-button support; school list page shell and school detail page shell.

**Addresses:** School registry + persistence (P1 feature foundation); price staleness infrastructure groundwork

**Avoids pitfalls:** #1 (single-school assumption), #2 (localStorage migration), #5 (routing explosion)

**Research flag:** Standard patterns — Dexie and Zustand persist migration are well-documented with HIGH confidence sources. No `/gsd:research-phase` needed.

---

### Phase 2: School Intelligence and Enhanced AI Intake

**Rationale:** With the data layer established, the features that create daily value for accountmanagers can be built. Persisting school data and accumulating conversation notes is the core v2 value proposition. This phase is also where the API key hardening must be addressed — adding more AI features (streaming, price extraction) with a browser-exposed key multiplies risk.

**Delivers:** Enhanced conversation intake with multi-turn support and school profile linking; streaming AI responses via `client.messages.stream()` for real-time feel during calls; conversation history per school with past extractions visible; school-level price overrides with source attribution; pipeline status tracking (deal stage per school); API key hardening (source maps off, spending cap verified).

**Uses:** Dexie `conversations` table; `EnhancedIntakeSchema` extending existing `IntakeExtractionSchema` with `pricesMentioned`, `dealContext`, `conversationType` fields; `useLiveQuery` for reactive conversation history display.

**Avoids pitfalls:** #3 (AI validation — mandatory confirmation screen + semantic range checks), #6 (API key exposure)

**Research flag:** Standard patterns for Anthropic streaming; confirmation UX is established. No `/gsd:research-phase` needed.

---

### Phase 3: Calculation Enhancements

**Rationale:** The engines are pure functions and can be extended without affecting the data layer or UI shell established in Phases 1–2. These calculation features must exist before DMU export templates in Phase 4 can reference their outputs — the value engine produces the euro figures MT exports need, and the multi-year projection produces the data finance exports need.

**Delivers:** Hybrid scenario engine refactor (per-module savings calculation, "already Cito" identification, upsell opportunity ranking by savings amount + differentiator strength); value-beyond-price engine (five documented time-savings tasks converted to euros using school-size multiplier and adjustable hourly rate); multi-year cost projection (annual cost × years + inflation assumption + one-time migration costs in year 1); negotiation preparation card (composite pre-call view).

**Avoids pitfalls:** Engine-only changes with no new architectural risk. All engine changes require running `npx vitest run` before marking complete. JIJ prices should be flagged as estimates in upsell detection logic (known unreliability documented in PROJECT.md).

**Research flag:** Standard pure-function patterns. No `/gsd:research-phase` needed.

---

### Phase 4: DMU-Targeted Export

**Rationale:** DMU exports have the most dependencies of any v2 feature — PDF infrastructure, value engine output, multi-year projections, and school profile data all must exist first. Building them last means all inputs are available and proven. Starting with one basic template before building three DMU-specific ones reduces the risk of discovering PDF generation issues after all three templates are written.

**Delivers:** Basic comparison summary PDF (single template proving the `@react-pdf/renderer` infrastructure); coordinator, MT, and finance DMU-targeted PDF templates; `export-renderer.ts` pure engine function; `ExportPreviewPage` with DMU role selector; Cito-branded headers, fonts via `Font.register()`, and color constants (#003082, #FF6600); price admin page for global price management and staleness review.

**Uses:** `@react-pdf/renderer` v4.3.2; pre-computed export data objects (never read from stores inside PDF components); SVG pre-rendering for any charts embedded in exports.

**Avoids pitfalls:** #4 (PDF generation failures — React-PDF native rendering, SVG pre-rendering for charts, pre-formatted Dutch currency strings, fixed-page templates tested with min/max content edge cases).

**Research flag:** `/gsd:research-phase` RECOMMENDED before implementation. The specific pattern of pre-rendering Recharts SVG to strings and embedding via `@react-pdf/renderer`'s `<Svg>` component in a React 19 + Vite 8 environment has real-world edge cases worth validating before building three templates. One targeted research session on this specific integration can prevent significant rework.

---

### Phase Ordering Rationale

- **Phase 1 must be first:** The single-school assumption is a structural defect that becomes exponentially harder to fix as features are built on top of it. No exceptions.
- **Phase 2 before Phase 3:** Accountmanagers need to accumulate school data before upsell detection has anything to detect; conversation history must exist before the negotiation prep card has content to aggregate.
- **Phase 3 before Phase 4:** Value engine and multi-year projection numbers must exist before DMU export templates can reference them. MT export needs euro figures from the value engine; finance export needs multi-year projections.
- **Auto-price-update pipeline deferred:** Manual entry with verification is sufficient for annual price list updates. Document parsing and web lookup add disproportionate complexity relative to update frequency (once a year for VO market pricing).

### Research Flags

**Needs `/gsd:research-phase` during planning:**
- **Phase 4 (DMU Exports):** `@react-pdf/renderer` + Recharts SVG chart embedding in React 19 + Vite 8. The SVG pre-rendering path and `<Svg>` embedding approach is documented but has known edge cases (clip paths, gradients, dynamic sizing) that should be validated with a working prototype before building three templates.

**Standard patterns — skip `/gsd:research-phase`:**
- **Phase 1 (Data Layer):** Dexie.js schema definition, Zustand persist migration, and IndexedDB patterns are thoroughly documented with HIGH confidence sources.
- **Phase 2 (AI Intake):** Anthropic streaming API is fully documented; the multi-turn conversation pattern using a message history array in Zustand is standard.
- **Phase 3 (Calculation Engines):** Pure function extension of existing tested engines; no external dependencies or undocumented patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All three new packages verified via npm + official docs. Version compatibility confirmed (React 19 + @react-pdf/renderer since v4.1.0, Dexie v4.3.0 framework-agnostic). Installation command and bundle impact quantified. |
| Features | MEDIUM-HIGH | P1/P2 features derived from project context (PROJECT.md) and direct codebase analysis. Differentiator features cross-referenced against general sales intelligence platform patterns (Claap, Outreach, ZoomInfo). Dutch VO education market specifics based on PROJECT.md and existing codebase, not independent external validation. |
| Architecture | HIGH | Based on direct codebase inspection of existing stores (`store.ts` files), engines, and `App.tsx`. Integration patterns derived from reading actual source files. Component boundaries and data flow diagrams reflect the real v1 structure. |
| Pitfalls | HIGH | Most pitfalls identified through direct codebase analysis (single-school assumption from store.ts, localStorage version field absence from persist config, cross-store coupling in price-comparison store). PDF generation pitfalls from React-PDF documentation and known html2canvas limitations. AI validation pitfall from known v1 issue (DIA prices 35% overestimated, documented in PROJECT.md). |

**Overall confidence:** HIGH

### Gaps to Address

- **Dutch number formatting inside React-PDF:** `Intl.NumberFormat('nl-NL')` executes in the browser but not inside the `@react-pdf/renderer` rendering context. The mechanism for pre-formatting EUR amounts as strings (symbol placement, comma as decimal separator) needs a working code example established before Phase 4 implementation begins.
- **IndexedDB fallback for private browsing:** Safari in private mode limits IndexedDB storage. The graceful degradation behavior when IndexedDB is unavailable (session-only storage fallback? user warning?) should be defined explicitly during Phase 1 planning.
- **JIJ price confidence model:** PROJECT.md documents JIJ estimates as unreliable. The upsell detection and value engine should treat JIJ prices as estimates with explicit uncertainty flagging rather than as comparable data points. Define the confidence tier model during Phase 3 planning.
- **Cito brand font files:** `Font.register()` for PDF templates requires actual font file paths/URLs. Confirm the exact Cito-approved font family and whether font files are available in the project assets before Phase 4 to avoid mid-implementation blockers.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase analysis: `src/features/school-profile/store.ts`, `src/features/price-comparison/store.ts`, `src/lib/ai-intake.ts`, `src/App.tsx`, `src/engine/` — v1 architecture, pitfall identification, integration points
- `.planning/PROJECT.md` — domain constraints, DMU roles, pricing landscape, known v1 issues, explicit anti-features
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) v4.3.2 — React 19 compatibility confirmed since v4.1.0
- [react-pdf.org/compatibility](https://react-pdf.org/compatibility) — React 19 support documentation
- [Dexie.js npm](https://www.npmjs.com/package/dexie) v4.3.0 — 922K weekly downloads, TypeScript-first
- [Dexie React hooks docs](https://dexie.org/docs/libs/dexie-react-hooks) — `useLiveQuery` API, version 4.2.0
- [Anthropic streaming docs](https://docs.anthropic.com/en/api/messages-streaming) — `messages.stream()` API
- [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — `messages.parse()` with Zod

### Secondary (MEDIUM confidence)

- [Claap: Sales Intelligence Guide 2026](https://www.claap.io/blog/sales-intelligence-guide) — general sales intelligence platform feature patterns
- [The Insight Collective: B2B DMU Guide](https://www.theinsightcollective.com/insights/the-b2b-decision-making-unit-dmu-the-real-faces-of-persuasion) — DMU role-specific content targeting
- [ZoomInfo: AI Note-Taking for Sales](https://pipeline.zoominfo.com/sales/ai-note-taking-call-analysis-sales) — conversation intelligence patterns
- [Insight7: AI Upsell Opportunity Detection](https://insight7.io/best-ai-tools-for-identifying-upsell-opportunities-in-sales-conversations-2/) — upsell signal detection patterns
- Zustand persist middleware documentation — migration and versioning patterns

### Tertiary (LOW confidence — validate during implementation)

- React-PDF + Recharts SVG embedding: documented pattern, real-world edge cases need verification before Phase 4 implementation
- Zustand persist async storage adapter for IndexedDB: documented in middleware, practical implementation needs a working test before Phase 1 ships

---

*Research completed: 2026-03-21*
*Ready for roadmap: yes*
