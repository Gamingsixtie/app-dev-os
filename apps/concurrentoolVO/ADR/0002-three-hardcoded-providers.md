# ADR-0002: Three hard-coded providers (Cito / DIA / JIJ)

- **Status**: Accepted
- **Date**: 2026-05-01
- **Supersedes**: —
- **Scope**: per-app (concurrentoolVO only)

## Context

concurrentoolVO compares pricing across the three commercial test-providers active in the Dutch secondary education (VO) market: **Cito**, **DIA**, and **JIJ** (also written "JIJ!"). These three are the entire market — no other provider has meaningful share or commercial relevance for the Cito-consultants this tool serves.

Generalizing the comparison engine to support N providers would be a clean abstraction in a vacuum. But the actual cost is concrete:

- Each provider has different pricing structures (tiered bundles for Cito, package-based for DIA, flat-rate for JIJ). The calculator logic is **per-provider, not generic**.
- The comparison engine has provider-pair-comparison logic (e.g., "schijnvoordeel" detection compares specific provider pairs).
- Sales-signals fire on specific patterns per provider.
- The UI has three columns hard-coded with provider-specific labels, colors, and brand cues.
- Migration scenarios assume current → Cito (DIA → Cito or JIJ → Cito are different paths).
- 13 Supabase migrations + the Dexie schema all reference `provider IN ('cito', 'dia', 'jij')`.

The Dutch VO toets-market is **not expected to add a fourth player in the foreseeable future**. The decision is therefore: hard-code today, refactor only when reality forces it.

## Decision

Hard-code the three providers as a literal union type:

```ts
type Provider = 'cito' | 'dia' | 'jij';
```

…throughout: types, schemas, engine logic, UI components, data layer, Supabase columns. Adding a fourth provider is **explicitly framed as a major refactor** (multi-week scope, not a small change), not a type-union extension.

## Alternatives considered

- **Generic provider system from day one** — `providers: Provider[]` with each provider defined as a config object (calculator function, label, color, etc.).
  Rejected because: premature abstraction. Three providers exist, none are likely to leave or be joined. The abstraction adds indirection that no one needs and obscures provider-specific bug fixes. Aligns with App-Dev OS DEV_ETHOS rule "no premature abstraction".
- **Plugin architecture for providers** — separate npm package or folder per provider, dynamically loaded.
  Rejected because: serious overkill for solo dev maintaining ~3 providers. Build complexity, dependency hell.
- **Database-driven provider list** — Supabase table `providers` + dynamic schema.
  Rejected because: provider list is so stable that the table would be a 3-row constant. Database queries to fetch the list add latency for zero flexibility benefit. Schema would still need provider-specific calculator code somewhere.
- **Chosen: hard-coded literal union** — every type-check enforces "valid provider", refactoring the engine doesn't accidentally drop a provider, no runtime overhead for fetching the list, and the friction of adding a fourth provider is itself a useful signal ("are we sure we want this?").

> TODO Pim: validate that "hard-coded was a deliberate choice" matches your memory. If the three providers were hard-coded by accident / inertia rather than deliberately, that's worth noting too — the rationale here is constructed post-hoc.

## Consequences

- **Positive**:
  - Type system enforces provider-correctness at compile time — impossible to typo a provider name
  - Engine code is straightforward (no dynamic dispatch on provider config) — easier to read, test, debug
  - Adding a feature to ALL providers is a "find and update 3 places" operation — manageable for solo dev
  - Provider-specific bugs are isolated — a Cito calculation bug doesn't affect DIA or JIJ
- **Negative**:
  - Adding a fourth provider would touch ~8+ files (engines, calculators, types, schemas, data, UI, sales-signals, schijnvoordeel-detection)
  - Database schema migration needed if a fourth provider is added (CHECK constraint on `provider` column)
  - The architecture leaks the assumption "exactly three" into many places — refactoring is a multi-week project, not a sprint task
- **Trade-offs accepted**:
  - We trade "future flexibility" for "current simplicity". The trade is correct as long as the Dutch VO market stays at 3 players. If a 4th appears, the trigger is real-world (not theoretical) and the refactor scope is clear.
  - When Claude (or a new contributor) is asked to "add a fourth provider", the response should be: *"This is a multi-week refactor, not a small change. Want to scope it as a project?"* — not a quiet type-union extension.

## Links

- TRAINING-CONTEXT.md (root) — "drie hard-coded providers in de comparison engine: Cito, DIA en JIJ"
- `code_context/architecture.md` (this app) § Engine architecture — 12 modules + per-provider calculators
- `code_context/architecture.md` § Invariants — invariant 1
- `code_context/conventions.md` § Banned patterns — "Adding a 4th provider without ADR"
- `brand_context/positioning.md` — "Drie hard-coded providers" listed as differentiator
- Related ADRs:
  - ADR-0001 (this app) — Vite SPA
  - ADR-0003 (this app) — pure-function engines (the engines that operate per-provider)
- Code: `src/engine/calculators/{cito,dia,jij,flat}-calculator.ts`, `src/engine/types.ts`, `src/data/default-prices.ts`, Supabase migration `001_initial_schema.sql`
