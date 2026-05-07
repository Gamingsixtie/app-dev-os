# Phase 1: OTAP Framework Foundations — Plan

**Created:** 2026-05-07
**SPEC:** [SPEC.md](SPEC.md) (9 requirements + 7 decisions locked)
**Tasks:** 13 across 5 waves
**Estimated effort:** ~3-4 hours of focused work (excluding manual user actions)

---

## Approach

Wave-based execution: tasks within a wave can run in parallel (independent
files, no shared edits). Each task → one atomic commit. Each wave gates
the next: don't start Wave N+1 before Wave N is verified.

Manual user actions (Supabase project creation, GitHub branch protection
config) are NOT scripted — they require web-dashboard access and are
called out explicitly per task.

## Risk register

| Risk | Mitigation |
|------|-----------|
| `add-app.sh` change breaks existing scaffold flow | Run scaffold in scratch dir before commit; rollback script if smoke test fails |
| YAML errors in `ci.yml` block all PRs | Validate YAML locally (`yq`); test workflow on a throwaway branch before merging |
| Branch protection settings can lock user out | Document the exact settings; user applies manually via UI; reversible |
| `code_context/otap.md` drifts from `AGENTS.md` | Cross-link both ways; mention in `meta-wrap-up` skill docs |
| Production migration runbook untested in real incident | Add fire-drill todo to backlog (separate project) |

---

## Wave 1 — Foundation docs

*Parallel; no dependencies. All three are pure markdown writes.*

### T1.1 — Write `code_context/otap.md`

- **What:** root-level OTAP framework definition. Letter mapping, environment table, link to ADR + runbook.
- **Files:** `code_context/otap.md` (new)
- **References:** SPEC.md § Goal, § Background, § Q3 (gates table)
- **Commit:** `docs(otap): add OTAP framework definition at code_context/otap.md`
- **Verify:** file exists, links to ADR placeholder + `runbook.md` resolve once those exist

### T1.2 — Draft ADR for OTAP framework

- **What:** immutable record of the framework decision. Sections: Context, Decision, Alternatives Rejected, Consequences.
- **Files:** `ADR/{next-number}-otap-framework.md` (new — likely 0007 or 0008; check existing ADR/ folder)
- **Use skill:** `docs-adr` (create mode) — let skill auto-number and update `learnings.md` § ADRs Index
- **References:** SPEC.md § Locked Decisions Q1–Q7, exploration note `.planning/notes/otap-framework-decisions.md`
- **Commit:** the skill commits atomically with format `docs(adr): NNNN — OTAP framework rationale`
- **Verify:** ADR file exists, indexed in `context/learnings.md`, referenced from `code_context/otap.md`

### T1.3 — Update `AGENTS.md` branching policy

- **What:** add a short paragraph + table row in § Branching Policy that references OTAP. Don't rewrite the section — append.
- **Files:** `AGENTS.md` (edit, branching policy section only)
- **References:** SPEC.md § Q5 (branch naming), Q3 (gates)
- **Commit:** `docs(agents): link branching policy to OTAP framework`
- **Verify:** AGENTS.md still valid; `code_context/otap.md` cross-link works

---

## Wave 2 — CI infrastructure

*Depends on Wave 1 (otap.md must exist for cross-references). T2.1 and T2.2 in parallel.*

### T2.1 — Write `.github/workflows/ci.yml`

- **What:** single workflow, path-filtered per app. Three jobs: build, typecheck, vitest. Triggers on PR to `main` or `dev`.
- **Files:** `.github/workflows/ci.yml` (new)
- **References:** SPEC.md § Q3 (gates), § Q7 (shared workflow), § Q6 (CI authoritative)
- **Local validation:** parse with `yq` or pre-commit YAML checker before push; test workflow on a throwaway feature branch by introducing a fake error and confirming red CI
- **Commit:** `ci(otap): add path-filtered build/typecheck/vitest workflow`
- **Verify:** PR shows 3 status checks; deliberate type error in a test PR causes red

### T2.2 — Document GitHub branch protection setup

- **What:** add `code_context/runbook.md` § "GitHub branch protection (one-time setup)" with exact dashboard steps + required settings
- **Files:** `code_context/runbook.md` (new file or new section if exists)
- **References:** SPEC.md req #2, decision Q3, Q6
- **Manual user action required:** user applies settings via GitHub repo settings UI after merge
- **Commit:** `docs(runbook): add GitHub branch protection setup steps`
- **Verify:** runbook contains: required-checks list, "Require pull request reviews" toggle, "Restrict pushes to main" — all marked clearly as **user action required**

---

## Wave 3 — Runbook content

*Depends on Wave 1; can run in parallel with Wave 2 (different sections of runbook.md but same file — sequential within Wave 3 to avoid merge conflicts).*

### T3.1 — Add `code_context/runbook.md` § "Database migrations"

- **What:** documented flow for Supabase migration files. Local: `supabase migration new`, `supabase db reset`. Production: manual `supabase db push --project-ref <prod-ref>` after PR merge.
- **Files:** `code_context/runbook.md` (edit/append)
- **References:** SPEC.md § Q1
- **Commit:** `docs(runbook): add database migration sync workflow`
- **Verify:** runbook section includes: example migration file path, local reset command, production push command, **explicit warning** about destructive migrations

### T3.2 — Add `code_context/runbook.md` § "Production incident rollback"

- **What:** 5-step 1-pager. Vercel rollback → migration revert if needed → Sentry log → learnings entry → comms.
- **Files:** `code_context/runbook.md` (edit/append, after migration section)
- **References:** SPEC.md § Q4
- **Commit:** `docs(runbook): add production incident rollback procedure`
- **Verify:** section is ≤1 page when rendered; has 5 numbered steps; mentions Sentry + learnings.md

---

## Wave 4 — Scaffolding tooling

*Depends on Waves 1–3 (scaffolds reference docs that must exist).*

### T4.1 — Update `scripts/add-app.sh`

- **What:** extend scaffold to create `.env.local.example` with two-Supabase template + `vercel.json` reminder + reference to root `code_context/otap.md` in app's `AGENTS.md`.
- **Files:** `scripts/add-app.sh` (edit)
- **References:** SPEC.md req #4, #8
- **Risk:** must not break existing scaffolds for `concurrentoolVO`-shaped apps
- **Local validation:** run `bash scripts/add-app.sh "OTAP Smoke Test"` in scratch dir → verify all files present → delete scratch dir
- **Commit:** `feat(scaffold): make add-app.sh OTAP-aware`
- **Verify:** scaffolded app has the new files; `concurrentoolVO` is unaffected (no diff in its files)

### T4.2 — Add root-level `.env.local.example` with two-Supabase template

- **What:** template showing both `VITE_SUPABASE_URL` (single var) + Vercel-environment-scoping note.
- **Files:** `.env.local.example` (edit existing — verify won't clobber unrelated keys)
- **References:** SPEC.md § Q2
- **Commit:** `chore(env): document two-Supabase env-var pattern in .env.local.example`
- **Verify:** existing keys preserved; new section added; comments explain Vercel scoping

### T4.3 — Update root README.md to mention OTAP

- **What:** one paragraph in README under "How it works" pointing to `code_context/otap.md`.
- **Files:** `README.md` (edit)
- **References:** all
- **Commit:** `docs(readme): reference OTAP framework`
- **Verify:** README still valid; link to otap.md works

---

## Wave 5 — Verification

*Depends on all prior waves. Sequential — each verifies a different acceptance criterion.*

### T5.1 — Smoke test scaffold

- **What:** run `bash scripts/add-app.sh "OTAP Smoke Test"` in scratch dir; manually verify all SPEC req #8 outputs present; delete scratch.
- **Files:** none (test-only)
- **References:** SPEC.md acceptance #6
- **Commit:** none (test result captured in learnings)

### T5.2 — Test PR with deliberate type error

- **What:** create `feature/otap-ci-test` branch in `concurrentoolVO`, introduce a TS error, push, open PR, confirm CI fails red. Then close PR without merge.
- **Files:** none (test PR is throwaway)
- **References:** SPEC.md acceptance #2 + #3
- **Commit:** none — test PR closed without merge
- **Manual user action required:** user opens/closes test PR (or grants permission)

### T5.3 — Verify Vercel preview deploy on test PR

- **What:** during T5.2, also confirm Vercel posts a preview URL within 3 min and the wizard loads at that URL with local-Supabase data.
- **References:** SPEC.md acceptance #4 (req #5)
- **Manual user action required:** user opens preview URL, clicks through wizard

### T5.4 — Update `context/learnings.md` § Per Phase

- **What:** add phase-completion entry: what worked, what surprised, what to repeat next time.
- **Files:** `context/learnings.md` (edit)
- **Use skill:** `gsd-extract-learnings` (per CLAUDE.md auto-tracking rule)
- **Commit:** `docs(learnings): record OTAP framework phase outcomes`

---

## Out-of-band manual user actions

These cannot be automated — they require web-dashboard access and user account ownership. Track separately.

- [ ] **Create production Supabase project for `concurrentoolVO`** (separate from current one) — needed before T2.1 CI can fully verify the two-DB split for that app
- [ ] **Configure GitHub branch protection on `main`** per the runbook entry from T2.2
- [ ] **Configure Vercel environment variables** (Production / Preview / Development) for `concurrentoolVO` per Q2 decision

These are listed in this PLAN.md so they don't get forgotten, but they belong to a follow-up project (per-app rollout to `concurrentoolVO`), not this one.

---

## Definition of done

All 8 acceptance criteria from SPEC.md § Acceptance Criteria are pass-fail-checked off. ADR exists. CI demonstrably blocks a red PR. Vercel preview demonstrably loads for `concurrentoolVO`. Learnings recorded.

---

*Project: ops-otap-framework (Level 3)*
*Plan drafted: 2026-05-07*
*Next step: execute Wave 1 (T1.1 + T1.2 + T1.3 in parallel) once user gives go-ahead*
