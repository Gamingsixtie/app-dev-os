---
phase: 8
slug: supabase-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | ARCH-01 | unit | `npx vitest run src/db/__tests__/supabase-schema.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | ARCH-02 | unit | `npx vitest run src/db/__tests__/supabase-operations.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | AUTH-01 | integration | `npx vitest run src/auth/__tests__/auth-flow.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | AUTH-02 | unit | `npx vitest run src/auth/__tests__/rls-policies.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-03 | 02 | 1 | AUTH-03 | unit | `npx vitest run src/auth/__tests__/role-permissions.test.ts` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | ARCH-03 | integration | `npx vitest run src/db/__tests__/migration.test.ts` | ❌ W0 | ⬜ pending |
| 08-04-01 | 04 | 2 | ARCH-04, DEPLOY-01 | integration | `npx vitest run src/api/__tests__/ai-proxy.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/db/__tests__/supabase-schema.test.ts` — stubs for ARCH-01 schema validation
- [ ] `src/db/__tests__/supabase-operations.test.ts` — stubs for ARCH-02 CRUD operations
- [ ] `src/auth/__tests__/auth-flow.test.ts` — stubs for AUTH-01 login flow
- [ ] `src/auth/__tests__/rls-policies.test.ts` — stubs for AUTH-02 row-level security
- [ ] `src/auth/__tests__/role-permissions.test.ts` — stubs for AUTH-03 role-based access
- [ ] `src/db/__tests__/migration.test.ts` — stubs for ARCH-03 IndexedDB migration
- [ ] `src/api/__tests__/ai-proxy.test.ts` — stubs for ARCH-04 serverless AI proxy

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Magic link email delivery | AUTH-01 | Requires real email delivery | Send magic link, verify email arrives, click link, verify redirect to app |
| Vercel deployment accessibility | DEPLOY-01 | Requires live deployment | Deploy to Vercel, navigate to URL, verify app loads with auth |
| IndexedDB migration UI | ARCH-03 | Requires browser with existing IndexedDB data | Open app with existing local data, verify migration prompt appears, complete migration, verify data in Supabase |
| SSE streaming from serverless | ARCH-04 | Requires live serverless function | Trigger AI intake, verify response streams in real-time |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
