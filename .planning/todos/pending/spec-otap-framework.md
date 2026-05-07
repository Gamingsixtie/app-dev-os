---
title: Spec OTAP framework as Level 3 GSD project
date: 2026-05-07
priority: high
type: workflow-followup
related_note: .planning/notes/otap-framework-decisions.md
---

# Todo: Spec OTAP framework as Level 3 GSD project

## What

Run `gsd-spec-phase` for the OTAP framework as a Level 3 project under
`projects/briefs/ops-otap-framework/` (with its own `.planning/` directory
per the AGENTS.md Output Standards section).

## Why this is a Level 3, not Level 2

Multi-deliverable scope with cross-cutting concerns:
- Infrastructure: 2 Supabase projects per app, Vercel project config
- Repo policy: branching strategy, PR template, CI gates
- Documentation: ADR, runbook, root-template `code_context/otap.md`
- Tooling: optional `scripts/otap-promote.sh` or env-pull helper

Multi-phase build with dependencies (env setup must precede gates must
precede docs). Warrants its own `.planning/`.

## Inputs (read these before starting)

- `.planning/notes/otap-framework-decisions.md` — locked decisions,
  out-of-scope items, open questions for spec phase
- `AGENTS.md` § Branching Policy — existing branch rules to align with
- `apps/concurrentoolVO/AGENTS.md` § Vercel deploy migration — current
  deploy state for the one existing app
- `apps/concurrentoolVO/.env.local.example` — current env-var shape

## Acceptance criteria

`gsd-spec-phase` produces a `SPEC.md` that resolves all 7 open questions
from the decisions note (migrations, env vars, gates, rollback, branch
naming, CI scope, per-app vs shared workflow). No remaining "TBD" on
items inside the locked-decision boundary.

## Out of scope for this todo

- Implementation (that's `gsd-plan-phase` + `gsd-execute-phase` later)
- Per-app rollout to existing `apps/concurrentoolVO` (separate todo,
  triggered when root spec is done)
- Vercel deploy migration from upstream repo to App-Dev OS monorepo
  (already deferred in `apps/concurrentoolVO/AGENTS.md`)

## Suggested kickoff

```
/gsd-spec-phase
```

…with project slug `ops-otap-framework` and the decisions note as
the locked context input.
