# Feature: Cito Prijzen + Concurrentie editor — startscherm-entry, export, AI Excel-import

**Status:** Planned — Phase 1 in progress
**Owner:** Pim
**Started:** 2026-05-14
**App:** concurrentoolVO

---

## Doel

Een tweede ingang op het startscherm (naast Schooloverzicht) waar Cito-prijzen en concurrentie-prijzen real-time aangepast kunnen worden, met export-mogelijkheden en een AI-functie om prijzen uit Excel in te lezen.

## Bron

User-conceptschets (sticky-note diagram + screenshot Schooloverzicht). Sessie 2026-05-14.

> Diagram toont één "Startscherm" met twee gele post-its:
> 1. "Scholen overzicht"
> 2. "Input scherm Cito Prijzen + Concurrentie"

---

## Huidige stand van zaken (codebase audit)

Wat al bestaat:

| Onderdeel | Status | Locatie |
|---|---|---|
| `/admin` route met provider-tabs (Cito/DIA/JIJ/SAQI) | ✓ Bestaat | `src/features/admin/AdminConfigEditor.tsx` |
| Per-provider prijsbewerking met save naar Supabase | ✓ Bestaat | `db/pricing-operations.ts` + `stores/pricing-data-store.ts` |
| Manager-only access gate op `/admin` | ✓ Bestaat | role-check in `AdminConfigEditor.tsx` |
| PDF-export per school | ✓ Bestaat | `src/features/export/` (ExportTab, PdfDownloadButton) |
| AI-intake via `claude-haiku-4-5` voor wizard pre-fill | ✓ Bestaat | `src/lib/ai-intake.ts`, `/api/ai-intake.ts` |
| Locked price-data files | 🔒 | `src/data/default-prices.ts`, `cito-migration-prices.ts` |
| Pricing feature folder | (vrijwel leeg, alleen `__tests__`) | `src/features/pricing/` |

Wat **niet** bestaat:

- Geen startscherm-entry naar de prijs-editor (`/` redirect → `/scholen`)
- Geen tab-structuur "Basisvaardigheden / Modules / Concurrentie" (huidige indeling is per provider)
- Geen export van de prijs-config zelf (alleen per-school export)
- Geen AI Excel-import van Cito-prijzen

---

## Scope

### Phase 1 — Startscherm met twee entry cards (MVP)

**Deliverable:** Nieuwe landing page op `/` met twee cards: "Schooloverzicht" en "Cito Prijzen + Concurrentie".

- Vervangt huidige `/` → `/scholen` redirect met een echte landing page
- Card 1 → `/scholen` (huidige Schooloverzicht)
- Card 2 → `/admin` (huidige AdminConfigEditor — eerste versie hergebruikt wat er al is)
- Beide cards altijd zichtbaar; access-gate blijft op `/admin` zelf (manager-only)

**Estimaat:** ~30 min, geen architecturale impact, alleen UI + routing.

### Phase 2 — Tab-restructuur in prijs-editor

**Deliverable:** Vervang huidige provider-tabs op `/admin` door:
- Tab 1: **Cito Basisvaardigheden** (Nederlands, Engels, Wiskunde — kernmodules)
- Tab 2: **Cito Extra modules** (Schoolexamen, etc.)
- Tab 3: **Concurrentie** (DIA, JIJ, SAQI — sub-tabs per provider)

**Open beslissingen:**
- Hoe onderscheiden we "basisvaardigheden" vs "modules" in de huidige Cito data-structuur? Mogelijk al impliciet in `src/data/providers/cito.ts` of `cito-bundles.ts` — moet ingespect worden voor Phase 2.
- Verandert dit alleen de **groepering** in de UI of ook de **data-structuur** in `PROVIDER_CONFIGS`?

**Estimaat:** ~2-3 uur (afhankelijk van data-structuur).

### Phase 3 — Export prijs-config

**Deliverable:** Knop "Exporteer prijslijst" op `/admin` met formaten:
- PDF (gebruik bestaande `@react-pdf/renderer` infra uit `features/export/pdf/`)
- HTML (rendered webpage, downloadable .html)
- Word (.docx — via `docx` of `html-docx-js`)
- TXT (plain text, simpele tabel-layout)

**Open beslissingen:**
- Eén knop met formaat-keuze of vier aparte knoppen?
- Export per tab (alleen Basis / alleen Modules / alleen Concurrentie) of altijd volledig?
- Header/footer/branding op de PDF — gebruiken we de Cito-template uit `features/export/pdf/`?

**Estimaat:** ~3-4 uur (PDF + HTML zijn snel, Word vereist library-keuze + test).

### Phase 4 — AI Excel-import

**Deliverable:** Upload-knop "Importeer prijzen uit Excel" op `/admin` die:
1. Excel-bestand inleest (library: `xlsx` of `exceljs`)
2. Claude (Haiku 4.5) interpreteert structuur → mapt naar `PROVIDER_CONFIGS` shape
3. Toont preview met diffs (huidig → voorgesteld)
4. Op bevestiging: schrijft naar Supabase via bestaande `updatePricingConfig`

**Open beslissingen:**
- Welk Excel-formaat verwacht de gebruiker? (één bestand voor alles? per provider? per tab?) — voorbeelden nodig
- AI-call: structured output via `messages.parse()` (pattern van `ai-intake.ts`) — Zod-schema voor prijs-mapping bouwen
- Server-side via nieuwe `/api/ai-price-import.ts` Vercel function (zelfde patroon als `/api/ai-intake.ts`)
- Cost-aware: Haiku is goedkoop, prima voor dit; geen Opus nodig
- **Risico:** prijzen zijn business-critical (`default-prices.ts` is locked). Dit pad MOET door preview/diff/approval flow gaan — nooit silent overschrijven.

**Estimaat:** ~6-8 uur (parser + AI prompt + preview-UI + tests).

---

## Architecturale notities

**Locked-files-respect:** `src/data/default-prices.ts` en `cito-migration-prices.ts` blijven canonical baseline. Alle user-edits gaan naar Supabase (`pricing_configs` tabel) via de bestaande `updatePricingConfig` → `pricing-data-store.loadFromSupabase()` flow. Engine reads via store, met fallback op file-data. **Geen wijzigingen aan de locked files in deze feature.**

**State:** `usePricingDataStore` (Zustand + Supabase) is al de plek waar de runtime prijsdata leeft — dit blijft de single source of truth voor de engine.

**Offline:** PWA blijft werken — pricing data wordt in IndexedDB (Dexie) gecached na eerste load (bestaand patroon).

**Routing:** TanStack Router — nieuwe routes via bestaand `routes.ts`-patroon.

---

## Open beslissingen die input vereisen

1. **Phase 2 — data-structuur:** Mag de groepering "Basis vs Modules vs Concurrentie" puur UI-zijdig (alleen herstructurering van de tab-rendering), of moet `PROVIDER_CONFIGS` ook een `category` veld krijgen?
2. **Phase 3 — export-scope:** Een knop met formaat-dropdown, of vier separate knoppen?
3. **Phase 4 — Excel-formaat:** Eén voorbeeld-Excel nodig om de parser/AI-prompt op te kalibreren. Zonder voorbeeld blijft de import generic en error-prone.
4. **Toegangsrechten:** Blijft `/admin` manager-only? Of moet ook accountmanager kunnen aanpassen? (Voor Phase 1 niet relevant; voor Phase 2-4 wel.)

---

## Volgende stap

Phase 1 nu implementeren. Phases 2-4 wachten op review + beslissingen hierboven.
