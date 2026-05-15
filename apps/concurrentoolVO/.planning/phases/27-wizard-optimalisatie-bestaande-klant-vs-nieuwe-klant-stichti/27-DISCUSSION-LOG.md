# Phase 27: Wizard-optimalisatie bestaande klant vs nieuwe klant + Stichting-laag - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti
**Areas discussed:** Stichting data-laag + UI-patroon, Cito-oud uitfaseren strategie, AI pijnpunt-matching contract, Wizard-uitbreiding aanpak

---

## Stichting data-laag + UI-patroon

### Q1: Stichting data-laag

| Option | Description | Selected |
|--------|-------------|----------|
| Eigen Supabase tabel + Dexie spiegel | Nieuwe `stichtingen` tabel + FK `stichting_id` op schools. Consistent met multi-school architectuur, schaalt naar aggregatie | ✓ |
| Embedded JSON op School-record | School.metadata krijgt `stichting: { id, name }`. Geen aparte tabel. Geen aggregatie | |
| Aparte tabel zonder Dexie-spiegel | Supabase-only. Botst met offline-vereiste ARCH-05 | |

**User's choice:** Eigen Supabase tabel + Dexie spiegel
**Notes:** Past in bestaand 2-layer storage patroon (Dexie + Supabase).

### Q2: Stichting-overzicht UI-patroon

| Option | Description | Selected |
|--------|-------------|----------|
| Card-grid (zoals SchoolOverview) | Elke stichting een card met mix-indicator, consistent met SchoolOverview | ✓ |
| Table-view (zoals AdminConfigEditor) | Tabel met kolommen. Beter voor 50+ stichtingen | |
| Hybride: cards op overzicht, table in detail | Card-grid extern, table intern | |

**User's choice:** Card-grid (zoals SchoolOverview)

### Q3: Bulk-koppelen scholen aan stichting

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select dialog (checkbox-lijst) | Modal met checkboxes, zoek + 'Koppel N scholen' | |
| Drag-and-drop tussen kolommen | Twee kolommen Gekoppeld \| Beschikbaar via @dnd-kit/core | |
| Inline per school: dropdown op SchoolCard | Stichting-veld op elke SchoolCard | |
| Other (free text) | — | ✓ |

**User's choice:** Smart-suggestion (free text)
**Notes:** Vrije tekst antwoord: *"Zo, dit wel mooi zijn. Dus dat je het systeem ook herkent: hé, wacht. Je hebt eerst wat scholen gedaan en dan denk ik: het doe je op stichtingniveau. Hé, die scholen heb je dus al gedaan en dat zou gewoon kunnen met potentie. En dat je eerst een paar scholen doet en dan de stichting pas. Dat die dat wel herkent, inderdaad."*
**Interpretatie:** Smart-suggestion patroon — bij Stichting aanmaken/openen scant systeem bestaande scholen via heuristieken (regio + naam-similarity + adres) en suggereert matches. User bevestigt suggesties + handmatige multi-select als fallback. Gecaptured in CONTEXT D-03.

### Q4: Stichting verwijderen — cascade

| Option | Description | Selected |
|--------|-------------|----------|
| Scholen unlinken (blijven bestaan) | stichting_id = null op cascade | |
| Bevestigings-keuze tijdens delete | Dialog met unlink vs cascade delete optie | |
| Verbieden als er gekoppelde scholen zijn | Hard gate, eerst handmatig loskoppelen | ✓ |

**User's choice:** Verbieden als er gekoppelde scholen zijn

---

## Cito-oud uitfaseren strategie

### Q1: `cito-oud` provider verwijderen uit LOCKED `default-prices.ts`

| Option | Description | Selected |
|--------|-------------|----------|
| Hard delete in Phase 27 | Verwijder cito-oud regels, vraag opnieuw expliciet OK voor LOCKED file aanraking | ✓ |
| Soft deprecate: behoud data, hide in UI | Cito-oud blijft maar verborgen | |
| Migrate-and-delete | Converteer eerst data naar cito-basis, dan delete | |

**User's choice:** Hard delete in Phase 27
**Notes:** Bevestigd dat executor expliciet OK vraagt vóór file-aanraking.

### Q2: Bestaande SchoolRecords met cito-oud setups

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-migrate naar cito-basis | Dexie migratie converteert | |
| Mark as 'needs review' + redirect naar wizard | Banner + user-action | |
| Negeren: oude records behouden read-only data | Engine kan niet berekenen, warning | |
| Other (free text) | — | ✓ |

**User's choice:** Clean wipe (free text)
**Notes:** *"je kan alles verwijderen want alles is demo bestand"*
**Interpretatie:** Alle bestaande SchoolRecords zijn demo-data, mogen weg. Geen migratie nodig — Dexie migration kan `provider === 'cito-oud'` entries gewoon deleten. Geen banner, geen redirect. Gecaptured in CONTEXT D-07.

### Q3: Verwijderen van migration.ts + current-vs-proposed.ts engines + routes/views

| Option | Description | Selected |
|--------|-------------|----------|
| Verwijder volledig in Phase 27 | Engines + Pages + routes + tests allemaal weg | ✓ |
| Verwijder engines, behoud Pages tijdelijk als redirect | Pages → /comparison redirect | |
| Behoud alles, alleen WizardStep5 aanpassen | Dood code | |

**User's choice:** Verwijder volledig in Phase 27

### Q4: Communicatie naar sales-team in UI

| Option | Description | Selected |
|--------|-------------|----------|
| Geen melding — sales team is op de hoogte | Out-of-band communicatie | ✓ |
| Eenmalige banner op startscherm | Dismissable banner met scenario-update | |
| Changelog-link in app-header | Subtiele "Wat is nieuw?" link | |

**User's choice:** Geen melding — sales team is op de hoogte

---

## AI pijnpunt-matching contract

### Q1: AI-response shape

| Option | Description | Selected |
|--------|-------------|----------|
| Gestructureerd: { painPoints: string[], matches: { module, advantage, confidence }[] } | Met confidence-score, UI kan filteren | ✓ |
| Plat: { matchedAdvantages: string[] } | Alleen lijst, UI looked up | |
| Hybride: painPoints gestructureerd + advantageIds | Compact lookup | |

**User's choice:** Gestructureerd met confidence

### Q2: Trigger voor AI vs rule-based fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Altijd AI, rule-based bij fout/timeout | AI als primary | |
| Altijd beide parallel, AI overschrijft rule-based | Rule-based instant, AI verfijnt | |
| User kiest in UI: snelle vs slimme match | Toggle | |
| Other (free text) | — | ✓ |

**User's choice:** Beiden + custom prompt-mogelijkheid (free text)
**Notes:** *"Beiden. Waarbij dus de gebruiker de optie heeft om de AI te automatiseren door bijvoorbeeld een prompter te geven."*
**Interpretatie:** Parallel beide modes draaien (rule-based instant, AI verfijnt) + power-user kan custom AI prompt-template instellen om matching te sturen (bv. "focus op tijdsbesparing"). Gecaptured in CONTEXT D-11 + D-12.

### Q3: Feedback-loop persistentie

| Option | Description | Selected |
|--------|-------------|----------|
| In SchoolRecord (Supabase row) | Veld op school, Supabase query later | ✓ |
| Eigen tabel `pain_point_feedback` | Aparte tabel, schaalbaar voor analytics | |
| Geen feedback-persistentie in Phase 27 | LocalStorage only | |

**User's choice:** In SchoolRecord (Supabase row)

### Q4: Wanneer wordt AI-match getriggerd

| Option | Description | Selected |
|--------|-------------|----------|
| onBlur van opmerkingen-veld (auto) | Direct feedback bij tab-out | |
| Expliciete knop 'Vind Cito-voordelen' | User klikt na invullen | ✓ |
| Debounced typing (1.5s after last keystroke) | Live feedback | |

**User's choice:** Expliciete knop 'Vind Cito-voordelen'

---

## Wizard-uitbreiding aanpak

### Q1: Wizard-componenten structuur

| Option | Description | Selected |
|--------|-------------|----------|
| Inline uitbreiden in bestaande WizardStep{N}.tsx | Snelste, risico op bloated files | |
| Sub-componenten per logisch blok | Nieuwe SchoolTypeFields etc., schoner | |
| Behoud + Phase-specifieke wrapper (V2) | Wrap met V2 component, klein diff | |
| Other (free text) | — | ✓ |

**User's choice:** Kritische audit per stap (free text)
**Notes:** *"bekijk kritisch obv nieuwe eisen welke we wel kunnen geburiken en welke niet om het compact te houden en tot de kern"*
**Interpretatie:** Tijdens execute-phase per WizardStep kritisch beoordelen welke bestaande code blijft, wat eruit gaat. Lean refactor, geen blind keep-of-all. Compositie via sub-components als impliciet preferable (option 2). Gecaptured in CONTEXT D-16 + D-17.

### Q2: Zod schemas voor nieuwe velden

| Option | Description | Selected |
|--------|-------------|----------|
| Extend bestaande schemas in src/features/school-profile/schemas/ | Atomair per stap | |
| Nieuwe gedeelde schemas + composition | `.merge()` pattern, herbruikbaar | ✓ |
| Eén grote SchoolRecord schema met optional fields | Lossere koppeling per stap | |

**User's choice:** Nieuwe gedeelde schemas + composition

### Q3: WizardStep4 summary-blok (dubbel-check) UX

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only met 'Wijzig'-link per blok | Klik link → navigeer terug | ✓ |
| Inline-editable per veld | Edit-in-place, EditableField patroon | |
| Read-only + 'Volledig wijzigen' knop | Eén knop bovenaan | |

**User's choice:** Read-only met 'Wijzig'-link per blok

### Q4: Concurrent-tijd per taak-type (TimeSavingsSection hergebruik)

| Option | Description | Selected |
|--------|-------------|----------|
| Generieke component met `mode` prop | Refactor TimeSavingsSection → TimeInputSection, DRY | ✓ |
| Tweede component, zelfde patroon | Kopie van structuur, technical debt | |
| Subcomponent in WizardStep4 alleen | Local, niet herbruikbaar | |

**User's choice:** Generieke component met `mode` prop

---

## Claude's Discretion

Beslissingen die researcher of planner mag maken zonder user-input (gecaptured in CONTEXT D-22):
- Exacte string-similarity library voor smart-suggestion (`string-similarity` vs simple Levenshtein)
- Confidence-threshold voor pre-checked suggestions (default 0.8, kalibreerbaar)
- Exacte styling van match-resultaten in `<PainPointPanel>`
- Aantal taak-types in `TimeInputSection mode='competitor-time'`
- Exact AI-timeout-threshold (default 5s, range 3-8s)
- Heuristieken-mix-weights voor smart-suggestion (regio vs naam vs adres)
- Of `cito-bundles.ts` ook gesplitst moet worden voor Basis/Plus
- Exact veldnaam voor klant-type (`customerType` vs `citoCustomerStatus`)
- Aparte `team_settings` tabel vs uitbreiding bestaande voor `painPointMatcherPromptOverride`

## Deferred Ideas

Genoemd of impliciet tijdens discussie, expliciet uitgesteld naar latere phases:
- **Bestuurs-niveau analytics dashboard** — Stichting-aggregatie voor Cito-management
- **AI-feedback-loop machine-learning** — gebruik thumb-up/down voor matching-fine-tuning
- **Multi-stichting-vergelijking** — vergelijking tussen besturen onderling
- **Per-user AI custom-prompt** (ipv per team)
- **Schoolsoort-specifieke prijslogica** (Dakpanklas/Dalton eigen prijsstructuur)
- **Concurrent-tijd benchmarking standalone feature**
- **Vierde provider toevoegen**
