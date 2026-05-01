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

### Two-layer typecheck: advisory at edit-time, strict at commit-time (locked 2026-04-28, /tailor-os Phase 8)

The `typecheck-guard.js` Claude-side hook stays advisory (warns but doesn't block) on every edit. The strict gate that actually blocks lives one layer lower: `scripts/git-hooks/pre-commit` runs `pnpm tsc --noEmit` and exits non-zero on type errors, blocking the commit.

**Reason:** per-edit blocking on TS errors creates 30-second iteration friction during exploratory debugging. That collides head-on with the `feedback_local_first` rule (debug locally, iterate fast). But "advisory only" means broken types can slip into commits. Splitting the gate to commit-time gives both: fast iteration during work + hard correctness at the boundary where it matters.

**Why this is non-obvious:** typical advice is "pick one mode" — either always-block or always-warn. The split feels like over-engineering until you've felt both modes' downsides. Easy trap when re-tailoring: simplify by collapsing both layers into one, losing the reason the split exists.

**Trigger to escalate edit-time to block:** if production bugs slip through that types would have caught at edit time (i.e., the commit-time gate is firing too late to be useful), set `TYPECHECK_GUARD_BLOCK=1` env var. Until then, the two-layer split is the right shape.

### No mandatory services layer (locked 2026-04-28, /tailor-os Phase 4 → ADR-0003)

`src/lib/services/` is **optional**. Supabase calls go directly from Server Components / Route Handlers via `src/lib/supabase/` clients. Refactor to services only when same Supabase logic duplicates **3+ places** OR when business rules start mixing with raw data access in the same function.

**Reason:** typical Next.js + Supabase tutorials wire a services layer from day one, even on the smallest projects. In a solo-dev SaaS most code is read-once-then-deleted-or-rewritten — a pre-baked services layer creates empty folders, indirection, and abstraction that has to be maintained without earning its keep. Aligns with DEV_ETHOS rule "no premature abstractions".

**Boundary:** this is for the **template default**. Per-app `apps/{slug}/code_context/architecture.md` overrides if an app has genuinely complex domain logic from day one (rare).

**Why this is non-obvious:** "no services layer" feels sloppy in the abstract. The 3+ places trigger is a concrete safety net that catches the moment refactoring genuinely pays off. Easy trap: drift back to scaffolding services on every new app because that's what tutorials show.

### "Trigger to expand" pattern for runbook + ops decisions (emerged 2026-04-28, /tailor-os Phase 5)

When documenting an operational choice that uses the simple solution today but might need a bigger solution later, write the decision in a fixed shape:

> "Right now we use [simple solution] because [reason]. Switch to [bigger solution] when [explicit trigger]."

Phase 5 surfaced 4 instances of this shape organically in `runbook.md`: Local DB sharing the dev Supabase project (split when 2nd dev joins / seed clobbered / schema isolation needed / migration blocks preview), no on-call rotation (introduce when 2nd dev joins or customer SLA), no product analytics (add when a real product question requires it), no manual git tags (add when starting to publish release notes).

**Reason:** "we use the simple thing" without a written trigger drifts into "we use the simple thing forever, even after the trigger has fired." Writing the trigger explicitly turns "should we expand this?" from a vague feeling into a yes/no check.

**Why this is non-obvious:** runbooks usually describe current state ("we deploy via Vercel"). The expand-trigger shape is *forward-looking* — it pre-records the conditions under which today's choice becomes wrong. Easy to skip when writing because you don't know all triggers in advance — but writing the obvious one is better than writing none. Future-Pim/Claude can append more triggers when they come up.

**Promotion candidate:** if this pattern keeps recurring across `code_context/` (architecture.md, conventions.md), promote it to a meta-convention in `DEV_ETHOS.md` — currently it lives implicitly in runbook only.

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

## code-frontend-design

> Imported from upstream rekentool repo on 2026-05-01. Methodology gaps documented in `projects/ops-skill-refactor/2026-05-01_skill-quality-plan.md`. Refactor-trigger: ≥3 entries here OR ≥3 files in `projects/code-frontend-design/` OR active friction during use.

## code-interface-design

> Imported from upstream rekentool repo on 2026-05-01. Methodology gaps documented in `projects/ops-skill-refactor/2026-05-01_skill-quality-plan.md`. Refactor-trigger: ≥3 entries here OR ≥3 files in `projects/code-interface-design/` OR active friction during use.

## code-ui-design-system

> Imported from upstream rekentool repo on 2026-05-01. Methodology gaps documented in `projects/ops-skill-refactor/2026-05-01_skill-quality-plan.md`. Refactor-trigger: ≥3 entries here OR ≥3 files in `projects/code-ui-design-system/` OR active friction during use.

## tool-web-asset-generator

> Imported from upstream rekentool repo on 2026-05-01. Methodology gaps documented in `projects/ops-skill-refactor/2026-05-01_skill-quality-plan.md`. Refactor-trigger: ≥3 entries here OR ≥3 files in `projects/tool-web-asset-generator/` OR active friction during use.

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
