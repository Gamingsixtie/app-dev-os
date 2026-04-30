---
phase: 13
slug: architectuur-review-go-live
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | REVIEW-01 | security | `grep -r "SKIP_AUTH" api/` | N/A | ⬜ pending |
| 13-01-02 | 01 | 1 | REVIEW-01 | security | `grep -r "VITE_.*API_KEY" src/` | N/A | ⬜ pending |
| 13-02-01 | 02 | 1 | REVIEW-01 | build | `npm run build` | N/A | ⬜ pending |
| 13-03-01 | 03 | 2 | REVIEW-01 | e2e | manual verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase RLS policies work correctly | REVIEW-01 | Requires authenticated requests to Supabase | Test with different user roles via Supabase dashboard |
| Production URL accessible | REVIEW-01 | Requires network access | Visit production URL and verify app loads |
| Performance under load (200+ schools) | REVIEW-01 | Requires production data | Check Supabase dashboard for query performance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
