# Phase 24: UX-audit vergelijkingsoverzicht — stakeholder-ready prototype - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 24-ux-audit-vergelijkingsoverzicht-stakeholder-ready
**Areas discussed:** Informatie-hiërarchie, Doublures elimineren, Progressive disclosure, Stakeholder-presentatie

---

## Informatie-hiërarchie

### Top section — wat ziet de accountmanager als eerste?

| Option | Description | Selected |
|--------|-------------|----------|
| Totalen + verschil | Drie provider-kaarten met totaalprijs + verschil bovenaan | ✓ |
| AI advies + totalen | AI-advies als hero bovenaan, gevolgd door totaalkaarten | |
| Chart + totalen | Visuele staafgrafiek als eerste indruk | |

**User's choice:** Totalen + verschil
**Notes:** —

### AI advies positie

| Option | Description | Selected |
|--------|-------------|----------|
| Na totalen, voor tabel | Advies als brug tussen overzicht en detail | |
| Bovenaan als hero | AI-advies als eerste sectie — stakeholder leest verhaal eerst | ✓ |
| Onderaan als conclusie | Traditionele rapportstructuur: data eerst, advies als afsluiter | |

**User's choice:** Bovenaan als hero
**Notes:** Gecombineerd met "totalen + verschil" wordt de volgorde: AI hero → totalen → detail

### SchoolplanBanner positie

| Option | Description | Selected |
|--------|-------------|----------|
| In AI hero integreren | Schoolplan-kansen worden onderdeel van AI-advies sectie | ✓ |
| Compacte badge/chip | Klein chipje bij de titel met hover/click voor detail | |
| Laten zoals het is | Aparte banner bovenaan | |

**User's choice:** In AI hero integreren
**Notes:** User vroeg eerst wat SchoolplanBanner was — uitleg gegeven over schoolplan-upload (Phase 14) context

### Volgorde na totalen

| Option | Description | Selected |
|--------|-------------|----------|
| Tabel eerst | Detailtabel direct na totalen — consultant wil per-module zien | ✓ |
| Grafiek eerst | Chart als visuele brug voor stakeholders | |
| Grafiek IN samenvatting | Inline chart naast totaalkaarten | |

**User's choice:** Tabel eerst
**Notes:** —

---

## Doublures elimineren

### Differentiators locatie

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen in MeerwaardePanel | Differentiators per module op één plek | |
| Alleen in AI advies | AI verwerkt differentiators in adviesverhaal | ✓ |
| Kort in summary, detail in panel | Summary toont count, panel toont detail | |

**User's choice:** Alleen in AI advies
**Notes:** Differentiators-lijst verdwijnt als aparte UI-sectie, wordt input voor AI-advies

### MeerwaardePanel structuur

| Option | Description | Selected |
|--------|-------------|----------|
| Eén sectie, beter gestructureerd | Houd bij elkaar als "waarom Cito naast prijs" met subsecties | ✓ |
| Opsplitsen in aparte secties | Elk onderdeel eigen blok | |
| Integreer in AI advies | Alles in het AI-verhaal | |

**User's choice:** Eén sectie, beter gestructureerd
**Notes:** Zonder differentiators-lijst (die zit in AI), behoudt: tijdwinst + migratie CTA

### Controls positie (ProviderSelector + PricingModelCards)

| Option | Description | Selected |
|--------|-------------|----------|
| Samenbrengen in één toolbar | Checkboxes + info-icoontjes op één rij boven tabel | ✓ |
| Provider in toolbar, pricing bij tabel | Checkboxes boven tabel, pricing als tooltip op kolomheaders | |
| Houden zoals nu | Aparte secties | |

**User's choice:** Samenbrengen in één toolbar
**Notes:** —

---

## Progressive disclosure

### AI advies hero disclosure

| Option | Description | Selected |
|--------|-------------|----------|
| Samengevat + expand | Compacte conclusie (2-3 regels) met expand-knop | ✓ |
| Altijd volledig open | Volledig AI-advies zichtbaar | |
| Stappen-tabs | Tabs voor Conclusie / Vergelijking / Strategie | |

**User's choice:** Samengevat + expand
**Notes:** —

### Standaard ingeklapte secties

| Option | Description | Selected |
|--------|-------------|----------|
| Grafiek + meerwaarde ingeklapt | Tabel en totalen altijd zichtbaar, rest on-demand | ✓ |
| Alleen meerwaarde ingeklapt | Grafiek altijd zichtbaar | |
| Niets ingeklapt | Alles open, lange pagina | |

**User's choice:** Grafiek + meerwaarde ingeklapt
**Notes:** —

### Tabel detail-levels

| Option | Description | Selected |
|--------|-------------|----------|
| Huidige opzet is goed | Module-rij klikbaar voor prijsopbouw, geen extra lagen | ✓ |
| Module-groepen inklapbaar | LVS/Overig als inklapbare groepen | |
| Twee niveaus | Groepen + detail beide inklapbaar | |

**User's choice:** Huidige opzet is goed
**Notes:** —

---

## Stakeholder-presentatie

### Stakeholder-context handling

| Option | Description | Selected |
|--------|-------------|----------|
| Eén view, goed gestructureerd | Geen aparte stakeholder-views, hiërarchie werkt voor iedereen | ✓ |
| Stakeholder-filter toggle | Toggle per rol (MT/Coordinator/Finance) | |
| Print-modus | Aparte print/export layout | |

**User's choice:** Eén view, goed gestructureerd
**Notes:** —

### Self-explanatory vs gesprekstool

| Option | Description | Selected |
|--------|-------------|----------|
| Self-explanatory | Labels, tooltips, AI-advies geven voldoende context | ✓ |
| Gesprekstool met uitleg | Visueel hulpmiddel, consultant vult aan | |
| Beide: compact + help-laag | Standaard compact, ?-icoontjes voor uitleg | |

**User's choice:** Self-explanatory
**Notes:** —

### Visuele scheiding

| Option | Description | Selected |
|--------|-------------|----------|
| Witruimte + subtiele dividers | Minder borders, meer witruimte | |
| Kaart-per-sectie houden | Huidige stijl | |
| Volledige redesign met kleurzones | Achtergrondkleur-banden (lichtgrijs/wit afwisselend) | ✓ |

**User's choice:** Volledige redesign met kleurzones
**Notes:** —

---

## Claude's Discretion

- Exacte kleurcodes voor lichtgrijze banden
- Toolbar layout en responsive behavior
- Tooltip vs. popover voor pricing model uitleg
- Collapse/expand animatie-timing
- Responsive breakpoints

## Deferred Ideas

None — discussion stayed within phase scope.
