---
phase: 25-prijsintelligentie-stakeholder-feedback-loop
plan: 03
subsystem: ui
tags: [react-query, hooks, modal, zod, tailwind, proposal-workflow, price-diff]

requires:
  - phase: 25-prijsintelligentie-stakeholder-feedback-loop
    plan: 01
    provides: pricing-operations CRUD (createPriceProposal, fetchPriceProposals, fetchOpenProposalCount), PriceProposal type
provides:
  - React Query hooks for proposal CRUD (usePriceProposals, useCreateProposal, useOpenProposalCount)
  - PriceProposalModal component with Zod validation and deviation warning
  - ProposalBadge component (open/goedgekeurd/afgewezen status display)
  - PriceDiffDisplay component (old -> new price with percentage delta)
  - proposal.schema.ts Zod validation schema
affects: [25-04, 25-07]

tech-stack:
  added: []
  patterns: [proposal submission modal with deviation guard, React Query polling (60s refetchInterval), status badge config map pattern]

key-files:
  created:
    - src/hooks/usePriceProposals.ts
    - src/features/review/PriceProposalModal.tsx
    - src/features/review/schemas/proposal.schema.ts
    - src/components/ui/ProposalBadge.tsx
    - src/components/ui/PriceDiffDisplay.tsx
  modified:
    - src/features/pricing/__tests__/price-flag.test.tsx

key-decisions:
  - "ProposalBadge uses statusConfig map pattern matching PriceBadge established convention"
  - "PriceDiffDisplay uses nl-NL locale Intl.NumberFormat for EUR formatting"
  - "checkPriceDeviation called with (moduleId, provider, amount) for local 50% deviation warning before submit"
  - "useOpenProposalCount polls every 60 seconds via refetchInterval for badge freshness"

patterns-established:
  - "Proposal status badge config: Record<Status, { label, classes }> for O(1) lookup"
  - "Deviation guard pattern: check before submit, show warning, require explicit confirm"
  - "PriceDiffDisplay delta calculation: (new - old) / old * 100 with green/red color coding"

requirements-completed: [PI-04]

duration: 8min
completed: 2026-03-31
---

# Phase 25 Plan 03: Proposal Submission Flow Summary

**React Query proposal hooks with 60s polling, PriceProposalModal with Zod validation and 50% deviation guard, ProposalBadge and PriceDiffDisplay UI components**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-31T13:35:07Z
- **Completed:** 2026-03-31T13:43:00Z
- **Tasks:** 2 (TDD)
- **Files modified:** 6

## Accomplishments
- React Query hooks (usePriceProposals, useCreateProposal, useOpenProposalCount) wrapping pricing-operations CRUD with cache invalidation and 60s polling
- PriceProposalModal with react-hook-form + Zod validation, read-only current price display, 50% deviation warning guard, and AI normalization section (wired in Plan 07)
- ProposalBadge renders three status variants (Open/Goedgekeurd/Afgewezen) with correct semantic colors
- PriceDiffDisplay shows old -> new price with nl-NL EUR formatting and color-coded percentage delta
- 11 tests passing: hook behavior (3), PriceDiffDisplay (2), PriceProposalModal (3), ProposalBadge (3)

## Task Commits

Each task was committed atomically (TDD flow):

1. **Task 1: Create React Query hooks for price proposals** (TDD)
   - RED: `08f7e33` (test) - 8 failing tests for hooks, ProposalBadge, PriceDiffDisplay
   - GREEN: `4e29d25` (feat) - hooks, ProposalBadge, PriceDiffDisplay implementations

2. **Task 2: Create PriceProposalModal, ProposalBadge, and PriceDiffDisplay**
   - `303ccd2` (feat) - PriceProposalModal with Zod schema, deviation warning, toast

## Files Created/Modified
- `src/hooks/usePriceProposals.ts` - React Query hooks for proposal CRUD with 60s polling
- `src/features/review/PriceProposalModal.tsx` - Modal for submitting price proposals with deviation guard
- `src/features/review/schemas/proposal.schema.ts` - Zod schema: proposed_price (positive number), source (required), explanation (min 10 chars)
- `src/components/ui/ProposalBadge.tsx` - Status badge for proposals: open (blue), approved (green), rejected (orange)
- `src/components/ui/PriceDiffDisplay.tsx` - Old -> new price with line-through, arrow, percentage delta
- `src/features/pricing/__tests__/price-flag.test.tsx` - 11 tests covering hooks, modal, badge, and diff display

## Decisions Made
- ProposalBadge uses statusConfig Record map pattern matching the established PriceBadge convention for O(1) status lookup
- PriceDiffDisplay uses nl-NL locale Intl.NumberFormat for consistent EUR formatting across the app
- checkPriceDeviation called with (moduleId, provider, amount) for local 50% deviation warning before submit -- AI normalization wired separately in Plan 07
- useOpenProposalCount polls every 60 seconds via refetchInterval for near-real-time badge updates

## Deviations from Plan

None - plan executed exactly as written. All code was implemented following the specified patterns and acceptance criteria.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Proposal hooks ready for use by ReviewQueuePage (Plan 04)
- ProposalBadge and PriceDiffDisplay ready for reuse in review queue items
- PriceProposalModal ready for AI normalization wiring (Plan 07, D-12)
- All tests pass, build succeeds

## Self-Check: PASSED

All 6 files found. All 3 commits verified.

---
*Phase: 25-prijsintelligentie-stakeholder-feedback-loop*
*Completed: 2026-03-31*
