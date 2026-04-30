---
phase: 16
slug: ai-wizard-verbetering-prijsvergelijking-harmonisatie
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 16 — Validation Strategy

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
| 16-01-01 | 01 | 1 | PRIJS-01 | unit | `npx vitest run src/features/price-comparison/wizard/__tests__/` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | PRIJS-03 | unit | `npx vitest run src/features/price-comparison/wizard/__tests__/` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | PRIJS-05 | unit | `npx vitest run src/engine/__tests__/` | ✅ | ⬜ pending |
| 16-02-02 | 02 | 1 | PRIJS-06 | unit | `npx vitest run src/engine/__tests__/` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 2 | PRIJS-01 | integration | `npx vitest run src/features/price-comparison/wizard/__tests__/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/price-comparison/wizard/__tests__/wizard-store.test.ts` — stubs for wizard Zustand store
- [ ] `src/features/price-comparison/wizard/__tests__/variant-suggestions.test.ts` — stubs for variant selection logic
- [ ] `src/features/price-comparison/wizard/__tests__/wizard-advice.test.ts` — stubs for wizard advice endpoint coverage

*Existing vitest infrastructure covers engine tests. New test files needed for wizard feature.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI streaming UX in stap 3 | PRIJS-05 | SSE streaming requires browser runtime | Open wizard, submit variant selection, verify streaming text appears progressively |
| Wizard step navigation | PRIJS-01 | Visual navigation flow | Click through all 3 steps, verify progress bar updates and back/forward works |
| Table update after "Pas tabel aan" | PRIJS-01 | Requires full React render cycle with Zustand | Complete wizard, click apply, verify ComparisonTable reflects wizard selections |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
