# Phase 11: Waarde-engine & Migratie - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 11-waarde-engine-migratie
**Areas discussed:** Waarde-pagina locatie, Tijdwinst presentatie, Meerjarenprojectie, Upsell-detectie

---

## Waarde-pagina locatie

### Q1: Waar leeft de waarde/migratie business case in de UI?

| Option | Description | Selected |
|--------|-------------|----------|
| Nieuwe tab in schoolprofiel | 6e tab 'Waarde' naast Dashboard/Vergelijking/Producten/Contacten/Gesprekken. Past bij Phase 7 patroon. | ✓ |
| Sub-tabs onder Vergelijking | Vergelijking-tab krijgt sub-tabs: Marktoverzicht + Waarde & Migratie | |
| Aparte top-level pagina | Eigen route buiten het tab-systeem. Breekt patroon. | |

**User's choice:** Nieuwe tab in schoolprofiel (Recommended)
**Notes:** —

### Q2: Welke secties bevat de Waarde-tab?

| Option | Description | Selected |
|--------|-------------|----------|
| Samenvatting bovenaan | Hero-kaart met totaal, dan 3 secties: Tijdwinst → Migratie → Meerjarenprojectie | ✓ |
| Secties zonder samenvatting | Direct 3 secties, totaal onderaan bij meerjarenprojectie | |
| Accordion-secties | Uitklapbare accordions, compact maar verborgen | |

**User's choice:** Samenvatting bovenaan (Recommended)
**Notes:** —

### Q3: Moet hero-kaart ook prijsverschil uit Vergelijking-tab meenemen?

| Option | Description | Selected |
|--------|-------------|----------|
| Alles gecombineerd | Prijsverschil + tijdwinst + migratie = totale waarde | ✓ |
| Alleen migratie + tijdwinst | Prijsverschil staat al op Vergelijking-tab | |

**User's choice:** Alles gecombineerd (Recommended)
**Notes:** —

### Q4: Omgang met placeholder migratieprijzen?

| Option | Description | Selected |
|--------|-------------|----------|
| Tonen met waarschuwing | Banner + asterisk-markering, inline bewerkbaar | ✓ |
| Verbergen tot ingevuld | Sectie pas zichtbaar na invoer werkelijke prijzen | |
| Je beslist | Claude bepaalt aanpak | |

**User's choice:** Tonen met waarschuwing (Recommended)
**Notes:** —

---

## Tijdwinst presentatie

### Q1: Hoe worden de 5 tijdwinst-taken gepresenteerd?

| Option | Description | Selected |
|--------|-------------|----------|
| Tabel met inline editing | Kolommen: Taak, Oud, Nieuw, Uren/jaar (bewerkbaar), euro/jaar. Uurtarief bovenaan. | ✓ |
| Kaarten per taak | 5 kaarten met sliders, visueler maar meer ruimte | |
| Compacte lijst + totaal | Eenvoudige lijst, minder detail | |

**User's choice:** Tabel met inline editing (Recommended)
**Notes:** —

### Q2: Uurtarief per school of globaal?

| Option | Description | Selected |
|--------|-------------|----------|
| Per school | Eigen uurtarief per schoolprofiel, default euro 50 | ✓ |
| Globaal | Eén uurtarief voor alles | |
| Je beslist | Claude bepaalt | |

**User's choice:** Per school (Recommended)
**Notes:** —

### Q3: Uren per taak per school bewerkbaar?

| Option | Description | Selected |
|--------|-------------|----------|
| Per school bewerkbaar | Overrides opgeslagen bij schoolprofiel | ✓ |
| Standaard + reset | Bewerkbaar maar niet persistent per school | |

**User's choice:** Per school bewerkbaar (Recommended)
**Notes:** —

### Q4: Tijdwinst zichtbaar in externe modus?

| Option | Description | Selected |
|--------|-------------|----------|
| Altijd zichtbaar | Sterk verkoopargument, niet sales-sensitief | ✓ |
| Alleen intern | Verbergen in externe modus | |
| Je beslist | Claude bepaalt | |

**User's choice:** Altijd zichtbaar (Recommended)
**Notes:** —

---

## Meerjarenprojectie

### Q1: Hoe visualiseer je de meerjarenprojectie?

| Option | Description | Selected |
|--------|-------------|----------|
| Staafdiagram + tabel | Recharts 3 staven (1/3/5 jaar) + exacte bedragen | ✓ |
| Lijndiagram met break-even | Groeiende lijn over 5 jaar met kruispunt | |
| Alleen tabel | Geen chart, compacte tabel | |

**User's choice:** Staafdiagram + tabel (Recommended)
**Notes:** —

### Q2: Break-even punt?

| Option | Description | Selected |
|--------|-------------|----------|
| Break-even bij overstapkosten | Bewerkbare overstapkosten, toon terugverdien-maand | ✓ |
| Geen break-even | Alleen cumulatieve besparing | |
| Je beslist | Claude bepaalt | |

**User's choice:** Break-even bij overstapkosten (Recommended)
**Notes:** —

### Q3: Overstapkosten opslaan?

| Option | Description | Selected |
|--------|-------------|----------|
| Per school opslaan | Bewerkbaar veld in schoolprofiel, default euro 0 | ✓ |
| Alleen in sessie | Tijdelijke invoer, niet persistent | |

**User's choice:** Per school opslaan (Recommended)
**Notes:** —

---

## Upsell-detectie

### Q1: Hoe detecteert het systeem upsell-kansen en waar?

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard-kaart + badge | Kaart op school-dashboard, badges op Producten-tab | ✓ |
| Inline in Vergelijking-tab | Icoon naast modules, subtiel | |
| Aparte sectie op Waarde-tab | Onderaan de Waarde-tab | |
| Je beslist | Claude bepaalt | |

**User's choice:** Dashboard-kaart + badge (Recommended)
**Notes:** —

### Q2: Criterium voor upsell-kans?

| Option | Description | Selected |
|--------|-------------|----------|
| Cito goedkoper + differentiators | Prijs + waarde gecombineerd, signaal-sterkte groen/geel/rood | ✓ |
| Alleen Cito goedkoper | Puur financieel | |
| Je beslist | Claude bepaalt | |

**User's choice:** Cito goedkoper + differentiators (Recommended)
**Notes:** —

### Q3: Upsell zichtbaar in schooloverzicht?

| Option | Description | Selected |
|--------|-------------|----------|
| Badge op schoolkaart | Compacte badge "X kansen" op kaart in overzicht | ✓ |
| Alleen in schoolprofiel | Alleen zichtbaar bij openen profiel | |
| Je beslist | Claude bepaalt | |

**User's choice:** Badge op schoolkaart (Recommended)
**Notes:** —

---

## Claude's Discretion

- Exacte Supabase schema-uitbreiding voor per-school data
- Styling hero-kaart, responsive gedrag
- Break-even maand berekening (lineaire interpolatie)
- Upsell-engine combinatie van Phase 10 + Phase 7 data
- Loading states en animaties

## Deferred Ideas

- DMU-gerichte PDF-exports met waarde-data — Phase 12
- AI-gestuurde uurtarief-suggestie — FUTURE
- Scenario-vergelijking meerdere overstap-scenario's — FUTURE
- Upsell-notificaties bij nieuwe prijzen — FUTURE
