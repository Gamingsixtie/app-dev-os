---
phase: 17
slug: huidig-cito-platform-vs-concurrent-prijsvergelijking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/scenario-c.test.ts` — tests for Scenario C engine calculations
- [ ] `src/features/price-comparison/wizard/__tests__/scenario-detection-c.test.ts` — tests for Scenario C detection

*Existing infrastructure covers framework and config — only new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ScenarioDetector keuze-UI | SC-1 | Visual interaction flow | Navigate wizard with alles-oud-cito setup, verify migratie vs concurrent keuze appears |
| AI retentie-advies output | SC-3 | AI prompt output quality | Trigger Scenario C comparison, verify advies uses retentie-frame language |
| Vergelijkingstabel 2-kolom | SC-4 | Visual layout verification | Complete Scenario C flow, verify table shows "Huidig Cito" vs concurrent columns |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
