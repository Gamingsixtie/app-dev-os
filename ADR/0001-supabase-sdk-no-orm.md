# ADR-0001: Use Supabase SDK without separate ORM

- **Status**: Accepted
- **Date**: 2026-04-28
- **Supersedes**: —

## Context

App-Dev OS targets solo non-senior developers shipping apps on Vercel + Supabase. The stack needs database access from three places: React Server Components, Route Handlers (`app/api/*/route.ts`), and rare admin scripts using the service-role key. Supabase's Postgres comes with Row-Level Security (RLS) enforced at the database layer — auth happens in the database, not the application. The project explicitly values "no premature abstraction" (see `context/DEV_ETHOS.md`) and Postgres-first patterns. Anything sitting between the app and Postgres needs to justify its weight.

## Decision

Use the official `supabase-js` SDK as the only database access path. No separate ORM (Drizzle / Prisma) and no raw SQL strings inside application code. DDL (schema migrations) lives in `supabase/migrations/` and is applied via the Supabase CLI.

## Alternatives considered

- **Drizzle ORM**: TypeScript-first, lightweight, popular in the Vercel ecosystem — but adds a second source of truth for schema (Drizzle types vs Supabase migrations), and its query builder doesn't reduce supabase-js usage enough to justify the extra tool for solo dev.
- **Prisma**: mature, generator-driven, great DX — but it owns the schema (`prisma/schema.prisma`) which collides with Supabase migrations, doesn't pair cleanly with RLS, and is a heavyweight addition for low-scale solo apps.
- **Raw SQL strings in app code**: maximum flexibility, no extra tools — but bypasses Supabase's typed helpers, makes RLS easy to forget, harder to review, and risks credential leakage.
- **Chosen option (supabase-js SDK only)**: one tool, types come from auto-generated `database.types.ts`, RLS lives where it belongs (Postgres), no schema-drift risk between ORM and migrations.

## Consequences

- Positive: one tool, simpler mental model, RLS is the only authorization layer (no chance of bypassing it from the ORM), no duplicate schema definition, faster onboarding for new contributors.
- Negative: refactoring SDK-call patterns later requires touch-points across the codebase since there's no central repository pattern. SDK queries are less expressive than a typed query builder for complex joins.
- Trade-offs we accept: some duplication of `supabase-js` calls is fine until the same pattern appears 3+ places, at which point we refactor that feature into `src/lib/services/` (see ADR-0003). Complex queries that hit SDK limits go into Postgres functions or views, not raw SQL in app code.

## Links

- Phase 2 — stack lock (USER.md)
- Phase 4 — DB-layer decision (architecture.md, choice 1a)
- Related ADRs: ADR-0003 (services layer)
- Code references: `code_context/architecture.md` § Database, `code_context/conventions.md` § Banned patterns (raw SQL in app code)
