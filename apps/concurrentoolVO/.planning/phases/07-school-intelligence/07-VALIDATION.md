---
phase: 7
slug: school-intelligence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SCHOOL-01 | unit | `npx vitest run src/db/__tests__/operations.test.ts -x` | ✅ (extend) | ⬜ pending |
| 07-01-02 | 01 | 1 | SCHOOL-02 | unit | `npx vitest run src/db/__tests__/operations.test.ts -x` | ✅ (extend) | ⬜ pending |
| 07-01-03 | 01 | 1 | DB Migration | unit | `npx vitest run src/db/__tests__/database.test.ts -x` | ✅ (extend) | ⬜ pending |
| 07-02-01 | 02 | 2 | SCHOOL-03 | unit | `npx vitest run src/features/school-profile/__tests__/contacts.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | D-11 | unit | `npx vitest run src/features/school-profile/__tests__/contacts.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | SCHOOL-04 | unit | `npx vitest run src/features/school-profile/__tests__/conversations.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-04-01 | 04 | 3 | SCHOOL-05 | unit | `npx vitest run src/features/school-profile/__tests__/pipeline.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-04-02 | 04 | 3 | D-24 | unit | `npx vitest run src/features/school-profile/__tests__/pipeline.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-04-03 | 04 | 3 | D-27 | unit | `npx vitest run src/features/school-profile/__tests__/pipeline.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-05-01 | 05 | 3 | SCHOOL-06 | unit | `npx vitest run src/features/school-overview/__tests__/filter.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-05-02 | 05 | 3 | PRIJS-07 | unit | `npx vitest run src/features/price-comparison/__tests__/store.test.ts -x` | ✅ (verify) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/school-profile/__tests__/contacts.test.ts` — stubs for SCHOOL-03, D-11
- [ ] `src/features/school-profile/__tests__/conversations.test.ts` — stubs for SCHOOL-04
- [ ] `src/features/school-profile/__tests__/pipeline.test.ts` — stubs for SCHOOL-05, D-24, D-27
- [ ] `src/features/school-overview/__tests__/filter.test.ts` — stubs for SCHOOL-06
- [ ] `src/db/__tests__/schema-migration.test.ts` — stubs for v1-to-v2 Dexie upgrade

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag & drop kanban pipeline view | D-21 | DnD interaction cannot be unit tested | Drag a school card between pipeline columns, verify status updates |
| Context-smart actions adapt per status | D-03 | Visual verification needed | Check each pipeline status shows correct CTA buttons |
| Compact vs expanded card toggle | D-06 | Visual preference toggle | Toggle view mode, verify card content changes |
| Inline editing wizard data | D-04 | Complex interaction flow | Edit school name/levels inline, verify save |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
