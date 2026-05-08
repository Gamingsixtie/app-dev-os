# Workflow — App-Dev OS

> Operational reference for day-to-day development.
> Architecture decision: [ADR-0007](../ADR/0007-single-branch-no-pr-workflow.md)
> superseding the workflow parts of [ADR-0005](../ADR/0005-otap-framework.md).
> Runbook procedures (migrations, rollback) live in [`runbook.md`](runbook.md).

---

## TL;DR

Single-branch workflow:

1. Branch `feature/<slug>` from `main`
2. Code + iterate locally (`npm run dev`)
3. Manual pre-merge test ritual: `npm run build` + `npx vitest run`
4. Squash-merge directly to `main` and push
5. Vercel auto-deploys main → production

No PRs, no CI gate, no `dev` branch. The two-Supabase-projects-per-app
isolation from ADR-0005 stays in place — only the *workflow* changed.

---

## Daily flow

```text
1. git checkout -b feature/<short-slug>
2. npm run dev                              ← build the feature
3. (optional) git push -u origin feature/<slug>   ← Vercel preview URL
4. npm run build                            ← typecheck + bundle (must pass)
5. npx vitest run                           ← unit tests (must pass)
6. git checkout main
7. git merge --squash feature/<slug>
8. git commit -m "feat: <descriptive message>"
9. git push origin main                     ← Vercel deploys to production
10. git branch -D feature/<slug>            ← cleanup
```

Rollback if production breaks: Vercel dashboard → previous deploy →
"Promote to Production" (one click). No git involvement needed.

---

## Branch prefixes

Same four as ADR-0005, unchanged:

| Prefix | When |
|--------|------|
| `feature/` | New functionality |
| `fix/` | Bug fix |
| `chore/` | Non-code change (deps, config, docs) |
| `hotfix/` | Production incident — same flow, higher priority |

---

## Pre-merge test ritual (manual — your responsibility)

| Check | Command | Why |
|-------|---------|-----|
| Production build | `npm run build` | Vite build + tsc — fails on type errors |
| Unit tests | `npx vitest run` | Behavior regressions |
| (optional) preview | push branch, open Vercel preview URL | Visual + behavioral sanity check |

There is no automation enforcing this — discipline is the gate. The
fallback if you skip it is the Vercel build itself: a broken bundle
fails the deploy and production stays on the previous version. That's
your structural last-line-of-defense; the manual ritual is the one
that catches things before push.

---

## What's structurally enforced

| Rule | How |
|------|-----|
| Production runs only what's on main | Vercel deploy config (only main → prod) |
| Broken builds don't ship | Vercel build step fails the deploy |
| No accidental main destruction | Branch protection retains `no force push`, `no deletions`, `linear history` |
| One commit per feature on main | `git merge --squash` discipline |

---

## What was removed (per ADR-0007)

- GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- Required-status-check on main branch protection
- Pull-request requirement on main
- `dev` branch (deleted earlier on 2026-05-08)
- Hard-block on writes/commits/pushes to main (`branch-guard.js` is
  now advisory-only)

---

## What stays from ADR-0005 (unchanged)

- Two Supabase projects per app (dev + prod)
- Single env-var name + Vercel environment scoping (no `_DEV`/`_PROD` suffixes)
- Manual production migrations (`supabase db push --project-ref <prod-ref>`)
- Pre-commit type-check hook (lokaal)
- Branch prefixes (feature/fix/chore/hotfix)

---

## Cross-references

- New architecture decision: [ADR-0007](../ADR/0007-single-branch-no-pr-workflow.md)
- Original framework: [ADR-0005](../ADR/0005-otap-framework.md) (workflow parts superseded)
- Runbook: [`runbook.md`](runbook.md)
- Branching policy: [`AGENTS.md` § Branching Policy](../AGENTS.md#branching-policy)
- Branch-guard hook: [`.claude/hooks/branch-guard.js`](../.claude/hooks/branch-guard.js)
