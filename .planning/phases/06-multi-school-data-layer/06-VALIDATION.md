---
phase: 6
slug: multi-school-data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 6 — Validation Strategy

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
| 06-01-XX | 01 | 1 | ARCH-01 | unit | `npx vitest run src/db/__tests__/operations.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-XX | 01 | 1 | ARCH-02 | unit | `npx vitest run src/db/__tests__/migrations.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-XX | 01 | 1 | ARCH-03 | unit | `npx vitest run src/db/__tests__/database.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-XX | 02 | 1 | ARCH-04 | unit | `npx vitest run src/router/__tests__/routes.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-XX | 02 | 1 | ARCH-04 | unit | `npx vitest run src/router/__tests__/guards.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-XX | 03 | 2 | MODE-01 | manual | Visual inspection | N/A | ⬜ pending |
| 06-03-XX | 03 | 2 | MODE-03 | manual | Visual inspection on tablet viewport | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D fake-indexeddb` — jsdom does not include IndexedDB, needed for Dexie tests in Vitest
- [ ] `src/db/__tests__/operations.test.ts` — stubs for ARCH-01 (CRUD)
- [ ] `src/db/__tests__/migrations.test.ts` — stubs for ARCH-02 (v1 migration)
- [ ] `src/db/__tests__/database.test.ts` — stubs for ARCH-03 (schema, indexing)
- [ ] `src/router/__tests__/routes.test.ts` — stubs for ARCH-04 (route resolution)
- [ ] `src/router/__tests__/guards.test.ts` — stubs for ARCH-04 (smart redirect)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| UI text uses formal Dutch (u-vorm) | MODE-01 | Linguistic check not automatable | Inspect all new UI strings for u-vorm compliance |
| Touch targets >= 44px, responsive layout | MODE-03 | Visual/interaction check | Test on tablet viewport (768px), verify all buttons/links meet 44px minimum |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
