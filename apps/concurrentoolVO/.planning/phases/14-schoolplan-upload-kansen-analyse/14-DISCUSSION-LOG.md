# Phase 14: Schoolplan Upload & Kansen-analyse - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 14-schoolplan-upload-kansen-analyse
**Areas discussed:** Analyse-weergave, Kansen-matching, Concurrentie-signalen, Document-verwerking

---

## Analyse-weergave

### Locatie in schoolprofiel

| Option | Description | Selected |
|--------|-------------|----------|
| Nieuwe tab 'Schoolplan' | 7e tab naast bestaande tabs. Upload + analyse gescheiden van andere data. | ✓ |
| In Overzicht-dashboard | Kansen als sectie/kaarten in bestaand Overzicht-tab. | |
| Beide — samenvatting + detail tab | Top-3 in Overzicht, volledig in eigen tab. | |

**User's choice:** Nieuwe tab 'Schoolplan'

### Presentatie van individuele kansen

| Option | Description | Selected |
|--------|-------------|----------|
| Kaarten per kans | Vergelijkbaar met UpsellCard — per kans een kaart. | |
| Rapport-achtig overzicht | Lopende tekst met secties per thema. | |
| Tabel met kolommen | Thema/product/relevantie/kwetsbaarheid. | |

**User's choice:** Kaarten per kans

### Kaart-inhoud

| Option | Description | Selected |
|--------|-------------|----------|
| Thema + product + toelichting | Schoolplan-thema, Cito-product, waarom relevant, gesprekstip. | |
| Thema + product + score | Compacter met relevantie-score. | |
| Volledig — alles | Thema, product, toelichting, score, citaat, concurrentie-kwetsbaarheid. | ✓ |

**User's choice:** Volledig — alles
**Notes:** Accountmanager heeft maximale informatie nodig tijdens het gesprek.

### Samenvatting bovenaan

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, korte samenvatting | 2-3 zinnen over focus schoolplan en aantal kansen. | ✓ |
| Nee, direct kaarten | Geen samenvatting. | |

**User's choice:** Ja, korte samenvatting

### Interactie met kansen

| Option | Description | Selected |
|--------|-------------|----------|
| Markeren + notitie | Kansen markeren als 'besproken'/'niet relevant' + notitie. | ✓ |
| Alleen lezen | Kansen zijn read-only. | |
| You decide | Claude kiest. | |

**User's choice:** Markeren + notitie

### Versies

| Option | Description | Selected |
|--------|-------------|----------|
| Vervangen | Eén schoolplan per school, nieuw overschrijft vorig. | ✓ |
| Meerdere versies | Schoolplannen met datum bewaard. | |
| You decide | Claude kiest. | |

**User's choice:** Vervangen

### Upload UX

| Option | Description | Selected |
|--------|-------------|----------|
| Dropzone bovenaan tab | DocumentDropzone-patroon, na upload wordt 'Vervang' knop. | ✓ |
| Aparte upload-stap | Eerst upload-scherm, dan analyse. | |
| You decide | Claude kiest. | |

**User's choice:** Dropzone bovenaan tab

### Analyse-start

| Option | Description | Selected |
|--------|-------------|----------|
| Direct starten | Automatisch na upload met streaming feedback. | ✓ |
| Bevestigen voor analyse | Eerst tonen, dan 'Analyseren?' vraag. | |

**User's choice:** Direct starten

---

## Kansen-matching

### Matching-methode

| Option | Description | Selected |
|--------|-------------|----------|
| Vrije AI-analyse | Claude matcht vrij op inhoudelijk begrip. Geen taxonomie. | ✓ |
| Gestructureerde taxonomie | Vaste thema-lijst gematcht aan modules. | |
| Hybride | AI + thema-productmatrix als referentie. | |

**User's choice:** Vrije AI-analyse

### Concreetheid aanbevelingen

| Option | Description | Selected |
|--------|-------------|----------|
| Specifiek product + gesprekstip | Concreet product, waarom aansluitend, gesprekstip. | ✓ |
| Alleen productcategorie | Brede richting zonder specifiek product. | |
| Product + citaat uit schoolplan | Specifiek product plus relevant citaat. | |

**User's choice:** Specifiek product + gesprekstip

### Relevantie-scoring

| Option | Description | Selected |
|--------|-------------|----------|
| 3-niveau score | Hoog/Midden/Laag, gesorteerd op score. | ✓ |
| Alleen rangschikking | Geordend maar zonder expliciete score. | |
| You decide | Claude kiest. | |

**User's choice:** 3-niveau score

### Extra kansen buiten schoolplan

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, aparte sectie | 'Mogelijk ook relevant' sectie. Op basis van schooltype/productgebruik. | ✓ |
| Nee, alleen uit schoolplan | Strikt schoolplan-gebaseerd. | |
| You decide | Claude kiest. | |

**User's choice:** Ja, aparte sectie

---

## Concurrentie-signalen

### Basis voor signalering

| Option | Description | Selected |
|--------|-------------|----------|
| Schoolplan + bekende beperkingen | Combineert schoolplanwensen met DIA/JIJ differentiators-data. | ✓ |
| Alleen schoolplan-wensen | Alleen mismatch schoolplan vs concurrent. | |
| Volledig incl. productgebruik | + huidige productgebruik uit SchoolRecord. | |

**User's choice:** Schoolplan + bekende productbeperkingen

### Visuele weergave

| Option | Description | Selected |
|--------|-------------|----------|
| Geïntegreerd op kans-kaart | Concurrentie-sectie op de kans-kaart zelf. | ✓ |
| Aparte concurrentie-sectie | Los blok 'Concurrentie-kwetsbaarheden'. | |
| You decide | Claude kiest. | |

**User's choice:** Geïntegreerd op kans-kaart

---

## Document-verwerking

### Verwerkingsstrategie

| Option | Description | Selected |
|--------|-------------|----------|
| Twee stappen: samenvatting → analyse | Stap 1: samenvatting. Stap 2: matching + concurrentie. | ✓ |
| Volledige tekst in één keer | Hele document naar Claude. | |
| Chunked analyse | In delen verwerken, resultaten samenvoegen. | |

**User's choice:** Twee stappen: samenvatting → analyse

### Bestandsformaten

| Option | Description | Selected |
|--------|-------------|----------|
| PDF + Word | Twee meest voorkomende formaten. | |
| Alleen PDF | Simpelst, parser bestaat al. | |
| PDF + Word + platte tekst | Maximale flexibiliteit. | ✓ |

**User's choice:** PDF + Word + platte tekst

### AI-model

| Option | Description | Selected |
|--------|-------------|----------|
| Claude Haiku 4.5 | Snel en goedkoop. | |
| Claude Sonnet | Krachtiger, betere thema-herkenning. | ✓ |
| You decide | Claude kiest. | |

**User's choice:** Claude Sonnet met model-abstractie
**Notes:** Model moet configureerbaar zijn — Claude Sonnet nu, maar optie voor Gemini of andere modellen later. Altijd check op nieuwste modelversie.

### Document-weergave na upload

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen metadata | Bestandsnaam, uploaddatum, pagina's. | ✓ |
| Inline PDF viewer | Direct te bekijken in browser. | |
| Download-link | Link om origineel te downloaden. | |

**User's choice:** Alleen metadata

---

## Claude's Discretion

- Exacte Zod-schema voor AI-output
- Technische implementatie twee-stappen pipeline
- Model-abstractie architectuur
- Foutafhandeling voor niet-schoolplan documenten
- Paginering/layout bij veel kansen

## Deferred Ideas

None — discussion stayed within phase scope
