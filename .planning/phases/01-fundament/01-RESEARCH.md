# Phase 1: Fundament - Research

**Researched:** 2026-03-20
**Domain:** React 19 application scaffold, multi-step wizard form, TypeScript data models, Tailwind CSS 4 theming
**Confidence:** HIGH

## Summary

Phase 1 bootstraps the entire application: Vite 8 + React 19 + TypeScript project scaffold, Cito brand theming with Tailwind CSS 4, a 4-step wizard for school profile input, TypeScript data models for pricing/assumptions, and the Dutch-language interface. The stack is locked (React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Recharts 3) and the repository starts empty.

The critical architectural decision is separating the calculation engine (pure TypeScript functions) from the React UI. Phase 1 defines the data models and wizard UI; calculations come in later phases. The wizard pattern (Schooltype -> Leerlingaantallen -> Modules -> Scenario) with per-step Zod validation and react-hook-form is the standard modern approach. Tailwind CSS 4 uses a new CSS-first configuration with `@theme` directive, eliminating tailwind.config.js.

**Primary recommendation:** Scaffold with `npm create vite@latest -- --template react-ts`, add Tailwind CSS 4 via `@tailwindcss/vite` plugin, define Cito brand colors in `@theme`, use react-hook-form + zod for the wizard, and keep all data models as pure TypeScript types/interfaces with factory functions.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Stapsgewijze wizard met 4 stappen: Schooltype/niveaus -> Leerlingaantallen -> Modules -> Scenario kiezen
- Voortgangsbalk is klikbaar: gebruiker kan terug naar eerdere stappen, ingevulde data blijft bewaard
- Vooruit kan alleen als huidige stap valide is
- Leerlingaantallen per leerjaar per niveau (matrix-invoer)
- Slim grid met defaults: alleen rijen voor geselecteerde niveaus, met 'vul standaard in' knop (klein/midden/groot VO) als startpunt
- Kaarten met toggle voor module-selectie, gegroepeerd in twee categorieen (Leerlingvolgsysteem / Overige instrumenten)
- Alle modules staan standaard uit
- Badge per status naast elke prijs: [Geverifieerd], [Handmatig], [Verouderd]
- Onderscheid intern/extern: externe modus = handmatige prijzen van school, interne modus = publicatieprijzen
- Prijzen >6 maanden oud: oranje badge + tooltip met laatst geverifieerde datum
- 'Publicatieprijs = bovengrens'-disclaimer als voetnoot
- Inline bewerkbare aannames bij de berekening waar ze gebruikt worden
- Per-veld reset-icoontje om individueel terug te zetten naar standaard
- Aangepaste waarden krijgen subtiele visuele markering
- Standaardprofielen (klein/middelgroot/groot VO) worden in Phase 1 gedefinieerd

### Claude's Discretion
- Exacte wizard-animaties en transities
- Grid-layout details voor de leerlingaantallen-matrix
- Exacte kaart-design voor modules (schaduw, hoeken, spacing)
- Tooltip-implementatie voor prijsbadges
- Kleurkeuze voor de subtiele markering van aangepaste waarden

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | Gebruiker kan schooltype selecteren (vmbo-b, vmbo-k, vmbo-gt, havo, vwo) | Wizard step 1 with checkbox/toggle group, Zod enum validation |
| PROF-02 | Gebruiker kan leerlingaantal invoeren per leerjaar en per niveau | Wizard step 2 with matrix grid, react-hook-form field arrays |
| PROF-03 | Gebruiker kan relevante modules selecteren | Wizard step 3 with toggle cards, grouped by category |
| PROF-04 | Gebruiker kan scenario kiezen: A of B | Wizard step 4 with radio-style selection |
| DATA-01 | Elke prijs toont bronvermelding | PriceRecord TypeScript type with `source` field and PriceSource enum |
| DATA-02 | Elke prijs toont verificatiedatum met visuele indicator | PriceRecord type with `verifiedAt` date, staleness computed property |
| DATA-03 | Prijzen >6 maanden automatische waarschuwing | Utility function `isPriceStale(verifiedAt, thresholdMonths=6)` |
| DATA-05 | Alle aannames zichtbaar en aanpasbaar | Assumption type with `defaultValue`, `currentValue`, `unit`, `resetToDefault()` |
| DATA-06 | Publicatieprijs als bovengrens-disclaimer | UI disclaimer component, data model `isPublicationPrice` flag |
| UX-03 | Volledig Nederlandstalige interface | All labels, buttons, tooltips in Dutch; no i18n library needed (single language) |
| UX-04 | Cito-huisstijl (Primary #003082, Accent #FF6600, Background #F8F9FA) | Tailwind CSS 4 @theme with custom brand colors |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.4 | UI framework | Locked decision in STATE.md |
| react-dom | 19.2.4 | DOM rendering | Required by React |
| typescript | 5.9.3 | Type safety | Locked decision |
| vite | 8.0.1 | Build tool | Locked decision; 40x faster than CRA |
| tailwindcss | 4.2.2 | CSS framework | Locked decision; CSS-first config in v4 |
| @tailwindcss/vite | latest | Vite plugin for Tailwind | Required for Tailwind CSS 4 + Vite integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.71.2 | Form state management | Wizard form: performant, uncontrolled inputs, per-step validation |
| zod | 4.3.6 | Schema validation | Validate each wizard step before allowing forward navigation |
| @hookform/resolvers | 5.2.2 | Connect zod to react-hook-form | Bridges zod schemas to react-hook-form's resolver API |
| zustand | 5.0.12 | Lightweight state management | Cross-step wizard state, school profile global state |
| recharts | 3.8.0 | Charts (future phases) | Locked decision; install now, use in Phase 2+ |

### Dev/Test
| Library | Version | Purpose |
|---------|---------|---------|
| vitest | 4.1.0 | Unit/integration test runner |
| @testing-library/react | 16.3.2 | Component testing |
| @testing-library/jest-dom | 6.9.1 | DOM matchers |
| @testing-library/user-event | 14.6.1 | User interaction simulation |
| jsdom | 29.0.1 | DOM environment for tests |
| @types/react | 19.2.14 | React type definitions |
| @types/react-dom | latest | ReactDOM type definitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zustand | React Context | Context re-renders entire tree; zustand has selective subscriptions. For a 4-step wizard with shared state, zustand is cleaner |
| react-hook-form | Formik | react-hook-form is faster (uncontrolled), smaller bundle, better DX with TypeScript |
| zod | yup | zod has better TypeScript inference, more active maintenance, native TS-first design |

**Installation:**
```bash
# Scaffold
npm create vite@latest rekentool-vo -- --template react-ts
cd rekentool-vo

# Core
npm install react-hook-form zod @hookform/resolvers zustand recharts

# Tailwind CSS 4
npm install -D tailwindcss @tailwindcss/vite

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # App shell, routing, layout
│   ├── App.tsx
│   ├── Layout.tsx
│   └── routes.tsx
├── components/             # Shared UI components
│   ├── ui/                 # Generic: Button, Card, Badge, Tooltip
│   └── wizard/             # Wizard-specific: ProgressBar, StepContainer
├── features/               # Feature modules
│   └── school-profile/     # Phase 1 feature
│       ├── components/     # WizardStep1, WizardStep2, etc.
│       ├── schemas/        # Zod validation schemas per step
│       ├── store.ts        # Zustand store for school profile
│       └── types.ts        # SchoolProfile, Module, etc.
├── models/                 # Core domain types (shared across features)
│   ├── pricing.ts          # PriceRecord, PriceSource, staleness
│   ├── assumptions.ts      # Assumption, AssumptionSet, defaults
│   ├── school.ts           # SchoolType, SchoolLevel, enums
│   └── modules.ts          # Module definitions, categories
├── engine/                 # Pure TypeScript calculation engine (no React)
│   ├── types.ts            # Engine input/output types
│   └── index.ts            # Engine entry point (placeholder for Phase 2+)
├── data/                   # Static data / defaults
│   ├── default-prices.ts   # Initial pricing data with sources
│   ├── default-assumptions.ts  # Default assumption values
│   └── school-profiles.ts  # klein/midden/groot VO presets
├── lib/                    # Utilities
│   └── date-utils.ts       # Staleness calculations
├── styles/
│   └── index.css           # Tailwind import + @theme + custom styles
└── main.tsx                # Entry point
```

### Pattern 1: Wizard with Per-Step Validation (react-hook-form + zod)
**What:** Each wizard step has its own zod schema. The form validates the current step before allowing navigation forward. A zustand store persists data across steps.
**When to use:** Multi-step form with back/forward navigation and per-step validation.
**Example:**
```typescript
// schemas/step1-schema.ts
import { z } from 'zod';

export const schoolTypeSchema = z.object({
  levels: z.array(z.enum(['vmbo-b', 'vmbo-k', 'vmbo-gt', 'havo', 'vwo']))
    .min(1, 'Selecteer minimaal een niveau'),
});

export type SchoolTypeData = z.infer<typeof schoolTypeSchema>;

// components/WizardStep1.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schoolTypeSchema, type SchoolTypeData } from '../schemas/step1-schema';
import { useSchoolProfileStore } from '../store';

export function WizardStep1({ onNext }: { onNext: () => void }) {
  const { levels } = useSchoolProfileStore();
  const { register, handleSubmit, formState: { errors } } = useForm<SchoolTypeData>({
    resolver: zodResolver(schoolTypeSchema),
    defaultValues: { levels },
  });

  const onSubmit = (data: SchoolTypeData) => {
    useSchoolProfileStore.getState().setLevels(data.levels);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Checkboxes for each level */}
    </form>
  );
}
```

### Pattern 2: Zustand Store for Wizard State
**What:** A zustand store holds the complete school profile across all wizard steps, with actions per step and a reset function.
**When to use:** When wizard state must persist across step navigation and be accessible globally.
**Example:**
```typescript
// store.ts
import { create } from 'zustand';
import type { SchoolLevel, ModuleId, Scenario } from '../../models/school';

interface SchoolProfileState {
  // Step 1
  levels: SchoolLevel[];
  setLevels: (levels: SchoolLevel[]) => void;

  // Step 2
  studentCounts: Record<SchoolLevel, Record<number, number>>; // level -> year -> count
  setStudentCounts: (counts: Record<SchoolLevel, Record<number, number>>) => void;

  // Step 3
  selectedModules: ModuleId[];
  setSelectedModules: (modules: ModuleId[]) => void;

  // Step 4
  scenario: Scenario | null;
  setScenario: (scenario: Scenario) => void;

  // Utilities
  reset: () => void;
  applyPreset: (preset: 'klein' | 'midden' | 'groot') => void;
}
```

### Pattern 3: Tailwind CSS 4 Cito Brand Theme
**What:** Define Cito brand colors using Tailwind CSS 4's `@theme` directive in CSS. No tailwind.config.js needed.
**When to use:** Global theme setup.
**Example:**
```css
/* src/styles/index.css */
@import "tailwindcss";

@theme {
  --color-cito-primary: #003082;
  --color-cito-accent: #FF6600;
  --color-cito-bg: #F8F9FA;
  --color-cito-primary-light: #1a4a9e;
  --color-cito-primary-dark: #002060;
  --color-cito-accent-light: #ff8533;

  /* Status colors for price badges */
  --color-status-verified: #16a34a;
  --color-status-manual: #2563eb;
  --color-status-stale: #ea580c;

  /* Assumption modified indicator */
  --color-modified-bg: #fef3c7;
}
```

This generates utility classes like `bg-cito-primary`, `text-cito-accent`, `bg-status-stale`, etc.

### Pattern 4: Price Record with Staleness
**What:** Each price record carries metadata (source, verification date) and staleness is computed, not stored.
**When to use:** All pricing data throughout the application.
**Example:**
```typescript
// models/pricing.ts
export type PriceSource = 'publication' | 'manual' | 'ai-lookup';

export interface PriceRecord {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij';
  amountPerStudent: number;
  source: PriceSource;
  sourceLabel: string;          // e.g., "Publicatielijst 2025-2026"
  verifiedAt: Date;
  isPublicationPrice: boolean;  // for DATA-06 disclaimer
}

export type PriceStatus = 'verified' | 'manual' | 'stale';

export function getPriceStatus(record: PriceRecord, now = new Date()): PriceStatus {
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  if (record.verifiedAt < sixMonthsAgo) return 'stale';
  if (record.source === 'manual') return 'manual';
  return 'verified';
}

export function getPriceStalenessLabel(record: PriceRecord): string {
  const status = getPriceStatus(record);
  switch (status) {
    case 'verified': return 'Geverifieerd';
    case 'manual': return 'Handmatig';
    case 'stale': return 'Mogelijk verouderd';
  }
}
```

### Pattern 5: Editable Assumptions with Reset
**What:** Each assumption has a default value and current value. Modified assumptions are visually marked and individually resettable.
**When to use:** All configurable parameters (hourly rate, time estimates, etc.).
**Example:**
```typescript
// models/assumptions.ts
export interface Assumption {
  id: string;
  label: string;            // Dutch display name
  description: string;      // Tooltip text
  defaultValue: number;
  currentValue: number;
  unit: string;             // 'euro', 'uren', 'minuten'
  category: string;         // For grouping
}

export function isModified(assumption: Assumption): boolean {
  return assumption.currentValue !== assumption.defaultValue;
}

export function resetToDefault(assumption: Assumption): Assumption {
  return { ...assumption, currentValue: assumption.defaultValue };
}

// Default assumption sets for school size presets
export interface AssumptionPreset {
  name: string;             // 'Klein VO', 'Middelgroot VO', 'Groot VO'
  studentCountRanges: Record<string, number>;  // level -> typical count
  assumptions: Partial<Record<string, number>>; // assumption overrides
}
```

### Anti-Patterns to Avoid
- **Storing computed state:** Do NOT store `isStale` in the price record. Compute it from `verifiedAt` on render. Stored booleans go stale themselves.
- **Prop drilling wizard state:** Do NOT pass wizard data through 4 levels of props. Use the zustand store.
- **tailwind.config.js:** Do NOT create a tailwind.config.js. Tailwind CSS 4 uses `@theme` in CSS.
- **i18n library:** Do NOT install react-intl or i18next. The app is Dutch-only; hardcode Dutch strings directly.
- **Putting calculations in components:** Keep the engine in `src/engine/` as pure functions. Components call engine functions, never compute prices themselves.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | zod schemas + @hookform/resolvers | Declarative, composable, type-safe; per-step validation is trivial |
| Form state management | useState + manual state passing | react-hook-form | Handles dirty tracking, errors, touched, submission state |
| Cross-step state persistence | React Context with reducer | zustand | Less boilerplate, selective re-renders, devtools |
| CSS utility classes | Custom CSS classes for spacing/colors | Tailwind CSS 4 utilities | Consistent design tokens, rapid iteration |
| Date staleness logic | Inline date math in components | Utility function in `lib/date-utils.ts` | Testable, consistent threshold across app |

**Key insight:** The wizard is a form problem, not a routing problem. Use react-hook-form for each step, not React Router with separate pages.

## Common Pitfalls

### Pitfall 1: Tailwind CSS 4 Config Mismatch
**What goes wrong:** Developer creates a `tailwind.config.js` file, which is the Tailwind v3 approach. In v4, this file is ignored by default.
**Why it happens:** Most tutorials online still show v3 patterns.
**How to avoid:** All customization goes in CSS via `@theme` directive. Use `@tailwindcss/vite` plugin, NOT `postcss` + `autoprefixer`.
**Warning signs:** Custom colors not appearing; `tailwind.config.js` exists in project root.

### Pitfall 2: Wizard Step Validation Timing
**What goes wrong:** Form validates all steps at once instead of only the current step, showing errors for steps the user hasn't reached.
**Why it happens:** Single zod schema for entire form, or calling `trigger()` without field names.
**How to avoid:** Each step has its own schema. Use `trigger(['fieldName1', 'fieldName2'])` to validate only current step fields before allowing navigation.
**Warning signs:** Errors appearing for fields on future steps.

### Pitfall 3: Student Count Matrix Complexity
**What goes wrong:** The leerjaar x niveau matrix becomes unmanageable with nested form state.
**Why it happens:** Deeply nested objects in react-hook-form require careful path naming.
**How to avoid:** Use react-hook-form's `useFieldArray` or flat field naming like `students.vmbo-b.1`, `students.vmbo-b.2`. Store as `Record<SchoolLevel, Record<number, number>>` in zustand.
**Warning signs:** Form re-renders on every keystroke; stale values after step navigation.

### Pitfall 4: Stale Closure in Zustand + React
**What goes wrong:** Event handlers capture stale zustand state.
**Why it happens:** React closures capture state at render time.
**How to avoid:** Use `useSchoolProfileStore.getState()` inside callbacks, or use zustand selectors properly: `const levels = useSchoolProfileStore(s => s.levels)`.
**Warning signs:** UI shows old values after state updates.

### Pitfall 5: Missing Vite 8 Node.js Requirement
**What goes wrong:** Build fails or vite crashes.
**Why it happens:** Vite 8 requires Node.js 20.19+ or 22.12+.
**How to avoid:** Verify Node.js version before starting: `node --version`.
**Warning signs:** Cryptic errors about ESM modules or unsupported syntax.

## Code Examples

### Vite Config with Tailwind CSS 4
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### Vitest Config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### Test Setup
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### School Type Enums and Types
```typescript
// models/school.ts
export const SCHOOL_LEVELS = ['vmbo-b', 'vmbo-k', 'vmbo-gt', 'havo', 'vwo'] as const;
export type SchoolLevel = typeof SCHOOL_LEVELS[number];

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  'vmbo-b': 'VMBO Basis',
  'vmbo-k': 'VMBO Kader',
  'vmbo-gt': 'VMBO GT',
  'havo': 'HAVO',
  'vwo': 'VWO',
};

// Leerjaren per niveau
export const YEARS_PER_LEVEL: Record<SchoolLevel, number[]> = {
  'vmbo-b': [1, 2, 3, 4],
  'vmbo-k': [1, 2, 3, 4],
  'vmbo-gt': [1, 2, 3, 4],
  'havo': [1, 2, 3, 4, 5],
  'vwo': [1, 2, 3, 4, 5, 6],
};

export type Scenario = 'A' | 'B';

export const SCENARIO_LABELS: Record<Scenario, { title: string; description: string }> = {
  A: {
    title: 'Cito vs. concurrentie',
    description: 'Vergelijk Cito met DIA en JIJ (IEP) op basis van publicatieprijzen',
  },
  B: {
    title: 'Huidig naar nieuw Cito-platform',
    description: 'Business case voor de overstap naar het nieuwe Cito-platform',
  },
};
```

### Module Definitions
```typescript
// models/modules.ts
export type ModuleCategory = 'leerlingvolgsysteem' | 'overige-instrumenten';

export interface ModuleDefinition {
  id: string;
  name: string;                 // Without "LVS" prefix
  description: string;
  category: ModuleCategory;
  separateLicense: boolean;     // e.g., Cognitieve capaciteitentoets
  differentiator?: string;      // e.g., "Remediering in samenwerking met methodeaanbieders"
}

export const MODULE_CATALOG: ModuleDefinition[] = [
  // Leerlingvolgsysteem
  {
    id: 'rekenwiskunde',
    name: 'Reken-Wiskunde',
    description: 'Volg de reken- en wiskundevaardigheden van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
    differentiator: 'Remediering in samenwerking met methodeaanbieders: gratis en legt de expertise neer waar het hoort',
  },
  {
    id: 'nederlands',
    name: 'Nederlands',
    description: 'Volg de taalvaardigheden Nederlands van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
    differentiator: 'Remediering in samenwerking met methodeaanbieders: gratis en legt de expertise neer waar het hoort',
  },
  {
    id: 'engels',
    name: 'Engels',
    description: 'Volg de Engelse taalvaardigheden van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
  },
  // Overige instrumenten
  {
    id: 'taalverzorging',
    name: 'Taalverzorging Nederlands',
    description: 'Toets spelling en grammatica',
    category: 'overige-instrumenten',
    separateLicense: false,
  },
  {
    id: 'sociaal-emotioneel',
    name: 'Sociaal-emotioneel functioneren',
    description: 'Breng het sociaal-emotioneel functioneren van leerlingen in kaart',
    category: 'overige-instrumenten',
    separateLicense: false,
  },
  {
    id: 'cognitieve-capaciteiten',
    name: 'Cognitieve capaciteitentoets',
    description: 'Meet cognitieve capaciteiten van leerlingen (losse licentie)',
    category: 'overige-instrumenten',
    separateLicense: true,
  },
];

export const MODULE_CATEGORIES: Record<ModuleCategory, string> = {
  'leerlingvolgsysteem': 'Leerlingvolgsysteem',
  'overige-instrumenten': 'Overige instrumenten',
};
```

### School Size Presets
```typescript
// data/school-profiles.ts
import type { SchoolLevel } from '../models/school';

export interface SchoolSizePreset {
  id: 'klein' | 'midden' | 'groot';
  label: string;
  description: string;
  totalStudents: string;         // Range label
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
}

export const SCHOOL_SIZE_PRESETS: SchoolSizePreset[] = [
  {
    id: 'klein',
    label: 'Klein VO',
    description: 'Tot ~500 leerlingen',
    totalStudents: '300-500',
    studentCounts: {
      // Example: small school with havo+vwo
      'havo': { 1: 30, 2: 28, 3: 26, 4: 24, 5: 22 },
      'vwo': { 1: 25, 2: 24, 3: 22, 4: 20, 5: 18, 6: 16 },
    },
  },
  {
    id: 'midden',
    label: 'Middelgroot VO',
    description: '500-1200 leerlingen',
    totalStudents: '500-1200',
    studentCounts: {
      'vmbo-gt': { 1: 50, 2: 48, 3: 45, 4: 42 },
      'havo': { 1: 55, 2: 52, 3: 48, 4: 45, 5: 40 },
      'vwo': { 1: 40, 2: 38, 3: 35, 4: 32, 5: 28, 6: 25 },
    },
  },
  {
    id: 'groot',
    label: 'Groot VO',
    description: '1200+ leerlingen',
    totalStudents: '1200+',
    studentCounts: {
      'vmbo-b': { 1: 40, 2: 38, 3: 35, 4: 30 },
      'vmbo-k': { 1: 45, 2: 42, 3: 40, 4: 35 },
      'vmbo-gt': { 1: 70, 2: 65, 3: 60, 4: 55 },
      'havo': { 1: 80, 2: 75, 3: 70, 4: 65, 5: 55 },
      'vwo': { 1: 60, 2: 55, 3: 50, 4: 48, 5: 42, 6: 38 },
    },
  },
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js (v3) | @theme in CSS (v4) | Tailwind CSS 4.0, Jan 2025 | No JS config file; all customization in CSS |
| PostCSS + autoprefixer | @tailwindcss/vite plugin | Tailwind CSS 4.0 | Simpler setup, faster builds |
| Create React App | Vite with react-ts template | 2023+ | CRA is deprecated; Vite is the standard |
| Formik for forms | react-hook-form | 2022+ | Better performance, smaller bundle, better TS support |
| yup for validation | zod | 2023+ | Better TypeScript inference, TS-first design |
| React Context for global state | zustand | 2023+ | Less boilerplate, selective re-renders |

**Deprecated/outdated:**
- Create React App: officially deprecated, do not use
- tailwind.config.js: Tailwind CSS 4 uses CSS-first config; JS config is legacy compatibility only
- Formik: still works but react-hook-form is the community standard for new projects

## Open Questions

1. **Exact student count defaults for presets**
   - What we know: klein/midden/groot VO categories are defined
   - What's unclear: Real-world typical student counts per level per year for Dutch VO schools
   - Recommendation: Use reasonable estimates (provided in code examples); make easily adjustable in `data/school-profiles.ts`. User can override all values.

2. **Module pricing data for Phase 1**
   - What we know: Price records need source, date, and staleness tracking
   - What's unclear: Whether Phase 1 should ship with placeholder pricing data or empty
   - Recommendation: Define the data model and types in Phase 1. Include a few placeholder records for development/testing. Real pricing data is a Phase 2 concern.

3. **Internal vs. External mode routing**
   - What we know: Decision is "separate URL path, not CSS toggle"
   - What's unclear: Exact URL structure (e.g., `/intern/...` vs `/extern/...`)
   - Recommendation: Set up basic routing in Phase 1 with two paths. Use a simple context or route param to determine mode. Full mode differentiation is Phase 2+.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + React Testing Library 16.3.2 |
| Config file | `vitest.config.ts` -- Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | School levels selection validates at least 1 selected | unit | `npx vitest run src/features/school-profile/__tests__/step1.test.tsx -t "validates"` | Wave 0 |
| PROF-02 | Student count matrix accepts numbers, rejects negatives | unit | `npx vitest run src/features/school-profile/__tests__/step2.test.tsx -t "validates"` | Wave 0 |
| PROF-03 | Module toggle cards select/deselect correctly | unit | `npx vitest run src/features/school-profile/__tests__/step3.test.tsx` | Wave 0 |
| PROF-04 | Scenario A/B selection persists in store | unit | `npx vitest run src/features/school-profile/__tests__/step4.test.tsx` | Wave 0 |
| DATA-01 | PriceRecord has source field, renders badge | unit | `npx vitest run src/models/__tests__/pricing.test.ts` | Wave 0 |
| DATA-02 | Verification date renders correct status indicator | unit | `npx vitest run src/models/__tests__/pricing.test.ts -t "status"` | Wave 0 |
| DATA-03 | Prices >6 months show stale warning | unit | `npx vitest run src/models/__tests__/pricing.test.ts -t "stale"` | Wave 0 |
| DATA-05 | Assumptions editable and resettable to default | unit | `npx vitest run src/models/__tests__/assumptions.test.ts` | Wave 0 |
| DATA-06 | Publication price disclaimer renders | unit | `npx vitest run src/components/__tests__/disclaimer.test.tsx` | Wave 0 |
| UX-03 | All UI text is Dutch | smoke | Manual visual inspection | manual-only: language is hardcoded, not programmatic |
| UX-04 | Cito brand colors applied | smoke | `npx vitest run src/styles/__tests__/theme.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- test framework configuration
- [ ] `src/test/setup.ts` -- test setup with cleanup and jest-dom matchers
- [ ] `src/models/__tests__/pricing.test.ts` -- covers DATA-01, DATA-02, DATA-03
- [ ] `src/models/__tests__/assumptions.test.ts` -- covers DATA-05
- [ ] `src/features/school-profile/__tests__/step1.test.tsx` -- covers PROF-01
- [ ] `src/features/school-profile/__tests__/step2.test.tsx` -- covers PROF-02
- [ ] `src/features/school-profile/__tests__/step3.test.tsx` -- covers PROF-03
- [ ] `src/features/school-profile/__tests__/step4.test.tsx` -- covers PROF-04

## Sources

### Primary (HIGH confidence)
- npm registry -- verified all package versions via `npm view` on 2026-03-20
- [Tailwind CSS v4.0 official blog](https://tailwindcss.com/blog/tailwindcss-v4) -- @theme directive, CSS-first configuration
- [Tailwind CSS theme variables docs](https://tailwindcss.com/docs/theme) -- custom color setup
- [Vite official guide](https://vite.dev/guide/) -- project scaffolding, Node.js requirements
- [React Hook Form advanced usage](https://react-hook-form.com/advanced-usage) -- multi-step form pattern

### Secondary (MEDIUM confidence)
- [LogRocket: multi-step form with react-hook-form and zod](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) -- wizard pattern with per-step validation
- [Vitest + React Testing Library setup guides](https://dev.to/kevinccbsg/react-testing-setup-vitest-typescript-react-testing-library-42c8) -- test configuration patterns

### Tertiary (LOW confidence)
- School size presets (student counts) -- estimated based on general knowledge of Dutch VO schools; should be validated with real data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry, stack is locked in STATE.md
- Architecture: HIGH -- established patterns (react-hook-form + zod wizard, zustand, Tailwind @theme) well-documented
- Pitfalls: HIGH -- Tailwind v3->v4 migration issues and wizard validation timing are well-known
- Domain data (school sizes, module catalog): MEDIUM -- based on CONTEXT.md decisions and general knowledge; exact numbers may need adjustment

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable stack, no fast-moving dependencies)
