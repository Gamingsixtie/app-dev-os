---
phase: 14
slug: schoolplan-upload-kansen-analyse
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
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
| 14-01-01 | 01 | 1 | SC-01 | integration | `npx vitest run src/features/school-profile/tabs/__tests__/SchoolplanTab.test.tsx -x` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | SC-02 | unit | `npx vitest run src/features/school-profile/schemas/__tests__/schoolplan-analysis.schema.test.ts -x` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | SC-03 | unit | `npx vitest run api/__tests__/analyze-schoolplan.test.ts -x` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | SC-04 | unit | `npx vitest run api/__tests__/analyze-schoolplan.test.ts -x` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 2 | SC-05 | integration | `npx vitest run src/hooks/__tests__/useSchoolplanAnalysis.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/school-profile/schemas/__tests__/schoolplan-analysis.schema.test.ts` — Zod schema validation stubs for SC-02
- [ ] `src/hooks/__tests__/useSchoolplanAnalysis.test.ts` — React Query hook test stubs for SC-05
- [ ] `src/features/school-profile/tabs/__tests__/SchoolplanTab.test.tsx` — Tab integration test stubs for SC-01
- [ ] `api/__tests__/analyze-schoolplan.test.ts` — Serverless function test stubs for SC-03, SC-04

*Existing infrastructure covers framework setup. Only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SSE streaming shows two-step progress | D-08 | Real-time streaming UI requires browser observation | Upload a PDF, observe "Document wordt samengevat..." then "Kansen worden geidentificeerd..." messages |
| Drag-and-drop works on tablet | D-16 | Touch interaction testing | Test on iPad/tablet: drag PDF onto dropzone, verify upload starts |
| Kans-kaarten visual layout | D-02, D-03 | Visual design verification | Upload schoolplan, verify cards show all fields: theme, product, explanation, tip, score, quote, competitor |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
