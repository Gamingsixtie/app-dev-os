# USER.md — Who You're Helping (Developer Profile)

## About

- Name: Pim
- GitHub handle: gamingsixttie
- Primary editor: VS Code
- Operating system: Windows 11

## Stack preferences

- Languages (ranked by preference): TypeScript (primary) > Python (secondary, for scripts and AI work)
- Frameworks: Next.js (App Router)
- Package manager: pnpm
- Test runner: Vitest (TypeScript), Pytest (Python)
- Lint + format: Biome
- Type system: TypeScript strict mode
- DB / ORM: Supabase (Postgres + Auth + Storage) via supabase-js SDK — no separate ORM yet
- Hosting: Vercel (frontend + API routes) + Supabase (database, auth, storage)

## Working style

- **Testing style**: write-test-after, pragmatic — logic and utilities get tests, UI components do not
- **Code review depth**: self-standard — one deliberate read-through of own work before commit (solo dev, no second reviewer)
- **Deploy cadence**: continuous-on-merge-to-main — Vercel auto-deploys when `dev` is promoted to `main` via PR; feature branches get preview URLs
- **On-call**: no — solo dev, prod incidents handled when noticed
- **Branch policy**: `dev` + `main` — `main` is hard-blocked by branch-guard hook; feature branches merge into `dev`, then `dev` is promoted to `main` via PR
- **PR size preference**: small (~100 lines, max ~300)
- **Commit style**: conventional commits — see cheat sheet in Notes

## Risk posture

- **Production blast radius tolerance**: low — solo dev, one mistake = personal app down
- **Impact-based autonomy**:
  - **High impact** (deploy to main, prod DB migration, force-push, deleting files outside git, touching `.env`/secrets, merging `dev → main`) → propose first, wait for explicit OK before executing
  - **Low impact** (local file edits, lint/format/typecheck, dev-dependency install, local/staging migration, commits on `dev` or feature branch, doc updates, skill changes) → execute and explain what + why, so user can revise and learn
- **Allowed destructive commands**: only inside cwd or `/tmp`; never on shared infrastructure or outside the project directory
- **Force push allowed on**: own feature branches only; never on `dev` or `main`
- **Secrets handling**: `.env.local` locally (gitignored); Vercel Environment Variables for production; never committed to git

## Communication style

- **Conversation language**: Dutch
- **File / code / commit language**: English
- **Verbosity**: moderate — explain enough for a non-senior reader, no walls of text
- **Code in answers**: inline snippets with brief explanation; full files only on request
- **Reasoning**: short one-liner ("I'm choosing X because Y") on non-trivial decisions; silent on routine choices
- **Confidence signals**: yes — flag uncertainty explicitly when guessing rather than knowing
- **Questions tolerance**: ask whenever needed, no question limit; question first, advise on request
- **Jargon**: explain in plain language — user is not a senior engineer

## Notes

- Solo developer, no team
- Local-first debugging — fully understand the bug locally before any Vercel deploy
- App-Dev OS template tailoring in progress (see `.planning/tailor-state.md`)
- **Conventional commits cheat sheet**:
  - `feat:` — new feature
  - `fix:` — bug fix
  - `chore:` — tooling, deps, config (no production code change)
  - `docs:` — documentation only
  - `refactor:` — code change that neither fixes a bug nor adds a feature
  - `test:` — adding or fixing tests
  - `perf:` — performance improvement
  - `style:` — formatting only (no logic change)

---

*Populated by `/tailor-os` Phase 2 on 2026-04-27. Updated as we learn more about how you work. Never reset without asking.*
