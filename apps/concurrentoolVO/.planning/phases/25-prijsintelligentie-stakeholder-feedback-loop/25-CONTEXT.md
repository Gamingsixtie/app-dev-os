# Phase 25: Prijsintelligentie & Stakeholder Feedback Loop - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Database-driven prijsdata met stakeholder-feedbackworkflow. Publicatieprijzen, pricing-strategie configuraties (bundels, tiers, pakketten) en differentiators verplaatsen van hardcoded TypeScript-bestanden naar Supabase, met een review-en-goedkeuringsflow zodat accountmanagers en productspecialisten prijzen en structuren kunnen flaggen, corrigeren en valideren. AI normaliseert en valideert alle input ongeacht het invoerkanaal. Automatische kortingspatroondetectie over scholen heen. De `ops-competitor-intel` skill wordt gebouwd als orchestrator over alle invoerkanalen.

</domain>

<decisions>
## Implementation Decisions

### Datamigratie-strategie
- **D-01:** Database-first met TS-fallback — app leest prijzen, pricing configs en differentiators uit Supabase. Bij offline/fout: fallback naar huidige TS-bestanden als laatst-bekende-goede-staat.
- **D-02:** Automatische seed bij deploy — bij eerste Supabase-migratie worden alle huidige TS-bestanden (`src/data/providers/*.ts`, `src/data/differentiators.ts`, `src/data/provider-module-content.ts`) automatisch omgezet naar database-records. Eenmalig, daarna leeft de data in de DB.
- **D-03:** Store-first loading — bij app-start worden alle publication prices + configs uit Supabase geladen in een Zustand store. Calculators blijven synchroon en puur (pure functions) — ze krijgen config als parameter i.p.v. directe TS-import. Minimale engine-wijziging.
- **D-04:** Offline cache via localStorage — laatst opgehaalde prijsdata wordt gecached in localStorage. Bij offline: gebruik cache + banner "Prijsdata mogelijk niet actueel". Bij online: automatisch verversen.

### Review & goedkeuringsflow
- **D-05:** Iedereen (accountmanagers + managers) kan prijsvoorstellen indienen — laagdrempelig, de kracht zit in het reviewproces.
- **D-06:** Managers (bestaande rol uit Phase 8 auth) keuren voorstellen goed of af. Geen nieuwe rollen nodig.
- **D-07:** Centrale review-pagina (`/review`) alleen voor managers — alle openstaande voorstellen met filters op provider, module, status (open/goedgekeurd/afgewezen). Toont: huidige prijs → voorgestelde prijs, bron, bewijs, wie het indiende.
- **D-08:** Direct actief na goedkeuring + automatisch herberekenen — goedgekeurde prijs wordt meteen de actieve publicatieprijs. Alle schoolvergelijkingen die deze provider/module gebruiken worden automatisch herberekend bij volgende view.
- **D-09:** In-app badge/teller — badge op het review-menu-item die het aantal openstaande voorstellen toont. Geen externe notificaties (email/push).

### Structuurwijzigingen
- **D-10:** Admin-editor in de app — managers krijgen een configuratie-editor waar ze bundels/tiers/pakketten kunnen aanpassen: modules toevoegen/verwijderen aan bundels, tier-grenzen wijzigen, nieuwe pakketten aanmaken. Editor valideert dat de structuur geldig is voor de calculator.
- **D-11:** Structuurwijzigingen komen meerdere keren per jaar voor — de editor moet flexibel genoeg zijn om alle pricing strategies te ondersteunen (PlatformModulePricing, PackageBundlePricing, TieredLicensePricing, FlatPricing).

### AI-validatie & normalisatie
- **D-12:** AI normaliseert en valideert alle input ongeacht kanaal (handmatig, document, vrije tekst). AI matcht op juiste module-ID, provider-key, bedrag in EUR, valideert tegen bestaande data (is dit realistisch?), en presenteert gestructureerd in diff-view. Stakeholder kan slordig invoeren, AI maakt het schoon.

### Kortingspatroondetectie
- **D-13:** Automatische patroondetectie — systeem analyseert alle school-specifieke prijzen per concurrent. Als 3+ scholen vergelijkbare korting melden bij dezelfde provider, signalering: "DIA biedt gemiddeld X% korting (gebaseerd op N scholen)". Zichtbaar in review-queue en vergelijking.
- **D-14:** Marktkorting als optioneel vergelijkingsscenario — in de vergelijking kan de accountmanager kiezen: "Vergelijk op publicatieprijzen" of "Vergelijk inclusief marktkorting". Realistischer beeld zonder publicatieprijzen aan te tasten.

### ops-competitor-intel skill
- **D-15:** Scope = prijzen + features + differentiators — skill beheert niet alleen prijzen maar ook wat elke concurrent biedt per module (features, beperkingen, unieke verkooppunten). Voedt zowel de vergelijkingsengine als het AI-advies.
- **D-16:** Skill als orchestrator — hergebruikt de document-upload parser (Phase 9) en AI-extractie, maar voegt review-queue, AI-validatie/normalisatie en patroondetectie toe als extra laag. Geen duplicatie van bestaande infra.

### Claude's Discretion
- Supabase tabelschema voor publication_prices, pricing_configs, price_proposals
- RLS policies voor de review-flow (manager vs accountmanager)
- Admin-editor component design en UX
- Exacte patroondetectie-algoritme (drempelwaarden, vergelijkingslogica)
- Staleness-detectie implementatie (6 maanden threshold)
- Store-architectuur voor de pricing config (nieuw store of extensie van bestaand)
- AI system prompt voor normalisatie en validatie
- Audittrail tabelstructuur

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pricing data (huidige staat — wordt gemigreerd)
- `src/data/providers/cito.ts` — Cito pricing strategy: platform+module, bundels, contractperiodes
- `src/data/providers/dia.ts` — DIA pricing strategy: package-bundle, 6 pakketten
- `src/data/providers/jij.ts` — JIJ pricing strategy: tiered-license, 4 tiers
- `src/data/providers/saqi.ts` — SAQI pricing strategy: flat
- `src/data/providers/index.ts` — PROVIDER_CONFIGS aggregator
- `src/data/differentiators.ts` — MODULE_DIFFERENTIATORS per provider per module
- `src/data/provider-module-content.ts` — Gedetailleerde sub-product content per provider per module

### Pricing types & models
- `src/models/pricing.ts` — PriceRecord, PricingStrategy discriminated union, price status functions, staleness check
- `src/models/modules.ts` — MODULE_CATALOG met alle modules en aliassen

### Engine calculators (blijven puur — config wordt parameter)
- `src/engine/calculators/cito-calculator.ts` — CitoCalculator met bundel-logica
- `src/engine/calculators/dia-calculator.ts` — DiaCalculator met pakketoptimalisatie
- `src/engine/calculators/jij-calculator.ts` — JijCalculator met tier-selectie
- `src/engine/calculators/flat-calculator.ts` — FlatCalculator voor SAQI
- `src/engine/price-comparison.ts` — calculateComparison() hoofdfunctie

### Bestaande prijsbeheer-infra (Phase 9 — hergebruiken)
- `src/hooks/useSchoolPrices.ts` — School-specific price overrides uit Supabase
- `src/features/school-profile/components/PriceEditModal.tsx` — Prijs bewerk-modal
- `src/features/school-profile/components/PriceManager.tsx` — Prijsbeheer component
- `src/features/school-profile/components/PriceHistoryList.tsx` — Prijsgeschiedenis
- `src/features/school-profile/components/DocumentExtractionPreview.tsx` — Document extractie diff-view
- `src/features/school-profile/schemas/price-entry.schema.ts` — Zod validatie schema

### Database & auth
- `src/db/types.ts` — SchoolRecord, SchoolPriceEntry types
- `src/db/operations.ts` — CRUD functions voor Supabase
- `src/lib/supabase/types.ts` — Supabase generated types

### Prior context files
- `.planning/phases/09-ai-intake-prijsbeheer/09-CONTEXT.md` — Prijsbeheer beslissingen (D-07 t/m D-19)
- `.planning/phases/10.1-data-foundation-prijsmodel-module-uitbreiding/10.1-CONTEXT.md` — Data foundation beslissingen

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useSchoolPrices` hook — Leest school-specifieke prijzen uit Supabase, pattern herbruikbaar voor publication prices
- `PriceEditModal` — Bestaande prijs-bewerk UI, uitbreidbaar met "flag" en "voorstel" functionaliteit
- `DocumentExtractionPreview` — Diff-view component voor AI-geëxtraheerde data, herbruikbaar voor review-queue
- `PriceBadge` — Status-indicatoren (✓ Geverifieerd, ✎ Handmatig, ⚠ Verouderd), uit te breiden met review-statussen
- Price deviation detection — `checkPriceDeviation()` in pricing.ts, >50% flag logica
- `getPriceStatus()` — Bestaande staleness check (6 maanden)

### Established Patterns
- Zustand stores met persist middleware → localStorage (herbruiken voor pricing config store)
- React Query voor Supabase data fetching (herbruiken voor publication prices)
- Serverless functions op Vercel voor AI calls (herbruiken voor AI-normalisatie)
- Pure function calculators met ProviderPriceCalculator interface (config als parameter toevoegen)
- RLS policies per team/rol (uitbreiden voor review-queue)

### Integration Points
- `src/data/providers/index.ts` → wordt vervangen door Supabase fetch + store
- Engine calculators → config parameter toevoegen naast huidige directe imports
- App.tsx routing → nieuwe `/review` route voor managers
- Navigation → badge/teller component voor review-queue
- Vergelijkingstabel → toggle voor "publicatieprijzen" vs "inclusief marktkorting"
- `usePriceComparisonStore.initialize()` → moet pricing config uit nieuwe store lezen

</code_context>

<specifics>
## Specific Ideas

- **Kortingspatroon-inzicht:** Wanneer meerdere scholen vergelijkbare kortingen melden van dezelfde concurrent, wordt dit gesignaleerd als marktintelligentie. Dit is strategisch waardevol — het onthult de werkelijke marktprijs vs. de gepubliceerde prijs.
- **AI als intake-normalisatie:** Stakeholders kunnen prijsinformatie in vrije vorm aanleveren ("DIA rekent nu 6,20 voor rekenen, heb ik gehoord van school X"). AI matcht dit op de juiste module-ID, provider, en valideert tegen bestaande data voordat het als voorstel in de queue komt.
- **Scenario-uitbreiding:** De vergelijkingsengine krijgt een extra scenario-toggle: "publicatieprijzen" vs "marktprijzen (incl. ontdekte kortingen)". Dit geeft accountmanagers een realistischer beeld in het gesprek.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-prijsintelligentie-stakeholder-feedback-loop*
*Context gathered: 2026-03-30*
