---
phase: 11
slug: waarde-engine-migratie
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-23
---

# Phase 11 — Validation Strategy

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
| 11-01-T1 | 01 | 1 | WAARDE-01, WAARDE-02, WAARDE-03 | unit (TDD) | `npx vitest run src/engine/__tests__/migration.test.ts -x` | W0 inline (RED step creates tests) | pending |
| 11-01-T2 | 01 | 1 | WAARDE-04, SCHOOL-07 | unit (TDD) | `npx vitest run src/engine/__tests__/upsell.test.ts src/engine/__tests__/migration.test.ts -x` | W0 inline (RED step creates tests) | pending |
| 11-02-T1 | 02 | 2 | WAARDE-01, WAARDE-02, WAARDE-03, WAARDE-04, MIGR-01, MIGR-02 | build | `npm run build` | n/a (UI components) | pending |
| 11-02-T2 | 02 | 2 | WAARDE-01, MIGR-03 | build+unit | `npm run build && npx vitest run` | n/a (wiring) | pending |
| 11-03-T1 | 03 | 3 | SCHOOL-07, MIGR-03 | build+unit | `npm run build && npx vitest run` | n/a (UI components) | pending |
| 11-03-T2 | 03 | 3 | ALL | visual | `npm run build` | n/a (checkpoint) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `src/engine/__tests__/migration.test.ts` — extended with break-even, switching costs tests inline via TDD RED step in Plan 11-01 Task 1
- [x] `src/engine/__tests__/upsell.test.ts` — new file created inline via TDD RED step in Plan 11-01 Task 2
- [x] Test fixtures for school profiles with competitor module setups — created inline in upsell test mocks

*Wave 0 is satisfied by TDD plans that create test files as part of the RED step before writing implementation code.*

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero card shows combined value | WAARDE-02 | Visual layout | Open school profile -> Waarde tab -> verify hero shows combined total |
| Inline editing persists | WAARDE-01 | UI interaction | Edit hours/uurtarief -> refresh -> verify values persist |
| Upsell badge on school cards | SCHOOL-07 | Visual rendering | Open schooloverzicht -> verify badge count on cards |
| Recharts multi-year chart | MIGR-02 | Visual rendering | Open Waarde tab -> verify 1/3/5yr bar chart renders |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
