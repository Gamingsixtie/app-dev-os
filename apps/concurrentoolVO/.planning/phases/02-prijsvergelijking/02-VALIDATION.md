---
phase: 2
slug: prijsvergelijking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | vitest.config.ts |
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
| 02-01-01 | 01 | 1 | PRIJS-01 | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PRIJS-02 | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | PRIJS-03 | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | PRIJS-06 | integration | `npx vitest run src/features/price-comparison/__tests__/store.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | PRIJS-04 | component | `npx vitest run src/features/price-comparison/__tests__/ComparisonChart.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | PRIJS-05 | component | `npx vitest run src/features/price-comparison/__tests__/ComparisonTable.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | DATA-04 | component | `npx vitest run src/features/price-comparison/__tests__/ModuleDetailPanel.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 2 | INPUT-01 | component | `npx vitest run src/features/price-comparison/__tests__/ModuleDetailPanel.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-xx-xx | xx | x | MODE-01 | manual | Visual review of copy tone | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/price-comparison.test.ts` — stubs for PRIJS-01, PRIJS-02, PRIJS-03
- [ ] `src/features/price-comparison/__tests__/store.test.ts` — stubs for PRIJS-06
- [ ] `src/features/price-comparison/__tests__/ComparisonChart.test.tsx` — stubs for PRIJS-04
- [ ] `src/features/price-comparison/__tests__/ComparisonTable.test.tsx` — stubs for PRIJS-05
- [ ] `src/features/price-comparison/__tests__/ModuleDetailPanel.test.tsx` — stubs for DATA-04, INPUT-01

*Existing infrastructure covers framework install (Vitest 4.1.0 already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Externe modus: formeel, neutraal "u"-vorm toon | MODE-01 | Copy tone requires human judgement | Review all user-facing strings for formal tone, no sales language, "u"-form |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
