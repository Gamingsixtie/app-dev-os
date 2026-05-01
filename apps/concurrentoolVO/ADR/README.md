# ADR Index — concurrentoolVO

Per-app Architecture Decision Records for the **concurrentoolVO** app. Numbered locally (start at 0001), separate from the App-Dev OS root ADR namespace.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| [0001](0001-vite-spa-not-nextjs.md) | Vite SPA, not Next.js | Accepted | 2026-05-01 |
| [0002](0002-three-hardcoded-providers.md) | Three hard-coded providers (Cito / DIA / JIJ) | Accepted | 2026-05-01 |
| [0003](0003-pure-function-engines.md) | Pure-function engines (no side effects, no I/O, no state) | Accepted | 2026-05-01 |

## Pending — captured as bullets in `code_context/architecture.md` § ADR-equivalent

These decisions are documented as bullets but not yet promoted to full ADRs. Promote via `docs-adr` skill (mode: `promote`) when context arrives that warrants formalization (e.g., contributor needs the reasoning, or a deviation is proposed).

| Candidate | Strongest reason to promote |
|---|---|
| **AI alleen voor intake, nooit voor prijslogica** | Slow-burn risk: AI-as-pricing introduces non-determinism that erodes trust over weeks-months before being noticed. **Borderline — consider promoting if a feature request even hints at "AI helping with pricing"**. |
| **ESLint + typescript-eslint (overrides root ADR-0002 Biome)** | Lower-priority — already documented in `apps/concurrentoolVO/AGENTS.md` § Stack deviations and `code_context/conventions.md` § Tooling. Promote if a future tailoring round considers re-applying ADR-0002 globally. |
| **npm (not pnpm)** | Operational detail — captured in `conventions.md` and `AGENTS.md`. Low risk of being undone accidentally. |
| **Zustand (not Redux/Context)** | Historical choice — captured in `architecture.md`. Unlikely to be reverted. |
| **TanStack Router (not React Router)** | Type-safety benefit captured in `architecture.md`. Low promotion priority. |
| **Three-layer storage (Postgres + Dexie + localStorage)** | Architectural — captured in `architecture.md`. Promote if a contributor asks "why three layers?" |
| **Locked price files** (`default-prices.ts`, `cito-migration-prices.ts`) | Operational rule — captured in `AGENTS.md` § App-specific hard rules. |
| **Vercel function regions = `fra1`** | Config detail — captured in `architecture.md`. |
| **300s timeout for 3 AI endpoints** | Config detail — captured in `architecture.md`. |

## Pattern

ADRs are **immutable** after acceptance. Never edit a merged ADR; supersede with a new ADR (e.g., `0004-supersedes-0001.md`) and add a status banner to the old file (`Status: Superseded by ADR-0004`).

When an architecture decision is made (or surfaced from existing code as a deliberate choice), use the `docs-adr` skill in `create` or `promote` mode to add it here.
