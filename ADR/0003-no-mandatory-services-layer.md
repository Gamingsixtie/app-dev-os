# ADR-0003: No mandatory services layer

- **Status**: Accepted
- **Date**: 2026-04-28
- **Supersedes**: —

## Context

The Next.js App Router structure has `src/lib/supabase/` (browser, server, service-role clients) established as the SDK entry point (see ADR-0001). The architectural question: should every Supabase call route through a `src/lib/services/` layer for consistency, or should we add services lazily? A mandatory services layer guarantees clean separation of data-access from UI — but it also creates one-line wrapper functions for one-call features and slows down feature work for solo dev. The project's `DEV_ETHOS.md` is explicit: no premature abstraction.

## Decision

No mandatory `src/lib/services/` layer. Components, Server Components, and Route Handlers may call `supabase-js` directly. Refactor a feature into `src/lib/services/{domain}.ts` only when (a) the same Supabase logic duplicates in 3+ places, or (b) business rules begin mixing with data-access calls in a way that hurts readability.

## Alternatives considered

- **Option A (mandatory services layer)**: every Supabase call goes through `src/lib/services/`. Cleanest separation, easier to mock for tests, single source of truth per domain. But creates empty wrapper functions for features with one Supabase call, and is premature abstraction for solo-dev velocity. Most app-dev-os apps will be small enough that the overhead never pays off.
- **Option B (lazy on first abstraction — refactor on duplicate #2)**: less strict than A, more strict than the chosen option. Risk: triggers too early on coincidental duplication that wouldn't have grown into a real shared pattern.
- **Option C — chosen (3+ duplications or mixed concerns trigger refactor)**: components and routes call SDK directly until evidence of repetition or layer-mixing forces a service. Aligns with the "rule of three" heuristic and the project's no-premature-abstraction stance.
- **No layer ever**: business rules sprinkled into components forever, forever. Rejected — the rule of three is the safety valve.

## Consequences

- Positive: no premature abstraction, faster feature development, components stay minimal, no empty service files cluttering `src/lib/`.
- Negative: less consistent layering across the codebase; the rule of three depends on the developer noticing duplication.
- Trade-offs we accept: refactor cost when the threshold is hit (3+ duplications or business-rule mixing), paid one-time per feature. If the developer (Pim) misses a duplication trigger, code review on `dev → main` PR is the second-line catch.

## Links

- Phase 4 — services-layer decision (architecture.md, choice 1c)
- Related ADRs: ADR-0001 (Supabase SDK)
- Code references: `code_context/architecture.md` § Components, `context/DEV_ETHOS.md` (no premature abstraction rule)
