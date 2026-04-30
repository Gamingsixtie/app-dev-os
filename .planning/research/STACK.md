# Stack Research — v2.0 Sales Intelligence Additions

**Domain:** Sales intelligence platform (AI intake, school persistence, DMU exports, price updates)
**Researched:** 2026-03-21
**Confidence:** HIGH (core libraries verified via npm/official docs)

> This document covers ONLY new stack additions for v2.0. The v1.0 stack (React 19, TypeScript, Vite 8, Tailwind CSS 4, Zustand, Zod v4, Vitest, Recharts 3, Anthropic SDK, react-hook-form) is validated and unchanged.

## Existing Stack Reference

Already validated in v1.0 -- listed for integration context only:

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.4 | UI framework |
| TypeScript | ~5.9.3 | Type safety |
| Vite | ^8.0.1 | Build tooling |
| Tailwind CSS | ^4.2.2 | Styling |
| Zustand | ^5.0.12 | State management (with persist middleware -> localStorage) |
| Zod | ^4.3.6 | Schema validation |
| Vitest | ^4.1.0 | Testing |
| Recharts | ^3.8.0 | Charts |
| @anthropic-ai/sdk | ^0.80.0 | AI integration (Claude Haiku 4.5) |
| react-hook-form | ^7.71.2 | Form management |
| @hookform/resolvers | ^5.2.2 | Zod-to-RHF bridge |

## New Stack Additions

### 1. School Data Persistence -- Dexie.js

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| dexie | ^4.3.0 | IndexedDB wrapper for school profiles, conversations, deals, price snapshots | Best-in-class IndexedDB abstraction. TypeScript-first, reactive queries via `useLiveQuery`, handles schema migrations, 922K+ weekly downloads. Current Zustand+localStorage is fine for session state but inadequate for relational school data (profiles linked to conversations linked to deals). Dexie gives structured querying without a server. |
| dexie-react-hooks | ^4.2.0 | Reactive React hooks for Dexie queries | `useLiveQuery` auto-rerenders components when IndexedDB data changes -- same reactivity pattern as Zustand but for persistent data. No manual subscription wiring. |

**Why Dexie over alternatives:**

| Alternative | Why Not |
|-------------|---------|
| Raw IndexedDB | API is notoriously painful -- callback-heavy, no migrations, no TypeScript support. Dexie wraps it cleanly. |
| localStorage (current) | Flat key-value store, ~5MB limit. School profiles with conversation history and price snapshots need structured queries ("all conversations for school X sorted by date"). IndexedDB has no practical size limit. |
| RxDB | Overkill. Adds observables, replication protocols, complex setup. This is a single-user local tool -- no sync needed. |
| sql.js (SQLite in WASM) | ~1MB WASM runtime, no native React hooks, manual persistence to IndexedDB anyway. Dexie is lighter and more idiomatic for browser-first apps. |

**Integration with Zustand:** Keep Zustand for ephemeral UI state (current wizard step, active view, draft overrides, streaming conversation state). Use Dexie for persistent domain data (school profiles, conversation logs, price snapshots, deals). Components read persistent data via `useLiveQuery`; store actions write to Dexie via `db.schools.put()`.

**Schema migration story:** Dexie handles IndexedDB version upgrades declaratively. When the data model changes, increment the version number and Dexie migrates existing data. Critical for a tool that accumulates school intelligence over time.

### 2. AI Conversation Streaming -- No New Dependency

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @anthropic-ai/sdk | ^0.80.0 (existing) | Streaming conversation + structured extraction | Already installed. The SDK's `client.messages.stream()` method provides real-time token streaming with event handlers (`on('text')`, `on('message')`). No new dependency needed. |

**What changes from v1.0 to v2.0:**

The current `ai-intake.ts` uses `messages.parse()` -- a single request/response for structured extraction. For real-time conversation intake during phone calls, the pattern shifts:

1. **Streaming responses** via `client.messages.stream()` -- shows AI analysis appearing in real-time as the consultant types notes. Uses the same `dangerouslyAllowBrowser: true` pattern already in place.
2. **Multi-turn conversation** -- maintain message history in Zustand (array of `{role, content}` pairs). Each new consultant note appends to history, Claude responds with updated analysis.
3. **Structured extraction at end** -- when consultant finishes the call, one final `messages.parse()` call with the full conversation to extract the structured `IntakeExtraction` result (same Zod schema, already built).
4. **Persist to Dexie** -- completed conversations saved to `conversations` table linked to school profile.

**Why NOT Vercel AI SDK (`ai` package):** Adds 200KB+ multi-provider abstraction layer for multi-provider support we do not need. This tool exclusively uses Claude Haiku 4.5. The `@anthropic-ai/sdk` already handles streaming, structured output, and conversation history natively. Adding `ai` would mean two abstraction layers over the same API.

### 3. DMU-Targeted Document Export -- @react-pdf/renderer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @react-pdf/renderer | ^4.3.2 | PDF generation from React components | React-native JSX syntax for PDF creation. Supports Flexbox layout, custom fonts, images, and styled components. Compatible with React 19 since v4.1.0. 860K+ weekly downloads, actively maintained. Generates PDFs entirely client-side. |

**Why @react-pdf/renderer for DMU exports:**

- **React-native approach:** Define PDF documents using JSX (`<Document>`, `<Page>`, `<View>`, `<Text>`) with a styling API similar to React Native's StyleSheet. Cito branding (#003082, #FF6600) maps directly to style objects.
- **DMU-targeted templates:** Each DMU persona (coordinator, MT, finance) gets a different React component tree that renders to PDF. Same calculation data, different presentation -- pure React composition.
- **Client-side only:** No backend PDF service. Generated in the browser via `pdf().toBlob()` and offered as download.
- **Cito branding:** Custom fonts via `Font.register()`. Colors, margins, headers fully controllable per persona template.

**Why this is a v1.0 stack decision REVERSAL:**

The v1.0 STACK.md recommended against PDF libraries ("jsPDF/html2pdf.js adds 150KB+ for inferior output") and recommended `react-to-print` + print CSS instead. That was correct for v1.0's scope (printing the screen). v2.0 changes the requirement fundamentally:

- DMU exports need **distinct documents per persona** -- the coordinator sees feature comparisons, finance sees multi-year projections, MT sees an executive summary. These are not screen captures; they are tailored documents.
- `react-to-print` mirrors screen content. It cannot produce three different documents from the same data.
- `@react-pdf/renderer` produces purpose-built PDFs with controlled layout, pagination, headers/footers, and branding per document type.

**Print CSS still useful:** For simple "print this screen" (comparison results, migration business case), keep Tailwind's `print:` variant. No library needed for that. `@react-pdf/renderer` handles the complex DMU documents.

| Use Case | Solution |
|----------|----------|
| Print current comparison view | Tailwind `print:` variant + `window.print()` |
| DMU export: Coordinator rapport | `@react-pdf/renderer` with coordinator template |
| DMU export: MT business case | `@react-pdf/renderer` with MT template |
| DMU export: Finance meerjarenprojectie | `@react-pdf/renderer` with finance template |

### 4. Auto-Price-Update Pipeline -- No New Dependencies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @anthropic-ai/sdk | ^0.80.0 (existing) | Document parsing via Claude for price extraction | Claude Haiku 4.5 extracts structured price data from pasted text (price lists, emails, web content). Same SDK, same `messages.parse()` pattern with a price-extraction Zod schema. |
| Zod | ^4.3.6 (existing) | Schema validation for extracted prices | Define `PriceUpdateSchema` with source attribution and expiry dates. Already the project's validation standard. |

**The pipeline is logic, not libraries:**

1. **Manual entry** -- React form with react-hook-form + Zod validation (existing pattern)
2. **Document paste** -- Consultant pastes price list text, Claude extracts structured prices via `messages.parse()` with a `PriceExtractionSchema`
3. **Persist** -- Validated prices saved to Dexie `priceSnapshots` table with source, date, expiry
4. **Agent-based lookup** -- Future phase (v2.x). Would use Claude with `tool_use` to navigate public price pages. Requires backend/proxy for web fetching -- flagged as out-of-scope for initial v2.0.

**Why no PDF parsing library:** Consultants paste text from price documents, not upload PDFs. Text extraction via Claude is simpler, more accurate for Dutch price tables, and uses zero additional dependencies. If PDF upload is needed later, add `pdf.js` then.

## Supporting Libraries

| Library | Version | Purpose | When to Add |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Date formatting/manipulation | Only if `src/lib/date-utils.ts` is insufficient for conversation timestamps and price expiry calculations. Evaluate first -- likely not needed. |

**Note:** The project has `src/lib/date-utils.ts` already. For price expiry warnings ("verlopen over 14 dagen") and conversation timestamps, native `Intl.DateTimeFormat` with `nl-NL` locale plus simple arithmetic may suffice. Only add `date-fns` if relative date formatting or complex date math becomes a real need.

## Installation

```bash
# New production dependencies for v2.0
npm install dexie@^4.3.0 dexie-react-hooks@^4.2.0 @react-pdf/renderer@^4.3.2
```

No new dev dependencies required. Total: 3 new packages.

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Vercel AI SDK (`ai`) | 200KB+ multi-provider abstraction. We only use Claude. The `@anthropic-ai/sdk` handles streaming, structured output, and conversation history natively. | `@anthropic-ai/sdk` directly |
| TanStack Query | No REST API to cache. This is local-first. Dexie's `useLiveQuery` provides reactive data for IndexedDB. | Dexie `useLiveQuery` |
| jsPDF | Manual coordinate-based layout. Unmaintainable for branded reports with tables and Dutch text. | `@react-pdf/renderer` |
| react-to-print (for DMU) | Only mirrors screen content. DMU exports need distinct per-persona layouts that differ from the screen. | `@react-pdf/renderer` for documents; Tailwind `print:` for screen printing |
| pdf-parse / pdf.js (input) | Over-engineering. Consultants paste text, not upload PDFs. Claude handles extraction. | `messages.parse()` with Zod schema |
| RxDB | Reactive database with sync/replication/conflict resolution. Massive overhead for single-user local tool. | Dexie.js |
| sql.js / wa-sqlite | ~1MB WASM runtime, no React hooks, manual IndexedDB persistence. | Dexie.js |
| Redux / MobX | Zustand is already validated and working. Adding another state library creates confusion. | Zustand (existing) |
| i18next | Dutch-only app for Dutch consultants at Dutch schools. Zero value from i18n. | Hardcoded Dutch strings |
| Firebase / Supabase | No backend needed. This is a local-first tool with no user accounts. | Dexie.js for persistence |
| date-fns (premature) | Do not add preemptively. Evaluate `src/lib/date-utils.ts` first. | Existing date utils + Intl API |

## Stack Patterns by Feature

### AI Conversation Intake

```
Zustand store: conversation messages[], isStreaming, currentAnalysis
  |
  v
client.messages.stream() -> real-time UI update via on('text')
  |
  v
Consultant ends call -> messages.parse() with IntakeExtractionSchema
  |
  v
Dexie: conversations.add({ schoolId, messages, extraction, date })
```

- Zustand holds ephemeral conversation state (streaming flag, message buffer)
- Anthropic SDK streams responses for real-time feel
- Final structured extraction uses existing `IntakeExtractionSchema`
- Completed conversations persist to Dexie linked to school profile

### School Intelligence

```
Dexie tables: schools, conversations, deals, priceSnapshots
  |
  v
useLiveQuery(() => db.schools.where('name').startsWith(query))
  |
  v
React components auto-rerender on data changes
```

- Dexie for all persistent relational data
- `useLiveQuery` for reactive UI (school list, conversation history, deal timeline)
- Zustand for ephemeral state (currently selected school, unsaved edits)

### DMU Export

```
Calculation engines (existing pure functions)
  |
  v
DMU template component (coordinator / MT / finance)
  |
  v
@react-pdf/renderer -> pdf().toBlob() -> download
```

- One `@react-pdf/renderer` component per DMU persona
- Shared data from existing calculation engines
- Cito branding via `Font.register()` and style constants
- `pdf().toBlob()` for download trigger

### Auto Price Updates

```
Text paste -> Claude messages.parse() with PriceExtractionSchema
  |
  v
Zod validation -> confirmed by consultant
  |
  v
Dexie: priceSnapshots.add({ provider, module, price, source, expiry })
  |
  v
Engines read latest prices from Dexie on next calculation
```

- No new libraries -- existing SDK + Zod + new Dexie table
- Every price has source attribution and expiry date
- Warning system when prices near expiry (pure date arithmetic)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @react-pdf/renderer@^4.3.2 | React 19 | Confirmed compatible since v4.1.0 |
| dexie@^4.3.0 | Any framework | Framework-agnostic core library |
| dexie-react-hooks@^4.2.0 | React 16.8+ (hooks API) | Uses React hooks internally |
| @anthropic-ai/sdk@^0.80.0 | Browser via `dangerouslyAllowBrowser` | Already validated in v1.0 |

## Dependency Impact

| Metric | Before (v1.0) | After (v2.0) | Delta |
|--------|---------------|--------------|-------|
| Production deps | 7 packages | 10 packages | +3 |
| Estimated new bundle | -- | ~180KB (react-pdf) + ~45KB (dexie) | ~225KB |
| New paradigms | -- | IndexedDB persistence, PDF generation, streaming AI | 3 |
| Backend required | No | No | No change |

The app remains a pure client-side SPA. No backend, no server, no database server. All new capabilities run entirely in the browser.

## Sources

- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) -- version 4.3.2, React 19 compatibility confirmed (HIGH confidence)
- [react-pdf.org/compatibility](https://react-pdf.org/compatibility) -- React 19 support since v4.1.0 (HIGH confidence)
- [Dexie.js npm](https://www.npmjs.com/package/dexie) -- version 4.3.0, 922K weekly downloads (HIGH confidence)
- [Dexie React hooks docs](https://dexie.org/docs/libs/dexie-react-hooks) -- useLiveQuery API, version 4.2.0 (HIGH confidence)
- [Anthropic streaming docs](https://docs.anthropic.com/en/api/messages-streaming) -- messages.stream() API (HIGH confidence)
- [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- output_config.format with Zod (HIGH confidence)
- [Anthropic SDK GitHub](https://github.com/anthropics/anthropic-sdk-typescript) -- dangerouslyAllowBrowser, streaming examples (HIGH confidence)
- [react-to-print npm](https://www.npmjs.com/package/react-to-print) -- v3.3.0, considered for screen printing only (HIGH confidence)

---
*Stack research for: Rekentool VO v2.0 Sales Intelligence additions*
*Researched: 2026-03-21*
