# Architecture Decision Records (ADRs)

> Immutable records of architecture decisions. **Never edit** an ADR after merging — supersede it with a new one.

## Why ADRs

Code shows the *what*. ADRs capture the *why* — the reasoning behind a non-obvious choice, with the alternatives that were considered and rejected.

Without ADRs:
- 6 months later nobody remembers why the project uses Drizzle over Prisma
- New contributors re-litigate decisions that were already made
- "Why don't we just refactor X to Y?" gets asked weekly

With ADRs:
- Open `ADR/0017-database-orm.md` and read the answer
- New contributors absorb the reasoning before suggesting changes
- Decisions stay decided

## Format

Each ADR is one markdown file: `ADR/000X-short-slug.md`. Numbered sequentially. Use the template below.

### Lifecycle

| Status | Meaning |
|---|---|
| **Proposed** | Drafted, not yet adopted |
| **Accepted** | Adopted; this is what we do now |
| **Superseded** | Replaced by a newer ADR (link it) |
| **Deprecated** | No longer relevant; kept for history |

### Naming

`ADR/{NNNN}-{kebab-case-title}.md`

- `0001-database-orm.md`
- `0002-auth-provider.md`
- `0017-supersedes-0002-auth-provider.md`

## Template

Copy this for new ADRs:

```markdown
# ADR-{NNNN}: {Title}

- **Status**: Accepted
- **Date**: 2026-MM-DD
- **Decider(s)**: {names}
- **Supersedes**: — (or ADR-XXXX)

## Context

What's the situation? What problem are we solving? What constraints apply?

Keep this section factual — describe the world as it is when the decision is being made. Future readers shouldn't need extra context to understand why this choice was on the table.

## Decision

The choice we made, in one paragraph.

## Alternatives considered

- **Option A**: ... — pros/cons, why we didn't pick it
- **Option B**: ... — pros/cons, why we didn't pick it
- **Chosen option**: ... — pros/cons, why this beats the others

## Consequences

What changes because of this decision?
- Positive: ...
- Negative: ...
- Trade-offs we accept: ...

## Links

- Issue / PR: ...
- Related ADRs: ...
- External docs: ...
```

## Index

_Auto-maintained by code-feature-build, code-refactor, and other architecture-touching skills. Newest at bottom._

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-0001](./0001-supabase-sdk-no-orm.md) | Use Supabase SDK without separate ORM | Accepted | 2026-04-28 |
| [ADR-0002](./0002-biome-over-eslint-prettier.md) | Use Biome over ESLint + Prettier | Accepted | 2026-04-28 |
| [ADR-0003](./0003-no-mandatory-services-layer.md) | No mandatory services layer | Accepted | 2026-04-28 |
| [ADR-0004](./0004-sentry-and-vercel-logs-defer-analytics.md) | Sentry for errors + Vercel built-in logs; defer product analytics | Accepted | 2026-04-28 |

## Promotion path

Decisions don't always start as ADRs. They can flow up:

```
Tijdens coderen ontdekt:
  ↓ "dit is een gotcha"
context/learnings.md (per-skill section)
  ↓ blijkt herhaald patroon
docs/gotchas.md (categorieën, doorzoekbaar — optioneel)
  ↓ wordt project-norm
code_context/conventions.md (afdwingbare regel)
  ↓ raakt architectuur
ADR/{NNNN}-*.md (immutable beslissing met alternatieven + reden)
```

Niet elke learning hoeft door alle stappen — maar dit is het pad als 'm zwaarder wordt.
