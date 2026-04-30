# Phase 10: Prijsvergelijking & Gevoeligheid - Research

**Researched:** 2026-03-22
**Domain:** Price comparison engine + sensitivity analysis + internal/external mode toggle
**Confidence:** HIGH

## Summary

Phase 10 extends the existing price comparison engine and UI with five major capabilities: (1) DIA package pricing logic (automatic cheapest package at 3+ modules, configurable packages), (2) hybrid scenarios where schools mix providers per module, (3) sensitivity analysis with discount scenarios and break-even calculation, (4) sales signals based on price differences and differentiators, and (5) an internal/external mode toggle. The existing codebase provides solid foundations: `calculateComparison()` is a pure function, `ComparisonTable` already supports expandable detail rows, `MODULE_DIFFERENTIATORS` provides the data for sales signals, and the Zustand store pattern is well-established.

The key architectural challenge is extending `calculateComparison()` to handle DIA package pricing without breaking the pure-function pattern. Package pricing is fundamentally different from per-module pricing: when a school uses 3+ DIA modules, the total DIA cost may be a single package price rather than the sum of individual module prices. The engine must detect this, select the optimal package, and still report per-module costs for the comparison table. The sensitivity analysis and break-even calculations are mathematically straightforward (linear functions) and can be implemented as separate pure functions that consume the comparison result.

**Primary recommendation:** Extend the existing engine with new pure functions (`calculateDiaPackagePrice`, `calculateHybridScenario`, `calculateSensitivity`, `calculateBreakEven`) rather than rewriting `calculateComparison()`. Add a DIA package configuration data file. Implement internal/external mode as a simple Zustand atom that controls UI visibility.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** DIA-pakketten: engine berekent automatisch het voordeligste pakket bij 3+ modules, maar gebruiker kan overschrijven naar een ander pakket of losse modules
- **D-02:** DIA-pakketten zijn configureerbaar door de accountmanager -- nieuwe pakketten toevoegen, prijzen aanpassen. Niet hardcoded.
- **D-03:** Pakketprijs-weergave: PriceBadge toont [Pakketprijs] naast het bedrag. Uitklapbare detailrij toont welk pakket van toepassing is met uitleg welke modules erin zitten
- **D-04:** JIJ verschijnt alleen in de vergelijking als de school JIJ daadwerkelijk gebruikt (productgebruik vastgelegd in Phase 7 schoolprofiel)
- **D-05:** JIJ zonder ingevoerde prijzen: kolom verschijnt met invoervelden per module + differentiators (wat JIJ wel/niet biedt), maar geen bedrag tot ingevoerd
- **D-06:** Hybride scenario volgt automatisch uit het productgebruik dat in Phase 7 vastgelegd is -- niet-Cito modules tonen automatisch wat Cito kost. AM kan per module overschrijven
- **D-07:** Basisvaardighedentoetsen (rekenwiskunde, Nederlands, etc.) zijn typisch bij 1 aanbieder; extra modules (sociaal-emotioneel, cognitieve capaciteiten) kunnen per module bij een andere aanbieder zitten
- **D-08:** Extra kolom 'Na overstap' naast Cito/DIA/JIJ die per module toont wat de school betaalt als ze switchen. Besparingsrij onderaan
- **D-09:** Overstap-info toont euro's + percentage per module en totaal
- **D-10:** Toggle bovenaan de vergelijking: [Per jaar] / [3-jarig contract]. Bij 3-jarig toont de engine de 3-jaars Cito-prijs naast de jaarlijkse concurrent-prijs x 3
- **D-11:** Exacte prijsmodel voor 3-jarige licentie wordt door de gebruiker aangeleverd -- researcher/planner moet hier input voor vragen of placeholder ondersteunen
- **D-12:** Scenariotabel: huidige vergelijking, 10% korting concurrent, 20% korting concurrent. Per scenario het totaalverschil en per-module verschil
- **D-13:** Break-even: zowel totaal ('DIA wordt goedkoper bij 18% korting') als per-module in de detailrij
- **D-14:** Alleen de actieve concurrent tonen (de concurrent die de school nu gebruikt), niet altijd beide
- **D-15:** Gevoeligheidsanalyse als uitklapbare sectie onder de vergelijkingstabel, op dezelfde pagina
- **D-16:** Alleen zichtbaar in interne modus
- **D-17:** Automatische signalen op basis van prijsverschil: Cito goedkoper -> 'Benadruk prijs' (groen), Cito duurder maar differentiators -> 'Focus op meerwaarde' (geel), Cito duurder zonder differentiators -> 'Kwetsbaar punt' (rood)
- **D-18:** Visueel: gekleurde badge naast modulenaam in de vergelijkingstabel. In de detailrij een korte toelichting
- **D-19:** Toggle in de pagina-header: [Extern] / [Intern]. Extern verbergt gevoeligheidsanalyse en sales-signalen. Extern = 'schoon voor scherm delen met school'
- **D-20:** Altijd ingelogd. Extern is geen publieke modus, maar een weergavemodus zonder sales-specifieke info

### Claude's Discretion
- Exacte DIA-pakketconfiguratie UI (CRUD voor pakketten)
- Berekening van pakketprijzen vs losse moduleprijzen in de engine
- Visueel onderscheid tussen interne en externe modus (achtergrondkleur, subtiele aanduiding)
- Exacte positioning en styling van de 'Na overstap' kolom
- Break-even berekening: wiskundige benadering (lineaire interpolatie vs exacte berekening)
- Responsive gedrag van de uitgebreide tabel op tablet
- Loading state bij herberekening na prijswijziging
- Animaties bij toggle-switches en uitklap-secties

### Deferred Ideas (OUT OF SCOPE)
- Vercel deploy (DEPLOY-01) -- hoort bij Phase 8
- Meerjarenprojectie over 1, 3 en 5 jaar met cumulatieve besparing -- Phase 11
- AI-verrijking van differentiators op basis van concurrentie-informatie -- FUTURE
- Publieke link voor school (extern zonder login) -- niet in scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRIJS-01 | Gebruiker ziet per module kosten per leerling en totaalkosten per aanbieder naast elkaar | Existing `ComparisonTable` + `ModuleRow` already show this; extend with package pricing and conditional JIJ column |
| PRIJS-02 | Visuele vergelijking (staafdiagram) van totaalkosten per aanbieder | Existing `ComparisonChart` (Recharts BarChart); extend with 'Na overstap' data series and 3-jarig toggle |
| PRIJS-03 | Berekeningsdetails per module uitklappen met formule en inputs | Existing `ModuleDetailPanel` shows formula; extend with package explanation and break-even |
| PRIJS-04 | Handmatig overschrijven met bronvermelding, reactieve herberekening | Existing `PriceOverrideRow` in `ModuleDetailPanel`; integrate with `useSchoolPrices` for Supabase persistence |
| PRIJS-05 | Per module onderscheidend vermogen (wat Cito biedt dat concurrent niet biedt, en omgekeerd) | Existing `MODULE_DIFFERENTIATORS` data + display in `ModuleDetailPanel`; add sales signal badges |
| PRIJS-06 | DIA-pakketprijzen correct berekend bij 3+ modules | New: DIA package configuration data + `calculateDiaPackagePrice()` pure function |
| PRIJS-08 | Hybride scenario per module met besparingen | New: 'Na overstap' column using `moduleSetups` data; `calculateHybridSavings()` pure function |
| GEVOEL-01 | Gevoeligheidsanalyse met 10%/20% korting concurrent | New: `calculateSensitivity()` pure function + collapsible UI section |
| GEVOEL-02 | Effect per kortingsscenario op totaal en per-module verschil | New: sensitivity table component consuming engine output |
| GEVOEL-03 | Break-even kortingspercentage per concurrent | New: `calculateBreakEven()` pure function (linear: citoCost / competitorCost - 1) |
| MODE-02 | Interne modus toont sales-signalen per module | New: `determineSalesSignal()` function + `SalesSignalBadge` component + mode toggle in store |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Project standard |
| TypeScript | 5.9.3 | Type safety | Project standard |
| Zustand | 5.0.12 | State management | Project standard, used for both stores |
| Recharts | 3.8.0 | Charts/visualizations | Already used for ComparisonChart |
| Tailwind CSS | 4.2.2 | Styling | Project standard |
| Vitest | 4.1.0 | Testing | Project standard |
| Zod | 4.3.6 | Schema validation | Project standard for forms |
| @tanstack/react-query | 5.94.5 | Server state | Used for Supabase data fetching |

### No New Dependencies Required

All Phase 10 features can be built with the existing stack. No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── engine/
│   ├── price-comparison.ts          # EXTEND: add DIA package awareness
│   ├── dia-packages.ts              # NEW: DIA package calculation logic
│   ├── hybrid-scenario.ts           # NEW: 'Na overstap' calculations
│   ├── sensitivity.ts               # NEW: discount scenarios + break-even
│   ├── sales-signals.ts             # NEW: automatic sales signal determination
│   ├── current-vs-proposed.ts       # EXISTING: reference for hybrid logic
│   └── __tests__/
│       ├── price-comparison.test.ts  # EXTEND
│       ├── dia-packages.test.ts      # NEW
│       ├── hybrid-scenario.test.ts   # NEW
│       ├── sensitivity.test.ts       # NEW
│       └── sales-signals.test.ts     # NEW
├── data/
│   ├── dia-packages.ts              # NEW: DIA package configuration (configurable)
│   └── differentiators.ts           # EXISTING: basis for sales signals
├── features/price-comparison/
│   ├── ComparisonTable.tsx           # EXTEND: 'Na overstap' column, sales badges
│   ├── ComparisonChart.tsx           # EXTEND: 3-jarig toggle, hybrid data
│   ├── ModuleDetailPanel.tsx         # EXTEND: break-even, package info
│   ├── PriceComparisonPage.tsx       # EXTEND: mode toggle, sensitivity section
│   ├── SensitivitySection.tsx        # NEW: collapsible sensitivity analysis
│   ├── SalesSignalBadge.tsx          # NEW: colored sales signal badges
│   ├── ModeToggle.tsx               # NEW: Intern/Extern toggle
│   ├── PeriodToggle.tsx             # NEW: Per jaar / 3-jarig contract toggle
│   ├── DiaPackageManager.tsx         # NEW: CRUD for DIA package config
│   └── store.ts                     # EXTEND: mode, sensitivity state
└── models/
    └── dia-packages.ts              # NEW: DIA package types
```

### Pattern 1: Pure Engine Functions (EXISTING -- follow strictly)
**What:** All calculation logic as pure functions with no side effects
**When to use:** Every new calculation (DIA packages, hybrid, sensitivity, break-even, sales signals)
**Example:**
```typescript
// src/engine/sensitivity.ts
export interface SensitivityScenario {
  discountPercent: number;
  competitorTotal: number;
  citoTotal: number;
  difference: number;
  perModule: Array<{
    moduleId: string;
    competitorCost: number;
    citoCost: number;
    difference: number;
  }>;
}

export function calculateSensitivity(
  comparisonResult: ComparisonResult,
  activeCompetitor: ProviderKey,
  discountPercents: number[], // [0, 10, 20]
): SensitivityScenario[] {
  // Pure function — no state, no side effects
}
```

### Pattern 2: DIA Package Pricing
**What:** Configurable DIA package definitions with automatic optimal package selection
**When to use:** When calculating DIA costs for a school with 3+ DIA modules
**Recommendation:**
```typescript
// src/data/dia-packages.ts — configurable data, not hardcoded
export interface DiaPackage {
  id: string;
  name: string;
  includedModuleIds: string[];
  pricePerStudent: number;
  minModules: number; // typically 3
}

export const DIA_PACKAGES: DiaPackage[] = [
  {
    id: 'basis-3',
    name: 'Basispakket (3 modules)',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels'],
    pricePerStudent: 12.50, // placeholder — cheaper than 3x 5.20
    minModules: 3,
  },
  // More packages...
];

// src/engine/dia-packages.ts — pure calculation
export function selectOptimalDiaPackage(
  selectedModuleIds: string[],
  packages: DiaPackage[],
  perModulePrices: Map<string, number>,
): { package: DiaPackage | null; totalCost: number; savings: number } {
  const diaModules = selectedModuleIds.filter(id =>
    perModulePrices.has(id)
  );
  if (diaModules.length < 3) return { package: null, totalCost: sumIndividual, savings: 0 };
  // Find cheapest package that covers the selected modules
  // Compare with sum of individual prices
  // Return whichever is cheaper
}
```

### Pattern 3: Sales Signal Determination
**What:** Automatic classification based on price difference and differentiators
**When to use:** Per module, in internal mode only
**Recommendation:**
```typescript
// src/engine/sales-signals.ts
export type SalesSignalType = 'emphasize-price' | 'focus-value' | 'vulnerable';

export interface SalesSignal {
  type: SalesSignalType;
  label: string;       // Dutch UI label
  description: string; // Short explanation
  color: 'green' | 'yellow' | 'red';
}

export function determineSalesSignal(
  citoCost: number | null,
  competitorCost: number | null,
  citoDifferentiators: string[],
  competitorDifferentiators: string[],
): SalesSignal | null {
  if (citoCost === null || competitorCost === null) return null;
  if (citoCost <= competitorCost) {
    return { type: 'emphasize-price', label: 'Benadruk prijs', color: 'green', ... };
  }
  if (citoDifferentiators.length > 0) {
    return { type: 'focus-value', label: 'Focus op meerwaarde', color: 'yellow', ... };
  }
  return { type: 'vulnerable', label: 'Kwetsbaar punt', color: 'red', ... };
}
```

### Pattern 4: Break-Even Calculation
**What:** Find the discount percentage at which competitor becomes cheaper than Cito
**When to use:** Per module and total, in sensitivity section
**Mathematical approach:** Linear interpolation. If Cito costs C and competitor costs P, the break-even discount d = 1 - (C / P). At this discount, competitor price P*(1-d) = C.
```typescript
export function calculateBreakEven(
  citoCost: number,
  competitorCost: number,
): number | null {
  if (competitorCost <= 0 || citoCost <= 0) return null;
  if (citoCost <= competitorCost) return null; // Cito is already cheaper, no break-even
  // At what % discount does competitor = Cito?
  // competitorCost * (1 - d) = citoCost
  // d = 1 - (citoCost / competitorCost)
  const breakEven = (1 - citoCost / competitorCost) * 100;
  return Math.round(breakEven * 10) / 10; // 1 decimal
}
```
Note: break-even only applies when Cito is cheaper (competitor needs to discount to match). When Cito is more expensive, break-even is 0% (competitor is already cheaper). The UI should say something like "DIA is nu al goedkoper" in that case.

### Pattern 5: Conditional JIJ Column (D-04, D-05)
**What:** JIJ column only appears when school uses JIJ per moduleSetups
**When to use:** In ComparisonTable rendering
**Approach:** Check `moduleSetups` from school profile store. If any module has `currentProvider === 'jij'`, show the JIJ column. If JIJ has no prices entered, show input fields in the cells instead of amounts.

### Pattern 6: Internal/External Mode Toggle
**What:** Simple boolean state that controls visibility of sales-specific UI
**When to use:** Page-level toggle
**Approach:** Add `isInternalMode: boolean` to the price comparison store (default: `true`). Toggle hides: sales signal badges, sensitivity section, break-even details. Does NOT change data or calculations -- purely UI visibility.

### Pattern 7: Hybrid 'Na overstap' Column (D-06, D-08)
**What:** Extra column showing post-switch costs based on school's current providers
**When to use:** When school has moduleSetups with non-Cito providers
**Approach:** For each module, if the school currently uses DIA/JIJ, the 'Na overstap' column shows the Cito price (what they'd pay after switching). The savings row shows `currentCost - citoCost` per module and as total.

### Anti-Patterns to Avoid
- **Mutating engine state:** All new engine functions MUST be pure. Never import stores in engine files.
- **Prop drilling for mode:** Use the Zustand store for internal/external mode, not props.
- **Hardcoding DIA packages:** Per D-02, packages must be configurable data, not embedded in engine logic.
- **Showing all competitors in sensitivity:** Per D-14, only show the active competitor (the one the school uses), not both DIA and JIJ.
- **Breaking existing `calculateComparison()`:** The existing function should remain backward-compatible. DIA package logic wraps or extends it, not replaces it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart visualization | Custom SVG bars | Recharts BarChart (already used) | Responsive, tooltips, legends built-in |
| Form validation for DIA package CRUD | Manual validation | react-hook-form + Zod (project pattern) | Consistent with all other forms |
| Price persistence | localStorage overrides | useSchoolPrices + Supabase (Phase 9) | Already built, supports school-specific prices |
| State management | React Context for mode | Zustand store (project pattern) | Consistent, CLAUDE.md explicitly says no new Context |
| Number formatting | Template literals | `formatCurrency()` / `formatCurrencyCompact()` (existing) | Dutch locale formatting already implemented |

**Key insight:** The existing codebase already has 80% of the infrastructure. The work is extending it, not building from scratch.

## Common Pitfalls

### Pitfall 1: DIA Package Price vs Per-Module Price Confusion
**What goes wrong:** The engine calculates DIA costs per-module (5.20 each), but when 3+ modules are selected, a package price should apply. If both coexist without clear signaling, the UI shows wrong numbers.
**Why it happens:** The current engine treats every provider identically (simple per-student multiplication). DIA packages break this assumption.
**How to avoid:** Calculate DIA package pricing as a separate step AFTER the basic per-module calculation. Store both the per-module price and the package-adjusted price. The `ProviderCost` interface needs a new field like `packageName?: string` and `packageAdjusted?: boolean`.
**Warning signs:** DIA total in the table doesn't match the sum of individual DIA module prices.

### Pitfall 2: Stale Closures in Store
**What goes wrong:** Reading school profile data via hooks inside engine functions creates stale closures.
**Why it happens:** The existing pattern uses `getState()` (not hooks) to read cross-store data. New code might accidentally use hooks.
**How to avoid:** ALL engine functions receive data as parameters. The store's `recalculate()` method calls `getState()` and passes data to engines. This is documented in CLAUDE.md: "leest via getState(), NIET via hooks".
**Warning signs:** Calculations don't update when school profile changes.

### Pitfall 3: Break-Even Edge Cases
**What goes wrong:** Division by zero or negative break-even percentages when prices are 0 or when Cito is more expensive.
**Why it happens:** Mathematical edge cases in the break-even formula.
**How to avoid:** Guard clauses: if competitor cost <= 0, return null. If Cito is already more expensive (competitor cheaper), return null and show "Concurrent is nu al goedkoper" in UI. Only calculate break-even when Cito is cheaper than the competitor at list price.
**Warning signs:** NaN or Infinity displayed in the UI.

### Pitfall 4: Conditional Column Count Breaks Table Layout
**What goes wrong:** Adding 'Na overstap' column and conditionally showing/hiding JIJ column makes the table layout inconsistent.
**Why it happens:** The current table has fixed 4 columns (Module + 3 providers). Adding 'Na overstap' makes it 5, and conditional JIJ makes it 4 or 5.
**How to avoid:** Use dynamic `colSpan` values. Define visible columns as an array at the top of ComparisonTable and derive colSpan from `columns.length`. The header, category subheader, and totaal row all use this value.
**Warning signs:** Misaligned columns, broken totaalrij spanning.

### Pitfall 5: 3-Jarig Contract Pricing Without Data
**What goes wrong:** D-11 states the exact 3-year model will be provided later. Building a UI toggle without the pricing formula means it shows wrong numbers.
**Why it happens:** Premature implementation of a feature with unknown data.
**How to avoid:** Implement the toggle UI and the engine hook (multiply competitor by 3, use placeholder multiplier for Cito 3-year). Add a prominent "Placeholder -- exacte 3-jarige Cito-prijs wordt nog aangeleverd" banner when 3-jarig is selected. Make the Cito 3-year multiplier configurable.
**Warning signs:** Users trust placeholder 3-year prices as real data.

### Pitfall 6: Modifying default-prices.ts
**What goes wrong:** CLAUDE.md explicitly forbids modifying `src/data/default-prices.ts` without approval.
**Why it happens:** Developer adds DIA package prices to the wrong file.
**How to avoid:** DIA package configuration goes in a NEW file `src/data/dia-packages.ts`. Never modify `default-prices.ts`.
**Warning signs:** Git diff showing changes to `default-prices.ts`.

## Code Examples

### Extending ComparisonResult for Packages
```typescript
// Extension to existing ProviderCost
export interface ProviderCost {
  pricePerStudent: number;
  totalCost: number;
  studentCount: number;
  priceRecord: PriceRecord;
  // NEW fields for DIA package support
  isPackagePrice?: boolean;
  packageId?: string;
  packageName?: string;
  individualTotal?: number; // what it would cost without package
}
```

### Sensitivity Table Data Structure
```typescript
export interface SensitivityResult {
  competitor: ProviderKey;
  competitorLabel: string;
  scenarios: Array<{
    discountPercent: number;
    label: string; // "Huidige prijs", "10% korting", "20% korting"
    competitorTotal: number;
    citoTotal: number; // stays the same across scenarios
    difference: number; // positive = Cito cheaper
    perModule: Array<{
      moduleId: string;
      moduleName: string;
      competitorCost: number;
      citoCost: number;
      difference: number;
    }>;
  }>;
  breakEven: {
    totalPercent: number | null; // null if Cito is more expensive at list
    perModule: Array<{
      moduleId: string;
      percent: number | null;
    }>;
  };
}
```

### Mode Toggle Component Pattern
```typescript
// In store.ts — extend PriceComparisonState
interface PriceComparisonState {
  // ... existing fields
  isInternalMode: boolean;
  setInternalMode: (mode: boolean) => void;
  // Period toggle
  contractPeriod: 'annual' | 'three-year';
  setContractPeriod: (period: 'annual' | 'three-year') => void;
}

// In ModeToggle.tsx
function ModeToggle() {
  const isInternal = usePriceComparisonStore(s => s.isInternalMode);
  const setMode = usePriceComparisonStore(s => s.setInternalMode);
  // Render toggle button with visual distinction
  // When external: subtle label like "Extern — geschikt voor scherm delen"
}
```

### Sales Signal Badge
```typescript
// SalesSignalBadge.tsx
const SIGNAL_STYLES: Record<SalesSignalType, string> = {
  'emphasize-price': 'bg-green-100 text-green-800 border-green-300',
  'focus-value': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'vulnerable': 'bg-red-100 text-red-800 border-red-300',
};

export function SalesSignalBadge({ signal }: { signal: SalesSignal }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${SIGNAL_STYLES[signal.type]}`}>
      {signal.label}
    </span>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simple per-student x total multiplication | Package-aware pricing with automatic optimization | Phase 10 | DIA costs change when 3+ modules selected |
| All 3 providers always visible | Conditional columns based on school usage | Phase 10 | Cleaner UI for schools not using JIJ |
| Single view mode | Internal/External toggle | Phase 10 | Screen-sharing safe mode for school meetings |
| Static price display | Sensitivity analysis with discount scenarios | Phase 10 | AM can anticipate competitor price drops |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest` in package.json (vite built-in) |
| Quick run command | `npx vitest run src/engine/__tests__/` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRIJS-01 | Per-module costs per provider | unit | `npx vitest run src/engine/__tests__/price-comparison.test.ts -x` | Exists, extend |
| PRIJS-06 | DIA package pricing 3+ modules | unit | `npx vitest run src/engine/__tests__/dia-packages.test.ts -x` | Wave 0 |
| PRIJS-08 | Hybrid scenario savings | unit | `npx vitest run src/engine/__tests__/hybrid-scenario.test.ts -x` | Wave 0 |
| GEVOEL-01 | 10%/20% discount scenarios | unit | `npx vitest run src/engine/__tests__/sensitivity.test.ts -x` | Wave 0 |
| GEVOEL-03 | Break-even calculation | unit | `npx vitest run src/engine/__tests__/sensitivity.test.ts -x` | Wave 0 |
| MODE-02 | Sales signal determination | unit | `npx vitest run src/engine/__tests__/sales-signals.test.ts -x` | Wave 0 |
| PRIJS-02 | Chart renders with extended data | integration | `npx vitest run src/features/price-comparison/__tests__/ -x` | Wave 0 (optional) |
| PRIJS-03 | Detail panel shows formula + package | manual-only | Visual inspection | N/A |
| PRIJS-04 | Override + reactive recalculation | manual-only | Visual inspection (existing override logic) | N/A |
| PRIJS-05 | Differentiators display | manual-only | Visual inspection (existing display works) | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/engine/__tests__/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/engine/__tests__/dia-packages.test.ts` -- covers PRIJS-06
- [ ] `src/engine/__tests__/hybrid-scenario.test.ts` -- covers PRIJS-08
- [ ] `src/engine/__tests__/sensitivity.test.ts` -- covers GEVOEL-01, GEVOEL-02, GEVOEL-03
- [ ] `src/engine/__tests__/sales-signals.test.ts` -- covers MODE-02

## Open Questions

1. **DIA Package Actual Prices**
   - What we know: DIA offers package discounts for 3+ modules. The current `default-prices.ts` has individual DIA module prices (5.20/student for LVS modules, 4.00 for sociaal-emotioneel).
   - What's unclear: Exact DIA package prices (what discount percentage? Are there multiple package tiers?). The data file needs placeholder prices that the AM can configure.
   - Recommendation: Create `dia-packages.ts` with reasonable placeholder prices (e.g., 15% discount at 3 modules, 20% at 4+). Mark as configurable and document that the AM should update these based on actual DIA pricing information.

2. **3-Year Cito License Pricing Model**
   - What we know: D-11 states the exact model will be provided by the user later.
   - What's unclear: Is it a simple multiplier (e.g., 2.7x annual price)? Or a different per-module structure?
   - Recommendation: Implement as a configurable multiplier in a data file (default: 2.85x as placeholder, meaning ~5% annual discount). Show a clear warning that the price is a placeholder. Engine accepts a `citoThreeYearMultiplier` parameter.

3. **JIJ Column Visibility Logic**
   - What we know: D-04 says JIJ appears only if school uses JIJ. The `moduleSetups` array has `currentProvider` per module.
   - What's unclear: What if the school uses JIJ for one module but not others? Show column for all modules or just the one?
   - Recommendation: If ANY module has `currentProvider === 'jij'`, show the JIJ column for ALL modules. Modules where JIJ isn't the current provider show normal JIJ price (if available) or "Niet beschikbaar". This is consistent with the current behavior and simpler to implement.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `src/engine/price-comparison.ts`, `src/engine/current-vs-proposed.ts`, `src/features/price-comparison/` -- all read directly
- `src/data/default-prices.ts` -- current pricing structure and DIA individual prices
- `src/data/differentiators.ts` -- MODULE_DIFFERENTIATORS structure for sales signals
- `src/models/school.ts` -- ModuleCurrentSetup type for hybrid scenario data source
- `src/features/price-comparison/store.ts` -- Zustand store pattern with getState() reads

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions D-01 through D-20 -- user requirements for all features
- CLAUDE.md project guidelines -- pure engine functions, no price data modification, Zustand patterns

### Tertiary (LOW confidence)
- DIA package pricing estimates -- no verified source for actual DIA package prices; placeholders needed
- 3-year Cito license model -- explicitly stated as "to be provided later" by user

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - extends well-documented existing patterns
- Engine logic: HIGH - pure functions with clear mathematical models
- DIA package data: LOW - actual prices unknown, need placeholders
- 3-year pricing: LOW - model not yet defined by user
- Pitfalls: HIGH - identified from concrete codebase analysis

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain, all patterns established)
