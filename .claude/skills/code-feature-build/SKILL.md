---
name: code-feature-build
description: >
  Build a new feature end-to-end with implementation, tests, and updated docs.
  Triggers on: "build a feature", "implement", "add new endpoint", "create
  component for", "ship a feature", "build the X feature". Reads
  code_context/conventions.md (full), code_context/architecture.md (full),
  and code_context/runbook.md (summary) before touching code. Writes
  feature code in src/, tests in tests/, updates relevant docs/. Commits
  atomically per logical change. Does NOT trigger for refactors (use
  code-refactor), bug fixes (use code-debug), test-only work (use
  test-write-unit), or UI-copy (use code-ui-copy).
---

# code-feature-build

Build a new feature end-to-end. This skill assumes the feature has been
scoped (brief, GSD plan, or clear request) — it implements rather than
designs.

## Outcome

A working feature delivered as one or more atomic commits, each passing
lint + typecheck + tests, with `code_context/architecture.md` updated if
system shape changed.

## Context Needs

| File | Load level | How it shapes this skill |
|---|---|---|
| `code_context/conventions.md` | full | Naming, imports, file layout, banned patterns |
| `code_context/architecture.md` | full | Where the feature fits, invariants to uphold |
| `code_context/runbook.md` | summary | Whether feature touches deploy/secrets |
| `context/USER.md` | summary | Risk posture, deploy cadence, branch policy |
| `context/learnings.md` | `## code-feature-build` | Past gotchas in this codebase |
| `brand_context/voice-profile.md` | tone-only (if UI-copy involved) | Match user-facing strings |

## Process

1. **Scope check**: state in 1-2 sentences what you're building. If
   ambiguous, ask up to 4 questions before reading code.
2. **Read existing code**: open the area you'll modify. Find similar
   features as templates. Match their idioms.
3. **Plan diff**: list files you'll touch with one-line intent each.
   Surface this list before editing.
4. **Implement**: smallest working version first. Follow conventions
   strictly. Use existing utilities — don't reinvent.
5. **Test**: write tests for risky behaviour and reused logic. Skip for
   trivial pure functions.
6. **Verify**: run `npm run lint && npm run type-check && npm test`
   (or project equivalents). All must pass.
7. **Commit**: one commit per logical chunk. Conventional style if the
   project uses it.
8. **Update docs**: `code_context/architecture.md` if shape changed,
   `docs/` if user-facing change.
9. **Wrap-up**: ask "shipped clean? gotchas?" and log to
   `context/learnings.md` § code-feature-build.

## Anti-patterns

- Adding a feature flag because you're unsure — be sure or ask
- Half-implementing then leaving TODO comments — finish or revert
- Refactoring surrounding code "while you're there" — separate skill
- Skipping tests because "it's simple" — bug-prone and you know it

## Output

- Code in `src/**`
- Tests in `tests/**`
- Optional doc update in `code_context/architecture.md` and/or `docs/`
- Atomic commit(s) on a feature branch
