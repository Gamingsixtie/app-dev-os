# Phase 21: DMU-Export Upgrade - Research

**Researched:** 2026-03-26
**Domain:** PDF report generation, DMU-targeted content, tag-based filtering
**Confidence:** HIGH

## Summary

Phase 21 upgrades the existing export system with three main capabilities: (1) role-specific introductory text based on editable DMU assumptions, (2) tagged Cito product information and schoolplan opportunities filtered per DMU role, and (3) a PDF cover page with Cito logo. The existing architecture is well-suited for these additions -- `dmu-filters.ts` already handles section reordering per DMU role, `SummarySection` already generates role-specific bullets, and `@react-pdf/renderer` v4.3.2 supports Image components for the cover page logo.

The codebase has rich existing data sources: `differentiators.ts` (per-module per-provider feature lists), `provider-module-content.ts` (detailed product descriptions, USPs, constructs), and `schoolplan-analysis.schema.ts` (opportunities with theme, explanation, quote, relevance). The key new work is: creating `dmu-assumptions.ts` and `cito-product-info.ts` data files with tag annotations, building a shared tag-filter utility, extending ExportConfigPanel with an assumptions editor, and adding a CoverPage component.

**Primary recommendation:** Build tag-based filtering as a shared utility function, extend existing ReportData type to carry assumptions + product info, and keep the cover page as a separate `<Page>` in ReportDocument before the content page.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Elke DMU-rol krijgt een eigen inleidende alinea met aannames over wat die rol belangrijk vindt. Bijv. coordinator: "Als dagelijks gebruiker is tijdwinst het meest relevant." Secties zelf blijven data-gedreven (bestaande reorder + filter logica).
- **D-02:** DMU-aannames zijn bewerkbaar per export-sessie. Defaults komen uit een statisch databestand (dmu-assumptions.ts), maar de gebruiker kan ze tweaken in het ExportConfigPanel bij het genereren van een rapport. Geen opslag per school -- elke export begint met de defaults.
- **D-03:** Bronmateriaal wordt opgeslagen in een statisch TypeScript databestand (bijv. cito-product-info.ts) met per module: productomschrijving, USP's, onderscheidende features.
- **D-04:** Elk voordeel in het databestand krijgt tags (bijv. 'tijdwinst', 'financieel', 'strategisch'). DMU-rolfilter selecteert relevante voordelen op basis van tags. Schaalt goed en is consistent met de rest van het systeem.
- **D-05:** Bronvermeldingen worden opgenomen per stuk productinformatie (bijv. "Bron: Cito Productsheet 2025"). Verhoogt geloofwaardigheid van het rapport.
- **D-06:** Schoolplan-kansen worden per DMU-rol gefilterd op relevantie, met dezelfde tag-structuur als het bronmateriaal. Coordinator ziet dagelijks-gebruik gerelateerde kansen, MT ziet strategische thema's, finance ziet financieel voordelige kansen.
- **D-07:** Als er geen schoolplan beschikbaar is, wordt de sectie overgeslagen met een korte melding in de samenvatting: "Upload een schoolplan voor een nog specifiekere onderbouwing."
- **D-08:** Cover page toevoegen met Cito-logo (geleverd door gebruiker als bestand in src/assets/), schoolnaam, datum en rapporttype. Rest van de huisstijl (kleuren, typografie, structuur) is al voldoende.
- **D-09:** Cover page toont: schoolnaam, datum, DMU-doelgroep, rapporttype. Geen accountmanager-naam.

### Claude's Discretion
- Technische implementatie van het tag-filter systeem (shared utility of per-component)
- Structuur van het dmu-assumptions.ts en cito-product-info.ts databestand
- Layout en design van de cover page binnen de bestaande Cito-huisstijl
- Hoe de bewerkbare aannames UI er in ExportConfigPanel uitziet (accordion, modal, inline edit)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SC-1 | Per DMU-rol rapport genereren met rolspecifieke aannames | D-01, D-02: dmu-assumptions.ts + editable defaults in ExportConfigPanel |
| SC-2 | Rolspecifieke secties: coordinator=tijdwinst, MT=strategisch, finance=euro's | D-04: tag-based filtering on product info items + existing section reorder |
| SC-3 | Schoolplan-tekst automatisch verwerkt per DMU-rol | D-06, D-07: tag-filter on SchoolplanOpportunity + graceful fallback |
| SC-4 | Cito-bronmateriaal als inhoudelijke onderbouwing | D-03, D-05: cito-product-info.ts with source citations |
| SC-5 | Exporteerbaar als PDF met Cito-huisstijl en cover page | D-08, D-09: CoverPage component with Image + existing CITO_COLORS |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-pdf/renderer` | 4.3.2 | PDF generation | Already used for all export PDFs |
| `react` | 19.2.4 | UI framework | Project standard |
| `zustand` | 5.0.12 | State management | Project standard (but NOT used for export config per D-02) |
| `zod` | 4.3.6 | Schema validation | Project standard for all schemas |

### No new dependencies needed
This phase extends existing functionality. All required capabilities are available in the current stack.

## Architecture Patterns

### Recommended File Structure
```
src/
├── data/
│   ├── dmu-assumptions.ts          # NEW: Default assumptions per DMU role
│   └── cito-product-info.ts        # NEW: Tagged product info with sources
├── features/export/
│   ├── types.ts                    # EXTEND: ExportConfig + ReportData
│   ├── ExportTab.tsx               # EXTEND: Pass new data to ReportDocument
│   ├── utils/
│   │   └── dmu-tag-filter.ts       # NEW: Shared tag-based filter utility
│   ├── components/
│   │   └── ExportConfigPanel.tsx   # EXTEND: Add assumptions editor section
│   └── pdf/
│       ├── ReportDocument.tsx      # EXTEND: Add CoverPage + intro text
│       ├── dmu-filters.ts          # EXTEND: Tag-aware filtering
│       ├── components/
│       │   ├── CoverPage.tsx       # NEW: Cover page with logo
│       │   ├── IntroSection.tsx    # NEW: Role-specific intro paragraph
│       │   ├── ProductInfoSection.tsx  # NEW: Tagged product info per section
│       │   └── SchoolplanSection.tsx   # EXTEND: DMU-filtered opportunities
│       └── __tests__/
│           ├── dmu-tag-filter.test.ts  # NEW: Tag filter tests
│           └── dmu-filters.test.ts     # EXTEND: New filter tests
└── assets/
    └── cito-logo.png              # USER-PROVIDED: Cito logo for cover page
```

### Pattern 1: Tag-Based DMU Filtering
**What:** Every product info item and schoolplan opportunity gets tags from a fixed set. A shared filter function selects items relevant to the target DMU role.
**When to use:** Any time content needs to be personalized per DMU audience.
**Example:**
```typescript
// src/features/export/utils/dmu-tag-filter.ts
export type DmuTag = 'tijdwinst' | 'financieel' | 'strategisch' | 'dagelijks-gebruik' | 'kwaliteit' | 'compliance';

export const DMU_TAG_MAP: Record<DmuTarget, DmuTag[]> = {
  coordinator: ['tijdwinst', 'dagelijks-gebruik', 'kwaliteit'],
  mt: ['strategisch', 'kwaliteit', 'compliance'],
  finance: ['financieel', 'tijdwinst'],
  generiek: ['tijdwinst', 'financieel', 'strategisch', 'dagelijks-gebruik', 'kwaliteit', 'compliance'],
};

export function filterByDmuTags<T extends { tags: DmuTag[] }>(
  items: T[],
  dmuTarget: DmuTarget,
): T[] {
  const relevantTags = DMU_TAG_MAP[dmuTarget];
  return items.filter(item => item.tags.some(tag => relevantTags.includes(tag)));
}
```

### Pattern 2: Editable Session-Scoped State (D-02)
**What:** DMU assumptions start from defaults, can be edited per export session, never persist beyond the session.
**When to use:** ExportConfigPanel assumptions editor.
**Example:**
```typescript
// In ExportTab.tsx -- useState for session-scoped editable assumptions
const [assumptions, setAssumptions] = useState<DmuAssumption[]>(
  () => getDefaultAssumptions(config.dmuTarget)
);

// Reset when DMU target changes
useEffect(() => {
  setAssumptions(getDefaultAssumptions(config.dmuTarget));
}, [config.dmuTarget]);
```
This follows the existing pattern in ExportTab.tsx where config is managed via `useState` (not Zustand).

### Pattern 3: CoverPage as Separate Page
**What:** PDF cover page is a full `<Page>` element before the content page, using `@react-pdf/renderer` Image component for the logo.
**When to use:** ReportDocument.tsx wrapping.
**Example:**
```typescript
// CoverPage.tsx
import { Page, View, Text, Image } from '@react-pdf/renderer';
import citoLogo from '@/assets/cito-logo.png';

export function CoverPage({ schoolName, date, dmuTarget, reportType }: CoverPageProps) {
  return (
    <Page size="A4" style={coverStyles.page}>
      <View style={coverStyles.logoContainer}>
        <Image src={citoLogo} style={coverStyles.logo} />
      </View>
      <View style={coverStyles.titleBlock}>
        <Text style={coverStyles.title}>{REPORT_TITLES[reportType]}</Text>
        <Text style={coverStyles.schoolName}>{schoolName}</Text>
        <Text style={coverStyles.meta}>{date}</Text>
        <Text style={coverStyles.meta}>Doelgroep: {DMU_LABELS[dmuTarget]}</Text>
      </View>
    </Page>
  );
}
```

### Pattern 4: Static Data File with Tags and Sources (D-03, D-04, D-05)
**What:** Product info as typed array with tags and source citations, following the existing `src/data/` pattern.
**Example:**
```typescript
// src/data/cito-product-info.ts
export interface CitoProductAdvantage {
  moduleId: string;        // Links to module in selectedModules
  advantage: string;       // Description of the advantage
  context: string;         // Longer explanation for the report
  tags: DmuTag[];          // For DMU filtering
  source: string;          // Citation, e.g. "Cito Productsheet 2025"
}

export const CITO_PRODUCT_ADVANTAGES: CitoProductAdvantage[] = [
  {
    moduleId: 'rekenwiskunde',
    advantage: 'Adaptieve toetsafname past zich aan het niveau van de leerling aan',
    context: 'Door adaptief te toetsen krijgt elke leerling vragen op het juiste niveau...',
    tags: ['dagelijks-gebruik', 'kwaliteit'],
    source: 'Cito Productsheet Leerling in Beeld 2025',
  },
  // ...
];
```

### Anti-Patterns to Avoid
- **Storing assumptions in Zustand/IndexedDB:** D-02 explicitly says no per-school storage. Use `useState` in ExportTab.
- **Inline product text in components:** Keep all product info in `src/data/` per project convention. Components only render, never define content.
- **Modifying existing dmu-filters.ts return type:** Extend it, don't break existing `ReportSections` interface. Add new fields alongside existing ones.
- **Hard-coding intro text per role in JSX:** Put it in the data file (dmu-assumptions.ts) so it's editable per D-02.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom canvas/HTML-to-PDF | `@react-pdf/renderer` (already installed) | Consistent with existing export system |
| Tag filtering | Per-component filter logic | Shared `filterByDmuTags` utility | Reused for product info AND schoolplan opportunities (D-04, D-06) |
| Image in PDF | Base64 inline strings | `@react-pdf/renderer` Image component with static import | Vite handles the asset bundling |

## Common Pitfalls

### Pitfall 1: @react-pdf/renderer Image Path Resolution
**What goes wrong:** Image source path doesn't resolve in the browser-based PDF generation.
**Why it happens:** `@react-pdf/renderer` runs in the browser via dynamic import. Static file paths don't work; you need either a URL or a Vite-resolved import.
**How to avoid:** Import the logo as a module: `import citoLogo from '@/assets/cito-logo.png'`. Vite resolves this to a URL. Pass the resolved URL to `<Image src={citoLogo} />`.
**Warning signs:** Logo renders as broken/empty in generated PDF.

### Pitfall 2: Cover Page Breaking Page Count
**What goes wrong:** Adding a cover page as a separate `<Page>` shifts page numbers. PdfFooter page count becomes wrong.
**Why it happens:** `@react-pdf/renderer` counts all Pages in the Document.
**How to avoid:** The existing PdfFooter already uses `render` prop with `pageNumber` and `totalPages`. Verify it naturally handles the additional page. If not, adjust the render callback.
**Warning signs:** Footer shows "Page 2 of 3" on what should be page 1 of content.

### Pitfall 3: Assumptions State Not Resetting on DMU Change
**What goes wrong:** User selects coordinator, edits assumptions, then switches to MT -- but sees coordinator's edited assumptions.
**Why it happens:** useState doesn't automatically reset when a dependency changes.
**How to avoid:** Use `useEffect` to reset assumptions to defaults when `config.dmuTarget` changes. Or use a key prop pattern on the assumptions editor.
**Warning signs:** Wrong assumptions showing for the selected DMU role.

### Pitfall 4: SchoolplanSection Rendering Empty After Filter
**What goes wrong:** Tag-filtering removes all schoolplan opportunities for a DMU role, but the section header still renders.
**Why it happens:** Filter returns empty array, component renders header but no content.
**How to avoid:** Check `filteredOpportunities.length === 0` and return null (same pattern as current SchoolplanSection).
**Warning signs:** Empty section with just a header in the PDF.

### Pitfall 5: ExportPreview and ReportDocument Diverging
**What goes wrong:** Preview (HTML) shows different content than PDF download.
**Why it happens:** ExportPreview.tsx and ReportDocument.tsx are separate render paths. Adding new sections to one but not the other.
**How to avoid:** Both components use the same `getReportSections()` and `ReportData`. Keep new sections (intro text, product info) in ReportData and render in both.
**Warning signs:** PDF looks different from the on-screen preview.

## Code Examples

### Existing ReportData Extension Point
```typescript
// src/features/export/types.ts — extend with new fields
export interface ReportData {
  // ... existing fields ...
  dmuAssumptions?: DmuAssumption[];       // Editable assumptions for intro text
  productAdvantages?: CitoProductAdvantage[];  // Filtered advantages for this report
  schoolplanOpportunities?: Array<{       // Already exists, extend with tags
    theme: string;
    citoProduct: string;
    explanation: string;
    status: 'open' | 'besproken' | 'niet-relevant';
    tags?: DmuTag[];  // NEW: for DMU filtering
  }>;
}
```

### Existing ExportConfig Extension Point
```typescript
// src/features/export/types.ts — extend config
export interface ExportConfig {
  reportType: ReportType;
  dmuTarget: DmuTarget;
  assumptionOverrides?: Record<string, string>; // NEW: keyed by assumption ID
}
```

### DmuAssumptions Data File Pattern
```typescript
// src/data/dmu-assumptions.ts
export interface DmuAssumption {
  id: string;
  dmuTarget: DmuTarget;
  introText: string;           // Role-specific intro paragraph
  focusAreas: string[];        // What this role cares about
  editable: boolean;           // Whether user can edit this in the panel
}

export const DMU_ASSUMPTIONS: DmuAssumption[] = [
  {
    id: 'coordinator-intro',
    dmuTarget: 'coordinator',
    introText: 'Als dagelijks gebruiker van het toetssysteem is tijdwinst en gebruiksgemak het meest relevant voor u. Dit rapport...',
    focusAreas: ['Tijdwinst in dagelijkse taken', 'Gebruiksvriendelijkheid', 'Integratie met bestaande systemen'],
    editable: true,
  },
  // ... mt, finance, generiek
];
```

### Tag Mapping for Schoolplan Opportunities
```typescript
// Schoolplan opportunities already have: theme, explanation, relevance, moduleId
// Map to DmuTags based on theme keywords or explicit annotation
export function tagSchoolplanOpportunity(opp: SchoolplanOpportunity): DmuTag[] {
  const tags: DmuTag[] = [];
  const text = `${opp.theme} ${opp.explanation}`.toLowerCase();
  if (text.includes('tijd') || text.includes('effici')) tags.push('tijdwinst');
  if (text.includes('kosten') || text.includes('besparing') || text.includes('budget')) tags.push('financieel');
  if (text.includes('visie') || text.includes('strateg') || text.includes('toekomst') || text.includes('beleid')) tags.push('strategisch');
  if (text.includes('docent') || text.includes('gebruik') || text.includes('afname')) tags.push('dagelijks-gebruik');
  if (text.includes('kwaliteit') || text.includes('validatie') || text.includes('betrouwbaar')) tags.push('kwaliteit');
  // Default: if no tags matched, include for all roles
  return tags.length > 0 ? tags : ['tijdwinst', 'financieel', 'strategisch'];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard-coded differentiators in ReportDocument | Data-driven from `differentiators.ts` | Phase 12 | Enables tag-based filtering extension |
| Generic summary for all DMU roles | Role-specific bullets via `getSummaryBullets()` | Phase 12 | Pattern to follow for intro text |
| No schoolplan in export | SchoolplanSection in PDF | Phase 14 | Already integrated, needs DMU filtering |

## Open Questions

1. **Cito logo file availability**
   - What we know: D-08 says user provides it in `src/assets/cito-logo.png`
   - What's unclear: File doesn't exist yet in the repo (`src/assets/` directory is empty/missing)
   - Recommendation: Plan should include a placeholder step and document the requirement for the user to provide the file. Use a text-only cover page as fallback if logo is missing.

2. **Product advantages content completeness**
   - What we know: `provider-module-content.ts` and `differentiators.ts` have rich Cito content per module
   - What's unclear: Whether existing content is sufficient for report-quality prose, or if new content writing is needed
   - Recommendation: Bootstrap `cito-product-info.ts` from existing data files. The tagged advantage entries can reference `provider-module-content.ts` keyFeatures and `differentiators.ts` cito arrays. New prose content may need user review.

3. **Schoolplan opportunity auto-tagging accuracy**
   - What we know: Keyword-based tagging is simple but imprecise
   - What's unclear: Whether the AI-generated schoolplan text consistently contains the right keywords
   - Recommendation: Start with keyword-based tagging (good enough for v1). User can always select "generiek" to see all opportunities. Tag accuracy can be improved later with LLM-based classification.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | vitest implied via vite config |
| Quick run command | `npx vitest run src/features/export/` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-1 | DMU assumptions default + editable | unit | `npx vitest run src/data/__tests__/dmu-assumptions.test.ts -x` | Wave 0 |
| SC-2 | Tag filter selects correct items per role | unit | `npx vitest run src/features/export/utils/__tests__/dmu-tag-filter.test.ts -x` | Wave 0 |
| SC-3 | Schoolplan filtering per DMU + fallback | unit | `npx vitest run src/features/export/pdf/__tests__/dmu-filters.test.ts -x` | Exists (extend) |
| SC-4 | Product info data structure valid + tagged | unit | `npx vitest run src/data/__tests__/cito-product-info.test.ts -x` | Wave 0 |
| SC-5 | Cover page renders with correct fields | unit | `npx vitest run src/features/export/pdf/__tests__/CoverPage.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/features/export/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/export/utils/__tests__/dmu-tag-filter.test.ts` -- covers SC-2
- [ ] `src/data/__tests__/dmu-assumptions.test.ts` -- covers SC-1
- [ ] `src/data/__tests__/cito-product-info.test.ts` -- covers SC-4
- [ ] `src/features/export/pdf/__tests__/CoverPage.test.ts` -- covers SC-5

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/features/export/` -- all files read and analyzed
- Existing codebase: `src/data/differentiators.ts`, `src/data/provider-module-content.ts` -- existing content patterns
- Existing codebase: `src/features/school-profile/schemas/schoolplan-analysis.schema.ts` -- opportunity structure
- `@react-pdf/renderer` v4.3.2 (installed) -- Image component for cover page

### Secondary (MEDIUM confidence)
- [@react-pdf/renderer components docs](https://react-pdf.org/components) -- Image component API

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (labels, tooltips, error messages)
- Code comments and variable names in English
- NEVER modify price data in `src/data/default-prices.ts` without approval
- New components follow existing wizard step patterns
- Forms: react-hook-form + Zod schema
- State via Zustand + persist middleware (but export config uses useState per existing pattern + D-02)
- Tests required for engine changes -- `src/engine/__tests__/`
- Path alias `@` = `/src`
- After every approved change: auto-commit AND push to remote
- Run `npm run build` before finishing -- must pass without errors
- Do not change prices/assumptions/differentiators in `src/data/` without approval

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, everything is already installed
- Architecture: HIGH - clear extension points in existing code, well-understood patterns
- Pitfalls: HIGH - based on direct code analysis of existing export system

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable domain, no external dependency changes expected)
