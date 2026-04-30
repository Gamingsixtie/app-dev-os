# Phase 2: Prijsvergelijking - Research

**Researched:** 2026-03-20
**Domain:** Price comparison engine, data visualization (Recharts), Zustand state management
**Confidence:** HIGH

## Summary

Phase 2 builds the core price comparison view: a calculation engine that computes per-module and per-provider costs, a Recharts 3 grouped bar chart, an expandable comparison table with differentiators, and inline price editing with reactive recalculation. The existing codebase provides strong foundations -- PriceRecord model, PriceBadge, EditableAssumption, MODULE_CATALOG with differentiators, and the Zustand store pattern from school-profile.

The primary technical challenge is designing the calculation engine as pure functions (established project pattern) that transform SchoolProfile + PriceRecord[] into a structured ComparisonResult, and wiring this into a Zustand store that supports manual price overrides with explicit recalculation (via "Herbereken" button rather than auto-recalc). Recharts 3 is already installed (v3.8.0) and supports grouped bar charts natively.

**Primary recommendation:** Build the calculation engine first as pure TypeScript functions with full test coverage, then layer the Zustand store, then the UI components (chart and table) that consume the store.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Vergelijkingstabel: rijen = modules, kolommen = Cito / DIA / JIJ
- Beide prijzen standaard zichtbaar: prijs per leerling en totaalkosten (geen uitklapbaar -- Cialdini anchoring)
- Uitklapbare detailrij per module toont: berekeningsformule, onderscheidend vermogen, handmatig overschrijven
- PriceBadge zit in de tabelcel, niet in de detailrij
- Totaalrij: vetgedrukt + neutraal accent (geen groen/rood kleuring)
- Verschil-indicator neutraal: "X verschil" -- niet "X duurder"
- Doorverwijzing naar business case (Scenario B) onder de tabel
- Ontbrekende modules: expliciete 'Niet beschikbaar' badge in oranje
- Staafdiagram: gegroepeerd per module, 3 staven per groep, boven de tabel
- Cito in huisstijl-blauw (#003082), DIA en JIJ in neutrale grijstinten
- Recharts 3 als diagrambibliotheek
- Onderscheidend vermogen: transparant maar geframed -- Cito-voordelen bovenaan en prominenter
- Handmatige prijsinvoer: inline in uitklapbare detailrij, EditableAssumption-patroon
- Bij overschrijven: PriceBadge wisselt naar [Handmatig], reset-knop verschijnt
- "Herbereken" knop -- pas na bevestiging herberekent de tabel en het diagram
- Externe modus (MODE-01): objectief, formeel "u"-vorm

### Claude's Discretion
- Exacte tabel-styling (schaduw, padding, borders)
- Responsive gedrag van tabel en diagram op smallere schermen
- Hoe om te gaan met onvolledig ingevulde concurrentprijzen (tonen met lege cellen vs. minimumvereiste)
- Validatie bij prijsinvoer (min/max, valuta-formatting)
- Animaties bij uitklappen/inklappen
- Exacte Recharts configuratie (bar sizing, spacing, tooltip styling)
- Loading state als herberekening loopt

### Deferred Ideas (OUT OF SCOPE)
- AI-verrijking van onderscheidend vermogen (AI-02) -- Phase 5
- AI-suggesties voor differentiators -- Phase 5
- Interne modus met sales-signalen -- Phase 4
- Document upload voor prijsextractie (INPUT-02) -- Phase 5
- AI-agent voor prijzen opzoeken (INPUT-03) -- Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRIJS-01 | Modulaire prijsvergelijking Cito vs. DIA en JIJ op basis van publicatieprijzen | Calculation engine + ComparisonTable + default-prices data expansion |
| PRIJS-02 | Kosten per leerling per aanbieder per module | PriceRecord.amountPerStudent already in model; display in table cell line 2 |
| PRIJS-03 | Totaaloverzicht per aanbieder (alle geselecteerde modules) | Calculation engine aggregation; totaalrij in ComparisonTable |
| PRIJS-04 | Visuele vergelijking via staafdiagram | Recharts 3 grouped BarChart component |
| PRIJS-05 | Onderscheidend vermogen per module | ModuleDefinition.differentiator + extended differentiator data model |
| PRIJS-06 | Inputs aanpassen zonder opnieuw te beginnen (reactieve herberekening) | Zustand store with price overrides + "Herbereken" button pattern |
| DATA-04 | Berekeningsdetails uitklappen per module (formule en inputs) | ModuleDetailPanel Section A in expandable row |
| INPUT-01 | Prijzen handmatig invoeren of overschrijven | EditableAssumption pattern reuse in ModuleDetailPanel Section C |
| MODE-01 | Externe modus: objectief, neutraal, formeel "u"-vorm | All copywriting in formal tone; no sales signals in this phase |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Project standard |
| TypeScript | 5.9.3 | Type safety | Project standard |
| Vite | 8.0.1 | Build tool | Project standard |
| Tailwind CSS | 4.2.2 | Styling | Project standard, Cito theme via CSS custom properties |
| Recharts | 3.8.0 | Charts (grouped bar chart) | Already in dependencies, decision locked |
| Zustand | 5.0.12 | State management | Project standard, store pattern established in Phase 1 |
| Zod | 4.3.6 | Runtime validation | Project standard for schema validation |
| Vitest | 4.1.0 | Testing | Project standard |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | 16.3.2 | Component testing | All UI component tests |
| @testing-library/user-event | 14.6.1 | User interaction testing | Price override flow tests |

### No new dependencies needed
All required libraries are already installed. Recharts 3.8.0 supports grouped bar charts natively.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── engine/
│   ├── types.ts              # Extend CalculationResult (existing)
│   ├── price-comparison.ts   # Pure calculation functions (NEW)
│   └── __tests__/
│       └── price-comparison.test.ts
├── data/
│   ├── default-prices.ts     # Extend with all providers/modules (MODIFY)
│   └── differentiators.ts    # Module differentiator data (NEW)
├── models/
│   ├── pricing.ts            # Existing PriceRecord model
│   └── modules.ts            # Existing MODULE_CATALOG
├── features/
│   └── price-comparison/     # NEW feature directory
│       ├── store.ts          # Zustand store
│       ├── PriceComparisonPage.tsx
│       ├── ComparisonChart.tsx
│       ├── ComparisonTable.tsx
│       ├── ModuleDetailPanel.tsx
│       ├── BusinessCaseCTA.tsx
│       └── __tests__/
│           ├── store.test.ts
│           ├── ComparisonChart.test.tsx
│           ├── ComparisonTable.test.tsx
│           └── ModuleDetailPanel.test.tsx
└── components/ui/
    ├── PriceBadge.tsx         # Existing, reuse as-is
    ├── EditableAssumption.tsx  # Existing, reuse pattern
    └── DisclaimerFooter.tsx    # Existing, reuse as-is
```

### Pattern 1: Pure Calculation Engine
**What:** All pricing calculations as pure TypeScript functions, no React dependencies
**When to use:** Any computation that transforms inputs to outputs
**Example:**
```typescript
// src/engine/price-comparison.ts
import type { PriceRecord } from '../models/pricing';

export interface ModuleComparison {
  moduleId: string;
  moduleName: string;
  providers: Record<'cito' | 'dia' | 'jij', ProviderCost | null>;
}

export interface ProviderCost {
  pricePerStudent: number;
  totalCost: number;
  studentCount: number;
  priceRecord: PriceRecord;
}

export interface ComparisonResult {
  modules: ModuleComparison[];
  totals: Record<'cito' | 'dia' | 'jij', number>;
  differences: { citoVsDia: number | null; citoVsJij: number | null };
}

export function calculateComparison(
  selectedModules: string[],
  totalStudents: number,
  prices: PriceRecord[],
): ComparisonResult {
  // Pure function: no side effects, fully testable
}
```

### Pattern 2: Zustand Store with Explicit Recalculation
**What:** Store holds price overrides as draft state; recalculation triggered explicitly by user
**When to use:** When user edits should not immediately cascade (per "Herbereken" button decision)
**Example:**
```typescript
// src/features/price-comparison/store.ts
import { create } from 'zustand';

interface PriceOverride {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij';
  amount: number;
}

interface PriceComparisonState {
  // Computed result (from last recalculation)
  result: ComparisonResult | null;

  // Draft overrides (not yet applied)
  draftOverrides: PriceOverride[];
  hasPendingChanges: boolean;

  // Actions
  setDraftOverride: (override: PriceOverride) => void;
  resetOverride: (moduleId: string, provider: string) => void;
  recalculate: () => void; // Merges overrides into prices, recomputes
}
```

### Pattern 3: Accordion Table with Expandable Detail Rows
**What:** Only one detail row open at a time; chevron click toggles
**When to use:** ComparisonTable with ModuleDetailPanel
**Example:**
```typescript
// Accordion state: single expandedModuleId
const [expandedModule, setExpandedModule] = useState<string | null>(null);

function toggleModule(moduleId: string) {
  setExpandedModule(prev => prev === moduleId ? null : moduleId);
}
```

### Anti-Patterns to Avoid
- **Auto-recalculation on every keystroke:** User decision requires explicit "Herbereken" button. Store must separate draft overrides from applied overrides.
- **Putting calculation logic in components:** Engine functions must stay pure in `engine/` directory.
- **Hardcoding student count calculation:** Total students must be derived from SchoolProfile.studentCounts (sum across all levels and years).
- **Coloring totals green/red:** Decision explicitly forbids this. Use neutral styling only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bar chart | Custom SVG bars | Recharts 3 BarChart | Tooltips, responsiveness, accessibility built in |
| Currency formatting | String concatenation | Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }) | Handles thousands separator, decimal comma, euro sign correctly for Dutch locale |
| Price status display | Custom badge | PriceBadge (existing) | Already handles verified/manual/stale states |
| Inline editing | Custom input | EditableAssumption pattern (existing) | Click-to-edit, reset, keyboard support already implemented |
| Number input validation | Manual parsing | Zod schema + controlled input | Consistent with project validation patterns |

**Key insight:** The Dutch locale uses comma as decimal separator and period as thousands separator. Always use `Intl.NumberFormat('nl-NL')` for display. Input parsing must handle both comma and period as decimal separator.

## Common Pitfalls

### Pitfall 1: Student Count Aggregation
**What goes wrong:** Using a single "total students" number when pricing may be per-level or per-year
**Why it happens:** PriceRecord has amountPerStudent but the actual student count comes from SchoolProfile.studentCounts which is nested by level and year
**How to avoid:** Calculate total students from SchoolProfile: sum all values across all selected levels and all years. For modules with `separateLicense: true` (e.g., cognitieve-capaciteiten), the pricing model may differ.
**Warning signs:** Totals don't match manual calculation

### Pitfall 2: Missing Provider Prices
**What goes wrong:** Runtime errors or NaN when a provider doesn't offer a module
**Why it happens:** Not all providers offer all modules (e.g., JIJ may not offer sociaal-emotioneel)
**How to avoid:** Always check for null/undefined before computing. Return `null` for ProviderCost when no price exists. UI shows "Niet beschikbaar" badge.
**Warning signs:** NaN in table cells, missing bars in chart

### Pitfall 3: Draft vs Applied Price State
**What goes wrong:** Chart and table update immediately on input change, confusing user
**Why it happens:** Connecting editable fields directly to calculation input
**How to avoid:** Maintain separate `draftOverrides` (uncommitted edits) and `appliedOverrides` (after "Herbereken"). Only recalculate when user clicks the button.
**Warning signs:** Table flickers while typing

### Pitfall 4: Recharts 3 Data Shape
**What goes wrong:** Bars don't render or render stacked instead of grouped
**Why it happens:** Incorrect data structure or accidental stackId prop
**How to avoid:** Data must be an array of objects where each object has a key per provider: `{ module: 'Rekenen', cito: 1200, dia: 1100, jij: null }`. Each `<Bar>` gets a different `dataKey` but NO `stackId`.
**Warning signs:** Bars overlap or stack vertically

### Pitfall 5: Decimal Comma Input
**What goes wrong:** User types "4,50" (Dutch convention) but parseFloat returns NaN
**Why it happens:** JavaScript parseFloat only understands period as decimal separator
**How to avoid:** Replace comma with period before parsing: `parseFloat(input.replace(',', '.'))`
**Warning signs:** Manual prices rejected or treated as integers

### Pitfall 6: Recharts ResponsiveContainer Height
**What goes wrong:** Chart renders with 0 height or doesn't appear
**Why it happens:** ResponsiveContainer needs explicit height or parent with defined height
**How to avoid:** Always set `<ResponsiveContainer width="100%" height={320}>` with explicit pixel height
**Warning signs:** Empty space where chart should be

## Code Examples

### Grouped Bar Chart with Recharts 3
```typescript
// Source: Recharts 3.8.0 API (recharts.github.io)
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  module: string;
  cito: number | null;
  dia: number | null;
  jij: number | null;
}

function PriceComparisonChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} barSize={32} barGap={4} barCategoryGap="20%">
        <XAxis dataKey="module" />
        <YAxis
          tickFormatter={(v: number) =>
            new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="cito" name="Cito" fill="#003082" />
        <Bar dataKey="dia" name="DIA" fill="#9CA3AF" />
        <Bar dataKey="jij" name="JIJ" fill="#6B7280" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Currency Formatting (Dutch locale)
```typescript
// nl-NL locale: euro sign, comma as decimal, period as thousands
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

// formatCurrency(1234.50) => "€ 1.234,50"

const formatCurrencyCompact = (amount: number): string =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);

// formatCurrencyCompact(1234) => "€ 1.234"
```

### Total Student Count from SchoolProfile
```typescript
function getTotalStudents(
  studentCounts: Partial<Record<string, Record<number, number>>>,
): number {
  let total = 0;
  for (const levelCounts of Object.values(studentCounts)) {
    if (levelCounts) {
      for (const count of Object.values(levelCounts)) {
        total += count;
      }
    }
  }
  return total;
}
```

### Price Override with EditableAssumption Pattern
```typescript
// Reuse the click-to-edit, reset, keyboard pattern from EditableAssumption
// but adapted for currency input
interface PriceInputProps {
  provider: 'cito' | 'dia' | 'jij';
  moduleId: string;
  currentPrice: number | null;
  defaultPrice: number | null;
  isOverridden: boolean;
  onChange: (amount: number) => void;
  onReset: () => void;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x CategoricalChartState | Recharts 3.x hooks-based state | Recharts 3.0 | No breaking changes for basic BarChart usage |
| forwardRef pattern | React 19 ref as prop | React 19 | Simpler component composition |
| Zod v3 required_error | Zod v4 message param | Zod 4.0 | Already adopted in Phase 1 |

**Deprecated/outdated:**
- Recharts `Customized` wrapper: no longer necessary in 3.x, components can be wrapped directly

## Open Questions

1. **Exact pricing data for DIA and JIJ**
   - What we know: Cito prices exist as placeholders in default-prices.ts; DIA has one placeholder entry
   - What's unclear: Complete publication prices per module per provider. JIJ has no entries yet.
   - Recommendation: Expand default-prices.ts with best-available data. Mark unknown prices with a mechanism for the user to fill in (INPUT-01). STATE.md blocker note confirms this needs resolution.

2. **Student count granularity for pricing**
   - What we know: PriceRecord has amountPerStudent as a flat per-student price
   - What's unclear: Whether some providers charge differently per level or per year, or offer volume discounts
   - Recommendation: Keep it simple -- total students x price per student. The tool uses publication prices as upper bound (DATA-06 disclaimer). Complex pricing models can be handled via manual override (INPUT-01).

3. **Module availability mapping per provider**
   - What we know: MODULE_CATALOG has 6 modules. Not all providers offer all modules.
   - What's unclear: Exact mapping of which provider offers which module
   - Recommendation: Create a provider-module availability map in default-prices.ts. If no PriceRecord exists for a provider+module combination, treat as "Niet beschikbaar".

4. **Differentiator data completeness**
   - What we know: ModuleDefinition.differentiator exists with values for rekenwiskunde and nederlands
   - What's unclear: Full differentiator data for all modules and competitors
   - Recommendation: Extend the data model to support per-provider differentiators. Hardcode best-available data as default. Users can edit in Phase 5 (AI-02 deferred).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | vitest.config.ts (root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRIJS-01 | Modulaire prijsvergelijking berekening | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts -x` | Wave 0 |
| PRIJS-02 | Kosten per leerling per aanbieder per module | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts -x` | Wave 0 |
| PRIJS-03 | Totaaloverzicht per aanbieder | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts -x` | Wave 0 |
| PRIJS-04 | Staafdiagram rendert correct | component | `npx vitest run src/features/price-comparison/__tests__/ComparisonChart.test.tsx -x` | Wave 0 |
| PRIJS-05 | Onderscheidend vermogen per module | component | `npx vitest run src/features/price-comparison/__tests__/ComparisonTable.test.tsx -x` | Wave 0 |
| PRIJS-06 | Reactieve herberekening na override | integration | `npx vitest run src/features/price-comparison/__tests__/store.test.ts -x` | Wave 0 |
| DATA-04 | Berekeningsdetails uitklappen | component | `npx vitest run src/features/price-comparison/__tests__/ModuleDetailPanel.test.tsx -x` | Wave 0 |
| INPUT-01 | Prijzen handmatig invoeren/overschrijven | component | `npx vitest run src/features/price-comparison/__tests__/ModuleDetailPanel.test.tsx -x` | Wave 0 |
| MODE-01 | Externe modus (formeel, neutraal) | manual-only | Visual review of copy tone | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/engine/__tests__/price-comparison.test.ts` -- covers PRIJS-01, PRIJS-02, PRIJS-03
- [ ] `src/features/price-comparison/__tests__/store.test.ts` -- covers PRIJS-06
- [ ] `src/features/price-comparison/__tests__/ComparisonChart.test.tsx` -- covers PRIJS-04
- [ ] `src/features/price-comparison/__tests__/ComparisonTable.test.tsx` -- covers PRIJS-05
- [ ] `src/features/price-comparison/__tests__/ModuleDetailPanel.test.tsx` -- covers DATA-04, INPUT-01

## Sources

### Primary (HIGH confidence)
- Existing codebase: src/models/pricing.ts, src/models/modules.ts, src/engine/types.ts, src/data/default-prices.ts
- Existing codebase: src/features/school-profile/store.ts (Zustand store pattern)
- Existing codebase: src/components/ui/PriceBadge.tsx, EditableAssumption.tsx
- Phase 1 CONTEXT.md and Phase 2 UI-SPEC.md (design contracts)
- [Recharts BarChart API](https://recharts.github.io/en-US/api/BarChart/) -- barSize, barGap, barCategoryGap props
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- breaking changes and new features

### Secondary (MEDIUM confidence)
- [Recharts examples](https://recharts.github.io/en-US/examples/) -- tooltip customization patterns

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified in package.json
- Architecture: HIGH -- follows established project patterns (pure engine, Zustand store, Tailwind components)
- Pitfalls: HIGH -- derived from actual code inspection (PriceRecord model, Dutch locale requirements, Recharts API)

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable stack, no fast-moving dependencies)
