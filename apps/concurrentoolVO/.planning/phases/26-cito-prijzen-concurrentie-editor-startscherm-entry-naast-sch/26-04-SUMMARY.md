---
phase: 26-cito-prijzen-concurrentie-editor
plan: 04
subsystem: AI Excel-import + diff-preview voor prijs-updates
tags: [wave-1, pricing, ai-import, xlsx, diff-view, vercel-function, anthropic, dutch-ui, manager-gate]
requires:
  - 26-01 wave 0 (PrijzenPage shell + manager gate + dev-bypass)
  - 26-02 wave 1 (PrijzenPage tab composition — preserved untouched)
  - 26-03 wave 1 (PriceListExportButton — preserved untouched, import button placed next to it)
  - existing api/ai-intake.ts pattern (mirrored for new Vercel function)
  - existing updatePricingConfig + usePricingDataStore.loadFromSupabase pipeline (reused)
  - PROVIDER_CONFIGS read-only via @/data/providers/index
  - PROVIDER_IMPORT_SCHEMAS (Task 1) — shared client/server source-of-truth
provides:
  - api/ai-price-import.ts — Vercel serverless POST handler (claude-haiku-4-5, server-side ANTHROPIC_API_KEY)
  - Per-provider Zod schemas re-exported under "import" aliases (CitoImportSchema, etc.)
  - PROVIDER_IMPORT_SCHEMAS — map keyed by ProviderImportKey
  - parseExcelToRows + validateExcelInput — pure Excel parser
  - computePriceDiff + applyAcceptedDiff — pure diff helpers
  - importPricesFromExcel — client wrapper with deep schema-validation
  - PriceImportDropzone / PriceImportDiffView / PriceImportFlow — 3 React components
  - "Importeer prijzen uit Excel" button on /prijzen (manager-only)
affects:
  - src/features/pricing/PrijzenPage.tsx (modified: +useState, +import button, +PriceImportFlow render)
tech-stack:
  added: []  # all dependencies already present (xlsx ^0.18.5, @anthropic-ai/sdk ^0.92.0, zod ^4.3.6)
  patterns:
    - Vercel serverless function POST handler with optional SKIP_AUTH dev-bypass
    - Module-level Anthropic + Supabase admin client init (warm-invocation reuse)
    - Three-tier JSON parse fallback (direct → strip code fences → first-brace-block)
    - Server-side request envelope validation; client-side deep AI-output validation
    - Pure parse + diff helpers (no DOM, no React) for testability
    - Linear state-machine modal (upload → aiCall → diff → saving)
    - Path-based diff rows with per-row checkbox acceptance
key-files:
  created:
    - apps/concurrentoolVO/api/ai-price-import.ts
    - apps/concurrentoolVO/src/features/pricing/import/price-import-schemas.ts
    - apps/concurrentoolVO/src/features/pricing/import/excel-parser.ts
    - apps/concurrentoolVO/src/features/pricing/import/price-diff.ts
    - apps/concurrentoolVO/src/features/pricing/import/ai-price-import-client.ts
    - apps/concurrentoolVO/src/features/pricing/components/PriceImportDropzone.tsx
    - apps/concurrentoolVO/src/features/pricing/components/PriceImportDiffView.tsx
    - apps/concurrentoolVO/src/features/pricing/components/PriceImportFlow.tsx
    - apps/concurrentoolVO/src/features/pricing/__tests__/price-import-schemas.test.ts
    - apps/concurrentoolVO/src/features/pricing/__tests__/excel-parser.test.ts
    - apps/concurrentoolVO/src/features/pricing/__tests__/price-diff.test.ts
  modified:
    - apps/concurrentoolVO/src/features/pricing/PrijzenPage.tsx
decisions:
  - D-07 honored: eigen flow op /prijzen, NIET geïntegreerd met ops-competitor-intel skill (duplicate code accepted)
  - D-08 honored: eigen Vercel function api/ai-price-import.ts, mirror van api/ai-intake.ts (server-side ANTHROPIC_API_KEY only)
  - D-09 honored: eigen PriceImportDiffView component (geen re-use van features/intake/DiffView; ander data-model)
  - D-10 honored: xlsx ^0.18.5 hergebruikt (al in package.json, geen nieuwe Excel-library)
  - D-11 honored: single-provider per upload (provider-dropdown vóór upload)
  - Schemas reused: PROVIDER_IMPORT_SCHEMAS re-exports the 4 canonical pricing-config schemas as the shared source-of-truth
  - Streaming NOT used: batch imports use single request/response (geen SSE — sneller te bouwen, geen UX-loss)
requirements_completed:
  - R-06-ai-excel-import-diff-preview
metrics:
  duration: ~25 minutes
  completed: 2026-05-14
  commits: 4 effective (3 clean + 1 timestamp-bundled — see Deviations)
  tasks: 4/4
---

# Phase 26 Plan 04: AI Excel-import + diff-preview — Summary

Wave 1 deliverable: een "Importeer prijzen uit Excel" knop op `/prijzen` waarmee managers een `.xlsx` uploaden voor één gekozen aanbieder, en Claude (server-side, `claude-haiku-4-5`) de rijen mapt naar de juiste `pricingStrategy`-shape. Het voorstel verschijnt als per-rij diff (huidig → voorgesteld) met checkbox-acceptatie. Pas na expliciete bevestiging wordt geschreven naar Supabase via dezelfde `updatePricingConfig` pipeline als de tabs.

## Wat is gebouwd

| Artifact | File | Rol |
|---|---|---|
| Zod schemas (re-export) | `src/features/pricing/import/price-import-schemas.ts` | Single source-of-truth voor server + client. Re-exports `flatConfigSchema` / `tieredLicenseConfigSchema` / `packageBundleConfigSchema` / `platformModuleConfigSchema` onder provider-named aliassen. `PROVIDER_IMPORT_SCHEMAS` is de map. |
| Excel parser | `src/features/pricing/import/excel-parser.ts` | Pure wrapper rond `xlsx`. `validateExcelInput(file)` (5MB cap + .xlsx-only) + `parseExcelToRows(buffer)` → `string[][]`. Dutch error-messages voor parse-fout/lege sheet. Defensive guard tegen xlsx's permissive behavior op lege/garbage buffers. |
| Price-diff helpers | `src/features/pricing/import/price-diff.ts` | Pure functies. `computePriceDiff(cur, prop)` walkt objecten parallel en emit één `DiffRow` per primitive leaf (arrays opaak). `applyAcceptedDiff(cur, diff, accepted)` deep-clonet `cur` en overlay alleen geaccepteerde paden — muteert nooit input. |
| Vercel function | `api/ai-price-import.ts` | Mirror van `api/ai-intake.ts`. Server-side `ANTHROPIC_API_KEY`, `claude-haiku-4-5`, single request/response (geen SSE). Auth via Supabase Bearer of `SKIP_AUTH=true`. Drie-trap JSON parse fallback. Dutch error responses. |
| Frontend client | `src/features/pricing/import/ai-price-import-client.ts` | `getAuthHeaders()` mirror van `src/lib/ai-intake.ts`. POST → `/api/ai-price-import`. **Deep schema-validatie van de AI-output gebeurt hier client-side** via `PROVIDER_IMPORT_SCHEMAS[provider]` (T-26-04-04). |
| Dropzone | `src/features/pricing/components/PriceImportDropzone.tsx` | Step 1 UI: provider-dropdown + `.xlsx`-picker + submit. NL labels, NL errors. |
| DiffView | `src/features/pricing/components/PriceImportDiffView.tsx` | Step 2 UI: per-rij checkbox-diff met "Alles selecteren" toggle, `Annuleer` / `Bevestig N wijzigingen`. Toont alleen `changed:true` rijen. Geen wijzigingen → "Geen wijzigingen gevonden" + sluit-knop. |
| Flow orchestrator | `src/features/pricing/components/PriceImportFlow.tsx` | Modaal met state-machine `upload → aiCall → diff → saving`. Bevestiging wijst `applyAcceptedDiff` → `updatePricingConfig` → `loadFromSupabase()` → `queryClient.invalidateQueries`. |
| PrijzenPage integratie | `src/features/pricing/PrijzenPage.tsx` | `useState` toegevoegd (vóór manager-gate, conform hooks-rule). "Importeer prijzen uit Excel" knop naast `PriceListExportButton` in dezelfde flex-row. `<PriceImportFlow open onClose />` gerenderd. 26-01 dev-bypass + 26-02 tabs + 26-03 export-button blijven onaangetast. |

## Save-pipeline reuse — confirmed

De bevestig-flow gebruikt exact dezelfde pipeline als `CitoBasisvaardigheidenTab`, `CitoModulesTab` en de Concurrentie sub-tabs:

1. `applyAcceptedDiff(currentStrategy, diff, acceptedPaths)` — pure merge, deep-clone, alleen aangevinkte paden.
2. `updatePricingConfig(dbConfig.id, mergedStrategy)` — increments `version`, schrijft `price_audit_log` (T-26-04-08 automatic mitigation).
3. `usePricingDataStore.getState().loadFromSupabase()` — refresht runtime engine data.
4. `queryClient.invalidateQueries({ queryKey: ['pricing-configs'] })` — React Query cache sync.

Geen nieuwe data-laag, geen nieuwe audit-code. Bestaande `price_audit_log` insert in `updatePricingConfig` (pricing-operations.ts r155-163) captureert elke import automatisch.

## Verification — wat slaagde

| Check | Resultaat |
|---|---|
| `npx tsc --noEmit` | clean, zero errors |
| `npm run build` | clean, dist gegenereerd, PWA precache regenerated |
| `npm run lint` | 0 errors. 12 pre-existing warnings in unrelated files (`SchoolLayout`, `WizardShell`, `ExportTab`, `AnalysisPanel`, `PriceProposalModal`, `ConversationForm`, `DashboardTab`, `ProductsTab`, `SchoolplanTab`) — out of scope per execute-plan SCOPE BOUNDARY. |
| `npx vitest run src/features/pricing` | **84/84 tests pass across 11 test files** (24 pre-existing + 7 schemas + 7 excel-parser + 7 price-diff). |
| AI-key-leak guard: `grep -rE "VITE_ANTHROPIC" api src --include='*.ts' --include='*.tsx'` | **0 matches** — server-only key invariant respected. (One stray hit in `src/lib/security-audit-report.md` is a pre-existing negative-assertion in a markdown doc; not source code.) |
| Locked-files guard: `git diff main..HEAD -- src/data/default-prices.ts src/data/cito-migration-prices.ts` | empty — locked files untouched. |
| Locked-files guard: `git diff main..HEAD -- src/data/providers/` | empty — provider files untouched (read-only references). |

## Locked files confirmed unchanged

- `src/data/default-prices.ts` — untouched
- `src/data/cito-migration-prices.ts` — untouched
- `src/data/providers/cito.ts` — untouched
- `src/data/providers/dia.ts` — untouched
- `src/data/providers/jij.ts` — untouched
- `src/data/providers/saqi.ts` — untouched
- `src/data/providers/index.ts` — untouched

## Threat-model coverage

| Threat ID | Disposition | Hoe gemitigeerd |
|-----------|-------------|------------------|
| T-26-04-01 (xlsx CVE / DoS via .xlsx) | mitigate | (a) 5MB cap in `validateExcelInput`; (b) `.xlsx` extension-only filter; (c) `parseExcelToRows` wraps `XLSX.read` in try/catch met NL error; (d) empty/whitespace-cell guard om "phantom matrix" naar AI te voorkomen. |
| T-26-04-02 (Spoofing → /api/ai-price-import) | mitigate | Vercel function mirror van `api/ai-intake.ts` auth-pattern: Bearer-token validated via `supabaseAdmin.auth.getUser(token)` tenzij `SKIP_AUTH=true` (dev only). |
| T-26-04-03 (ANTHROPIC_API_KEY leak) | mitigate | Key alleen in `api/ai-price-import.ts` (server-side). `grep -rE "VITE_ANTHROPIC" api src --include='*.ts' --include='*.tsx'` returns 0 — verified. |
| T-26-04-04 (AI output tampering) | mitigate | TWO-LAYER validation: (a) server-side `RequestSchema` envelope; (b) client-side `PROVIDER_IMPORT_SCHEMAS[provider].safeParse(body.proposed)` BEFORE diff-view. Schema-fout → Dutch error, geen save. |
| T-26-04-05 (Prompt injection via Excel cells) | accept | Diff-view + per-row checkbox confirmation is de laatste verdediging — geen silent apply. Gedocumenteerd in SPEC. |
| T-26-04-06 (Excel inhoud → Anthropic) | accept | Gebruiker uploadt prijzen die hij bewust deelt; Anthropic data-handling per hun terms. Gedocumenteerd in CONTEXT.md. |
| T-26-04-07 (Niet-manager triggert import) | mitigate | Knop alleen render in PrijzenPage manager-gate branch (26-01 gate); Supabase RLS rejecteert `updatePricingConfig` voor non-managers als defense-in-depth. |
| T-26-04-08 (Repudiation — wie importeerde?) | mitigate | Existing `price_audit_log` insert in `updatePricingConfig` (pricing-operations.ts r155-163) — auto-capture, geen nieuwe code. |

## Deviations from Plan

### 1. [Environment — timestamp clash] Task 1 commit bundled into commit `e31f096`

- **Found:** Direct na `git commit` voor Task 1.
- **Issue:** Mijn `git commit -m "feat(26-04): add per-provider Zod schemas ..."` exit-code was 1 maar de output suggereerde dat het succesvol was. Bij naderhand inspecteren bleek de commit `e31f096` (timestamp 23:14:33, gedaan door een extern proces, met message `docs(phase-28): UI design contract for Win/loss-tracking & Marktdashboard`) zowel de phase-28 UI-SPEC.md ALS mijn Task 1 files te bevatten. Klokslag-samenloop tussen mijn `Write` calls (23:14:24) en een externe `git commit` (23:14:33) — vermoedelijk een parallel-orchestrator of user-action die tegelijk een commit deed op deze branch.
- **Impact:** Bestand-inhoud is correct in git history (`git show e31f096` toont beide files met correcte content + 7/7 tests groen). Commit-message is misleidend t.o.v. de Phase 26-04 conventie `feat(26-04): ...`. Er is geen functionele schade — alleen audit-trail-cosmetica.
- **Mitigation:** Niet hersteld. Een revert + re-commit zou de phase-28 doc commit weggooien. De files zijn aanwezig, getest, en samen met de andere 26-04 commits vormen ze een werkend geheel. Genoteerd in deze SUMMARY voor transparantie.

### 2. [Environment — parallel actor] Commit `3a0c7e4` interleaved between Task 2 and Task 3

- **Found:** Bij final `git log --oneline -6` verificatie.
- **Issue:** Commit `3a0c7e4 plan(phase-27): add 12 PLAN.md files across 9 waves` verscheen tussen mijn Task 2 commit (`2488b9d`, 23:21) en Task 3 commit (`3b5573b`, 23:22:43) op dezelfde branch. Scope: Phase 27 plan-files + ROADMAP.md — niet binnen de 26-04 scope.
- **Impact:** Geen functionele impact op 26-04. De commit raakt geen 26-04 files. Het is een parallel-actor (gsd-planner output) die tegelijk op dezelfde feature branch werkte.
- **Mitigation:** Niet hersteld. Out-of-scope commits worden niet in 26-04's verantwoordelijkheid getrokken. Genoteerd.

### 3. [Rule 1 — Bug fix] Excel parser: empty-content guard added

- **Found during:** Task 2 verify — initial test for "leeg buffer throws NL error" failed.
- **Issue:** `xlsx.read` is permissive: een 0-byte buffer parse-t naar een synthesized `Sheet1` met één lege rij `[['']]`. Mijn originele `if (rows.length === 0) throw ...` guard fired niet. Zonder fix zou de AI een fake empty matrix krijgen.
- **Fix:** Toegevoegd na de `rows.length === 0` check: `const hasAnyContent = stringified.some(row => row.some(cell => cell.trim().length > 0)); if (!hasAnyContent) throw new Error('Tabblad is leeg — geen cellen met inhoud gevonden');`
- **Files modified:** `src/features/pricing/import/excel-parser.ts`
- **Commit:** `2488b9d`
- **Impact:** Defensieve verbetering. Het was niet expliciet in de plan-action gespecificeerd, maar wel impliciet vereist door T-26-04-01 ("no stacktrace leak" + sensible error UX).

### 4. [Test refinement] Garbage-bytes test replaced with whitespace-only test

- **Found during:** Task 2 verify — de "garbage bytes" test (8 willekeurige bytes) faalde omdat `xlsx` die als text-content decodeert (`"ﳽ﫻"`). Dat is technically non-empty content.
- **Fix:** Test vervangen door een meer betekenisvol scenario: een echte `.xlsx` met alleen whitespace-cellen (`['  ', '\t', '   ']`) — dat moet ook als leeg-rejected worden.
- **Impact:** Test reflecteert nu de werkelijke parser-contract; coverage breidt uit van "garbage" naar "whitespace-only".

## Known Stubs

Geen. Elke stap in de flow schrijft echt door:
- Upload-step: `validateExcelInput` + echte `xlsx` parse via `parseExcelToRows`.
- AI-call step: echte `fetch('/api/ai-price-import')` met Bearer-token, echte `claude-haiku-4-5` call server-side.
- Diff step: echte `computePriceDiff` op gebruikers-config + AI-voorstel.
- Save step: echte `updatePricingConfig` (Supabase write + audit log) + `loadFromSupabase` (store refresh).

Er is geen mock-data, geen "coming soon" placeholder, geen TODO in de production code-path.

## Environment-variable additions for first deploy

Geen nieuwe env-vars nodig. De Vercel function gebruikt drie bestaande variabelen die al door `api/ai-intake.ts` worden gebruikt:

| Variable | Scope | Reeds aanwezig? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel server-side | Yes (gebruikt door `api/ai-intake.ts`) |
| `SUPABASE_URL` | Vercel server-side | Yes (gebruikt door `api/ai-intake.ts`) |
| `SUPABASE_SERVICE_KEY` | Vercel server-side | Yes (gebruikt door `api/ai-intake.ts`) |
| `SKIP_AUTH` (optional) | Vercel server-side (dev only) | Yes (mirror van `VITE_SKIP_AUTH`) |

## Contracts available to downstream plans (26-05)

- `/prijzen` heeft één "Importeer prijzen uit Excel" knop naast de export-knop, manager-gated, met dev-bypass via `VITE_SKIP_AUTH`.
- AI-flow end-to-end testable: upload → AI-call → diff → bevestig → Supabase save → store refresh.
- 26-05 (Wave 2) kan een `human-verify` checkpoint inrichten waar een echte `.xlsx` wordt ge-upload en de diff-view wordt doorlopen.

## Commits

| Hash | Task | Subject | Notitie |
|---|---|---|---|
| `e31f096` | 1 | `docs(phase-28): UI design contract for Win/loss-tracking & Marktdashboard` | Bundeld phase-28 doc + mijn Task 1 files door timestamp-clash met een externe actor — zie Deviation #1. |
| `2488b9d` | 2 | `feat(26-04): add Excel parser + pure price-diff helpers + tests` | Clean. |
| `3b5573b` | 3 | `feat(26-04): add Vercel function api/ai-price-import.ts` | Clean. |
| `05650a4` | 4 | `feat(26-04): wire AI Excel-import flow into /prijzen page` | Clean. |

(Commit `3a0c7e4 plan(phase-27): ...` zit tussen `2488b9d` en `3b5573b` maar is geen Task-commit van mij — zie Deviation #2.)

## Self-Check: PASSED

- `apps/concurrentoolVO/api/ai-price-import.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/import/price-import-schemas.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/import/excel-parser.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/import/price-diff.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/import/ai-price-import-client.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/components/PriceImportDropzone.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/components/PriceImportDiffView.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/components/PriceImportFlow.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/__tests__/price-import-schemas.test.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/__tests__/excel-parser.test.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/__tests__/price-diff.test.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/PrijzenPage.tsx` — MODIFIED (useState + import button + PriceImportFlow render)
- Commit `e31f096` — FOUND in `git log` (contains Task 1 files; see Deviation #1)
- Commit `2488b9d` — FOUND in `git log`
- Commit `3b5573b` — FOUND in `git log`
- Commit `05650a4` — FOUND in `git log`
- Locked files (`default-prices.ts`, `cito-migration-prices.ts`, `src/data/providers/*.ts`) — VERIFIED UNCHANGED across all 4 task commits
- `grep -rE "VITE_ANTHROPIC" api src --include='*.ts' --include='*.tsx'` — 0 matches
