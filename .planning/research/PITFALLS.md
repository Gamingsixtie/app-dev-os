# Pitfalls Research

**Domain:** Adding sales intelligence features to an existing educational pricing comparison SPA
**Researched:** 2026-03-21
**Confidence:** HIGH (based on codebase analysis + domain patterns)

## Critical Pitfalls

### Pitfall 1: Single-School Store Assumption Baked Into Everything

**What goes wrong:**
The current `useSchoolProfileStore` persists one flat profile under a single localStorage key (`rekentool-school-profile`). The `usePriceComparisonStore` calls `useSchoolProfileStore.getState()` directly to read "the school." Every engine function assumes there is exactly one school context. Moving to multi-school profiles means the entire data flow — stores, engines, UI — assumes a singleton school that does not exist anymore.

**Why it happens:**
v1 was correctly scoped to one school at a time. The temptation is to "just add a school selector that swaps the active profile" without realizing that both stores, the `initialize()` method, the `recalculate()` method, and all three engines read from the same global singleton. Swapping the profile store does not automatically invalidate cached comparison results, draft overrides, or migration settings in the other store.

**How to avoid:**
- Introduce a `schoolId` concept as the primary key. Every piece of state that is school-specific (profile, comparison results, overrides, migration settings) must be keyed by `schoolId`.
- Do NOT store multiple schools in a single Zustand store with a `currentSchoolId` selector. Instead, use a school-indexed structure: `Record<string, SchoolProfile>` for profiles and `Record<string, PriceComparisonState>` for results.
- When switching schools, the comparison store must fully reinitialize — not just recalculate with stale overrides from the previous school.
- Move from localStorage (5MB limit, no indexing) to IndexedDB for multi-school data. localStorage will hit size limits with 10+ school profiles containing conversation history.
- Keep the engines pure: pass `schoolProfile` as an argument (they already do this implicitly through `selectedModules` + `studentCounts`). Do NOT make engines aware of the store.

**Warning signs:**
- Any code that calls `useSchoolProfileStore.getState()` without a schoolId parameter
- Draft/applied overrides that persist after switching to a different school
- Comparison results from school A appearing briefly when loading school B

**Phase to address:**
Phase 1 (Data Layer Refactor). This must be the FIRST thing built in v2. Everything else depends on it.

---

### Pitfall 2: AI Intake Extraction Trusting LLM Output Without Validation

**What goes wrong:**
The current `extractIntakeFromNotes()` returns `IntakeExtraction` via `messages.parse()` with a Zod schema. But Zod only validates structure, not semantics. The LLM might return `studentCountsPerLevel: { "havo": 2000 }` for a small school, or map "DIA spelling" to `moduleId: "nederlands"` when it should be `taalverzorging`, or return a `pricePerStudent` of `520` (euros instead of cents, or total instead of per-student). The wizard then pre-fills with confidently wrong data.

**Why it happens:**
Structured output gives a false sense of safety. The schema validates types but not business rules. Developers test with clean notes and miss the messy reality: consultants write shorthand, mix Dutch and English, mention prices as totals ("kost ons 4000 euro per jaar"), and use informal product names.

**How to avoid:**
- Add a semantic validation layer AFTER the Zod parse: student counts within reasonable ranges (50-3000 per level), prices within known ranges per provider (EUR 1-50 per student), module IDs only from the catalog.
- Surface the `unsureAbout` array prominently — it is already in the schema but the UI must make these warnings impossible to miss. Use an amber banner, not a footnote.
- NEVER auto-submit intake results to the wizard. Always show a confirmation screen where the consultant reviews and corrects extracted data before it flows into calculations.
- Add price sanity checks: if extracted `pricePerStudent` is >10x or <0.1x the known publication price for that provider/module, flag it as "seems unusual — please verify."
- For the v1 mistake of DIA prices being 35% overestimated: build automatic cross-referencing against known price ranges per provider. If AI extracts a DIA price of EUR 5.20 when the known range is EUR 3.00-4.00, flag it.

**Warning signs:**
- No confirmation screen between AI extraction and wizard pre-fill
- No range validation on extracted prices
- Test suite only uses well-formatted input notes

**Phase to address:**
Phase 2 (AI Intake). The validation layer must be built alongside the extraction, not after.

---

### Pitfall 3: Browser-Side PDF Generation That Breaks on Real Content

**What goes wrong:**
Client-side PDF generation (html2canvas + jsPDF, or html2pdf.js, or @react-pdf/renderer) works in demos with simple content but fails on: Recharts SVG charts (render as blank), Tailwind CSS custom properties (not resolved by html2canvas), dynamic content that overflows pages, Dutch special characters (IJ ligature, diacritics in names), right-to-left currency formatting (EUR symbol placement), and large tables that need intelligent page breaks.

**Why it happens:**
PDF generation is tested with a single hardcoded comparison. Real school reports have variable content length (1-6 modules, 1-3 providers with data, variable conversation history). The "it works on my screen" problem is acute because PDF rendering depends on browser, screen resolution, font loading state, and exact content dimensions.

**How to avoid:**
- Use `@react-pdf/renderer` for DMU exports — it generates PDF natively without DOM-to-canvas conversion. This avoids all html2canvas problems. The tradeoff is that you must rebuild the layout in React-PDF components, not reuse your web components.
- For charts in PDF: pre-render Recharts to SVG strings, then embed via `<Svg>` in React-PDF. Do NOT screenshot canvas elements.
- Define fixed page templates per DMU role (coordinator gets 2-page summary, MT gets 1-page executive overview, finance gets detailed 4-page breakdown). Fixed templates are vastly more reliable than dynamic-length documents.
- Test PDF generation with: zero modules selected, all 6 modules selected, a school with only VMBO (4 years), a school with all 5 levels (max data), modules where competitors have no price (null cells), and stale price warnings visible.
- Dutch number formatting in PDF: `Intl.NumberFormat('nl-NL')` works in the browser but React-PDF runs in a different context. Pre-format all numbers as strings before passing to PDF components.

**Warning signs:**
- PDF generation code uses html2canvas or html2pdf.js
- Charts appear as blank rectangles in generated PDFs
- No test with maximum-length content (all modules, all levels, all providers)
- PDF tests only run manually, not in CI

**Phase to address:**
Phase 4 (DMU Exports). But the architectural decision (React-PDF vs. html2canvas) must be made in Phase 1 because it affects component design.

---

### Pitfall 4: Price Versioning Without a Migration Strategy for Existing localStorage Data

**What goes wrong:**
v1 stores prices and overrides in localStorage under `rekentool-price-comparison`. v2 adds price versioning, staleness tracking, school-keyed data, and conversation history. The first time a v2 build loads, it reads the v1 localStorage shape, fails to parse it (different schema), and either crashes or silently resets all saved data. Accountmanagers who had carefully entered price overrides lose everything.

**Why it happens:**
Zustand's `persist` middleware has a `version` field and `migrate` function, but developers either forget to implement migration or test it only with empty state. The v1 stores have no version number set (defaults to 0). Adding a version without a proper `migrate` function for version 0 -> 1 causes silent data loss.

**How to avoid:**
- Before any store schema changes, add explicit `version: 1` to the current v1 persist config and a `migrate` function that handles version 0 (no version field) -> version 1 (current shape, explicitly typed).
- For the v2 schema changes, increment to `version: 2` with a proper migration function that transforms v1 shape to v2 shape: wrap the single profile in a `schools` record, add `schoolId` keys, preserve overrides under the correct school.
- Test migration with actual v1 localStorage snapshots. Export a real v1 state blob, put it in a test fixture, and verify the migration produces valid v2 state.
- For IndexedDB migration (if moving from localStorage): read from localStorage on first load, write to IndexedDB, then clear the localStorage keys. Include a "migration complete" flag to avoid re-running.
- Never use `persist({ ... })` without an explicit `version` number. The implicit version 0 makes future migrations ambiguous.

**Warning signs:**
- Zustand persist configs without explicit `version` fields
- No migration test fixtures from v1 state
- Store tests only use freshly created state, never deserialized state

**Phase to address:**
Phase 1 (Data Layer Refactor). Must be the first change to the stores, before any schema changes.

---

### Pitfall 5: Routing Explosion Without Navigation State Management

**What goes wrong:**
v1 uses `useState<View>` in App.tsx with 5 views. v2 adds school list, school detail, intake per school, export preview, price management, and conversation history — potentially 10+ views. The `useState` approach has no URL state (no back button, no deep linking, no browser history), and the flat union type becomes unwieldy. Worse, some views need context (which school? which module detail? which export format?) that is not captured in the view type.

**Why it happens:**
v1's `useState<View>` was appropriate for a wizard + results flow. Developers add new views to the union type one at a time without noticing the pattern breaking down. By view 8, the App.tsx becomes a 200-line switch statement with implicit dependencies on store state to determine "which sub-view am I actually on?"

**How to avoid:**
- Introduce a lightweight client-side router. For an SPA that does not need SEO, TanStack Router or even a simple hash-based router suffices. Do NOT add React Router's full complexity if you do not need SSR or data loading.
- Use URL state for school context: `#/schools/:schoolId/comparison`, `#/schools/:schoolId/export/mt`. This gives back-button support, deep linking, and makes the current context explicit.
- Keep the flat view approach ONLY if v2 stays under 7 views. If it exceeds 7, the lack of URL state becomes a UX problem (accountmanagers cannot bookmark a specific school's comparison).
- Do NOT introduce the router mid-development. Decide in Phase 1 and implement before building new views. Retrofitting routing into existing view components requires touching every navigation call.

**Warning signs:**
- App.tsx view union type exceeds 7 entries
- Views that need parameters (schoolId, exportType) passed via store state instead of URL
- Users complaining that the back button does not work
- Test scenarios that require a specific sequence of view transitions to reach a state

**Phase to address:**
Phase 1 (Architecture). The routing decision must be made before any new views are built.

---

### Pitfall 6: Anthropic API Key Exposed in Browser Bundle

**What goes wrong:**
The current `ai-intake.ts` uses `VITE_ANTHROPIC_API_KEY` with `dangerouslyAllowBrowser: true`. This is acceptable for an internal-only Cito tool with limited distribution. But v2 expands usage (more accountmanagers, potentially shared links, school-facing exports). The API key is in the JavaScript bundle. Anyone with browser DevTools can extract it and use it for their own purposes, running up Cito's bill.

**Why it happens:**
v1 was a prototype/internal tool. The `dangerouslyAllowBrowser` flag is explicitly named as a warning but was accepted as a conscious tradeoff. As the tool grows in users and features (more AI calls for intake, potentially AI-assisted price lookups), the risk surface grows.

**How to avoid:**
- For v2 with a limited user base (< 20 accountmanagers): the current approach is acceptable IF the API key has spending limits set in the Anthropic dashboard and usage is monitored.
- For broader distribution: add a thin proxy endpoint (Cloudflare Worker, Vercel Edge Function, or Netlify Function) that holds the API key server-side and forwards requests. The SPA calls the proxy, not Anthropic directly.
- At minimum: set a monthly spending cap on the Anthropic API key, enable usage alerts, and rotate the key quarterly.
- Do NOT add more AI features (price lookups, report generation) with the browser-exposed key pattern. Each new AI feature multiplies the abuse surface.

**Warning signs:**
- Multiple `VITE_*` environment variables containing API keys
- No spending limits on the Anthropic dashboard
- AI features that make many calls per user session (e.g., real-time price lookup for every module change)

**Phase to address:**
Phase 2 (AI Intake hardening). Decide the proxy vs. browser-key tradeoff explicitly based on expected user count.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `useState<View>` for routing | No new dependency, fast to add views | No URL state, no back button, no deep linking, App.tsx becomes unmanageable | Only if v2 stays at < 7 total views |
| Store all schools in localStorage | No IndexedDB learning curve | 5MB limit hit with ~15 schools including conversation history, no structured queries | MVP with < 10 schools per user |
| Use html2canvas for PDF | Reuse existing web components in PDF | Blank charts, font issues, page break failures, inconsistent across browsers | Never for production DMU exports |
| Hardcode 3 providers in engine | Simple comparison logic | Adding a 4th provider (e.g., Diataal, RTTI) requires changes across engine + data + UI + tests | Acceptable until a 4th provider is confirmed |
| Browser-exposed API key | No backend needed | Key extractable, no usage control per user, abuse risk | < 20 known internal users with spending cap |
| Single Zustand store for all school data | Simple architecture | Cannot handle multi-school without major refactor | Only for v1 single-school scope |

## Integration Gotchas

Common mistakes when connecting new v2 features to the existing v1 codebase.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| AI intake -> Wizard pre-fill | Directly calling `setLevels()`, `setStudentCounts()`, `setSelectedModules()` from intake results, triggering multiple re-renders and intermediate invalid states | Batch all store updates in a single `applyIntakeResult(extraction)` action that validates, transforms, and sets all fields atomically |
| Multi-school -> Comparison store | Adding a `currentSchoolId` to the existing store and using `if (schoolId === currentSchoolId)` guards everywhere | Restructure stores to be school-indexed from the start: `schools: Record<schoolId, SchoolProfile>`, `comparisons: Record<schoolId, ComparisonState>` |
| Price versioning -> Existing overrides | Adding `version` fields to `PriceRecord` but not updating `mergeOverrides()` to check whether an override applies to the current price version | Overrides must reference the price version they were created against. When the base price changes, stale overrides should be flagged, not silently applied |
| New views -> Existing App.tsx | Adding `if (view === 'school-list') return <SchoolList />` blocks to the growing conditional chain | Extract routing to a dedicated component/router before adding new views |
| IndexedDB -> Zustand persist | Using `zustand/persist` with a custom `getStorage()` that wraps IndexedDB in synchronous localStorage API | Use `zustand/persist` with the `createJSONStorage()` helper and an async storage adapter (e.g., idb-keyval). The persist middleware supports async storage natively |
| DMU exports -> Comparison data | Reading from `usePriceComparisonStore` inside PDF components, which run outside React's rendering context | Pre-compute all export data as a plain object before entering the PDF generation pipeline. PDF components receive data as props, never read from stores |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recalculating all 3 engines on every store change | Sluggish UI after entering student counts, visible delay before charts update | Debounce recalculation (300ms), only recalculate the active engine (comparison OR current-vs-proposed OR migration, not all three) | > 20 modules or complex override sets |
| Loading all school profiles into memory on startup | Slow initial load, high memory usage on tablets | Load school list (id + name only) initially, load full profile on selection | > 30 saved school profiles |
| Re-rendering entire comparison table when one override changes | Jank when editing prices in the comparison view | Memoize `ModuleComparison` rows, use `React.memo` with custom comparator that checks only that row's data | > 10 modules displayed simultaneously |
| Conversation history stored as full text in store state | Store serialization becomes slow, localStorage writes take > 100ms | Store conversation summaries in the store, full transcripts in IndexedDB separately | > 50 conversations per school |
| PDF generation blocking the main thread | UI freezes for 2-5 seconds during export | Use Web Worker for PDF generation, or at minimum use `requestIdleCallback` to break work into chunks | PDFs with charts + tables exceeding 4 pages |

## Security Mistakes

Domain-specific security issues for this tool.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing competitor pricing intelligence in localStorage without encryption | A school using the same computer could inspect localStorage and see Cito's competitive intelligence, pricing strategies, and notes about their school | For internal-only mode: acceptable risk with clear training. For any school-facing deployment: encrypt sensitive fields or use session storage that clears on close |
| API key in VITE_ environment variable visible in source maps | Source maps in production expose the full API key string | Disable source maps in production build (`build.sourcemap: false` in vite.config), or move to proxy pattern |
| AI intake processing school-identifiable data through external API | Student counts, provider usage, and pricing data for specific schools flows through Anthropic's API | Acceptable for Cito (Anthropic does not train on API data). Document in privacy assessment. If regulations change, the proxy pattern allows adding anonymization |
| No rate limiting on AI intake calls | A bug or misuse could generate hundreds of API calls, exhausting the budget | Implement client-side rate limiting: max 1 call per 10 seconds, max 20 calls per session. Check `Retry-After` headers from Anthropic API |

## UX Pitfalls

Common user experience mistakes when adding intelligence features to an existing simple tool.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| AI intake as the primary/default entry point | Accountmanagers who prefer manual entry feel forced into AI flow. Not everyone has messy notes — some want to fill the form directly | Keep wizard as default. AI intake as an explicit alternative ("Begin met gespreksnotities" button, already correctly positioned in v1) |
| School list as a complex management interface | Accountmanagers are not CRM power users. A school list with filters, sorting, tags, and bulk operations overwhelms | Simple chronological list with search. Last-used school at top. Add/remove only. No tags, no categories, no bulk operations in v2 |
| Export format selection with too many options | "PDF, Excel, Word, HTML, email, clipboard" — decision fatigue | Three DMU-targeted presets only: "Voor coordinator", "Voor MT", "Voor finance". Format is PDF, always. Content varies by audience |
| Showing AI confidence scores to end users | "85% confidence" means nothing to an accountmanager. They either trust the extraction or they don't | Show the extracted data for review. Highlight fields the AI was unsure about (from `unsureAbout` array). No numeric scores |
| Price update notifications interrupting workflow | "3 prices are stale" modal on every app open | Show staleness in-context (badge on affected prices). Dedicated "Prijsbeheer" view for bulk updates. Never interrupt the comparison workflow |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Multi-school profiles:** Profile switching works -- verify that comparison results, overrides, and migration settings are correctly scoped to each school and do not leak between profiles
- [ ] **AI intake:** Extraction returns structured data -- verify that semantic validation catches out-of-range prices, impossible student counts, and mismatched module/provider combinations
- [ ] **Store migration:** v2 store loads correctly -- verify with actual v1 localStorage data (export a real v1 state, load in v2, confirm no data loss)
- [ ] **PDF export:** PDF generates for coordinator view -- verify with MT and finance views too, with max-length content (all modules, all levels), and on a tablet
- [ ] **Price versioning:** Prices have version numbers -- verify that overrides created against version N are flagged when the base price updates to version N+1
- [ ] **IndexedDB persistence:** Data saves to IndexedDB -- verify behavior when IndexedDB is unavailable (private browsing on some browsers), when storage quota is exceeded, and when two tabs access simultaneously
- [ ] **Dutch formatting:** Currency shows EUR symbol -- verify that `Intl.NumberFormat('nl-NL')` is used consistently in PDF output, clipboard copy, and print CSS, not just in React components
- [ ] **Conversation history:** Notes are saved per school -- verify that search across schools works, that long conversations do not slow down the UI, and that history persists across browser sessions
- [ ] **Routing:** New views are navigable -- verify that the browser back button works, that refreshing the page returns to the same view, and that deep links to a specific school's comparison work

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Store data corruption from failed migration | MEDIUM | Implement a "Reset lokale data" button that clears all stores with confirmation. Export current data to JSON before reset. Provide import function to restore from backup |
| API key leaked/abused | LOW | Rotate key immediately in Anthropic dashboard. Update `.env.local` for all users. Implement proxy to prevent future exposure |
| PDF generation producing broken output | MEDIUM | Fall back to browser print (`window.print()`) with print CSS as emergency alternative. Fix PDF template offline |
| Multi-school data leak (wrong school's data shown) | HIGH | Add schoolId assertion checks in all engine calls. If mismatch detected, force re-initialization. Add integration test that switches schools and verifies isolation |
| AI intake producing confidently wrong data | LOW | The confirmation screen is the recovery mechanism. If it was skipped and wrong data entered the wizard, the wizard allows manual correction at each step |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| #1 Single-school store assumption | Phase 1 (Data Layer) | Integration test: create school A, add overrides, switch to school B, verify A's overrides are not visible, switch back to A, verify overrides are preserved |
| #2 AI intake trusting LLM output | Phase 2 (AI Intake) | Unit tests with adversarial inputs: prices as totals, ambiguous module names, incomplete notes, mixed languages. Verify validation catches all |
| #3 Browser PDF generation failures | Phase 1 (Architecture decision) + Phase 4 (Implementation) | Visual regression tests comparing generated PDF against golden snapshots for each DMU template with min/max content |
| #4 localStorage migration | Phase 1 (Data Layer, first task) | Migration test with exported v1 state fixture. CI test that deserializes v1 state, runs migration, validates v2 schema |
| #5 Routing explosion | Phase 1 (Architecture) | After adding 3rd new view: verify back button works through full navigation sequence, verify URL reflects current state, verify refresh preserves view |
| #6 API key exposure | Phase 2 (AI Intake) | Verify production build has no source maps. Verify API key spending limit is set. Document proxy migration path for future scaling |

## Sources

- Codebase analysis: `src/features/school-profile/store.ts`, `src/features/price-comparison/store.ts`, `src/lib/ai-intake.ts`, `src/App.tsx` — direct inspection of v1 architecture
- Zustand persist middleware documentation — migration and versioning patterns
- Known v1 issues from PROJECT.md: DIA prices 35% overestimated, module mapping too simplistic, JIJ estimates unreliable
- React-PDF documentation — client-side PDF generation patterns and limitations
- IndexedDB browser storage limits and async access patterns
- Anthropic API documentation — `dangerouslyAllowBrowser` usage constraints and rate limiting

---
*Pitfalls research for: Rekentool VO v2 Sales Intelligence Platform*
*Researched: 2026-03-21*
