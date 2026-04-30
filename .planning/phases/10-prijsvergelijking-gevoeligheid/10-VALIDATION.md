---
phase: 10
slug: prijsvergelijking-gevoeligheid
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
updated: 2026-03-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.ts` (vitest configured inline) |
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
| 10-01-01 | 01 | 1 | PRIJS-01 | unit | `npx vitest run src/engine/__tests__/dia-packages.test.ts` | W0 (created in 10-01 Task 1) | pending |
| 10-01-02 | 01 | 1 | PRIJS-02 | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts` | exists | pending |
| 10-02-01 | 02 | 2 | PRIJS-03 | unit | `npx vitest run src/engine/__tests__/hybrid-scenario.test.ts` | W0 (created in 10-01 Task 2) | pending |
| 10-02-02 | 02 | 2 | PRIJS-04 | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts` | exists | pending |
| 10-03-01 | 03 | 3 | GEVOEL-01 | unit | `npx vitest run src/engine/__tests__/sensitivity.test.ts` | W0 (created in 10-01 Task 2) | pending |
| 10-03-02 | 03 | 3 | GEVOEL-02 | unit | `npx vitest run src/engine/__tests__/sensitivity.test.ts` | W0 (created in 10-01 Task 2) | pending |
| 10-03-03 | 03 | 3 | GEVOEL-03 | unit | `npx vitest run src/engine/__tests__/sensitivity.test.ts` | W0 (created in 10-01 Task 2) | pending |
| 10-02-03 | 02 | 2 | MODE-02 | store-unit | `npx vitest run src/features/price-comparison/__tests__/mode-toggle.test.tsx` | W0 (created in 10-02 Task 3) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/dia-packages.test.ts` — created in Plan 10-01 Task 1 (TDD: tests written first)
- [ ] `src/engine/__tests__/hybrid-scenario.test.ts` — created in Plan 10-01 Task 2 (TDD: tests written first)
- [ ] `src/engine/__tests__/sensitivity.test.ts` — created in Plan 10-01 Task 2 (TDD: tests written first)
- [ ] `src/features/price-comparison/__tests__/mode-toggle.test.tsx` — created in Plan 10-02 Task 3 (store behavior tests for mode toggle)

*All Wave 0 test files are explicitly created by plan tasks. No orphan test requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sales-signaal badges visueel correct (kleur + positie) | GEVOEL-03 | Visual styling | Open vergelijking in interne modus, verify groene/gele/rode badges naast modulenamen |
| Staafdiagram met hybride data | PRIJS-05 | Chart rendering | Open vergelijking met hybride scenario, verify staafdiagram toont alle kolommen |
| Responsive tabel op tablet | PRIJS-06 | Viewport testing | Open in devtools 768px viewport, verify tabel scrollbaar en leesbaar |
| Intern/extern toggle hides sales signals and sensitivity | MODE-02 | Visual verification | Click Extern, verify badges and sensitivity section disappear; click Intern, verify they reappear (Plan 10-03 checkpoint Test 5) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (post-revision)
