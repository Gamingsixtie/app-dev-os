---
phase: 25
slug: prijsintelligentie-stakeholder-feedback-loop
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-30
updated: 2026-03-30
---

# Phase 25 — Validation Strategy

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
| 25-01-00 | 01 | 1 | Wave 0 stubs | scaffold | `npx vitest run ...all 10 stub files...` | Created by Task 0 | ⬜ pending |
| 25-01-02 | 01 | 1 | SC-1, SC-2 | unit | `npx vitest run src/db/__tests__/publication-prices.test.ts` | Created by Plan 01 Task 2 | ⬜ pending |
| 25-02-01 | 02 | 2 | SC-2 (store) | unit | `npx vitest run src/stores/__tests__/pricing-data-store.test.ts` | ✅ (Plan 02 tdd) | ⬜ pending |
| 25-02-02 | 02 | 2 | SC-2 (engine) | unit | `npx vitest run src/engine/__tests__/price-comparison-config-injection.test.ts` | ✅ (Plan 02 tdd) | ⬜ pending |
| 25-03-01 | 03 | 2 | SC-3 (flag price) | component | `npx vitest run src/features/pricing/__tests__/price-flag.test.tsx` | W0 stub -> Plan 03 fills | ⬜ pending |
| 25-03-02 | 03 | 2 | SC-3 (modal) | component | `npx vitest run src/features/pricing/__tests__/price-flag.test.tsx` | W0 stub -> Plan 03 fills | ⬜ pending |
| 25-04-01 | 04 | 3 | SC-4 (review queue) | component | `npx vitest run src/features/pricing/__tests__/review-queue.test.tsx` | W0 stub -> Plan 04 fills | ⬜ pending |
| 25-04-02 | 04 | 3 | SC-5 (auto recalc) | unit | `npx vitest run src/engine/__tests__/recalculation.test.ts` | W0 stub -> Plan 04 fills | ⬜ pending |
| 25-04-03 | 04 | 3 | SC-6 (audit trail) | integration | `npx vitest run src/db/__tests__/audit-trail.test.ts` | W0 stub -> Plan 04 fills | ⬜ pending |
| 25-05-01 | 05 | 3 | SC-13 (discount) | unit | `npx vitest run src/engine/__tests__/discount-patterns.test.ts` | W0 stub -> Plan 05 fills (tdd) | ⬜ pending |
| 25-06-01 | 06 | 3 | SC-7 (config) | unit | `npx vitest run src/features/admin/__tests__/config-validation.test.ts` | ✅ (Plan 06 tdd) | ⬜ pending |
| 25-06-02 | 06 | 3 | SC-7 (editor) | component | `npx vitest run src/features/pricing/__tests__/config-editor.test.tsx` | W0 stub -> Plan 06 fills | ⬜ pending |
| 25-06-03 | 06 | 3 | SC-8 (staleness) | unit | `npx vitest run src/engine/__tests__/staleness.test.ts` | W0 stub -> Plan 06 fills | ⬜ pending |
| 25-08-02 | 08 | 5 | SC-all | suite | `npm run build && npx vitest run` | All | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

All created by Plan 01, Task 0:

- [x] `src/db/__tests__/publication-prices.test.ts` — stubs for publication_prices CRUD (filled by Plan 01 Task 2)
- [x] `src/engine/__tests__/price-provider.test.ts` — async provider function with fallback
- [x] `src/features/pricing/__tests__/price-flag.test.tsx` — price flagging UI (filled by Plan 03)
- [x] `src/features/pricing/__tests__/review-queue.test.tsx` — review queue component (filled by Plan 04)
- [x] `src/engine/__tests__/recalculation.test.ts` — auto-recalculation on approval (filled by Plan 04)
- [x] `src/db/__tests__/audit-trail.test.ts` — audit log entries (filled by Plan 04)
- [x] `src/features/pricing/__tests__/config-editor.test.tsx` — config editor UI (filled by Plan 06)
- [x] `src/engine/__tests__/staleness.test.ts` — staleness detection logic (filled by Plan 06)
- [x] `src/hooks/__tests__/offline-pricing.test.ts` — offline fallback behavior
- [x] `src/engine/__tests__/discount-patterns.test.ts` — discount pattern detection (filled by Plan 05)

*All Wave 0 stubs created by Plan 01 Task 0. Downstream plans fill in actual test implementations.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review badge count updates in real-time | SC-4 (D-09) | Requires live Supabase subscription | Open app as manager, have another user submit proposal, verify badge increments |
| Offline banner appears when disconnected | SC-10 | Requires network simulation | Disable network in DevTools, verify banner and cached data display |
| AI normalization matches correct module | SC-9 (D-12) | Requires AI API call | Submit free-text price ("DIA rekent 6,20 voor rekenen"), verify correct module/provider match |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 01 Task 0)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
