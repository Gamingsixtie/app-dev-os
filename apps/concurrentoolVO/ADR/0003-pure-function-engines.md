# ADR-0003: Pure-function engines (no side effects, no I/O, no state)

- **Status**: Accepted
- **Date**: 2026-05-01
- **Supersedes**: —
- **Scope**: per-app (concurrentoolVO only)

## Context

The pricing engines are the **commercial heart** of concurrentoolVO. Cito-consultants present their output during meetings with school decision-makers, and the numbers drive real procurement decisions worth tens of thousands of euros annually per school. Three engineering properties are non-negotiable for this code:

1. **Reproducibility**: same input must always give same output. A consultant who computes a comparison on Monday and re-opens it Tuesday must see identical numbers. If they don't, trust collapses.
2. **Testability**: every edge case in pricing logic must be coverable by deterministic unit tests. Discount stacking, schijnvoordeel-detection, hybrid scenarios, sensitivity analyses — these are easy to break in subtle ways.
3. **Auditability**: when a consultant or school decision-maker asks *"why does the tool say this?"*, the answer must be derivable from the inputs. No hidden state, no implicit cache, no LLM call, no async race condition.

The engines (`src/engine/*.ts`, 12 modules + `calculators/` sub-folder) are written as **pure functions**: signature `(inputs) => result`, no `this`, no module-level mutable state, no `fetch()`/`await`, no `console.log` (use `src/lib/logger.ts` upstream of the engine instead). Existing test suite (`src/engine/__tests__/`) verifies behavior across many scenarios.

## Decision

All engine modules in `src/engine/` MUST be pure functions:

- **No side effects** — no console writes, no DOM access, no `localStorage` reads/writes, no Supabase calls, no fetch
- **No state** — no module-level mutable variables, no closures over external state, no singletons
- **No I/O** — all data needed must be passed in as arguments. Tariffs, school profile, scenario configuration — all explicit parameters.
- **No async** — engines are synchronous. If something needs async (fetching tariffs, parsing documents), do it in the caller (e.g., a page component or `src/lib/`) and pass the resolved data into the engine.
- **Deterministic** — given identical inputs, identical output. No `Date.now()`, no `Math.random()`, no `crypto.randomUUID()` inside engines.

Caching, memoization, and async data fetching happen at the **call site** (typically inside React components via `useMemo`, or in `src/stores/` via Zustand selectors), NEVER inside the engine.

## Alternatives considered

- **Class-based engines with internal state** — `class PriceCalculator { tariffs; cache; calculate() {...} }`.
  Rejected because: classes invite state. State invites cache. Cache invites stale-data bugs. Tests need setup/teardown for instance state. Mocking gets harder. Reproducibility weakens.
- **Engines that fetch their own data from Supabase** — `await getTariffs(); calculate(profile)`.
  Rejected because: makes engines async (cascades through every caller), couples engine logic to data layer (engines now require database availability for tests), introduces non-determinism (network errors, partial fetches, race conditions). The clean separation is "fetch first, calculate second".
- **Engines with built-in cache** — `calculateComparison(profile)` with internal `Map<key, result>`.
  Rejected because: same input → same output is the test we want, NOT "same input → cached output unless cache invalidated". Cache logic adds complexity that the actual performance need doesn't justify (the engines are fast — recomputation is cheap).
- **AI-augmented engines** — call Claude inside `calculateMigration()` to "smartly" pick scenarios.
  Rejected because: violates determinism. Same school profile gives different results on different days. Auditability broken. Trust collapse risk. AI is reserved for parsing only (intake), never pricing logic — this is also the architectural rule documented in `brand_context/positioning.md`.
- **Chosen: strict pure functions** — predictable, testable, auditable, fast enough that no caching is needed inside the engine.

> TODO Pim: validate that pure-function-engines was a deliberate architectural choice rather than an emergent property. If you have specific moments where you rejected adding side effects to an engine (e.g., a PR where someone proposed a cache and you said no), capture them here.

## Consequences

- **Positive**:
  - Tests are simple: `expect(calculate(input)).toEqual(expectedOutput)` — no mocks, no setup, no teardown
  - Reproducibility guaranteed: same school profile + same tariffs = same output, every time, every machine
  - Refactoring is safe — type system + tests catch regressions immediately
  - Easy to reason about: read the engine top-to-bottom, no hidden dependencies
  - Easy to audit: when a consultant asks why the result is X, trace the inputs through the engine functions
  - Performance is good without caching — pure functions optimize well
- **Negative**:
  - Some logic that "wants" to live in the engine (tariff freshness checks, audit logging) must live elsewhere — adds slight indirection in callers
  - Adding a feature that genuinely needs external state (e.g., "compare against historical average") requires that state to be passed in as an argument, not fetched inside the engine
  - Caching/memoization cannot be added to the engine itself — must be added at every call site that needs it (typically `useMemo` in React components)
- **Trade-offs accepted**:
  - We trade "convenient state inside engines" for "predictable behavior across all callers". Worth it for code that drives real procurement decisions.
  - When a future Claude (or contributor) proposes adding a cache/await/state to an engine, the answer must be: *"That goes one level up. The engine stays pure."*
  - The pure-function rule extends to the `calculators/` sub-folder (cito-calculator, dia-calculator, etc.) — same constraints.

## Links

- TRAINING-CONTEXT.md (root) — "rekenlogica zit in **pure-function 'engines'** in `src/engine/` — drie stuks, allemaal side-effect-vrij en volledig getest"
- `code_context/architecture.md` (this app) § Engine architecture — 12 modules + calculators
- `code_context/architecture.md` § Invariants — invariant 2
- `code_context/conventions.md` § Banned patterns — "AI generating prices"
- `apps/concurrentoolVO/CLAUDE.md` § Architecture — engines list + getState pattern note
- Related ADRs:
  - ADR-0001 (this app) — Vite SPA
  - ADR-0002 (this app) — three hard-coded providers (the engines operate per-provider)
- Code: `src/engine/*.ts` (12 modules), `src/engine/calculators/*.ts`, `src/engine/__tests__/*.test.ts` (extensive coverage)
