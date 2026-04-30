# Architecture

> Foundation file. Every code-skill loads this to understand the system shape. Equivalent to `positioning.md` for marketing — but for system design.
>
> **Template scope:** This file describes the *expected shape* of apps built on App-Dev OS, not a specific running app. Concrete apps live under `apps/{slug}/` and may override this file via `apps/{slug}/code_context/architecture.md`. Skills load this template-level file when no app-level override exists.

## System overview

App-Dev OS template apps follow a Next.js + Supabase shape: a single TypeScript codebase deployed to Vercel, with Supabase handling Postgres, Auth, and Storage. Server Components render on the server; Route Handlers serve API endpoints; the browser talks to Supabase directly via signed URLs and the anon key. Solo-developer scale.

## Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js (App Router) + React + TypeScript 5.x strict (`noUncheckedIndexedAccess`) | Vercel-native; Server Components shrink client bundle; extra type-safety helps a non-senior solo dev |
| **Backend** | Next.js Route Handlers (`app/api/*/route.ts`) | No separate backend deploy; serverless on Vercel |
| **Database** | Supabase (Postgres) via `supabase-js` SDK — no separate ORM | RLS handles authorization at the DB layer; fewer abstraction layers |
| **Auth** | Supabase Auth | Bundled with the DB; e-mail / OAuth / magic-link out of the box |
| **Storage** | Supabase Storage | Signed URLs for uploads; the file never flows through a Vercel function |
| **Hosting** | Vercel (frontend + API) + Supabase (DB / Auth / Storage) | Auto-deploy on merge to `main`; preview URLs per feature branch |
| **Observability** | Vercel built-in logs + Sentry (errors) | Lean baseline; Sentry catches production bugs from day one. Add product analytics tools later only when a question can't be answered without them |

## Components

> The folders below are the *expected shape* — they appear once an app is added under `apps/{slug}/`. The root template does not yet contain runtime code.

- **`app/`** — routes, layouts, pages (Next.js App Router; Server Components by default)
- **`src/components/`** — reusable UI primitives; Client Components add `'use client'` at the top of the file
- **`src/lib/supabase/`** — `browser-client.ts`, `server-client.ts`, `service-role-client.ts`, `types.ts` (auto-generated via `supabase gen types typescript`)
- **`src/lib/auth/`** — `get-session.ts` (read session in Server Components), `require-user.ts` (route guard), plus a top-level `middleware.ts` for cookie refresh per request
- **`src/lib/env.ts`** — central env-var validation with Zod; throws early on missing keys
- **`src/lib/utils/`** — small helpers (dates, formatters); add only when reused
- **`src/lib/services/`** — *optional, on-demand only* — domain services per bounded context. Add only when the same Supabase logic duplicates across 3+ places, or when business rules start mixing with data access. **Not pre-created as an empty folder.**

## Data flow

```
Browser                       Vercel                     Supabase
───────                       ──────                     ────────
Server Component  ─────────►  Route Handler  ─────────►  Postgres (RLS)
       │                          │                          │
       │                          ├── auth ──────────────►   Auth
       │                          └── storage (signed URL)►  Storage
       │                                                     ▲
       └── direct upload via signed URL ────────────────────┘
```

- Server Components fetch via `server-client` (reads session cookie)
- Client Components mutate via `browser-client` (anon key only)
- Server-only operations (cron jobs, admin tasks) use `service-role-client` — never shipped to the browser
- Large file uploads bypass Vercel: the browser talks to Supabase Storage directly through a signed URL

## Key invariants

> Rules the system upholds that no skill should violate.

1. **Auth required on all `app/api/*/route.ts` handlers except `/api/health`.** Public endpoints are explicit, not implicit.
2. **DB access only via `supabase-js` SDK** — no raw SQL in app code, no direct HTTP calls to the Supabase REST API. Schema migrations live in `supabase/migrations/` as SQL (see `runbook.md`).
3. **Migrations are immutable once merged to `main`.** A bug in `005` is fixed by a new migration `006`, not by editing `005`. Other environments (and you in six months) have already run `005`.
4. **RLS is always on for Supabase tables.** Never publish a table without Row Level Security, even temporarily for debugging. RLS is the Postgres-level policy that decides who can read or write each row, based on the logged-in user.
5. **`service_role_key` lives only server-side** (Route Handlers, cron jobs) via `SUPABASE_SERVICE_ROLE_KEY`. It bypasses RLS, so it must never appear in a Client Component or a `NEXT_PUBLIC_*` env var. The browser uses the anon key.
6. **Auth state is read via Supabase helpers, never via custom JWT parsing.** Use `getSession()` / `requireUser()`. Supabase already validates and refreshes the token; a hand-rolled parser will eventually be wrong.
7. **Storage uploads use the Supabase Storage SDK with signed URLs**, never a custom endpoint that proxies the file. A custom upload route hits Vercel's body-size limit and adds latency for nothing.
8. **PII / sensitive user data never lives in client state or `localStorage`.** Zustand-persist is fine for UI state (open tab, form draft). User identity, e-mail, payment info, and secrets stay server-side.

## External services

> See also: `code_context/runbook.md` for environments and the `Service Registry` in `AGENTS.md` for API keys.

- **Supabase** — Postgres, Auth, Storage. Required for every app on this template.
- **Sentry** — error reporting. Recommended baseline; opt-in per app.
- **Vercel** — hosting, serverless functions, built-in logs.

App-specific services (Stripe, Resend, Anthropic API, etc.) get added per `apps/{slug}/code_context/architecture.md` when each app needs them.

## Directory structure

```
apps/{slug}/
├── app/                       # Next.js App Router routes + pages
├── src/
│   ├── components/            # UI primitives
│   ├── lib/
│   │   ├── supabase/          # client wrappers + generated types
│   │   ├── auth/              # session helpers
│   │   ├── env.ts             # validated env vars (Zod)
│   │   ├── utils/             # small reusable helpers
│   │   └── services/          # (optional, on demand only)
│   └── styles/                # global styles
├── middleware.ts              # Supabase cookie refresh on every request
├── supabase/
│   └── migrations/            # immutable SQL migrations
├── tests/
│   ├── unit/
│   └── e2e/                   # (optional, when needed)
└── public/                    # static assets
```

## ADR-equivalent

> Major decisions live here as bullets, not as separate files (Agentic OS-pattern). Promote to a full `ADR/{NNNN}-*.md` only when the decision warrants alternatives + reasoning.

- **2026-04-28** — Supabase via `supabase-js` SDK, no separate ORM. Promoted to [ADR-0001](../ADR/0001-supabase-sdk-no-orm.md).
- **2026-04-28** — Biome over ESLint + Prettier. Promoted to [ADR-0002](../ADR/0002-biome-over-eslint-prettier.md).
- **2026-04-28** — No mandatory `src/lib/services/` layer. Promoted to [ADR-0003](../ADR/0003-no-mandatory-services-layer.md).
- **2026-04-28** — Sentry for errors + Vercel built-in for logs; product analytics deferred. Promoted to [ADR-0004](../ADR/0004-sentry-and-vercel-logs-defer-analytics.md).
- _add new decisions below; promote heavy ones via `docs-adr` skill; never edit old ones; supersede with a new bullet (or new ADR) pointing to which it replaces_

---

*Edit this file once per project + when architecture shifts. Skills load it lazily per Context Matrix. Per-app overrides live in `apps/{slug}/code_context/architecture.md`.*
