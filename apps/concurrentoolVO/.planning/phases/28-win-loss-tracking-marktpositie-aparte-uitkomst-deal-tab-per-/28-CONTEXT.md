# Phase 28: Win/loss-tracking & Marktpositie + Korting-verrijking — Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Win/loss-uitkomst-tracking met aparte Uitkomst/Deal-tab per school (vervangt LostDealDialog), cross-school marktpositie-dashboard op eigen `/dashboard` route, per-deal kortingen per (module, provider) die de vergelijking voor die deal herberekenen, en cohort-gebaseerde AI-voorspelling die homogene scholen groepeert op onderwijsvisie + niveau. Pipeline-status en Uitkomst-status blijven **volledig onafhankelijk** — geen sync tussen beide werelden.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements zijn locked.** Zie `28-SPEC.md` voor de volledige requirements, boundaries en acceptance criteria.

Downstream agents (researcher, planner) MOETEN `28-SPEC.md` lezen vóór planning of implementatie. Requirements worden niet hier gedupliceerd.

**In scope (uit SPEC.md):**
- R1: Uitkomst/Deal-tab als canoniek registratiepunt per school (vervangt LostDealDialog)
- R2: WinDealDialog symmetrisch met LostDealDialog — *acceptance herzien per D-10/D-12, zie SPEC Deviation hieronder*
- R3: Per-deal korting per module + provider (% of €) met audit-trail
- R4: Markt-dashboard cross-school met filters (periode + niveau) + trendgrafiek + N-badges
- R5: Cohort-AI voorspelling op `onderwijsvisie` + `schoolniveau` met fallbacks

**Out of scope (uit SPEC.md):**
- PDF/clipboard-export uitbreiden met Uitkomst-data
- Korting-feedback-loop naar Phase 25 markt-aggregaat (FUTURE-XX)
- Externe CRM-sync (Microsoft Dynamics naar backlog)
- Pipeline-status enum wijzigen (geen `gewonnen`/`verloren` toevoegen)
- Top-3 verlies-redenen + per-concurrent breakdown als acceptance-blokkerend
- Migratie van bestaande LostDealInfo-records (alle testdata, schone start)
- AI-voorspelling via LLM/ML — cohort-aggregatie is statistisch

### SPEC Deviation (R2)

**R2 acceptance criterion gewijzigd:** SPEC zei *"Pipeline-status zetten op `klant` opent WinDealDialog"*. Discussie heeft beslist om dialogs **volledig binnen de Uitkomst/Deal-tab** te plaatsen — pipeline-trigger wordt verwijderd. Pipeline-status en Uitkomst-status blijven 100% onafhankelijk (consistent met SPEC R2's onderliggende doel: pipeline = procesfase, Uitkomst = eindstand).

Voor planning: behandel R2 acceptance als *"De 'Deal afsluiten'-knop op de Uitkomst/Deal-tab opent WinDealDialog; bevestigen creëert een gewonnen Uitkomst-record; annuleren laat alles ongewijzigd. Pipeline-status muteert niet vanuit de dialog."*

User kan SPEC.md zelf bijwerken indien gewenst — voor downstream agents is CONTEXT.md leidend.

</spec_lock>

<decisions>
## Implementation Decisions

### Data-architectuur Uitkomst/Deal records

- **D-01:** **Eén actieve Uitkomst per school met lifecycle** — `deal_outcomes` tabel met `status` enum (`open` / `in_negotiation` / `won` / `lost` / `archived`). Bij nieuwe deal-cyclus voor dezelfde school: oude record `status='archived'` zetten, nieuwe record op `open`. Voor MVP volstaat 1-op-1 actieve relatie; history zichtbaar door query op `status='archived'` records.
- **D-02:** **Volledig gedenormaliseerde JSONB-blob** voor snapshot-strategie — kolom `comparison_snapshot JSONB` in `deal_outcomes` bevat de bevroren vergelijking op deal-moment: `{ citoTotal, competitorProvider, competitorTotal, difference, perModuleBreakdown[], providersInScope[] }`. Onafhankelijk van toekomstige prijsdata-wijzigingen, geen FK naar Phase 25 `pricing_configs`. Schema-vorm:
  ```sql
  CREATE TABLE deal_outcomes (
    id UUID PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    team_id UUID NOT NULL,
    status deal_status_enum NOT NULL DEFAULT 'open',
    competitor_provider TEXT NOT NULL,  -- 'dia' | 'jij' | 'overig'
    competitor_name TEXT,  -- alleen bij 'overig'
    reason TEXT,
    reason_category TEXT,  -- 'prijs' | 'functionaliteit' | 'voorkeur' | 'anders'
    contact_id UUID REFERENCES contacts(id),
    comparison_snapshot JSONB NOT NULL,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE UNIQUE INDEX one_active_per_school ON deal_outcomes(school_id)
    WHERE status IN ('open', 'in_negotiation');
  ```
- **D-03:** **Real-time recalc + aparte `deal_audit_log` tabel** — elke korting-write triggert direct recalc in vergelijking-tab (geen 'Herbereken'-knop). Audit-log als dedicated tabel:
  ```sql
  CREATE TABLE deal_audit_log (
    id UUID PRIMARY KEY,
    deal_outcome_id UUID NOT NULL REFERENCES deal_outcomes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,  -- 'discount_added' | 'discount_updated' | 'discount_deleted' | 'status_changed' | etc.
    before_value JSONB,
    after_value JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
  );
  ```
  Per (module, provider) korting in eigen `deal_discounts` tabel met FK naar `deal_outcomes` (zie hieronder).
- **D-04:** **`deal_discounts` tabel** voor per-deal kortingen:
  ```sql
  CREATE TABLE deal_discounts (
    id UUID PRIMARY KEY,
    deal_outcome_id UUID NOT NULL REFERENCES deal_outcomes(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    discount_percentage NUMERIC(5,2),  -- nullable, kies % OF €
    discount_amount NUMERIC(10,2),     -- nullable
    CHECK ((discount_percentage IS NOT NULL) <> (discount_amount IS NOT NULL)),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE UNIQUE INDEX one_discount_per_module_provider ON deal_discounts(deal_outcome_id, module_id, provider);
  ```
  XOR-constraint via CHECK garandeert dat slechts één van % of € is ingevuld per record.

### Dashboard route topology + filter-state + chart

- **D-05:** **Eigen `/dashboard` route, zichtbaar voor alle ingelogde users** — RLS regelt team-scoping (per Phase 8 patroon). Geen extra UI-role-gate (anders dan Phase 26 admin-pricing wat manager-only is). Accountmanagers zien hun eigen team's deals; managers zien identiek (RLS is team-niveau, geen role-niveau onderscheid binnen team).
- **D-06:** **TanStack Router search params voor filter-state** (Phase 26 D-02 patroon) — URL-vorm: `/dashboard?period=90d&level=vmbo&trendMetric=count`. Voordeel: deeplinkable + refresh-safe + delibaar tussen collega's. Geen useState voor filters.
- **D-07:** **Dashboard-paneel layout met Recharts** (al in package.json sinds Phase 1) — Layout:
  - Rij 1: 4 KPI-cards (Totaal deals, Win-rate %, Gemiddelde marge €, Deals deze periode) elk met N-badge en periode-label
  - Rij 2: Grote trendgrafiek over tijd (LineChart of BarChart met week/maand/kwartaal-grouping op x-as, y-as wisselbaar tussen 'aantal deals' en 'win-rate %')
  - Rij 3: Kleine breakdown-charts per concurrent (DonutChart of horizontale bar): Cito vs DIA-win-rate, Cito vs JIJ-win-rate
- **D-08:** **Empty-state + N-badge-tekst** — bij 0 deals: hele dashboard toont `<EmptyState>` met CTA "Eerste deal registreren" link naar school-overzicht. Bij ≥1 deal: cijfers + badge `"Gebaseerd op N deals"`. Bij N < 10: extra disclaimer-banner `"Lage betrouwbaarheid — kleine dataset"`.

### Cohort-AI berekening + caching + fallbacks + presentatie

- **D-09:** **Supabase materialized view `deal_cohort_stats`** — server-side pre-aggregatie. View groepeert `deal_outcomes` (joined met `schools` voor `onderwijsvisie` + `schoolniveau`) op `(onderwijsvisie, schoolniveau)` cohort. Computed: total_deals, won_deals, lost_deals, win_rate, top_lost_reason (mode van `reason_category` waar status='lost'). Refresh-strategie: PostgreSQL trigger op `INSERT/UPDATE/DELETE deal_outcomes` doet `REFRESH MATERIALIZED VIEW CONCURRENTLY deal_cohort_stats`; fallback nightly cron als trigger uitvalt.
- **D-10:** **Fallback bij onvolledige cohort-features** — als school geen `onderwijsvisie` OF geen `schoolniveau` heeft: AI-card toont `"Onvoldoende schoolgegevens voor voorspelling — vul onderwijsvisie + niveau aan"` met CTA-link naar school-profiel-edit. Geen partial-feature voorspelling (zou onbetrouwbare cijfers geven).
- **D-11:** **Inline collapsible card bovenaan Uitkomst/Deal-tab** voor open/in_negotiation deals — `<CohortPredictionCard>` met `<details>`-element. Default expanded. Layout: `"Vergelijkbaar met N {onderwijsvisie}-{niveau} scholen — win-kans X%"` + sub-zin top verlies-reden indien aanwezig. Voor `status='won'` of `status='lost'` deals: card verborgen (geen toegevoegde waarde meer).
- **D-12:** **Cohort-features lookup-volgorde** — bij open Uitkomst-record: client haalt huidige school's `onderwijsvisie` + `schoolniveau` via TanStack Query (al gecached); query op `deal_cohort_stats WHERE onderwijsvisie=? AND schoolniveau=?` levert stats. Bij `total_deals=0`: fallback-tekst `"Eerste in z'n cohort — geen voorspelling beschikbaar"`. Bij 1-4 deals: voorspelling tonen met disclaimer `"Lage betrouwbaarheid — slechts N vergelijkbare scholen"`.

### Win/LostDealDialog UX + LostDealDialog vervanging

- **D-13:** **Aparte 'Deal afsluiten'-knop op Uitkomst/Deal-tab** — geen pipeline-trigger. Tab heeft prominente `<Button variant="primary">Deal afsluiten</Button>` die een radiogroep-dialog opent: "Hoe is de deal afgelopen?" → Gewonnen / Verloren / In onderhandeling. Selectie van Gewonnen → WinDealDialog (prijs-snapshot + datum + contactpersoon + optionele reden). Selectie van Verloren → LostDealDialog-vervanger (concurrent-selectie + prijs-snapshot + reden + categorie + contactpersoon). Selectie van In onderhandeling → simpele status-mutatie zonder dialog.
- **D-14:** **Pessimistic update** — geen state-mutaties tot user expliciet "Bevestigen" klikt in dialog. Cancel / Esc / klik-buiten = niets gebeurt. Voor pipeline-status: dialog raakt pipeline NIET aan; gebruiker beheert pipeline-status apart via `PipelineBadge`. Geen automatische sync.
- **D-15:** **LostDealDialog volledig vervangen** — verwijderen: `src/features/school-profile/components/LostDealDialog.tsx`. Type `LostDealInfo` uit `src/db/types.ts` blijft bestaan als sub-type van een nieuw `DealOutcome` model, maar de losse dialog-component verdwijnt. Bestaande consumer-call sites (waarschijnlijk in DashboardTab of PipelineBadge bij at-risk-transitie) worden vervangen door een redirect of CTA naar de nieuwe Uitkomst/Deal-tab.
- **D-16:** **Nieuw dialog-componenten in `features/school-profile/components/`:**
  - `DealAfsluitenDialog.tsx` — entry-dialog met radiogroep
  - `WinDealDialog.tsx` — gewonnen-flow form
  - `LostDealForm.tsx` — verloren-flow form (reuse interne structuur van bestaande LostDealDialog, maar als form-component i.p.v. dialog)
  Alle drie gebruiken `react-hook-form + zodResolver` (CLAUDE.md rule).

### Carrying forward from Phase 26 + 27

- **D-17:** **Supabase + Dexie-mirror + RLS-patroon** uit Phase 27 D-01 toegepast op nieuwe tabellen `deal_outcomes`, `deal_discounts`, `deal_audit_log`. Elk record heeft `team_id` voor RLS-scoping. Dexie-spiegel via nieuwe models in `src/models/deal-outcome.ts`. Migration via Supabase migration-file.
- **D-18:** **Tab-state via TanStack Router search params** (Phase 26 D-02) — Uitkomst/Deal-tab gebruikt `/scholen/:id?tab=uitkomst` patroon, consistent met bestaande tabs.
- **D-19:** **Sub-componenten via composition** in `features/deal-outcomes/components/` (Phase 27 D-17 patroon):
  - `DealOutcomesTab.tsx` — container (zoals andere tabs)
  - `DealStatusBadge.tsx` — visuele weergave huidige status
  - `DealAfsluitenDialog.tsx` + `WinDealDialog.tsx` + `LostDealForm.tsx` (zie D-16)
  - `DiscountEditor.tsx` — per (module, provider) korting-invoer (table-vorm)
  - `DiscountRow.tsx` — één rij in de editor met % en € invoer met XOR-validatie
  - `CohortPredictionCard.tsx` — AI-voorspelling card (zie D-11)
  - `DealSnapshotView.tsx` — bevroren comparison-snapshot read-only weergave
- **D-20:** **Zod schemas via composition** (Phase 27 D-18) — locatie `src/features/deal-outcomes/schemas/`:
  - `deal-outcome.schema.ts` — status enum + form-fields
  - `deal-discount.schema.ts` — module + provider + percentage/amount XOR
  - `comparison-snapshot.schema.ts` — JSONB shape voor `comparison_snapshot` veld
- **D-21:** **Nieuw feature-folder `src/features/deal-outcomes/`** (i.p.v. binnen `school-profile/`) — past bij de schaal van de fase (eigen tab + dashboard-route + dialog-componenten + engine-uitbreiding). Importeert van `school-profile/` waar nodig (bv. tab-routing).
- **D-22:** **Dashboard in `src/features/dashboard/`** — aparte feature-folder met `DashboardPage.tsx` + `KpiCard.tsx` + `TrendChart.tsx` + `CompetitorBreakdown.tsx` + bijbehorende hooks (`useDealStats`, `useCohortStats`). Route registratie in `src/router/routes.ts`.

### Claude's Discretion

Beslissingen die researcher of planner mag maken zonder user te storen:
- Exacte chart-types voor de breakdown-charts (donut vs horizontaal bar) — visueel detail.
- Exacte materialized-view refresh-strategie (PostgreSQL trigger vs Supabase function vs nightly pg_cron) — Supabase-implementatie-keuze.
- Exacte tab-positie voor Uitkomst/Deal-tab (SPEC zegt "na Comparison, voor Acties" — bevestig dat dit klopt met huidige tab-volgorde, anders compromis).
- React-hook-form vs alternative form-state voor de dialogs (CLAUDE.md zegt react-hook-form, dus default daar).
- Naming van enum-waarden (`open` vs `lopend`, `in_negotiation` vs `onderhandeling`) — voorkeur Engels in code (zie AGENTS.md), Dutch labels in UI.
- Exacte breakdown-grouping voor trendgrafiek (week vs maand vs kwartaal — gebruiker kiest, planner maakt UI).
- Wel/niet caching-laag (TanStack Query staleTime) voor dashboard-queries — researcher kiest tussen 5min default of langer.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 28 zelf
- `apps/concurrentoolVO/.planning/phases/28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-/28-SPEC.md` — Locked requirements (5) + 21 acceptance criteria. **MUST read before planning.** Let op SPEC Deviation R2 hierboven.
- `apps/concurrentoolVO/projects/briefs/phase-28-winloss-tracking/brief.md` — Originele handoff-brief met Goal, scope, open vragen die in SPEC/CONTEXT zijn beantwoord.

### Prior phase context (carry-forward decisions)
- `apps/concurrentoolVO/.planning/phases/27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti/27-CONTEXT.md` §D-01 — Supabase + Dexie + RLS patroon
- `apps/concurrentoolVO/.planning/phases/27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti/27-CONTEXT.md` §D-17, D-18 — Sub-componenten via composition, gedeelde Zod schemas
- `apps/concurrentoolVO/.planning/phases/26-cito-prijzen-concurrentie-editor-startscherm-entry-naast-sch/26-CONTEXT.md` §D-02 — TanStack Router search params voor tab/filter-state
- `apps/concurrentoolVO/.planning/phases/26-cito-prijzen-concurrentie-editor-startscherm-entry-naast-sch/26-CONTEXT.md` §D-06 — Manager-only gate patroon (referentie — niet gebruikt voor /dashboard)
- `apps/concurrentoolVO/.planning/phases/25-prijsintelligentie-stakeholder-feedback-loop/25-CONTEXT.md` — Market discount-patterns engine (Phase 28 raakt deze NIET aan)

### App-level governance
- `apps/concurrentoolVO/CLAUDE.md` — Stack, locked files (`src/data/default-prices.ts`, `cito-migration-prices.ts`), hard rules (Dutch UI, English code, react-hook-form + Zod, pure-function engines, getState-pattern, 3 hardcoded providers)
- `apps/concurrentoolVO/AGENTS.md` — App-specific overrides op root template (npm, ESLint, Vite, TanStack Router, Zustand)
- `app-dev-os/ADR/0007-single-branch-no-pr-workflow.md` — Branching policy (single `main`, feature branches, no PR ceremony)

### Bestaande code die Phase 28 raakt of vervangt
- `apps/concurrentoolVO/src/features/school-profile/components/LostDealDialog.tsx` — **te verwijderen**, vervangen door `LostDealForm` in nieuwe `DealAfsluitenDialog`-flow
- `apps/concurrentoolVO/src/db/types.ts` §LostDealInfo — type wordt sub-type van nieuw `DealOutcome` model
- `apps/concurrentoolVO/src/components/ui/PipelineBadge.tsx` — pipeline-status component, **NIET aangepast** door Phase 28 (pipeline blijft onafhankelijk)
- `apps/concurrentoolVO/src/features/price-comparison/MarktKortingToggle.tsx` — markt-aggregaat-korting, **NIET aangepast** (per SPEC: blijft apart)
- `apps/concurrentoolVO/src/features/price-comparison/KortingsPatroonAlert.tsx` — idem
- `apps/concurrentoolVO/src/engine/price-comparison.ts` — engine, krijgt uitbreiding voor per-deal korting-recalc (nieuwe optie `dealDiscounts`)
- `apps/concurrentoolVO/src/router/routes.ts` — krijgt nieuwe route `/dashboard` (zonder role-gate)
- `apps/concurrentoolVO/src/lib/supabase/types.ts` — krijgt nieuwe types voor `deal_outcomes`, `deal_discounts`, `deal_audit_log`, `deal_cohort_stats` view

### Tech-references
- Recharts docs — voor TrendChart en breakdown-charts (al in `package.json`)
- TanStack Router search-params docs — voor filter-state op `/dashboard`
- Supabase materialized views docs — voor `deal_cohort_stats` aggregatie

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`PipelineBadge.tsx`** — pattern voor status-badge met dropdown; `DealStatusBadge` kan analogie zijn
- **`LostDealDialog.tsx`** — interne form-structuur (concurrent-selectie, reden) hergebruikt in `LostDealForm.tsx` na refactor
- **`ProfileHeader.tsx`** — al een tab-host op school-profiel; nieuwe Uitkomst/Deal-tab past in dezelfde nav
- **Recharts** (`recharts` in package.json sinds Phase 1) — `LineChart`, `BarChart`, `PieChart` direct beschikbaar voor dashboard
- **TanStack Query setup** (Phase 8 + 11) — `useQuery` / `useMutation` hooks-conventie voor Supabase-koppeling
- **TanStack Router search params** (`useSearch`, `Link` met `search` prop) — voor filter-state op /dashboard
- **react-hook-form + zodResolver** patroon (CLAUDE.md hard rule) — voor alle nieuwe form-flows in dialogs
- **Supabase RLS-policies** (Phase 8 patroon) — team-scoped policies voor nieuwe tabellen
- **Dexie-mirror models** in `src/models/` (Phase 6 + 7) — voor offline-fallback van deal_outcomes
- **PriceBadge component** — al gebruikt voor prijsweergave, herbruikbaar in DealSnapshotView

### Established Patterns
- **Pure-function engines** (Phase 10.2) — `price-comparison.ts` uitbreiding moet pure blijven; nieuwe `dealDiscounts` optie als pure parameter
- **JSONB persistence voor extensie-data** (Phase 27 D-14) — `comparison_snapshot` als JSONB-blob volgt dit patroon
- **Sub-componenten via composition** (Phase 27 D-17) — geen mega-components, splitsen per logisch blok
- **Search-params voor tab/filter-state** (Phase 26 D-02) — deeplinkable URLs
- **Zod-schema-composition via .merge()/.extend()** (Phase 27 D-18) — voor deal-outcome + deal-discount schemas
- **Server-side AI via Vercel function + `claude-haiku-4-5`** (Phase 9 + 26 + 27) — NB: Phase 28 cohort-AI is statistisch, geen LLM-call. Geen Vercel function voor cohort
- **Pessimistic UI voor destructive/irreversible actions** (eigen keuze D-14, niet uit prior phases) — voorkomt onbedoelde mutaties

### Integration Points
- **`src/features/school-profile/ProfileHeader.tsx` of TabNavigation** — registreer nieuwe Uitkomst-tab tussen Comparison en Acties
- **`src/router/routes.ts`** — registreer `/dashboard` route
- **`src/engine/price-comparison.ts`** — engine-functie krijgt optionele `dealDiscounts: DealDiscount[]` parameter; pure recalc met overrides
- **`src/lib/supabase/types.ts`** — auto-genereerd via Supabase CLI na nieuwe migrations; types worden gebruikt door operations.ts
- **`src/db/operations.ts`** — krijgt CRUD-operaties voor deal_outcomes en deal_discounts
- **Supabase migration-file** in `supabase/migrations/` — nieuwe tabellen + RLS policies + materialized view + trigger
- **`src/features/dashboard/` (nieuw)** — top-level feature-folder voor `/dashboard` route

</code_context>

<specifics>
## Specific Ideas

- **Schema-vorm `deal_outcomes`** is in D-02 expliciet uitgeschreven inclusief unique-index op `(school_id) WHERE status IN ('open','in_negotiation')` — voorkomt twee actieve deals per school.
- **XOR-constraint op `deal_discounts.discount_percentage` vs `discount_amount`** (D-04) is via CHECK-constraint expliciet afgedwongen — exactly één van twee per row.
- **Tab-positie:** SPEC zegt "na Comparison, voor Acties" — bevestigen tegen huidige `ProfileHeader` tab-volgorde tijdens planning.
- **Engelse enum-waarden in code, Nederlandse labels in UI** — `open` / `in_negotiation` / `won` / `lost` in DB; "Lopend" / "In onderhandeling" / "Gewonnen" / "Verloren" in UI. Conversie via `dealStatusLabels` map.
- **Materialized view refresh-strategie:** trigger op deal_outcomes write is wenselijk maar mag fallback hebben naar nightly cron als trigger te zwaar blijkt.

</specifics>

<deferred>
## Deferred Ideas

### FUTURE-XX kandidaten
- **Korting-feedback-loop naar Phase 25 markt-aggregaat** — per-deal kortingen voeden automatisch de `KortingsPatroonAlert` aggregaat. SPEC heeft expliciet "voor nu apart, later mogelijk wel" gekozen.
- **Microsoft Dynamics CRM-sync** — verschoven naar backlog tijdens SPEC-discussie. Stub-laag-aanpak werd te groot voor Phase 28.
- **AI-voorspelling via LLM/ML training** — huidige cohort-AI is een pure statistische aggregatie (Supabase view). Een echte ML-laag (bv. logistic regression of LLM-call) zou toekomstige uitbreiding kunnen zijn als cohort-data te ruw blijkt.
- **PDF/clipboard-export uitbreiden met Uitkomst-data** — Phase 12/21 blijven ongewijzigd. Nice-to-have voor latere fase.
- **Top-3 verlies-redenen + per-concurrent breakdown als acceptance-blokkerend** — nu Claude's discretion-niveau (planner mag meenemen als haalbaar maar niet blokkerend bij oplevering).
- **Multi-active deals per school** — als jaarlijkse-contract-cyclus blijkt te beperkend (bv. tussentijdse heronderhandelingen voor losse modules), kan model uitgebreid worden naar 1-op-veel.

### Reviewed Todos (not folded)
None — geen pending todos die phase 28 raken (todo.match-phase gaf 0 matches).

</deferred>

---

*Phase: 28-win-loss-tracking-marktpositie*
*Context gathered: 2026-05-14*
