# ADR Template

The mandated structure for every Architecture Decision Record. Mirrors [`ADR/README.md`](../../../../ADR/README.md) § Template — that file is the source of truth; this is the skill's local copy. If they drift, fix this file to match the README.

## Template

```markdown
# ADR-{NNNN}: {Title}

- **Status**: Accepted
- **Date**: {YYYY-MM-DD}
- **Supersedes**: — (or ADR-XXXX)

## Context

What's the situation? What problem are we solving? What constraints apply?

Keep this section factual — describe the world as it is when the decision is being made. Future readers shouldn't need extra context to understand why this choice was on the table.

## Decision

The choice we made, in one paragraph.

## Alternatives considered

- **Option A**: {description} — {pros/cons, why we didn't pick it}
- **Option B**: {description} — {pros/cons, why we didn't pick it}
- **Chosen option**: {restate the choice} — {why this beats the others}

## Consequences

What changes because of this decision?
- Positive: {what becomes easier or safer}
- Negative: {what we accept as trade-off}
- Trade-offs we accept: {what changes but isn't strictly better/worse — optional}

## Links

- Phase {NN} — {short description if applicable}
- Related ADRs: {ADR-XXXX or —}
- External docs: {URL or —}
- Code references: `code_context/architecture.md` § {section}, etc.
```

## Status values

| Status | Meaning |
|---|---|
| `Accepted` | Default for a fresh ADR. The decision is in force. |
| `Proposed` | Drafted but not yet adopted. Solo dev usually skips this — go straight to Accepted. |
| `Superseded by ADR-XXXX (YYYY-MM-DD)` | Replaced. Old file stays untouched except for this status line. |
| `Deprecated` | The decision was reversed but no replacement was needed. Rare. |

## Title rules

- Action-oriented, ≤8 words.
- Lowercased filename slug = title with non-alphanumerics replaced by `-`, max ~50 chars.

**Good**:
- `0001-supabase-sdk-no-orm.md` — direction is clear
- `0007-revert-from-monorepo.md` — what changed is in the title
- `0042-replace-vercel-with-fly.md` — replacement is named

**Bad**:
- `0001-database-decision.md` — vague, what was decided?
- `0003-misc-architecture.md` — never write this; one ADR per decision
- `0009-the-big-refactor.md` — no specifics; future-you can't grep for it

## Anti-patterns

- ❌ Editing Decision / Context / Alternatives / Consequences after Accepted (write a superseding ADR instead).
- ❌ Empty Alternatives section. If truly none: `_no alternative considered — {one-line reason}_`.
- ❌ Code snippets inside the ADR. Link to a commit, PR, or `conventions.md` section instead. ADRs are about *why*, not *how*.
- ❌ Vague Context like "we needed a database". Be specific about constraints: budget, team size, latency target, regulatory pressure.
- ❌ Decisions without consequences. If you can't list one negative, you haven't thought about it hard enough.
