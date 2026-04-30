# Phase 1: Fundament - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Datamodel, rekenmotor, schoolprofiel-invoer en app-skelet met Cito-huisstijl. De gebruiker kan een schoolprofiel invoeren (schooltype, leerlingaantallen, modules, scenario) en de applicatie toont de Cito-huisstijl, Nederlandse interface en correct opgezette datastructuren. Berekeningen en resultaatweergave komen in latere fasen.

</domain>

<decisions>
## Implementation Decisions

### Schoolprofiel-invoer flow
- Stapsgewijze wizard met 4 stappen: Schooltype/niveaus → Leerlingaantallen → Modules → Scenario kiezen
- Voortgangsbalk is klikbaar: gebruiker kan terug naar eerdere stappen, ingevulde data blijft bewaard
- Vooruit kan alleen als huidige stap valide is
- Leerlingaantallen per leerjaar per niveau (matrix-invoer)
- Slim grid met defaults: alleen rijen voor geselecteerde niveaus, met 'vul standaard in' knop (klein/midden/groot VO) als startpunt

### Module-selectie ervaring
- Kaarten met toggle: elke module als kaart met naam, korte beschrijving en aan/uit toggle
- Gegroepeerd in twee categorieën:
  - **Leerlingvolgsysteem:** Reken-Wiskunde, Nederlands, Engels
  - **Overige instrumenten:** Taalverzorging Nederlands, Sociaal-emotioneel functioneren, Cognitieve capaciteitentoets (losse licentie)
- Alle modules staan standaard uit (gebruiker selecteert actief)

### Prijsdata & transparantie
- Badge per status naast elke prijs: [Geverifieerd], [Handmatig], [⚠ Verouderd]
- Onderscheid tussen intern en extern: in externe modus komen prijzen handmatig van de school (actuele prijzen uit het gesprek), in interne modus werkt men met publicatieprijzen en andere bronnen
- Prijzen >6 maanden oud: oranje badge + tooltip met laatst geverifieerde datum en melding om te controleren
- 'Publicatieprijs = bovengrens'-disclaimer onderaan het scherm als voetnoot, niet prominent bovenaan

### Bewerkbare aannames
- Inline bewerkbaar: aannames staan direct bij de berekening waar ze gebruikt worden, klikbaar om te wijzigen
- Per-veld reset-icoontje naast elk aangepast veld om individueel terug te zetten naar standaard
- Aangepaste waarden krijgen subtiele visuele markering (licht gekleurde achtergrond of underline) zodat afwijkingen van standaard zichtbaar zijn
- Standaardprofielen (klein/middelgroot/groot VO) worden al in Phase 1 in het datamodel gedefinieerd, zodat Phase 3 ze direct kan gebruiken

### Claude's Discretion
- Exacte wizard-animaties en transities
- Grid-layout details voor de leerlingaantallen-matrix
- Exacte kaart-design voor modules (schaduw, hoeken, spacing)
- Tooltip-implementatie voor prijsbadges
- Kleurkeuze voor de subtiele markering van aangepaste waarden

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in decisions above and in:
- `.planning/REQUIREMENTS.md` — PROF-01..04, DATA-01..03, DATA-05..06, UX-03, UX-04
- `.planning/PROJECT.md` — Projectvisie, constraints, key decisions
- `.planning/STATE.md` — Stack beslissing: React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Recharts 3

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Geen bestaande code — dit is de eerste fase, repository is leeg

### Established Patterns
- Stack besloten: React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Recharts 3
- Rekenmotor als pure TypeScript functies, gescheiden van React UI
- Interne/externe modus via apart URL-pad

### Integration Points
- Wizard-component moet schoolprofiel-data opleveren als gestructureerd TypeScript object voor de rekenmotor
- Prijsdata-model moet bron, verificatiedatum en ouderdomsindicator per record bevatten
- Aannames-model moet standaardprofielen (klein/midden/groot VO) bevatten

</code_context>

<specifics>
## Specific Ideas

- Remediëring is bij Cito in samenwerking met methodeaanbieders: gratis en legt de expertise neer waar het hoort — dit is een belangrijk onderscheidend vermogen dat in de modulekaarten of elders zichtbaar moet zijn
- Modulenamen zonder "LVS" prefix: gewoon "Reken-Wiskunde", "Nederlands", "Engels"
- Cognitieve capaciteitentoets is een losse licentie (apart geprijsd)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-fundament*
*Context gathered: 2026-03-20*
