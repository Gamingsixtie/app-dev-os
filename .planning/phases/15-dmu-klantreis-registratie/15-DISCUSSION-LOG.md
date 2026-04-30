# Phase 15: DMU Klantreis Registratie - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 15-dmu-klantreis-registratie
**Areas discussed:** Klantreis-fases & overgangen, Visuele weergave op school-dashboard, Stagnatie-signalen, Filtering in schooloverzicht

---

## Klantreis-fases & overgangen

### Initieel voorstel: 7-staps lineaire funnel
Oorspronkelijk voorgesteld: Onbekend → Eerste contact → Oriëntatie → Evaluatie → Onderhandeling → Beslissing → Gewonnen/Verloren (uit roadmap).

**User feedback:** "Maak er een logische sales funnel van." → Aangepast naar 7 engagement-fases: Niet bereikt → Kennismaking → Geïnformeerd → Geïnteresseerd → Voorstander → Akkoord → Afgehaakt.

**User verduidelijking:** Gebruiker legde uit dat het NIET om een lineaire funnel gaat, maar om het beslissingsnetwerk binnen de school. DMU-leden hebben verschillende bevoegdheden en moeten intern doorverwijzen (bijv. voor budget). Het gaat om inzicht in hoe het beslisproces verloopt.

→ **Herontwerp:** 6 engagement-statussen (Nog niet benaderd → In gesprek → Positief → Wacht op intern → Akkoord → Afgehaakt) + interne afhankelijkheden ("wacht op" link naar andere contactpersoon).

| Option | Description | Selected |
|--------|-------------|----------|
| Engagement-status + afhankelijkheden | Korte statuslijst + registreren wie op wie wacht | ✓ |
| Simpeler (alleen status) | Geen interne afhankelijkheden | |
| Anders | Gebruiker legt uit | |

### Terug naar eerdere fase

| Option | Description | Selected |
|--------|-------------|----------|
| Vrij heen en weer | Elke overgang mogelijk | ✓ |
| Terug met reden | Terugstap mag met toelichting | |
| Alleen vooruit | Geen terugstap | |

### Sync school-pipeline ↔ DMU

| Option | Description | Selected |
|--------|-------------|----------|
| Volledig los | Onafhankelijk beheerd | |
| Suggestie bij mismatch | Systeem toont suggestie | ✓ |
| Auto-sync | Automatisch meebewegen | |

### Afronding bij Afgehaakt

| Option | Description | Selected |
|--------|-------------|----------|
| Verplichte reden | Net als "Verloren" bij school-pipeline | ✓ |
| Optionele notitie | Tekstveld maar niet verplicht | |
| Geen extra info | Gewoon zetten | |

---

## Visuele weergave op school-dashboard

### Locatie

| Option | Description | Selected |
|--------|-------------|----------|
| Op het Overzicht-dashboard | Sectie op bestaande Overzicht-tab | ✓ |
| Eigen tab 'DMU' | Nieuwe 8e tab | |
| Bij de Contacten-tab | Integreren in bestaande tab | |

### Weergavevorm

| Option | Description | Selected |
|--------|-------------|----------|
| Matrix/tabel | Compacte tabel met naam, rol, bevoegdheid, status, wacht op | ✓ |
| Visuele kaarten | Kaarten met pijlen | |
| Beide | Matrix op dashboard, kaarten in Contacten | |

### Voortgangsindicator op schoolkaart

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, op schoolkaart | Compacte indicator op kaart | ✓ |
| Alleen in profiel | Alleen zichtbaar bij openen | |
| Nee | Pipeline-status is voldoende | |

---

## Stagnatie-signalen

### Drempel

| Option | Description | Selected |
|--------|-------------|----------|
| 30 dagen | Na 30 dagen een signaal | ✓ |
| Zelf instelbaar | Per school of globaal instellen | |
| Fase-afhankelijk | Verschillende drempels per fase | |

### Visueel signaal

| Option | Description | Selected |
|--------|-------------|----------|
| Inline waarschuwing | Oranje badge naast contactpersoon | ✓ |
| Aparte signalen-sectie | Sectie bovenaan dashboard | |
| Alleen in tabel | Kolom 'Dagen in fase' rood kleuren | |

---

## Filtering in schooloverzicht

### Filter-aanpak

| Option | Description | Selected |
|--------|-------------|----------|
| Extra filterrij voor DMU-status | Tweede filterrij, combineerbaar met pipeline | ✓ |
| Gecombineerde filter | Eén dropdown voor beide | |
| Zoek-only | Zoekbalk zoekt ook op DMU-status | |

### Kanban-view

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, mini DMU-indicator | Compacte indicator op kanban-kaarten | ✓ |
| Nee, alleen in lijst | Kanban blijft puur school-pipeline | |

---

## Claude's Discretion

- Kleurcodes per engagement-status
- Layout en spacing DMU-matrix
- Mini DMU-indicator design
- "Wacht op" instelling UX
- Mismatch-suggestie UI
- Stagnatie-badge design
- DMU-filter UI-patroon
- Empty states
