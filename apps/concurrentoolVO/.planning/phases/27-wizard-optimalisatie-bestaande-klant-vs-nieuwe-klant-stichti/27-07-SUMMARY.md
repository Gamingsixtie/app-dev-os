---
phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti
plan: 07
subsystem: stichtingen
tags: [stichting, bulk-link, smart-suggestion, levenshtein, no-npm-dep, wave-2, R11]

# Dependency graph
requires:
  - phase: 27-01
    provides: stichtingMatcher.test.ts scaffold (it.todo placeholders → converted to GREEN here)
  - phase: 27-02
    provides: Stichting data-laag (StichtingRecord + Supabase migration 014 + Dexie v3 + linkSchoolToStichting / unlinkSchoolFromStichting / listSchoolsForStichting + /stichtingen and /stichtingen/:id routes)
provides:
  - src/lib/stringSimilarity.ts — pure Wagner–Fischer Levenshtein + normalised similarity in [0, 1] (~70 LOC, no npm dep)
  - src/lib/stichtingMatcher.ts — suggestSchoolsForStichting() pure function (NAAM_WEIGHT 0.65 + REGIO_WEIGHT 0.35, MIN_SCORE_SUGGESTED 0.6, PRE_CHECKED_THRESHOLD 0.8)
  - src/db/operations.ts — bulkLinkSchools(stichtingId, schoolIds) + bulkUnlinkSchools(schoolIds) helpers (single Supabase UPDATE ... IN call)
  - src/features/stichtingen/hooks/useStichtingen.ts — useUnlinkedSchools() query + useBulkLinkSchools() mutation
  - src/features/stichtingen/components/StichtingSuggestionList.tsx — stateless smart-suggestion list with confidence % + reasons tooltip + "Sterke match" badge
  - src/features/stichtingen/components/BulkLinkSchoolsDialog.tsx — multi-select dialog with Voorgestelde matches + Handmatig toevoegen sections, footer counter, bulk submit
  - StichtingDetailPage "+ Scholen koppelen" CTA wired to BulkLinkSchoolsDialog
  - 17 unit tests covering similarity + matcher edge cases (4+ for stringSimilarity, 10 for stichtingMatcher)
affects: [phase-27-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline Wagner–Fischer Levenshtein in src/lib/stringSimilarity.ts — ~70 LOC, zero npm deps (Phase 22 deps-policy), case-sensitive primitive (caller lowercases) so the same function can serve case-preserving callers too"
    - "Smart-suggestion weights as named exports (NAAM_WEIGHT, REGIO_WEIGHT, MIN_SCORE_SUGGESTED, PRE_CHECKED_THRESHOLD) so tests can assert thresholds against the source-of-truth constants instead of magic numbers"
    - "Suggestion sort is descending by score with a `localeCompare(name, 'nl')` tie-break so test ordering is deterministic when scores collide"
    - "BulkLinkSchoolsDialog seeds selectedIds from preChecked suggestions on open and re-seeds on stichting-id change via a snapshot guard — avoids stale selection when the same dialog instance is reused for a different Stichting"
    - "useUnlinkedSchools reuses getAllSchools() and filters client-side — RLS already bounds the working set to the team, so a dedicated Supabase query would just duplicate the team-scope WHERE"

key-files:
  created:
    - apps/concurrentoolVO/src/lib/stringSimilarity.ts
    - apps/concurrentoolVO/src/lib/stichtingMatcher.ts
    - apps/concurrentoolVO/src/lib/__tests__/stringSimilarity.test.ts
    - apps/concurrentoolVO/src/features/stichtingen/components/StichtingSuggestionList.tsx
    - apps/concurrentoolVO/src/features/stichtingen/components/BulkLinkSchoolsDialog.tsx
    - apps/concurrentoolVO/.planning/phases/27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti/27-07-SUMMARY.md
  modified:
    - apps/concurrentoolVO/src/lib/__tests__/stichtingMatcher.test.ts (Plan 27-01 it.todo → 10 GREEN tests)
    - apps/concurrentoolVO/src/db/operations.ts (+ bulkLinkSchools + bulkUnlinkSchools)
    - apps/concurrentoolVO/src/features/stichtingen/hooks/useStichtingen.ts (+ useUnlinkedSchools + useBulkLinkSchools + UNLINKED_SCHOOLS_QUERY_KEY)
    - apps/concurrentoolVO/src/features/stichtingen/StichtingDetailPage.tsx (+ "Scholen koppelen" CTA + BulkLinkSchoolsDialog mount + useUnlinkedSchools wiring)
    - apps/concurrentoolVO/.planning/phases/27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti/deferred-items.md (added Plan 27-07 scope notes for pre-existing pricing + school-profile errors)

key-decisions:
  - "[Phase 27-07]: Suggestion sort is descending by `score` with a deterministic `localeCompare(name, 'nl')` tie-break — guarantees stable ordering for tests and for sales (no flicker between renders) when two schools tie on score"
  - "[Phase 27-07]: `similarity()` is intentionally case-sensitive — the matcher lowercases inputs before calling it. Keeps the primitive reusable for places that need case-preserving comparison (e.g. acronym detection) without forcing all callers to opt out of case-folding"
  - "[Phase 27-07]: `useUnlinkedSchools()` filters `getAllSchools()` client-side rather than adding a `.is('stichting_id', null)` Supabase query — RLS already bounds the table to the team, so the extra query would be redundant. Client-side filter keeps the implementation in one place and avoids cache fragmentation"
  - "[Phase 27-07]: BulkLinkSchoolsDialog uses a `seedSnapshot` state variable to detect stichting-id changes and re-seed `selectedIds` — handles the case where the same dialog instance is reused for a different Stichting without unmounting (defensive; current callers mount/unmount per Stichting anyway)"
  - "[Phase 27-07]: Plan 27-01 stichtingMatcher scaffold had 6 it.todo placeholders; this plan replaced them with 10 real tests (added 4: filter-out-already-linked, MIN_SCORE_SUGGESTED export verification, exact-match-with-no-regio yields 0.65, regio adds exactly REGIO_WEIGHT)"
  - "[Phase 27-07]: Confidence-percentage shown in UI (per D-03 'Claude's discretion' on whether to surface) — sales transparency outweighs the 'opaque algorithm' alternative. Pre-checked badge ('Sterke match') gives a visual cue without forcing sales to interpret the number"

requirements-completed: [R11]

# Metrics
duration: ~35min
completed: 2026-05-15
---

# Phase 27 Plan 07: Stichting bulk-link smart-suggestion (R11) Summary

**Inline Levenshtein + Stichting bulk-link multi-select dialog met smart-suggestion (D-03). Geen npm dep (Phase 22 deps-policy). 17 lib-tests groen. Bulk-link route koppelt N scholen in één Supabase call.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-15T00:50:00Z
- **Completed:** 2026-05-15T01:25:00Z
- **Tasks:** 2 (both fully automated)
- **Files modified:** 11 (6 created + 5 modified)
- **Commits:** 2 atomic

## Accomplishments

- **Lib-laag complete (Task 1):** `src/lib/stringSimilarity.ts` (Wagner–Fischer Levenshtein, pure functions, no npm dep) and `src/lib/stichtingMatcher.ts` (`suggestSchoolsForStichting()` with weighted naam + regio heuristic). 17 unit tests green (7 stringSimilarity + 10 stichtingMatcher, replacing Plan 27-01 `it.todo` scaffolds).
- **Operations + hooks (Task 2):** `bulkLinkSchools(stichtingId, schoolIds)` does the work in a single Supabase `UPDATE ... WHERE id IN (...)` call. Symmetric `bulkUnlinkSchools` added for future flows. React Query layer gets `useUnlinkedSchools()` query + `useBulkLinkSchools()` mutation (invalidates stichting-schools + unlinked-schools + schools caches on success).
- **UI complete (Task 2):** Stateless `StichtingSuggestionList` renders confidence % + "Sterke match" badge. Stateful `BulkLinkSchoolsDialog` shows Voorgestelde matches + collapsible Handmatig toevoegen sections, footer counter, Annuleren / Koppelen buttons. Initial selection seeded from preChecked suggestions; per-stichting re-seed via snapshot guard. Wired into `StichtingDetailPage` as a primary "+ Scholen koppelen" CTA in the header.
- **Threat model honoured:** T-27-07-03 (cross-team bulk-link) blocked by the existing schools UPDATE RLS policy; T-27-07-01 (Levenshtein DoS) bounded by the 100-char DB constraint on school + stichting names (≤10K ops per pair). No new attack surface introduced.

## Task Commits

Each task was committed atomically:

1. **Task 1: Inline Levenshtein + stichtingMatcher smart-suggestion** — `ffaf6a4` (feat)
2. **Task 2: bulk-link UI + bulkLinkSchools operation + smart-suggestion dialog** — `c8a1a02` (feat)

## Files Created/Modified

### Created (6 files)

- `src/lib/stringSimilarity.ts` — `similarity(a, b)` exported pure function. ~70 LOC including JSDoc + internal `levenshtein()` helper.
- `src/lib/stichtingMatcher.ts` — `suggestSchoolsForStichting()` exported pure function + `MatchSuggestion` interface + `NAAM_WEIGHT` / `REGIO_WEIGHT` / `MIN_SCORE_SUGGESTED` / `PRE_CHECKED_THRESHOLD` named-export constants.
- `src/lib/__tests__/stringSimilarity.test.ts` — 7 tests (identical / empty / one-empty / partial overlap / case-sensitivity / symmetry / disjoint).
- `src/features/stichtingen/components/StichtingSuggestionList.tsx` — stateless render of `MatchSuggestion[]` with checkbox + name + confidence % (rounded) + "Sterke match" badge when preChecked. Empty-state copy in Dutch.
- `src/features/stichtingen/components/BulkLinkSchoolsDialog.tsx` — stateful dialog. Sections: Voorgestelde matches (`StichtingSuggestionList`), Handmatig toevoegen (collapsible, schools sorted nl-collation). Footer: N selected counter + Annuleren + Koppelen.
- `.planning/phases/.../27-07-SUMMARY.md` — this file.

### Modified (5 files)

- `src/lib/__tests__/stichtingMatcher.test.ts` — replaced 6 `it.todo` placeholders with 10 GREEN tests (empty ongekoppeld / exact match / regio bonus / score floor / NaN-safe / sort order / already-linked filter / determinism / preChecked threshold / MIN_SCORE_SUGGESTED floor).
- `src/db/operations.ts` — added `bulkLinkSchools` + `bulkUnlinkSchools` after `unlinkSchoolFromStichting`. 35 lines added.
- `src/features/stichtingen/hooks/useStichtingen.ts` — added `useUnlinkedSchools` query + `useBulkLinkSchools` mutation + `UNLINKED_SCHOOLS_QUERY_KEY` constant.
- `src/features/stichtingen/StichtingDetailPage.tsx` — added `+ Scholen koppelen` header CTA (primary button, left of Bewerken/Verwijderen), `bulkLinkOpen` state, mounted `BulkLinkSchoolsDialog` at page level, wired `useUnlinkedSchools`.
- `.planning/phases/.../deferred-items.md` — appended Plan 27-07 scope notes documenting pre-existing pricing + school-profile build/test failures from concurrent in-flight plans (27-03 + pricing refactor).

## Decisions Made

See `key-decisions` in frontmatter. Most consequential:

- **Inline Levenshtein, not a npm dep** — Phase 22 deps-policy + ~70 LOC fits in one file. Easier to test, no bundle bloat.
- **Suggestion sort: score desc with `localeCompare(name, 'nl')` tie-break** — keeps determinism strict for tests and for sales (no visual flicker between renders).
- **`useUnlinkedSchools` filters `getAllSchools()` client-side** — RLS already team-bounded; avoids cache fragmentation and a second Supabase query.
- **Confidence % visible in UI** — D-03 listed this as Claude's discretion. Picked transparency over opacity: a 73 % match is more meaningful to sales than an unlabelled "suggestion".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused `suggestionIds` variable in BulkLinkSchoolsDialog memo**

- **Found during:** Task 2 first `npm run build` after authoring the dialog.
- **Issue:** Initial implementation destructured `suggestionIds` from the `useMemo` return for type-narrowing but never used the variable after the filter step. `tsc` flagged with `TS6133: 'suggestionIds' is declared but its value is never read`.
- **Fix:** Moved `suggestionIds` inside the `useMemo` body so it stays a function-scoped local and dropped it from the destructured return shape.
- **Files modified:** `src/features/stichtingen/components/BulkLinkSchoolsDialog.tsx`
- **Commit:** included in `c8a1a02` (caught + fixed before commit).

### Plan-vs-reality clarifications

**2. [Rule 2 - Auto-add missing critical functionality] Added `bulkUnlinkSchools` for symmetry**

- **Found during:** Task 2 implementation.
- **Issue:** Plan listed only `bulkLinkSchools`. While there is no current UI consumer for bulk-unlink, omitting it would mean a later "verplaats N scholen tegelijk" or "leeg een stichting" flow has to either re-implement the same `.in('id', ...)` pattern or fall back to per-row `unlinkSchoolFromStichting` calls (N HTTP round-trips).
- **Fix:** Added `bulkUnlinkSchools(schoolIds)` next to `bulkLinkSchools` with identical semantics: empty array → no-op, RLS gates the write, sets `stichting_id` to NULL.
- **Files modified:** `src/db/operations.ts`
- **Commit:** included in `c8a1a02`.

### Scope-boundary discoveries (NOT fixed — out of Plan 27-07 scope)

Several pre-existing TS errors and vitest failures surfaced when running the
plan's verification gates. All are in files outside Plan 27-07's scope and
were documented in `deferred-items.md`:

- 8 `src/features/pricing/PrijzenPage.tsx` TS errors — in-progress pricing-page refactor (already documented by 27-06 in deferred-items).
- 19 vitest failures across `pricing/__tests__/*` + `school-profile/__tests__/*` — same in-flight pricing refactor + Plan 27-03's WizardStep1 R3/R4 changes.

These existed in the working tree before Plan 27-07 started (verified by
`git stash` + rebuild) and would have failed in the same way without my
plan's changes. No file in Plan 27-07's scope (`src/lib/*`,
`src/features/stichtingen/*`, `src/db/operations.ts`) has any error or
failing test.

## Issues Encountered

- **Concurrent agent crosstalk in working tree.** Plans 27-03 (R3/R4 WizardStep1 fields + data-laag) and an in-progress pricing-page refactor were landing files in the working tree concurrently with this plan. Confirmed via the per-task `git stash` baseline that none of those errors trace back to Plan 27-07 changes. Staged only files in 27-07's documented scope (`src/db/operations.ts`, `src/features/stichtingen/*`, `src/lib/*`).

## Known Stubs

- **`bulkUnlinkSchools` is not wired into any UI yet.** Added for symmetry with `bulkLinkSchools` (Rule 2 auto-add). The function works in isolation; a future plan (e.g. 27-11 stichting export needing a "leegmaken vóór delete" flow) can hook into it without re-implementing the `.in('id', ...)` pattern.
- **Aggregated `schoolCount` on `StichtingCard` is still 0.** Plan 27-02 SUMMARY flagged this; this plan does not change it. The smart-suggestion code path doesn't need the aggregated count itself — it only consults the per-Stichting unlinked-schools list at dialog-open time.

## Self-Check: PASSED

- Files exist:
  - FOUND: `apps/concurrentoolVO/src/lib/stringSimilarity.ts`
  - FOUND: `apps/concurrentoolVO/src/lib/stichtingMatcher.ts`
  - FOUND: `apps/concurrentoolVO/src/lib/__tests__/stringSimilarity.test.ts`
  - FOUND: `apps/concurrentoolVO/src/lib/__tests__/stichtingMatcher.test.ts`
  - FOUND: `apps/concurrentoolVO/src/features/stichtingen/components/StichtingSuggestionList.tsx`
  - FOUND: `apps/concurrentoolVO/src/features/stichtingen/components/BulkLinkSchoolsDialog.tsx`
- Commits exist:
  - FOUND: `ffaf6a4` (Task 1: lib + tests)
  - FOUND: `c8a1a02` (Task 2: bulk-link UI + operation)
- Code wired:
  - FOUND: `bulkLinkSchools` export in `src/db/operations.ts`
  - FOUND: `useUnlinkedSchools` + `useBulkLinkSchools` exports in `src/features/stichtingen/hooks/useStichtingen.ts`
  - FOUND: `+ Scholen koppelen` CTA in `StichtingDetailPage.tsx`
  - FOUND: `BulkLinkSchoolsDialog` mount in `StichtingDetailPage.tsx`
- Tests green:
  - FOUND: `npx vitest run src/lib/__tests__/stringSimilarity.test.ts src/lib/__tests__/stichtingMatcher.test.ts` → 17/17 passed
- Build status: Plan 27-07 files compile cleanly. Pre-existing PrijzenPage errors documented in `deferred-items.md` (not in 27-07 scope).

## User Setup Required

None — no new env-vars, no new external services, no new dependencies, no Supabase migration. The `bulkLinkSchools` operation uses the existing `schools` table + the `stichting_id` column added by Plan 27-02's migration 014.

## Next Phase Readiness

- **Plan 27-11 (R2 stichting export)** — can now rely on `listSchoolsForStichting(id)` returning the full set of bulk-linked schools, including any added via the smart-suggestion dialog. CSV + DMU-PDF aggregation has a stable working set.
- **Plan 27-12 (E2E + UAT)** — bulk-link flow has an entry point (`+ Scholen koppelen` CTA on the StichtingDetailPage) suitable for Playwright. The dialog's `selectedCount === 0` disabled state + footer counter make for clean assertions.

---
*Phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti*
*Plan: 07*
*Completed: 2026-05-15*
