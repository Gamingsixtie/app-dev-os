# Phase 16: AI Wizard Verbetering & Prijsvergelijking Harmonisatie - Research

**Researched:** 2026-03-25
**Domain:** Multi-step AI wizard, provider variant selection, SSE streaming, Zustand state harmonization
**Confidence:** HIGH

## Summary

Phase 16 replaces the existing one-click `AdvicePanel` with a 3-step AI wizard that enables fair price comparison by letting users select specific competitor variants (DIA packages / JIJ license tiers) per module before AI generates matching advice. The core challenge is threefold: (1) extracting competitor variant information from conversation notes via AI, (2) presenting DIA's 6 packages and JIJ's 4 tiers as selectable options per module with smart defaults, and (3) ensuring the wizard output (variant selection + AI matching) flows into the same Zustand store that the ComparisonTable reads -- single source of truth, no data divergence.

The existing codebase provides strong foundations: SSE streaming via `/api/ai-advice` and `/api/ai-intake`, the `parseSSEChunk` helper, the `WizardShell`/`ProgressBar` UI pattern, and the `DiffView` edit-before-confirm pattern. The provider data structures (`DIA_PACKAGES`, `JIJ_LICENSE_TIERS`, `CITO_BUNDLES`) are already well-typed and centralized in `src/data/providers/`. The main work is composing these existing patterns into a new multi-step wizard component, extending the Zustand store with wizard state, and building a new API endpoint (or extending the existing one) for the wizard-specific AI prompts.

**Primary recommendation:** Build the wizard as a new component tree (`src/features/price-comparison/wizard/`) that replaces `AdvicePanel` in `PriceComparisonPage.tsx`, reusing existing AI streaming infrastructure and provider data, with wizard state stored in the existing `usePriceComparisonStore` (extended with new slices for wizard steps).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** De wizard vervangt de bestaande `AdvicePanel` component -- zelfde plek op de prijsvergelijkingspagina, maar nu met 3 stappen in plaats van een knop
- **D-02:** Drie stappen: (1) Gespreksnotities -> AI extraheert concurrent-varianten, (2) Variant-selectie per module bevestigen/aanpassen, (3) AI matching + resultaat aanpassen + doorvoeren naar tabel
- **D-03:** Lineaire navigatie met stappen-balk (vorige/volgende knoppen + voortgangsindicator bovenaan)
- **D-04:** Wizard is altijd zichtbaar bovenaan de vergelijkingspagina -- gebruiker kan stappen opnieuw doorlopen
- **D-05:** AI-advies (stap 3) is verplicht -- niet overslaan
- **D-06:** Alle concurrenten tegelijk selecteren in stap 2 -- een school kan per module een andere aanbieder hebben
- **D-07:** Pre-fill variant-selectie vanuit bestaande `moduleSetups` (WizardStep4) als startpunt
- **D-08:** AI output in stap 3 via streaming (real-time tekst verschijnt geleidelijk)
- **D-09:** Stap 1 is een tekstveld waar de accountmanager gespreksnotities invoert
- **D-10:** "Niet bekend" knop als er geen gespreksinfo beschikbaar is
- **D-11:** AI markeert wat wel en niet kon worden afgeleid uit de notities
- **D-12:** Per module selecteert de gebruiker welke concurrent en welke specifieke variant
- **D-13:** DIA-pakketten en JIJ-tiers tonen met prijs/leerling en welke modules inbegrepen
- **D-14:** Slimme suggesties: engine berekent meest logische variant op basis van schoolgrootte
- **D-15:** AI genereert volledig gespreksadvies: matching + sterke punten + bezwaren + strategie per DMU
- **D-16:** AI adviseert welke Cito-bundel past bij de geselecteerde concurrent-variant
- **D-17:** Advies moet uitlegbaar zijn richting de school
- **D-18:** Cito wordt goed gepositioneerd maar eerlijk en verdedigbaar
- **D-19:** Gebruiker kan in stap 3 het resultaat handmatig aanpassen voordat het wordt doorgevoerd
- **D-20:** AI gebruikt drie bronnen: provider-data, marktkennis, gebruikersinput
- **D-21:** Gestructureerd extra-context veld in stap 3
- **D-22:** AI neemt differentiators mee
- **D-23:** Wizard-resultaat opgeslagen in Zustand store -> tabel leest dezelfde store -- single source of truth
- **D-24:** Na wizard opnieuw doorlopen: tabel update pas na expliciete bevestiging
- **D-25:** AI-advies leeft alleen binnen de wizard -- tabel toont puur data
- **D-26:** Scenario-detectie: (1) deels concurrent, (2) alles oud-Cito, (3) alles nieuw-Cito

### Claude's Discretion
- UX-design van het gestructureerde extra-context veld
- Exact visueel ontwerp van de stappen-balk en variant-selectie kaarten
- Loading/streaming UX details tijdens AI-generatie
- Hoe de "Niet bekend" markering visueel eruitziet in stap 2
- Hoe de scenario-detectie melding wordt gepresenteerd
- Responsive behavior op tablet

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRIJS-01 | Gebruiker ziet per geselecteerde module de kosten per leerling en totaalkosten per aanbieder naast elkaar | Wizard stap 2 shows variant prices per module; stap 3 result feeds into ComparisonTable which already implements this. Store harmonization (D-23) ensures consistency. |
| PRIJS-03 | Gebruiker kan berekeningsdetails per module uitklappen en ziet de formule en inputs | ComparisonTable + ModuleDetailPanel already implement this. Wizard result must populate the same store data so detail panels show correct variant-specific calculations. |
| PRIJS-05 | Gebruiker ziet per module wat Cito biedt dat de concurrent niet biedt (en omgekeerd) | MODULE_DIFFERENTIATORS data already exists. Wizard stap 3 AI prompt includes differentiators (D-22). ModuleDetailPanel already renders these. |
| PRIJS-06 | Engine berekent correcte DIA-pakketprijzen: als school 3+ DIA-modules afneemt wordt automatisch het voordeligste pakket berekend | DIA calculator (`dia-calculator.ts`) already implements cheapest-package selection. Wizard stap 2 variant selection must feed into the same engine path so package optimization is applied. |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | Component framework | Already in project |
| TypeScript | 5.x | Type safety | Already in project |
| Zustand | 5.x | State management | Already in project, all stores use it |
| @anthropic-ai/sdk | current | AI streaming | Already used for ai-advice and ai-intake endpoints |
| Tailwind CSS | 4.x | Styling | Already in project |
| react-hook-form + Zod | current | Form validation | Project standard per CLAUDE.md |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-router | current | Routing | Already in project, for wizard URL state if needed |
| @tanstack/react-query | current | Server state | Already in project, for cache invalidation |

### Alternatives Considered
No new libraries needed. All functionality can be built with existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/features/price-comparison/
  wizard/
    ComparisonWizard.tsx          # Main wizard shell (3 steps)
    ComparisonWizardProgress.tsx   # Step progress bar (reuses ProgressBar pattern)
    WizardStep1Notes.tsx           # Stap 1: Gespreksnotities textarea + AI extract
    WizardStep2Variants.tsx        # Stap 2: Per-module variant selection cards
    WizardStep3Advice.tsx          # Stap 3: AI matching + result editing + confirm
    VariantCard.tsx                # DIA package / JIJ tier selection card
    ScenarioDetector.tsx           # Scenario detection banner (D-26)
    ExtraContextField.tsx          # Structured extra context input (D-21)
    types.ts                       # Wizard-specific types
    wizard-store.ts                # Wizard state slice (or extend existing store)
  AdvicePanel.tsx                  # REMOVED (replaced by wizard)
```

### Pattern 1: Multi-Step Wizard with Local State
**What:** Wizard manages its own step state internally, only writing to the shared Zustand store on explicit confirmation (D-24).
**When to use:** When wizard needs to collect data across steps before committing.
**Example:**
```typescript
// wizard-store.ts — wizard-specific state, separate from comparison store
interface WizardState {
  currentStep: 0 | 1 | 2;
  // Stap 1 output
  conversationNotes: string;
  aiExtractedVariants: ExtractedVariantSelection[] | null;
  extractionConfidence: Record<string, 'high' | 'low' | 'unknown'>;
  // Stap 2 selections
  variantSelections: ModuleVariantSelection[];
  // Stap 3 output
  aiAdvice: WizardAdviceResult | null;
  adjustedSelections: ModuleVariantSelection[]; // user edits in stap 3
  extraContext: ExtraContextInput;
  // Actions
  setStep: (step: 0 | 1 | 2) => void;
  setVariantSelections: (selections: ModuleVariantSelection[]) => void;
  applyToTable: () => void; // writes to usePriceComparisonStore
}
```

### Pattern 2: SSE Streaming for AI Steps (reuse existing)
**What:** Reuse the existing SSE streaming pattern from `ai-advice.ts` and `ai-intake.ts`.
**When to use:** For both stap 1 (extraction) and stap 3 (advice generation).
**Example:**
```typescript
// Reuse parseSSEChunk from ai-intake.ts
// Stap 1: POST /api/ai-wizard-extract (notes -> variant extraction)
// Stap 3: POST /api/ai-wizard-advice (variants + context -> matching advice)
// Both use same SSE protocol: content_block_delta, message_stop, error
```

### Pattern 3: Single Source of Truth via Zustand (D-23)
**What:** Wizard writes final results to `usePriceComparisonStore` which ComparisonTable already reads.
**When to use:** On explicit "Pas tabel aan" confirmation in stap 3 (D-24).
**Example:**
```typescript
// In wizard-store.ts applyToTable action:
applyToTable: () => {
  const wizardState = get();
  const comparisonStore = usePriceComparisonStore.getState();

  // Update visible providers based on wizard selections
  const providers = extractProvidersFromSelections(wizardState.adjustedSelections);
  comparisonStore.setVisibleProviders(providers);

  // Update Cito bundle type based on AI recommendation
  comparisonStore.setCitoBundleType(wizardState.recommendedCitoBundleType);

  // Trigger recalculation
  comparisonStore.initialize();
}
```

### Pattern 4: Provider Variant Data Access
**What:** Use existing `DIA_PACKAGES`, `JIJ_LICENSE_TIERS`, `CITO_BUNDLES` from provider configs for variant cards.
**When to use:** In stap 2 to display selectable variant options.
**Example:**
```typescript
import { DIA_PACKAGES } from '@/data/providers/dia';
import { JIJ_LICENSE_TIERS } from '@/data/providers/jij';
import { CITO_BUNDLES } from '@/data/providers/cito';

// Smart suggestion (D-14): pick cheapest qualifying DIA package
function suggestDiaPackage(selectedModuleIds: string[]): DiaPackage | null {
  const qualifying = DIA_PACKAGES.filter(pkg =>
    selectedModuleIds.every(id => pkg.includedModuleIds.includes(id))
  );
  return qualifying.sort((a, b) => a.pricePerStudent - b.pricePerStudent)[0] ?? null;
}

// Smart suggestion: pick JIJ tier based on student count
function suggestJijTier(totalStudents: number, testsPerStudent = 2): JijLicenseTier {
  const totalAdmins = totalStudents * testsPerStudent;
  return JIJ_LICENSE_TIERS.find(t =>
    totalAdmins >= t.minAdministrations && totalAdmins <= t.maxAdministrations
  ) ?? JIJ_LICENSE_TIERS[JIJ_LICENSE_TIERS.length - 1];
}
```

### Anti-Patterns to Avoid
- **Duplicating price calculation logic in wizard:** Use the existing engine calculators. The wizard selects variants; the engine calculates prices.
- **Storing AI advice in the comparison store:** Per D-25, AI advice text lives only in wizard state. The table gets pure data (variant selections, prices).
- **Auto-applying wizard results to table:** Per D-24, table updates only after explicit "Pas tabel aan" confirmation. Never auto-sync.
- **Building a new SSE protocol:** Reuse the existing `parseSSEChunk` and the SSE event types (`content_block_delta`, `message_stop`, `error`).
- **Creating new React Context for wizard state:** Per CLAUDE.md, use Zustand + persist middleware. No new Context.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE streaming | Custom streaming parser | Existing `parseSSEChunk` + `streamAdvice` pattern | Already handles edge cases (malformed lines, error events) |
| DIA package optimization | Custom package selection | Existing `dia-calculator.ts` | Already picks cheapest qualifying package |
| JIJ tier calculation | Custom tier logic | Existing `estimateJijCostPerStudent()` in `jij.ts` | Already handles tier selection + cost-per-student |
| Price comparison engine | Custom comparison | Existing `calculateComparison()` with options object | Already supports bundle type + overrides |
| Provider data | Hardcoded prices in wizard | `PROVIDER_CONFIGS` + `DIA_PACKAGES` + `JIJ_LICENSE_TIERS` | Single source of truth, already typed |
| Wizard navigation | Custom step management | Follow `WizardShell` + `ProgressBar` pattern | Proven UX pattern in the project |
| AI text extraction from notes | Custom parsing | Follow `ai-intake.ts` pattern with Zod validation | Proven extraction + validation pipeline |

**Key insight:** This phase is primarily a UI composition task, connecting existing data structures and engine logic through a new multi-step flow. The provider data, calculators, and AI infrastructure already exist -- the wizard is the orchestration layer.

## Common Pitfalls

### Pitfall 1: Wizard State Leaking to Table Prematurely
**What goes wrong:** ComparisonTable updates as user selects variants in stap 2, before they confirm.
**Why it happens:** Writing directly to `usePriceComparisonStore` during wizard interaction.
**How to avoid:** Maintain wizard selections in separate wizard state. Only write to comparison store on explicit "Pas tabel aan" action (D-24).
**Warning signs:** Table flickering during wizard interaction; table showing different data than wizard result.

### Pitfall 2: Mixed Module-Provider Scenarios Not Handled
**What goes wrong:** Wizard assumes one provider per school, but reality is DIA for some modules + JIJ for others.
**Why it happens:** Not supporting per-module provider + variant selection.
**How to avoid:** Data model must be `Array<{ moduleId, provider, variant }>` not `{ provider, variant }`. Each module has independent selection (D-06, D-12).
**Warning signs:** UI only showing one provider dropdown for the whole school.

### Pitfall 3: DIA Package vs. Individual Price Confusion
**What goes wrong:** Showing DIA individual module prices when the school actually buys a package, or vice versa.
**Why it happens:** DIA has both individual modules (EUR 3.36 each) and packages (EUR 5.84-35.58). Most schools buy packages.
**How to avoid:** In stap 2, show DIA packages as primary options with "losse modules" as secondary. Use `suggestDiaPackage()` for smart defaults (D-14).
**Warning signs:** DIA prices in table much lower than competitor feedback suggests.

### Pitfall 4: JIJ Tier Mismatch with School Size
**What goes wrong:** Showing wrong JIJ license tier prices.
**Why it happens:** JIJ pricing depends on total administrations across ALL modules, not per module.
**How to avoid:** Use `estimateJijCostPerStudent()` which considers total students x tests per student to determine tier. When modules change, tier may change too.
**Warning signs:** JIJ showing Tier 4 prices (expensive per-test) for a large school.

### Pitfall 5: AI Prompt Missing Provider-Specific Context
**What goes wrong:** AI generates generic advice instead of variant-specific matching.
**Why it happens:** Not including the selected DIA package / JIJ tier details in the prompt.
**How to avoid:** Stap 3 AI prompt must include: selected variants per module, their prices, what's included, and the recommended Cito bundle with its price. Also include MODULE_DIFFERENTIATORS.
**Warning signs:** AI advice says "DIA is cheaper" without specifying which package or explaining the comparison basis.

### Pitfall 6: Stap 1 AI Extraction Schema Mismatch
**What goes wrong:** AI extracts data in a format the wizard can't parse.
**Why it happens:** No Zod schema validation on extraction output.
**How to avoid:** Define a Zod schema for stap 1 extraction output (similar to `IntakeExtractionSchemaV2`). Use the `parseExtractionFromText` pattern with multiple JSON extraction strategies.
**Warning signs:** Wizard crashes after AI extraction; "Onverwacht formaat" errors.

### Pitfall 7: Scenario Detection Logic Conflicts
**What goes wrong:** Wizard shows comparison flow for a school that uses all-Cito-nieuw.
**Why it happens:** Not checking `moduleSetups` before entering the wizard.
**How to avoid:** Per D-26, check moduleSetups on wizard open: if all providers are 'cito-nieuw', show appropriate message instead of comparison wizard.
**Warning signs:** User confused by wizard for a school that doesn't use competitors.

## Code Examples

### Existing SSE Streaming Pattern (from ai-advice.ts)
```typescript
// Source: src/lib/ai-advice.ts
export async function* streamAdvice(...): AsyncGenerator<string> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/ai-advice', { method: 'POST', headers, body: JSON.stringify(payload) });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const { texts, error } = parseSSEChunk(chunk);
    if (error) throw new Error(error);
    for (const text of texts) yield text;
  }
}
```

### Existing API Endpoint Pattern (from api/ai-advice.ts)
```typescript
// Source: api/ai-advice.ts
// SSE streaming with Anthropic SDK:
const stream = getAnthropic().messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userMessage }],
});
// Convert to SSE ReadableStream with content_block_delta events
```

### Existing DiffView Edit Pattern (from DiffView.tsx)
```typescript
// Source: src/features/school-profile/components/DiffView.tsx
// Mutable copy for inline editing before confirm:
const [editableExtraction, setEditableExtraction] = useState(() => ({
  ...extraction,
  moduleSetups: extraction.moduleSetups.map(ms => ({ ...ms })),
}));
// User edits the copy, then confirms to persist
```

### Provider Variant Data Access
```typescript
// Source: src/data/providers/dia.ts
// DIA_PACKAGES array — 6 packages with includedModuleIds, pricePerStudent
// Source: src/data/providers/jij.ts
// JIJ_LICENSE_TIERS array — 4 tiers with annualFee, pricePerTest, min/maxAdministrations
// Source: src/data/providers/cito.ts
// CITO_BUNDLES array — 3 options (individual, basis, plus) with contractPrices
```

### Store Initialization Pattern
```typescript
// Source: src/features/price-comparison/store.ts
// How wizard should apply results to comparison store:
initialize: () => {
  const annualResult = calculateComparison(selectedModules, studentCounts, {
    citoBundleType: state.citoBundleType,
  });
  // ... apply contract period, compute extended results
  set({ result, diaPackageResult, visibleProviders, ...extended });
}
```

## Key Types to Define

```typescript
// New types needed for wizard
interface ModuleVariantSelection {
  moduleId: string;
  provider: 'dia' | 'jij' | 'geen';
  variant: string | null; // DIA package ID or JIJ tier number
  confidence: 'high' | 'low' | 'unknown'; // from AI extraction
}

interface WizardAdviceResult {
  samenvatting: string;
  matchingUitleg: string; // why this Cito bundle is the fair comparison
  aanbevolenCitoBundel: 'individual' | 'basis' | 'plus';
  adviezen: Array<{
    titel: string;
    tekst: string;
    type: 'prijs' | 'meerwaarde' | 'bezwaar' | 'kans' | 'strategie';
  }>;
  dmuStrategie?: Record<string, string>; // per DMU role
}

interface ExtraContextInput {
  korting?: string;
  dmuFocus?: string;
  bijzonderheden?: string;
}
```

## API Endpoints

### New: `/api/ai-wizard-extract` (Stap 1)
- Input: `{ notes: string }`
- Output (SSE -> JSON): extracted variant selections per module with confidence levels
- Reuse existing SSE pattern from `/api/ai-intake`
- System prompt focused on extracting: which competitor, which variant/package, per module

### Extended: `/api/ai-wizard-advice` (Stap 3)
- Input: `{ variantSelections, schoolProfile, differentiators, extraContext }`
- Output (SSE -> streaming text): full matching advice with Cito bundle recommendation
- System prompt focused on: fair matching, overneembaar advies, Cito positioning
- Model: `claude-sonnet-4-6` (same as existing endpoints)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AdvicePanel one-click | 3-step wizard with variant selection | Phase 16 | Fair comparison requires knowing which competitor variant is being compared |
| Implicit competitor assumption | Explicit per-module variant selection | Phase 16 | Prevents comparing Cito Plus against DIA individual modules (unfair) |
| AI advice disconnected from table | Wizard writes to same Zustand store | Phase 16 | No more discrepancies between advice and table display |

## Open Questions

1. **Stap 1 extraction endpoint -- new or extend existing?**
   - What we know: `/api/ai-intake` already extracts from notes, but outputs IntakeExtractionV2 (full school data). Wizard stap 1 needs a more focused extraction: just competitor variants.
   - Recommendation: Create a new `/api/ai-wizard-extract` endpoint with a focused system prompt. Reusing ai-intake would add unnecessary complexity and the prompt needs to be very different.

2. **Wizard state persistence**
   - What we know: Zustand persist middleware is used for both stores. Wizard state could be persisted or ephemeral.
   - Recommendation: Persist wizard state (including AI advice) so users can close and reopen. Use a separate `useWizardStore` with persist, or extend `usePriceComparisonStore` with a wizard slice. The separate store is cleaner.

3. **How to handle "apply to table" with price overrides**
   - What we know: ComparisonTable already supports overrides via `draftOverrides`/`appliedOverrides` in the store. The wizard selects variants, not individual prices.
   - Recommendation: Wizard "apply to table" should update `citoBundleType`, `visibleProviders`, and `moduleSetups` in the school profile store, then call `initialize()` on the comparison store. This triggers recalculation with the correct DIA package / JIJ tier.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x with jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRIJS-01 | Wizard variant selections populate store -> ComparisonTable reads same data | unit | `npx vitest run src/features/price-comparison/wizard/__tests__/wizard-store.test.ts -x` | Wave 0 |
| PRIJS-03 | ModuleDetailPanel shows correct breakdown for selected variant | unit | `npx vitest run src/features/price-comparison/__tests__/ModuleDetailPanel.test.tsx -x` | Exists |
| PRIJS-05 | Differentiators included in AI prompt and rendered | unit | `npx vitest run src/features/price-comparison/wizard/__tests__/wizard-advice.test.ts -x` | Wave 0 |
| PRIJS-06 | DIA cheapest package selected based on wizard variant selection | unit | `npx vitest run src/engine/__tests__/dia-packages.test.ts -x` | Exists |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/price-comparison/wizard/__tests__/wizard-store.test.ts` -- covers wizard state management, apply-to-table, variant selection logic
- [ ] `src/features/price-comparison/wizard/__tests__/wizard-advice.test.ts` -- covers AI prompt construction, differentiator inclusion
- [ ] `src/features/price-comparison/wizard/__tests__/variant-suggestions.test.ts` -- covers DIA package suggestion, JIJ tier suggestion based on school size
- [ ] `src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts` -- covers D-26 scenario detection logic

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (Nederlands) -- labels, tooltips, error messages
- Code comments and variable names in English
- Never modify price data in `src/data/default-prices.ts` without approval
- New components follow existing wizard step patterns in `src/features/school-profile/components/`
- Forms always use react-hook-form + Zod schema
- State via Zustand + persist middleware -- no new React Context or prop drilling
- Tests required for engine changes -- `src/engine/__tests__/`
- Path alias `@` = `/src`
- AI uses `claude-sonnet-4-6` via `/api/ai-advice` serverless endpoint (model already set in existing endpoints)
- After approved changes: commit AND push to remote automatically
- Run `npm run build` before finishing -- must pass without errors
- Never modify prices, assumptions, or differentiators in `src/data/` without approval

## Sources

### Primary (HIGH confidence)
- Direct code analysis of `src/features/price-comparison/AdvicePanel.tsx` -- component to be replaced
- Direct code analysis of `src/lib/ai-advice.ts` -- SSE streaming pattern and payload structure
- Direct code analysis of `src/lib/ai-intake.ts` -- AI extraction pattern with Zod validation
- Direct code analysis of `src/features/price-comparison/store.ts` -- Zustand store structure
- Direct code analysis of `src/data/providers/dia.ts` -- DIA package definitions (6 packages)
- Direct code analysis of `src/data/providers/jij.ts` -- JIJ tier definitions (4 tiers)
- Direct code analysis of `src/data/providers/cito.ts` -- Cito bundle definitions (3 types)
- Direct code analysis of `api/ai-advice.ts` -- Server-side AI endpoint with SSE streaming
- Direct code analysis of `api/ai-intake.ts` -- Server-side extraction endpoint
- Direct code analysis of `src/components/wizard/WizardShell.tsx` -- Wizard navigation pattern
- Direct code analysis of `src/features/price-comparison/ComparisonTable.tsx` -- Table rendering from store
- Direct code analysis of `src/features/price-comparison/PriceComparisonPage.tsx` -- Integration point

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions (D-01 through D-26) -- user-confirmed design decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new dependencies
- Architecture: HIGH -- patterns directly derived from existing codebase analysis
- Pitfalls: HIGH -- identified from actual data structures and known complexity points

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable project, no external API changes expected)
