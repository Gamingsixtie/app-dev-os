---
phase: 26-cito-prijzen-concurrentie-editor
plan: 01
subsystem: routing + landing-page + pricing-shell
tags: [wave-0, foundation, routing, pricing, manager-gate, dutch-ui]
requires:
  - existing useAuth hook (src/features/auth/AuthProvider)
  - existing TanStack Router setup (src/router/routes.ts)
  - cito-primary Tailwind token (already defined in src/styles/index.css)
provides:
  - StartschermPage component (renders on /)
  - PrijzenPage placeholder component (manager-gated, renders on /prijzen)
  - prijzenRoute (new lazy route in routeTree)
  - shared types: PrijzenTab, ConcurrentieSubTab, PrijzenSearchParams (for 26-02/03/04)
  - /admin -> /prijzen redirect (backward-compat per D-01)
affects:
  - src/router/routes.ts (modified: indexRoute, adminRoute; added: prijzenRoute)
tech-stack:
  added: []
  patterns:
    - lazyRouteComponent with named-export pattern
    - manager-only gate via useAuth().userProfile.role check
    - TanStack Router beforeLoad redirect pattern (reused for /admin)
key-files:
  created:
    - apps/concurrentoolVO/src/features/pricing/types.ts
    - apps/concurrentoolVO/src/features/pricing/index.ts
    - apps/concurrentoolVO/src/features/pricing/PrijzenPage.tsx
    - apps/concurrentoolVO/src/features/startscherm/StartschermPage.tsx
    - apps/concurrentoolVO/src/features/startscherm/__tests__/StartschermPage.test.tsx
  modified:
    - apps/concurrentoolVO/src/router/routes.ts
decisions:
  - D-01 (CONTEXT.md): /admin route kept as redirect to /prijzen for backward-compat
  - D-02 (CONTEXT.md): PrijzenSearchParams type prepared for tab-state via search-params (consumed by 26-02)
  - D-05 (CONTEXT.md): Two equal cards centered, Cito design tokens, no hero-banner
  - D-06 (CONTEXT.md): Both cards always visible; access control happens at /prijzen via manager gate
metrics:
  duration: ~10 minutes
  completed: 2026-05-14
  commits: 3
  tasks: 3/3
---

# Phase 26 Plan 01: Startscherm + /prijzen Foundation — Summary

Wave 0 foundation for Phase 26 — replaces the silent `/ -> /scholen` redirect with a real landing page that has two equal-weight entry cards (Schooloverzicht + Cito Prijzen + Concurrentie), wires a new lazy `/prijzen` route with a manager-only gate, and redirects the legacy `/admin` URL to `/prijzen` for backward compatibility. Downstream plans 26-02 (3-tab UI), 26-03 (multi-format export), and 26-04 (AI Excel-import) now have a stable foundation to build against.

## What was built

| Artifact | File | Purpose |
|---|---|---|
| `StartschermPage` | `src/features/startscherm/StartschermPage.tsx` | New landing component at `/`. Two `<Link>` cards — `/scholen` and `/prijzen` — styled with Cito design tokens. |
| `StartschermPage` tests | `src/features/startscherm/__tests__/StartschermPage.test.tsx` | Vitest + Testing Library — 3 tests covering render, navigation targets, and Dutch copy. Mocks `@tanstack/react-router`'s `Link` to avoid needing a Router harness. |
| `PrijzenPage` | `src/features/pricing/PrijzenPage.tsx` | Manager-gated placeholder. Non-managers see "Geen toegang"; managers see "Prijs-editor wordt geladen — tabs komen in een volgende stap." The 3-tab UI lands in plan 26-02. |
| Shared types | `src/features/pricing/types.ts` + `index.ts` barrel | `PrijzenTab`, `ConcurrentieSubTab`, `PrijzenSearchParams` — consumed by 26-02 (tab UI), 26-03 (export button), 26-04 (AI import). |
| Routes wiring | `src/router/routes.ts` | `indexRoute` now renders `StartschermPage` (no more redirect). New `prijzenRoute` at `/prijzen` registered in `routeTree.addChildren`. `adminRoute` converted to `beforeLoad` redirect to `/prijzen`. `AdminConfigEditor` import dropped from routes (component file stays on disk — it is the refactor base for 26-02). |

## Verification — what passed

- `npx tsc --noEmit` — clean, zero errors.
- `npm run build` — clean, dist generated, PWA precache regenerated.
- `npm run lint` — 0 errors (12 pre-existing warnings in unrelated files; out of scope per execute-plan SCOPE BOUNDARY rule).
- `npx vitest run src/features/startscherm` — 3/3 tests pass.
- `npx vitest run src/features/pricing` — 24/24 pre-existing pricing tests still green (no regression).
- **Locked-files guard**: `git diff --name-only HEAD~3 HEAD | grep -E "(default-prices|cito-migration-prices)\.ts$"` returns empty. Locked files untouched.

## Contracts available to downstream plans (26-02 / 03 / 04)

- `import type { PrijzenTab, ConcurrentieSubTab, PrijzenSearchParams } from '@/features/pricing';`
- Route path `/prijzen` resolves to `PrijzenPage` (named-export pattern via `lazyRouteComponent`).
- Manager-only gate already in place — downstream tabs only need to extend the manager-branch render.
- `/admin` users transparently land on `/prijzen` — no client breakage.

## Locked-files confirmed unchanged

- `apps/concurrentoolVO/src/data/default-prices.ts` — untouched.
- `apps/concurrentoolVO/src/data/cito-migration-prices.ts` — untouched.

Verified via `git diff` across all three commits; both paths are absent from the change set.

## Deviations from Plan

### 1. [Rule 3 — Blocking issue resolution] Task 2 `npm run build` could not pass standalone

- **Found during:** Task 2 verify (`npm run build`).
- **Issue:** TanStack Router generates typed `Link` paths from the route tree. After creating `PrijzenPage` (Task 2) but BEFORE registering `prijzenRoute` (Task 3), the `<Link to="/prijzen">` in `StartschermPage.tsx` failed type-checking with `TS2322: Type '"/prijzen"' is not assignable to type ...`. This is a sequencing artifact — the build can only be green after all three tasks land in lockstep.
- **Resolution:** Continued to Task 3, which wires the route and unblocks the build. Final plan-level `npm run build` exits 0. Documented per execute-plan protocol.
- **Impact:** No code change required — purely a sequencing observation. If a future plan wants per-task `npm run build` verify in mid-foundation tasks, the plan would need to re-order route-registration before component creation, or relax the per-task verify to typecheck-only.

### 2. [Acceptance criteria letter vs. spirit] `grep -c "prijzenRoute" >= 3` letter not satisfied

- **Found during:** Task 3 acceptance verification.
- **Issue:** Plan acceptance criterion expected `prijzenRoute` to appear ≥3 times in `routes.ts`. The plan annotation explicitly noted "declaration, addChildren entry, **optional re-export**". The actual code has 2 occurrences (declaration on line 49, `addChildren` entry on line 192). No standalone re-export was added because the route is already exported with `export const`.
- **Resolution:** Semantically the route is correctly registered (declaration + `addChildren` registration is the complete contract for TanStack Router). The plan-level `<verification>` checks (`build`, `lint`, `vitest`) all pass — the spirit of "route is fully wired" is met. The third occurrence was explicitly marked "optional" in the plan, so this is a passing letter-vs-spirit acknowledgment, not a deviation that needs correcting.
- **Impact:** None. Route is functional and discoverable to all consumers.

## Notes for next wave (26-02, 26-03, 26-04)

- The `PrijzenPage.tsx` manager-branch currently renders only a placeholder paragraph. Plan 26-02 should extend the manager-branch with the 3-tab UI (Basisvaardigheden / Modules / Concurrentie) and integrate `PrijzenSearchParams` for deeplinkable tab state.
- `AdminConfigEditor.tsx` is intentionally left on disk for plan 26-02 to use as a refactor base — it has the per-provider tab implementation that needs restructuring into per-domain.
- Plans 26-02/03/04 can run in parallel per the wave plan; they all extend `PrijzenPage.tsx` but in disjoint regions (tabs / export button / import flow).

## Commits

| Hash | Task | Subject |
|---|---|---|
| `01e4f68` | 1 | `feat(26-01): add StartschermPage with two entry cards + shared pricing types` |
| `3134d30` | 2 | `feat(26-01): add PrijzenPage placeholder with manager-only gate` |
| `6c8b2b8` | 3 | `feat(26-01): wire routes — index renders StartschermPage, add /prijzen, redirect /admin` |

## Self-Check: PASSED

- `apps/concurrentoolVO/src/features/pricing/types.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/index.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/PrijzenPage.tsx` — FOUND
- `apps/concurrentoolVO/src/features/startscherm/StartschermPage.tsx` — FOUND
- `apps/concurrentoolVO/src/features/startscherm/__tests__/StartschermPage.test.tsx` — FOUND
- `apps/concurrentoolVO/src/router/routes.ts` — MODIFIED (indexRoute, adminRoute changed; prijzenRoute added)
- Commit `01e4f68` — FOUND in `git log`
- Commit `3134d30` — FOUND in `git log`
- Commit `6c8b2b8` — FOUND in `git log`
- Locked files `default-prices.ts` and `cito-migration-prices.ts` — VERIFIED UNCHANGED across all three commits
