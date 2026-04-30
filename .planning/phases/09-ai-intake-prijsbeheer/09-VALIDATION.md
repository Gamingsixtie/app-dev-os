---
phase: 9
slug: ai-intake-prijsbeheer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 9 — Validation Strategy

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
| 09-01-01 | 01 | 1 | INTAKE-01 | unit | `npx vitest run src/lib/__tests__/ai-intake-v2.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | INTAKE-02 | unit | `npx vitest run src/features/intake/__tests__/extraction-preview.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | INTAKE-03 | unit | `npx vitest run src/features/intake/__tests__/diff-view.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | PRIJSMGT-01 | unit | `npx vitest run src/features/school-profile/__tests__/price-management.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | PRIJSMGT-02 | unit | `npx vitest run src/features/school-profile/__tests__/price-history.test.ts` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 2 | INTAKE-04 | unit | `npx vitest run src/lib/__tests__/document-extraction.test.ts` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 2 | INTAKE-05 | unit | `npx vitest run src/features/school-profile/__tests__/document-upload.test.ts` | ❌ W0 | ⬜ pending |
| 09-04-01 | 04 | 2 | PRIJSMGT-03 | unit | `npx vitest run src/models/__tests__/price-validation.test.ts` | ❌ W0 | ⬜ pending |
| 09-04-02 | 04 | 2 | PRIJSMGT-04 | unit | `npx vitest run src/models/__tests__/price-status.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/ai-intake-v2.test.ts` — stubs for INTAKE-01 (extended extraction schema)
- [ ] `src/features/intake/__tests__/extraction-preview.test.ts` — stubs for INTAKE-02 (diff-view)
- [ ] `src/features/intake/__tests__/diff-view.test.ts` — stubs for INTAKE-03 (append-only)
- [ ] `src/features/school-profile/__tests__/price-management.test.ts` — stubs for PRIJSMGT-01 (CRUD)
- [ ] `src/features/school-profile/__tests__/price-history.test.ts` — stubs for PRIJSMGT-02 (history + active selection)
- [ ] `src/lib/__tests__/document-extraction.test.ts` — stubs for INTAKE-04 (document parsing)
- [ ] `src/features/school-profile/__tests__/document-upload.test.ts` — stubs for INTAKE-05 (upload UI)
- [ ] `src/models/__tests__/price-validation.test.ts` — stubs for PRIJSMGT-03 (deviation warning)
- [ ] `src/models/__tests__/price-status.test.ts` — stubs for PRIJSMGT-04 (status indicators)

*Existing infrastructure (vitest) covers framework needs — only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SSE streaming renders progressively | INTAKE-01 | Real-time UI rendering requires browser | Open Gesprekken-tab → paste long text → click Analyseer → verify fields appear one-by-one |
| Drag & drop file upload UX | INTAKE-04 | Browser drag events not testable in vitest | Drag a PDF onto the upload zone → verify preview appears |
| Inline ⚠ badge tooltip positioning | PRIJSMGT-03 | CSS tooltip positioning is visual | Hover over warning badge → verify tooltip shows publication price |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
