# Phase 28: Win/loss-tracking & Marktpositie — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 28-win-loss-tracking-marktpositie
**Areas discussed:** Data-architectuur, Dashboard, Cohort-AI, Win/LostDealDialog UX

---

## Area 1 — Data-architectuur Uitkomst/Deal records

### Q1a: Hoeveel Uitkomst-records per school over de tijd?

| Option | Description | Selected |
|--------|-------------|----------|
| Altijd één actieve Uitkomst per school (lifecycle: open → in onderhandeling → gewonnen/verloren → archived bij nieuwe deal) | 1 deal_outcomes-record per school met status-veld. Bij nieuwe deal: oude record archiveren. | ✓ |
| Meerdere Uitkomst-records per school (1-op-veel), historie zichtbaar als lijst in tab | Elke deal-cyclus = eigen record. Volledige historie. | |
| Één actieve Uitkomst + history-array in JSONB op SchoolRecord | Actieve in deal_outcomes, gearchiveerde als JSONB op SchoolRecord. | |

**User's choice:** Altijd één actieve Uitkomst per school met lifecycle (D-01).
**Notes:** Pas in lifecycle: open → in onderhandeling → gewonnen/verloren → archived. Voor toekomstige multi-active behoefte: zie deferred ideas.

### Q1b: Snapshot-strategie — hoe leggen we vergelijking-data vast?

| Option | Description | Selected |
|--------|-------------|----------|
| Volledig gedenormaliseerde JSONB-blob in deal_outcomes | comparison_snapshot JSONB. Onafhankelijk van toekomstige prijswijzigingen. | ✓ |
| Alleen totalen + FK naar bestaande pricing_configs-versie | Compacter, kan herhalen via engine bij later opzoeken. | |
| Hybride: totalen + per-module breakdown in JSONB, geen FK | Beide werelden. | |

**User's choice:** Volledig gedenormaliseerde JSONB-blob (D-02).
**Notes:** Geen koppeling terug naar Phase 25 pricing_configs — deal-snapshot leeft autonoom. Audit-friendly.

### Q1c: Recalc + audit-trail-mechanisme?

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time recalc op elke korting-write + aparte deal_audit_log tabel | Direct recalc. Audit als dedicated tabel. | ✓ |
| Expliciete 'Herbereken'-knop + aparte deal_audit_log tabel | Voorkomt rerenders tijdens typen. | |
| Real-time recalc + audit als JSONB-veld op deal_outcomes | Minder tabellen, audit-queries trager. | |

**User's choice:** Real-time recalc + aparte deal_audit_log tabel (D-03, D-04).
**Notes:** Per (module, provider) korting in eigen deal_discounts tabel met XOR-constraint op % OF €.

---

## Area 2 — Dashboard route topology + filter-state + chart-component

### Q2a: Dashboard route + zichtbaarheid?

| Option | Description | Selected |
|--------|-------------|----------|
| Eigen /dashboard route, manager-only (RLS+UI-gate zoals Phase 26) | Aparte route. Cross-school data = manager-bevoegdheid. | |
| Eigen /dashboard route, zichtbaar voor alle ingelogde users | RLS regelt team-scoping. Geen extra UI-gate. | ✓ |
| Inline op startscherm als 3e card naast Schooloverzicht + Cito Prijzen | Past in Phase 26 startscherm-patroon. | |
| Sub-route binnen /scholen als extra tab in SchoolOverviewPage | Hergebruikt bestaande ViewToggle. | |

**User's choice:** Eigen /dashboard route voor alle ingelogde users (D-05).
**Notes:** RLS-team-scoping is voldoende; geen extra UI-role-gate (anders dan Phase 26 admin-pricing).

### Q2b: Filter-state — waar bewaard?

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Router search params (Phase 26 D-02 patroon) | URL deeplinkable + refresh-safe. | ✓ |
| Component useState | Eenvoudiger, niet-persistent. | |
| Zustand store + localStorage persist | Persistent over sessies, geen deeplinks. | |

**User's choice:** TanStack Router search params (D-06).
**Notes:** Consistent met Phase 26 D-02. URL-vorm: /dashboard?period=90d&level=vmbo.

### Q2c: Chart-library + layout?

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts + paneel-style (KPI-cards + grote trendgrafiek) | Geen nieuwe dep. Minimaal MVP. | |
| Recharts + dashboard-paneel + per-concurrent kleine breakdown-charts | Meer info-dichtheid. | ✓ |
| Recharts + minimal: alleen KPI-cards (geen chart) | Schoonst, maar SPEC zou herzien moeten worden. | |

**User's choice:** Recharts + paneel + per-concurrent breakdown-charts (D-07).
**Notes:** Layout met 3 rijen: KPI-cards, trendgrafiek, breakdown-charts per concurrent. SPEC trendgrafiek-requirement gehaald.

---

## Area 3 — Cohort-AI berekening + caching + fallbacks + presentatie

### Q3a: Cohort-AI berekening — waar en wanneer?

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side pure function over alle deal_outcomes | Snel bij <500 deals. Geen server-werk. | |
| Supabase view + materialized cohort_stats tabel, refresh via trigger of nightly cron | Server-side pre-aggregatie. Schaalt tot 10K+ deals. | ✓ |
| Hybride: client-side berekening met React Query staleTime=5min | Pragmatisch voor MVP. | |

**User's choice:** Supabase materialized view + trigger/nightly refresh (D-09).
**Notes:** Schaalt naar grotere datasets. Trigger-strategie of cron-fallback wordt door researcher gekozen.

### Q3b: Fallback bij onvolledige cohort-features?

| Option | Description | Selected |
|--------|-------------|----------|
| Toon 'Onvoldoende schoolgegevens — vul onderwijsvisie + niveau aan' met link | Push user naar profiel-edit. | ✓ |
| Toon voorspelling op alleen wel-ingevulde features met disclaimer | Meer info maar minder accuraat. | |
| Toon fallback 'eerste in z'n cohort' (SPEC R5) | Consistent met cohort-grootte-0 fallback. | |

**User's choice:** "Onvoldoende schoolgegevens" + link naar school-profiel (D-10).
**Notes:** Voorkomt onbetrouwbare partial-voorspellingen. Drukt user naar data-completion.

### Q3c: Cohort-AI presentatie — waar op de open Uitkomst-record-detail?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline card bovenaan Uitkomst-tab voor open/in-onderhandeling deals (collapsible) | Direct zichtbaar, voor afgesloten deals verborgen. | ✓ |
| Sidebar-paneel rechts (sticky) | Continu zichtbaar tijdens scrollen. | |
| Toggle-button die compacte sub-banner activeert | Minder UI-noise, minder gebruik. | |

**User's choice:** Inline collapsible card bovenaan tab (D-11).
**Notes:** Voor gewonnen/verloren deals card verborgen — voorspelling heeft dan geen toegevoegde waarde meer.

---

## Area 4 — Win/LostDealDialog UX, trigger-flow, vervanging

### Q4a: Hoe wordt WinDealDialog getriggerd?

| Option | Description | Selected |
|--------|-------------|----------|
| PipelineBadge dropdown — bij selectie 'klant' opent direct WinDealDialog | Consistent UX, intercept-before-save. | |
| Aparte 'Deal afsluiten'-knop op Uitkomst/Deal-tab (los van pipeline-dropdown) | Decoupled flow. | ✓ |
| Beide — trigger via pipeline OF via Uitkomst-tab-knop | Maximale flexibiliteit. | |

**User's choice:** Aparte 'Deal afsluiten'-knop op Uitkomst/Deal-tab (D-13).
**Notes:** ⚠ Dit wijkt af van SPEC R2 acceptance ("Pipeline-status zetten op klant opent WinDealDialog"). User koos voor strict scheiding pipeline/Uitkomst zoals SPEC R2 oorspronkelijk bedoeld. Gedocumenteerd als SPEC Deviation in CONTEXT.md.

### Q4b: Annuleren — pipeline-status rollback?

| Option | Description | Selected |
|--------|-------------|----------|
| Optimistic UI: pipeline direct gezet, bij cancel rollback | Snelle feedback, race-conditions. | |
| Pessimistic: pipeline-status pas gemuteerd na bevestigen | Nooit schrijfactie zonder bevestiging. | ✓ |
| Modaal-vergrendeling: dialog blokkeert UI tot expliciete keuze | Forceer keuze, slechte UX bij per-ongeluk-klik. | |

**User's choice:** Pessimistic update (D-14).
**Notes:** Pipeline-status raakt sowieso niet aan dialog (per D-13/D-15), dus pessimistic geldt voor alle dialog-acties.

### Q4c: LostDealDialog vervanging + trigger-locaties?

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen via Uitkomst/Deal-tab — beide dialogs binnen tab (geen pipeline-trigger) | Strict scheiding pipeline/Uitkomst. SPEC R2 herzien. | ✓ |
| Pipeline triggert dialogs (SPEC R2) + Uitkomst-tab toont achteraf | SPEC-compliant. | |
| Alleen via Uitkomst-tab + non-blocking toast op pipeline-dropdown | Lichtere dwang. | |

**User's choice:** Alleen via Uitkomst-tab — geen pipeline-trigger (D-13, D-15).
**Notes:** Volledig consistent met SPEC's onderliggende constraint "pipeline = procesfase, Uitkomst = eindstand, geen sync". SPEC R2 acceptance moet hierop worden bijgewerkt (gedocumenteerd in CONTEXT.md).

---

## Claude's Discretion

Beslissingen die de researcher of planner mag maken zonder user te storen:
- Exacte chart-types voor breakdown-charts (donut vs horizontaal bar)
- Exacte materialized-view refresh-strategie (PostgreSQL trigger vs Supabase function vs pg_cron)
- Tab-positie validatie van Uitkomst/Deal-tab (SPEC zegt "na Comparison, voor Acties")
- React-hook-form vs alternatives voor dialogs (CLAUDE.md default = react-hook-form)
- Naming van enum-waarden in DB (`open` vs `lopend`) — Engels in code, Dutch in UI
- Exacte breakdown-grouping voor trendgrafiek (week/maand/kwartaal — gebruiker kiest, planner maakt UI)
- Caching-laag TanStack Query staleTime voor dashboard-queries

## Deferred Ideas

- Korting-feedback-loop naar Phase 25 markt-aggregaat — FUTURE-XX
- Microsoft Dynamics CRM-sync (basis read-only) — backlog
- AI-voorspelling via LLM/ML training i.p.v. statistische cohort-aggregatie — FUTURE
- PDF/clipboard-export uitbreiden met Uitkomst-data — latere fase (Phase 12/21 niet gewijzigd)
- Top-3 verlies-redenen + per-concurrent breakdown als acceptance-blokkerend — nu Claude's discretion
- Multi-active deals per school (i.p.v. 1 actieve) — als jaarlijkse-contract-cyclus te beperkend blijkt

---

*Audit trail — Discussion conducted 2026-05-14*
