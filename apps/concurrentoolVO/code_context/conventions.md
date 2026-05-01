# Conventions — concurrentoolVO

> **Per-app override.** Replaces (does not extend) the root template `conventions.md` for this app. Reading order: skills load this file via Context Matrix when working in `apps/concurrentoolVO/`.
>
> Last validated: 2026-05-01.

---

## Languages & versions

- **TypeScript** ~5.9.3, strict mode (3 split configs: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`)
- **React** 19.2.4
- **Vite** 8 (build tool + dev server)
- **Node** as Vercel Functions runtime (no specific Node version pin in `package.json`; Vercel default)

---

## Tooling

### Package manager — npm (NOT pnpm)

This app **overrides** the root template's pnpm convention. Lockfile = `package-lock.json`. Reasons:
- Pre-existed App-Dev OS migration; switching introduces lockfile churn
- Vercel auto-detects npm without extra config

**Allowed commands:**
- `npm install`, `npm install <pkg>`, `npm install --save-dev <pkg>`
- `npm uninstall <pkg>` (note: root permissions deny this — this app overrides; project-specific allow needed if friction emerges)
- `npm run <script>`
- `npx <bin>` for one-off CLI invocations

**Banned:**
- `yarn`, `pnpm`, `bun` for THIS app (root template uses pnpm; mixing in monorepo is fine because each app's lockfile lives at its own root)
- Hand-editing `package-lock.json` (use `npm install`)

### Lint + format — ESLint (NOT Biome)

This app **overrides** root [ADR-0002](../../../ADR/0002-biome-over-eslint-prettier.md). Config lives at `eslint.config.js` (flat config). Plugins: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.

**Commands:**
- `npm run lint` — full lint
- `npm run lint -- --fix` — auto-fix where possible

No Prettier — ESLint flat config handles stylistic rules where needed. No Biome.

### Type-check

- `tsc -b` (build mode, runs across the 3 tsconfig projects)
- `npm run build` runs `tsc -b && vite build` — type errors fail the build

The App-Dev OS root pre-commit hook (`scripts/git-hooks/pre-commit`) does NOT run for this app — it only checks root-level `tsconfig.json`. Per-app type checking happens at:
- Dev time: Vite HMR + IDE
- Build time: `npm run build` (locally before commit, or Vercel on deploy)

If type errors slip past commit and Vercel catches them: that's the trigger to extend root pre-commit to walk into changed `apps/*/tsconfig.json` files.

### Testing

- `npx vitest run` — full unit test run
- `npx vitest` — watch mode
- `npx vitest --coverage` — coverage (uses `@vitest/coverage-v8`)
- `npx playwright test` — e2e
- `npx playwright test --ui` — e2e with UI

**Mandatory tests:**
- Engine changes — every change to `src/engine/*` requires test update or addition (existing pattern in `src/engine/__tests__/`)
- Wizard step changes — component test + Zod schema test
- New API endpoint — `api/__tests__/` adjacent test

---

## File layout

```
src/
├── App.tsx              # RouterProvider entry
├── main.tsx             # ReactDOM root
├── components/          # Shared UI components (reusable across features)
│   └── routing/         # Layout shells (RootLayout, SchoolLayout, WizardPage)
├── data/                # Static data (LOCKED files live here)
├── db/                  # Dexie IndexedDB layer
├── engine/              # Pure-function pricing engines
│   ├── __tests__/
│   └── calculators/
├── features/            # Feature folders — own components/schemas/state per feature
│   ├── auth/
│   ├── school-overview/
│   ├── school-profile/
│   │   ├── components/  # Wizard steps go here
│   │   ├── schemas/     # Zod schemas
│   │   └── tabs/        # Tab pages
│   ├── price-comparison/
│   ├── export/
│   ├── review/
│   └── admin/
├── hooks/               # Reusable React hooks
├── lib/                 # Utilities (AI wrappers, sentry, format, slugify, etc.)
├── models/              # Type definitions
├── router/              # TanStack Router config (routes.ts, router.ts, guards.ts)
├── stores/              # Zustand stores
├── styles/              # Tailwind input
└── test/                # Test setup (vitest config helpers)
```

**Tests location**: `__tests__/` adjacent to the code being tested (NOT a top-level `tests/` folder). E.g. `src/engine/__tests__/price-comparison.test.ts`.

---

## Naming

| Subject | Convention | Example |
|---|---|---|
| React components | PascalCase, file matches export name | `WizardPage.tsx` exports `WizardPage` |
| Hooks | `use` prefix, camelCase | `useSchoolProfile` |
| Engine functions | `calculate` + descriptor verb | `calculateComparison`, `calculateMigration` |
| Zod schemas | PascalCase + `Schema` suffix | `SchoolProfileSchema` |
| Files (non-component) | kebab-case | `price-comparison.ts`, `ai-intake.ts` |
| Test files | `<name>.test.ts` adjacent in `__tests__/` | `price-comparison.test.ts` |
| Types | PascalCase, suffix `Type` only when ambiguous | `SchoolProfile`, `WizardStep` |
| Constants | SCREAMING_SNAKE_CASE | `TOTAL_STEPS = 5` |

### Path alias

`@` resolves to `/src`. Use it. Never write `../../../components/...`.

```ts
// Good
import { router } from '@/router/router';
import { useSchoolProfile } from '@/features/school-profile/hooks';

// Bad
import { router } from '../../../router/router';
```

---

## Imports

- Path alias `@` for in-app imports (see above)
- External imports first, then alias imports, then relative imports — separated by blank line
- Avoid relative imports across feature boundaries (use `@/features/<name>/...`)

---

## Type safety

- Strict mode on (verify in `tsconfig.app.json`)
- Prefer `unknown` over `any`; narrow at boundaries
- Explicit return types on exported public functions (the engines especially — improves auto-doc and catches accidental drift)
- Zod schemas at all I/O boundaries (forms, API responses, AI parses, localStorage rehydration)

---

## Comments

- **Code in English** — variable names, function names, comments, JSDoc
- **UI text in Dutch** — labels, tooltips, error messages, button copy, onboarding, empty states (no exceptions)
- Comment when WHY is non-obvious; never restate WHAT (well-named identifiers cover that)
- Locked-file warnings stay as comments at top of `default-prices.ts` + `cito-migration-prices.ts`

---

## Banned patterns

| Pattern | Use instead | Reason |
|---|---|---|
| `useState<View>` for routing | TanStack Router routes | Old code; routing now declarative + type-safe |
| New React Context for state | Zustand store + `persist` | Convention since rekentool inception |
| Prop drilling | Zustand store + selector | Same |
| Forms without `react-hook-form` | `react-hook-form` + Zod schema | Mandatory pair |
| Forms without Zod validation | react-hook-form + Zod schema | Mandatory pair |
| `process.env.X` in client code | `import.meta.env.VITE_X` | Vite convention; only `VITE_*` vars are exposed to client |
| Fetch directly to Supabase REST | `@supabase/supabase-js` SDK | RLS + auth handling baked in |
| Raw SQL in app code | Supabase SDK or RPC | DDL goes in `supabase/migrations/*.sql` |
| Editing `package-lock.json` by hand | `npm install` | Determinism |
| Adding a 4th provider without ADR | ADR + planning + multi-file refactor | Three providers are domain reality |
| Editing `src/data/default-prices.ts` or `cito-migration-prices.ts` without approval | Ask Pim first | Operational safety |
| AI generating prices | Pure-function engines | Reliability + explainability |
| Adding external service without CSP update | Update `vercel.json` `connect-src`/`script-src` | CSP enforces network policy |
| Skipping engine tests | Add/update test in `src/engine/__tests__/` | Engines are core; regressions cost real money |
| English UI text | Dutch UI text | Hard rule |
| Dutch code/comments/commit messages | English | Hard rule |

---

## Errors

- Never expose stack traces to users — show friendly Dutch message
- Sentry captures full stack (configured in `src/lib/sentry.ts`); user sees only "Er ging iets mis. Probeer opnieuw." or context-specific Dutch message
- Vercel function errors → Vercel logs (auto)
- Supabase errors → wrap with type-narrow check; render Dutch message based on error type

---

## State

- Two persisted Zustand stores (school-profile + pricing-data) — see `architecture.md` § State management
- Cross-store reads via `getState()`, NOT hooks (deliberate)
- New state? Decide layer first:
  - Server canonical → Supabase migration + table
  - Client cache → Dexie operation in `src/db/`
  - UI state → Zustand store with `persist`
- Don't introduce a 3rd Zustand store unless there's a real second user (e.g., admin separate from consultant)

---

## API endpoints (`api/`)

- All TS files
- Per-endpoint timeout in `vercel.json` (default 60s, 3 endpoints at 300s for long AI)
- Region locked to `fra1` (Frankfurt) — keep for data residency
- Tests in `api/__tests__/`
- New endpoint: add to `vercel.json` if non-default timeout needed; update CSP if calling new external service

---

## Adding a feature — checklist

1. Decide feature folder (existing or new under `src/features/`)
2. Add Zod schema in `<feature>/schemas/`
3. Add component(s) in `<feature>/components/` (wizard steps go in `school-profile/components/`)
4. Add hook(s) in `<feature>/hooks/` if logic is reusable
5. Add route in `src/router/routes.ts` if user-facing
6. Add test (`*.test.ts(x)` adjacent in `__tests__/`)
7. Run `npm run build` — no type errors
8. Run `npx vitest run` — green
9. If changing engines: also `npx playwright test` — e2e green
10. Commit-and-push policy from `apps/concurrentoolVO/AGENTS.md` § App-specific overrides
