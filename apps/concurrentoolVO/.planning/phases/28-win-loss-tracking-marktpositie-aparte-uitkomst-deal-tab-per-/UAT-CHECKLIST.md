# Phase 28 — UAT Checklist (21 SPEC acceptance criteria)

> **UAT pending — user to run through these criteria manually after phase 28 lands.**
>
> This artifact satisfies the Plan 28-09 Task 4 `checkpoint:human-verify` deliverable.
> Phase 28 closure is not blocked on synchronous user confirmation; the user can
> walk through this list independently and tick off each item.
>
> Source: `apps/concurrentoolVO/.planning/phases/28-.../28-SPEC.md` § Acceptance Criteria.

## How to use

1. Boot the app locally: `cd apps/concurrentoolVO && npm run dev`.
2. Walk down each section. For every item, perform the action and tick the checkbox
   if the observed behaviour matches.
3. If anything fails, capture the specifics (screenshot or note) and either:
   - File a Plan 28-10 (or a follow-up fix-plan) for the failing item, OR
   - Re-open the relevant Plan if the failure is in-scope for an existing one.

---

## R1 — Uitkomst/Deal-tab is canoniek registratiepunt

- [ ] **A1**: Uitkomst/Deal-tab is bereikbaar via school-profiel-navigatie tussen
      Vergelijking en Producten en toont een lege state bij geen records.
- [ ] **A2**: Accountmanager kan een nieuwe Uitkomst-record aanmaken met status
      (4 actieve waarden: open / in_negotiation / won / lost), prijs-snapshot,
      reden, contactpersoon en datum.
- [ ] **A3**: Bestaande Uitkomst-record is achteraf bewerkbaar (status, reden,
      contactpersoon, prijzen kunnen muteren).
- [ ] **A4**: LostDealDialog is verwijderd uit codebase — geen imports, geen
      rendering. Grep gate uit Plan 28-09 Task 2 verifieert dit
      (`grep -rn "LostDealDialog" src/ --include="*.ts" --include="*.tsx" | grep -v __tests__` → 0 hits).

## R2 — WinDealDialog symmetrische gewonnen-deal-flow

- [ ] **A5**: "Deal afsluiten"-knop opent radiogroup-dialog (DealAfsluitenDialog).
- [ ] **A6**: Gewonnen-radio → WinDealDialog → bevestigen → record met
      status='won' verschijnt in Uitkomst-tab.
- [ ] **A7**: Verloren-radio → LostDealForm → bevestigen → record met
      status='lost' verschijnt in Uitkomst-tab.
- [ ] **A8**: In onderhandeling-radio → directe status-mutatie zonder nested
      dialog (per CONTEXT D-13).
- [ ] **A9**: Annuleren / Esc / click-buiten dismist zonder mutatie.
- [ ] **A10**: Pipeline-status muteert NIET vanuit een dialog (verify via
      DevTools Network tab — geen `pipeline_status` update voor deal-mutaties).
- [ ] **A10b (B2 fix)**: Kanban-drag naar 'verloren' kolom navigeert naar
      Uitkomst-tab (geen LostDealDialog meer).

## R3 — Per-deal kortingen per (module, provider)

- [ ] **A11**: Per (module, provider) kan korting als % OF als absoluut €
      worden vastgelegd op een Uitkomst-record.
- [ ] **A12**: XOR-validatie: typing in % disables €, en omgekeerd.
- [ ] **A13**: Vergelijking-tab toont, wanneer een Uitkomst met kortingen
      geopend is, herberekende totalen incl. die kortingen + "Inclusief
      deal-kortingen"-banner.
- [ ] **A14**: Korting-verwijdering herstelt publicatieprijs in vergelijking-tab
      voor die deal.
- [ ] **A15**: Audit-log record bestaat voor elke korting-mutatie
      (insert/update/delete) met user-id + timestamp + voor/na waarden,
      zichtbaar in AuditLogAccordion.

## R4 — Markt-dashboard cross-school

- [ ] **A16**: /dashboard route toont KPI's (Totaal deals + Win-rate +
      gemiddelde marge €) met "Gebaseerd op N deals"-badge.
- [ ] **A17**: Filter periode (30 / 90 / 365 / custom) past de getoonde subset
      correct aan.
- [ ] **A18**: Filter niveau (vmbo / havo / vwo + sub-types) past de getoonde
      subset correct aan.
- [ ] **A19**: Trendgrafiek toont over de gekozen periode het aantal deals OF
      win-rate op de y-as.
- [ ] **A19b**: Empty-state correct (N=0 globaal + filtered-empty).
- [ ] **A19c**: ReliabilityBanner verschijnt voor 0 < N < 10.

## R5 — Cohort-AI voorspelling

- [ ] **A20**: Voor een open deal met bekend niveau + onderwijsvisie toont UI:
      win-kans % + cohort-grootte + matching features (welke 2 features matchten)
      + top verlies-reden in cohort.
- [ ] **A20b**: Top verlies-reden zichtbaar wanneer cohort ≥1 verloren deal bevat.
- [ ] **A20c**: Cohort-grootte = 0 → fallback "eerste in z'n cohort".
- [ ] **A20d**: Cohort-grootte 1-4 → "lage betrouwbaarheid"-disclaimer.
- [ ] **A20e**: School zonder onderwijsvisie/niveau → CTA naar schoolprofiel
      ("Onvoldoende schoolgegevens").
- [ ] **A20f**: CohortPredictionCard verbergt voor status ∈ {won, lost, archived}.

## Cross-cutting acceptance

- [ ] **A21**: Supabase RLS-policies beperken zicht op deal_outcomes /
      deal_discounts / deal_audit_log tot eigen team (test door als andere
      team-user in te loggen en niet-eigen records te zien NIET op te halen).

## Performance + regression

- [ ] **P1**: Dashboard laadt < 2s bij 500 deals (lokale meting in dev-omgeving;
      DevTools Performance tab of fixture-seed).
- [ ] **R1-reg**: MarktKortingToggle + KortingsPatroonAlert (Phase 25) werken
      nog (geen regressies).
- [ ] **R2-reg**: Gevoeligheidsanalyse (Phase 10) werkt nog.
- [ ] **R3-reg**: Pipeline-dropdown + PipelineBadge werken nog (alleen geen
      LostDealDialog meer; 'verloren' option heeft tooltip naar Uitkomst-tab).

---

## Sign-off

Wanneer alle 32 checks pass:

- [ ] **UAT approved** by: ____________________ (date: __________)

Bij failures: noteer hier de issue + plan-cycle waarin het opgelost wordt.

```text
Issue 1:
Issue 2:
...
```

---

*Phase 28 close-out artifact — created 2026-05-15 by Plan 28-09 Task 4.*
