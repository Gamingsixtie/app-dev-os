# Phase 10: Prijsvergelijking & Gevoeligheid - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 10-prijsvergelijking-gevoeligheid
**Areas discussed:** DIA/JIJ pakketlogica, Hybride scenario, Gevoeligheidsanalyse, Sales-signalen

---

## DIA/JIJ Pakketlogica

### DIA pakketberekening

| Option | Description | Selected |
|--------|-------------|----------|
| Automatisch berekenen | Engine detecteert 3+ DIA-modules en berekent voordeligste pakket | |
| Gebruiker kiest pakket | AM selecteert handmatig welk DIA-pakket | |
| Beide opties | Automatisch voorstel, maar gebruiker kan overschrijven | ✓ |

**User's choice:** Beide opties
**Notes:** Automatisch voorstel met mogelijkheid tot overschrijven

### JIJ prijzen in vergelijking

| Option | Description | Selected |
|--------|-------------|----------|
| Lege kolom + invoerveld | JIJ toont 'Offerte vereist' met invoerveld | |
| Verbergen tot prijs bekend | JIJ verschijnt pas als school-specifieke prijzen zijn ingevoerd | |
| Indicatieve range tonen | Prijsrange op basis van bekende offerteprijzen | |

**User's choice:** JIJ komt naar voren op moment dat school dit gebruikt
**Notes:** JIJ verschijnt alleen in vergelijking als de school JIJ daadwerkelijk gebruikt (productgebruik)

### Pakket-UI weergave

| Option | Description | Selected |
|--------|-------------|----------|
| Badge + detailrij | PriceBadge [Pakketprijs] + uitleg in detailrij | ✓ |
| Aparte pakketrij | Samenvattingsrij onder modulerijen | |
| Tooltip alleen | Hover-tooltip op pakketprijs | |

**User's choice:** Badge + detailrij (Recommended)

### DIA pakketstructuur

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded uit DIA Webshop | Vaste data: Basispakket, Uitgebreid, Compleet | |
| Configureerbaar | AM kan pakketten toevoegen/aanpassen | ✓ |
| Jij vertelt me | Gebruiker levert exacte structuur aan | |

**User's choice:** Configureerbaar

### JIJ zonder prijzen

| Option | Description | Selected |
|--------|-------------|----------|
| Kolom met 'Prijs onbekend' | Duidelijke 'Prijs onbekend' melding | |
| Kolom met invoervelden | Lege invoervelden per module | ✓ (gecombineerd) |
| Geen bedrag, wel differentiators | Alleen onderscheidend vermogen tonen | ✓ (gecombineerd) |

**User's choice:** Combinatie van invoervelden en differentiators
**Notes:** Kolom verschijnt met invoervelden + differentiators, maar geen bedrag tot ingevoerd

---

## Hybride Scenario

### Instelling hybride scenario

| Option | Description | Selected |
|--------|-------------|----------|
| Per module switchen | AM vinkt per module 'Overstap naar Cito' aan | |
| Apart scenario-scherm | Aparte pagina voor hybride vergelijking | |
| Automatisch uit productgebruik | Volgt uit Phase 7 schoolprofiel data | ✓ |

**User's choice:** Automatisch uit productgebruik
**Notes:** Basisvaardighedentoetsen typisch bij 1 aanbieder; extra modules kunnen per stuk bij verschillende aanbieders

### Hybride UI

| Option | Description | Selected |
|--------|-------------|----------|
| Extra kolom 'Na overstap' | Kolom naast Cito/DIA/JIJ met besparing | ✓ |
| Highlight in bestaande tabel | Groene achtergrond bij overstapmodules | |
| Samenvatting onderaan | Samenvattingsblok onder de tabel | |

**User's choice:** Extra kolom 'Na overstap'

### Hybride databron

| Option | Description | Selected |
|--------|-------------|----------|
| Automatisch uit productgebruik | Engine berekent op basis van Phase 7 data, AM kan overschrijven | ✓ |
| Handmatig per module | AM vinkt zelf aan | |
| You decide | Claude kiest | |

**User's choice:** Automatisch uit productgebruik (Recommended)

### Overstap-info detail

| Option | Description | Selected |
|--------|-------------|----------|
| Euro's + percentage | Per module en totaal met besparing in euro's en % | |
| Alleen euro's | Simpel eurobedrag | |
| Uitgebreid met meerjarig | Euro's, %, 3-jaars projectie | |

**User's choice:** Free text — "we bieden ook een 3-jarige licentie bij Cito"
**Notes:** Leidde tot nieuwe sectie over 3-jarige Cito-licentie met toggle [Per jaar] / [3-jarig contract]

### 3-jarige Cito-licentie UI

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle 1-jaar / 3-jaar | Toggle bovenaan vergelijking | ✓ |
| Twee kolommen Cito | Altijd beide zichtbaar | |
| Extra rij onderaan | Samenvattingsblok onder tabel | |

**User's choice:** Toggle 1-jaar / 3-jaar (Recommended)

### 3-jarig prijsmodel

| Option | Description | Selected |
|--------|-------------|----------|
| Aparte prijs per leerling | Eigen tarief voor 3-jarig | |
| Percentage korting | Jaartarief minus X% | |
| Ik geef de details | Gebruiker levert later aan | ✓ |

**User's choice:** Ik geef de details
**Notes:** Exacte prijsmodel wordt later aangeleverd

---

## Gevoeligheidsanalyse

### Weergave

| Option | Description | Selected |
|--------|-------------|----------|
| Tabel met scenario's | Huidige, 10% korting, 20% korting per scenario | ✓ |
| Interactieve slider | 0-50% slider met real-time effect | |
| Scenario-builder | AM stelt zelf percentages in per concurrent/module | |

**User's choice:** Tabel met scenario's (Recommended)

### Break-even scope

| Option | Description | Selected |
|--------|-------------|----------|
| Beide (totaal + per module) | Totaal break-even + per-module in detailrij | ✓ |
| Alleen totaal | Eén break-even getal | |
| Alleen per module | Granulairder maar mist overzicht | |

**User's choice:** Beide (Recommended)

### Welke concurrenten

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen actieve concurrent | Alleen de concurrent die school nu gebruikt | ✓ |
| Altijd alle concurrenten | Altijd DIA én JIJ | |
| Configureerbaar | AM kiest zelf | |

**User's choice:** Alleen actieve concurrent (Recommended)

### Positie op pagina

| Option | Description | Selected |
|--------|-------------|----------|
| Sectie onder de tabel | Uitklapbare sectie op dezelfde pagina | ✓ |
| Eigen tab in schoolprofiel | Aparte 'Analyse' tab | |
| Overlay/modal | Modal met scenario-tabel | |

**User's choice:** Sectie onder de tabel (Recommended)

---

## Sales-signalen

### Type signalen

| Option | Description | Selected |
|--------|-------------|----------|
| Automatische signalen | Engine bepaalt op basis van prijsverschil + differentiators | ✓ |
| Handmatige signalen | AM stelt zelf in | |
| Automatisch + overschrijfbaar | Engine voorstel, AM kan aanpassen | |

**User's choice:** Automatische signalen (Recommended)

### Modus toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle in de header | [Extern] / [Intern] toggle-switch | ✓ |
| Aparte URL/route | Twee routes | |
| Sidebar toggle | Zijpaneel met extra info | |

**User's choice:** Toggle in de header (Recommended)

### Visuele weergave

| Option | Description | Selected |
|--------|-------------|----------|
| Badge per module | Gekleurde badge naast modulenaam + toelichting in detailrij | ✓ |
| Kolom in de tabel | Extra kolom 'Signaal' | |
| Alleen in detailrij | Pas zichtbaar bij uitklappen | |

**User's choice:** Badge per module (Recommended)

### Extern als publieke modus

| Option | Description | Selected |
|--------|-------------|----------|
| Nee, altijd ingelogd | Extern = weergavemodus zonder sales-info | ✓ |
| Ja, publieke link | AM genereert deelbare link | |

**User's choice:** Nee, altijd ingelogd (Recommended)

---

## Claude's Discretion

- Exacte DIA-pakketconfiguratie UI
- Berekening pakketprijzen in engine
- Visueel onderscheid interne/externe modus
- Break-even berekening methode
- Responsive gedrag uitgebreide tabel
- Loading state, animaties

## Deferred Ideas

- Vercel deploy (DEPLOY-01) — Phase 8
- Meerjarenprojectie — Phase 11
- AI-verrijking differentiators — FUTURE
- Publieke link voor school — idee genoteerd
