# Code Conventions

> Foundation file. Every code-skill loads this before touching code. Equivalent to `voice-profile.md` for marketing — but for code style.

## Languages & versions

- Primary language: **TypeScript 5.x** (strict mode)
- Secondary: **Python 3.12+** (scripts only — never application code)
- Runtime: **Node.js 22.x LTS** (matches Vercel build runtime)
- Package manager: **pnpm 9.x** (lockfile: `pnpm-lock.yaml`)

## Naming

- **Files**: kebab-case for source files (`user-profile.ts`); PascalCase for React component files (`UserProfile.tsx`); snake_case for Python (`fetch_data.py`)
- **Variables**: camelCase (TS/JS), snake_case (Python)
- **Constants**: UPPER_SNAKE_CASE
- **Types / Interfaces**: PascalCase (`UserProfile`, not `IUserProfile`)
- **React components**: PascalCase exports matching the filename (`UserProfile.tsx` exports `UserProfile`)
- **Hooks**: `use` prefix (`useUser`, `useDebounce`)
- **Test files**: `*.test.ts` / `*.test.tsx` / `test_*.py`
- **Server-only files**: suffix `.server.ts` when not auto-detected by Next.js (e.g. shared utilities that import server-only deps)

## Imports

- Order: external packages → `@/`-aliased internal → relative
- Use the `@/*` path alias (configured in `tsconfig.json`) — avoid deep `../../../` chains
- No circular imports — refactor shared dependencies into a separate module
- Side-effect imports (CSS, polyfills) at the top of the file, before code imports

## Formatting

- Formatter + linter: **Biome** (single tool — `biome.json` is the only config file)
- Line length: **100 chars**
- Trailing newline: yes
- Quotes: **double** (Biome default; consistent with JSX attribute syntax)
- Semicolons: yes (TS) — never rely on automatic semicolon insertion

## Linting

- Linter: **Biome** (no ESLint, no Prettier — Biome covers both)
- Rules: project's `biome.json` (recommended preset + project-specific additions)
- CI fails on errors only; warnings inform but do not block

## Type safety

- TypeScript: `strict: true` always; **`noUncheckedIndexedAccess: true`** (array/object access returns `T | undefined`)
- No `any` without an inline justification comment (e.g. `// any: external API has no types`)
- Prefer `unknown` over `any` and narrow at the boundary
- Inferred return types are OK for one-line functions; use explicit return types on exported public functions
- Python (scripts): `mypy --strict` for new modules; gradual for legacy

## File layout (Next.js App Router)

- `app/` — Next.js routes, server/client components, route handlers (App Router default)
- `src/lib/` — shared utilities (DB clients, helpers, Supabase wrappers, env validation)
- `src/components/` — reusable UI components (PascalCase folders/files)
- `tests/` — test files mirroring `src/` and `app/` structure
- `supabase/migrations/` — DB migrations (Supabase CLI standard)
- `scripts/` — Python and shell scripts (one-shot, CI helpers)
- `docs/` — human-facing documentation
- No source files at repo root

## Errors

- Throw early, fail loud — don't paper over invariant violations
- Never swallow exceptions silently — log + rethrow, or convert to a typed error
- Server-side: log to stderr (Vercel collects these); never `console.log` for actual errors
- User-facing error messages use brand-voice (load `brand_context/voice-profile.md` when writing them)
- Never expose stack traces, raw DB errors, or internal IDs to the client

## Comments

- Default: no comments
- Allowed: **why** comments — non-obvious constraint, subtle invariant, workaround for a specific bug
- Forbidden: **what** comments (the named identifier already says what), references to PRs / issues / callers (rot fast)
- Doc-comments (`/** */`) on exported public functions only when behavior is non-obvious

## Banned patterns

- `console.log` in production code paths → use a logger or remove before commit
- Raw SQL in application code → use the `supabase-js` SDK; DDL goes in `supabase/migrations/`
- `any` type without an inline justification comment
- `<a href="/...">` for internal navigation → use Next.js `<Link>`
- Direct `process.env.X` access in components → centralize in `src/lib/env.ts` with validation
- Hard-coded Supabase URLs / keys → always via env vars
- Editing `pnpm-lock.yaml` by hand → use `pnpm install`
- Committing `.env*` files → gitignored; should never reach git
- `useEffect` for data fetching when a Server Component or native `fetch` works
- Mixing client and server code in one file without a `'use client'` / `'use server'` directive
- `npm install` / `yarn add` in this project → only `pnpm` commands

---

*Edit this file once per project to reflect your stack. Skills load it lazily per Context Matrix. Last tailored: 2026-04-27 (`/tailor-os` Phase 3).*
