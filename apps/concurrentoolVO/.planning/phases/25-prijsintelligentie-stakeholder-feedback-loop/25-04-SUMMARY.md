---
phase: 25-prijsintelligentie-stakeholder-feedback-loop
plan: 04
subsystem: ui
tags: [react, review-queue, manager-workflow, tanstack-query, zustand, vitest]

requires:
  - phase: 25-prijsintelligentie-stakeholder-feedback-loop
    provides: pricing-operations CRUD (approveProposal, rejectProposal, fetchAuditLog), pricing-types, usePriceProposals hook, ProposalBadge, PriceDiffDisplay, pricing-data-store
affects: [25-05, 25-06, 25-07, 25-08]
provides:
  - ReviewQueuePage at /review with manager-only access control
  - ReviewQueueItem with expandable detail and approve/reject actions
  - ReviewFilterBar with pill-based status and provider filtering
  - ReviewBadgeCounter showing open proposal count in navigation
  - /review route registration in TanStack Router
  - 15 passing tests across review-queue, recalculation, and audit-trail

tech-stack:
  added: []
  patterns: [useMutation with onSuccess query invalidation for approve/reject, usePricingDataStore.getState().loadFromSupabase() for store refresh after approval, pill-based filter bar with AND combination]

key-files:
  created:
    - src/features/review/ReviewQueuePage.tsx
    - src/features/review/ReviewQueueItem.tsx
    - src/features/review/ReviewFilterBar.tsx
    - src/components/ui/ReviewBadgeCounter.tsx
    - src/features/pricing/__tests__/review-queue.test.tsx
    - src/engine/__tests__/recalculation.test.ts
    - src/db/__tests__/audit-trail.test.ts
  modified:
    - src/router/routes.ts
    - src/router/__tests__/routes.test.ts
    - src/components/routing/RootLayout.tsx

key-decisions:
  - "useMutation for approve/reject with onSuccess invalidation of publication-prices and price-proposals query keys"
  - "loadFromSupabase() call on approve for immediate Zustand store refresh (recalculation trigger)"
  - "Inline rejection reason textarea with 10-char minimum instead of ConfirmDialog (richer UX for required reason)"
  - "Review nav link in RootLayout header, not separate NavigationBar component (consistent with existing architecture)"
  - "ROUTE_PATHS constant added for non-school top-level routes"

patterns-established:
  - "Manager-only pages: check userProfile.role === 'manager' at component level, show 'Geen toegang' for other roles"
  - "Pill-based filter bar: active pills use bg-[#003082] text-white, inactive use border border-neutral-200"
  - "ReviewQueueItem expand pattern: click row to toggle detail panel with audit trail and action buttons"

requirements-completed: [PI-05]

duration: 9min
completed: 2026-03-30
---

# Phase 25 Plan 04: Review Queue Summary

**Manager review queue at /review with filterable proposal list, one-click approve (triggers recalculation), reject with required reason, and navigation badge counter**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-30T21:07:43Z
- **Completed:** 2026-03-30T21:17:28Z
- **Tasks:** 2 of 2 auto tasks completed (Task 3 is checkpoint:human-verify)
- **Files created:** 7
- **Files modified:** 3

## Accomplishments

### Task 1: ReviewQueuePage with filter bar, expandable items, and approve/reject flow
- **ReviewQueuePage** (`src/features/review/ReviewQueuePage.tsx`): Manager-only access control (`role === 'manager'`), uses `usePriceProposals(filters)` with filter state, empty states per UI-SPEC copywriting contract, error state, loading skeletons, newest-first sort
- **ReviewQueueItem** (`src/features/review/ReviewQueueItem.tsx`): Expandable row with provider pill, module name, PriceDiffDisplay, date, ProposalBadge. Expanded view shows toelichting, bron, evidence link, audit trail entries. Approve: one-click `approveProposal()` with `loadFromSupabase()` for recalculation. Reject: inline textarea with 10-char minimum, confirm button
- **ReviewFilterBar** (`src/features/review/ReviewFilterBar.tsx`): Pill-based filters for status (Open/Goedgekeurd/Afgewezen) and provider (Cito/DIA/JIJ/SAQI). Active pills in cito-primary blue, AND combination
- **Tests:** 15 tests pass across 3 files: 7 review-queue component tests, 3 recalculation tests, 5 audit-trail tests
- Commit: `f4cd838` (RED), `b0fc728` (GREEN)

### Task 2: /review route and ReviewBadgeCounter
- **reviewRoute** in `src/router/routes.ts`: Top-level route at `/review` pointing to ReviewQueuePage
- **ROUTE_PATHS** constant added for non-school routes
- **ReviewBadgeCounter** (`src/components/ui/ReviewBadgeCounter.tsx`): Red circle badge (bg-red-500, 20px), shows count > 0, tooltip "[N] openstaande voorstellen"
- **RootLayout** (`src/components/routing/RootLayout.tsx`): "Review" nav link with badge, visible only for manager role
- Routes test updated with `/review` assertion
- Commit: `3456391`

## Deviations from Plan

### Auto-adjustments

**1. [Rule 3 - Blocking] Dependency files copied to worktree**
- **Found during:** Task 1 setup
- **Issue:** Files from Plans 25-01 and 25-03 (pricing-operations.ts, pricing-types.ts, usePriceProposals.ts, ProposalBadge.tsx, PriceDiffDisplay.tsx, pricing-data-store.ts, supabase/types.ts) were not in the worktree
- **Fix:** Copied from main repo to worktree to unblock development

**2. [Rule 2 - Missing] NavigationBar.tsx does not exist**
- **Found during:** Task 2
- **Issue:** Plan referenced `src/features/auth/NavigationBar.tsx` but no separate navigation bar component exists -- navigation is inline in RootLayout
- **Fix:** Added Review link directly to RootLayout header (consistent with existing architecture)

**3. [Rule 2 - Missing] ROUTE_PATHS constant**
- **Found during:** Task 2
- **Issue:** Plan said "Add to ROUTE_PATHS: review: '/review'" but no ROUTE_PATHS constant existed (only SCHOOL_TAB_ROUTES)
- **Fix:** Created new ROUTE_PATHS constant for non-school top-level routes

## Known Stubs

None -- all components are fully functional with real data hooks and mutations.

## Verification

- `npx vitest run` -- 15/15 tests pass (review-queue, recalculation, audit-trail, routes)
- `npm run build` -- succeeds without errors
- Access control: non-managers see "Geen toegang"
- Approve flow: calls approveProposal, invalidates queries, triggers loadFromSupabase
- Reject flow: requires 10-char minimum reason
- Badge: shows count via useOpenProposalCount, renders only when > 0

## Checkpoint

**Task 3 (checkpoint:human-verify)** is pending -- requires manual verification of the complete review queue workflow end-to-end.
