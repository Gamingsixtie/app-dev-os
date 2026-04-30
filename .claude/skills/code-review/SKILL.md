---
name: code-review
description: >
  Review changed code for bugs, security issues, performance pitfalls,
  and convention violations. Produces a severity-classified findings list.
  Triggers on: "review this", "code review", "check this PR", "spot
  bugs in", "audit my changes", "is this code OK", "lgtm?". Reads
  code_context/conventions.md (full), architecture.md (summary).
  Optionally reads PR diff or staged changes. Writes findings as inline
  comments or REVIEW.md. Does NOT trigger for security-only audits (use
  sec-threat-model), test-only review (use test-coverage-audit), or
  refactoring suggestions for working code (offer separately, don't
  inline in review).
---

# code-review

Independent code review for bugs, security, performance, and convention
violations. Severity-classified, actionable.

## Outcome

A findings list grouped by severity, each finding pointing to a file/line
and suggesting a concrete fix.

## Context Needs

| File | Load level | How it shapes this skill |
|---|---|---|
| `code_context/conventions.md` | full | What's allowed/banned in this codebase |
| `code_context/architecture.md` | summary | Component boundaries, invariants |
| `context/USER.md` | summary | Review depth preference (skim/standard/paranoid) |
| `context/learnings.md` | `## code-review` | Past patterns flagged in this codebase |

## Severity rubric

| Level | Meaning | Action |
|---|---|---|
| **Blocker** | Bug, security hole, data loss risk | Must fix before merge |
| **Critical** | Wrong behaviour in non-edge case | Fix before merge |
| **Important** | Wrong behaviour in edge case, perf regression | Fix or document why |
| **Minor** | Convention violation, naming, style | Fix or note as nit |
| **Question** | Reviewer doesn't understand intent | Author responds |

## Process

1. **Identify scope**: PR diff, staged changes, or named files. If unclear,
   ask once.
2. **Read changes**: full diff context, not just changed lines.
3. **Read related code**: callers, callees, similar features as comparison.
4. **Check rubric**:
   - Bugs: off-by-one, null handling, error paths, race conditions
   - Security: input validation, auth checks, secret handling, injection
   - Performance: N+1 queries, sync I/O in hot paths, memory leaks
   - Conventions: naming, imports, banned patterns from conventions.md
   - Tests: coverage of risky paths, no trivial-only tests
5. **Write findings**: one per issue, with file:line, severity, suggested fix.
6. **Output**: inline comments (if reviewing PR) or `REVIEW.md` (if
   standalone). Group by severity, blockers first.

## Anti-patterns

- Vague findings: "this could be cleaner" — be concrete or skip
- Style nits without project convention to back them — check conventions.md
- Suggesting a refactor for working code — note as separate ticket
- Approving without reading — say "haven't reviewed yet" honestly

## Output

- Inline PR comments (if PR context)
- `REVIEW.md` with severity-grouped findings (if standalone)
- One-line summary at top: count per severity
