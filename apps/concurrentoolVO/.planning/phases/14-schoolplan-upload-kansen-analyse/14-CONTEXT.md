# Phase 14: Schoolplan Upload & Kansen-analyse - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Accountmanager kan een schoolplan-document (PDF/Word/tekst) uploaden per school. AI analyseert het document in twee stappen (samenvatting → matching) en identificeert concrete Cito-verkoopkansen, concurrentie-kwetsbaarheden en strategische inzichten. Resultaten worden opgeslagen bij het schoolprofiel en zijn interactief (markeren, annoteren).

</domain>

<decisions>
## Implementation Decisions

### Analyse-weergave
- **D-01:** Nieuwe 7e tab "Schoolplan" in het schoolprofiel (naast Overzicht, Vergelijking, Producten, Contacten, Gesprekken, Waarde)
- **D-02:** Kansen worden getoond als individuele kaarten (vergelijkbaar met UpsellCard-patroon)
- **D-03:** Elke kans-kaart bevat: schoolplan-thema, gekoppeld Cito-product, toelichting waarom relevant, gesprekstip, relevantie-score (hoog/midden/laag), citaat uit schoolplan, en concurrentie-kwetsbaarheid (indien van toepassing)
- **D-04:** Bovenaan de tab een korte AI-samenvatting (2-3 zinnen): waar het schoolplan op focust, hoeveel kansen er zijn, en de belangrijkste thema's
- **D-05:** Accountmanager kan kansen markeren als 'besproken'/'niet relevant' en een korte notitie toevoegen per kans
- **D-06:** Eén schoolplan per school — nieuw uploaden vervangt het vorige (geen versiehistorie)
- **D-07:** Upload via DocumentDropzone-patroon bovenaan de tab. Na upload verdwijnt de dropzone en verschijnt een 'Vervang schoolplan' knop met document-metadata (bestandsnaam, uploaddatum, aantal pagina's)
- **D-08:** AI-analyse start direct na upload met streaming feedback (hergebruik StreamingExtraction-patroon). Geen extra bevestigingsstap

### Kansen-matching
- **D-09:** Vrije AI-analyse — Claude leest het schoolplan en matcht vrij op basis van inhoudelijk begrip met de Cito-modulecatalogus. Geen vaste taxonomie
- **D-10:** Per kans: specifiek Cito-product (bijv. 'Cito Volgsysteem VO') + waarom het aansluit bij het schoolplan + gesprekstip voor de accountmanager
- **D-11:** 3-niveau relevantie-score (hoog/midden/laag) per kans. Kaarten worden gesorteerd op score (hoog eerst)
- **D-12:** Aparte sectie 'Mogelijk ook relevant' onder de schoolplan-kansen, voor kansen die NIET in het schoolplan staan maar wel relevant kunnen zijn op basis van schooltype en huidig productgebruik

### Concurrentie-signalen
- **D-13:** AI combineert schoolplan-wensen met bekende productbeperkingen van DIA/JIJ (uit bestaande differentiators-data) om kwetsbaarheden te signaleren
- **D-14:** Concurrentie-signalen zijn geïntegreerd op de kans-kaart (niet apart). Elke kaart bevat een concurrentie-sectie als die er is (bijv. "DIA biedt dit beperkt" of "JIJ heeft geen vergelijkbaar product")

### Document-verwerking
- **D-15:** Twee-stappen AI-verwerking: Stap 1: samenvatting van hele document naar kernthema's en doelen. Stap 2: matching van thema's met Cito-producten en concurrentie-analyse
- **D-16:** Ondersteunde formaten: PDF, Word (.docx), platte tekst (.txt)
- **D-17:** AI-model: Claude Sonnet als standaard, maar met model-abstractie (configureerbaar) zodat later makkelijk gewisseld kan worden naar een ander model (Gemini, etc.). Check altijd op nieuwste modelversie
- **D-18:** Na upload wordt alleen metadata getoond (bestandsnaam, uploaddatum, pagina's). Origineel document in Supabase Storage als backup

### Claude's Discretion
- Exacte Zod-schema voor de gestructureerde AI-output (thema's, kansen, scores)
- Technische implementatie van de twee-stappen analyse pipeline
- Model-abstractie architectuur (hoe configureerbaar te maken)
- Hoe om te gaan met documenten die geen schoolplan blijken te zijn (foutafhandeling)
- Paginering/layout van kansen bij veel resultaten

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bestaande document-upload infrastructuur
- `src/lib/document-parser.ts` — Supabase Storage upload + serverless AI extraction pipeline (hergebruikbaar patroon)
- `src/features/school-profile/components/DocumentDropzone.tsx` — Drag-and-drop file upload component met format-validatie
- `src/features/school-profile/components/DocumentExtractionPreview.tsx` — Preview/confirm extracted data
- `src/features/school-profile/components/StreamingExtraction.tsx` — Streaming AI extraction UI

### AI-integratie
- `src/lib/ai-intake.ts` — Claude SDK integratie met structured output via Zod
- `src/features/school-profile/schemas/intake-extraction.schema.ts` — Zod schema voor AI-extractie

### School-profiel structuur
- `src/models/school.ts` — SchoolRecord types, pipeline statuses, module types
- `src/features/school-profile/components/TabNavigation.tsx` — Tab-structuur (6 tabs, moet 7e tab toevoegen)
- `src/features/school-profile/components/UpsellCard.tsx` — Bestaand kaart-patroon voor kansen/upsell

### Concurrentie-data
- `src/data/default-prices.ts` — Module-catalogus en differentiators per aanbieder

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DocumentDropzone.tsx` — Drag-and-drop upload component, al gebouwd voor PDF/Excel/Word/CSV/TXT. Herbruikbaar voor schoolplan-upload
- `StreamingExtraction.tsx` — Streaming AI feedback UI, herbruikbaar voor de twee-stappen analyse
- `DiffView.tsx` — Preview/confirm patroon, mogelijk herbruikbaar voor kansen-review
- `UpsellCard.tsx` — Kaart-component voor kansen, patroon herbruikbaar voor schoolplan-kansen
- `EditableField.tsx` — Inline-editing component, herbruikbaar voor notities bij kansen
- `document-parser.ts` — Upload-naar-Supabase-Storage pipeline, herbruikbaar met aangepaste serverless functie
- `ai-intake.ts` — Claude SDK integratie met Zod structured output

### Established Patterns
- Zustand + persist voor client-side state, React Query voor Supabase data
- Serverless functions als AI-proxy (vermijdt API keys in frontend)
- Structured output via `@anthropic-ai/sdk` + Zod schema
- TabNavigation voor school-profiel tabs met TanStack Router

### Integration Points
- TabNavigation: nieuwe "Schoolplan" tab toevoegen aan routes
- SchoolRecord/Supabase: schoolplan-analyse data opslaan (kansen, scores, annotaties)
- Serverless function: nieuwe endpoint voor schoolplan-analyse (twee-stappen pipeline)
- Supabase Storage: schoolplan-documenten opslaan per school

</code_context>

<specifics>
## Specific Ideas

- Model moet configureerbaar zijn — Claude Sonnet nu, maar optie voor Gemini of andere modellen in de toekomst. Abstractie-laag nodig
- Kans-kaarten moeten volledig zijn: thema + product + toelichting + score + citaat + concurrentie-kwetsbaarheid. Accountmanager heeft alles nodig tijdens het gesprek
- "Mogelijk ook relevant" sectie is proactief — signaleert kansen die de school zelf nog niet heeft overwogen, gebaseerd op schooltype en huidig gebruik

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-schoolplan-upload-kansen-analyse*
*Context gathered: 2026-03-23*
