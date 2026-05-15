# Phase 26: Cito Prijzen + Concurrentie Editor — Specification

**Created:** 2026-05-14
**Ambiguity score:** 0.18
**Requirements:** 8 locked

## Goal

Vervang de huidige `/` → `/scholen` redirect door een echt **startscherm** met twee gelijkwaardige entry-points (Schooloverzicht + Cito Prijzen + Concurrentie), en lever een dedicated prijs-editor met domein-georiënteerde tabs, multi-format export van de prijslijst, en een AI-gestuurde Excel-import met diff-preview.

## Background

**Wat bestaat vandaag:**

- `/` redirect naar `/scholen` (TanStack Router `indexRoute` in `src/router/routes.ts:32-38`) — er is geen echt startscherm
- `/scholen` toont `SchoolOverviewPage` (32 scholen in de huidige dev-data)
- `/admin` bestaat met `AdminConfigEditor.tsx` — manager-only, **provider-georiënteerde tabs** (Cito | DIA | JIJ | SAQI), schrijft naar Supabase via `updatePricingConfig` → `pricing-data-store.loadFromSupabase()`
- Locked price-data files: `src/data/default-prices.ts`, `src/data/cito-migration-prices.ts` — canonical baseline, NOOIT direct bewerken
- PDF-export infrastructuur bestaat: `src/features/export/` met `@react-pdf/renderer`, `PdfDownloadButton.tsx`, `ExportTab.tsx` — maar alleen per-school (school-rapporten), **niet voor de prijslijst zelf**
- AI-intake pattern bestaat: `src/lib/ai-intake.ts` + `/api/ai-intake.ts` (Vercel serverless function), `claude-haiku-4-5`, structured output via `messages.parse()` + Zod schema
- Pricing data store: `usePricingDataStore` (Zustand + Supabase) is single source of truth voor runtime prijsdata
- IndexedDB (Dexie) caching voor offline-werking is bestaand patroon

**Wat ontbreekt:**

- Geen startscherm-entry naar de prijs-editor (alleen via hidden `/admin` URL of via verborgen menu)
- Geen domein-georiënteerde tab-indeling (Basisvaardigheden / Modules / Concurrentie) — huidige tabs gaan per provider
- Geen export-functionaliteit voor de prijs-config zelf (`PROVIDER_CONFIGS` snapshot)
- Geen AI Excel-import voor batch prijs-updates

**Trigger voor deze phase:** User wil de Cito-prijzen real-time kunnen tweaken vanaf het startscherm, en de prijslijst gemakkelijk kunnen delen via PDF/Word/HTML/TXT. Excel is de huidige werkrealiteit voor prijs-updates — AI moet die input kunnen omzetten naar `PROVIDER_CONFIGS` shape met menselijke goedkeuring.

## Requirements

1. **Startscherm met twee entry cards**: De landingspagina `/` toont twee gelijkwaardige cards in plaats van een redirect.
   - Current: `/` → redirect naar `/scholen` (routes.ts:32-38)
   - Target: `/` rendert een `StartschermPage` met twee cards: "Schooloverzicht" → `/scholen` en "Cito Prijzen + Concurrentie" → `/prijzen` (nieuwe route, of hergebruik `/admin`)
   - Acceptance: Bezoeker van `/` ziet beide cards; klik op kaart 1 navigeert naar `/scholen`; klik op kaart 2 naar de prijs-editor; geen redirect-flits zichtbaar

2. **Domein-georiënteerde tab-structuur in prijs-editor**: De prijs-editor groepeert tabs per domein, niet per provider.
   - Current: `AdminConfigEditor` heeft 4 tabs per provider (Cito | DIA | JIJ | SAQI)
   - Target: 3 hoofdtabs: **Cito Basisvaardigheden** | **Cito Modules** | **Concurrentie** (met sub-tabs DIA/JIJ/SAQI)
   - Acceptance: Op de prijs-editor zijn 3 hoofdtabs zichtbaar; klik op "Concurrentie" toont sub-tabs voor DIA/JIJ/SAQI; alle bestaande save-flow naar Supabase blijft werken

3. **Prijswaarden zijn real-time bewerkbaar met directe Supabase-persistentie**: Wijzigingen aan prijzen worden onmiddellijk opgeslagen en de engine herberekent reactief.
   - Current: `AdminConfigEditor` ondersteunt al save naar Supabase via `updatePricingConfig` + `pricing-data-store.loadFromSupabase()` — dit werkt en blijft hergebruikt
   - Target: Tab-restructure hergebruikt bestaande save-pipeline; geen nieuwe data-laag, geen wijziging aan locked files
   - Acceptance: Een prijswijziging in tab "Cito Basisvaardigheden" wordt na save zichtbaar in een school-vergelijking (open een school → vergelijking ziet de nieuwe prijs); `default-prices.ts` en `cito-migration-prices.ts` zijn ongewijzigd

4. **Multi-format export van de prijslijst (PDF, HTML, Word, TXT)**: Eén "Exporteer prijslijst" knop met formaat-keuze; gegenereerde bestanden bevatten de huidige `PROVIDER_CONFIGS` snapshot.
   - Current: Geen export voor prijs-config (alleen per-school export bestaat)
   - Target: Knop op de prijs-editor met dropdown voor 4 formaten; PDF gebruikt `@react-pdf/renderer` (bestaande infra), HTML wordt direct rendered + gedownload, Word via een gekozen library (te beslissen in plan-phase), TXT is plain text met tabel-layout
   - Acceptance: Klik op "Exporteer als PDF" downloadt een `.pdf` waarin de huidige Cito + concurrentie-prijzen leesbaar staan; idem voor HTML/Word/TXT — bij geopende file ziet de gebruiker de prijzen consistent met wat in de UI staat

5. **Export-bestand bevat juiste branding en datum-stempel**: Exports zijn deelbaar zonder verdere bewerking.
   - Current: PDF-templates in `features/export/pdf/` zijn school-rapport-specifiek, niet prijslijst-specifiek
   - Target: Nieuw prijslijst-template (PDF + HTML + Word) met Cito-branding (logo, primary color #003082), datum van export, en disclaimer dat prijzen indicatief zijn
   - Acceptance: Geopende export-file toont Cito-logo of fallback-tekst, datum van vandaag, en disclaimer-regel onderaan

6. **AI Excel-import met diff-preview voor goedkeuring**: Excel-upload wordt door Claude geïnterpreteerd; voorgestelde wijzigingen worden in een diff-view getoond; alleen na expliciete bevestiging geschreven naar Supabase.
   - Current: AI document-extractie bestaat voor school-prijzen (`features/export/components/AssumptionsEditor.tsx` + diff-view-patroon uit Phase 9), maar niet voor de globale `PROVIDER_CONFIGS`
   - Target: Knop "Importeer prijzen uit Excel" op de prijs-editor; upload `.xlsx`-bestand → nieuwe `/api/ai-price-import.ts` Vercel function parse-t het bestand (library: `xlsx`) → `claude-haiku-4-5` mapt rijen naar `PROVIDER_CONFIGS` shape via Zod-schema → frontend toont per-rij diff (huidig → voorgesteld) → user bevestigt → save via `updatePricingConfig`
   - Acceptance: Upload van een test Excel-bestand met 5 prijzen toont 5 diff-rijen; klik "Bevestig" schrijft naar Supabase; klik "Annuleer" laat data ongewijzigd; bij parse-fout of AI-fout wordt error duidelijk getoond in NL

7. **Geen wijzigingen aan locked price-data files**: Phase 26 raakt `src/data/default-prices.ts` en `src/data/cito-migration-prices.ts` niet.
   - Current: Files zijn locked per `apps/concurrentoolVO/AGENTS.md` — never edit without explicit approval
   - Target: Alle user-edits gaan via Supabase `pricing_configs` tabel (bestaand patroon); locked files blijven canonical fallback
   - Acceptance: `git diff` op de phase-merge toont GEEN wijziging in `src/data/default-prices.ts` of `src/data/cito-migration-prices.ts`

8. **Toegang tot prijs-editor blijft manager-only**: De `/admin`-pattern role-gate wordt overgenomen; non-managers zien de tweede card op het startscherm maar krijgen access-denied bij click.
   - Current: `AdminConfigEditor` controleert `userProfile?.role !== 'manager'` en toont "Geen toegang"
   - Target: Tweede card is altijd zichtbaar op startscherm; klik door non-manager toont access-denied scherm (consistent met huidig `/admin` gedrag)
   - Acceptance: Login als accountmanager (niet manager) → klik tweede card → "Geen toegang" scherm; login als manager → klik tweede card → prijs-editor met tabs

## Boundaries

**In scope:**

- Nieuwe `StartschermPage` op `/` met twee entry-cards (Schooloverzicht + Cito Prijzen + Concurrentie)
- Restructure van prijs-editor tabs naar 3 domeinen (Basisvaardigheden / Modules / Concurrentie met sub-tabs)
- Hergebruik van bestaande `updatePricingConfig` save-pipeline (geen nieuwe data-laag)
- Multi-format export van prijslijst: PDF, HTML, Word, TXT (met Cito-branding + datum)
- AI Excel-import via `claude-haiku-4-5` + nieuwe Vercel function + diff-preview UI + Supabase save na bevestiging
- Manager-only access gate (hergebruik bestaand patroon)
- Dutch UI throughout (per apps/concurrentoolVO/AGENTS.md hard rule)

**Out of scope:**

- Wijzigingen aan locked files `src/data/default-prices.ts` en `cito-migration-prices.ts` — kanonieke baseline blijft intact; alle user-edits via Supabase
- Wijziging aan auth/RBAC-model (accountmanager-toegang tot prijs-editor) — apart te beslissen, niet onderdeel van deze phase
- Stakeholder feedback / flagging workflow — dat is Phase 25's domein, niet hier
- Schema-migraties in `pricing_configs` Supabase tabel — gebruik bestaande shape; geen kolommen toevoegen
- Word-output via server-side rendering — client-side library only (kleinere blast radius, geen extra Vercel function)
- Excel **export** — alleen Excel **import**; export-formaten zijn PDF/HTML/Word/TXT (geen XLSX-output)
- Mobile-responsive editor — desktop-first (consistent met bestaande `AdminConfigEditor` aanpak)
- Bulk-rollback van prijswijzigingen — single-commit save is voldoende; rollback gebeurt via Supabase audit-trail (bestaand)
- AI Excel-import die meerdere providers tegelijk update in één file — single-provider scope per upload (kleinere AI-prompt, lagere fout-kans)

## Constraints

- **Locked files mogen niet aangeraakt worden** — `default-prices.ts` en `cito-migration-prices.ts` zijn canonical baseline (per AGENTS.md). Alle user-data lives in Supabase.
- **Pure-function engine invariant** blijft gehandhaafd — geen side-effects in `src/engine/*` (per app-rules)
- **AI server-side via Vercel function** — `ANTHROPIC_API_KEY` is server-only env var (geen `VITE_` prefix); patroon hergebruiken uit `/api/ai-intake.ts`
- **Bundle-size** — `@react-pdf/renderer` is al lazy via `PdfDownloadButton`; nieuwe export-libraries (Word) moeten ook lazy zijn om initial-load impact te vermijden
- **PWA offline** — exports werken offline (file-generatie client-side); AI Excel-import vereist online (geen offline-AI fallback nodig)
- **Excel parser library** — `xlsx` library is al toegestaan en aanwezig in `package.json` (zie `[Phase 22]: xlsx HIGH vulnerability accepted -- internal tool, no untrusted file uploads` in STATE.md decisions); hergebruiken voor consistentie
- **Test coverage** — engine-wijzigingen vereisen tests (per app-rules); tab-restructure UI-tests volgen bestaande Vitest + Testing Library patroon

## Acceptance Criteria

- [ ] `/` rendert `StartschermPage` met exact twee cards (Schooloverzicht + Cito Prijzen + Concurrentie) — geen redirect naar `/scholen`
- [ ] Klik op card "Schooloverzicht" navigeert naar `/scholen` (bestaande SchoolOverviewPage)
- [ ] Klik op card "Cito Prijzen + Concurrentie" navigeert naar de prijs-editor (manager-only gate werkt)
- [ ] Prijs-editor toont exact 3 hoofdtabs: "Cito Basisvaardigheden" | "Cito Modules" | "Concurrentie"
- [ ] "Concurrentie" tab toont sub-tabs voor DIA, JIJ, SAQI
- [ ] Prijswijziging in een tab → save knop → prijswijziging is zichtbaar in een school-vergelijking zonder page-refresh
- [ ] Export-knop met formaat-dropdown is aanwezig op de prijs-editor; PDF/HTML/Word/TXT downloads werken alle vier
- [ ] Geopende export-file toont Cito-branding (logo of fallback-tekst), datum van vandaag, disclaimer-regel
- [ ] Upload `.xlsx` via "Importeer prijzen uit Excel" → diff-view toont voorgestelde wijzigingen → "Bevestig" schrijft naar Supabase
- [ ] Upload met parse-fout of AI-fout toont begrijpelijke Nederlandse foutmelding (geen stacktrace in UI)
- [ ] `git diff main..phase-26-branch` toont geen wijziging in `src/data/default-prices.ts` of `src/data/cito-migration-prices.ts`
- [ ] Non-manager (accountmanager) ziet beide cards op startscherm, maar krijgt "Geen toegang" bij klik op de tweede card
- [ ] `npm run build` slaagt zonder TypeScript errors
- [ ] `npx vitest run` slaagt — alle bestaande tests blijven groen, nieuwe tests voor `StartschermPage` + tab-restructure + Excel-parser zijn toegevoegd

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                                |
|--------------------|-------|------|--------|----------------------------------------------------------------------|
| Goal Clarity       | 0.85  | 0.75 | ✓      | Outcome scherp: startscherm + tabs + export + AI-import              |
| Boundary Clarity   | 0.78  | 0.70 | ✓      | Explicit out-of-scope; Word-library + tab-data-shape pending in plan |
| Constraint Clarity | 0.72  | 0.65 | ✓      | Locked-files, server-side AI, lazy bundles — alle vastgelegd         |
| Acceptance Criteria| 0.80  | 0.70 | ✓      | 14 pass/fail criteria                                                |
| **Ambiguity**      | 0.18  | ≤0.20| ✓      | Gate passed                                                          |

## Interview Log

| Round | Perspective     | Question summary                                          | Decision locked (auto-selected)                                                      |
|-------|-----------------|----------------------------------------------------------|--------------------------------------------------------------------------------------|
| 1     | Researcher      | Wat bestaat vandaag — startscherm, prijs-editor, export? | `/admin` editor bestaat (per-provider), export bestaat per-school, geen startscherm  |
| 2     | Simplifier      | Minimum viable scope?                                    | 4 deliverables in 1 phase, 4 plans (kan plan-phase splitsen indien te groot)         |
| 3     | Boundary Keeper | Wat NIET in deze phase?                                  | Locked files, RBAC-wijziging, Excel-export, Phase-25 feedback-workflow               |
| 3     | Boundary Keeper | Wat is "done"?                                           | Startscherm zichtbaar + tabs ge-restructured + 4 export-formats + Excel-import live  |
| 4     | Failure Analyst | Wat gaat fout bij verkeerde requirements?                | Per ongeluk locked-files editen, of silent Excel-import-overwrite van prijzen        |
| 4     | Failure Analyst | Hoe verifieren we no-locked-edit?                        | Acceptance: `git diff` toont geen wijziging in default-prices.ts/cito-migration      |
| 5     | Seed Closer     | Word-library client- of server-side?                     | Client-side library only — kleinere blast radius, planner kiest specifieke lib       |
| 5     | Seed Closer     | Eén export-knop of vier?                                 | Eén knop met dropdown — cleaner UI, schaalbaarder voor extra formaten in de toekomst |

**[auto] mode notes:** Bovenstaande beslissingen zijn auto-geselecteerd op basis van: (a) project-AGENTS.md hard rules (locked files, Dutch UI, server-side AI), (b) bestaande patronen in de codebase (lazy PDF imports, diff-view voor AI extractie, manager-only gate), (c) brief in `projects/briefs/code-feature-prijs-editor/brief.md`. Indien een beslissing verkeerd is aangenomen, kan dit in discuss-phase worden gecorrigeerd.

---

*Phase: 26-cito-prijzen-concurrentie-editor*
*Spec created: 2026-05-14*
*Next step: `/gsd-discuss-phase 26` — implementation decisions (route-path keuze, Word-library keuze, Excel-parser-prompt shape, tab-state-management)*
