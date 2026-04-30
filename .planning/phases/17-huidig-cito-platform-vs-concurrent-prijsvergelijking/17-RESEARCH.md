# Phase 17: Huidig Cito-platform vs. Concurrent Prijsvergelijking - Research

**Researched:** 2026-03-25
**Domain:** Scenario routing, prijsdata uitbreiding, retentie-gericht AI-advies
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scenario-routing:**
- D-01: Nieuw Scenario C = "Huidig Cito vs. Concurrent". Schone scheiding naast Scenario A (concurrent → Cito, acquisitie) en Scenario B (migratie oud → nieuw platform)
- D-02: Wizard scenario-detectie bij `alles-oud-cito` biedt keuze: migratie (B) óf concurrentievergelijking (C) — niet automatisch naar migratie sturen
- D-03: ScenarioDetector in engine uitbreiden met `Scenario = 'A' | 'B' | 'C'`
- D-04: WizardScenario `alles-oud-cito` krijgt een vervolgkeuze in de wizard i.p.v. directe doorverwijzing naar migratie

**Prijsbron huidig Cito:**
- D-05: Publicatieprijzen van het huidige Cito-platform als basis voor de "Huidig Cito" kant
- D-06: School-specifieke prijzen (deals/kortingen) kunnen als override ingevoerd worden, net als bij Scenario A
- D-07: Engine moet onderscheid maken tussen oud-platform-prijzen (Scenario C) en nieuw-platform-prijzen (Scenario A) — twee prijssets voor Cito

**AI-advies perspectief:**
- D-08: Retentie-frame: "u betaalt nu X bij Cito, concurrent biedt Y — maar u verliest Z"
- D-09: Schoolplan-integratie in AI-advies: schoolplan-kansen worden meegenomen
- D-10: Migratiepad als onderdeel van advies: "als u bij Cito blijft, gaat u volgend schooljaar over naar het nieuwe platform"
- D-11: Drie lagen in het advies: (1) prijs, (2) wat u verliest bij overstap, (3) wat u erbij krijgt als u blijft
- D-12: Differentiators geframed als "behouden" i.p.v. "krijgen"

**Tabelweergave:**
- D-13: 2 kolommen: Huidig Cito vs. Concurrent — simpel en overzichtelijk
- D-14: Nieuw-platform informatie leeft in het AI-advies, niet in de tabel
- D-15: Schoolplan-koppeling geïntegreerd in AI-advies, geen aparte visuele sectie

### Claude's Discretion
- Visueel ontwerp van de keuze-UI bij `alles-oud-cito` detectie (migratie vs. concurrent)
- Exacte structuur van het retentie-advies (secties, volgorde, copy)
- Hoe schoolplan-kansen visueel worden verweven in het AI-advies output
- Data-structuur voor oud-platform-prijzen in de engine
- Hoe de "zachte deal" (migratiepad + schoolplan) visueel onderscheiden wordt van het harde prijsverhaal in het advies
- Loading/streaming UX voor het uitgebreidere AI-advies
- Responsive behavior op tablet

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 17 voegt Scenario C toe aan de bestaande wizard: een retentie-gerichte vergelijking voor Cito-klanten op het huidige platform die de markt verkennen. De kernuitdaging is drievoudig: (1) de wizard-flow splitsen bij `alles-oud-cito` zodat de gebruiker kiest tussen migratie (Scenario B) of concurrentievergelijking (Scenario C), (2) de engine voorzien van oud-platform-prijzen als aparte prijsset naast de bestaande nieuwe-platform-prijzen, en (3) de AI-advieslaag omschakelen van acquisitie-frame naar retentie-frame voor Scenario C.

De bestaande codebase biedt sterke fundaties: `CITO_MIGRATION_PRICES` in `src/data/cito-migration-prices.ts` bevat al de `oldPricePerStudent` waarden per module — deze data kan rechtstreeks worden hergebruikt als prijsset voor Scenario C. Het wizard-store heeft een `scenario` veld van type `WizardScenario`, dat wordt uitgebreid van de bestaande drie waarden naar vier. De `ScenarioDetector` component behoeft minimale aanpassing: alleen het `alles-oud-cito`-geval krijgt een keuze-UI in plaats van een doorverwijzing.

De meest kritische nieuwe component is de retentie-variant van het AI-advies. Het systeem-prompt in `api/ai-advice.ts` wordt aangevuld met een Scenario C variant, inclusief schoolplan-data als extra context en het migratiepad-argument ("de zachte deal"). De ComparisonTable ondersteunt al dynamische kolomweergave via `visibleProviders` — voor Scenario C worden alleen de kolommen "Huidig Cito" en de gekozen concurrent getoond.

**Primary recommendation:** Hergebruik `CITO_MIGRATION_PRICES.oldPricePerStudent` als de Scenario C prijsset, voeg `'alles-oud-cito-concurrent'` toe als vierde `WizardScenario`-waarde, en branch het AI-advies-endpoint op een `scenarioType: 'C'` vlag in het request payload.

---

## Project Constraints (from CLAUDE.md)

| Directive | Constraint voor planner |
|-----------|------------------------|
| Alle UI-tekst in het Nederlands | Labels, tooltips, berichten voor Scenario C in het Nederlands |
| Code comments en variabelenamen in het Engels | Interne namen zoals `retentionScenario`, niet `retentieScenario` |
| Wijzig NOOIT `src/data/default-prices.ts` zonder goedkeuring | Oud-platform-prijzen gaan NIET in default-prices, maar in bestaande `cito-migration-prices.ts` of een nieuw bestand |
| Nieuwe componenten: volg patroon wizard steps in `src/features/school-profile/components/` | Keuze-UI voor migratie vs. concurrent volgt hetzelfde patroon |
| State via Zustand + persist middleware | Geen nieuwe React Context of prop drilling |
| Tests verplicht bij engine-wijzigingen — `src/engine/__tests__/` | Scenario C routing in engine-level scenario-detection vraagt tests |
| Engine-functies zijn pure functions | `calculateComparison` uitbreidingen bevatten geen side effects |
| `usePriceComparisonStore` leest via `getState()`, NIET via hooks | Behoud dit patroon in alle nieuwe store-aanroepen |
| Na elke wijziging: committen EN pushen | Build moet slagen voor commit |

---

## Standard Stack

### Core (bestaand — hergebruiken)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 + TypeScript | bestaand | UI + type safety | Project standaard |
| Zustand + persist | bestaand | Wizard en comparison store state | Vastgelegd in CLAUDE.md |
| Vitest | bestaand | Unit tests bij engine-wijzigingen | Verplicht in CLAUDE.md |
| Tailwind CSS v4 | bestaand | Styling keuze-UI componenten | Project standaard |
| Anthropic SDK (`claude-sonnet-4-6`) | bestaand | AI-advies generatie via SSE streaming | Al in gebruik in `api/ai-advice.ts` |

### Geen nieuwe dependencies vereist
Phase 17 raakt uitsluitend bestaande files en patronen. Er zijn geen nieuwe npm-packages nodig.

---

## Architecture Patterns

### Huidige structuur relevante bestanden

```
src/
├── engine/
│   └── scenario-detection.ts        # Engine-level: Scenario 'A'|'B' uitbreiden naar 'A'|'B'|'C'
├── models/
│   └── school.ts                    # Scenario type wijzigen + SCENARIO_LABELS uitbreiden
├── data/
│   ├── cito-migration-prices.ts     # Bevat oldPricePerStudent — HERGEBRUIKEN voor Scenario C
│   └── providers/cito.ts            # Nieuw platform prijzen (ongewijzigd)
├── features/price-comparison/
│   ├── wizard/
│   │   ├── types.ts                 # WizardScenario uitbreiden
│   │   ├── scenario-detection.ts   # Wizard-level: 'alles-oud-cito' → keuze
│   │   ├── ScenarioDetector.tsx     # Keuze-UI toevoegen voor alles-oud-cito
│   │   ├── wizard-store.ts          # scenario veld type update
│   │   └── ComparisonWizard.tsx     # Wizard container: Scenario C flow
│   └── ComparisonTable.tsx          # 2-kolom weergave (werkt al via visibleProviders)
└── lib/
    └── ai-advice.ts                 # buildAdvicePayload uitbreiden voor Scenario C
api/
└── ai-advice.ts                     # SYSTEM_PROMPT branchen voor retentie-frame
```

### Pattern 1: WizardScenario type uitbreiding

**Wat:** Voeg `'alles-oud-cito-concurrent'` toe als vierde waarde aan `WizardScenario`.

**Waarom deze naam:** Onderscheidt het scenario van `'alles-oud-cito'` (= Scenario B, migratie) terwijl het de oud-cito context behoudt. De gebruiker heeft expliciet gekozen voor concurrent-vergelijking in plaats van migratie.

**Huidig type (in `src/features/price-comparison/wizard/types.ts`):**
```typescript
// HUIDIG
export type WizardScenario = 'deels-concurrent' | 'alles-oud-cito' | 'alles-nieuw-cito';

// NA UITBREIDING
export type WizardScenario = 'deels-concurrent' | 'alles-oud-cito' | 'alles-oud-cito-concurrent' | 'alles-nieuw-cito';
```

**Wanneer:** `alles-oud-cito` is de gedetecteerde situatie EN de gebruiker kiest "Vergelijk met concurrent" in de keuze-UI.

### Pattern 2: Scenario type uitbreiding in school.ts

**Huidig (`src/models/school.ts` lijn 37):**
```typescript
export type Scenario = 'A' | 'B';
```

**Na uitbreiding (D-03):**
```typescript
export type Scenario = 'A' | 'B' | 'C';
```

**Impact:** `SCENARIO_LABELS` uitbreiden met Scenario C label. `useSchoolProfileStore.scenario` accepteert nu ook 'C'. Scenario-routing in `src/engine/scenario-detection.ts` krijgt Scenario C als recommended waarde wanneer `alles-oud-cito-concurrent` gedetecteerd wordt.

### Pattern 3: Oud-platform prijsdata voor Scenario C

**Sleutelbevinding:** `CITO_MIGRATION_PRICES` in `src/data/cito-migration-prices.ts` bevat al `oldPricePerStudent` per module. Dit is de prijsset voor Scenario C — de huidige Cito-platform prijzen.

**Beschikbare data (HIGH confidence):**
| Module | oldPricePerStudent | Geverifieerd |
|--------|-------------------|-|
| rekenwiskunde | €7.07 | 2026-03-23 |
| nederlands | €7.07 | 2026-03-23 |
| engels | €7.07 | 2026-03-23 |
| taalverzorging | €1.60 | 2026-03-23 |
| sociaal-emotioneel | €4.15 | 2026-03-23 |
| cognitieve-capaciteiten | €6.50 | 2026-03-23 |

**Aanpak:** Exporteer een helper `getOldPlatformPricePerStudent(moduleId: string): number | null` uit `cito-migration-prices.ts`. De engine roept deze aan voor Scenario C in plaats van de reguliere Cito publicatieprijzen.

**Alternatief (Claude's discretion):** Een nieuw bestand `src/data/providers/cito-oud.ts` met dezelfde structuur als `cito.ts` maar voor het oude platform. Dit geeft betere scheiding en maakt de data-structuur voor oud-platform-prijzen explicieter (D-07). Aanbeveling: gebruik dit patroon voor maximale consistentie met bestaande provider-architectuur.

### Pattern 4: ScenarioDetector keuze-UI bij alles-oud-cito

**Huidig gedrag (`ScenarioDetector.tsx`):**
- `alles-oud-cito` → informatieve banner "ga naar migratie-pagina"
- Geen actieknoppen in deze branch

**Nieuw gedrag (D-02/D-04):**
- `alles-oud-cito` → keuze-UI met twee knoppen:
  - "Migratie bekijken" → navigeert naar migratie-pagina (bestaand gedrag)
  - "Vergelijk met concurrent" → zet `scenario` op `'alles-oud-cito-concurrent'`, laat wizard doorgaan

**Props uitbreiding nodig:**
```typescript
// HUIDIG
interface ScenarioDetectorProps {
  scenario: WizardScenario;
  onProceed?: () => void;
}

// NA UITBREIDING
interface ScenarioDetectorProps {
  scenario: WizardScenario;
  onProceed?: () => void;
  onChooseCompetitor?: () => void;  // nieuw: kiest Scenario C
  onChooseMigration?: () => void;   // nieuw: navigeert naar migratie (optioneel, standaard = huidige routering)
}
```

### Pattern 5: AI-advies retentie-frame (Scenario C)

**Aanpak:** Branch de `SYSTEM_PROMPT` en het `userMessage` in `api/ai-advice.ts` op een `scenarioType` veld in het request body.

**Request uitbreiding:**
```typescript
interface AdviceRequest {
  // ... bestaande velden ...
  scenarioType?: 'A' | 'C';   // nieuw — default = 'A' voor backward compat
  schoolplanOpportunities?: Array<{
    moduleId: string;
    kans: string;
  }>;  // nieuw — voor schoolplan-integratie in Scenario C
  migrationContext?: {
    platformUpgradeNextYear: boolean;
    newPlatformBenefits: string[];
  };  // nieuw — voor de "zachte deal" in Scenario C
}
```

**Prompt-structuur Scenario C (D-08 t/m D-12):**
De retentie-prompt bevat drie secties:
1. **Prijs**: "School betaalt nu X bij Cito (huidig platform), concurrent biedt Y"
2. **Verlies bij overstap**: Differentiators geframed als "wat de school verliest" — retentie-taal
3. **Zachte deal**: Migratiepad + schoolplan-aansluiting — "als u blijft, upgrade volgend jaar gratis"

**Schoolplan-data bron:** `SchoolplanTab` bevat al AI-analyse met `opportunity_annotations` in Supabase. De wizard-store kan deze data ophalen via `useSchoolplanAnalysis` hook (Phase 14 patroon) en meesturen in het payload.

### Pattern 6: ComparisonTable 2-kolom weergave (Scenario C)

**Goed nieuws:** De `ComparisonTable` ondersteunt al dynamische kolommen via `visibleProviders` uit de store. Voor Scenario C zet de wizard na `applyToTable()` `visibleProviders = ['cito', <gekozen concurrent>]`.

**Kolomlabels aanpassen:** Voor Scenario C moet de "cito" kolom het label "Huidig Cito" krijgen in plaats van "Cito". Dit is een label-override op basis van het actieve scenario.

**Aanpak:** Voeg optionele `providerLabelOverrides?: Partial<Record<ProviderKey, string>>` toe aan de tabel-props, of lees het huidige scenario uit de store en pas labels aan in `ComparisonTable.tsx`.

### Anti-Patterns to Avoid

- **Prijsdata toevoegen aan `src/data/default-prices.ts`** — dit bestand is geblokkeerd door CLAUDE.md. Oud-platform-prijzen gaan in `cito-migration-prices.ts` of een nieuw `cito-oud.ts` provider-bestand.
- **Automatisch doorsturen naar Scenario B** bij `alles-oud-cito` — D-02 verbiedt dit. Altijd keuze bieden.
- **Schoolplan-data ophalen in de API-laag** — schoolplan-kansen worden meegegeven in het request payload vanuit de frontend, niet server-side opgehaald.
- **Een nieuw type `ComparisonResult` voor Scenario C** — gebruik de bestaande `ComparisonResult` structuur. De tabel-kolommen worden al dynamisch bepaald door `visibleProviders`.
- **Wizard-state persistent maken voor `streamingText` of `aiAdvice`** — Phase 16 beslissing: `partialize` in wizard-store bewaart alleen essentiële state, niet streaming/advies-state.

---

## Don't Hand-Roll

| Probleem | Niet zelf bouwen | Gebruik bestaand | Waarom |
|----------|-----------------|-----------------|--------|
| Oud-platform prijzen | Aparte lookup-tabel | `CITO_MIGRATION_PRICES.oldPricePerStudent` | Data bestaat al, geverifieerd 2026-03-23 |
| 2-kolom tabelweergave | Custom tabel-component | `ComparisonTable` + `visibleProviders` | Dynamische kolommen zijn al ingebouwd |
| SSE streaming AI | Custom streaming | Bestaand patroon in `api/ai-advice.ts` | `messages.stream()` + `ReadableStream` werkt al |
| Schoolplan-kansen ophalen | Server-side lookup | Frontend stuurt `opportunity_annotations` mee als payload | Patroon consistent met bestaand `schoolProfile` in payload |
| Scenario-routing | Nieuwe router-logica | Uitbreiding `useSchoolProfileStore.scenario` + bestaande route-guards | App.tsx routeert al op `scenario` waarde |

---

## Common Pitfalls

### Pitfall 1: Scenario C routering in App.tsx vergeten

**Wat gaat er mis:** `scenario === 'C'` wordt niet herkend in de bestaande route-switching logica in `App.tsx`, waardoor de school terechtkomt op de verkeerde view.

**Waarom het gebeurt:** `App.tsx` switcht op `scenario` maar kent alleen 'A' en 'B'. Scenario C moet naar de vergelijkingsview (niet migratie).

**Hoe te voorkomen:** Bij het uitbreiden van `Scenario` naar `'A' | 'B' | 'C'`, zoek alle plaatsen op die switchen op `scenario` en voeg de 'C' case toe. Scenario C moet naar de comparison/current-vs-proposed view — niet migratie.

**Warning signs:** TypeScript toont geen error omdat union type niet exhaustive gecheckt wordt tenzij een switch/exhaustive check aanwezig is.

### Pitfall 2: `toPriceProvider()` retourneert 'cito' voor zowel oud als nieuw platform

**Wat gaat er mis:** `toPriceProvider('cito-oud')` en `toPriceProvider('cito-nieuw')` returnen beiden `'cito'`. Dit is correct voor normale vergelijking, maar Scenario C heeft een aparte prijsset nodig voor 'cito-oud'.

**Waarom het gebeurt:** De helper is geschreven vóór Scenario C bestond.

**Hoe te voorkomen:** De engine-laag voor Scenario C mag `toPriceProvider()` niet gebruiken om de prijsset te selecteren. Gebruik in plaats daarvan de `oldPricePerStudent` direct op basis van `moduleSetups.currentProvider === 'cito-oud'`.

### Pitfall 3: Wizard-store `scenario` veld conflicteert met school-store `scenario`

**Wat gaat er mis:** Er zijn twee `scenario`-velden in de app: `useWizardStore.scenario` (van type `WizardScenario`) en `useSchoolProfileStore.scenario` (van type `Scenario | null`). Beide uitbreiden naar Scenario C geeft naamgevingsverwarring.

**Hoe te voorkomen:** Onderscheid de twee lagen consequent:
- `WizardScenario` = wizard-level detectie (4 waarden incl. `alles-oud-cito-concurrent`)
- `Scenario` in school-store = engine-level routing ('A' | 'B' | 'C')

De wizard schrijft naar de school-store nadat de gebruiker de keuze maakt. Scenario C in de school-store activeert de retentie-flow.

### Pitfall 4: SchoolplanTab data niet beschikbaar bij AI-advies generatie

**Wat gaat er mis:** Schoolplan-kansen zijn opgeslagen in Supabase als `opportunity_annotations` op de school-record. Als de school geen schoolplan heeft geüpload, of als de data niet opgehaald is op het moment dat het AI-advies wordt gegenereerd, is de `schoolplanOpportunities` array leeg — wat tot een minder rijke advies leidt.

**Hoe te voorkomen:** Schoolplan-data is optioneel voor Scenario C. Het AI-advies moet gracieus omgaan met een lege of ontbrekende `schoolplanOpportunities` array. Documenteer dit in de prompt: "Als er geen schoolplan-kansen zijn, sla de schoolplan-sectie over."

### Pitfall 5: leer-werkhouding ontbreekt in `CITO_MIGRATION_PRICES`

**Wat gaat er mis:** `CITO_MIGRATION_PRICES` bevat geen entry voor `leer-werkhouding`. Als Scenario C deze module vergelijkt, is er geen oud-platform-prijs beschikbaar.

**Waarom:** `leer-werkhouding` staat wel in `CITO_DEFAULT_PRICES` (nieuwe platform prijs: €3.00) maar ontbreekt als afzonderlijke record in migratie-prijzen.

**Hoe te voorkomen:** Bij het implementeren van de oud-platform-prijsset, controleer alle module-IDs in `MODULE_CATALOG` en vul ontbrekende `oldPricePerStudent` waarden in. Fallback: gebruik `null` en toon "prijs niet beschikbaar" voor ontbrekende modules.

### Pitfall 6: ComparisonTable kolomlabel toont "Cito" i.p.v. "Huidig Cito"

**Wat gaat er mis:** De tabel toont standaard de `PROVIDER_LABELS` voor de geselecteerde providers. Voor Scenario C moet de Cito-kolom "Huidig Cito (platform)" tonen, niet gewoon "Cito".

**Hoe te voorkomen:** Haal het actieve `scenario` uit de comparison-store of school-store in `ComparisonTable.tsx` en pas het label toe op basis van het scenario. Alternatief: voeg een `headerOverrides` prop toe aan de tabel.

---

## Code Examples

### Scenario C detectie in wizard-level scenario-detection (uitbreiding)

```typescript
// src/features/price-comparison/wizard/scenario-detection.ts
// NA UITBREIDING: detectScenario() returnt WizardScenario zonder 'alles-oud-cito-concurrent'
// (die waarde wordt pas gezet door de gebruikerskeuze in ScenarioDetector)
// Geen wijziging nodig in detectScenario() zelf — de keuze-UI in ScenarioDetector
// roept setScenario('alles-oud-cito-concurrent') aan na gebruikerskeuze.
```

### Oud-platform prijs helper

```typescript
// Toevoeging aan src/data/cito-migration-prices.ts of nieuw cito-oud.ts
export function getOldPlatformPrice(moduleId: string): number | null {
  const record = CITO_MIGRATION_PRICES.find((r) => r.moduleId === moduleId);
  return record?.oldPricePerStudent ?? null;
}
```

### Retentie-advies payload uitbreiding

```typescript
// src/lib/ai-advice.ts — uitbreiding buildAdvicePayload voor Scenario C
function buildRetentionAdvicePayload(
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  schoolplanOpportunities?: Array<{ moduleId: string; kans: string }>,
) {
  const base = buildAdvicePayload(result, levels, studentCounts, selectedModules, moduleSetups);
  return {
    ...base,
    scenarioType: 'C' as const,
    schoolplanOpportunities: schoolplanOpportunities ?? [],
    migrationContext: {
      platformUpgradeNextYear: true,
      newPlatformBenefits: ['nieuw platform inbegrepen', 'continuïteit gewaarborgd'],
    },
  };
}
```

### WizardScenario uitbreiding (types.ts)

```typescript
// src/features/price-comparison/wizard/types.ts
export type WizardScenario =
  | 'deels-concurrent'
  | 'alles-oud-cito'
  | 'alles-oud-cito-concurrent'   // nieuw: Scenario C — gebruiker koos voor concurrent-vergelijking
  | 'alles-nieuw-cito';
```

---

## State of the Art

| Oud gedrag | Nieuw gedrag (Phase 17) | Impact |
|------------|------------------------|--------|
| `alles-oud-cito` → banner met doorverwijzing naar migratie | `alles-oud-cito` → keuze-UI: migratie OF concurrentie | Scenario C toegankelijk |
| `Scenario = 'A' \| 'B'` | `Scenario = 'A' \| 'B' \| 'C'` | Engine herkent retentie-scenario |
| AI-advies altijd acquisitie-frame | AI-advies brancht op `scenarioType` voor retentie-frame | Correct gefraamd advies per situatie |
| Cito-kolom in tabel altijd "Cito" (nieuwe platform prijzen) | Scenario C: kolom "Huidig Cito" met oud-platform-prijzen | Eerlijke vergelijking voor bestaande klanten |
| Schoolplan-data alleen in SchoolplanTab | Schoolplan-kansen optioneel meegestuurd in AI-advies payload | Rijker retentie-advies |

---

## Open Questions

1. **`leer-werkhouding` oud-platform-prijs ontbreekt**
   - Wat we weten: `CITO_MIGRATION_PRICES` heeft geen entry voor dit moduleId
   - Wat onduidelijk is: wat is de werkelijke prijs van leer-werkhouding op het huidige platform?
   - Aanbeveling: implementeer met `null` fallback en markeer als "prijs op aanvraag" in de UI. De accountmanager kan een override invoeren.

2. **Schoolplan-kansen ophalen: timing en beschikbaarheid**
   - Wat we weten: `opportunity_annotations` leeft in Supabase op de school-record. `useSchoolplanAnalysis` hook haalt dit op.
   - Wat onduidelijk is: is deze data beschikbaar in de wizard-context zonder extra network-call toe te voegen aan het wizard-flow?
   - Aanbeveling: lees `schoolplanOpportunities` vanuit de reeds-geladen school-record in de wizard. Als niet beschikbaar: skip schoolplan-sectie in het advies (graceful degradation).

3. **Migratie-knop navigatie vanuit ScenarioDetector**
   - Wat we weten: de bestaande banner toont tekst "ga naar migratie-pagina" zonder navigatie-logica
   - Wat onduidelijk is: welk navigatie-mechanisme bestaat er? App.tsx gebruikt `useState<View>` — er is geen `useNavigate`
   - Aanbeveling: de "Migratie bekijken" knop in de keuze-UI roept een `onChooseMigration` callback aan die de parent (ComparisonWizard) doorgeeft aan App.tsx via de bestaande view-state setter.

---

## Environment Availability

Step 2.6: SKIPPED (geen externe dependencies — Phase 17 raakt alleen bestaande code en bestaande API-endpoints. Alle services — Anthropic, Supabase — zijn al operationeel vanuit Phase 16).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (bestaand) |
| Config file | `vite.config.ts` (vitest config inlined) |
| Quick run command | `npx vitest run src/engine/__tests__/scenario-detection.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req | Gedrag | Test Type | Automated Command | Bestand |
|-----|--------|-----------|-------------------|---------|
| SC-1 | Wizard herkent Scenario C als aparte flow | unit | `npx vitest run src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts` | ✅ uitbreiden |
| SC-2 | Vergelijking gebruikt oud-platform-prijzen, niet nieuwe | unit | `npx vitest run src/engine/__tests__/scenario-detection.test.ts` | ✅ uitbreiden |
| SC-3 | AI-advies retentie-frame voor Scenario C | unit (payload check) | `npx vitest run src/lib/__tests__/ai-advice.test.ts` | ❌ Wave 0 |
| SC-4 | Tabel toont Huidig Cito vs. concurrent (2 kolommen) | unit | `npx vitest run src/features/price-comparison/__tests__/ComparisonTable.test.tsx` | ✅ uitbreiden |
| SC-5 | ScenarioDetector routeert correct naar Scenario C | unit | `npx vitest run src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts` | ✅ uitbreiden |

### Sampling Rate
- **Per task commit:** `npx vitest run src/engine/__tests__/scenario-detection.test.ts src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green voor `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/ai-advice.test.ts` — ontbreekt, voor SC-3 retentie-payload test (nieuwe file nodig)
- [ ] Uitbreiden `src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts` — cases voor `alles-oud-cito-concurrent`
- [ ] Uitbreiden `src/engine/__tests__/scenario-detection.test.ts` — cases voor Scenario C routing

---

## Sources

### Primary (HIGH confidence)
- Directe code-inspectie van alle gerefereerde bestanden in CONTEXT.md canonical_refs
- `src/data/cito-migration-prices.ts` — bevestigt `oldPricePerStudent` data beschikbaar per module
- `src/features/price-comparison/wizard/types.ts` — WizardScenario type structuur
- `src/models/school.ts` — Scenario type en CurrentProvider types
- `api/ai-advice.ts` — AI endpoint structuur, SYSTEM_PROMPT, streaming patroon
- `src/features/price-comparison/wizard/ScenarioDetector.tsx` — huidige keuze-UI structuur
- `src/features/price-comparison/wizard/wizard-store.ts` — state structuur en partialize patroon

### Secondary (MEDIUM confidence)
- `.planning/phases/16-ai-wizard-verbetering-prijsvergelijking-harmonisatie/16-CONTEXT.md` — Phase 16 beslissingen die fase 17 fundament vormen
- `.planning/STATE.md` — accumulated decisions, patronen en gotchas

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — alles is bestaand, geen nieuwe dependencies
- Architecture: HIGH — alle integratiepunten zijn direct geïnspecteerd en geverifieerd
- Pitfalls: HIGH — afgeleid uit directe code-inspectie van grensvlakken
- AI prompt structuur: MEDIUM — prompt-ontwerp is Claude's discretion, maar aanpak is bewezen via bestaand patroon

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (prijsdata stabiel, stack stabiel)
