# ADR-0007: Single-branch workflow without PR or CI gate

- **Status**: Accepted
- **Date**: 2026-05-08
- **Decider(s)**: pim
- **Partially supersedes**: ADR-0005 — specifically the "Two test layers", "Single shared CI workflow", and "feature → dev → main with PR gates" decisions. Other ADR-0005 decisions (two Supabase projects per app, single env-var name + Vercel scoping, manual production migrations, branch prefixes) remain in force.

## Context

ADR-0005 installed the OTAP framework with a four-stage discipline
(Ontwikkeling, Test, Acceptatie, Productie), required PR gates with
GitHub Actions CI, and a `feature → dev → main` promotion path. After
running this for one day on `concurrentoolVO`, the user reported the
ceremony cost outweighed the safety it provided for a solo-developer
context:

- Each PR needed a CI run (~2 min) before being mergeable, even for
  trivial changes
- The `dev → main` promotion required a separate PR with its own
  ceremony (preview, CI, merge), often duplicating verification
- Branch protection on main + required CI checks forced an admin
  bypass workflow when CI was incidentally red
- Vercel preview deploys per branch — not per PR — already provide the
  acceptance-environment substitute that ADR-0005 reasoned about

The user's working pattern is closer to:
*"I work on a feature branch, I run tests on my laptop when I think
it's done, I merge to main, and Vercel deploys. If something is broken
the Vercel build fails or I roll back."*

State at decision time:
- `dev` branch has been deleted (locally + remotely) earlier the same
  day — main is the single long-lived branch
- Branch protection on main currently requires PR + `CI` status check
- `.github/workflows/ci.yml` still exists with build/typecheck/vitest
- `branch-guard.js` Claude-side hook hard-blocks writes/commits/pushes
  on main
- `.claude/settings.json` denies `git push origin main*`

Constraints:
- Solo developer; no team review available, so PR ceremony has nobody
  to perform the review for
- Vercel auto-deploys on push to main — production must remain
  recoverable (Vercel "Promote previous deploy" is the rollback)
- Two Supabase projects per app stay in place — ADR-0005's isolation
  is not affected

## Decision

Adopt a **single-branch workflow** with manual pre-merge testing:

| Stage | Tooling |
|-------|---------|
| Develop | `feature/<slug>` branch from `main`; iterate locally with `npm run dev` |
| Pre-merge test (manual) | `npm run build` + `npx vitest run` on the feature branch — user's discipline, no automation |
| Optional preview | Push feature branch to GitHub → Vercel preview URL → click-test |
| Merge | `git checkout main && git merge --squash feature/<slug> && git commit && git push origin main` |
| Deploy | Vercel detects push to main → production build → live |
| Rollback if broken | Vercel dashboard → previous deploy → "Promote to Production" (one click) |

Concrete implementation choices:

1. **Squash-merge** for feature → main (clean linear history on main; one
   commit per feature)
2. **No PR ceremony** — direct merge, no review, no CI gate
3. **No GitHub Actions workflow** — `.github/workflows/ci.yml` removed
4. **Branch protection on main relaxed** — `Require PR` and `Require
   status checks` removed; `linear history`, `no force push`, `no
   deletions` retained as cheap last-line defenses
5. **`branch-guard.js` hook** demoted from hard-block to advisory
   warning when working on main
6. **`.claude/settings.json`** removes `Bash(git push origin main*)` and
   variants from hard-deny so direct push is permitted
7. **Pre-commit typecheck-hook** retained — fast local sanity check at
   commit time
8. **Vercel build acts as the final structural gate** — typecheck or
   bundle failure on the main push aborts the deploy automatically;
   production stays on the previous version

## Alternatives considered

### Keep ADR-0005 unchanged
- Pros: structural gates intact, automated test discipline, OTAP
  textbook-purity, future team-scaling-friendly.
- Cons: high ceremony cost for a solo dev, contradicts user's
  observed working pattern, doesn't match day-1 retrospective.
- Rejected — explicitly contradicts user's stated workflow preference.

### Hybrid: keep CI, remove PR
- Pros: CI catches regressions even without ceremony; user just merges
  to main and CI runs post-hoc.
- Cons: CI on main has no gating power (deploy already triggered);
  becomes informational at best. Two-thirds of the ceremony for
  one-third of the value.
- Rejected.

### Keep PR, remove CI
- Pros: still has a reviewable artifact (the PR diff), less ceremony.
- Cons: solo dev = nobody reviewing; PR is a self-merge formality;
  branch protection still requires gate-juggling.
- Rejected.

### Remove only the GitHub Actions workflow, keep branch protection
- Pros: minimal changes; main is still PR-gated.
- Cons: `Require status checks` waits forever for a `CI` check that
  no longer exists → no PR can be merged ever again. This is exactly
  the breakage we want to avoid.
- Rejected — incomplete; would brick the merge pipeline.

## Consequences

**Positive:**
- Round-trip from "feature ready" to "live in production" drops from
  ~5 minutes (PR + CI + merge + deploy) to ~30 seconds (squash + push
  + deploy)
- No CI maintenance — no flaky-test triage, no waiting for green,
  no GitHub Actions billing surface
- Working tree stays simpler — no PR templates, no review checklists,
  no merge-conflict-rebase dance for stale PRs

**Negative:**
- **No automated test gate** — discipline-only. A skipped pre-merge
  test means broken-main risk. Mitigation: Vercel build is structural
  gate of last resort + Vercel rollback is one click + this regime is
  reversible if the breakage rate becomes unacceptable.
- **Lost regression visibility** — without CI runs over time, it's
  harder to know when a test started failing or how often something
  was caught at the gate. Acceptable for solo dev with low
  feature-velocity.
- **Onboarding friction for future contributors** — anyone joining
  has to internalize the manual ritual; no enforced safety net.
  Acceptable until headcount > 1, at which point ADR-0008 supersedes
  this.

**Trade-offs accepted:**
- Speed > ceremony for solo-dev contexts
- Trust in user's discipline > automated structural enforcement
- Vercel build-failure as deploy gate is sufficient for production
  protection (broken builds don't ship)
- ADR-0005's "two-Supabase-projects" remains the structural core of
  prod/dev isolation; nothing about this ADR weakens that

## Reversal criteria

Re-introduce CI / PR / dev-branch (write ADR-0008 superseding this)
when any of:
- A second contributor joins and review becomes meaningful
- Production breakage from skipped pre-merge testing happens twice in
  a quarter
- The codebase grows large enough that local test runs stop being
  fast enough to be reliably executed pre-merge

## Links

- ADR-0005 (partially superseded): [`ADR/0005-otap-framework.md`](0005-otap-framework.md)
- Operational reference (rewritten in this commit): [`code_context/otap.md`](../code_context/otap.md)
- Branch-guard hook (now advisory): [`.claude/hooks/branch-guard.js`](../.claude/hooks/branch-guard.js)
