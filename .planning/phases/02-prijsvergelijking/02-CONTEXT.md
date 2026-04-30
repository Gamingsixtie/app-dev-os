# Phase 2: Prijsvergelijking - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Modulaire Cito vs. DIA vs. JIJ vergelijking met staafdiagram, transparante bronvermelding en onderscheidend vermogen. De gebruiker ziet per geselecteerde module de kosten per leerling en totaalkosten per aanbieder naast elkaar, kan berekeningsdetails uitklappen, prijzen handmatig invoeren/overschrijven, en ziet wat Cito onderscheidt van de concurrentie. Externe modus (objectief, publicatieprijzen) wordt in deze fase ondersteund.

</domain>

<decisions>
## Implementation Decisions

### Vergelijkingsweergave
- Vergelijkingstabel: rijen = modules, kolommen = Cito / DIA / JIJ
- Beide prijzen standaard zichtbaar: prijs per leerling en totaalkosten (geen uitklapbaar — Cialdini anchoring: het totaalverschil is overtuigender)
- Uitklapbare detailrij per module toont: berekeningsformule, onderscheidend vermogen, handmatig overschrijven
- Prijsbron/status (PriceBadge) zit al in de tabelcel, niet in de detailrij
- Totaalrij: vetgedrukt + neutraal accent (geen groen/rood kleuring voor goedkoper/duurder)
- Verschil-indicator neutraal geformuleerd: "€X verschil" — niet "€X duurder"
- Onder de tabel een doorverwijzing naar de business case (Scenario B): "Bekijk de totale waarde inclusief tijdsbesparing →"
- Ontbrekende modules: expliciete 'Niet beschikbaar' badge in oranje (versterkt Cito's breedte van aanbod)

### Staafdiagram
- Gegroepeerd per module: per module een groep van 3 staven (Cito, DIA, JIJ) naast elkaar
- Positie: boven de vergelijkingstabel (visuele samenvatting als eerste indruk)
- Interactie: hover-tooltips met exact bedrag en prijs per leerling
- Kleuren: Cito in huisstijl-blauw (#003082), DIA en JIJ in neutrale grijstinten — Cito springt eruit
- Recharts 3 als diagrambibliotheek (al in de stack)

### Onderscheidend vermogen
- Weergave: uitklapbaar in de detailrij van de vergelijkingstabel
- Framing: transparant maar geframed — Cito-voordelen bovenaan en prominenter, concurrent-voordelen eerlijk maar lager geplaatst
- Tone: eerlijk. Als de concurrent ergens beter is, wordt dat benoemd. De geloofwaardigheid van de tool hangt af van transparantie
- Databron Phase 2: hardcoded differentiators per module als default data (ModuleDefinition.differentiator bestaat al) + gebruiker kan aanpassen/toevoegen
- Per aanbieder: "✔ [Aanbieder] biedt extra: [lijst]" of "⚠ [Aanbieder] biedt deze module niet aan"

### Handmatige prijsinvoer
- Locatie: inline in de uitklapbare detailrij, per aanbieder een bewerkbaar prijsveld
- Past bij EditableAssumption-patroon uit Phase 1 (controlled parent, onChange callback)
- Startwaarden: pre-filled met publicatieprijzen waar beschikbaar (Cito altijd, concurrenten als bekend), leeg met "Vul prijs in" placeholder waar onbekend
- Bij overschrijven: PriceBadge wisselt naar [Handmatig ✎], reset-knop verschijnt
- Herberekening: na invoer een 'Herbereken' knop — pas na bevestiging herberekent de tabel en het diagram (voorkomt verwarrende tussentijdse updates)
- PRIJS-06: reactieve herberekening zonder opnieuw te beginnen (wizard-data blijft intact)

### Externe modus (MODE-01)
- Phase 2 implementeert de externe modus: objectieve, neutrale vergelijking op basis van publicatieprijzen
- Formeel "u"-vorm in alle teksten
- Interne modus met sales-signalen komt in Phase 4

### Claude's Discretion
- Exacte tabel-styling (schaduw, padding, borders)
- Responsive gedrag van tabel en diagram op smallere schermen
- Hoe om te gaan met onvolledig ingevulde concurrentprijzen (tonen met lege cellen vs. minimumvereiste)
- Validatie bij prijsinvoer (min/max, valuta-formatting)
- Animaties bij uitklappen/inklappen
- Exacte Recharts configuratie (bar sizing, spacing, tooltip styling)
- Loading state als herberekening loopt

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prijsvergelijking requirements
- `.planning/REQUIREMENTS.md` — PRIJS-01..06, DATA-04, INPUT-01, MODE-01
- `.planning/PROJECT.md` — Projectvisie, constraints, key decisions (modulair vergelijken, publicatieprijs als bovengrens)

### Phase 1 context en code
- `.planning/phases/01-fundament/01-CONTEXT.md` — Wizard-flow, module-selectie, prijsdata-model, bewerkbare aannames
- `src/models/pricing.ts` — PriceRecord, PriceStatus, getPriceStatus(), getPriceStalenessLabel()
- `src/models/modules.ts` — ModuleDefinition, MODULE_CATALOG met differentiator veld
- `src/models/assumptions.ts` — Assumption, isModified(), resetToDefault()
- `src/engine/types.ts` — CalculationInput, CalculationResult (placeholder — moet ingevuld worden)
- `src/data/default-prices.ts` — Placeholder prijsdata (moet uitgebreid worden)
- `src/components/ui/PriceBadge.tsx` — Prijsstatus-badge component
- `src/components/ui/EditableAssumption.tsx` — Inline bewerkbaar veld met reset
- `src/components/ui/DisclaimerFooter.tsx` — Publicatieprijs-disclaimer

### Stack
- `src/features/school-profile/store.ts` — Zustand store voor schoolprofiel (basis voor prijsvergelijking-store)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **PriceBadge**: toont [Geverifieerd ✓] / [Handmatig ✎] / [⚠ Verouderd] per prijs — direct bruikbaar in tabelcellen
- **EditableAssumption**: inline bewerkbaar veld met reset-knop en markering van afwijkingen — patroon herbruikbaar voor prijsinvoer
- **DisclaimerFooter**: "publicatieprijs = bovengrens" voetnoot — onderaan de vergelijkingspagina plaatsen
- **MODULE_CATALOG**: 6 modules met id, naam, categorie en differentiator — basis voor tabelrijen
- **PriceRecord model**: moduleId, provider, amountPerStudent, source, verifiedAt — basis voor berekeningen
- **WizardShell + stappen**: levert SchoolProfile op met levels, studentCounts, selectedModules, scenario

### Established Patterns
- **Zustand store**: school-profile store als patroon voor prijsvergelijking-store
- **Zod v4 schemas**: validatie-schema's per wizard-stap als patroon
- **Pure engine functies**: rekenmotor gescheiden van UI (engine/ directory)
- **Tailwind CSS 4**: theming met Cito-kleuren als CSS custom properties

### Integration Points
- Wizard Step 4 selecteert Scenario A → moet navigeren naar prijsvergelijkingspagina
- SchoolProfile.selectedModules → bepaalt welke rijen in de vergelijkingstabel
- SchoolProfile.studentCounts → nodig voor totaalberekening per module
- engine/types.ts CalculationResult moet uitgebreid worden met per-module en per-aanbieder resultaten

</code_context>

<specifics>
## Specific Ideas

- Cialdini-principes als leidraad voor de hele weergave: anchoring via totaalbedragen, framing via neutraal verschil, loss aversion via doorverwijzing naar business case
- Als Cito duurder is op prijs, wint je op totale waarde (prijs + tijdswinst) — de doorverwijzing naar Scenario B is cruciaal
- "Niet beschikbaar" badge bij concurrenten versterkt Cito's breedte van aanbod (scarcity-principe)
- Cito-blauw prominent in diagram, concurrenten in grijs — subtiele visuele dominantie
- Onderscheidend vermogen: Cito-voordelen altijd eerst, prominenter. Eerlijk over nadelen, maar geframed
- Remediering in samenwerking met methodeaanbieders is een key differentiator (al in MODULE_CATALOG)
- AI-verrijking van onderscheidend vermogen is gewenst maar deferred naar Phase 5

</specifics>

<deferred>
## Deferred Ideas

- AI-verrijking van onderscheidend vermogen op basis van concurrentie-informatie (AI-02) — Phase 5
- AI-suggesties voor differentiators op basis van automatisch opgehaalde productinformatie — Phase 5
- Interne modus met sales-signalen en gevoeligheidsanalyse — Phase 4
- Document upload voor automatische prijsextractie (INPUT-02) — Phase 5
- AI-agent voor prijzen opzoeken (INPUT-03) — Phase 5

</deferred>

---

*Phase: 02-prijsvergelijking*
*Context gathered: 2026-03-20*
