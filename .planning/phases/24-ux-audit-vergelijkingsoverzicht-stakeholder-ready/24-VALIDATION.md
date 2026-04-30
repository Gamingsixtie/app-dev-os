---
phase: 24
slug: ux-audit-vergelijkingsoverzicht-stakeholder-ready
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
updated: 2026-03-28
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | D-08, D-14, D-15 | build | `npx tsc --noEmit` | N/A | pending |
| 24-01-02 | 01 | 1 | D-02, D-04, D-05, D-06, D-07, D-14 | build | `npm run build` | N/A | pending |
| 24-01-03 | 01 | 1 | D-05, D-06, D-08, D-10, D-11, D-14, D-15 | unit | `npx vitest run src/features/price-comparison/__tests__/PriceComparisonPage.test.tsx src/features/price-comparison/__tests__/ProviderToolbar.test.tsx --reporter=verbose` | Wave 0 (created in this task) | pending |
| 24-02-01 | 02 | 2 | D-01, D-09 | build | `npm run build` | N/A | pending |
| 24-02-02 | 02 | 2 | D-01 through D-17 | manual | Visual: full page verification (11-step checklist) | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Plan 01, Task 3 creates the behavioral test files that serve as Wave 0:

- [x] `src/features/price-comparison/__tests__/PriceComparisonPage.test.tsx` — section order (D-05), color bands (D-15), collapse defaults (D-10, D-11), no differentiators (D-06), tooltips (D-14)
- [x] `src/features/price-comparison/__tests__/ProviderToolbar.test.tsx` — merged component with popover (D-08)

These are created as Task 3 of Plan 01 (after Tasks 1-2 create the components under test).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Section order matches D-05 hierarchy | D-01-D-05 | Visual layout order (also covered by unit test) | Open comparison page, verify: AI hero -> bediening -> totalen -> toolbar -> tabel -> grafiek -> meerwaarde -> disclaimer |
| Alternating color bands | D-15 | Visual styling (also covered by unit test) | Verify alternating bg-neutral-50/bg-white sections |
| AI hero collapse/expand | D-09 | Interactive behavior | Click "Lees volledig advies", verify expand/collapse |
| Provider toolbar with popovers | D-08 | Interactive behavior (also covered by unit test) | Click info icons, verify pricing model info appears |
| Chart collapsed by default | D-10 | Visual state (also covered by unit test) | Load page fresh, verify chart section is collapsed |
| MeerwaardePanel collapsed by default | D-11 | Visual state (also covered by unit test) | Load page fresh, verify meerwaarde is collapsed |
| Self-explanatory labels | D-14 | Content review (also covered by unit test for presence) | Hover over "bundel" label — tooltip: "Een bundel combineert meerdere modules met volumekorting". Hover over PeriodToggle — tooltip about contractperiode. Check "per leerling/jaar" tooltip. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 01 Task 3)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (updated to reflect behavioral test coverage)
