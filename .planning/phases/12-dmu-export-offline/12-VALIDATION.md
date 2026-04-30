---
phase: 12
slug: dmu-export-offline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
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
| 12-01-01 | 01 | 1 | EXPORT-01,02,03 | unit | `npx vitest run src/features/export/pdf/__tests__/` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | EXPORT-04 | build | `npx vitest run src/features/export/pdf/__tests__/ && npm run build` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | EXPORT-05 | unit | `npx vitest run src/lib/__tests__/clipboard.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | EXPORT-05 | build | `npx vitest run src/lib/__tests__/clipboard.test.ts && npm run build` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 1 | ARCH-05 | build | `npm run build` | ✅ | ⬜ pending |
| 12-03-02 | 03 | 1 | ARCH-05 | unit | `npx vitest run src/lib/__tests__/offline-queue.test.ts && npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/export/pdf/__tests__/dmu-filters.test.ts` — test DMU section filtering and reordering
- [ ] `src/features/export/pdf/__tests__/pdf-bar-chart.test.ts` — test SVG chart data generation
- [ ] `src/lib/__tests__/clipboard.test.ts` — test clipboard formatting
- [ ] `src/lib/__tests__/offline-queue.test.ts` — test offline mutation queue and sync

*Existing vitest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF visual layout with Cito branding | EXPORT-04 | Visual correctness requires human review | Generate PDF, verify #003082/#FF6600 colors, logo, disclaimer text |
| Offline tablet functionality | ARCH-05 | Requires device/network testing | Enable airplane mode on tablet, verify app loads and displays cached data |
| Clipboard paste in Teams/Outlook | EXPORT-05 | Rich text rendering varies by app | Copy to clipboard, paste in Teams and Outlook, verify formatting |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
