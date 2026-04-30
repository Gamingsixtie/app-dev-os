---
name: ops-competitor-intel
description: >
  Single entry point for all competitor intelligence management: prices, features,
  differentiators. Orchestrates manual input, document upload, AI extraction,
  review queue and discount pattern detection. Triggered by: "competitor intel",
  "update competitor data", "check Dia pricing", "JIJ! features", "prijzen
  bijwerken", "concurrentieonderzoek", "Cito prijsstructuur invoeren", "modules
  bijwerken", "productcatalogus", "nieuwe prijs invoeren", "prijsvoorstel
  indienen", "marktkorting", "kortingspatroon". Does NOT trigger for: school
  profile, wizard, export, value case, UI design.
---

# Competitor Intel

Orchestrator voor alle concurrentie-intelligentie: prijzen, features en differentiators van Cito, DIA en JIJ!. Routeert invoer via het juiste kanaal naar de review-queue.

## Outcome

Prijsdata in Supabase via de review-queue. Alle wijzigingen worden gevalideerd door AI en goedgekeurd door een manager voordat ze actief worden in de vergelijkingsengine.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| `src/db/pricing-operations.ts` | Reference | CRUD functions for all pricing tables |
| `src/lib/ai-price-normalization.ts` | Reference | AI normalization functions |
| `src/engine/discount-patterns.ts` | Reference | Pattern detection engine |
| `src/features/review/ReviewQueuePage.tsx` | Reference | Manager review workflow |
| `context/learnings.md` | `## ops-competitor-intel` | Previous patterns and pitfalls |

---

## Step 1: Identify Intent

Bepaal het type verzoek van de gebruiker:

| Intent | Voorbeeld | Route |
|--------|-----------|-------|
| Update publicatieprijs | "DIA rekent nu 3.50 voor rekenen" | Step 2a: Manual price update |
| Document uploaden | "Hier is de DIA prijslijst 2026" | Step 2b: Document upload |
| Vrije tekst intake | "School X zegt dat DIA 15% korting biedt" | Step 2c: AI text extraction |
| Kortingspatronen bekijken | "Welke kortingen zien we bij DIA?" | Step 2d: Discount patterns |
| Features/differentiators updaten | "DIA heeft nu adaptieve toetsing" | Step 2e: Feature update |
| Review queue | "Wat staat er open?" | Step 2f: Review queue |

---

## Step 2: Route to Correct Channel

### 2a: Manual Price Update

1. Wijs de gebruiker naar de Products-tab van een school
2. Klik "Klopt niet" naast de betreffende prijs
3. `PriceProposalModal` opent -- vul nieuw bedrag, bron en toelichting in
4. AI normaliseert via `normalizePrice()` uit `src/lib/ai-price-normalization.ts`
5. Voorstel komt in de review-queue (`price_proposals` tabel)

### 2b: Document Upload

1. Wijs naar bestaande document-upload flow (DocumentDropzone in school profile)
2. Bestaande `extract-document.ts` API parseert het document
3. `DocumentExtractionPreview` toont geextraheerde prijzen in diff-view
4. Na bevestiging: elk prijspunt wordt een `price_proposal` via `createPriceProposal()`

### 2c: AI Text Extraction

1. Gebruiker plakt vrije tekst met prijsinformatie
2. Roep `normalizePrice()` aan uit `src/lib/ai-price-normalization.ts`
3. AI matcht op juiste module-ID, provider-key, bedrag in EUR
4. Toon gestructureerd resultaat in diff-view
5. Na bevestiging: `createPriceProposal()` uit `src/db/pricing-operations.ts`

### 2d: Discount Patterns

1. Roep `detectDiscountPatterns()` aan uit `src/engine/discount-patterns.ts`
2. Toont school-specifieke kortingen gegroepeerd per provider
3. Bij 3+ scholen met vergelijkbare korting: signalering als marktintelligentie
4. Gebruiker kan MarktKortingToggle activeren in de vergelijking

### 2e: Feature/Differentiator Update

1. Wijs naar Admin Editor (`/admin`)
2. Manager kan pricing configs aanpassen: bundels, tiers, pakketten
3. Wijzigingen in `pricing_configs` tabel via admin editor forms
4. Validatie dat structuur geldig is voor de calculator

### 2f: Review Queue

1. Navigeer naar `/review`
2. `ReviewQueuePage` toont openstaande voorstellen met filters
3. Manager kan goedkeuren of afwijzen
4. Goedgekeurd: prijs wordt direct actief, engines herberekenen automatisch

---

## Step 3: Validate and Confirm

Alle invoer wordt genormaliseerd door AI:
- Module-naam -> module-ID (fuzzy matching)
- Aanbieder -> provider key (cito/dia/jij)
- Bedrag -> EUR, punt als decimaal
- Validatie tegen bestaande data (afwijking >50% -> waarschuwing)

Toon altijd een diff-view: huidige prijs -> voorgestelde prijs, met bron en vertrouwen.

---

## Step 4: Submit to Review Queue

Alle wijzigingen gaan door de review-queue:
1. `createPriceProposal()` maakt een voorstel aan in `price_proposals` tabel
2. Status: `pending` -> `approved` of `rejected`
3. Managers (bestaande rol) keuren goed via `/review`
4. Managers mogen hun eigen voorstellen goedkeuren (self-approve)
5. Badge op navigatie toont aantal openstaande voorstellen

---

## Step 5: Report Patterns

Na elke prijswijziging:
1. Check of de nieuwe data kortingspatronen creert via `detectDiscountPatterns()`
2. Rapporteer significante patronen: "DIA biedt gemiddeld X% korting (N scholen)"
3. Adviseer over MarktKortingToggle als er voldoende data is

---

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|-----------------|------------|
| `ops-price-intake` | Optional | Free-form text intake during live calls | Use direct modal entry via PriceProposalModal |

---

## Rules

- NOOIT direct prijzen wijzigen in `src/data/` -- alles via review-queue
- AI normaliseert alle invoer ongeacht kanaal (D-12)
- Iedereen kan voorstellen indienen, alleen managers keuren goed (D-05/D-06)
- Staleness alert bij prijzen ouder dan 6 maanden -- adviseer refresh
- Leg het PRIJSMODEL vast, niet alleen het bedrag
- Accepteer elk format: vrije tekst, PDFs, screenshots, URLs
- Markeer schattingen en inflatiecorrecties expliciet

## Self-Update

Als de gebruiker een fout aangeeft of een nieuw invoerkanaal meldt, update de routing-tabel in Step 2 en de Rules sectie direct.
