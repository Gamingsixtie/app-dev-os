# Testfase: AI Intake, Wizard & Calculator integratie

## Context

Er zijn grote wijzigingen gedaan aan de AI intake, wizard en calculators:

1. **JIJ! calculator** herschreven — licentie + Magister wordt nu 1x berekend en verdeeld over modules
2. **AI intake system prompt** uitgebreid met ALLE productvariaties (DIA aliassen, JIJ tiers, Cito bundels, SAQI)
3. **Intake enrichment** — DIA Nederlands/Engels default nu naar pakketprijs (€5,84) i.p.v. losse prijs (€3,36)
4. **Schema** — `leer-werkhouding`, `frans`, `duits`, `spaans` toegevoegd aan MODULE_IDS
5. **Differentiators** — Magister gratis/betaald verschil toegevoegd
6. **WizardStep4** — provider-specifieke context hints bij DIA en JIJ

## Wat moet je doen

### Stap 1: Fix pre-bestaande testfailures

Er zijn 39 falende tests, GEEN daarvan door bovenstaande wijzigingen. Fix ze:

**Groep A: Cito prijzen gewijzigd maar tests niet bijgewerkt (21 failures)**
- `src/data/providers/__tests__/migration-parity.test.ts` — verwacht oude Cito-prijzen (7.82), maar die zijn geüpdatet op remote. Update verwachte waarden naar actuele waarden uit `src/data/providers/cito.ts`.
- `src/engine/__tests__/calculator-parity.test.ts` — snapshots/verwachte waarden verouderd. Update met `npx vitest run --update`.
- `src/engine/__tests__/calculators.test.ts` (CitoCalculator tests) — verwacht 7.82 maar prijs is nu anders. Lees `CITO_CONFIG` en update.
- `src/engine/__tests__/cito-bundles.test.ts` — bundel tests verwachten oude structuur/prijzen.
- `src/models/__tests__/price-deviation.test.ts` — hardcoded prijzen kloppen niet meer.

**Groep B: UI component mocking issue (18 failures)**
- `src/features/price-comparison/__tests__/ComparisonTable.test.tsx` (9 tests)
- `src/features/price-comparison/__tests__/ModuleDetailPanel.test.tsx` (9 tests)
- Fout: `Cannot read properties of undefined (reading 'filter')` op `visibleProviders`
- De Zustand store mock mist `visibleProviders`. Voeg het toe aan de mock.

### Stap 2: Schrijf nieuwe tests voor de intake wijzigingen

Bestand: `src/lib/__tests__/ai-intake-enrichment.test.ts` (nieuw)

Test `enrichModuleSetupsWithDefaultPrices()`:

```
1. DIA Nederlands zonder prijs → verrijkt naar €5,84 (Pakket NE), NIET €3,36
2. DIA Engels zonder prijs → verrijkt naar €5,84 (Pakket EN)
3. DIA Rekenwiskunde zonder prijs → verrijkt naar €3,36 (geen pakket default)
4. DIA Taalverzorging zonder prijs → verrijkt naar €3,36 (Diaspel los)
5. DIA Cognitieve capaciteiten zonder prijs → verrijkt naar €9,75 (NSCCT)
6. JIJ! module zonder prijs → verrijkt naar €9,34 (default)
7. JIJ! sociaal-emotioneel zonder prijs → verrijkt naar €0 (basislicentie)
8. SAQI sociaal-emotioneel zonder prijs → verrijkt naar €3,50
9. Prijs uit intake (niet null) → wordt NIET overschreven
10. DIA Nederlands met priceContext → bevat "Pakket NE (lezen + woordenschat)"
11. Onbekende provider → geen enrichment, priceSource = 'intake'
```

### Stap 3: Schrijf nieuwe tests voor schema wijzigingen

Bestand: `src/features/school-profile/schemas/__tests__/intake-extraction.test.ts` (bestaand, uitbreiden)

```
1. Schema accepteert moduleId 'leer-werkhouding'
2. Schema accepteert moduleId 'frans', 'duits', 'spaans'
3. Schema accepteert provider 'saqi' (al in PROVIDERS? check dit)
4. Schema weigert onbekende moduleId (bijv. 'biologie')
```

### Stap 4: Schrijf JIJ calculator multi-module edge case tests

Bestand: `src/engine/__tests__/calculators.test.ts` (bestaand, uitbreiden)

```
1. JIJ! 1 module × 100 lln → Tier 4 (200 afnames, min 0-165... wacht, 200 > 165 dus Tier 3!)
   Verifieer: 100*2*1 = 200 afnames → Tier 3 (166-2500)
2. JIJ! 1 module × 80 lln → Tier 4 (160 afnames, 0-165)
3. JIJ! 5 modules × 500 lln → Tier 1 (5000 afnames, 4001+)
   Verifieer: licentie €5.330/500/5 + 2*€2,40 + €500/500/5 = €2,53 + €4,80 + €0,20 = €7,53/module
4. JIJ! met sociaal-emotioneel (€0) → telt NIET mee als paid module
   Bijv: [rekenwiskunde, sociaal-emotioneel] → paidModuleCount = 1, niet 2
5. JIJ! met override prijs → override neemt over, geen licentieberekening
6. JIJ! alle 7 modules (RE, NL, EN, FR, DE, ES, SEF) → SEF gratis, 6 paid
   800 lln × 2 × 6 = 9600 afnames → Tier 1
```

### Stap 5: Schrijf DIA calculator variatie tests

Bestand: `src/engine/__tests__/calculators.test.ts` (bestaand, uitbreiden)

```
1. DIA Cognitieve capaciteiten → €9,75/lln (niet €3,36)
2. DIA met override prijs → override neemt over
3. DIA module die niet bestaat → null
```

### Stap 6: Wizard hints integratie test (optioneel)

Als er al component tests zijn voor WizardStep4, voeg toe:
```
1. Selecteer provider 'dia' bij module 'nederlands' → toont hint met "Pakket NE"
2. Selecteer provider 'jij' → toont hint met "licentie + toetsprijs-model"
3. Selecteer provider 'geen' → geen hint zichtbaar
4. Selecteer provider 'cito-oud' → geen hint zichtbaar
```

### Stap 7: Differentiator data test

Bestand: `src/data/__tests__/differentiators.test.ts` (nieuw)

```
1. Elke module heeft een entry in MODULE_DIFFERENTIATORS
2. DIA differentiators voor rekenwiskunde/nederlands/engels bevatten "Magister" of "gratis"
3. JIJ differentiators voor rekenwiskunde/nederlands/engels bevatten "kost extra" of "€195-€500"
4. Geen lege arrays voor modules waar een provider actief is
```

### Stap 8: Run en verifieer

```bash
npx vitest run                    # Alle tests moeten groen zijn
npm run build                     # Moet slagen (ignore offline-queue.ts en vite-plugin-pwa errors — pre-existing)
```

Commit en push na elke stap die groen is.

## Kritieke bestanden

| Bestand | Test-actie |
|---------|-----------|
| `src/engine/calculators/jij-calculator.ts` | Multi-module tier, Magister verdeling, paid module filtering |
| `src/engine/calculators/dia-calculator.ts` | NSCCT prijs, override, null returns |
| `src/lib/ai-intake.ts` | enrichModuleSetupsWithDefaultPrices met DIA pakketprijzen |
| `src/features/school-profile/schemas/intake-extraction.schema.ts` | Nieuwe moduleIds, provider 'saqi' |
| `src/data/differentiators.ts` | Magister gratis/betaald per module |
| `src/features/school-profile/components/WizardStep4.tsx` | Provider hints rendering |
| `api/ai-intake.ts` | System prompt (niet unit-testbaar, maar schema output testen) |

## Belangrijk

- Lees ALTIJD eerst het bestaande testbestand voordat je tests toevoegt
- Gebruik exact dezelfde import-patronen als bestaande tests
- Bereken verwachte waarden met de hand voordat je ze in de test zet — kopieer niet blind
- JIJ! prijzen: `Math.round((licentie/lln/modules + toets + magister/lln/modules) * 100) / 100`
- De 18 ComparisonTable/ModuleDetailPanel failures komen door een ontbrekende `visibleProviders` in de store mock — fix de mock, niet de component
