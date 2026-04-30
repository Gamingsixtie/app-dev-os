# Phase 9: AI Intake & Prijsbeheer - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-gestuurde gespreksverwerking (intake) geïntegreerd in het schoolprofiel, en prijsbeheer met handmatige invoer, document-upload (PDF/Excel/Word/CSV) en semantische validatie. Alles draait op de Supabase + Vercel backend uit Phase 8. AI-calls gaan via serverless functions.

</domain>

<decisions>
## Implementation Decisions

### AI Intake flow
- **D-01:** Intake zit in de Gesprekken-tab van het schoolprofiel. "Nieuw gesprek" formulier heeft twee modi: [Handmatig] en [AI-intake]. AI-modus = vrije tekst die gestructureerd wordt.
- **D-02:** Real-time streaming — resultaten verschijnen progressief terwijl de AI analyseert. Gebruiker ziet velden invullen (✓ Niveaus, ✓ Leerlingen, ◆ Modules...). Streaming via SSE vanuit Vercel serverless function.
- **D-03:** Diff-view bevestigingsscherm — per geëxtraheerd item (module, prijs, contactpersoon, actiepunt) toont het scherm wat er al bestaat en wat nieuw is. Gebruiker vinkt per item aan wat overgenomen wordt. Bestaande data blijft default bewaard.
- **D-04:** Volledige extractie-scope: niveaus, leerlingaantallen, modules + aanbieders + prijzen, contactpersonen (naam, rol, DMU), actiepunten (wat, wanneer), pipeline-signalen (interesse, twijfel, concurrent-switch), unsureAbout verificatiepunten.
- **D-05:** Intake voegt toe (append) aan bestaand schoolprofiel — overschrijft nooit. Bestaande modules/contacten/prijzen worden getoond als referentie in de diff-view.
- **D-06:** Uitgebreid extractie-schema vervangt het v1 IntakeExtractionSchema. Nieuw schema bevat contactPersonen[], actiePunten[], pipelineSignaal en alle bestaande velden.

### Prijsbeheer
- **D-07:** Prijsbeheer-UI in de Producten-tab met inline editing. Klik op een prijs → bewerk modal met bedrag, type, bron, datum, notitie.
- **D-08:** Prijsgeschiedenis per module/aanbieder — meerdere prijsentries mogelijk (publicatie, offertes, afspraken). Accountmanager selecteert welke prijs actief is via radiobutton + verplicht redenveld ("Waarom deze prijs?"). Vergelijking gebruikt altijd de actieve prijs.
- **D-09:** SchoolPriceEntry model: id, school_id, module_id, provider, amount, price_type ('publication' | 'agreed'), discount_percentage (optioneel), source (vrij tekst), verified_at, note, is_active, activation_reason, activated_at.
- **D-10:** Bruto/netto onderscheid via price_type: bij 'publication' is het brutoprijs, bij 'agreed' optioneel kortingspercentage invullen → berekent brutoprijs terug. Vergelijking kan filteren op publicatie of afgesproken prijzen.
- **D-11:** "Reset naar publicatie" optie per module/aanbieder — deactiveert alle school-entries, publicatieprijs uit DEFAULT_PRICES wordt weer de actieve bron.
- **D-12:** Publicatieprijzen (DEFAULT_PRICES) zijn altijd zichtbaar als referentie naast schoolspecifieke prijzen. Duidelijk gelabeld.

### Document upload & extractie
- **D-13:** Ondersteunde formaten: PDF, Excel (.xlsx/.xls), Word (.docx), platte tekst/CSV
- **D-14:** Verwerking via Vercel serverless function: bestand wordt geüpload naar Supabase Storage, serverless function leest en parseert het (pdf-parse voor PDF, SheetJS voor Excel, mammoth voor Word, direct voor tekst/CSV), geëxtraheerde tekst naar Claude Haiku voor structurele prijsextractie.
- **D-15:** Upload-knop in Producten-tab naast "+ Prijs toevoegen": [Upload document]. Drag & drop zone voor PDF, Excel, Word, CSV.
- **D-16:** Geëxtraheerde prijzen getoond in zelfde diff-view als AI intake — per prijs aanvinken wat overgenomen wordt als SchoolPriceEntry. Nooit automatisch doorgevoerd.

### Semantische prijsvalidatie
- **D-17:** Validatie tegen publicatieprijzen als referentie: als publicatieprijs beschikbaar is, waarschuw bij >50% afwijking. Als geen publicatieprijs beschikbaar is (bijv. JIJ!): toon "Geen publicatieprijs bekend — handmatige invoer" zonder waarschuwing.
- **D-18:** Inline waarschuwing, niet blokkerend — gele ⚠ badge naast de prijs met tooltip ("Ongebruikelijk: publicatie €5,20"). Gebruiker kan gewoon opslaan. De accountmanager weet het beter.
- **D-19:** Prijsstatus-indicatoren: ✓ Geverifieerd (publicatie), ✎ Handmatig (zelf ingevoerd), ⚠ Mogelijk verouderd (>6 maanden), ? Onbekend (geen bron). Bestaande getPriceStatus() logica uitbreiden.

### Claude's Discretion
- Exacte streaming-UI implementatie (progressieve veld-invulling)
- Diff-view component design en UX
- Document upload UX (drag & drop, voortgangsbalk)
- Extractie-schema details en system prompts
- Error handling bij mislukte extractie of onleesbare documenten
- Producten-tab layout uitbreiding voor prijsbeheer

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bestaande AI intake (v1 — te refactoren)
- `src/lib/ai-intake.ts` — Huidige extractie-functie, schema, system prompt (basis voor uitbreiding)
- `src/features/intake/IntakePanel.tsx` — Huidige UI (referentie, wordt vervangen door Gesprekken-tab integratie)

### Prijsmodel
- `src/models/pricing.ts` — PriceRecord, PriceSource, getPriceStatus, getPriceStalenessLabel
- `src/data/default-prices.ts` — DEFAULT_PRICES (publicatieprijzen als referentie)
- `src/db/types.ts` — PriceOverride (legacy), SchoolPriceEntry (nieuw uit Phase 8 schema)

### School profiel (Phase 7)
- `src/features/school-profile/tabs/ProductsTab.tsx` — Huidige producten-tab (uitbreiden met prijsbeheer)
- `src/features/school-profile/tabs/ConversationsTab.tsx` — Gesprekken-tab (intake-modus toevoegen)
- `src/features/school-profile/components/ConversationForm.tsx` — Gespreksformulier (handmatig/AI toggle)

### Phase 8 backend
- `.planning/phases/08-supabase-deploy/08-CONTEXT.md` — Supabase schema, serverless functions, auth model

### Project context
- `.planning/PROJECT.md` — Projectvisie, constraints
- `.planning/REQUIREMENTS.md` — INTAKE-01..05, PRIJSMGT-01..04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **IntakeExtractionSchema** (`src/lib/ai-intake.ts`): Basis Zod schema — uitbreiden met contactPersonen, actiePunten, pipelineSignaal
- **ExtractionPreview** (`IntakePanel.tsx`): Preview component — herbruikbaar als basis voor diff-view
- **PriceBadge** (`src/components/ui/PriceBadge.tsx`): Bestaande badge voor prijs-status — uitbreiden met nieuwe statussen
- **getPriceStatus/getPriceStalenessLabel** (`src/models/pricing.ts`): Staleness-logica — herbruiken voor validatie
- **ProductsTab** (`src/features/school-profile/tabs/ProductsTab.tsx`): Bestaande tab — uitbreiden met prijsbeheer-UI
- **ConversationsTab + ConversationForm**: Bestaande gesprekken-UI — intake-modus toevoegen

### Established Patterns
- **Zod + zodOutputFormat**: Structured output voor Claude — herbruiken voor uitgebreid extractie-schema
- **Supabase client** (uit Phase 8): Database queries en storage uploads
- **Vercel serverless functions** (uit Phase 8): AI-proxy patroon — herbruiken voor document-extractie
- **react-hook-form + Zod**: Formulierpatroon voor prijsinvoer

### Integration Points
- **Gesprekken-tab**: Handmatig/AI-modus toggle op ConversationForm
- **Producten-tab**: Prijsbeheer-UI, document upload zone, prijsgeschiedenis per module
- **Vercel /api/**: Nieuwe endpoints: /api/ai-intake (uitgebreid), /api/extract-document
- **Supabase Storage**: Document uploads opslaan
- **school_prices tabel**: CRUD voor SchoolPriceEntry met is_active logica
- **Vergelijkings-engine**: Moet actieve schoolprijs gebruiken i.p.v. appliedOverrides

</code_context>

<specifics>
## Specific Ideas

- De accountmanager belt en typt tegelijk — streaming geeft het gevoel dat de AI "meeluistert" en direct structureert
- Diff-view is cruciaal: je wilt nooit per ongeluk bestaande data overschrijven. Elke wijziging is een bewuste keuze.
- Prijsgeschiedenis met actieve selectie + reden bouwt een audit trail die richting stakeholders te verantwoorden is: "Dit is de prijs die we gebruiken, en dit is waarom"
- Bij JIJ! zijn er geen publicatieprijzen — de tool moet daar elegant mee omgaan zonder de accountmanager te blokkeren
- Bruto/netto onderscheid is essentieel voor eerlijke vergelijkingen — afgesproken kortingen moeten transparant zijn
- Document-upload moet "slim" zijn: een Excel met DIA-prijzen moet automatisch herkend worden als DIA-prijslijst

</specifics>

<deferred>
## Deferred Ideas

- Automatische prijsupdates via web-scraping agent — FUTURE-01
- Incrementele intake (auto-analyse bij pauze, zonder "Analyseer" knop) — te complex voor nu, later evalueren
- Cross-school prijsvergelijking ("welke collega heeft de beste DIA-prijs?") — backlog
- Bulk-import van prijzen voor meerdere scholen tegelijk — backlog
- Slimme suggesties ("DIA biedt pakketkorting bij 3+ modules") — Phase 10 (prijsvergelijking)

</deferred>

---

*Phase: 09-ai-intake-prijsbeheer*
*Context gathered: 2026-03-22*
