# Pitfalls Research — Klantreis VO (MT-validatie UI-prototype)

**Domein:** Interactief klantreis-visualisatie-instrument voor MT-besluitvorming (Cito VO, Klant in Beeld)
**Onderzocht:** 2026-05-14
**Confidence:** HIGH (gebaseerd op expliciete regels in `CLAUDE.md`, scope-document, en bekende patronen uit CJM/Service Blueprint-praktijk)

> Deze valkuilen zijn specifiek voor het bouwen van een **UI-prototype dat een MT moet valideren** voordat er echte content of een Supabase-backend bij komt. Generieke React-valkuilen staan er niet in tenzij ze acuut raken aan dit prototype.

---

## Critical Pitfalls

De zeven valkuilen hieronder zijn project-killers: ze verhinderen MT-akkoord of maken de implementatiefase onnodig duur.

### Pitfall 1: CJM die te druk wordt om in MT te bespreken

**What goes wrong:**
Het MT zit voor een tijdlijn met twaalf maanden, drie klantreizen-tabs, vijf afdelings-lanes, een DMU-rij, klantkanaal-rij, emotie-curve, mismatch-schaduwkaarten en placeholder-activiteiten in elke cel. Visuele overload. Er ontstaat geen gesprek over structuur — er ontstaat een gesprek over "ik snap niet wat ik zie." De sessie eindigt zonder akkoord en met "stuur het nog eens door, dan kijken we er individueel naar."

**Why it happens:**
CJM-tools verleiden tot completheid: alles wat een klantreis kan beschrijven wordt zichtbaar in beeld gezet. Bij MT-validatie is het tegenovergestelde nodig — selectieve toonbaarheid. Daarnaast: een prototype moet "rijk" lijken om geloofwaardig te zijn, maar rijk ≠ overweldigend.

**How to avoid:**
- Eén tab tegelijk standaard zichtbaar (bestaande klanten als default), de andere twee als visueel rustige tabs ernaast — niet drie tabs tegelijk uitvouwen.
- Maximaal vier informatie-rijen boven de lijn in default-weergave: klantstap, DMU, kanaal, emotie. Schaduwkaarten en mismatch-paneel zijn klik-onthuld, niet altijd zichtbaar.
- Afdelings-lanes onder de lijn beginnen ingeklapt of met max. drie activiteiten per maand zichtbaar — "toon meer" voor de rest.
- Een "MT-modus" toggle die alles dimt behalve de focuselementen die voor besluitvorming relevant zijn (mismatch-aggregaat, ontbrekende randvoorwaarden, totaal-overzicht).

**Warning signs:**
- Eerste interne test: iemand zegt "waar moet ik kijken?" binnen 5 seconden.
- Schermafdruk op A3 print past niet — alles wordt 8pt-tekst.
- Default-weergave heeft meer dan ~9 verschillende kleur/typografie-niveaus zichtbaar tegelijk.

**Phase to address:**
Fase 1 (UI-architectuur en informatie-hiërarchie) — vóór invulling van placeholder-activiteiten.

---

### Pitfall 2: MT discussieert over inhoud in plaats van ontwerp

**What goes wrong:**
Het MT zit voor het prototype met placeholder-tekst als "Activiteit X — kwartaaloverleg sectievoorzitters." Een MT-lid zegt: "Maar het is geen sectievoorzitter, het is een toetscoördinator." Tien minuten later discussieert het MT over of de Marketing-afdeling überhaupt iets doet in november. De ontwerp-validatie is gekaapt door content-validatie. Sessie levert geen akkoord op de UI op — alleen een lijst content-correcties die het MT-akkoord op het ontwerp eigenlijk niet hadden mogen blokkeren.

**Why it happens:**
Mensen reageren op het concrete vóór het abstracte. Realistische placeholder-tekst nodigt uit tot inhoudelijke discussie; het brein kan "het ontwerp" niet los zien van "de woorden die in het ontwerp staan." Daarnaast: het v10-prototype had wél realistische voorbeeldcontent, en de neiging is om dat over te nemen omdat het "professioneler" oogt.

**How to avoid:**
- Bewust generieke placeholder-stijl: "Klantstap A.1", "Activiteit M-03", "DMU-citaat hier" — niet realistische zinnen. Lelijk genoeg om duidelijk te maken dat dit een ontwerp-prototype is, niet een content-blueprint.
- Visuele "demo-banner" in beeld die het MT continu herinnert: "Inhoud is placeholder. Vandaag valideren we structuur en flow."
- Briefing-slide vóór het MT-gesprek: hier zijn de drie vragen voor vandaag — (1) klopt de tweedeling boven/onder de lijn, (2) klopt het detail-paneel-schema voor een activiteit, (3) zijn de drie tabs de juiste reizen. Niet over content.
- Facilitator (Pim) interrumpeert content-feedback met: "noteer ik voor later, nu eerst ontwerp."

**Warning signs:**
- In een interne pre-MT-test schrijft de tester verbeteringen op individuele activiteit-teksten op in plaats van op de structuur.
- Placeholder-tekst is zó realistisch dat een MT-lid niet doorheeft dat het placeholder is.
- Discussie-log van de sessie heeft >40% content-issues en <60% ontwerp-issues.

**Phase to address:**
Fase 2 (content-strategie voor placeholder) — vóór MT-sessie. Tevens fase 5 (MT-validatie-proces) — facilitator-script en briefing-slide.

---

### Pitfall 3: Consensus-paralyse — "iedereen-achter-staan" als zelfblokkerend criterium

**What goes wrong:**
Het project-doel is "MT moet collectief achter het UI-ontwerp kunnen staan." Bij vier MT-leden met elk eigen voorkeuren betekent collectief in de praktijk: iedere afdeling wil zijn lane prominenter, iedereen wil één extra detail-veld, iedereen wil het zijn-eigen-favoriet-aanpassing. De zoektocht naar 100% akkoord blokkeert iedere beslissing. Project schuift door, MT raakt vermoeid, momentum verdwijnt.

**Why it happens:**
"Achter het ontwerp staan" wordt geïnterpreteerd als "alle voorkeuren erin verwerkt." Dat is geen consensus — dat is een Frankenstein-compromis. Bovendien: zonder vooraf gedefinieerde beslis-rechten (wie heeft tie-break?) gaat MT-overleg dichttimmeren op meningen in plaats van op rollen.

**How to avoid:**
- Vooraf expliciet maken wat "akkoord" betekent: "Goed genoeg om de tech-fase mee in te gaan, niet perfect." Het is een go/no-go op de structuur, geen consensus op iedere knop.
- Vooraf een eigenaar van het ontwerp benoemen (Pim of sectormanager VO) die tie-break-bevoegdheid heeft op visuele/ontwerp-keuzes binnen de scope-grenzen die in `CLAUDE.md` staan.
- Sessie-format dat structureel uit elkaar trekt: eerst onafhankelijk reageren via een korte checklist (sticky notes / Miro), dan groepsdiscussie. Voorkomt groupthink en zichtbaarheid wie wat vindt.
- Drie beslis-niveaus expliciet maken vooraf: (a) structureel akkoord nodig (tabs, tweedeling, designtaal), (b) iteratief in volgende fase (lane-volgorde, default-collapse-states), (c) post-launch tweakbaar (kleuren-tuning, kleine wording).

**Warning signs:**
- Sessie loopt uit door discussie over een enkel veld in het activiteit-detail-paneel.
- Twee MT-leden hebben directe meningverschillen die niemand durft te beslechten.
- "We gaan er nog eens individueel naar kijken" wordt het einde van twee opvolgende sessies.

**Phase to address:**
Fase 5 (MT-validatie-proces) — vóór de eerste sessie schriftelijk vastleggen welke beslissingen het MT collectief neemt en welke door de eigenaar.

---

### Pitfall 4: Lokale-state design dat niet migreerbaar is naar Supabase

**What goes wrong:**
Voor de UI-fase wordt lokale React state-shape gekozen die qua componentmodel handig is — bijvoorbeeld een diepe genest object per klantreis met inline arrays voor lanes, fases, activiteiten en mismatch-relaties. Komt fase 2 (Supabase-implementatie): blijkt deze shape onmogelijk normaal te normaliseren zonder de hele UI te herschrijven. Mismatch-relaties zijn als inline objecten geschreven, niet als referenties naar activity-IDs; DMU-leden zijn strings ipv FK's. Migratie kost 1-2 sprints aan herschrijfwerk.

**Why it happens:**
"Het is maar lokale state, we gaan toch herschrijven" → ontwerp-laksheid. In de praktijk leidt herontwerp tot scope-creep en lijkt het cheaper to keep her. Bovendien: React component-trees suggereren genest data, terwijl relationele backend platte tabellen wil.

**How to avoid:**
- Definieer in fase 1 een **datamodel-contract** (TypeScript types) dat al een relationele shape heeft met IDs en foreign-key-achtige references — ook als die nu nog in een `Map<id, entity>` in localStorage zitten. Zo'n contract is voor 80% letterlijk overzetbaar naar Supabase tabellen.
- Activiteit ↔ mismatch ↔ randvoorwaarde ↔ DMU-lid: allemaal aparte entiteiten met IDs vanaf dag 1.
- Eén "store" laag (Zustand of een context-provider) tussen UI-componenten en de data — die kun je later vervangen door Supabase-queries zonder UI te raken.
- Geen inline-data in component-files; alle seed/placeholder-data in een aparte `data/` map die straks een Supabase-fixture wordt.

**Warning signs:**
- Een component ontvangt props die diep-genest >3 lagen klantreis-data bevat.
- "Welke activiteit hoort bij deze mismatch?" vereist een geneste array-find ipv een ID-lookup.
- Het toevoegen van een lane vereist edits in vier verschillende plekken in de code.

**Phase to address:**
Fase 1 (UI-architectuur en datamodel-contract) — vóór er één component wordt gebouwd. Het is goedkoper om dit vooraf te ontwerpen dan later te herschrijven.

---

### Pitfall 5: Inline editing-flows die overweldigen of dataverlies veroorzaken

**What goes wrong:**
Iteratieve aanpasbaarheid (lanes, fases, klantreizen toevoegen/hernoemen/verwijderen) is een kern-feature. In het prototype is dat geïmplementeerd als "klik op een rand, ga in edit-mode, tab voor volgende veld." Tijdens MT-sessie klikt iemand per ongeluk op een lane-label, typt een letter, druk Esc → de lane heet nu "M" en de undo werkt niet. Of: iemand voegt een fase toe, klikt elders, alles is weg omdat er geen save-state was. Vertrouwen in het prototype kelderd onmiddellijk: "kunnen we hier wel iets in doen zonder kapot te maken?"

**Why it happens:**
Inline editing voelt elegant maar vraagt om edge-case-engineering: focus-management, blur-saves, escape-restore, undo-stack, optimistic UI met rollback. In een prototype wordt dat overgeslagen.

**How to avoid:**
- Edit-mode expliciet maken (potlood-icoon → klik → veld actief), niet impliciet (klik op tekst → edit).
- Save-on-blur **en** Esc = revert. Beide implementeren.
- LocalStorage-snapshot vóór iedere structuur-aanpassing (lane/fase/reis-mutatie). Eén-klik undo-knop in beeld die laatste 5 snapshots toont.
- Read-only modus als default; expliciete "Bewerken" toggle die het hele prototype in edit-modus zet — MT-sessie zelf staat in read-only zodat niemand per ongeluk wat sloopt.
- Confirm-dialog voor destructieve acties: lane verwijderen, fase verwijderen, reis verwijderen.

**Warning signs:**
- Tester verandert in test per ongeluk iets en kan niet uitleggen hoe het terug komt.
- Geen zichtbare "opgeslagen"-state of "wijzigingen niet opgeslagen"-waarschuwing.
- F5 / refresh tijdens edit-mode → verlies van wijziging.

**Phase to address:**
Fase 4 (inline editing en structuur-mutaties) — expliciet aparte fase, niet als bijkomstigheid van een UI-fase.

---

### Pitfall 6: Mismatch-visualisatie die verwarrend is in plaats van inzichtgevend

**What goes wrong:**
Mismatches (activiteit valt op verkeerde maand) zijn een kern-mechaniek: schaduwkaart in de ideale maand + mismatch-paneel met klantstem. Maar als de schaduwkaart visueel niet duidelijk verschilt van een gewone kaart, of als hij in dezelfde lane staat als de oorspronkelijke activiteit, of als de visuele verbinding "deze schaduw hoort bij die activiteit" ontbreekt, dan ziet het MT dubbele activiteiten ipv mismatches. De boodschap "we doen dit op een suboptimaal moment" landt niet; in plaats daarvan landt: "is dit een fout in het schema?"

**Why it happens:**
Mismatch is een tweede-orde concept (relatie tussen twee plekken in dezelfde tijdlijn) en die zijn visueel notoir moeilijk. Oranje als kleurmarkering helpt, maar zonder vorm/positie/connector werkt het niet.

**How to avoid:**
- Schaduwkaart visueel duidelijk gestyleerd: gestippelde rand, lichtere achtergrond, oranje accent — direct herkenbaar als "dit hoort hier eigenlijk niet, maar zo zou het moeten."
- Connectie-lijn (dunne curve in oranje) van de werkelijke activiteit naar de schaduwkaart. Bij hover over één van beide: andere oplicht.
- Activiteit zelf draagt een mismatch-indicator (klein driehoekje of label) die aanklikbaar het mismatch-paneel opent.
- Mismatch-paneel verplicht klantcitaat tonen — dat is de hele "waarom" van het ontwerp. Zonder citaat is mismatch slechts een planning-issue.
- Eén voorbeeld mismatch in detail uitwerken in het prototype (zoals: verlengingsoffertes in april versus klantverwachting november), niet vijftien half-uitgewerkte.

**Warning signs:**
- Tester vraagt "waarom staat deze kaart twee keer?"
- Schaduwkaart en oorspronkelijke activiteit zien er nagenoeg hetzelfde uit op een schermafdruk in zwart-wit.
- Klantcitaat ontbreekt in een mismatch-voorbeeld.

**Phase to address:**
Fase 3 (mismatch-mechaniek en visuele taal) — apart van de basis-tijdlijn omdat het een eigen ontwerp-vraagstuk is.

---

### Pitfall 7: Outside-in-claim die binnenshuis vergeten wordt

**What goes wrong:**
Het project claimt outside-in als leidende lens: klant komt eerst naar voren, niet als afgeleide van wat Cito doet. Maar in de UI staan de Cito-afdelings-lanes prominent onderin, en gaande de ontwikkeling sluipen er allerlei Cito-jargon ("opdrachtdocument-status," "Customer Success-flow," interne KPI's) in het detail-paneel terwijl klantstemmen één regel ergens onderaan staan. Eindresultaat oogt als een Service Blueprint met een dun klant-laagje erbovenop — niet als een klantreis met afdelings-actiekader.

**Why it happens:**
Cito-medewerkers bouwen, dus Cito-perspectief is de natuurlijke lens. Iedere nieuwe feature komt vanuit "wat moet de afdeling weten" niet "wat ervaart de klant." Outside-in vereist actieve discipline, niet alleen een principe.

**How to avoid:**
- Visueel gewicht: klantstap in eerste persoon staat **bovenaan**, in een gewicht/typografie dat letterlijk groter en prominenter is dan de afdelings-lanes onderin.
- Klantcitaat is een terugkerend element, niet een uitzondering — komt in default-weergave terug bij iedere fase waar een sleutel-moment is.
- Detail-paneel begint met "Wat verwacht de klant?" als eerste veld, niet als veld nummer 4 onder "eigenaar / betrokken / DMU."
- Reviewer-discipline: voor iedere nieuwe UI-toevoeging vraag: "Is dit ingegeven door wat Cito wil zien, of door wat de klant ervaart?" Als alleen het eerste → re-frame.
- Bij MT-sessie: één expliciete check-vraag: "Lees deze klantreis hardop voor — herken je hier de klant in, of zie je vooral Cito?"

**Warning signs:**
- Het detail-paneel heeft meer Cito-velden dan klant-velden.
- Klantcitaten alleen in mismatch-paneel zichtbaar, niet in de hoofdtijdlijn.
- Een buitenstaander die de tool ziet, leest het als "Cito's eigen planning" ipv "klantreis."

**Phase to address:**
Fase 1 (informatie-hiërarchie en designtaal) — en als terugkerende reviewer-vraag in elke volgende fase.

---

## Moderate Pitfalls

### Pitfall 8: Drie klantreizen vs. één gedeelde visualisatie — onduidelijke keuze

**What goes wrong:**
Op MT-niveau wil men "bestaande klanten" en "nieuwe klanten" en "bestuur op stichtingsniveau" naast elkaar zien om strategisch te prioriteren. Drie aparte tabs dwingen sequentieel kijken; één visualisatie met drie reizen door elkaar wordt chaotisch.

**How to avoid:**
- Default = drie tabs (één tegelijk zichtbaar) plus een aparte "aggregaat-view" tab die alle drie reizen langs dezelfde tijdas toont in compacte vorm, alleen mismatch-aggregaat en ontbrekende randvoorwaarden zichtbaar. Niet alle details samen.
- Toggle "Vergelijk reizen" verplicht expliciet — niet de default.

**Phase to address:** Fase 1 (UI-architectuur).

---

### Pitfall 9: Emotie-curve die niet aansluit op besluitvorming

**What goes wrong:**
CJM-tradities tekenen vaak een emotie-curve (smiley/frownie of golfvorm). Het ziet er rijk uit maar leidt zelden tot besluitvorming — "de klant is in maart ongelukkig, dus..." wat dan? Zonder koppeling aan een actie of mismatch is de curve decoratie.

**How to avoid:**
- Emotie-indicator gekoppeld aan een specifiek moment of citaat, niet als doorlopende curve. Klantstem-citaat is de eigenlijke "emotie" — getoond als kort blok onder de klantstap waar het pijn doet.
- Emotie is een rij, geen golf. Per maand een eenvoudige indicator (— / neutraal / +) en niet meer.

**Phase to address:** Fase 1 (UI-architectuur, ontwerp van bovenliggende rijen).

---

### Pitfall 10: Service Blueprint waarbij swimlanes elkaar overschreeuwen

**What goes wrong:**
Vijf afdelings-lanes onder de lijn, ieder met meerdere activiteiten per maand, met badges voor eigenaar, status, KPI, randvoorwaarde-categorie → 5 × 12 × 4 elementen = 240 visuele eenheden onder de lijn. De Service Blueprint domineert de UI; CJM verdwijnt visueel.

**How to avoid:**
- Lanes default ingeklapt of met max-3-activiteiten zichtbaar per cel.
- Iedere activiteit-kaart toont in default alleen: titel + één status-indicator + één optionele randvoorwaarde-marker. Geen badge-explosie.
- Boven/onder-verhouding visueel uitgebalanceerd: niet meer dan 60% scherm-real-estate voor de Service Blueprint.

**Phase to address:** Fase 1 (UI-architectuur en lane-design).

---

### Pitfall 11: Te veel labels/badges/kleur-overload (anti-editorial)

**What goes wrong:**
Iedere afdeling krijgt eigen kleur. Iedere status krijgt eigen badge. Iedere randvoorwaarde-categorie krijgt eigen icoon. Schaduwkaarten + mismatch-driehoekjes + DMU-letters + status-pellen → het MT ziet een dashboard, niet een editorial werkstuk.

**How to avoid:**
- Strikt vasthouden aan de regels in `CLAUDE.md`: één accentkleur (Cito-blauw), oranje uitsluitend mismatch, rood uitsluitend blokkerend. Geen afdeling-eigen kleuren — afdelingen onderscheiden zich door lane-positie en label, niet door kleur.
- Badges hooguit twee soorten in default-weergave: blokkerend (rood) en mismatch (oranje). De rest is tekst of niet zichtbaar.
- Reviewer-vraag bij elke UI-toevoeging: "Wat verlies ik als ik dit weghaal? Niets → weghalen."

**Phase to address:** Fase 1 (designtaal en visuele hygiëne).

---

### Pitfall 12: Onvolledig prototype waardoor MT niet kan beoordelen

**What goes wrong:**
Tegenovergesteld van pitfall 1: in de wens om "schoon" te blijven mist het prototype een functioneel detail-paneel, of toont het mismatch alleen verbaal, of de aggregaat-view is leeg. MT zegt: "ik kan dit zo niet beoordelen, ik mis te veel." Sessie levert geen feedback op want het MT weet niet wat er nog komt.

**How to avoid:**
- Het prototype dekt **alle scope-items** in zichtbare staat, ook al is de invulling placeholder. Drie reizen-tabs, twaalf maanden, vijf lanes, mismatch-voorbeeld, aggregaat-view, detail-paneel, inline-edit aan minimaal één lane/fase/reis-element gedemonstreerd.
- Aparte "completeness checklist" voor het prototype zelf: alle UI-elementen uit scope-document in een test-state aanwezig.
- Demoscript voor MT-sessie: 10 min walk-through waarin élk hoofdelement één keer wordt aangeraakt.

**Phase to address:** Fase 6 (preflight checklist vóór MT-sessie).

---

### Pitfall 13: Validatie zonder gestructureerde feedback-loop → geen iteratie mogelijk

**What goes wrong:**
MT-sessie loopt af. Iemand zegt "ik vond het mooi, paar dingen anders." Geen aantekeningen, geen gestructureerd format, geen prioritering. Tussen sessie en revisie verdwijnt 60% van de feedback in koffiehoekjes. Volgende sessie: MT vraagt "wat heb je gedaan met onze input?" → ongemakkelijk antwoord.

**How to avoid:**
- Voor de sessie: per MT-lid een korte sjabloon (papier of digitaal) met drie kolommen: (1) tweedeling boven/onder klopt? — ja/nee + reden, (2) drie tabs juiste reizen? — ja/nee + reden, (3) detail-paneel-velden compleet? — ja/nee + reden. Specifieke vragen, geen open einde.
- Na de sessie: feedback gestructureerd in één document (in het project `.planning/research/MT_FEEDBACK_R1.md`), per item gekoppeld aan een go/no-change/iterate-besluit.
- Iteratie-cadans expliciet: "tussen R1 en R2 zit 1 week, R2 is gepland op datum X."

**Phase to address:** Fase 5 (MT-validatie-proces) — feedback-sjabloon en feedback-document zijn artefacten.

---

### Pitfall 14: Schooljaar-tijdlijn (aug-jul) gerenderd als kalenderjaar (jan-dec)

**What goes wrong:**
React-componenten ontvangen een lijst maanden. Default JavaScript Date-objecten beginnen bij januari. Zonder expliciete schooljaar-ordering staat september bij maand 9 ipv maand 2. Visueel ziet niemand het direct, maar mismatch-berekeningen lopen vast: "moet plaatsvinden in november" valt verkeerd uit als de array kalenderjaar-geordend is.

**How to avoid:**
- Eén centrale constante: `SCHOOLJAAR_MAANDEN = ['aug', 'sep', 'okt', 'nov', 'dec', 'jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul']` — gebruik deze overal, nergens een raw Date-object.
- Maand-index altijd ten opzichte van schooljaar: aug = 0, jul = 11. Conversie-helper als ergens een ISO-datum binnenkomt.
- Test in fase 1: render de tijdlijn en check visueel dat augustus links staat, juli rechts.

**Phase to address:** Fase 1 (datamodel-contract en tijdlijn-rendering).

---

### Pitfall 15: LIB VO vs Woots-platform mengen vóór augustus 2026

**What goes wrong:**
Een placeholder-activiteit in juni 2026 verwijst per ongeluk naar Woots, of een activiteit in september 2026 verwijst nog naar LIB VO. MT-lid die met klanten praat ziet dat onmiddellijk: "dit klopt niet, hier zijn we nog op LIB." Vertrouwen weg.

**How to avoid:**
- Helper-functie of constante: `platformNaam(maand: SchooljaarMaand): 'LIB VO' | 'Woots'` op basis van schooljaar-positie ten opzichte van augustus 2026.
- In placeholder-data nooit hardgecodeerde platformnamen; altijd via de helper. Verlaagt de kans dat een ad-hoc kopieerfout een platformnaam-mix introduceert.
- Reviewer-checklist vóór MT: grep op "LIB" en "Woots" in placeholder-data, manuele cross-check tegen maand.

**Phase to address:** Fase 2 (placeholder-content strategie) — én als reviewer-checklist in fase 6.

---

### Pitfall 16: DMU-rollen inconsequent benoemd

**What goes wrong:**
`CLAUDE.md` is hard: beslisser, beïnvloeder, gebruiker — in die volgorde, nooit anders gelabeld. In de UI sluipt "beslisser" als "besluitvormer" of "user" of "stakeholder." Inconsistentie in label/volgorde verwart MT bij vergelijking tussen maanden of reizen.

**How to avoid:**
- Eén enum-type in TypeScript: `type DMURol = 'beslisser' | 'beïnvloeder' | 'gebruiker'` — exact deze waardes, geen vrije strings.
- DMU-rij rendert altijd in vaste volgorde (beslisser, beïnvloeder, gebruiker links-naar-rechts of bovenop-onderop), niet alfabetisch of op data-volgorde.
- Visueel sorteer-mechanisme uitschakelen — DMU is geen sortable lijst.

**Phase to address:** Fase 1 (datamodel-contract).

---

### Pitfall 17: Mist-categorieën verzinnen die niet in de lijst staan

**What goes wrong:**
Tijdens het maken van placeholder-content of in een MT-discussie schrijft iemand een "ontbrekende randvoorwaarde" met categorie "tijd" of "mensen" of "communicatie." `CLAUDE.md` is helder: alleen systeem, data, proces, capaciteit. Categoriedrift maakt aggregaat-view onbruikbaar voor prioritering.

**How to avoid:**
- TypeScript enum: `type RandvoorwaardeCategorie = 'systeem' | 'data' | 'proces' | 'capaciteit'` + `type Impact = 'blokkerend' | 'hinderlijk'`.
- UI-input voor randvoorwaarde-categorie is een dropdown met exact deze vier waardes, geen vrij tekstveld.
- Aggregaat-view rendert exact vier categorieën-secties; categorieën-lijst is hardcoded, geen dynamische groepering op data.

**Phase to address:** Fase 1 (datamodel-contract).

---

### Pitfall 18: Cito-jargon in UI die generiek inzetbaar zou moeten blijven

**What goes wrong:**
"Opdrachtdocument-status" is Cito-jargon. "Toetstekunde" is Cito-jargon. "LIB VO" is jargon. Op zich passend voor dit instrument, maar als de bouw-aanpak Cito-jargon hardcodeert (in component-namen, in dropdowns die niet uit data komen, in pagina-titels), is uitbreiding naar PO of Zakelijk een herschrijf-operatie.

**How to avoid:**
- Jargon zit in **data**, niet in **componenten**. Componentnaam: `ActiviteitDetailPaneel`, niet `OpdrachtdocumentStatusPaneel`.
- Afdelings-labels via een config-array (`AFDELINGEN_VO = ['Marketing', 'Sales', ...]`), niet hardgecodeerd in vijf aparte componenten.
- Geen hardgecodeerde Cito-specifieke teksten in component-source — alles via een i18n-achtige helper of data-laag (al hoeft het geen volledige i18n te zijn voor deze milestone).
- Tegelijk **wel** scope-disciplined: deze milestone bouwt VO. PO/Zakelijk-generaliteit is een latere stap. Maar maak het niet onnodig moeilijk.

**Phase to address:** Fase 1 (architectuur en naamgeving).

---

## Minor Pitfalls

### Pitfall 19: Drag-and-drop libraries die niet werken met touch / tablet

**What goes wrong:**
MT-lid opent prototype op iPad in vergaderzaal. Drag-and-drop voor lane-volgorde of activiteit-verplaatsing werkt niet. Frustratie.

**How to avoid:**
Library met touch-support kiezen (`dnd-kit` heeft dat, `react-beautiful-dnd` heeft het beperkt). Of: inline-edit zonder DnD voor de eerste milestone — klik op item → keuzemenu "verplaats naar..." met dropdown. Minder elegant maar 100% werkbaar.

**Phase to address:** Fase 4 (structuur-mutaties).

---

### Pitfall 20: Lettertype-laden dat eerst leeg-renders (FOIT/FOUT)

**What goes wrong:**
Inter en Source Serif 4 worden via CDN of npm geladen. Eerste rendering toont leeg of default-systeemfont. Op MT-sessie: 2 seconden Arial → flits naar Inter. Niet professioneel.

**How to avoid:**
- `font-display: swap` in CSS — toont fallback eerst, swap naar custom font zodra geladen. Geen flikker.
- `next/font` (als Next.js): zelfgehoste fonts, geen FOIT.
- Of: preload-link in HTML head voor de font-files.

**Phase to address:** Fase 1 (designtaal-implementatie).

---

### Pitfall 21: Print/PDF-rendering niet meegedacht

**What goes wrong:**
Scope-document zegt PDF-export is een bestaande feature voor MT-presentaties. Niet aanraken — maar print-CSS bestaat niet, dus print-pagina is onleesbaar of geknipt. MT vraagt: "kun je dit even afdrukken?"

**How to avoid:**
- Voor deze milestone: print-CSS is out-of-scope (zo staat het ook in `PROJECT.md`: PDF-export is niet kritiek). Documenteer dit expliciet zodat de MT-sessie weet dat print niet werkt en dat ze live kijken.
- Minimaal: `@media print { body { font-size: 10pt } }` zodat een ad-hoc print niet helemaal kapot is.

**Phase to address:** Out of scope deze milestone — wel een note voor volgende.

---

### Pitfall 22: Accessibility vergeten (toetsenbordnavigatie, screen reader)

**What goes wrong:**
MT-lid met visuele beperking of voorkeur voor toetsenbordnavigatie kan niet door het prototype heen. Inline-edit alleen via muis-klik. Modal-paneel niet focus-trapped.

**How to avoid:**
- Tab-volgorde door tijdlijn-cellen werkt (`tabindex` op activiteit-kaarten).
- Detail-paneel als `dialog` element met focus-trap en Esc-close.
- Alt-text op alle iconen, of `aria-label` op icon-only buttons.
- Kleur-contrast minimaal WCAG AA (Cito-blauw op wit haalt dat ruim, rood/oranje markers check).

**Phase to address:** Fase 1 (componentenkeuze) — gebruik een toegankelijke component-library als basis (Radix UI, React Aria) ipv vanuit nul.

---

### Pitfall 23: React state explosie bij complex genest-editable structuren

**What goes wrong:**
Inline-edit op klantstap, op DMU-namen, op activiteit-titel, op mismatch-relaties — ieder eigen useState-hook. 50+ states in één component. Re-renders cascaderen, perf wordt traag.

**How to avoid:**
- Eén centrale store (Zustand of immer-based reducer) ipv versplinterde useState's.
- Edit-state geïsoleerd per item (alleen het gefocuste veld heeft een eigen local edit-buffer).
- Memoization waar nodig (`useMemo` voor afgeleide views, `React.memo` voor cellen die zelden veranderen).

**Phase to address:** Fase 1 (state-architectuur).

---

### Pitfall 24: Performance bij veel activiteiten/lanes (>50 activiteiten gerenderd)

**What goes wrong:**
Drie reizen × 12 maanden × 5 lanes × 3 activiteiten gemiddeld = 540 activiteit-kaarten. Plus DMU-rijen, klantstappen, schaduwkaarten. Single-tab render is mogelijk traag op een oudere MT-laptop.

**How to avoid:**
- Slechts één reis-tab tegelijk renderen (de actieve). De andere twee niet in DOM.
- `React.memo` op activiteit-kaart.
- Geen virtualisatie nodig op deze schaal (300-500 kaarten zonder probleem), maar wel sober renderen.
- Animaties beperkt (CSS-transities, geen Framer Motion-overdaad).

**Phase to address:** Fase 1 (architectuur) + fase 6 (preflight performance-check op typische MT-laptop).

---

### Pitfall 25: Tailwind CSS over-engineering (te veel utility classes per element)

**What goes wrong:**
Een activiteit-kaart heeft 25 Tailwind classes. Code wordt onleesbaar, design-systeem-discipline verdwijnt, kleine tweaks vereisen zoek-en-vervang. Editorial designtaal raakt verloren in utility-soep.

**How to avoid:**
- Component-niveau abstractie: extracteer terugkerende patronen naar React-componenten (`<KaartActiviteit>`, `<Klantcitaat>`) met semantische props ipv class-strings doorgeven.
- Tailwind `@apply` in een paar centrale CSS-classes voor de drie kernelementen (kaart, lane-header, citaat).
- Of: een lichte component-library laag (Radix UI primitives + Tailwind voor styling).

**Phase to address:** Fase 1 (architectuur en designtaal-implementatie).

---

## Technical Debt Patterns

| Shortcut | Korte-termijn voordeel | Lange-termijn kost | Wanneer acceptabel |
|----------|-------------------------|--------------------|---------------------|
| Inline-data in component-files | Snel begin, geen extra map | Migratie naar Supabase = breed herschrijven | Nooit — vanaf dag 1 in `data/` map |
| useState voor alle editable velden | Geen library leren | State-explosie bij 5+ velden | Acceptabel voor pure read-only prototype, niet zodra inline-edit erin zit |
| Inline mismatch-objecten ipv referentie via activity-ID | Eenvoudiger seed-data | Onmogelijk te normaliseren naar Supabase | Nooit |
| Hardgecodeerde Cito-afdelingen in JSX | "Het zijn er toch maar vijf" | Lane-volgorde aanpassen = code-change ipv data-change | Nooit — scope-document eist iteratieve aanpasbaarheid |
| Tailwind via CDN voor productie | Geen build-stap | Geen tree-shaking, slow first paint | Acceptabel voor `prototype/v10/` als referentie. Niet voor het MT-prototype als die over Next.js gaat |
| Geen schooljaar-helper, raw arrays | Snel | Off-by-one fouten in mismatch-berekening | Nooit |
| Geen TypeScript types voor enums (DMU-rol, mist-categorie) | Schrijft sneller | UI accepteert ongeldige waardes | Nooit — enums in fase 1 vastleggen |
| Geen undo-stack voor structuur-mutaties | Sneller te bouwen | Dataverlies tijdens MT-sessie killt vertrouwen | Acceptabel als prototype in read-only-modus tijdens MT staat |
| Drag-and-drop zonder touch-support | Sneller te integreren | iPad-MT-gebruik mislukt | Acceptabel als DnD niet in eerste MT-sessie nodig is |

---

## Integration Gotchas

| Integratie | Gangbare fout | Juiste aanpak |
|------------|----------------|----------------|
| Supabase (volgende milestone) | Lokale data-shape eerst, dan proberen te normaliseren | Datamodel-contract in fase 1 al relationeel ontwerpen, ook als hij in localStorage zit |
| Inter / Source Serif 4 font-loading | CDN-link zonder preload of font-display | `font-display: swap` + preload; bij Next.js `next/font` |
| Tailwind via CDN | Hele Tailwind in productie-bundle | CDN alleen voor het v10-referentie-prototype; voor het nieuwe prototype Tailwind build-time (PostCSS) |
| React via CDN + Babel in-browser | Werkt voor v10-referentie; trage compile bij iteratie | Voor nieuwe prototype: lichte Next.js setup met esbuild/vite, geen in-browser Babel |
| LocalStorage als pseudo-persistentie | Geen versioning, geen migratie-strategie | Data-shape onder een version key (`klantreis-v1`), migratie-helper als shape verandert |
| Browser refresh tijdens edit-mode | Verlies van wijzigingen | Auto-save naar localStorage op iedere mutatie, restore on load |

---

## Performance Traps

| Trap | Symptomen | Voorkomen | Bij welke schaal breekt het |
|------|-----------|-----------|-----------------------------|
| Alle drie reizen-tabs in DOM | Trage tab-switch, hoge memory | Alleen actieve tab renderen | >2 reizen tegelijk in DOM |
| Re-render hele tijdlijn bij iedere edit | Type-vertraging in inline-edit | Memoization op cel-niveau, edit-buffer lokaal | 50+ cellen + 1 edit |
| Onbedoelde reflows bij font-load | Tekst springt op page load | font-display: swap + size-adjust | Iedere pageload |
| Animatie op iedere kaart bij hover | Janky animaties | CSS-only transities, geen JS-animation per cel | 100+ kaarten in beeld |
| Geen schooljaar-maand-constante, herberekening per render | Onverklaarbare vertragingen | Constante array, geen Date-objecten in render-pad | Iedere render |

> Voor deze prototype-milestone is performance geen kritiek issue (~300-500 kaarten op moderne laptop), maar de patronen hierboven zijn goedkoop te volgen vanaf fase 1 en duur om later te repareren.

---

## Security Mistakes

Voor deze milestone (lokale state, geen authenticatie, geen netwerk-call, geen externe data-bron) is security beperkt relevant. Wel:

| Fout | Risico | Voorkomen |
|------|---------|-----------|
| Klantcitaten of school-namen in publieke git-history | Per ongeluk klantgegevens in repo | Placeholder-content gebruikt fictieve scholen ("Stichting Voorbeeld") — Stichting BOOR alleen als referentienaam, geen klant-citaten van echte personen |
| LocalStorage data delen via shared browser | MT-lid op gedeelde computer | "Wis lokale data"-knop, geen gevoelige data in placeholder |
| Console.log met data-dump in productie-build | Klanten zien interne state via DevTools | Geen `console.log` op data — alleen op events, en alleen in dev-mode |
| API-keys voor analytics/fonts in code | Per ongeluk public exposure | Geen keys nodig deze milestone; bij volgende stap (Supabase) `.env.local` met `NEXT_PUBLIC_` discipline |

> Volgende milestone (Supabase + auth) heeft een eigen security-pitfall-lijst nodig. Deze milestone: minimaal.

---

## UX Pitfalls

| Pitfall | Gebruikersimpact | Betere aanpak |
|---------|-------------------|----------------|
| Inline-edit zonder visuele edit-indicator | Onduidelijk of veld editable is | Hover toont potlood-icoon; click-to-edit met focus-ring |
| Esc tijdens edit save't ipv revert | Dataverlies bij vergissing | Esc = revert, blur = save, expliciet en consistent |
| Geen feedback bij save | Onzekerheid of wijziging is doorgekomen | Korte toast of subtiele groene tick na save |
| Modal detail-paneel zonder close-knop linksboven | iPad-gebruikers zoeken sluit-knop | Expliciete X linksboven plus Esc plus overlay-click-to-close |
| Tooltips zonder delay | Hover triggert te snel, tooltips flikkeren | 300-500ms delay op show |
| Te kleine clickable areas (activiteit-kaarten <40px hoog) | Tablet/finger-mis-tap | Minimaal 44×44px touch target voor klikbare elementen (Apple HIG / WCAG-richtlijn) |
| Onomkeerbaar verwijderen (lane/fase/reis) zonder confirm | Per ongeluk hele lane weg | Confirm-dialog + undo-snapshot |
| Reizen-tab-switch reset scroll-positie naar boven | Verlies van context | Scroll-positie per tab onthouden |

---

## "Looks Done But Isn't" Checklist — preflight vóór MT-sessie

Alvorens het prototype aan het MT te tonen — check elk item.

- [ ] **Tweedeling boven/onder de lijn:** Visueel evident? Een buitenstaander herkent klant-zijde versus organisatie-zijde binnen 5 sec? — verifieer met 1 interne tester die het project niet kent.
- [ ] **Klantstap in 1e persoon:** Alle zichtbare klantstappen beginnen met "Ik" — grep door placeholder-data om "De klant" te vinden en te corrigeren.
- [ ] **DMU-volgorde:** Overal beslisser → beïnvloeder → gebruiker, links-naar-rechts of boven-naar-onder. Geen alfabetische sortering die het rompzet.
- [ ] **Schooljaar-tijdlijn:** Augustus staat links/eerst, juli rechts/laatst. Niet januari-december. — verifieer visueel.
- [ ] **LIB VO vs Woots:** Iedere placeholder-activiteit-tekst vóór augustus 2026 vermeldt LIB VO; ná augustus 2026 Woots. — grep + manuele cross-check.
- [ ] **Eén accentkleur:** Cito-blauw #2E75B6 als enige functionele accent. Oranje uitsluitend mismatch, rood uitsluitend blokkerend. Geen afdelings-kleuren. — visueel auditen.
- [ ] **Lettertypen:** Inter overal, behalve klantcitaten in Source Serif 4 italic. — visueel en in CSS auditen, ook in detail-paneel.
- [ ] **Mismatch-voorbeeld:** Minimaal één volledig uitgewerkte mismatch (verlengingsoffertes april/november) zichtbaar als schaduwkaart + connectie + mismatch-paneel met klantcitaat.
- [ ] **Aggregaat-view ontbrekende randvoorwaarden:** Vier categorieën-secties (systeem, data, proces, capaciteit) zichtbaar, ook als deels leeg.
- [ ] **Detail-paneel-velden compleet:** Eigenaar, betrokken, DMU-leden, klantverwachting, KPI's, opdrachtdocument-status, ontbrekende randvoorwaarden — alle velden zichtbaar voor minimaal één voorbeeld-activiteit.
- [ ] **Inline structuur-aanpassing aan minimaal één lane gedemonstreerd:** Lane hernoemen, lane toevoegen, lane verwijderen — werkt zichtbaar en zonder dataverlies.
- [ ] **Drie reizen-tabs:** Bestaande klanten, nieuwe klanten, bestuur op stichtingsniveau — labels exact zo. Geen vierde tab.
- [ ] **Read-only modus:** Default-state voor MT-sessie is read-only. Edit-toggle voor demo van structuur-aanpassingen.
- [ ] **Auto-save naar localStorage:** F5 / refresh herstelt laatste state.
- [ ] **Geen Cito-content-fouten in placeholder:** Geen verzonnen activiteiten of klantcitaten die als echt overkomen. Generieke placeholder herkenbaar.
- [ ] **Werkt op Chrome + Safari + iPad:** Test op alle drie. Iemand in het MT gebruikt zeker een Mac of iPad.
- [ ] **Toetsenbordnavigatie:** Tab door tijdlijn, Enter opent detail-paneel, Esc sluit. Minimaal werkbaar zonder muis.
- [ ] **No console errors:** Open DevTools op de demo-laptop, geen rode meldingen.
- [ ] **Demoscript:** 10-min walkthrough geschreven dat élk hoofdelement één keer aanraakt — niemand improviseert in de MT-sessie.
- [ ] **Feedback-sjabloon:** Voor het MT klaarliggen (papier of digitaal) met de specifieke validatie-vragen voor deze sessie.

---

## Recovery Strategies

Wanneer een valkuil zich ondanks preventie alsnog voordoet, hoe te herstellen.

| Pitfall | Herstel-kost | Herstel-stappen |
|---------|---------------|------------------|
| CJM te druk (pitfall 1) | LAAG | Default-collapse van lanes; visuele dichtheid reduceren; nieuwe MT-sessie binnen 1 week |
| MT discussieert content (pitfall 2) | MIDDEL | Sessie pauzeren, herframen: "vandaag ontwerp, content noteer ik apart"; placeholder generieker maken voor sessie 2 |
| Consensus-paralyse (pitfall 3) | HOOG | Time-out; offline 1-op-1 gesprekken met MT-leden; beslis-eigenaarschap herbevestigen; sessie-format wijzigen |
| Datamodel niet migreerbaar (pitfall 4) | HOOG | Refactor naar relationeel model; 1-2 sprints kost, doe dit *vóór* Supabase-fase, niet erna |
| Inline-edit dataverlies (pitfall 5) | LAAG | LocalStorage-snapshot toevoegen; undo-knop; sessie hervatten zodra fix er is |
| Mismatch-visualisatie verwarrend (pitfall 6) | LAAG | Schaduwkaart visueel duidelijker; connector toevoegen; testen met 1-2 mensen vóór MT |
| Outside-in vergeten (pitfall 7) | MIDDEL | Visueel gewicht herverdelen; klantstem prominenter; reviewer-discipline in volgende fase |
| Schooljaar verkeerd (pitfall 14) | LAAG | Centrale constante toepassen; één refactor-pas door codebase |
| LIB/Woots-mix (pitfall 15) | LAAG | Helper-functie toepassen; placeholder-data corrigeren |
| Jargon-hardcoding (pitfall 18) | MIDDEL | Refactor naar data-driven labels; component-namen generaliseren |

---

## Pitfall-to-Phase Mapping

Hoe de roadmap-fases deze valkuilen moeten adresseren.

| Pitfall | Preventie-fase | Verificatie |
|---------|-----------------|--------------|
| #1 CJM te druk | Fase 1 (UI-architectuur) | Interne tester begrijpt structuur binnen 5 sec |
| #2 Content-discussie kaapt sessie | Fase 2 (placeholder-strategie) + Fase 5 (MT-proces) | Generieke placeholder + briefing-slide aanwezig vóór MT |
| #3 Consensus-paralyse | Fase 5 (MT-validatie-proces) | Beslis-eigenaarschap en sessie-format schriftelijk vastgelegd vóór sessie 1 |
| #4 Datamodel niet migreerbaar | Fase 1 (datamodel-contract) | TypeScript types-document review; relationele shape met IDs |
| #5 Inline-edit dataverlies | Fase 4 (structuur-mutaties) | Test: F5 tijdens edit herstelt; Esc revertdt; lane verwijderen vraagt confirm |
| #6 Mismatch verwarrend | Fase 3 (mismatch-mechaniek) | 2 testers herkennen "schaduwkaart = ideale plek" zonder uitleg |
| #7 Outside-in vergeten | Fase 1 (designtaal) + reviewer-vraag elke fase | Buitenstaander leest tool als klantreis, niet als Cito-planning |
| #8 Reizen-keuze onduidelijk | Fase 1 (UI-architectuur) | Aggregaat-view tab aanwezig en functioneel |
| #9 Emotie-curve nutteloos | Fase 1 (UI-architectuur) | Emotie-rij verbonden aan klantcitaten, niet als losse curve |
| #10 Service Blueprint overweldigt | Fase 1 (lane-design) | Boven/onder-verhouding ≥40/60 schermruimte |
| #11 Kleur/label-overload | Fase 1 (designtaal) | Audit: drie kleuren (blauw, oranje, rood) + zwart/wit |
| #12 Prototype incompleet | Fase 6 (preflight) | Completeness checklist 100% afgevinkt |
| #13 Geen feedback-loop | Fase 5 (MT-proces) | Feedback-sjabloon en feedback-doc-template klaar |
| #14 Schooljaar verkeerd | Fase 1 (datamodel) | Visueel: aug links, jul rechts |
| #15 LIB/Woots-mix | Fase 2 (content) + Fase 6 (preflight) | Grep-check + manuele cross-check |
| #16 DMU-inconsistentie | Fase 1 (datamodel) | TypeScript enum afgedwongen |
| #17 Mist-categorie-drift | Fase 1 (datamodel) | TypeScript enum + UI dropdown |
| #18 Cito-jargon hardcoded | Fase 1 (architectuur) | Component-namen generiek; labels uit config |
| #19 Touch/iPad DnD | Fase 4 (mutaties) | iPad-test van structuur-aanpassing |
| #20 FOIT/FOUT | Fase 1 (designtaal) | `font-display: swap` getest |
| #21 Print ontbreekt | — (out of scope) | Geen actie, alleen documentatie |
| #22 Accessibility | Fase 1 (componenten) | Toetsenbordnavigatie en aria-labels |
| #23 State explosie | Fase 1 (architectuur) | Centrale store, geen losse useState's per veld |
| #24 Performance | Fase 1 (architectuur) + Fase 6 (preflight) | Test op MT-typische laptop, <1s tab-switch |
| #25 Tailwind over-engineering | Fase 1 (componenten) | Component-abstracties met semantische props |

---

## Sources

- `apps/Klantreis/CLAUDE.md` — harde domein-regels (tweedeling, DMU-volgorde, platformmigratie, mist-categorieën, designtaal)
- `apps/Klantreis/.planning/PROJECT.md` — projectscope, doel "MT collectief achter ontwerp", expliciete out-of-scope
- `apps/Klantreis/Project_Klantreis_VO.md` — methodologische basis (CJM + Service Blueprint + 3sides), doelgroep MT, gewenste-klantreis-aanpak
- Algemene CJM/Service Blueprint praktijkkennis: Nielsen Norman Group artikelen over customer journey mapping pitfalls, Adaptive Path's "Service Blueprint" methodiek (Lynn Shostack 1982 origin)
- React + Tailwind state-management patterns: bekende valkuilen rond useState-explosie en utility-class-overdaad (Kent C. Dodds, Tailwind documentatie)
- WCAG 2.1 AA voor touch targets en kleur-contrast
- Schooljaar-vs-kalenderjaar valkuil: algemene domain-modeling-praktijk in onderwijs-software

---

*Pitfalls research voor: Klantreis VO — UI-prototype voor MT-validatie (vóór Next.js + Supabase implementatie)*
*Onderzocht: 2026-05-14*
