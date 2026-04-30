# Framework-analyse & Samenhang — Verbeterrapport

**Datum:** 2026-03-23
**Scope:** Volledige codebase Rekentool VO (v1.0 + v2.0 t/m Phase 15)
**Methode:** 4 parallelle deep-dives: engines, dataflow, AI-inzet, user journey

---

## Inhoudsopgave

1. [Samenvatting & Totaaloordeel](#1-samenvatting)
2. [Engines — Kloppen de berekeningen?](#2-engines)
3. [Koppelingen — Werkt de dataflow?](#3-koppelingen)
4. [AI-inzet — Wordt AI goed gebruikt?](#4-ai-inzet)
5. [User Journey — Kloppen de logische stappen?](#5-user-journey)
6. [Samenhang tussen Phases](#6-samenhang)
7. [Geprioriteerde Verbeterpunten](#7-verbeterpunten)
8. [Advies voor resterende Phases](#8-advies)

---

## 1. Samenvatting

### Totaaloordeel: SOLIDE FUNDAMENT, KRITIEKE GATEN

De Rekentool VO heeft een **goed doordachte architectuur** met pure engines, gescheiden stores en doelgerichte AI-inzet. Het framework werkt voor het nominale pad (account manager doorloopt wizard → ziet vergelijking → bouwt business case).

**Maar:** er zijn 4 kritieke problemen die moeten worden opgelost voordat de tool betrouwbaar in productie kan:

| # | Probleem | Impact | Categorie |
|---|----------|--------|-----------|
| 1 | JIJ-prijzen gebaseerd op hardcoded 2 tests/leerling — kan 50-100% afwijken | Verkeerde vergelijking | Engine |
| 2 | appliedOverrides niet geladen uit database — prijsoverschrijvingen verdwijnen na refresh | Dataverlies | Koppeling |
| 3 | Geen export/delen van resultaten — account manager kan niets meenemen naar school | Tool onbruikbaar in praktijk | UX |
| 4 | Document-truncatie (30KB/10KB) — lange schoolplannen/prijslijsten worden afgesneden | Gemiste kansen/prijzen | AI |

---

## 2. Engines — Kloppen de berekeningen?

### 2.1 Overzicht

Er zijn **11 engine-bestanden** gevonden, allemaal pure functions:

| Engine | Bestand | Status |
|--------|---------|--------|
| Prijsvergelijking | `src/engine/price-comparison.ts` | Correct |
| Huidig vs Cito | `src/engine/current-vs-proposed.ts` | Bug gevonden |
| Migratie | `src/engine/migration.ts` | Correct met kanttekeningen |
| DIA-pakketten | `src/engine/dia-packages.ts` | Correct |
| Hybride scenario | `src/engine/hybrid-scenario.ts` | Correct |
| Gevoeligheid | `src/engine/sensitivity.ts` | Correct |
| Sales-signalen | `src/engine/sales-signals.ts` | Correct |
| Upsell-detectie | `src/engine/upsell.ts` | Logica-issue |
| Schijnvoordeel | `src/engine/schijnvoordeel.ts` | Willekeurige drempels |
| Cito-bundels | `src/engine/cito-bundles.ts` | Correct |
| Scenario-detectie | `src/engine/scenario-detection.ts` | Correct |

### 2.2 Bevindingen

#### MUST FIX

**BUG: `current-vs-proposed.ts` lijn ~58 — JavaScript truthy-fout**
```typescript
// HUIDIGE CODE (fout):
if (setup.currentProvider === 'cito-oud' || 'cito-nieuw') { ... }
// EVALUEERT ALS: (setup.currentProvider === 'cito-oud') || ('cito-nieuw')
// 'cito-nieuw' is altijd truthy → conditie is ALTIJD true

// CORRECTE CODE:
if (setup.currentProvider === 'cito-oud' || setup.currentProvider === 'cito-nieuw') { ... }
```
**Impact:** Werkt toevallig correct (alle providers behalve 'geen' en concurrenten worden als cito behandeld), maar is fragiel en kan breken bij nieuwe providers.

**JIJ-prijsberekening hardcoded op 2 tests/leerling/jaar**
- `src/data/jij-license-tiers.ts` lijn ~76: `testsPerStudent: number = 2`
- Werkelijkheid: scholen doen 1-4+ tests per jaar
- Dit beïnvloedt de schijnvoordeel-detectie EN de vergelijking
- **Impact:** JIJ-kosten kunnen 50-200% afwijken van werkelijkheid

**SAQI provider in code maar geen prijsdata**
- `PROVIDERS = ['cito', 'dia', 'jij', 'saqi']` in price-comparison.ts
- Geen SAQI-prijzen in `default-prices.ts`
- Levert `null` op in vergelijking — niet fout maar verwarrend

#### SHOULD FIX

**Negatieve prijzen niet gevalideerd** — Geen enkele engine checkt of `amountPerStudent >= 0`. Data-entry fouten worden doorberekend.

**Break-even kan onrealistisch hoog zijn** — `switchingCosts = 100.000, annualValue = 10` → break-even = 120.000 maanden. Geen upper bound.

**Schijnvoordeel-drempels willekeurig en niet configureerbaar:**
- DIA pakket-illusie: 10% tolerance (waarom?)
- Volume-illusie: €1/leerling threshold (waarom?)
- Appels-peren: €0,50/leerling threshold (waarom?)
- Differentiator-matching op eerste woord van string (fragiel)

**Tijdwinst niet schoolgrootte-afhankelijk** — Standaard 48 uur/jaar ongeacht of school 100 of 1500 leerlingen heeft.

#### COULD FIX

- Floating-point afrondingsfouten bij per-module rounding × N modules
- Upsell-engine: 'yellow' signaal is dubbelzinnig (duurder mét features ÓF goedkoper zonder features)
- Bundel-logica te strikt: alleen als ALLE modules geselecteerd

### 2.3 Test Coverage

| Engine | Tests | Oordeel | Ontbreekt |
|--------|-------|---------|-----------|
| price-comparison | 6 scenarios | Goed | 0 leerlingen, negatieve prijzen |
| current-vs-proposed | 7 scenarios | Goed | 0 leerlingen, 'overig' edge cases |
| migration | 24 scenarios | Uitstekend | Floating-point Year-3 |
| schijnvoordeel | Uitgebreid | Goed | JIJ test-count variatie |
| sensitivity | 6 scenarios | Matig | Extreme kortingen, nul kosten |
| dia-packages | 10+ scenarios | Goed | Volume tiers in selector |
| hybrid-scenario | Beperkt | Matig | Onbekend |
| upsell | Beperkt | Matig | Yellow signal ambiguity |

---

## 3. Koppelingen — Werkt de dataflow?

### 3.1 Dataflow Overzicht

```
Wizard/Intake → useSchoolProfileStore → updateSchoolData() → Supabase
                                                                  ↓
SchoolLayout ← useSchool() (React Query) ← getSchoolBySlug() ← Supabase
     ↓
  hydrate stores (useSchoolProfileStore + usePriceComparisonStore)
     ↓
  Engines (calculateComparison, calculateMigration, etc.)
     ↓
  UI Components (PriceComparisonPage, WaardeTab, etc.)
```

### 3.2 Bevindingen

#### MUST FIX

**appliedOverrides niet geladen uit database**
- `db/operations.ts` → `mapSchoolRow()` hardcodeert `appliedOverrides: []`
- Comment zegt "Overrides now live in school_prices table"
- Maar `school_prices` wordt NIET gelezen in `mapSchoolRow()`
- **Impact:** Alle custom prijzen (deals, afspraken) verdwijnen na page refresh
- **Fix:** Query `school_prices` in `getSchoolBySlug()` en map naar appliedOverrides

**Scenario A engines niet store-backed**
- `calculateCurrentVsProposed()` en `calculateMigration()` worden inline berekend in pagina-componenten
- Wijzigingen aan schoolprofiel triggeren niet automatisch herberekening
- **Impact:** Stale resultaten als user wizard data wijzigt en dan comparison bekijkt

#### SHOULD FIX

**Hydrate timing fragiel**
- `SchoolLayout` dependency array `[school?.id, school?.updatedAt]`
- Multi-user scenario: wijziging door andere user triggert geen rehydrate
- Race condition: browser back-button tijdens update → stale data

**CRM-lite data waterfall**
- Contacts, conversations, actions, systemEvents zijn 4 aparte React Query calls
- Geen batch loading → trage initiële load van schoolprofiel
- **Fix:** Batch query via Supabase of React Query parallel loading

**Schoolplan + Intake conflicten niet gedetecteerd**
- Intake zegt "500 leerlingen", schoolplan-analyse zegt "600 leerlingen"
- Geen merge strategy of conflict detection
- Beide schrijven naar hetzelfde schoolprofiel

#### COULD FIX

- Deprecated exports in `lib/ai-intake.ts` (IntakeExtractionSchema) — ongebruikt
- `separateLicense` in MODULE_CATALOG — getoond in UI maar nooit gebruikt in berekeningen
- `switchingCosts` in WaardeTab is lokale state — gaat verloren bij navigatie

---

## 4. AI-inzet — Wordt AI goed gebruikt?

### 4.1 Huidige AI-functies

| Functie | Model | Kosten/call | Oordeel |
|---------|-------|-------------|---------|
| Gespreksintake | claude-haiku-4-5 | ~€0,003 | Juiste keuze |
| Schoolplan samenvatting | claude-sonnet-4 | ~€0,01 | Overspecced — Haiku volstaat |
| Schoolplan kansen-matching | claude-sonnet-4 | ~€0,02 | Redelijk — kwaliteit rechtvaardigt het |
| Document prijsextractie | claude-haiku-4-5 | ~€0,001 | Juiste keuze |

**Geschatte maandkosten:** ~€0,17 bij normaal gebruik (20 intakes, 5 schoolplannen, 15 documenten). Zeer goedkoop.

### 4.2 Wat werkt goed

- **Doelgericht:** AI alleen waar het echt waarde toevoegt (structurering + analyse)
- **Prompt-kwaliteit:** Gedetailleerde instructies, JSON-voorbeelden, Nederlandse context
- **Zod schema-hardening:** Normaliseert AI-output (null → lege array, string → number)
- **Streaming:** Real-time feedback voor intake en schoolplan-analyse
- **Auth:** JWT via Supabase, server-side API keys

### 4.3 Bevindingen

#### MUST FIX

**Document-truncatie te agressief**
- Schoolplan: `text.slice(0, 30000)` — 30KB = ~15 pagina's. Schoolplannen zijn vaak 20-40 pagina's
- Prijsdocument: `text.slice(0, 10000)` — 10KB = ~5 pagina's. Prijslijsten staan vaak achteraan
- **Impact:** Kansen in latere pagina's worden gemist, prijzen niet geëxtraheerd
- **Fix:** Verhoog naar 50KB+ of implementeer chunking

#### SHOULD FIX

**Geen retry-logica** — API rate limit of netwerk-glitch → generieke foutmelding, geen herpoging

**Slechte error-context** — Server geeft "Er is een fout opgetreden" zonder te specificeren of het auth, rate limit, of format is

**Geen caching** — Zelfde schoolplan 2x uploaden = 2x AI-call en 2x kosten

**Tests zijn skeleton** — `ai-intake.test.ts` en `analyze-schoolplan.test.ts` bevatten alleen `test.todo()`

### 4.4 Ontbrekende AI-kansen

#### Hoge waarde, lage moeite
- **Smart defaults in wizard:** "Op basis van HAVO/VWO, waarschijnlijk modules: rekenwiskunde, nederlands, engels" → 50% wizard-tijd bespaard
- **Prijs-anomaliedetectie:** "€12/leerling voor DIA lijkt hoog — typisch €4-6" → voorkomt infofouten
- **DMU-rapportgeneratie:** Input: schoolprofiel + vergelijking → output: 2-pagina business case per DMU-rol

#### Gemiddelde waarde
- Gesprekssamenvattingen: chat-geschiedenis → 1 alinea + actiepunten
- Concurrent-monitoring: auto-fetch DIA/JIJ-webpagina's maandelijks

---

## 5. User Journey — Kloppen de logische stappen?

### 5.1 Verwachte vs werkelijke flow

**Verwachte flow account manager:**
```
School aanmaken → Profiel invullen → Vergelijken → Waarde onderbouwen → DMU tracken → Exporteren
```

**Werkelijke flow:**
```
School aanmaken → 5-staps wizard (locked) → Smart-routed comparison (1 van 3 views)
                                           → Tab navigatie (7 tabs, vaste volgorde)
                                           → Geen export mogelijkheid
```

### 5.2 Bevindingen

#### MUST FIX

**Geen export/delen van resultaten**
- Geen PDF-rapport, geen email sharing, geen clipboard-export, geen shareable link
- Account manager moet screenshottten
- **Dit is de #1 reden waarom de tool in de praktijk niet werkt**
- Dit is Phase 12 (DMU-Export & Offline) — moet prioriteit krijgen

#### SHOULD FIX

**Wizard heeft geen "Opslaan & Later Verder"**
- User zit vast als die halverwege twijfelt — geen exit zonder data te verliezen
- Geen "Draft opslaan" CTA

**Tab "Vergelijking" is 3 mogelijke views zonder indicatie**
- PriceComparisonPage, CurrentVsProposedPage, of MigrationPage
- Tab label geeft geen hint welke view getoond wordt
- Verwarrend voor account manager

**Tab-volgorde matcht niet met workflow**
- Huidige volgorde: Overzicht → Vergelijking → Producten → Contacten → Gesprekken → Waarde → Schoolplan
- Logische volgorde: Overzicht → Vergelijking → Waarde → Schoolplan → Contacten → Gesprekken → Producten

**Schoolplan-kansen niet direct toepasbaar**
- AI detecteert "school focust op adaptief toetsen → Cito Volgsysteem relevant"
- Geen "Voeg aan modules toe" knop → handmatig werk

#### COULD FIX

- DMU matrix in DashboardTab is read-only — engagement wijzigen vereist tab-switch
- Step 4 (huidige situatie) is optioneel maar essentieel voor goede vergelijking
- Geen breadcrumb-navigatie
- Mobile/tablet: tabs niet scrollbaar, wizard-formulieren te krap
- Smart CTA in ProfileHeader en DashboardTab zijn identiek (redundant)

---

## 6. Samenhang tussen Phases

### 6.1 Cross-phase conflicten

| Fase A | Fase B | Conflict |
|--------|--------|----------|
| Phase 9 (AI Intake) | Phase 14 (Schoolplan) | Beide kunnen conflicterende data leveren (leerlingaantallen, modules). Geen merge/conflict-detectie |
| Phase 11 (Waarde) | Phase 10 (Vergelijking) | Beide berekenen totaalkosten onafhankelijk. WaardeTab gebruikt lokale state voor switchingCosts — gaat verloren bij navigatie |
| Phase 15 (DMU Klantreis) | Phase 7 (School Intelligence) | `engagementStatus` (per contact) en `pipelineStatus` (per school) kunnen conflicteren. Geen sync-mechanisme |

### 6.2 Wat wél goed samenhangt

- **Wizard → Store → Engine flow:** Goed opgezet met Zustand persist + Supabase sync
- **Alle engines pure functions:** Geen onderlinge afhankelijkheden, testbaar
- **Schoolplan-kansen linken aan Cito-modules:** AI output matcht MODULE_CATALOG
- **DMU engagement tracking bouwt voort op contactpersonen (Phase 7)**

---

## 7. Geprioriteerde Verbeterpunten

### MUST — Direct oplossen (blokkerend voor productie)

| # | Wat | Waar | Impact |
|---|-----|------|--------|
| M1 | Fix `appliedOverrides` niet geladen uit DB | `db/operations.ts` mapSchoolRow() | Dataverlies — prijsoverschrijvingen verdwijnen |
| M2 | Fix JavaScript truthy-bug current-vs-proposed | `src/engine/current-vs-proposed.ts` lijn ~58 | Fragiele logica, breekt bij nieuwe providers |
| M3 | Verhoog document-truncatie limieten | `api/analyze-schoolplan.ts`, `api/extract-document.ts` | Gemiste kansen en prijzen |
| M4 | Maak JIJ tests/leerling configureerbaar | `src/data/jij-license-tiers.ts` | Verkeerde vergelijking (50-200% afwijking) |

### SHOULD — Binnenkort oplossen (kwaliteit & betrouwbaarheid)

| # | Wat | Waar | Impact |
|---|-----|------|--------|
| S1 | Scenario A engines in store (niet inline) | ComparisonTab, WaardeTab | Stale resultaten |
| S2 | Retry-logica voor AI-calls | Client-side fetch | Betere betrouwbaarheid |
| S3 | Betere error-context bij AI-fouten | api/*.ts | User weet niet wat er mis ging |
| S4 | Negatieve prijzen valideren in engines | Alle engine bestanden | Data-entry fouten doorberekend |
| S5 | AI-response caching (hash-based) | api/analyze-schoolplan.ts | Voorkom dubbele kosten |
| S6 | Batch loading CRM-data | SchoolLayout / React Query | Snellere pagina-load |
| S7 | Conflict-detectie intake vs schoolplan | Store/UI layer | Conflicterende data |
| S8 | Tab-volgorde aanpassen aan workflow | TabNavigation component | Intuïtievere navigatie |
| S9 | Schijnvoordeel-drempels documenteren en configureerbaar maken | src/engine/schijnvoordeel.ts | Transparantie |

### COULD — Op termijn (polish & extra waarde)

| # | Wat | Impact |
|---|-----|--------|
| C1 | Smart defaults wizard via AI | 50% wizard-tijd bespaard |
| C2 | DMU inline editing in DashboardTab | Minder tab-switching |
| C3 | "Opslaan & Later Verder" in wizard | Betere UX bij twijfel |
| C4 | Schoolplan-kans → "Voeg module toe" knop | Directe actie |
| C5 | Prijs-anomaliedetectie via AI | Voorkomt fouten |
| C6 | Mobile/tablet responsive pass | Bruikbaar op schoolbezoek |
| C7 | Breadcrumb-navigatie | Betere oriëntatie |
| C8 | Tijdwinst schoolgrootte-afhankelijk maken | Realistischer business case |
| C9 | SAQI volledig implementeren of verwijderen | Code-hygiëne |
| C10 | AI-tests schrijven (nu skeleton) | Testdekking |

---

## 8. Advies voor resterende Phases

### Phase 10.1-10.3 (Data Foundation, Engine Refactoring, UX Overhaul)

**Aanbeveling:** Los eerst M1-M4 op voordat je aan 10.1 begint. De huidige engine-bugs (JIJ-prijzen, truthy-bug) worden anders meegenomen in de refactoring.

Specifiek voor 10.1:
- SAQI: besluit nu of het erin blijft of niet — halverwege implementeren is verwarrend
- JIJ tests/leerling: maak dit configureerbaar VOORDAT provider-calculators gebouwd worden
- Schijnvoordeel-drempels: documenteer de rationale of maak configureerbaar

### Phase 12 (DMU-Export & Offline)

**Aanbeveling:** Dit is de meest impactvolle open phase. Zonder export is de tool praktisch onbruikbaar voor het doel (account manager neemt iets mee naar school). Overweeg dit VOOR 10.1-10.3 te doen.

Aanvulling: overweeg AI-gegenereerde rapporttekst per DMU-rol (coordinator, MT, finance). Dit is laaghangende vrucht met hoge waarde.

### Phase 13 (Architectuur Review & Go-Live)

**Aanbeveling:** De bevindingen uit dit rapport (M1-M4, S1-S9) moeten opgelost zijn VOOR Phase 13. Phase 13 is een "is alles production-ready?" check — als de huidige bugs er nog in zitten, faalt die check.

### Algemeen advies

1. **Prioriteer export (Phase 12) boven data-refactoring (10.1-10.3)** — zonder export is een perfecte engine nutteloos in de praktijk
2. **Los de 4 MUST-items op als tussenstap** — dit kan in 1-2 sessies en verhoogt de betrouwbaarheid significant
3. **De architectuur is gezond** — pure engines, gescheiden stores, doelgerichte AI. Geen fundamentele herstructurering nodig
4. **AI-kosten zijn verwaarloosbaar** (~€0,17/maand) — investeer gerust in meer AI-features (smart defaults, rapport-generatie)

---

*Dit rapport is input voor de resterende phases (10.1-10.3, 12, 13) en de prioritering van het development-backlog.*
