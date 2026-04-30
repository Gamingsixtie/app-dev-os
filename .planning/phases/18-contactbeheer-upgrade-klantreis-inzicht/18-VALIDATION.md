---
phase: 18
slug: contactbeheer-upgrade-klantreis-inzicht
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 18 — Validation Strategy

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
| 18-01-01 | 01 | 1 | DMU role model upgrade | unit | `npx vitest run src/models/__tests__/` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | DMU migration | unit | `npx vitest run src/db/__tests__/` | ❌ W0 | ⬜ pending |
| 18-02-01 | 02 | 1 | ContactsTab grouping | unit | `npx vitest run src/features/school-profile/__tests__/` | ❌ W0 | ⬜ pending |
| 18-03-01 | 03 | 2 | Klantreis timeline | unit | `npx vitest run src/features/school-profile/__tests__/` | ❌ W0 | ⬜ pending |
| 18-04-01 | 04 | 2 | Dashboard integration | unit | `npx vitest run src/features/school-profile/__tests__/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for DMU position type changes
- [ ] Test stubs for data migration logic
- [ ] Test stubs for timeline data aggregation

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DMU visual hierarchy display | SC-2 | Visual layout ordering | Open ContactsTab, verify beslisser appears first with correct styling |
| Klantreis timeline chronological order | SC-3 | Visual chronological display | Add multiple contacts with different dates, verify timeline order |
| Dashboard DMU summary | SC-4 | Dashboard layout integration | Open school dashboard, verify DMU overview block renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
