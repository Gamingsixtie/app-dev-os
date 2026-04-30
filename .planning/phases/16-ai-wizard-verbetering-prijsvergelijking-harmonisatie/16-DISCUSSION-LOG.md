# Phase 16: AI Wizard Verbetering & Prijsvergelijking Harmonisatie - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie
**Areas discussed:** Wizard stappen-flow, Variant-selectie UX, Harmonisatie wizard ↔ tabel, AI matching-logica

---

## Wizard stappen-flow

| Option | Description | Selected |
|--------|-------------|----------|
| Vervang AdvicePanel | AdvicePanel wordt de 3-stappen wizard — dezelfde plek, nu met stappen | ✓ |
| Apart tabblad/view | Wizard als eigen view naast vergelijking | |
| You decide | Claude bepaalt | |

**User's choice:** Vervang AdvicePanel
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Resultaat bevestigen | Gebruiker bevestigt, data gaat naar tabel | |
| Resultaat + aanpassen | Gebruiker kan matching handmatig aanpassen | ✓ |
| Tabelweergave direct | Stap 3 toont direct de tabel | |

**User's choice:** Resultaat + aanpassen
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Altijd zichtbaar bovenaan | Wizard altijd boven de vergelijkingstabel | ✓ |
| Collapsed na doorlopen | Samenvatting-balk met 'Wijzig' knop | |
| Eerste keer verplicht | Verschijnt alleen als nog geen variant geselecteerd | |

**User's choice:** Altijd zichtbaar bovenaan
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Lineair met stappen-balk | Stap 1 → 2 → 3 met vorige/volgende | ✓ |
| Tabs / vrij klikbaar | Drie tabs altijd klikbaar | |
| You decide | Claude kiest | |

**User's choice:** Lineair met stappen-balk
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Alle tegelijk | DIA en JIJ varianten naast elkaar per module | ✓ |
| Per concurrent apart | Wizard apart doorlopen per concurrent | |
| You decide | | |

**User's choice:** Alle tegelijk
**Notes:** "Het kan zomaar zijn dat ze voor het sociaal-emotioneel een andere methode gebruiken dan voor de basisvaardigheden. Een variant kan zijn dat ze twee aanbieders gebruiken."

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, pre-fill vanuit moduleSetups | Bestaande aanbieders als default, overrulbaar | ✓ |
| Nee, los van moduleSetups | Aparte flow | |
| You decide | | |

**User's choice:** Ja, pre-fill — maar altijd overrulbaar als gebruiker
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Streaming (real-time) | Tekst verschijnt geleidelijk | ✓ |
| Wachten + tonen | Volledig resultaat in één keer | |
| You decide | | |

**User's choice:** Streaming (real-time)
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, optioneel | Knop 'Sla advies over' | |
| Nee, verplicht | AI-advies altijd doorlopen | ✓ |
| You decide | | |

**User's choice:** Verplicht
**Notes:** "Het is heel erg foutgevoelig omdat er zoveel verschillende varianten zijn. De kans op fouten is groot als stap 2 overgeslagen wordt."

---

## Variant-selectie UX

| Option | Description | Selected |
|--------|-------------|----------|
| Kaarten per variant | Elke variant als kaart | |
| Tabel per aanbieder | Vergelijkingstabel met alle varianten | |
| Dropdown per module | Per module een dropdown | ✓ |

**User's choice:** Per module, omdat het aanbod per module kan verschillen
**Notes:** "We kunnen voor rekenen een totaalpakket aanschaffen, voor Nederlands maar één onderdeel, idem voor Engels."

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, variant per module | Sub-selectie voor specifieke variant | ✓ |
| Automatisch bepalen | Engine bepaalt voordeligste variant | |
| You decide | | |

**User's choice:** Ja, variant per module
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, prijs + modules erbij | Per variant: naam, prijs/leerling, modules | ✓ |
| Alleen naam + korte uitleg | Zonder prijzen | |
| You decide | | |

**User's choice:** Ja, prijs + modules erbij
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, aanbeveling tonen | Engine berekent logische variant, toont als "Aanbevolen" | ✓ |
| Nee, neutraal tonen | Alle varianten gelijk | |
| You decide | | |

**User's choice:** Ja, aanbeveling — plus er is een apart tekstveld voor gespreksnotities waaruit AI kan afleiden wat de school gebruikt
**Notes:** "We hebben nog een aparte knop in de AI wizard waar je gespreksnotities kan noteren en waaruit kan komen wat de school op dat moment gebruikt."

---

### Gespreksnotities-flow (nieuw inzicht)

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-fill uit notities | Notities → AI extract → variant-selectie pre-filled | ✓ |
| Aparte input naast selectie | Notitieveld naast dropdowns | |
| Intake-flow eerst | Korte intake → pre-fill wizard | |

**User's choice:** Pre-fill uit notities als stap 1
**Notes:** "Het mooiste zou zijn als dit stap 1 zou zijn. En als het niet bekend is, een knop 'niet bekend'. Dit vormt de basis voor de verdere stappen."

---

## Harmonisatie wizard ↔ tabel

| Option | Description | Selected |
|--------|-------------|----------|
| Wizard schrijft naar store | Single source of truth via Zustand store | ✓ |
| Tabel herberekent | Parameters doorgeven, altijd vers berekend | |
| You decide | | |

**User's choice:** Wizard schrijft naar store
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, live update | Tabel update direct | |
| Met bevestiging | 'Pas tabel aan' knop vereist | ✓ |
| You decide | | |

**User's choice:** Met bevestiging
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen in wizard | AI-advies leeft alleen in wizard stappen | ✓ |
| Samenvatting bij tabel | Korte samenvatting boven/onder tabel | |
| Uitklapbaar bij tabel | Uitklapbare sectie met volledig advies | |

**User's choice:** Alleen in wizard
**Notes:** —

---

## AI matching-logica

| Option | Description | Selected |
|--------|-------------|----------|
| Match concurrent → Cito-equivalent | Per module matching met uitleg | |
| Valideer + adviseer | Validatie + correctie + positionering | |
| Volledig vergelijkingsadvies | Matching + sterke punten + bezwaren + strategie | ✓ |

**User's choice:** Optie 3 plus eerlijke matching
**Notes:** "De concurrenten hebben zoveel varianten, Cito maar drie bundels. Het moet een eerlijke vergelijking zijn, uitlegbaar richting scholen. Cito wordt goed gepositioneerd maar wel eerlijk."

---

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen interne data | Uitsluitend src/data/providers/ | |
| Interne data + context | Primair intern, plus marktkennis | ✓ |
| You decide | | |

**User's choice:** Interne data + context + gebruikersinput via gestructureerd extra-context veld
**Notes:** "Gebruiker kan handmatig extra prompt geven voor betrouwbaarheid. Context moet volgens vaste structuur zodat AI het goed kan plaatsen."

---

| Option | Description | Selected |
|--------|-------------|----------|
| Vaste velden | Voorgedefinieerde velden | |
| Vrij tekstveld + tags | Flexibel tekstveld met categorieën | |
| You decide | Claude bepaalt UX | ✓ |

**User's choice:** You decide — het belangrijkste is dat info goed begrepen wordt en AI er daadwerkelijk iets mee kan
**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, altijd bundel advies | AI adviseert expliciet welke Cito-bundel | ✓ |
| Ja, met alternatieven | Bundel + wat verandert bij andere keuze | |
| You decide | | |

**User's choice:** Ja, altijd
**Notes:** —

---

### Scope advies & scenario-detectie

**User's choice:** Alleen modules met concurrent in het advies, tenzij school oud-Cito gebruikt
**Notes:** "Basismodules/basisvaardigheden zijn één pakket — daar zit zelden verschil in. Verschil zit eerder in sociaal-emotioneel of executieve functie. Als alles al Cito nieuw is: melding 'wat wil je dan precies doen?'. Als alles oud-Cito: migratie-vergelijking."

---

| Option | Description | Selected |
|--------|-------------|----------|
| Prijs + differentiators | Prijsverschil én Cito-meerwaarde per module | ✓ |
| Alleen prijs-matching | Puur prijsvergelijking | |
| You decide | | |

**User's choice:** Prijs + differentiators
**Notes:** —

---

## Claude's Discretion

- UX-design van het gestructureerde extra-context veld
- Exact visueel ontwerp stappen-balk en variant-selectie
- Loading/streaming UX details
- "Niet bekend" markering visueel in stap 2
- Scenario-detectie melding presentatie
- Responsive behavior op tablet

## Deferred Ideas

None — discussion stayed within phase scope.
