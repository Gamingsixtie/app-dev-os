# Phase 21: DMU-Export Upgrade - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 21-dmu-export-upgrade
**Areas discussed:** Rapport-inhoud per DMU-rol, Cito-bronmateriaal integratie, Schoolplan-verwerking in rapport, PDF-huisstijl en kwaliteit

---

## Rapport-inhoud per DMU-rol

### Diepte van rolspecifieke inhoud

| Option | Description | Selected |
|--------|-------------|----------|
| Rolspecifieke inleidingstekst | Elke DMU-rol krijgt een eigen inleidende alinea met aannames. Secties blijven data-gedreven. | ✓ |
| Volledige rolspecifieke narratief | Per sectie een andere tekst/toon per DMU-rol. Veel meer content en onderhoud. | |
| Alleen header + bullets per rol | Minimale aanpassing: andere titel + kernpunten bovenaan. Rest identiek. | |

**User's choice:** Rolspecifieke inleidingstekst (Recommended)

### Aannames configuratie

| Option | Description | Selected |
|--------|-------------|----------|
| Hard-coded in data file | Vaste aannames per rol in TypeScript data file. Geen gebruikersinstellingen. | |
| Bewerkbaar per school | Gebruiker kan per school de DMU-aannames tweaken. | ✓ |

**User's choice:** Bewerkbaar per school

### Waar aannames instellen

| Option | Description | Selected |
|--------|-------------|----------|
| In ExportConfigPanel | Bij het genereren tweaken via uitklapbaar paneel. Defaults uit data file. | ✓ |
| In het schoolprofiel | Per school een DMU-profiel sectie. Export pikt automatisch op. | |
| Combinatie | Basisaannames in schoolprofiel, finetunen bij export. | |

**User's choice:** In ExportConfigPanel (Recommended)

---

## Cito-bronmateriaal integratie

### Bron van materiaal

| Option | Description | Selected |
|--------|-------------|----------|
| Statisch databestand | TypeScript data file met per module: productomschrijving, USP's, features. | ✓ |
| Markdown bestanden per product | Aparte .md bestanden per Cito-product. | |
| Uit bestaande differentiators | Hergebruik differentiator-data uit comparison engine. | |

**User's choice:** Statisch databestand (Recommended)

### Filtering per DMU-rol

| Option | Description | Selected |
|--------|-------------|----------|
| Tags per voordeel | Elk voordeel krijgt tags. DMU-rol filtert op relevante tags. | ✓ |
| Aparte lijsten per rol | Per DMU-rol een aparte array met relevante voordelen. | |
| Alles tonen, volgorde aanpassen | Alle voordelen, volgorde aangepast per DMU-rol. | |

**User's choice:** Tags per voordeel (Recommended)

### Bronvermeldingen

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, met bronreferentie | Elk stuk productinformatie verwijst naar een bron. | ✓ |
| Nee, impliciet Cito-materiaal | Geen expliciete bronvermelding per punt. | |

**User's choice:** Ja, met bronreferentie (Recommended)

---

## Schoolplan-verwerking in rapport

### Presentatie per DMU-rol

| Option | Description | Selected |
|--------|-------------|----------|
| Filter op relevantie per rol | Zelfde tag-structuur als bronmateriaal. Rolspecifieke filtering. | ✓ |
| Alle kansen tonen, highlight per rol | Alle kansen, meest relevante visueel uitgelicht. | |
| Aparte schoolplan-sectie onveranderd | Geen rolspecifieke aanpassing. | |

**User's choice:** Filter op relevantie per rol (Recommended)

### Geen schoolplan beschikbaar

| Option | Description | Selected |
|--------|-------------|----------|
| Sectie overslaan met korte melding | Geen sectie, hint in samenvatting over uploaden. | ✓ |
| Generieke schoolplan-tekst | Standaard blokje tekst over veelvoorkomende schooldoelen. | |
| Sectie gewoon weglaten | Geen vermelding, geen hint. | |

**User's choice:** Sectie overslaan met korte melding (Recommended)

---

## PDF-huisstijl en kwaliteit

### Niveau van verbetering

| Option | Description | Selected |
|--------|-------------|----------|
| Cito-logo + cover page | Voorpagina met logo, schoolnaam, datum, rapporttype. Rest is al goed. | ✓ |
| Volledige redesign | Nieuwe layout, infographics, visueel aantrekkelijker. | |
| Huidige stijl voldoende | Focus op inhoud, niet op vormgeving. | |

**User's choice:** Cito-logo toevoegen + cover page (Recommended)

### Logo beschikbaarheid

| Option | Description | Selected |
|--------|-------------|----------|
| Ik lever het logo aan | Logo bestand wordt in het project geplaatst. | ✓ |
| Tekst-fallback | Gestileerde 'Cito' tekst als placeholder. | |

**User's choice:** Ik lever het logo aan

### Cover page inhoud

| Option | Description | Selected |
|--------|-------------|----------|
| School + datum + rapporttype | Simpel: schoolnaam, datum, DMU-doelgroep en rapporttype. | ✓ |
| Inclusief accountmanager | Ook naam van ingelogde gebruiker op de cover. | |

**User's choice:** School + datum + rapporttype (Recommended)

---

## Claude's Discretion

- Technische implementatie van het tag-filter systeem
- Structuur van dmu-assumptions.ts en cito-product-info.ts databestanden
- Layout en design van de cover page
- UI-design van bewerkbare aannames in ExportConfigPanel

## Deferred Ideas

None — discussion stayed within phase scope
