---
phase: 1
slug: fundament
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + React Testing Library 16.3.2 |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | infra | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | PROF-01 | unit | `npx vitest run src/features/school-profile/__tests__/step1.test.tsx -t "validates"` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | PROF-02 | unit | `npx vitest run src/features/school-profile/__tests__/step2.test.tsx -t "validates"` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | PROF-03 | unit | `npx vitest run src/features/school-profile/__tests__/step3.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | PROF-04 | unit | `npx vitest run src/features/school-profile/__tests__/step4.test.tsx` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | DATA-01 | unit | `npx vitest run src/models/__tests__/pricing.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | DATA-02 | unit | `npx vitest run src/models/__tests__/pricing.test.ts -t "status"` | ❌ W0 | ⬜ pending |
| 01-03-03 | 03 | 1 | DATA-03 | unit | `npx vitest run src/models/__tests__/pricing.test.ts -t "stale"` | ❌ W0 | ⬜ pending |
| 01-03-04 | 03 | 1 | DATA-05 | unit | `npx vitest run src/models/__tests__/assumptions.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-05 | 03 | 1 | DATA-06 | unit | `npx vitest run src/components/__tests__/disclaimer.test.tsx` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 1 | UX-03 | smoke | Manual visual inspection | manual-only | ⬜ pending |
| 01-04-02 | 04 | 1 | UX-04 | unit | `npx vitest run src/styles/__tests__/theme.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test framework configuration
- [ ] `src/test/setup.ts` — test setup with cleanup and jest-dom matchers
- [ ] `src/models/__tests__/pricing.test.ts` — stubs for DATA-01, DATA-02, DATA-03
- [ ] `src/models/__tests__/assumptions.test.ts` — stubs for DATA-05
- [ ] `src/features/school-profile/__tests__/step1.test.tsx` — stubs for PROF-01
- [ ] `src/features/school-profile/__tests__/step2.test.tsx` — stubs for PROF-02
- [ ] `src/features/school-profile/__tests__/step3.test.tsx` — stubs for PROF-03
- [ ] `src/features/school-profile/__tests__/step4.test.tsx` — stubs for PROF-04
- [ ] `src/components/__tests__/disclaimer.test.tsx` — stubs for DATA-06
- [ ] `src/styles/__tests__/theme.test.ts` — stubs for UX-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All UI text is Dutch | UX-03 | Language is hardcoded strings, not programmatic i18n | Visual inspection: navigate all wizard steps, verify all labels/buttons/messages are in Dutch |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
