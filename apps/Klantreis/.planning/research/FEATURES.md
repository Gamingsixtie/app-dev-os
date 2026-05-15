# Feature-onderzoek — Klantreis VO

**Domein:** Interactief klantreis-visualisatie-instrument (CJM + Service Blueprint hybride) voor onderwijs-sector MT (Cito VO)
**Onderzocht:** 2026-05-14
**Vertrouwen:** HOOG (concurrent-features) / MEDIUM (UX-patterns rond mismatch en inline-editing — minder gestandaardiseerd in branche)

---

## Onderzoekskader

Vijf commerciële tools zijn als referentie gebruikt: **Smaply** (rijkste lane-systeem, sterk in service blueprints), **UXPressia** (sterk in emotie + multi-persona), **Custellence** (specialistisch in service blueprints met backstage), **TheyDo** (enterprise journey orchestration met opportunity-tagging), **FlowMapp** (CJM + personas + export). Geen van deze tools combineert alle elementen die deze milestone vereist — daarin ligt de differentiatie.

**Drie ontwerpprincipes uit de scope sturen de classificatie:**

1. Het MT moet collectief op het ontwerp kunnen reageren — geen feature die afleidt van vorm en flow
2. De tweedeling boven/onder de lijn is heilig — features die deze grens vervagen worden afgewezen
3. Iteratieve aanpasbaarheid (lanes/fases/reizen) is een ontwerpdoel, geen nice-to-have

---

## Feature-landschap

### Table Stakes — zonder dit is het geen klantreis-instrument

Features die elke serieuze CJM-tool heeft en die gebruikers verwachten. Ontbreken hiervan voelt incompleet.

| Feature | Waarom verwacht | Complexiteit | Notities |
|---------|----------------|--------------|----------|
| **Horizontale tijdlijn-layout (kolommen = maanden aug–jul)** | Alle CJM-tools (Smaply, UXPressia, Custellence) gebruiken een horizontale tijdas; gebruikers kennen dit patroon | LAAG | 12 vaste kolommen voor schooljaar; sticky linker-kolom met lane-labels; horizontaal scrollen als content overloopt |
| **Tweedeling met "Line of Visibility"** | Service blueprint-standaard sinds Lynn Shostack (1984); customer-actions boven, backstage onder | LAAG | Eén visuele scheidingslijn; verschillende achtergrondkleur boven/onder; **NOOIT mengen** (CLAUDE.md harde regel) |
| **Fases boven klantstap (clustering van maanden)** | Smaply "stages", UXPressia "stages", Custellence "phases" — clustering geeft betekenis aan losse maanden | LAAG | Header-rij boven de tijdlijn; fases overspannen één of meerdere maanden; hernoembaar inline |
| **Klantstap-rij in eerste persoon** | UXPressia "customer actions", Smaply "text lane" — universeel patroon | LAAG | Eén stap per maand of per fase; tekstvalidatie/placeholder dwingt eerste persoon af ("Ik..."); editorial typografie, geen badges |
| **Emotie-indicator per klantstap** | UXPressia (emotie-curve + emotion wheel), Smaply (dramatic arc lane) — table stakes in alle CJM-tools | MEDIUM | Voor MT-niveau: simpele 3- of 5-puntsschaal met dot/icoon volstaat; **geen curve** (zie differentiator-discussie); kleur subtiel, geen rode/groene drukte |
| **Klantkanaal-indicator per klantstap** | Smaply "channel lane", UXPressia "channels" — standaard | LAAG | Iconografie: telefoon, mail, digitaal (LIB VO/Woots), fysiek, document; max 5 iconen; één-letter-labels of mono-icoon-stijl |
| **Afdelings-swimlanes onder de lijn (5 lanes)** | Service blueprint standaard: frontstage / backstage / support gesplitst in afdelings-lanes | LAAG | Vijf vaste lanes initieel: Marketing, Sales, Productmanagement, Toetstekunde, Customer Success; uitbreidbaar (zie differentiator) |
| **Activiteit-kaarten in afdelings-lanes per maand** | Custellence, Smaply, TheyDo — kaart-per-cel is universeel | LAAG | Kleine kaart met titel; klikbaar voor detail; max 2–3 kaarten per cel zonder visuele overload |
| **Activiteit-detail-modal/paneel** | Alle CJM-tools openen een paneel/modal bij klik | MEDIUM | Side-paneel (rechts) i.p.v. modal — laat tijdlijn-context zien; sluitbaar; deeplinks niet nodig in deze milestone |
| **Standaard detail-velden** | UXPressia (goals/expectations/quotes), TheyDo (owner/KPI/status), Smaply (KPIs/opportunities) | LAAG | Verplichte velden volgens CLAUDE.md: eigenaar, betrokken, DMU-leden, klantverwachting, KPI's, opdrachtdocument-status, ontbrekende randvoorwaarden |
| **Klantcitaten als bewijs bij knelpunten** | UXPressia "quotes", Smaply "user quotes" — table stakes voor outside-in tools | LAAG | Source Serif 4 italic per CLAUDE.md; verschijnt in detail-paneel én optioneel als inline klein citaat-icoon op de kaart |
| **Klantreis-tabs voor multi-journey navigatie** | Smaply "journey hierarchies", UXPressia "map collections", TheyDo "journeys list" | LAAG | Drie tabs vast: bestaande klanten, nieuwe klanten, bestuur (Stichting BOOR); tab-state in localStorage |
| **Inline structuur-editing (lanes/fases/reizen toevoegen/hernoemen/verwijderen)** | Smaply (drag-drop lanes), Custellence (add lane), TheyDo (CRUD op stages) | MEDIUM | Edit-knop op lane-label hernoemt; "+ lane toevoegen" onder laatste lane; "+ fase" rechts van laatste fase; verwijderen met bevestiging; **kritiek per PROJECT.md** |
| **Filters per afdeling/status/blokker** | UXPressia "filters", TheyDo "filters", Smaply "tags" — standaard sinds 2020 | MEDIUM | Filterbar boven tijdlijn: afdeling-multi-select, status-checkbox, blokker-toggle; visuele dim-treatment op gefilterde-weg kaarten i.p.v. verwijderen |
| **Bewaar lokale state tussen sessies** | Elke tool persisteert; in onze milestone lokaal (localStorage) | LAAG | localStorage voor structuur + posities + filters; geen cloud, geen Supabase deze milestone |

### Differentiators — wat dit beter maakt dan Smaply/UXPressia/Custellence

Features die specifiek nodig zijn voor de Cito-VO-context en die generieke CJM-tools NIET goed bieden.

| Feature | Waarde-propositie | Complexiteit | Notities |
|---------|-------------------|--------------|----------|
| **DMU-rij per maand (beslisser → beïnvloeder → gebruiker)** | Geen CJM-tool heeft native DMU-rijen; meeste tools doen één persona per map. In B2B-onderwijs is DMU per klantmoment cruciaal | MEDIUM | Drie sub-rijen onder klantstap, altijd in volgorde beslisser/beïnvloeder/gebruiker (CLAUDE.md regel); per maand kunnen 0–3 rollen actief zijn; rolnaam + optioneel functietitel ("directeur", "toetscoördinator") |
| **Schaduwkaart-mismatch-visualisatie** | Unieke aanpak: activiteit blijft op huidige uitvoer-maand, maar krijgt schaduw-kaart op ideale klantmoment-maand. **Geen tool doet dit native** — Smaply/Custellence tonen issues alleen in detail | HOOG | Twee gelinkte kaarten met visueel verschil (gestippeld omlijnd voor schaduw, oranje accent per CLAUDE.md); klik op één toont mismatch-paneel met klantstem; verbindingslijn optioneel |
| **Ontbrekende-randvoorwaarden-veld met 4 vaste categorieën** | Smaply heeft "pain points" als vrije tags; wij dwingen categorisering af (systeem/data/proces/capaciteit) + impact-label (blokkerend/hinderlijk) | MEDIUM | Dropdown in detail-paneel; rood-label voor blokkerend (CLAUDE.md), grijs-amber voor hinderlijk; multi-randvoorwaarden per activiteit toegestaan |
| **Aggregaat-view: blokkers gegroepeerd per categorie** | TheyDo heeft "opportunities" maar geen categorische aggregaat; UXPressia heeft "insights" als losse blokken. Voor MT-besluitvorming is dit cruciaal | MEDIUM | Aparte tab/view naast de tijdlijn: vier kolommen (systeem/data/proces/capaciteit) met alle randvoorwaarden cross-cutting over reizen; klik op randvoorwaarde → naar bron-activiteit |
| **MT-only editorial designtaal** | Smaply en UXPressia zijn dashboard-druk; deze tool moet als een gedrukt boek werken voor MT-presentaties | MEDIUM | Inter overal, Source Serif 4 italic uitsluitend voor citaten, één accentkleur (#2E75B6 Cito-blauw), oranje voor mismatch, rood voor blokkerend — andere kleuren verboden; geen badges, geen iconen-soep |
| **Iteratieve structuur zonder code-aanpassing** | Geen van de referentie-tools laat het MT live tijdens een sessie een afdeling toevoegen/verwijderen of een klantreis toevoegen. Smaply vraagt admin-rechten, TheyDo heeft workflow-approvals | MEDIUM | Edit-modus toggle bovenin; alle structuur-elementen krijgen edit/delete-handles; geen versie-controle deze milestone (zie anti-features); state in localStorage |
| **Platform-context-awareness (LIB VO vóór aug 2026, Woots erna)** | Cito-specifiek: geen CJM-tool kent dit; toch belangrijk voor klantstap-tekst-validatie in de tijdlijn | LAAG | Geen automatische substitutie (te risicovol), maar wel een waarschuwing bij klantstap-edit als "LIB VO" wordt gebruikt in periode ≥ aug 2026 of vice versa |
| **Editorial PDF-export voor MT-presentaties** | Smaply/UXPressia hebben export, maar als dashboard-screenshots. Voor Cito-MT moet output als boek-pagina werken | MEDIUM | **Out of Scope deze milestone (per PROJECT.md)** — MT kijkt live mee. Bewaar als v2-feature. Niet bouwen, niet voorbereiden in dataschema |

### Anti-Features — bewust NIET bouwen, ook al hebben tools het wel

Features die in concurrent-tools standaard zijn, maar die deze milestone expliciet niet bouwt.

| Feature | Waarom vaak gevraagd | Waarom problematisch hier | Alternatief |
|---------|---------------------|---------------------------|-------------|
| **Authenticatie / login** | UXPressia, Smaply, TheyDo hebben SSO als standaard | Expliciet uit scope (PROJECT.md + Project_Klantreis_VO.md); login-stub schept verwachting van user-systeem dat er niet komt deze milestone | Geen login; lokale state per browser; één-MT-tegelijk-gebruik geaccepteerd risico |
| **Multi-user real-time collab** | Smaply, TheyDo, UXPressia tonen cursors van andere editors | Niet deze milestone; persistentie ontbreekt nog (lokale state); zou conflict-resolutie vereisen | MT bekijkt live samen op één scherm; één persoon edit per sessie |
| **AI-suggesties (klantstap-genereren, emotie-voorspellen)** | UXPressia heeft "AI Wizard"; TheyDo heeft AI-tagging; Smaply heeft AI templates | Deze milestone is ontwerp-validatie. AI-suggesties leiden de MT-discussie af van vorm-en-flow naar content-kwaliteit | Lege/placeholder-structuur per CLAUDE.md; MT vult later zelf in |
| **Versie/wijzigingshistorie** | TheyDo "versions", Smaply "history" | Komt expliciet met Supabase-stap (PROJECT.md key decision); nu invoeren zou state-management onnodig opblazen | Geen history-track; lokale state overschrijft. Browser undo (Ctrl-Z) op input-velden volstaat |
| **Comments/annotations op activiteiten** | TheyDo "comments", Smaply "annotations" — populair in CJM-tools | Geen multi-user, dus comments zijn singleton-notitie-veld dat alleen complexiteit toevoegt | Detail-paneel heeft "betrokken" en "klantverwachting" — voldoende voor MT-feedback in deze fase |
| **Klantsegmentatie binnen één reis** | UXPressia "personas in same map", Smaply "multi-persona comparison" | Heeft pas waarde als content gevuld is (Out of Scope per PROJECT.md); voegt structurele complexiteit toe | Drie reizen-tabs is voldoende segmentatie voor deze milestone |
| **Huidig-versus-toekomstig (as-is/to-be) splitsing** | UXPressia "current/future emotion graphs", Custellence "current/desired state" | **Expliciet verboden** in CLAUDE.md: tool toont uitsluitend gewenste reis 2025/2026; mismatches + ontbrekende randvoorwaarden zijn de plek waar verbeterverhaal leeft | Geen splitsing; mismatch-visualisatie + aggregaat-view dragen het verbeterverhaal |
| **Templates-bibliotheek voor andere sectoren** | Smaply en UXPressia hebben templates voor onboarding/B2C/B2B/SaaS | PO en Zakelijk zijn uit scope (PROJECT.md); generieke templates zouden VO-specifieke structuur verwateren | VO-specifiek hardcoded structuur; PO/Zakelijk pas later iteratie |
| **DIN-framework-koppeling** | — | Uit scope (Project_Klantreis_VO.md) — buiten huidige milestone | Geen DIN-velden in detail-paneel; geen link-out |
| **Real-time klantdata-integratie (NPS, CSAT)** | TheyDo en Cemantica koppelen met Qualtrics/Medallia | Geen data-bron beschikbaar; zou implementatie-complexiteit explosief verhogen | Klantcitaten handmatig invoerbaar — bewijst pijnpunt voldoende voor MT |
| **Stories/storyboard-lane** | Smaply "storyboard lane" (visuele illustraties per stap) | Toevoegen van afbeeldingen leidt af van vorm-en-flow-discussie; editorial designtaal verbiedt visuele drukte | Tekstuele klantstap volstaat; iconografie alleen voor kanaal |
| **Emotie-curve (continue lijn) i.p.v. dots/dots-per-maand** | UXPressia emotion graph, Smaply dramatic arc — beide tonen vloeiende curve | Curve suggereert continue meting; in werkelijkheid is emotie per maand een aanname van het MT. Dots zijn eerlijker en editorial-rustiger | 3-punts emotie-dot per maand: positief/neutraal/negatief; subtiele kleur (geen rood-groen-soep) |
| **Per-stap "opportunities" als losse cards** | TheyDo, UXPressia tagging van opportunities per step | Verwart met ontbrekende-randvoorwaarden-systeem dat we al hebben; zou twee parallelle verbeter-systemen creëren | Uitsluitend ontbrekende randvoorwaarden (4 categorieën); geen losse opportunity-tags |

---

## Feature-afhankelijkheden

```
Tijdlijn-layout (table stakes — fundament)
    └──vereist──> Fases-rij (header)
    └──vereist──> Maand-kolommen (aug–jul)

Klantstap-rij
    └──vereist──> Tijdlijn-layout
    └──verrijkt-door──> DMU-rij (differentiator)
    └──verrijkt-door──> Klantkanaal-indicator
    └──verrijkt-door──> Emotie-dot

Afdelings-swimlanes
    └──vereist──> Tijdlijn-layout
    └──vereist──> Line of Visibility
    └──bevat──> Activiteit-kaarten
        └──opent──> Activiteit-detail-paneel
            └──bevat──> Standaard detail-velden
            └──bevat──> Ontbrekende-randvoorwaarden-veld
                └──voedt──> Aggregaat-view blokkers
            └──bevat──> Klantcitaten

Schaduwkaart-mismatch
    └──vereist──> Activiteit-kaarten op twee maanden (huidig + ideaal)
    └──vereist──> Activiteit-detail-paneel met mismatch-sectie
    └──conflicteert-met──> Strikte één-activiteit-per-cel (moet duo's toestaan)

Klantreis-tabs
    └──vereist──> Volledig onafhankelijke state per tab (drie volledige tijdlijnen)
    └──vereist──> localStorage met namespace per reis

Inline structuur-editing (lanes/fases/reizen)
    └──vereist──> Edit-modus toggle
    └──vereist──> Bevestigings-dialog bij delete
    └──conflicteert-met──> Hardcoded structuur — alles moet data-gedreven

Filters
    └──vereist──> Tagging-data op activiteit-kaarten (afdeling, status, blokker)
    └──vereist──> Filterbar-component

Lokale state-persistence
    └──vereist──> Stabiele ID's per element (genereren bij creatie, niet bij render)
    └──vereist──> Schema-versie-veld (voor latere Supabase-migratie zonder data-loss)
```

### Afhankelijkheid-toelichting

- **Schaduwkaart vereist twee-kaart-rendering per activiteit:** de huidige uitvoer-kaart blijft op zijn maand, de schaduw verschijnt op de ideale-maand. Het datamodel moet dit als één entiteit beheren maar als twee visuele kaarten renderen — kritieke ontwerpbeslissing voor componenten-architectuur.
- **Aggregaat-view voedt zich uit detail-paneel-data:** zonder ontbrekende-randvoorwaarden-veld op activiteit-niveau is de aggregaat-view leeg. Bouw eerst de detail-velden, dan de aggregaat.
- **Inline-editing conflicteert met hardcoded structuur:** vanaf dag één moeten lanes/fases/reizen uit een data-structuur komen die mutbaar is. Niet als "we hardcoden eerst, dynamisch maken we later" — dat blokkeert de MT-discussie precies waar flexibiliteit nodig is.
- **localStorage namespace-isolatie:** drie reizen-tabs delen geen state; elk tabblad heeft eigen lanes/fases/activiteiten. Geen "globale lanes" — dat ontneemt het MT vrijheid om per reis te verschillen.

---

## MVP-definitie

### Launch With (deze milestone — v1)

Minimaal nodig om MT-validatie van het ontwerp te krijgen.

- [ ] **Tijdlijn-layout met 12 maandkolommen + fases-rij** — zonder dit geen visuele basis
- [ ] **Line of Visibility tussen klant- en organisatie-perspectief** — kernprincipe uit CLAUDE.md
- [ ] **Klantstap-rij met eerste-persoon-tekstvelden** — outside-in lens
- [ ] **DMU-rij beslisser/beïnvloeder/gebruiker per maand** — differentiator
- [ ] **Klantkanaal-indicator + emotie-dot per klantstap** — table stakes voor CJM-herkenning
- [ ] **Vijf afdelings-swimlanes onder de lijn** — Marketing/Sales/Productmanagement/Toetstekunde/Customer Success
- [ ] **Activiteit-kaarten in lane-maand-cellen (placeholder-content)** — structuur zichtbaar zonder Cito-content
- [ ] **Activiteit-detail-paneel met alle CLAUDE.md verplichte velden** — eigenaar/betrokken/DMU/klantverwachting/KPI/opdrachtdocument-status/ontbrekende-randvoorwaarden
- [ ] **Klantcitaten in detail-paneel (Source Serif 4 italic)** — bewijs van pijnpunt
- [ ] **Schaduwkaart-mismatch-visualisatie + mismatch-paneel** — kerndifferentiator voor verbeterverhaal
- [ ] **Aggregaat-view: ontbrekende randvoorwaarden per categorie** — MT-besluitvormingsondersteuning
- [ ] **Drie klantreizen-tabs (bestaand/nieuw/bestuur)** — scope-fix per CLAUDE.md
- [ ] **Inline structuur-editing (lanes/fases toevoegen, hernoemen, verwijderen)** — kritisch voor MT-iteratie
- [ ] **Klantreis-tabs toevoegen/hernoemen** — symmetrisch met lanes/fases
- [ ] **Filterbar (afdeling, blokker-toggle)** — voor focus tijdens MT-discussie
- [ ] **localStorage persistence** — MT komt terug met aantekeningen tussen sessies
- [ ] **Editorial designtaal volledig toegepast** — Inter, Source Serif 4 italic, één accentkleur Cito-blauw, oranje voor mismatch, rood voor blokkerend

### Add After Validation (v1.x — na MT-akkoord op ontwerp)

Features die wachten tot het ontwerp gevalideerd is.

- [ ] **Supabase-persistentie + Next.js-overstap** — zodra MT zegt "dit ontwerp werkt"
- [ ] **Echte Cito-content invullen** — eerst akkoord op vorm, dan inhoud
- [ ] **PDF-export voor MT-presentaties** — wanneer ontwerp stabiel is en de export pijnloos uit React-tree te genereren
- [ ] **Status-filter met meerdere statussen (concept/lopend/afgerond)** — als content gevuld is

### Future Consideration (v2+ — verre toekomst)

Features die pas zinvol zijn ná Supabase-stap en content-invulling.

- [ ] **Multi-user collab + presence** — wanneer Supabase + auth er staan
- [ ] **Wijzigingshistorie en audit-trail** — met Supabase
- [ ] **Cito-SSO koppeling** — strategische beslissing, geen feature
- [ ] **PO- en Zakelijk-sectoren als parallelle instrumenten** — apart project per sector, geen generieke sectorstructuur in dit instrument
- [ ] **DIN-framework-koppeling** — afhankelijk van programmamanagement
- [ ] **Klantsegmentatie binnen één reis** — wanneer content rijp is
- [ ] **Comments/annotations** — pas wanneer multi-user reëel is

---

## Feature-prioriteringsmatrix

| Feature | Gebruikerswaarde | Implementatiekost | Prioriteit |
|---------|------------------|-------------------|------------|
| Tijdlijn-layout (maanden + fases) | HOOG | LAAG | P1 |
| Line of Visibility | HOOG | LAAG | P1 |
| Klantstap-rij eerste persoon | HOOG | LAAG | P1 |
| DMU-rij | HOOG | MEDIUM | P1 |
| Emotie-dot + klantkanaal | MEDIUM | LAAG | P1 |
| Afdelings-swimlanes (5) | HOOG | LAAG | P1 |
| Activiteit-kaarten + detail-paneel | HOOG | MEDIUM | P1 |
| Detail-velden (alle CLAUDE.md verplichte) | HOOG | MEDIUM | P1 |
| Klantcitaten in detail | HOOG | LAAG | P1 |
| Schaduwkaart-mismatch | HOOG | HOOG | P1 |
| Ontbrekende-randvoorwaarden + 4 categorieën | HOOG | MEDIUM | P1 |
| Aggregaat-view blokkers | HOOG | MEDIUM | P1 |
| Drie klantreizen-tabs | HOOG | LAAG | P1 |
| Inline structuur-editing | HOOG | MEDIUM | P1 |
| Editorial designtaal | HOOG | MEDIUM | P1 |
| localStorage persistence | MEDIUM | LAAG | P1 |
| Filterbar | MEDIUM | MEDIUM | P2 |
| Platform-context-waarschuwing (LIB/Woots) | LAAG | LAAG | P2 |
| Status-filter meerdere statussen | LAAG | LAAG | P3 |
| PDF-export | MEDIUM | HOOG | P3 |
| Comments/annotations | LAAG | MEDIUM | P3 (anti) |
| AI-suggesties | LAAG | HOOG | nooit |
| Auth/login | nul | HOOG | nooit (deze milestone) |
| Versie-history | LAAG | HOOG | nooit (deze milestone) |

**Prioriteit-sleutel:**
- **P1:** Must-have voor MT-validatie van het ontwerp
- **P2:** Should-have, toevoegen als P1 klaar is en tijd over is
- **P3:** Nice-to-have, alleen als MT er expliciet om vraagt
- **nooit:** Per scope/CLAUDE.md uitgesloten deze milestone

---

## Concurrent-feature-analyse

| Feature | Smaply | UXPressia | Custellence | TheyDo | Onze aanpak |
|---------|--------|-----------|-------------|--------|-------------|
| Tijdlijn-layout | Free-form lanes, geen vaste maanden | Stages-met-fasen | Stages met free-form columns | Stages met phases | Vaste 12-maand-kolommen aug–jul + fases-header (editorial) |
| Emotie-tracking | Curve (dramatic arc) | Curve met emotion-wheel (8 basis) | Dots per stap | Niet primair | 3-puntsschaal dots per maand — editorial rustig |
| DMU-ondersteuning | Geen native | Multi-persona maar geen rol-onderscheid | Geen | Personas + roles, maar niet als rij | Eigen DMU-rij met 3 sub-rijen beslisser/beïnvloeder/gebruiker |
| Service Blueprint backstage | "Backstage process lane" | "Backstage actions" template | Volledig service-blueprint-template | Operations swimlanes | Vijf afdelings-lanes met activiteit-kaarten |
| Mismatch-visualisatie | Pain-point-tag op stap | Insight-block | Opportunity-card | Opportunity tagged to step | **Schaduwkaart op ideale-maand + mismatch-paneel** (uniek) |
| Ontbrekende randvoorwaarden | Vrije pain-points | Goals/problems velden | Improvement-cards | Opportunities + ownership | **4 vaste categorieën + impact-label** (uniek) |
| Aggregaat-view blokkers | Pain-point-overzicht | Insights-tab | Improvements-list | Opportunities-board met scoring | **Categorische 4-koloms aggregaat per categorie** |
| Inline structuur-editing | Drag-drop lanes | Add/remove lanes via menu | Volledig CRUD | Workflow-approval flow | **Direct edit-modus, geen approval, lokale state** |
| Klantcitaten | Quote-veld op stap | Quote-section per stage | Quote-tag | Verbatim feedback link | **Source Serif 4 italic in detail-paneel + optioneel inline icoon** |
| Multi-journey navigatie | Hierarchies | Collections | Journey-list | Journeys-tab | **Drie vaste tabs** (geen onbeperkte uitbreiding) |
| Filters | Tag-filters | Tag-filters | Status-filters | Geavanceerd filter-systeem | **Afdeling + blokker-toggle** (minimaal) |
| AI-features | AI-templates | AI Wizard | Niet | AI tagging + summarization | **Geen** (afleidend) |
| Designtaal | Dashboard-druk, veel kleuren | Dashboard-druk | Schoner dan UXPressia | Enterprise-tool look | **Editorial: Inter + Source Serif 4 italic, één accentkleur** |

### Waar wij van afwijken — en waarom

1. **Geen emotie-curve, wel dots.** UXPressia/Smaply tonen vloeiende emotie-curves die suggereren continue meting. Voor MT-discussie waar emotie een aanname is, zijn dots eerlijker en visueel rustiger — past bij editorial designtaal.

2. **Schaduwkaart i.p.v. pain-point-tag.** Concurrenten labelen pijnpunten op de plek waar de organisatie actie onderneemt. Wij plaatsen de schaduw waar de klant de actie verwacht. Dit maakt de mismatch ruimtelijk zichtbaar — het verbeter-gesprek krijgt geografie.

3. **Vier vaste categorieën i.p.v. vrije tags.** Vrije tags geven flexibiliteit maar leveren bij MT-aggregatie chaos op. Vier categorieën (systeem/data/proces/capaciteit) dwingen tot scherp denken en maken de aggregaat-view direct bruikbaar voor investeringsbesluiten.

4. **Drie vaste reizen-tabs i.p.v. onbeperkte journeys.** Smaply/TheyDo laten gebruikers oneindig journeys aanmaken. CLAUDE.md fixeert drie. Dit voorkomt scope-creep tijdens MT-sessies en houdt aandacht bij de drie strategisch gekozen klantreizen.

5. **Editorial designtaal i.p.v. dashboard-rich.** Concurrenten tonen tientallen kleuren, badges, iconen — geschikt voor designers in dagelijks werk. Onze tool wordt 4–6× per jaar in MT-sessies geprojecteerd; het moet leesbaar zijn als een pagina in een boek, niet als een Jira-bord.

---

## Bronnen

- [Smaply lane-systeem en templates](https://helpdesk.smaply.com/support/solutions/articles/22000242400-templates-and-examples) — referentie voor lane-types (text/channels/emotional/backstage)
- [Smaply Customer Journey Management Platform](https://www.smaply.com/) — service blueprint capabilities
- [UXPressia experience section + emotion wheel](https://help.uxpressia.com/en/articles/2727499-experience-section) — emotie-tracking met 8 basis-emoties
- [UXPressia vs Custellence comparison](https://help.uxpressia.com/en/articles/3379679-uxpressia-vs-custellence) — feature-diff tussen tools
- [Custellence Service Blueprint Template](https://www.custellence.com/service-blueprint-template/) — backstage swimlane-aanpak
- [TheyDo Journey Management Platform](https://www.theydo.com/) — opportunity-tagging en gap-analyse
- [TheyDo Customer Journey Management](https://www.theydo.com/customer-journey-management) — orchestration patterns
- [NN/G Service Blueprints Definition](https://www.nngroup.com/articles/service-blueprints-definition/) — line of visibility standaard sinds Shostack 1984
- [NN/G Service Blueprinting FAQ](https://www.nngroup.com/articles/service-blueprinting-faq/) — swimlane-conventies
- [UXPressia Touchpoints and channels](https://uxpressia.com/blog/touchpoints-and-channels-customer-journey-mapping) — kanaal-iconografie best practices
- [Wikipedia Service blueprint](https://en.wikipedia.org/wiki/Service_blueprint) — historische en methodologische grondslag
- [Miro Service Blueprint Guide](https://miro.com/customer-journey-map/how-to-make-effective-service-blueprints/) — multi-lane patterns
- [Lucidchart Service blueprint swimlanes templates](https://www.lucidchart.com/pages/templates/service-blueprint-with-swimlanes) — visuele lane-conventies
- [FlowMapp blog: What is a Customer Journey Map](https://www.flowmapp.com/blog/qa/what-is-customer-journey-map) — features overview
- [NN/G Journey Mapping 101](https://www.nngroup.com/articles/journey-mapping-101/) — table stakes voor CJM-tools

---

*Feature-onderzoek voor: Klantreis VO — Klant in Beeld (Cito), milestone UI-design prototype*
*Onderzocht: 2026-05-14*
*Volgende stap: deze FEATURES.md voedt REQUIREMENTS.md met categorisatie P1/P2/P3 en complexiteits-schattingen*
