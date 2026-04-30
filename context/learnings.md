# Learnings Journal

> Three-way split: cross-skill insights + per-phase lessons + per-skill feedback. ADRs index links out.
>
> Auto-maintained by App-Dev OS skills. Newest entries at the bottom of each section. Skills append here after deliverable feedback. **Never delete entries.**
>
> Skills read only their own section before running. Cross-skill insights go in `# General`. Phase wrap-ups go in `# Per Phase`. Skill-specific entries go in `# Per Skill (category)`.

---

# General

Cross-skill insights that apply broadly.

## What works well

### Capability design: breadth over pre-emptive scoping (locked 2026-04-28, /tailor-os Phase 9)

When designing permissions, hooks, MCP-config, or any capability-restriction in this project: default to broad capabilities and refine via the feedback loop in `learnings.md`. Do not pre-emptively tighten scope on hypothetical "what if" concerns.

**Reason:** pre-emptive scoping creates per-prompt friction (every routine command asks for confirmation). A real mistake is one entry in `learnings.md` that permanently fixes the gap, vs. friction that lasts forever. Aligns with DEV_ETHOS rule "errors-should-teach".

**Concrete example from Phase 9:** initial proposal removed `npm/yarn/bun` from ALLOW because they conflict with the pnpm-only conventions banned-pattern. User reversed mid-phase: "te hard, laat het breed en leer als het misgaat". All 9 entries restored. The scope-tightening would prevent at most an occasional Stack-Overflow-paste that runs `npm install` — and even that would surface immediately via diff-review or a broken pnpm workspace, both of which are recoverable.

**Boundary:** this principle covers **capability design only**. It does NOT override functional spec decisions:
- Stack choices (`USER.md`)
- Code conventions (`conventions.md`)
- Architecture invariants (`architecture.md`)
- Immutable decisions (`ADR/`)
- Voice rules (`brand_context/voice-profile.md`)

Those stay authoritative. Self-learning is about *how broadly Claude is allowed to act*, not about *what Claude is allowed to choose*.

### Reconciliation gap: permissions paragraph in AGENTS.md is not auto-tracked (logged 2026-04-28, /tailor-os Phase 9)

`AGENTS.md` § Operating Rules → Reconciliation auto-handles **skills** and **MCPs**, but there's no auto-check for "does AGENTS.md § Permissions match `.claude/settings.json` reality?". Phase 9 found the paragraph was stale (didn't mention Supabase/Vercel/gh/Sentry CLIs that had been added to ALLOW).

**Trigger to extend reconciliation:** if this stale-doc pattern recurs (e.g., AGENTS.md § Hooks drifts after a hook is added/removed), build a `meta-reconcile-docs` skill that diffs structural claims in AGENTS.md against actual file state. Until then, manual update at the end of each /tailor-os run is sufficient.

## What doesn't work well

---

# Per Phase

Lessons extracted at the end of each GSD phase by `gsd-extract-learnings` or manual `meta-wrap-up`. Each phase gets a section with **decisions / lessons / patterns / surprises**.

Format per phase:

```markdown
## Phase {NN} — {phase-name} (closed YYYY-MM-DD)

### Decisions
- {what was decided + why}

### Lessons
- {what we learned the hard way}

### Patterns
- {reusable patterns that emerged}

### Surprises
- {what didn't go as expected}

### Linked ADRs
- ADR-XXXX: {title}
```

_(no phases closed yet)_

---

# ADRs Index

Architecture Decision Records live as separate immutable files in [`ADR/`](../ADR/).

The canonical index lives in [`ADR/README.md`](../ADR/README.md) § Index — newest at bottom. Do not maintain a duplicate table here; this section is a pointer only.

When a phase closes that produced architecture decisions, run `docs-adr` (promote-mode for an existing bullet, create-mode for a fresh decision). The skill writes the ADR file and appends to `ADR/README.md` § Index.

---

# Per Skill (category)

One section per skill. Skill folder name = section heading. Skills read only their own section.

## meta-skill-creator

## meta-wrap-up

## mkt-brand-voice

## ops-cron

## ops-new-feature

## ops-release

## code-feature-build

## code-review

## code-refactor

## test-write-unit

## test-e2e-playwright

## test-coverage-audit

## db-migration

## db-schema-design

## db-query-tune

## infra-dockerize

## infra-ci-pipeline

## sec-secret-scan

## sec-dep-audit

## sec-threat-model

## deploy-release

## deploy-rollback

## deploy-env-promote

## docs-readme

## docs-adr

## docs-api-reference
