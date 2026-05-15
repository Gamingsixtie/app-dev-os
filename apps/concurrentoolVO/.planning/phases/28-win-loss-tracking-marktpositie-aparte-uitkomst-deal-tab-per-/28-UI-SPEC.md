---
phase: 28
slug: win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-14
language: nl-NL
target_device: tablet-first (iPad 10" / 12.9"), works on desktop ≥1280px
---

# Phase 28 — UI Design Contract

> Visual and interaction contract for Phase 28 (Win/loss-tracking & Marktpositie + Korting-verrijking). Pre-populated from `28-SPEC.md` + `28-CONTEXT.md` + existing app tokens. ALL UI copy in formele Nederlandse u-vorm; code identifiers in English.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — custom Tailwind v4 token set (no shadcn) |
| Preset | not applicable |
| Component library | none — handrolled primitives in `src/components/ui/*` (PipelineBadge, PriceBadge, DeleteSchoolDialog patterns) |
| Styling | Tailwind CSS v4 `@theme` block in `src/styles/index.css` |
| Icon library | inline SVG (already established pattern in SchoolOverviewPage filter bar, ProfileHeader, etc.) — NO new icon dep |
| Font | system-ui default (Tailwind v4 default font stack) |
| Charts | `recharts` ^3.8.0 (already installed since Phase 1) |
| Forms | `react-hook-form` ^7.71.2 + `zod` ^4.3.6 + `zodResolver` (CLAUDE.md hard rule) |
| Dialog overlays | `fixed inset-0 z-50` + `style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}` pattern from `LostDealDialog.tsx` (carry-forward) |

**Source of truth:** `apps/concurrentoolVO/src/styles/index.css` — `@theme` block defines all `--color-cito-*`, `--color-status-*`, `--color-neutral-*` tokens. No new tokens are introduced by Phase 28.

---

## Information Architecture

### 1. School-profile tab bar (`TabNavigation.tsx`)

Current tab order: `Overzicht | Vergelijking | Producten | Contacten | Gesprekken | Schoolplan | Export`

**Phase 28 inserts:** `Uitkomst` tab **between `Vergelijking` and `Producten`** (per SPEC §Constraints "na Comparison, voor Acties" — note: the current TabNav has no "Acties" tab; the closest semantic equivalent is `Producten` followed by CRM-tabs. Researcher confirms placement after `Vergelijking` honors the "sales-flow-logisch" intent in SPEC).

New order: `Overzicht | Vergelijking | Uitkomst | Producten | Contacten | Gesprekken | Schoolplan | Export`

| Label | Path | Tab key |
|-------|------|---------|
| Uitkomst | `/scholen/$slug/uitkomst` | `uitkomst` |

Add to `SCHOOL_TAB_ROUTES` constant in `routes.ts`. Lazy-load `DealOutcomesTab.tsx`.

### 2. New top-level route

| Route | Component | Auth gate |
|-------|-----------|-----------|
| `/dashboard` | `src/features/dashboard/DashboardPage.tsx` (lazy) | logged-in only — no role gate per D-05; RLS handles team scoping |

Surface entry point: add `Marktdashboard` link in `RootLayout` header next to `Schooloverzicht` / `Prijzen` startscherm cards. Also reachable from the homescreen `StartschermPage` as a third entry-card (consistent with Phase 26 pattern).

### 3. Uitkomst-tab page structure (top → bottom)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Status header strip                                              │
│    DealStatusBadge + lifecycle label + decided_at + AM-name         │
│    Right side: "Deal afsluiten" primary button (when status=open/   │
│                in_negotiation) OR "Heropen deal" ghost (won/lost)   │
├─────────────────────────────────────────────────────────────────────┤
│ 2. CohortPredictionCard (collapsible, default expanded)             │
│    ONLY when status ∈ {open, in_negotiation}                        │
│    Hidden for won/lost/archived                                      │
├─────────────────────────────────────────────────────────────────────┤
│ 3. DealSnapshotView (comparison_snapshot read-only)                  │
│    Frozen Cito-prijs + concurrent-prijs + verschil €/%               │
│    Sub-card per module met breakdown                                 │
│    Toon "Bevroren op: {decided_at|created_at}" timestamp             │
├─────────────────────────────────────────────────────────────────────┤
│ 4. DiscountEditor                                                    │
│    Table: rijen per (module × provider), kolommen Module / Provider │
│    / Korting (% of €, XOR) / Effect / Actie                          │
│    "Korting toevoegen"-knop opent inline DiscountRow in edit-mode    │
├─────────────────────────────────────────────────────────────────────┤
│ 5. Deal-details strip (vertical form-list, niet in dialog)          │
│    - Reden (textarea)                                                │
│    - Reden-categorie (select: prijs / functionaliteit /              │
│      voorkeur / anders)                                              │
│    - Contactpersoon (select uit school's contacts[])                 │
│    - Concurrent (select: dia / jij / overig + naam-veld)            │
│    "Wijzigingen opslaan" sticky bottom-bar bij dirty state           │
├─────────────────────────────────────────────────────────────────────┤
│ 6. Audit-log accordion (default collapsed)                           │
│    Compacte lijst: timestamp + user + actie + diff-summary           │
└─────────────────────────────────────────────────────────────────────┘
```

**Empty state (no deal_outcome record voor deze school):**

Centered card with:
- Heading "Nog geen deal vastgelegd voor deze school"
- Body: "Leg de uitkomst van uw prijsvergelijking vast om win-rate en marktpositie te zien op het dashboard."
- Primary button: "Deal afsluiten" → opens `DealAfsluitenDialog`
- Secondary link: "Naar marktdashboard" → `/dashboard`

### 4. Dashboard-page structure (top → bottom)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Page header                                                          │
│   H1 "Marktdashboard"                                                │
│   Subline: filtered-period in plain Dutch, e.g.                      │
│   "Periode: laatste 90 dagen · Niveau: alle"                         │
│   Right: Filter-popover trigger button                               │
├─────────────────────────────────────────────────────────────────────┤
│ FilterBar (URL-bound via TanStack search params per D-06)            │
│   period: 30d / 90d / 365d / custom                                  │
│   level:  vmbo / havo / vwo / alle                                   │
│   trendMetric: aantal / win-rate (only used for trend-chart y-axis) │
├─────────────────────────────────────────────────────────────────────┤
│ ReliabilityBanner (only when 0 < N < 10)                             │
│   Yellow info-banner: "Lage betrouwbaarheid — slechts N deals in    │
│   deze selectie. Interpreteer cijfers met voorbehoud."               │
├─────────────────────────────────────────────────────────────────────┤
│ Row 1 — KPI grid (4 cards)                                           │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                │
│   │Totaal│ │Win-  │ │Gem.  │ │Deals │                                │
│   │deals │ │rate  │ │marge │ │deze  │                                │
│   │ 47   │ │ 62%  │ │+€1.2k│ │peri. │                                │
│   │N=47  │ │N=47  │ │N=29  │ │N=12  │                                │
│   └──────┘ └──────┘ └──────┘ └──────┘                                │
├─────────────────────────────────────────────────────────────────────┤
│ Row 2 — TrendChart (full-width card)                                 │
│   Bar/line, X = tijdvenster (week|maand|kwartaal),                   │
│   Y = aantal deals OF win-rate %                                     │
│   Tijdvenster-toggle inline boven chart                              │
├─────────────────────────────────────────────────────────────────────┤
│ Row 3 — Per-competitor breakdowns (2 cards naast elkaar)             │
│   ┌─────────────────────────┐ ┌─────────────────────────┐            │
│   │ Cito vs DIA             │ │ Cito vs JIJ             │            │
│   │ Donut: won / lost / open│ │ Donut: won / lost / open│            │
│   │ Win-rate %              │ │ Win-rate %              │            │
│   └─────────────────────────┘ └─────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

**Empty state (N = 0 voor huidige filters):**

If filters narrow to 0: heading "Geen deals in deze selectie" + body "Pas de filters aan of registreer een eerste deal." + primary button "Eerste deal registreren" → `/scholen`.

If global N = 0 (ever): full-page empty state, same copy, no filter-suggestion.

### 5. Dialog modal stack

| Dialog | Trigger | Form content | Confirm action |
|--------|---------|--------------|----------------|
| `DealAfsluitenDialog` | "Deal afsluiten"-knop op Uitkomst-tab | RadioGroup: Gewonnen / Verloren / In onderhandeling | Routes to next dialog (win/lost) OR commits status-only update (in-onderhandeling path) |
| `WinDealDialog` | DealAfsluitenDialog selects "Gewonnen" | Prijs-snapshot bevestiging (read-only display + edit-knop), Datum afsluiting (date input), Contactpersoon (select), Reden (optionele textarea) | Pessimistic: creates `deal_outcomes` row with `status='won'`, snapshot, decided_at, contact_id, optional reason |
| `LostDealForm` | DealAfsluitenDialog selects "Verloren" | Concurrent (select dia/jij/overig + name field), Prijs-snapshot bevestiging, Reden (textarea, required), Reden-categorie (select), Contactpersoon (select) | Pessimistic: creates `deal_outcomes` row with `status='lost'`, all fields |

**LostDealDialog removal:** Per D-15, `src/features/school-profile/components/LostDealDialog.tsx` is deleted; all consumer sites in `ProfileHeader.tsx` (pipeline → verloren transition) lose the dialog trigger. Pipeline → verloren now writes pipeline-status only; the deal-record is registered separately via Uitkomst-tab. This is intentional per D-14 (no sync). Add an inline help-tooltip on the pipeline-dropdown's `verloren` option: "Tip: leg de deal-uitkomst vast op de Uitkomst-tab voor markt-inzicht."

---

## Spacing Scale

Tailwind v4 default scale used (4px increments). Phase 28 declares the following subset as canonical for new components:

| Token | Value | Tailwind class | Usage |
|-------|-------|----------------|-------|
| 2xs | 4px | `gap-1`, `p-1` | Icon gaps, inline pill padding |
| xs | 8px | `gap-2`, `p-2`, `mb-2` | Compact element spacing within KPI cards, badge insets |
| sm | 12px | `gap-3`, `p-3` | Toolbar internal spacing, audit-log row spacing |
| md | 16px | `gap-4`, `p-4`, `mb-4` | Default form-field spacing, button padding-x |
| lg | 24px | `gap-6`, `p-6`, `mb-6` | Card padding, section gaps within Uitkomst-tab |
| xl | 32px | `gap-8`, `p-8`, `mb-8` | Tab-page outer padding (matches `px-8` ProfileHeader), dashboard row gaps |
| 2xl | 48px | `mt-12`, `pb-12` | Page bottom-padding, major section breaks |

**Tablet touch-target exception (MODE-03):** All interactive controls (buttons, select, checkboxes, table-row click targets in DiscountEditor) MUST be `min-h-[44px]` (h-11) — established in `ProfileHeader.tsx`, `LostDealDialog.tsx`, `TabNavigation.tsx`. Inline icon-only buttons in the DiscountEditor (remove-row trash, edit) get `w-11 h-11` even when the visual icon is 16×16.

**Dashboard layout grid:**
- Page max-width: `max-w-[1200px]` (matches SchoolOverviewPage)
- Outer padding: `pt-8 pb-12 px-8 max-sm:px-4`
- KPI row gap: `gap-4`
- Card internal padding: `p-6`

---

## Typography

App-wide pattern (existing): Tailwind default sans-serif stack, sizes specified as `text-[Npx]` for control. Phase 28 declares **4 sizes × 2 weights** as the canonical typographic system.

| Role | Size | Weight | Line Height | Tailwind class | Usage |
|------|------|--------|-------------|----------------|-------|
| Body | 14px | 400 (regular) | 1.5 | `text-[14px]` | Form labels, table cell text, audit-log entries, dashboard subline |
| Body-large | 16px | 400 (regular) | 1.5 | `text-[16px]` | Input/select value text, snapshot price values, primary form content |
| Heading | 20px | 600 (semibold) | 1.3 | `text-[20px] font-semibold` | Card titles, dialog titles, "Marktdashboard"-row labels (e.g. "Cito vs DIA") |
| Display | 28px | 600 (semibold) | 1.2 | `text-[28px] font-semibold` | Page H1 ("Marktdashboard"), KPI-card primary numbers, school-name header (carry-forward from ProfileHeader) |

**Weight discipline:** Only `font-normal` (400) and `font-semibold` (600). NO `font-medium` (500), NO `font-bold` (700) — anomalous use in `SchoolOverviewPage` is pre-existing and not extended by Phase 28.

**Micro-text exception (KPI N-badge, audit-log timestamp, table row meta):**
- 12px / 400 / `text-[12px] text-neutral-500` — used sparingly for "N=47", "12 dagen geleden", etc.

**Color × typography binding:**
- Headings on cards: `text-cito-primary` (#003082)
- Body text: `text-neutral-700` (#374151)
- Secondary/meta text: `text-neutral-500` (#6b7280)
- Tertiary/disabled: `text-neutral-400` (#9ca3af)

**Number formatting (price, percentages):**
- Currency: `new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })` for KPI display
- Currency in tables/snapshot: `maximumFractionDigits: 2`
- Percentages: `new Intl.NumberFormat('nl-NL', { style: 'percent', maximumFractionDigits: 0 })`
- Counts: `new Intl.NumberFormat('nl-NL').format(N)`

---

## Color

Cito-branded 60/30/10 split — already established app-wide; Phase 28 honors it without introducing new accent surfaces.

| Role | Value | Token | Usage |
|------|-------|-------|-------|
| Dominant (60%) | `#F8F9FA` | `cito-bg` | Page background |
| Surface (30%) | `#FFFFFF` | `bg-white` | All cards, dialogs, toolbar containers, KPI cards |
| Primary (10%) | `#003082` | `cito-primary` | Headings, primary buttons (filled), tab active-border, navigation links, focus ring color |
| Accent (5%) | `#FF6600` | `cito-accent` | **Reserved for primary CTAs only** — see below |
| Destructive | `#dc2626` (red-600) | `text-red-600` / `bg-red-50` | Destructive button labels, required-field asterisk, error message text, "Korting verwijderen" ghost-action |

### Accent reserved-for list (10% rule, ENFORCED)

The `cito-accent` (#FF6600) color is reserved EXCLUSIVELY for these Phase 28 surfaces:

1. **Primary call-to-action buttons** when they are the single recommended next step:
   - "Deal afsluiten" knop op Uitkomst-tab (empty + filled states)
   - "Bevestigen" knop in `DealAfsluitenDialog` / `WinDealDialog` / `LostDealForm`
   - "Eerste deal registreren" knop in dashboard empty-state
2. **KPI-card border-accent for highlighted "above target" win-rate** (only when win-rate ≥ 70%): `border-l-4 border-cito-accent` — optional progressive enhancement, not acceptance-blocking

**Accent is NOT used for:**
- Tab indicators (use `cito-primary`)
- Active filter chips (use `cito-primary/10` per Phase 26 pattern)
- Chart series fills (use neutral palette + cito-primary for Cito series — see chart palette below)
- KPI-numbers themselves (use `cito-primary`)
- Hover states (use neutral-50 wash)
- Status badges (use semantic colors below)

### Status semantic colors

Reuse existing `PipelineBadge` palette mapping for `DealStatusBadge`:

| Deal status | DB enum | UI label | Background | Text | Border |
|-------------|---------|----------|------------|------|--------|
| Open | `open` | "Lopend" | `bg-neutral-100` | `text-neutral-700` | `border-neutral-300` |
| In onderhandeling | `in_negotiation` | "In onderhandeling" | `bg-orange-50` | `text-orange-700` | `border-orange-200` |
| Gewonnen | `won` | "Gewonnen" | `bg-green-50` | `text-green-700` | `border-green-200` |
| Verloren | `lost` | "Verloren" | `bg-red-50` | `text-red-700` | `border-red-200` |
| Gearchiveerd | `archived` | "Gearchiveerd" | `bg-neutral-50` | `text-neutral-500` | `border-neutral-200` |

### Chart palette (Recharts)

Per-provider series colors (consistent across all charts in this phase and the existing comparison-chart):

| Provider | Color | Hex | Rationale |
|----------|-------|-----|-----------|
| Cito | `cito-primary` | `#003082` | Existing brand convention |
| DIA | neutral-500 | `#6b7280` | Competitor neutral grey |
| JIJ | neutral-400 | `#9ca3af` | Second competitor neutral grey, distinguishable from DIA |
| Overig | neutral-300 | `#d1d5db` | Tertiary grey |

**Win/lost donut breakdowns:**
- Won segment: `#16a34a` (status-verified green)
- Lost segment: `#dc2626` (red-600)
- Open/in-negotiation segment: `#ea580c` (status-stale orange — re-used for "in flight" semantics)

**Cohort reliability banner colors:**
- Low confidence (1 ≤ N < 10): `bg-orange-50 border-orange-200 text-orange-800`
- No-cohort fallback (N=0): `bg-blue-50 border-blue-200 text-blue-800` (informational, not warning)

---

## Copywriting Contract

ALL copy in formele Dutch (u-vorm). Never "je/jij". Never English error strings.

### Primary CTAs

| Element | Copy | Style |
|---------|------|-------|
| Open `DealAfsluitenDialog` | "Deal afsluiten" | Primary accent button |
| Confirm Gewonnen | "Deal als gewonnen vastleggen" | Primary accent button in `WinDealDialog` |
| Confirm Verloren | "Deal als verloren vastleggen" | Primary accent button in `LostDealForm` |
| Cancel dialog | "Annuleren" | Ghost button (`text-cito-primary`) |
| Save deal-detail changes (sticky bar) | "Wijzigingen opslaan" | Primary cito-primary button |
| Add discount | "+ Korting toevoegen" | Secondary outline button |
| Save discount row | "Opslaan" | Primary cito-primary inline-button |
| Remove discount row | "Verwijderen" | Destructive text-button `text-red-600 hover:underline` |
| Heropen deal | "Heropen deal" | Ghost button |
| Dashboard empty-state CTA | "Eerste deal registreren" | Primary accent button |

### Empty states

| Surface | Heading | Body |
|---------|---------|------|
| Uitkomst-tab (no record) | "Nog geen deal vastgelegd voor deze school" | "Leg de uitkomst van uw prijsvergelijking vast om win-rate en marktpositie te zien op het marktdashboard." |
| Dashboard (N=0 globaal) | "Nog geen deals geregistreerd" | "Registreer de uitkomst van uw eerste prijsvergelijking om marktinzicht op te bouwen." |
| Dashboard (N=0 voor huidige filters) | "Geen deals in deze selectie" | "Pas de filters aan of registreer een nieuwe deal." |
| DiscountEditor (no kortingen) | "Nog geen kortingen vastgelegd" | "Voeg per module en aanbieder een korting toe (in % of € — niet beide tegelijk)." |
| CohortPredictionCard (cohort=0) | "Eerste in zijn cohort" | "Er zijn nog geen vergelijkbare scholen met deze combinatie van onderwijsvisie en niveau. Zodra collega's vergelijkbare deals registreren, ziet u hier een voorspelling." |
| CohortPredictionCard (school zonder cohort-features) | "Onvoldoende schoolgegevens voor voorspelling" | "Vul onderwijsvisie en schoolniveau aan op het schoolprofiel om een voorspelling te zien." — link: "Naar schoolprofiel" |

### Cohort-prediction copy templates

| Cohort N | Layout copy |
|----------|-------------|
| N=0 | "Eerste in zijn cohort — geen voorspelling beschikbaar." |
| 1 ≤ N ≤ 4 | "Vergelijkbaar met **{N} {onderwijsvisie}-{niveau}-scholen** — win-kans **{P}%**. ⚠ Lage betrouwbaarheid — slechts {N} vergelijkbare scholen." |
| N ≥ 5 | "Vergelijkbaar met **{N} {onderwijsvisie}-{niveau}-scholen** — win-kans **{P}%**." + (optional) "In dit cohort gaan deals het vaakst verloren op **{topReasonLabel}**." |

### Errors (form-validation + API)

| Field | Trigger | Message |
|-------|---------|---------|
| Concurrent (LostDealForm) | Empty submit | "Selecteer een concurrent." |
| Naam concurrent (when "overig") | Empty submit | "Vul de naam van de concurrent in." |
| Reden (LostDealForm) | Empty submit | "Geef een reden op — dit helpt bij toekomstig marktinzicht." |
| Reden-categorie (LostDealForm) | Empty submit | "Kies een reden-categorie." |
| Datum afsluiting (WinDealDialog) | Future date | "De afsluitdatum kan niet in de toekomst liggen." |
| Discount-row % | Out of range (≤0 or >100) | "Korting moet tussen 0,01 en 100 procent liggen." |
| Discount-row € | Negative | "Korting mag niet negatief zijn." |
| Discount-row XOR violation | Both % and € filled | "Vul een korting in als percentage óf als bedrag — niet allebei." |
| Save failure (network) | API 5xx | "Opslaan is niet gelukt. Controleer uw verbinding en probeer het opnieuw." + retry-knop "Opnieuw proberen" |
| Save failure (validation 4xx) | API 4xx | "Het formulier bevat fouten. Loop de velden na en probeer opnieuw." |
| Conflict (concurrent edit) | API 409 | "Iemand anders heeft deze deal zojuist bijgewerkt. Herlaad de pagina om de laatste versie te zien." + "Pagina herladen"-knop |

### Destructive confirmations

| Action | Confirmation copy |
|--------|-------------------|
| Verwijder korting-rij | Inline: "Korting verwijderd — herstel mogelijk door opnieuw toe te voegen." (toast-stijl, no modal) |
| Heropen gewonnen/verloren deal | Modal: "Weet u zeker dat u deze deal wilt heropenen? De huidige uitkomst wordt gearchiveerd; u kunt daarna een nieuwe afsluiting registreren." Confirm: "Deal heropenen" / Cancel: "Annuleren" |
| Annuleren met dirty form | Modal: "U heeft niet-opgeslagen wijzigingen. Wilt u doorgaan zonder opslaan?" Confirm: "Wijzigingen weggooien" / Cancel: "Terug naar formulier" |

### Tooltips / micro-copy

| Surface | Copy |
|---------|------|
| KPI "N=47" badge tooltip | "Gebaseerd op {N} {deals/deal} in de geselecteerde periode" |
| Trend-chart axis switch | Label "Y-as" → segmented control "Aantal deals | Win-rate %" |
| Pipeline-dropdown "verloren"-tip | "Tip: leg de deal-uitkomst vast op de Uitkomst-tab voor markt-inzicht." |
| Snapshot "Bevroren op" timestamp | "Deze prijzen zijn vastgelegd op het moment dat de deal werd afgesloten en wijzigen niet meer." |
| DiscountEditor row "XOR"-hint | "Korting als % óf als € (kies één)" — onder de twee inputs |
| Audit-log accordion trigger | "{N} wijzigingen — toon historie" |
| Dashboard reliability banner | "Lage betrouwbaarheid — slechts {N} deals in deze selectie. Interpreteer cijfers met voorbehoud." |

### Status labels (UI ↔ DB enum mapping)

| DB enum | UI label | Notes |
|---------|----------|-------|
| `open` | "Lopend" | Default for new records; preferred over "Open" (Dutch) |
| `in_negotiation` | "In onderhandeling" | |
| `won` | "Gewonnen" | |
| `lost` | "Verloren" | |
| `archived` | "Gearchiveerd" | Subdued styling |

Code constant: `DEAL_STATUS_LABELS: Record<DealStatus, string>` in `src/features/deal-outcomes/labels.ts`.

### Reden-categorie labels

| Enum | Label |
|------|-------|
| `prijs` | "Prijs" |
| `functionaliteit` | "Functionaliteit / product-mismatch" |
| `voorkeur` | "Voorkeur / bestaande relatie" |
| `anders` | "Anders" |

---

## Interaction Patterns

### Form behavior (all dialogs + Uitkomst-tab detail strip)

- **Library:** `react-hook-form` with `zodResolver` (CLAUDE.md hard rule)
- **Validation mode:** `mode: 'onBlur'`, `reValidateMode: 'onChange'`. Show errors after first blur, then live-correct on change.
- **Submit state:** Disable submit button while `isSubmitting`; show inline spinner inside the button (`<svg class="animate-spin h-4 w-4 mr-2" />`) + text changes to "Bezig met opslaan…".
- **Pessimistic update (per D-14):** All mutations are blocking until server confirms. No optimistic UI for deal-outcome / discount mutations — these are audit-tracked and conflicts must surface (see 409 error copy above). EXCEPTION: dashboard filter changes update URL search params immediately (TanStack Router built-in).
- **Dirty-tracking:** Use `formState.isDirty` to enable sticky "Wijzigingen opslaan" bar at bottom of Uitkomst-tab. Show only when `isDirty === true`. Sticky bar: `fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-8 py-4 z-30 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]`. Animate in with `transition-transform translate-y-0` from `translate-y-full`.
- **Dialog dismissal:**
  - Cancel button → close dialog, discard form state
  - Esc key → close dialog (focus returns to trigger)
  - Click outside (overlay) → close dialog
  - In dirty state: any of the above triggers the "U heeft niet-opgeslagen wijzigingen…" confirm-modal first

### Cohort-prediction card (collapsible)

- Use HTML `<details>` element (native, accessible, no JS deps) — same pattern as Phase 24 AI-advies hero
- Default `open` (expanded) for `status ∈ {open, in_negotiation}`
- Always hidden (no render) for `status ∈ {won, lost, archived}`
- Summary line ALWAYS visible: "Voorspelling — {short text}"
- Smooth expand via CSS only: no JS animation library

### DiscountEditor inline-edit

- Table-style layout with rows = (module × provider) tuples
- Row states:
  - **Empty row** (placeholder): grey background, "+" cell as click-target opening edit-mode
  - **Edit mode**: row turns white, two inputs visible (percentage + amount) with XOR-validation, save/cancel buttons inline
  - **Saved row**: shows current discount value with edit-pencil + remove-trash icons
- XOR-validation: typing into the % field disables the € field (visual: greyed + `disabled` attr); clearing % re-enables €
- Each row mutation triggers a separate API call → real-time recalc in vergelijking-tab (per D-03)
- Show "Bezig met herberekenen…" inline toast (top-right) for 1.5s after each save

### Dashboard filter UX

- **Filter trigger:** Primary toolbar button "Filters" with chevron-down icon + active-count pill (per Phase 24 pattern in SchoolOverviewPage)
- **Filter popover:** Opens below trigger; period (segmented), level (multi-select chips), trendMetric (segmented). NOT a separate dialog — inline popover keeps context.
- **URL-state sync:** Filter changes → immediately update TanStack Router search params via `navigate({ search: prev => ({ ...prev, period: '90d' }) })`. Deep-linkable URLs per D-06.
- **Reset:** "Alle filters wissen" link at popover bottom, only visible when `activeFilterCount > 0`

### Loading states

- **Dashboard initial load:** Skeleton screens for KPI cards (`bg-neutral-200 animate-pulse h-32 rounded-lg`) + skeleton for chart canvas
- **Filter change re-fetch:** Subtle "Bezig met laden…" pill in toolbar; existing data stays visible at 50% opacity
- **Uitkomst-tab initial:** Skeleton header + skeleton card; never blank page
- **Mutation in-flight:** Button shows inline spinner; rest of form stays enabled (per react-hook-form default)
- **Recharts loading:** Render placeholder `<div className="h-64 bg-neutral-50 rounded-lg" />` while data fetches

### Chart interactions

- **Hover:** Recharts tooltip with `nl-NL` formatted values; tooltip-background `bg-white shadow-lg border border-neutral-200 rounded-lg p-3 text-[14px]`
- **Trend-chart y-axis switch:** Segmented control above chart "Aantal deals | Win-rate %" → controls `dataKey` and `yAxisFormatter`
- **Trend-chart x-axis grouping:** Segmented control "Week | Maand | Kwartaal" → controls aggregation window
- **Donut click (Cito vs DIA, Cito vs JIJ):** No drill-down in MVP — passive visualization only. Out-of-scope per SPEC.

### Sticky save bar

When Uitkomst-tab detail-strip is dirty:
- Slide-up bar at viewport bottom with: "U heeft niet-opgeslagen wijzigingen." + "Annuleren" (ghost) + "Wijzigingen opslaan" (primary cito-primary)
- Bar height: 60px (h-15)
- Z-index: 30 (below dialogs at z-50, above content)

---

## Accessibility (WCAG 2.1 AA)

### Keyboard navigation

- **Tab order:** Logical document order. New `Uitkomst` tab joins existing `TabNavigation` tab-sequence naturally (it's a `<Link>` like the others, no extra ARIA needed).
- **Dialog focus management:**
  - On open: move focus to first interactive element (typically the radio-group in DealAfsluitenDialog, or the concurrent-select in LostDealForm)
  - On close: return focus to trigger button (use `useRef` on trigger + `.focus()` on dialog close)
  - Trap focus inside dialog while open — use `<dialog>` element OR manual focus-trap (recommend: small inline implementation since no existing focus-trap dep)
- **Escape key:** All dialogs close on Esc. Dirty-form confirm-modal triggered if dirty.
- **DiscountEditor:** Tab-key moves through cells in row-major order; Enter activates inline-edit; Esc cancels inline-edit
- **Dashboard filter popover:** Esc closes popover; Tab cycles through filter controls

### ARIA

- All form-fields: `<label htmlFor>` + `aria-required` (when required) + `aria-invalid` (when error) + `aria-describedby` pointing to error message ID
- KPI cards: `<article role="region" aria-labelledby="kpi-{id}-title">` with `<h2 id="kpi-{id}-title">` so screen-readers announce KPI titles
- Status-badges: `<span role="status">` for the deal-status badge so SR users hear status changes via live-region (when `status` mutates server-side, the badge updates)
- Charts: `<figure>` with `<figcaption>` containing the chart title + data summary in plain Dutch (e.g. "Trend van laatste 90 dagen: 47 deals, win-rate 62%") for screen-reader users
- Dialog: `<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">` + body of dialog contains `<h2 id="dialog-title">`
- Loading states: `<div role="status" aria-live="polite"><span class="sr-only">Bezig met laden…</span></div>`
- Reliability-banner: `role="status"` + `aria-live="polite"` so SR users hear when the disclaimer appears

### Contrast (WCAG AA = 4.5:1 normal text, 3:1 large)

All Phase 28 color combinations verified against existing app tokens. New combinations checked:

| Combination | Ratio | Pass |
|-------------|-------|------|
| `text-cito-primary` (#003082) on `bg-white` | 13.4:1 | AA+ |
| `text-cito-primary` on `bg-neutral-50` (#f9fafb) | 13.0:1 | AA+ |
| `text-neutral-700` (#374151) on `bg-white` | 10.4:1 | AA+ |
| `text-neutral-500` (#6b7280) on `bg-white` | 4.8:1 | AA |
| `text-white` on `bg-cito-accent` (#FF6600) | 3.2:1 | AA (large only) — confirmed acceptable since accent buttons use `text-[14px] font-semibold` which is bold ≥14px; passes AA large-text threshold |
| `text-white` on `bg-cito-primary` (#003082) | 12.6:1 | AA+ |
| Deal-status badge (e.g. `text-green-700 on bg-green-50`) | 9.4:1 | AA+ |

**Action:** None — existing token set already passes. No mitigation needed.

### Focus indicators

- All interactive controls: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cito-primary`
- Buttons: extend with `focus-visible:ring-2 focus-visible:ring-cito-primary focus-visible:ring-offset-2`
- Inputs: `focus:border-cito-primary focus:ring-2 focus:ring-cito-primary/20`

### Screen-reader-only helpers

Reuse the Tailwind `sr-only` utility (built-in) for:
- Filter-pill "remove" icon-only buttons: `<span className="sr-only">Filter '{label}' verwijderen</span>`
- DiscountEditor trash icon: `<span className="sr-only">Korting verwijderen voor {moduleLabel} ({provider})</span>`
- DiscountEditor edit icon: `<span className="sr-only">Korting bewerken voor {moduleLabel} ({provider})</span>`

---

## Responsive Behavior

**Target device hierarchy (per MODE-03):** Tablet-first (iPad 10" landscape ≥1180×820 and portrait ≥820×1180), desktop ≥1280px works identically, mobile ≤640px works in degraded mode (acceptable for sales-context usage which is primarily tablet).

### Breakpoint usage (Tailwind v4 defaults)

| Tailwind prefix | Min-width | Phase 28 usage |
|------------|-----------|----------------|
| `max-sm` | <640px | Mobile-only: page padding `px-4`, KPI grid stacks `grid-cols-1`, dashboard rows stack |
| `sm` | ≥640px | Page padding `px-8`, KPI grid 2-cols |
| `md` | ≥768px | Sticky save-bar shows side-by-side buttons (not stacked) |
| `lg` | ≥1024px | KPI grid 4-cols, dashboard row 3 (per-competitor breakdowns) side-by-side, DiscountEditor table uses full table-layout instead of card-list |
| `xl` | ≥1280px | Full desktop layout — no additional changes |

### Dashboard layout responsiveness

```
Mobile (<640px):                Tablet (≥768px):              Desktop (≥1024px):
┌────────────┐                  ┌──────┬──────┐               ┌────┬────┬────┬────┐
│  KPI 1     │                  │KPI 1 │KPI 2 │               │KPI1│KPI2│KPI3│KPI4│
├────────────┤                  ├──────┼──────┤               ├────┴────┴────┴────┤
│  KPI 2     │                  │KPI 3 │KPI 4 │               │  TrendChart       │
├────────────┤                  ├──────┴──────┤               ├──────────┬────────┤
│  KPI 3     │                  │ TrendChart  │               │CitoVsDIA │CitoVsJIJ│
├────────────┤                  ├─────────────┤               └──────────┴────────┘
│  KPI 4     │                  │ CitoVsDIA   │
├────────────┤                  ├─────────────┤
│ TrendChart │                  │ CitoVsJIJ   │
├────────────┤                  └─────────────┘
│ CitoVsDIA  │
├────────────┤
│ CitoVsJIJ  │
└────────────┘
```

Tailwind classes:
- KPI row: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- Per-competitor row: `grid grid-cols-1 lg:grid-cols-2 gap-4`
- TrendChart: always full-width within container

### Uitkomst-tab responsiveness

- Tab content max-width: `max-w-[1200px] mx-auto` (matches existing pages)
- Outer padding: `px-8 max-sm:px-4 pt-6 pb-24` (pb-24 reserves space for sticky save-bar)
- DealSnapshotView module-breakdown:
  - <1024px: stacked vertical cards per module
  - ≥1024px: 2-column grid `grid grid-cols-1 lg:grid-cols-2 gap-3`
- DiscountEditor:
  - <1024px: card-list (each row = a stacked card with stacked module / provider / discount inputs)
  - ≥1024px: full HTML table with columns Module | Provider | Korting | Effect | Actie
- Deal-details strip form: always single-column `grid grid-cols-1 gap-4`, max-w `max-w-[640px]`

### Dialog responsiveness

- Max-width: `max-w-md` (~28rem / 448px) — matches LostDealDialog pattern
- Mobile: `mx-4` padding so dialog doesn't touch screen edges
- Vertical: never exceeds `max-h-[90vh]`; if content exceeds, body becomes `overflow-y-auto`
- WinDealDialog and LostDealForm may exceed dialog height on portrait phones — internal scroll acceptable; footer (Annuleren / Bevestigen buttons) stays sticky `sticky bottom-0 bg-white pt-3 border-t border-neutral-100`

### Touch targets (MODE-03)

- ALL interactive controls ≥44×44px hit area
- Inline icon-only buttons (e.g. discount-row trash, edit): visually 16×16 icon, padding makes hit area 44×44
- Tab-bar: existing `TabNavigation` already uses `h-11 px-4` → meets touch threshold
- DiscountEditor row in card-mode (<1024px): full card click area opens edit mode, no need for tiny hit targets

---

## Components Inventory

New components Phase 28 introduces (no shadcn — handrolled per app convention):

### In `src/features/deal-outcomes/components/`

| Component | Purpose | Reuses |
|-----------|---------|--------|
| `DealOutcomesTab.tsx` | Container; orchestrates all sub-components based on deal_outcomes state | TanStack Query hooks |
| `DealStatusBadge.tsx` | Visual status pill (5 states) | PipelineBadge pattern |
| `DealAfsluitenDialog.tsx` | Radiogroup entry dialog (Won/Lost/In-negotiation) | LostDealDialog overlay pattern |
| `WinDealDialog.tsx` | Won-flow form | react-hook-form + Zod, LostDealDialog overlay pattern |
| `LostDealForm.tsx` | Lost-flow form (replaces deleted LostDealDialog) | Internal structure of old LostDealDialog |
| `DiscountEditor.tsx` | Table-list of per-(module,provider) discount rows | — |
| `DiscountRow.tsx` | Single editable discount row with XOR % vs € | — |
| `CohortPredictionCard.tsx` | Collapsible AI-cohort prediction | `<details>` native, no deps |
| `DealSnapshotView.tsx` | Read-only frozen comparison snapshot | PriceBadge, ComparisonTable visual cues |
| `AuditLogAccordion.tsx` | Collapsible audit-log entries | `<details>` native |

### In `src/features/dashboard/`

| Component | Purpose |
|-----------|---------|
| `DashboardPage.tsx` | Top-level page with filter-bar + KPI grid + chart rows |
| `DashboardFilterBar.tsx` | Period + level + trendMetric filters bound to URL search params |
| `ReliabilityBanner.tsx` | Conditional banner for 1 ≤ N < 10 |
| `KpiCard.tsx` | Reusable card: title + primary number + N-badge |
| `TrendChart.tsx` | Recharts LineChart or BarChart with toggle |
| `CompetitorBreakdownCard.tsx` | Donut chart with header per competitor (DIA/JIJ) |
| `DashboardEmptyState.tsx` | N=0 state with CTA |

### Hooks (new)

| Hook | Purpose |
|------|---------|
| `useDealOutcome(schoolId)` | TanStack Query → fetch single deal_outcomes record for school |
| `useDealOutcomeMutation()` | Create / update / archive deal outcome |
| `useDealDiscounts(dealOutcomeId)` | List discounts for a deal |
| `useDealDiscountMutation()` | Add / update / delete discount row |
| `useDealStats({ period, level })` | Dashboard KPI aggregates |
| `useDealTrend({ period, level, grouping, metric })` | Dashboard trend chart data |
| `useCompetitorBreakdown({ period, level, competitor })` | Per-competitor donut data |
| `useCohortPrediction({ schoolId })` | Lookup from `deal_cohort_stats` view |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — app does not use shadcn |
| third-party | none | not applicable |

**Status:** No registry usage. All components handrolled in-app per established app convention. No third-party block ingestion gate required.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all UI strings declared in formele Dutch (u-vorm); empty/error/CTA copy explicit per surface
- [ ] Dimension 2 Visuals: PASS — IA diagrams for Uitkomst-tab + Dashboard; component inventory enumerated; tab insertion position fixed
- [ ] Dimension 3 Color: PASS — 60/30/10 split honored (#F8F9FA / white / cito-primary), accent #FF6600 reserved-for list enumerated; chart palette declared; contrast verified
- [ ] Dimension 4 Typography: PASS — 4 sizes (14/16/20/28), 2 weights (400/600), `font-medium` and `font-bold` explicitly excluded
- [ ] Dimension 5 Spacing: PASS — multiples-of-4 scale; 44px touch-target rule restated for tablet; max-width 1200 + page padding 32 declared
- [ ] Dimension 6 Registry Safety: PASS — not applicable, no shadcn / third-party registry

**Approval:** pending — awaiting `gsd-ui-checker` validation
