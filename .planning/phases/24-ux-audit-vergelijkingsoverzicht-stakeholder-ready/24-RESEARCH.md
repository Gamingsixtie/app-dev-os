# Phase 24: UX-audit vergelijkingsoverzicht — stakeholder-ready prototype - Research

**Researched:** 2026-03-28
**Domain:** React component restructuring, UX information architecture, progressive disclosure
**Confidence:** HIGH

## Summary

This phase is a pure UI restructuring of `PriceComparisonPage.tsx` and its child components. No new features, no engine changes, no state management changes. The work consists of: (1) reordering sections per the decided hierarchy, (2) eliminating duplicated differentiators data, (3) adding progressive disclosure (collapse/expand) to AI advies, chart, and meerwaarde sections, (4) merging ProviderSelector + PricingModelCards into a compact toolbar, (5) applying alternating color band styling for visual section separation, and (6) integrating SchoolplanBanner into the AI advies hero.

The codebase already uses Tailwind CSS 4 with custom Cito design tokens, Zustand stores with reactive recalculation, and `<details>/<summary>` for collapsible content. All existing patterns directly support the planned changes. The store's reactive data flow (`initialize()` -> engine -> UI) is untouched by this restructuring -- only component render order and visibility change.

**Primary recommendation:** Restructure PriceComparisonPage.tsx section order, extract a ProviderToolbar component, add collapse wrappers using native `<details>/<summary>` (already used in codebase), and apply alternating `bg-neutral-50`/`bg-white` bands for section separation. No new dependencies needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** AI Advies hero bovenaan de pagina -- schoolplan-context geintegreerd in dezelfde sectie (SchoolplanBanner wordt onderdeel van AI-advies, geen aparte banner meer)
- **D-02:** Bundel/Periode bediening direct na AI hero (CitoBundleSelector + DiaBundleSelector + PeriodToggle)
- **D-03:** Totaal-kaarten (Cito vs DIA vs JIJ met verschilbedragen) als tweede prominente sectie
- **D-04:** Tabel voor grafiek -- consultant wil snel per-module detail zien, grafiek is visuele samenvatting eronder
- **D-05:** Volledige volgorde: AI hero -> bediening -> totalen -> provider toolbar -> tabel -> grafiek -> meerwaarde -> disclaimer
- **D-06:** Differentiators-lijst weg uit ComparisonSummary -- AI-advies verwerkt differentiators in het adviesverhaal (geen aparte "Unieke Cito voordelen" lijst meer)
- **D-07:** MeerwaardePanel behoudt: tijdwinst + migratie CTA. Differentiators-data verhuist naar AI-advies context
- **D-08:** ProviderSelector (checkboxes) + PricingModelCards samengebracht in een compacte toolbar boven de tabel. Pricing model uitleg via tooltip/popover in plaats van inklapbare kaarten
- **D-09:** AI advies hero standaard samengevat (2-3 regels conclusie) met "Lees volledig advies" expand-knop -- stakeholder ziet kern, consultant kan uitklappen
- **D-10:** Grafiek standaard ingeklapt -- on-demand voor wie het wil zien
- **D-11:** MeerwaardePanel standaard ingeklapt -- on-demand
- **D-12:** Tabel module-rijen: huidige expandable detail-panels (prijsopbouw) zijn voldoende -- geen extra disclosure-lagen nodig
- **D-13:** Een view voor alle stakeholders -- geen aparte filters/modi
- **D-14:** Pagina moet self-explanatory zijn -- labels, tooltips en AI-advies geven voldoende context
- **D-15:** Visuele scheiding via kleurzones (afwisselende achtergrondkleur-banden lichtgrijs/wit) in plaats van kaart-per-sectie met borders
- **D-16:** Store is volledig reactief -- dit patroon moet behouden blijven na herstructurering
- **D-17:** Alle secties lezen uit dezelfde `usePriceComparisonStore.result` -- single source of truth

### Claude's Discretion
- Exacte kleurcodes voor de lichtgrijze banden (afstemmen op bestaande Tailwind neutral palette)
- Toolbar layout: horizontaal vs. compact grid op mobile
- Tooltip vs. popover keuze voor pricing model uitleg
- Exacte tekst van de AI-advies samenvatting (2-3 regels)
- Collapse/expand animatie-timing
- Responsive breakpoints voor de herstructurering

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI framework | Already in project |
| Tailwind CSS | 4 | Styling with Cito design tokens | Already in project, `@theme` block defines all custom colors |
| Zustand | latest | State management | Already in project, reactive store pattern |
| Recharts | 3 | Chart component | Already in project for ComparisonChart |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-router | latest | Routing/links | SchoolplanBanner uses Link component |
| vitest | 4.1.0 | Testing | Existing test infrastructure |
| @testing-library/react | latest | Component testing | Existing test patterns |

### No New Dependencies
This phase requires zero new npm packages. All UI patterns (collapse, tooltips, color bands) are achievable with native HTML + Tailwind CSS 4.

## Architecture Patterns

### Current Section Order (PriceComparisonPage.tsx)
```
1. SchoolplanBanner
2. Page title + subtitle
3. Bundel + Periode selectors
4. ComparisonSummary (totals + differentiators list)
5. ProviderSelector (checkboxes)
6. PricingModelCards (collapsible details)
7. ComparisonChart
8. AiAdviesSection
9. ComparisonTable
10. MeerwaardePanel (differentiators + time savings)
11. DisclaimerFooter
```

### Target Section Order (per D-05)
```
1. AI Advies Hero (AiAdviesSection + SchoolplanBanner merged, collapsed by default)
2. Bundel/Periode bediening (CitoBundleSelector + DiaBundleSelector + PeriodToggle)
3. Totaal-kaarten (ComparisonSummary WITHOUT differentiators list)
4. Provider Toolbar (ProviderSelector + PricingModelCards merged into one row)
5. ComparisonTable (with existing detail panels)
6. ComparisonChart (collapsed by default)
7. MeerwaardePanel (WITHOUT DifferentiatorsSection, collapsed by default)
8. DisclaimerFooter
```

### Pattern 1: Section Color Bands
**What:** Alternating `bg-neutral-50` / `bg-white` full-width background bands for visual section separation
**When to use:** Each major section gets a band; replace current card-with-border approach
**Example:**
```typescript
// Use existing Tailwind neutral-50 token (already in @theme: #f9fafb)
// Sections wrapped in full-bleed containers with alternating backgrounds
<section className="bg-neutral-50 py-8">
  <div className="max-w-[960px] mx-auto px-4 sm:px-8">
    {/* Section content */}
  </div>
</section>
<section className="bg-white py-8">
  <div className="max-w-[960px] mx-auto px-4 sm:px-8">
    {/* Section content */}
  </div>
</section>
```

**Implementation note:** The current page wrapper uses `max-w-[960px] mx-auto px-4 sm:px-8 py-12`. For full-bleed color bands, the outer wrapper must lose its max-width and padding -- each section manages its own inner container. This is a structural change to PriceComparisonPage.tsx.

### Pattern 2: Collapsible Sections (Progressive Disclosure)
**What:** Native `<details>/<summary>` or controlled state for collapse/expand
**When to use:** AI advies hero (D-09), chart (D-10), meerwaarde (D-11)
**Example:**
```typescript
// Option A: Native HTML (already used by PricingModelCards)
<details className="group">
  <summary className="cursor-pointer list-none flex items-center gap-2">
    <span>Staafgrafiek</span>
    <svg className="transition-transform group-open:rotate-90">...</svg>
  </summary>
  <div className="mt-4">
    <ComparisonChart result={result} onBarClick={handleBarClick} />
  </div>
</details>

// Option B: Controlled state (needed for AI advies with summary text)
const [expanded, setExpanded] = useState(false);
<div>
  <p>{summaryText}</p>
  {!expanded && <button onClick={() => setExpanded(true)}>Lees volledig advies</button>}
  {expanded && <FullAdviesContent />}
</div>
```

**Recommendation:** Use Option A (native `<details>`) for chart and meerwaarde (simple show/hide). Use Option B (controlled state) for AI advies hero because it needs a custom summary view (2-3 line conclusion) that differs from the full content.

### Pattern 3: Provider Toolbar (merged component)
**What:** ProviderSelector checkboxes + PricingModelCards merged into one compact row
**When to use:** D-08 -- toolbar above the comparison table
**Example:**
```typescript
function ProviderToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-sm font-medium text-neutral-600">Vergelijk:</span>
      {allProviders.map(p => (
        <label key={p} className="group relative flex items-center gap-1.5 text-sm">
          <input type="checkbox" ... />
          <span className={`w-2.5 h-2.5 rounded-full ${PROVIDER_COLORS[p]}`} />
          <span>{PROVIDER_LABELS[p]}</span>
          {/* Info icon triggers tooltip with pricing model description */}
          <button className="text-neutral-400 hover:text-neutral-600" title={pricingDescription}>
            <InfoIcon />
          </button>
        </label>
      ))}
    </div>
  );
}
```

**Tooltip vs Popover:** Use `title` attribute for simplest implementation; use a small absolute-positioned popover div for richer content. Both are achievable without new dependencies. Recommendation: use a small custom popover (click-to-show on mobile, hover on desktop) since the pricing model descriptions are 1-2 sentences and `title` is not touch-friendly.

### Pattern 4: SchoolplanBanner Integration into AI Hero
**What:** Move SchoolplanBanner content inside AiAdviesSection as the first element
**When to use:** D-01 -- no separate banner, schoolplan context is part of the AI advies hero
**Implementation:** Remove `<SchoolplanBanner />` from PriceComparisonPage, render its logic inside AiAdviesSection before the wizard steps. The SchoolplanBanner component can be imported directly into AiAdviesSection.

### Anti-Patterns to Avoid
- **Breaking store reactivity (D-16):** Do NOT change how components read from `usePriceComparisonStore`. Only reorder render output.
- **Creating new state management:** No new React Context, no new stores. Collapse state is local component state or native `<details>`.
- **Over-engineering collapse animation:** Native `<details>` with CSS transitions is sufficient. No framer-motion or spring physics needed.
- **Removing the page title:** The title "Prijsvergelijking" can stay but moves below the AI hero. It provides orientation for stakeholders reading the page.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible sections | Custom accordion component | Native `<details>/<summary>` | Already used in codebase (PricingModelCards), zero JS overhead, accessible by default |
| Tooltip/popover | Full tooltip library | CSS `title` + small absolute-positioned div | Only 4 providers need tooltips, no need for a library |
| Color band layout | CSS grid framework | Tailwind utility classes (`bg-neutral-50`, `bg-white`) | Just alternating backgrounds, no complexity |
| Section animations | framer-motion / react-spring | CSS `transition` + `group-open` | Collapse transitions are simple show/hide |

## Common Pitfalls

### Pitfall 1: Breaking Full-Bleed Color Bands
**What goes wrong:** Current page wrapper has `max-w-[960px]` -- color bands won't extend to screen edges
**Why it happens:** The `bg-neutral-50` band needs to be outside the max-width container
**How to avoid:** Restructure the page: outer div is full-width, each section has its own bg color, inner content uses `max-w-[960px] mx-auto px-4 sm:px-8`
**Warning signs:** Color bands stop at 960px instead of spanning the viewport

### Pitfall 2: AI Advies Summary Flicker
**What goes wrong:** The AI advies "summary" view shows a loading state when the full content is not yet generated
**Why it happens:** The wizard/analysis may not have been run yet -- there's no summary to show
**How to avoid:** Show the collapsed hero with a CTA to start the wizard when no analysis exists. Only show the 2-3 line summary when `hasCompletedWizard` is true and analysis output is available.
**Warning signs:** Empty collapsed section with just a "Lees volledig advies" button and no text

### Pitfall 3: Store Re-renders After Reorder
**What goes wrong:** Moving sections around causes unexpected re-render cascades
**Why it happens:** Changing the React tree structure can cause components to unmount/remount
**How to avoid:** Keep the same component instances, just reorder their JSX position. Do not wrap existing components in new providers or context.
**Warning signs:** Flash of empty content when navigating to the comparison page

### Pitfall 4: Differentiators Data Gap
**What goes wrong:** Removing differentiators from ComparisonSummary AND MeerwaardePanel but the AI advies doesn't actually use them
**Why it happens:** D-06 says "AI-advies verwerkt differentiators in het adviesverhaal" but the AI prompt may not include MODULE_DIFFERENTIATORS data
**How to avoid:** Verify the AI analysis prompt includes differentiators data. If not, pass `MODULE_DIFFERENTIATORS` to the AI context so the advice narrative can reference them. This is a data-flow addition, not a UI change.
**Warning signs:** AI advice doesn't mention Cito-specific advantages per module

### Pitfall 5: Mobile Toolbar Overflow
**What goes wrong:** 4 provider checkboxes + info buttons overflow on mobile screens
**Why it happens:** Horizontal toolbar doesn't fit on 320px-375px screens
**How to avoid:** Use `flex-wrap` and test on narrow viewports. On mobile, the toolbar can wrap to 2 rows.
**Warning signs:** Horizontal scrollbar on mobile, truncated provider names

## Code Examples

### Example 1: Full-bleed section wrapper utility
```typescript
// Reusable section band component
function SectionBand({
  bg = 'bg-white',
  children
}: {
  bg?: 'bg-white' | 'bg-neutral-50';
  children: React.ReactNode;
}) {
  return (
    <section className={`${bg} py-8`}>
      <div className="max-w-[960px] mx-auto px-4 sm:px-8">
        {children}
      </div>
    </section>
  );
}
```

### Example 2: Collapsible section with Tailwind
```typescript
// Collapsed by default with smooth transition
<details className="group">
  <summary className="cursor-pointer list-none flex items-center justify-between py-3">
    <h2 className="text-[15px] font-semibold text-cito-primary">
      Staafgrafiek vergelijking
    </h2>
    <svg
      className="w-4 h-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180"
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </summary>
  <div className="pb-2">
    <ComparisonChart result={result} onBarClick={handleBarClick} />
  </div>
</details>
```

### Example 3: Simplified ComparisonSummary (differentiators removed per D-06)
```typescript
function ComparisonSummary({ result }: { result: ComparisonResult }) {
  // Remove: citoAdvantages collection (lines 36-38 in current code)
  // Remove: entire "Cito voordelen" section (lines 118-147 in current code)
  // Keep: totalen per aanbieder grid (lines 47-115)
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-cito-primary mb-5">
        Totaalvergelijking
      </h2>
      {/* Grid with Cito / DIA / JIJ total cards -- unchanged */}
    </div>
  );
}
```

### Example 4: Info popover for pricing model
```typescript
function PricingInfoPopover({ provider }: { provider: ProviderKey }) {
  const [open, setOpen] = useState(false);
  const config = PROVIDER_CONFIGS[provider];
  const description = PRICING_STRATEGY_DESCRIPTIONS[config.pricingStrategy.type];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-neutral-400 hover:text-neutral-600 ml-1"
        aria-label={`Prijsmodel ${PROVIDER_LABELS[provider]}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-sm text-neutral-600">
            <div className="font-semibold text-neutral-900 mb-1">{PROVIDER_LABELS[provider]}</div>
            {description}
          </div>
        </>
      )}
    </div>
  );
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + @testing-library/react |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose src/features/price-comparison/` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-05 | Section order matches target hierarchy | unit | `npx vitest run src/features/price-comparison/__tests__/PriceComparisonPage.test.tsx -x` | Wave 0 |
| D-06 | ComparisonSummary has no differentiators list | unit | `npx vitest run src/features/price-comparison/__tests__/ComparisonSummary.test.tsx -x` | Wave 0 |
| D-08 | ProviderToolbar renders checkboxes + info | unit | `npx vitest run src/features/price-comparison/__tests__/ProviderToolbar.test.tsx -x` | Wave 0 |
| D-09 | AI advies hero collapsed by default | unit | `npx vitest run src/features/price-comparison/__tests__/AiAdviesSection.test.tsx -x` | Wave 0 |
| D-10 | Chart collapsed by default | unit | Part of PriceComparisonPage test | Wave 0 |
| D-11 | MeerwaardePanel collapsed by default | unit | Part of PriceComparisonPage test | Wave 0 |
| D-15 | Color band classes applied | unit | Part of PriceComparisonPage test | Wave 0 |
| D-16 | Store reactivity preserved | smoke | `npx vitest run src/features/price-comparison/__tests__/` | Existing tests |

### Sampling Rate
- **Per task commit:** `npx vitest run src/features/price-comparison/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/price-comparison/__tests__/PriceComparisonPage.test.tsx` -- verify section order, color bands, collapse defaults
- [ ] `src/features/price-comparison/__tests__/ProviderToolbar.test.tsx` -- merged component with popover

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Card-per-section with borders | Color band zones (alternating bg) | This phase | Less visual clutter, better scannability |
| Always-visible all sections | Progressive disclosure (collapse) | This phase | Stakeholders see summary first, details on demand |
| Separate differentiators list | AI-integrated differentiators | This phase | Eliminates duplication, richer narrative |

## Open Questions

1. **AI advice summary text generation**
   - What we know: D-09 requires a 2-3 line conclusion summary for the collapsed AI hero
   - What's unclear: Does the current AI analysis output include a standalone summary/conclusion? Or does it need to be extracted from the full advice text?
   - Recommendation: Check `AnalysisPanel` output structure. If no summary field exists, either add a summary extraction step or use the first 2-3 sentences of the advice as the collapsed preview.

2. **Differentiators data flow to AI context**
   - What we know: D-06/D-07 remove visible differentiators lists; AI advies should weave them into the narrative
   - What's unclear: Whether the AI prompt currently receives MODULE_DIFFERENTIATORS data
   - Recommendation: Verify during implementation. If not included, add differentiators to the AI context payload.

3. **Page title placement after reorder**
   - What we know: Current title "Prijsvergelijking" sits below SchoolplanBanner
   - What's unclear: Whether the title should remain as-is, move above AI hero, or be removed (AI hero acts as page header)
   - Recommendation: Keep title but make it smaller/subtler. AI hero is the visual anchor; title provides orientation context.

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (labels, tooltips, error messages)
- Code comments and variable names in English
- Never modify price data in `src/data/default-prices.ts` without approval
- Forms use react-hook-form + Zod (not applicable here -- no new forms)
- State via Zustand + persist middleware -- no new React Context or prop drilling
- Tests required for engine changes (engines are NOT changed in this phase)
- Path alias `@` = `/src` -- use in all imports
- After approved changes: auto-commit and push. Build must pass first.
- Run `npm run build` before done -- must succeed without errors

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `PriceComparisonPage.tsx` (359 lines), `AiAdviesSection.tsx` (103 lines), `MeerwaardePanel.tsx` (271 lines), `SchoolplanBanner.tsx` (137 lines)
- `src/styles/index.css` -- Tailwind CSS 4 `@theme` block with all design tokens
- Existing test patterns in `src/features/price-comparison/__tests__/`

### Secondary (MEDIUM confidence)
- Tailwind CSS 4 documentation for `@theme`, `group-open`, `<details>` styling

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new deps
- Architecture: HIGH -- restructuring existing components per locked decisions, patterns verified in codebase
- Pitfalls: HIGH -- identified from direct code analysis, all actionable

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no external dependencies or fast-moving libraries)
