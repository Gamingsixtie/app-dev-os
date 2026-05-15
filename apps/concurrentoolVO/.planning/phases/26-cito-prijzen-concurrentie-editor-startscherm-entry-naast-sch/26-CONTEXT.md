# Phase 26: Cito Prijzen + Concurrentie Editor - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Vervang `/` → `/scholen` redirect met een echte landing page (twee gelijke cards: Schooloverzicht + Cito Prijzen + Concurrentie); lever een dedicated prijs-editor op `/prijzen` met domein-tabs (Basisvaardigheden / Modules / Concurrentie), multi-format export van de prijslijst (PDF/HTML/Word/TXT), en een eigen AI-gestuurde Excel-import met diff-preview.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**8 requirements zijn locked.** Zie `26-SPEC.md` voor de volledige requirements, boundaries en acceptance criteria.

Downstream agents (researcher, planner) MOETEN `26-SPEC.md` lezen vóór planning of implementatie. Requirements worden niet hier gedupliceerd.

**In scope (uit SPEC.md):**
- Nieuwe `StartschermPage` op `/` met twee entry-cards (Schooloverzicht + Cito Prijzen + Concurrentie)
- Restructure van prijs-editor tabs naar 3 domeinen (Basisvaardigheden / Modules / Concurrentie met sub-tabs)
- Hergebruik van bestaande `updatePricingConfig` save-pipeline (geen nieuwe data-laag)
- Multi-format export van prijslijst: PDF, HTML, Word, TXT (met Cito-branding + datum)
- AI Excel-import via `claude-haiku-4-5` + nieuwe Vercel function + diff-preview UI + Supabase save na bevestiging
- Manager-only access gate (hergebruik bestaand patroon)
- Dutch UI throughout

**Out of scope (uit SPEC.md):**
- Wijzigingen aan locked files `src/data/default-prices.ts` en `cito-migration-prices.ts`
- Wijziging aan auth/RBAC-model (accountmanager-toegang)
- Stakeholder feedback / flagging workflow (= Phase 25's domein)
- Schema-migraties in `pricing_configs` Supabase tabel
- Word-output via server-side rendering
- Excel **export** (alleen Excel **import**)
- Mobile-responsive editor
- Bulk-rollback van prijswijzigingen
- Multi-provider Excel-import (single-provider scope per upload)

</spec_lock>

<decisions>
## Implementation Decisions

### Route topology
- **D-01:** Nieuwe route `/prijzen` met de domein-tabs. `/admin` wordt een redirect naar `/prijzen` voor backward-compat. Sluit aan op de card-naam "Cito Prijzen + Concurrentie" op het startscherm.
- **D-02:** Tab-state via TanStack Router search params (e.g. `/prijzen?tab=modules&provider=dia`) zodat tabs deeplinkable + refresh-safe zijn. Niet via component useState.

### Tab data-structuur
- **D-03:** UI-only grouping voor Basis/Modules/Concurrentie. Geen wijziging aan `src/data/providers/cito.ts`, `dia.ts`, `jij.ts`, `saqi.ts` of het `ModuleDefinition` type. Een mapping-constant (bv. `BASIS_MODULE_IDS: ReadonlySet<string>`) in de nieuwe `features/pricing/` folder bepaalt welke Cito-modules in welke tab landen.
- **D-04:** Categorie-veld op `ModuleDefinition` is uitgesteld naar een latere phase als het in de praktijk te brittle blijkt. Eerst pragmatische UI-mapping.

### Startscherm layout
- **D-05:** Twee gelijke cards centered, gelijke grootte, naast elkaar — exact zoals de sticky-note schets. Geen hero-banner, geen recente-acties-lijst. Past binnen bestaande Cito design-tokens (`cito-primary` #003082, neutral cards `bg-white border-neutral-200`).
- **D-06:** Beide cards altijd zichtbaar voor alle ingelogde users; access-control gebeurt bij click op de Cito Prijzen card → `/prijzen` route hergebruikt de bestaande manager-only role-gate van `AdminConfigEditor` (toont "Geen toegang" scherm voor non-managers).

### AI Excel-import
- **D-07:** Eigen flow in `/prijzen`. **Niet** integreren met de bestaande `ops-competitor-intel` skill van Phase 25. Acceptatie van risico op duplicate code in ruil voor: (a) geen blockage door Phase 25's status, (b) focused single-purpose flow voor prijs-import, (c) snellere shipping.
- **D-08:** Eigen Vercel function `api/ai-price-import.ts` — patroon mirror van bestaande `api/ai-intake.ts` (server-side `ANTHROPIC_API_KEY`, `claude-haiku-4-5`, structured output via `messages.parse()` + Zod schema).
- **D-09:** Eigen diff-view component in `features/pricing/components/PriceImportDiffView.tsx` — kan visueel patroon overnemen van `features/intake/DiffView.tsx` maar wordt nieuw geschreven, niet hergebruikt (verschillende data shape).
- **D-10:** Excel-parser library = `xlsx` (al in `package.json`, Phase 22 decision: "xlsx HIGH vulnerability accepted — internal tool, no untrusted file uploads"). Geen nieuwe library introduceren.
- **D-11:** Single-provider per upload (per SPEC). User kiest provider via dropdown vóór upload; de AI prompt is dan toegespitst op één provider-schema.

### Export technische keuzes
- **D-12:** PDF-export hergebruikt `@react-pdf/renderer` infrastructuur via een nieuwe template `features/pricing/pdf/PriceListPdf.tsx` (gebaseerd op het patroon van `features/export/pdf/`). Lazy-loaded via `PriceListPdfDownloadButton.tsx` (analoog aan `PdfDownloadButton.tsx`).
- **D-13:** HTML-export = client-side string-builder die de huidige `PROVIDER_CONFIGS` snapshot rendert in een styled HTML-document, gedownload als `.html` via Blob URL.
- **D-14:** Word-export library keuze is technische detail — researcher mag kiezen tussen `docx` (volledige Word doc API, ~150KB) of `html-docx-js` (HTML→docx convertor, ~50KB). Beide moeten lazy-loaded zijn.
- **D-15:** TXT-export = simpele pure function die `PROVIDER_CONFIGS` formatteert als tab-separated tabel met datum-header.
- **D-16:** Eén "Exporteer prijslijst" knop met dropdown voor 4 formaten (per SPEC). Component: `features/pricing/components/PriceListExportButton.tsx`.

### Branding & disclaimer in exports
- **D-17:** Header in elk export-formaat bevat: "Cito Rekentool — Prijslijst", datum van vandaag (NL formaat: `14 mei 2026`), en disclaimer-regel onderaan: "Prijzen zijn indicatief en kunnen aangepast worden. Voor actuele bevestiging: contact Cito."
- **D-18:** Cito-logo in PDF: hergebruik bestaande logo-asset uit `features/export/pdf/` (bestaande PDF-template heeft het al); fallback naar tekst "CITO" in `cito-primary` kleur indien afwezig.

### Claude's Discretion
- Exacte styling van de twee startscherm-cards (icons, hover-states, micro-interactions) — researcher / planner kiest binnen Cito design-tokens.
- Exacte routing-mechanisme van `/admin` → `/prijzen` redirect (TanStack Router `beforeLoad` redirect vs aparte route component).
- Of Word-export `docx` of `html-docx-js` gebruikt — bundle-size + maintenance trade-off, researcher beslist.
- Structuur van de Zod-schema voor AI Excel-import response — planner ontwerpt op basis van `PROVIDER_CONFIGS` shape.
- File-size limit voor Excel-upload (defensief; suggestie: 5MB analoog aan `DocumentDropzone`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 26 specs & locked requirements
- `apps/concurrentoolVO/.planning/phases/26-cito-prijzen-concurrentie-editor-startscherm-entry-naast-sch/26-SPEC.md` — Locked requirements (8 items), boundaries en acceptance criteria — MUST READ
- `apps/concurrentoolVO/projects/briefs/code-feature-prijs-editor/brief.md` — Initial scope document met 4-faseige opbouw en architecturale notities

### Project-level rules & architecture
- `apps/concurrentoolVO/AGENTS.md` — App-specific hard rules (Dutch UI, locked files, 3 hard-coded providers, pure-function engine invariant, manager-only `/admin`)
- `apps/concurrentoolVO/CLAUDE.md` — Architecture overview: views, Zustand stores, engines, AI-intake pattern, gotchas
- `apps/concurrentoolVO/code_context/architecture.md` — (indien aanwezig) per-app architecturale beslissingen

### Existing code patterns to mirror or extend
- `apps/concurrentoolVO/src/features/admin/AdminConfigEditor.tsx` — Huidige prijs-editor (manager-only gate, per-provider tabs) — refactor base
- `apps/concurrentoolVO/src/features/admin/ProviderConfigForm.tsx` — Sub-form voor één provider configureren — hergebruik in domein-tabs
- `apps/concurrentoolVO/src/features/admin/schemas/` — Zod schemas voor pricing config — hergebruik / extend
- `apps/concurrentoolVO/src/db/pricing-operations.ts` — `updatePricingConfig` save-pipeline — hergebruik
- `apps/concurrentoolVO/src/stores/pricing-data-store.ts` — `usePricingDataStore.loadFromSupabase()` — hergebruik na save + na Excel-import
- `apps/concurrentoolVO/src/hooks/usePricingConfigs.ts` — React Query hook voor pricing configs — hergebruik
- `apps/concurrentoolVO/src/features/export/pdf/` — PDF-template patroon (incl. Cito logo, layout helpers)
- `apps/concurrentoolVO/src/features/export/components/PdfDownloadButton.tsx` — Lazy-loaded PDF download patroon
- `apps/concurrentoolVO/src/features/intake/` — AI extraction + diff-view UI-patroon (visueel, niet code-copy)
- `apps/concurrentoolVO/src/lib/ai-intake.ts` — Frontend → `/api` Vercel function patroon
- `apps/concurrentoolVO/api/ai-intake.ts` — Vercel function patroon: `ANTHROPIC_API_KEY`, `claude-haiku-4-5`, `messages.parse()`, Zod schema
- `apps/concurrentoolVO/src/router/routes.ts` — TanStack Router route registration; index/redirect patroon

### Data sources (read-only references)
- `apps/concurrentoolVO/src/data/providers/cito.ts`, `dia.ts`, `jij.ts`, `saqi.ts` — Module definitions per provider — read-only voor Phase 26
- `apps/concurrentoolVO/src/data/default-prices.ts` — 🔒 LOCKED: canonical baseline — NEVER edit
- `apps/concurrentoolVO/src/data/cito-migration-prices.ts` — 🔒 LOCKED: NEVER edit
- `apps/concurrentoolVO/src/data/cito-bundles.ts`, `dia-packages.ts`, `jij-license-tiers.ts` — pricing-strategy definitions

### State (project context)
- `apps/concurrentoolVO/.planning/STATE.md` — Phase 25 status, accumulated decisions per phase
- `apps/concurrentoolVO/.planning/ROADMAP.md` § Phase 26 — Phase-list entry + Phase Details entry
- `apps/concurrentoolVO/.planning/PROJECT.md` — Core value, business context

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **AdminConfigEditor.tsx** — Manager-only gate (role-check), tab-rendering, save-handler met `updatePricingConfig` + `loadFromSupabase()` + React Query invalidation. Refactor naar `/prijzen` route met domein-tabs.
- **ProviderConfigForm.tsx** — Form voor één provider's `PricingStrategy`. Hergebruik binnen sub-tabs van "Concurrentie" hoofdtab (DIA / JIJ / SAQI).
- **PdfDownloadButton.tsx** — Pattern: lazy import van `@react-pdf/renderer`, blob-URL download. Mirror voor `PriceListPdfDownloadButton.tsx`.
- **DiffView.tsx (features/intake/)** — Visueel patroon voor diff-preview met confirm/cancel buttons. Voor Excel-import diff is een aparte component, maar layout-pattern overnemen.
- **ai-intake.ts + api/ai-intake.ts** — End-to-end AI flow: frontend POST → Vercel function → Anthropic SDK met structured output → typed response naar frontend. Mirror voor `api/ai-price-import.ts`.

### Established Patterns
- **Manager-only gates** — `userProfile?.role !== 'manager'` check + "Geen toegang" scherm (consistent UX).
- **Lazy route components** — `lazyRouteComponent(() => import('@/features/X/Page'))` voor code-splitting.
- **React Query + Zustand split** — Server-state via React Query (`usePricingConfigs`), runtime engine-state via Zustand (`usePricingDataStore`). Niet duplicate.
- **Locked-files respect** — Alle user-edits via Supabase, nooit naar `src/data/*-prices.ts` schrijven. Engine reads via store, met fallback op file-data.
- **Dutch error messages** — Alle UI-fouten in NL, mapping via helpers waar nodig (zie Phase 08 decision: mapAuthError pattern).
- **PWA offline-first** — Voor exports: client-side generation (geen Vercel-call). Voor AI Excel-import: vereist online; offline state via `OfflineBanner` afhandelen.

### Integration Points
- **Routing** — `src/router/routes.ts`: vervang `indexRoute` redirect met `StartschermPage` component; voeg `prijzenRoute` toe (parallel naast `scholenRoute`); update of behoud `adminRoute` als redirect.
- **State** — `usePricingDataStore.getState().loadFromSupabase()` na elke save + na Excel-import bevestiging. Geen nieuwe store nodig.
- **Engine** — Engines lezen via store; geen wijziging nodig voor Phase 26. Pure-function invariant blijft.
- **Auth** — `useAuth()` hook (React Context, `userProfile`) — hergebruik voor manager-gate.
- **Brand-styling** — Tailwind tokens: `cito-primary`, `cito-bg`, `text-cito-primary`. Bestaande convention houden.

</code_context>

<specifics>
## Specific Ideas

- **Startscherm-card stijl:** matchen met sticky-note schets — twee gele/cream achtige cards van gelijke grootte naast elkaar (kan ook white met cito-primary accent — researcher kiest binnen design-tokens).
- **`/prijzen` als URL:** expliciete keuze voor Nederlandse URL-conventie (matcht `/scholen`, `/vergelijking`, `/migratie`).
- **Geen integratie met `ops-competitor-intel` skill:** user heeft bewust gekozen voor focused single-purpose flow boven hergebruik — accepteer duplicate code risk.
- **Excel-import:** user-flow is upload → AI parse → diff-view → bevestig per rij → bulk-save. Geen silent overwrite, geen partial save zonder review.

</specifics>

<deferred>
## Deferred Ideas

- **`category` field op `ModuleDefinition`** — Eerst UI-mapping; als blijkt dat de heuristiek te brittle is (bv. nieuwe modules vergeten te categoriseren), promoveren naar data-veld. Vermoedelijk een aparte mini-phase.
- **Multi-provider Excel-import** — Out of scope per SPEC; toekomstige phase als gebruikers één bestand met alle providers willen uploaden.
- **Excel-export** — Out of scope per SPEC; alleen import. Als users prijslijst in Excel willen ontvangen, separate phase.
- **Accountmanager-toegang tot prijs-editor** — Out of scope per SPEC; aparte RBAC-discussie.
- **Integratie met `ops-competitor-intel`** — Mogelijk in een toekomstige refactor-phase als de duplicate-code-cost te hoog blijkt.
- **`/admin` consolidatie / opheffing** — Voor nu een redirect naar `/prijzen`; als er nooit andere admin-functies komen, kan `/admin` volledig verwijderd worden. Apart te beslissen.
- **Audit-trail van prijswijzigingen via Phase 26's flow** — Phase 25's domein; deze phase touched dat niet.

</deferred>

---

*Phase: 26-cito-prijzen-concurrentie-editor*
*Context gathered: 2026-05-14*
