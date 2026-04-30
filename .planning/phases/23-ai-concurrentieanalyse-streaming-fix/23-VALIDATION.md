---
phase: 23
slug: ai-concurrentieanalyse-streaming-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 23 — Validation Strategy

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
| 23-01-01 | 01 | 1 | Fluid Compute verification | manual | Check Vercel dashboard | N/A | ⬜ pending |
| 23-01-02 | 01 | 1 | Server-side JSON assembly | unit | `npx vitest run api/` | ❌ W0 | ⬜ pending |
| 23-01-03 | 01 | 1 | No 504 timeouts | integration | Manual production test | N/A | ⬜ pending |
| 23-01-04 | 01 | 1 | No JSON parse errors | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 23-02-01 | 02 | 2 | Progress indicator | manual | Visual verification | N/A | ⬜ pending |
| 23-02-02 | 02 | 2 | Retry logic | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 23-02-03 | 02 | 2 | Error messages | manual | Visual verification | N/A | ⬜ pending |
| 23-03-01 | 03 | 3 | Health check endpoint | integration | `curl /api/ai-analysis/health` | ❌ W0 | ⬜ pending |
| 23-03-02 | 03 | 3 | Model cascade | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for server-side JSON assembly
- [ ] Test stubs for retry logic
- [ ] Test stubs for model cascade behavior

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No 504 on production | Success criteria 1-2 | Requires Vercel production deployment | Deploy and trigger AI analysis on toolvo.vercel.app |
| Progress indicator UX | D-03 | Visual UI behavior | Trigger analysis, observe step transitions |
| Error messages per type | D-05 | Requires simulated failures | Test with invalid API key, network disconnect |
| Fluid Compute status | D-06/D-07 | Vercel dashboard check | Verify in Vercel project settings |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
